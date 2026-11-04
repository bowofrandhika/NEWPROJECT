"""Settings: tema, folder, opsi pemindaian, dan pemeliharaan database."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QButtonGroup,
    QCheckBox,
    QFileDialog,
    QFrame,
    QHBoxLayout,
    QLineEdit,
    QMessageBox,
    QPushButton,
    QScrollArea,
    QSpinBox,
    QVBoxLayout,
    QWidget,
)

from ...constants import APP_NAME, APP_TAGLINE, APP_VERSION, ROADMAP
from ...database import Database
from ...theme import DARK, ThemeTokens
from ...utils import human_count, human_size, open_in_file_manager, shorten_path
from ..widgets.common import Card, EmptyState, InfoRow, Pill, clear_layout, label


class SettingsPage(QWidget):
    theme_changed = Signal(str)
    data_changed = Signal()

    def __init__(self, db: Database, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.db = db
        self._theme: ThemeTokens = DARK

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

        root.addWidget(self._build_appearance())
        root.addWidget(self._build_folders())
        root.addWidget(self._build_scan_options())
        root.addWidget(self._build_data())
        root.addWidget(self._build_roadmap())
        root.addWidget(self._build_about())
        root.addStretch(1)

        self.refresh()

    # ------------------------------------------------------------------ build
    def _build_appearance(self) -> QWidget:
        card = Card("Tampilan", "Adaptive Interface — dua tema resmi")
        row = QHBoxLayout()
        row.setSpacing(10)

        segmented = QFrame()
        segmented.setObjectName("Segmented")
        seg_layout = QHBoxLayout(segmented)
        seg_layout.setContentsMargins(4, 4, 4, 4)
        seg_layout.setSpacing(4)

        self._seg_group = QButtonGroup(self)
        self._seg_group.setExclusive(True)
        self._dark_button = QPushButton("Dark Mode")
        self._light_button = QPushButton("Light Mode")
        for button, value in ((self._dark_button, "dark"), (self._light_button, "light")):
            button.setObjectName("SegButton")
            button.setCheckable(True)
            button.setCursor(Qt.PointingHandCursor)
            button.clicked.connect(lambda _c=False, target=value: self._choose_theme(target))
            self._seg_group.addButton(button)
            seg_layout.addWidget(button)

        row.addWidget(segmented)
        row.addStretch(1)
        self._theme_note = label("", "Muted")
        row.addWidget(self._theme_note)
        card.add_layout(row)
        return card

    def _build_folders(self) -> QWidget:
        card = Card("Folder Sumber & Tujuan", "dasar untuk scanning dan organisasi")

        buttons = QHBoxLayout()
        add = QPushButton("Tambah folder sumber")
        add.setObjectName("Primary")
        add.setCursor(Qt.PointingHandCursor)
        add.clicked.connect(self._add_root)
        buttons.addWidget(add)
        buttons.addStretch(1)
        card.add_layout(buttons)

        self._roots_holder = QVBoxLayout()
        self._roots_holder.setSpacing(8)
        card.add_layout(self._roots_holder)

        destination_row = QHBoxLayout()
        destination_row.setSpacing(10)
        self._destination = QLineEdit()
        self._destination.setPlaceholderText("Folder tujuan organisasi (opsional)")
        self._destination.editingFinished.connect(self._save_destination)
        browse = QPushButton("Pilih")
        browse.setObjectName("Ghost")
        browse.setCursor(Qt.PointingHandCursor)
        browse.clicked.connect(self._browse_destination)
        destination_row.addWidget(label("Folder tujuan", "Muted"))
        destination_row.addWidget(self._destination, 1)
        destination_row.addWidget(browse)
        card.add_layout(destination_row)
        return card

    def _build_scan_options(self) -> QWidget:
        card = Card("Opsi Pemindaian", "berlaku untuk pemindaian berikutnya")

        self._include_hidden = QCheckBox("Sertakan file dan folder tersembunyi")
        self._skip_system = QCheckBox("Lewati folder sistem (Windows, Program Files, node_modules, dll.)")
        self._follow_links = QCheckBox("Ikuti symbolic link (bisa memperlambat pemindaian)")
        for checkbox, key in (
            (self._include_hidden, "include_hidden"),
            (self._skip_system, "skip_system_dirs"),
            (self._follow_links, "follow_symlinks"),
        ):
            checkbox.toggled.connect(lambda checked, k=key: self._save_bool(k, checked))
            card.add(checkbox)

        size_row = QHBoxLayout()
        size_row.setSpacing(12)
        self._min_size = QSpinBox()
        self._min_size.setRange(0, 1_048_576)
        self._min_size.setSuffix(" KB")
        self._min_size.setMaximumWidth(160)
        self._max_size = QSpinBox()
        self._max_size.setRange(0, 102_400)
        self._max_size.setSuffix(" MB")
        self._max_size.setMaximumWidth(160)
        self._min_size.valueChanged.connect(lambda value: self._save_int("min_size_kb", value))
        self._max_size.valueChanged.connect(lambda value: self._save_int("max_size_mb", value))
        size_row.addWidget(label("Ukuran minimum", "Muted"))
        size_row.addWidget(self._min_size)
        size_row.addSpacing(16)
        size_row.addWidget(label("Ukuran maksimum (0 = tanpa batas)", "Muted"))
        size_row.addWidget(self._max_size)
        size_row.addStretch(1)
        card.add_layout(size_row)

        self._auto_org = QCheckBox("Aktifkan Auto-Organization (tersedia mulai V1.2)")
        self._auto_org.setEnabled(False)
        card.add(self._auto_org)
        card.add(
            label(
                "Auto-organization sengaja dikunci sampai aturan klasifikasi terbukti stabil. "
                "Semua pemindahan file tetap memerlukan persetujuan pengguna.",
                "Dim",
                wrap=True,
            )
        )
        return card

    def _build_data(self) -> QWidget:
        card = Card("Data & Database", "SQLite lokal, tanpa server")
        self._row_db = InfoRow("Lokasi database", "-")
        self._row_files = InfoRow("File terindeks", "0")
        self._row_size = InfoRow("Ukuran database", "0 B")
        for row in (self._row_db, self._row_files, self._row_size):
            card.add(row)

        actions = QHBoxLayout()
        actions.setSpacing(10)
        open_button = QPushButton("Buka folder data")
        open_button.setObjectName("Ghost")
        open_button.setCursor(Qt.PointingHandCursor)
        open_button.clicked.connect(self._open_data_folder)

        reset_button = QPushButton("Reset database")
        reset_button.setObjectName("Danger")
        reset_button.setCursor(Qt.PointingHandCursor)
        reset_button.clicked.connect(self._reset_database)

        actions.addWidget(open_button)
        actions.addWidget(reset_button)
        actions.addStretch(1)
        card.add_layout(actions)
        return card

    def _build_roadmap(self) -> QWidget:
        card = Card("Roadmap", "status pengembangan")
        for item in ROADMAP:
            row = QWidget()
            layout = QHBoxLayout(row)
            layout.setContentsMargins(0, 4, 0, 4)
            layout.setSpacing(10)
            layout.addWidget(
                Pill(item["version"], "active" if item["status"] == "active" else "planned"),
                0,
                Qt.AlignTop,
            )
            column = QVBoxLayout()
            column.setSpacing(1)
            column.addWidget(label(item["title"], "StrongText"))
            column.addWidget(label(item["detail"], "Dim", wrap=True))
            layout.addLayout(column, 1)
            card.add(row)
        card.body.addStretch(1)
        return card

    def _build_about(self) -> QWidget:
        card = Card("Tentang", "informasi aplikasi")
        card.add(label(f"{APP_NAME} v{APP_VERSION}", "StrongText"))
        card.add(label(APP_TAGLINE, "Muted", wrap=True))
        card.add(
            label(
                "Python + PySide6 • SQLite • rule engine lokal. Jalur AI (Ollama & cloud API), "
                "Watchdog, PyMuPDF, OpenPyXL, FFmpeg, dan PyInstaller disiapkan bertahap.",
                "Dim",
                wrap=True,
            )
        )
        return card

    # ------------------------------------------------------------------ state
    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme

    def refresh(self) -> None:
        if self.db.closed:
            return
        theme_name = self.db.get_setting("theme", "dark")
        self._dark_button.setChecked(theme_name != "light")
        self._light_button.setChecked(theme_name == "light")
        self._theme_note.setText(f"Aktif: {self._theme.label}")

        self._fill_roots()

        self._destination.setText(self.db.get_setting("destination_root"))

        widgets = (
            (self._include_hidden, self.db.get_bool("include_hidden")),
            (self._skip_system, self.db.get_bool("skip_system_dirs")),
            (self._follow_links, self.db.get_bool("follow_symlinks")),
        )
        for checkbox, value in widgets:
            checkbox.blockSignals(True)
            checkbox.setChecked(value)
            checkbox.blockSignals(False)

        for spin, value in (
            (self._min_size, self.db.get_int("min_size_kb")),
            (self._max_size, self.db.get_int("max_size_mb")),
        ):
            spin.blockSignals(True)
            spin.setValue(value)
            spin.blockSignals(False)

        self._auto_org.setChecked(self.db.get_bool("auto_organize"))

        self._row_db.set_value(shorten_path(str(self.db.path), 46))
        self._row_db.setToolTip(str(self.db.path))
        self._row_files.set_value(human_count(self.db.file_count()))
        try:
            size = self.db.path.stat().st_size
            wal = Path(str(self.db.path) + "-wal")
            if wal.exists():
                size += wal.stat().st_size
        except OSError:
            size = 0
        self._row_size.set_value(human_size(size))

    def _fill_roots(self) -> None:
        clear_layout(self._roots_holder)

        roots = self.db.list_roots()
        if not roots:
            self._roots_holder.addWidget(
                EmptyState(
                    "Belum ada folder sumber",
                    "Tambahkan folder yang ingin dipantau dan diindeks.",
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
            column = QVBoxLayout()
            column.setSpacing(1)
            title = label(str(record["label"] or record["path"]), "StrongText")
            path = label(str(record["path"]), "Dim")
            path.setToolTip(str(record["path"]))
            meta = label(
                f"{human_count(record['file_count'])} file • {human_size(record['total_size'])}",
                "Muted",
            )
            column.addWidget(title)
            column.addWidget(path)
            column.addWidget(meta)
            remove = QPushButton("Hapus")
            remove.setObjectName("Ghost")
            remove.setCursor(Qt.PointingHandCursor)
            remove.setFixedWidth(74)
            remove.clicked.connect(lambda _c=False, target=record["path"]: self._remove_root(target))
            layout.addLayout(column, 1)
            layout.addWidget(remove)
            self._roots_holder.addWidget(row)

    # ---------------------------------------------------------------- actions
    def _choose_theme(self, name: str) -> None:
        if name == self.db.get_setting("theme"):
            return
        self.db.set_setting("theme", name)
        self.db.log_activity("Tema diperbarui", name, "info")
        self.theme_changed.emit(name)
        self.refresh()

    def _add_root(self) -> None:
        folder = QFileDialog.getExistingDirectory(self, "Pilih folder sumber")
        if not folder:
            return
        if self.db.add_root(folder):
            self.db.log_activity("Folder sumber ditambahkan", Path(folder).name or folder, "info")
            self.data_changed.emit()
        else:
            QMessageBox.information(self, "Folder sudah terdaftar", "Folder tersebut sudah ada dalam daftar.")
        self.refresh()

    def _remove_root(self, path: str) -> None:
        answer = QMessageBox.question(
            self,
            "Hapus folder sumber",
            f"Hapus folder ini dari daftar beserta indeksnya?\n\n{path}\n\nFile asli tidak dihapus.",
        )
        if answer != QMessageBox.Yes:
            return
        self.db.remove_root(path)
        self.db.log_activity("Folder sumber dihapus", Path(path).name or path, "warning")
        self.data_changed.emit()
        self.refresh()

    def _save_destination(self) -> None:
        value = self._destination.text().strip()
        if value == self.db.get_setting("destination_root"):
            return
        self.db.set_setting("destination_root", value)
        self.db.log_activity("Folder tujuan diperbarui", value or "(kosong)", "info")

    def _browse_destination(self) -> None:
        folder = QFileDialog.getExistingDirectory(self, "Pilih folder tujuan")
        if folder:
            self._destination.setText(folder)
            self._save_destination()

    def _save_bool(self, key: str, value: bool) -> None:
        self.db.set_setting(key, value)
        self.db.log_activity("Opsi pemindaian diperbarui", f"{key} = {'ya' if value else 'tidak'}", "info")

    def _save_int(self, key: str, value: int) -> None:
        self.db.set_setting(key, int(value))

    def _open_data_folder(self) -> None:
        if not open_in_file_manager(str(self.db.path.parent)):
            QMessageBox.warning(self, "Tidak dapat membuka folder", str(self.db.path.parent))

    def _reset_database(self) -> None:
        answer = QMessageBox.warning(
            self,
            "Reset database",
            "Semua indeks file, folder sumber, riwayat pemindaian, dan log aktivitas akan "
            "dihapus dari database.\n\nFile asli di disk TIDAK akan terhapus. Lanjutkan?",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No,
        )
        if answer != QMessageBox.Yes:
            return
        self.db.reset()
        self.db.log_activity("Database direset", "indeks dan pengaturan dikembalikan ke default", "danger")
        self.data_changed.emit()
        self.theme_changed.emit(self.db.get_setting("theme", "dark"))
        self.refresh()
