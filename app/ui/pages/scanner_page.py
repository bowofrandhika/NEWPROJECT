"""File Scanner: pemindaian folder sumber dengan progres real-time."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import QElapsedTimer, Qt, Signal
from PySide6.QtWidgets import (
    QFileDialog,
    QHBoxLayout,
    QLabel,
    QMessageBox,
    QProgressBar,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from ...constants import CATEGORY_COLORS
from ...database import Database
from ...scanner import ScanProgress, ScanWorker, build_options
from ...theme import DARK, ThemeTokens
from ...utils import human_count, human_size, shorten_path
from ..widgets.charts import CategoryBreakdown
from ..widgets.common import Card, EmptyState, InfoRow, clear_layout, label


class ScannerPage(QWidget):
    data_changed = Signal()
    navigate = Signal(str)

    def __init__(self, db: Database, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.db = db
        self._theme: ThemeTokens = DARK
        self._worker: ScanWorker | None = None
        self._scan_id: int | None = None
        self._indexed_total = 0
        self._size_total = 0
        self._skipped_total = 0
        self._elapsed = QElapsedTimer()

        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QScrollArea.NoFrame)
        outer.addWidget(scroll)

        content = QWidget()
        scroll.setWidget(content)
        root = QVBoxLayout(content)
        root.setContentsMargins(24, 22, 24, 24)
        root.setSpacing(16)

        root.addWidget(self._build_command_card())

        columns = QHBoxLayout()
        columns.setSpacing(16)
        columns.addWidget(self._build_roots_card(), 3)
        columns.addWidget(self._build_options_card(), 2)
        root.addLayout(columns)

        root.addWidget(self._build_results_card(), 1)
        root.addStretch(1)

        self.refresh()

    # ------------------------------------------------------------------ build
    def _build_command_card(self) -> QWidget:
        card = Card("Smart Scanner", "pemindaian rekursif dengan klasifikasi rule engine")
        self._status_badge = QLabel("SIAP")
        self._status_badge.setObjectName("Badge")
        card.add_trailing(self._status_badge)

        self._status_text = label("Belum ada pemindaian pada sesi ini.", "SectionTitle")
        self._current_path = label("—", "Monospace")
        self._current_path.setTextInteractionFlags(Qt.TextSelectableByMouse)

        self._progress = QProgressBar()
        self._progress.setRange(0, 100)
        self._progress.setValue(0)
        self._progress.setTextVisible(False)
        self._progress.setFixedHeight(8)

        metrics = QHBoxLayout()
        metrics.setSpacing(24)
        self._metric_scanned = self._metric("Dipindai", "0")
        self._metric_indexed = self._metric("Terindeks", "0")
        self._metric_skipped = self._metric("Dilewati", "0")
        self._metric_size = self._metric("Total ukuran", "0 B")
        self._metric_time = self._metric("Durasi", "0s")
        for metric in (
            self._metric_scanned,
            self._metric_indexed,
            self._metric_skipped,
            self._metric_size,
            self._metric_time,
        ):
            metrics.addWidget(metric, 1)
        metrics.addStretch(1)

        actions = QHBoxLayout()
        actions.setSpacing(10)
        self._start_button = QPushButton("Mulai Pemindaian")
        self._start_button.setObjectName("Primary")
        self._start_button.setCursor(Qt.PointingHandCursor)
        self._start_button.clicked.connect(self.start_scan)

        self._stop_button = QPushButton("Hentikan")
        self._stop_button.setObjectName("Ghost")
        self._stop_button.setCursor(Qt.PointingHandCursor)
        self._stop_button.setEnabled(False)
        self._stop_button.clicked.connect(self.stop_scan)

        self._add_root_button = QPushButton("Tambah Folder")
        self._add_root_button.setObjectName("Ghost")
        self._add_root_button.setCursor(Qt.PointingHandCursor)
        self._add_root_button.clicked.connect(self.add_root_dialog)

        actions.addWidget(self._start_button)
        actions.addWidget(self._stop_button)
        actions.addWidget(self._add_root_button)
        actions.addStretch(1)

        card.add(self._status_text)
        card.add(self._progress)
        card.add(self._current_path)
        card.add_layout(metrics)
        card.add_layout(actions)
        return card

    def _metric(self, caption: str, value: str) -> QWidget:
        holder = QWidget()
        layout = QVBoxLayout(holder)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(1)
        value_label = label(value, "SectionTitle")
        caption_label = label(caption, "CardTitle")
        layout.addWidget(value_label)
        layout.addWidget(caption_label)
        holder._value_label = value_label  # type: ignore[attr-defined]
        return holder

    def _build_roots_card(self) -> QWidget:
        card = Card("Folder Sumber", "root yang akan dipindai")
        self._roots_holder = QVBoxLayout()
        self._roots_holder.setSpacing(8)
        card.add_layout(self._roots_holder)
        card.body.addStretch(1)
        return card

    def _build_options_card(self) -> QWidget:
        card = Card("Opsi Pemindaian", "dapat diubah di Settings")
        self._opt_hidden = InfoRow("Sertakan file tersembunyi", "-")
        self._opt_system = InfoRow("Lewati folder sistem", "-")
        self._opt_min = InfoRow("Ukuran minimum", "-")
        self._opt_max = InfoRow("Ukuran maksimum", "-")
        self._opt_auto = InfoRow("Auto-organization", "-")
        for row in (
            self._opt_hidden,
            self._opt_system,
            self._opt_min,
            self._opt_max,
            self._opt_auto,
        ):
            card.add(row)
        edit = QPushButton("Buka Settings")
        edit.setObjectName("Ghost")
        edit.setCursor(Qt.PointingHandCursor)
        edit.clicked.connect(lambda: self.navigate.emit("settings"))
        card.body.addStretch(1)
        card.add(edit)
        return card

    def _build_results_card(self) -> QWidget:
        card = Card("Hasil Klasifikasi", "distribusi kategori dari database")
        self._results_holder = QVBoxLayout()
        self._results_holder.setSpacing(8)
        card.add_layout(self._results_holder)
        return card

    # ------------------------------------------------------------------ state
    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme
        self.refresh()

    def refresh(self) -> None:
        if self.db.closed:
            return
        self._fill_roots()
        self._fill_options()
        self._fill_results()
        if self._worker is None:
            self._status_badge.setText("SIAP" if self.db.list_roots() else "BELUM ADA FOLDER")
            self._start_button.setEnabled(bool(self.db.list_roots()))

    def _fill_roots(self) -> None:
        clear_layout(self._roots_holder)

        roots = self.db.list_roots()
        if not roots:
            self._roots_holder.addWidget(
                EmptyState(
                    "Belum ada folder sumber",
                    "Tambahkan folder agar SmartFile Organizer bisa mengindeks isinya.",
                    "folder",
                    "#4F8CFF",
                )
            )
            return

        for record in roots:
            row = QWidget()
            layout = QHBoxLayout(row)
            layout.setContentsMargins(0, 0, 0, 0)
            layout.setSpacing(10)
            text_column = QVBoxLayout()
            text_column.setSpacing(1)
            name_label = label(str(record["label"] or record["path"]), "StrongText")
            path_label = label(shorten_path(str(record["path"]), 64), "Dim")
            path_label.setToolTip(str(record["path"]))
            meta = label(
                f"{human_count(record['file_count'])} file • {human_size(record['total_size'])}",
                "Muted",
            )
            text_column.addWidget(name_label)
            text_column.addWidget(path_label)
            text_column.addWidget(meta)

            remove = QPushButton("Hapus")
            remove.setObjectName("Ghost")
            remove.setCursor(Qt.PointingHandCursor)
            remove.setFixedWidth(74)
            remove.clicked.connect(lambda _c=False, path=record["path"]: self.remove_root(path))

            layout.addLayout(text_column, 1)
            layout.addWidget(remove)
            self._roots_holder.addWidget(row)

    def _fill_options(self) -> None:
        options = build_options(self.db)
        self._opt_hidden.set_value("Ya" if options.include_hidden else "Tidak")
        self._opt_system.set_value("Ya" if options.skip_system_dirs else "Tidak")
        self._opt_min.set_value(f"{options.min_size_kb} KB")
        self._opt_max.set_value(
            f"{options.max_size_mb} MB" if options.max_size_mb else "Tanpa batas"
        )
        self._opt_auto.set_value(
            "Aktif (V1.2)" if self.db.get_bool("auto_organize") else "Nonaktif (disarankan)"
        )

    def _fill_results(self) -> None:
        clear_layout(self._results_holder)

        breakdown = self.db.category_breakdown()
        if not breakdown:
            self._results_holder.addWidget(
                EmptyState(
                    "Belum ada hasil",
                    "Jalankan pemindaian untuk melihat distribusi kategori.",
                    "scanner",
                    "#5B8CFF",
                )
            )
            return

        chart = CategoryBreakdown()
        chart.set_theme(self._theme)
        chart.set_data(
            [
                {
                    "label": item["category"],
                    "color": CATEGORY_COLORS.get(item["category"], "#94A3B8"),
                    "count": item["count"],
                    "size": item["size"],
                }
                for item in breakdown
            ]
        )
        self._results_holder.addWidget(chart)

    # ---------------------------------------------------------------- actions
    def add_root_dialog(self) -> None:
        folder = QFileDialog.getExistingDirectory(self, "Pilih folder sumber")
        if not folder:
            return
        if self.db.add_root(folder):
            self.db.log_activity("Folder sumber ditambahkan", Path(folder).name or folder, "info")
            self.data_changed.emit()
        else:
            QMessageBox.information(self, "Folder sudah ada", "Folder tersebut sudah terdaftar.")
        self.refresh()

    def remove_root(self, path: str) -> None:
        answer = QMessageBox.question(
            self,
            "Hapus folder sumber",
            f"Hapus folder berikut beserta indeksnya?\n\n{path}\n\nFile asli tidak akan terhapus.",
        )
        if answer != QMessageBox.Yes:
            return
        self.db.remove_root(path)
        self.db.log_activity("Folder sumber dihapus", Path(path).name or path, "warning")
        self.data_changed.emit()
        self.refresh()

    def start_scan(self) -> None:
        if self._worker is not None:
            return
        roots = [record["path"] for record in self.db.list_roots()]
        if not roots:
            QMessageBox.information(
                self, "Belum ada folder", "Tambahkan folder sumber terlebih dahulu."
            )
            return

        self._scan_id = self.db.start_scan(", ".join(roots))
        self._indexed_total = 0
        self._size_total = 0
        self._skipped_total = 0
        self._elapsed.start()

        worker = ScanWorker(roots, build_options(self.db), self)
        worker.progress.connect(self._on_progress)
        worker.batch.connect(self._on_batch)
        worker.finished_ok.connect(self._on_finished)
        worker.failed.connect(self._on_failed)
        self._worker = worker

        self._status_badge.setText("BERJALAN")
        self._status_text.setText("Memindai folder sumber...")
        self._progress.setRange(0, 0)
        self._start_button.setEnabled(False)
        self._stop_button.setEnabled(True)
        self._add_root_button.setEnabled(False)
        self.db.log_activity("Pemindaian dimulai", f"{len(roots)} folder sumber", "info")
        worker.start()

    def stop_scan(self) -> None:
        if self._worker is None:
            return
        self._worker.request_stop()
        self._status_text.setText("Menghentikan pemindaian...")
        self._stop_button.setEnabled(False)

    def _on_progress(self, state: ScanProgress) -> None:
        self._metric_scanned._value_label.setText(human_count(state.scanned))  # type: ignore[attr-defined]
        self._metric_indexed._value_label.setText(human_count(state.indexed))  # type: ignore[attr-defined]
        self._metric_skipped._value_label.setText(human_count(state.skipped))  # type: ignore[attr-defined]
        self._metric_size._value_label.setText(human_size(state.total_size))  # type: ignore[attr-defined]
        seconds = max(0, self._elapsed.elapsed() // 1000)
        self._metric_time._value_label.setText(  # type: ignore[attr-defined]
            f"{seconds // 60}m {seconds % 60}s" if seconds >= 60 else f"{seconds}s"
        )
        if state.current:
            self._current_path.setText(shorten_path(state.current, 96))

    def _on_batch(self, batch: list) -> None:
        self.db.upsert_files(batch)
        self._indexed_total += len(batch)

    def _on_finished(self, state: ScanProgress) -> None:
        stopped = bool(self._worker and self._worker.stop_requested)
        if self._scan_id is not None:
            self.db.finish_scan(
                self._scan_id,
                state.indexed,
                state.total_size,
                "stopped" if stopped else "completed",
            )
        self.db.log_activity(
            "Pemindaian dihentikan" if stopped else "Pemindaian selesai",
            f"{human_count(state.indexed)} file • {human_size(state.total_size)}",
            "warning" if stopped else "success",
        )
        self._status_badge.setText("DIHENTIKAN" if stopped else "SELESAI")
        self._status_text.setText(
            f"{'Dihentikan' if stopped else 'Selesai'} — {human_count(state.indexed)} file "
            f"terindeks ({human_size(state.total_size)})."
        )
        self._progress.setRange(0, 100)
        self._progress.setValue(100 if not stopped else 0)
        self._worker = None
        self._scan_id = None
        self._start_button.setEnabled(True)
        self._stop_button.setEnabled(False)
        self._add_root_button.setEnabled(True)
        self.data_changed.emit()
        self.refresh()

    def _on_failed(self, message: str) -> None:
        self.db.log_activity("Pemindaian gagal", message[:180], "danger")
        self._worker = None
        self._scan_id = None
        self._progress.setRange(0, 100)
        self._progress.setValue(0)
        self._status_badge.setText("GAGAL")
        self._status_text.setText("Pemindaian gagal.")
        self._start_button.setEnabled(True)
        self._stop_button.setEnabled(False)
        self._add_root_button.setEnabled(True)
        QMessageBox.critical(self, "Pemindaian gagal", message)
        self.refresh()
