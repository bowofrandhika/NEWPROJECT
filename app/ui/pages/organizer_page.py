"""Folder Generator: menyusun rencana struktur folder (dry-run)."""

from __future__ import annotations

from PySide6.QtCore import Qt
from PySide6.QtGui import QBrush, QColor
from PySide6.QtWidgets import (
    QAbstractItemView,
    QComboBox,
    QFileDialog,
    QHBoxLayout,
    QHeaderView,
    QLineEdit,
    QMessageBox,
    QPushButton,
    QScrollArea,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from ...constants import CATEGORY_COLORS
from ...database import Database
from ...organizer import TEMPLATES, OrganizationPlan, build_plan, export_plan_csv
from ...theme import DARK, ThemeTokens
from ...utils import human_count, human_size, open_in_file_manager
from ..widgets.common import Card, EmptyState, MetricBlock, Pill, label


class OrganizerPage(QWidget):
    def __init__(self, db: Database, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.db = db
        self._theme: ThemeTokens = DARK
        self._plan: OrganizationPlan | None = None

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

        root.addWidget(self._build_banner())
        root.addWidget(self._build_controls())
        root.addWidget(self._build_preview(), 1)

        self._load_selected_template()
        self.refresh()

    # ------------------------------------------------------------------ build
    def _build_banner(self) -> QWidget:
        banner = Card(soft=True, padding=16)
        banner.setObjectName("Banner")
        layout = QHBoxLayout()
        layout.setSpacing(12)
        text_column = QVBoxLayout()
        text_column.setSpacing(3)
        text_column.addWidget(label("Mode pratinjau (dry-run)", "SectionTitle"))
        text_column.addWidget(
            label(
                "Halaman ini hanya menyusun rencana struktur folder. Tidak ada file yang "
                "dipindahkan, disalin, atau diubah pada V1.0. Eksekusi dengan undo hadir di V1.3.",
                "Muted",
                wrap=True,
            )
        )
        layout.addLayout(text_column, 1)
        pill = Pill("PREVIEW ONLY", "planned")
        layout.addWidget(pill, 0, Qt.AlignTop)
        banner.add_layout(layout)
        return banner

    def _build_controls(self) -> QWidget:
        card = Card("Template Organisasi", "pilih pola folder tujuan")
        grid = QHBoxLayout()
        grid.setSpacing(10)

        self._template = QComboBox()
        for key, meta in TEMPLATES.items():
            self._template.addItem(f"{meta['label']} — {meta['description']}", key)
        self._template.currentIndexChanged.connect(self._on_template_changed)

        self._destination = QLineEdit()
        self._destination.setPlaceholderText("Folder tujuan (mis. D:/Arsip)")
        self._destination.setText(self.db.get_setting("destination_root"))
        self._destination.editingFinished.connect(self._persist_destination)

        browse = QPushButton("Pilih folder")
        browse.setObjectName("Ghost")
        browse.setCursor(Qt.PointingHandCursor)
        browse.clicked.connect(self._browse_destination)

        generate = QPushButton("Buat Pratinjau")
        generate.setObjectName("Primary")
        generate.setCursor(Qt.PointingHandCursor)
        generate.clicked.connect(self.generate_plan)

        grid.addWidget(self._template, 2)
        grid.addWidget(self._destination, 3)
        grid.addWidget(browse)
        grid.addWidget(generate)
        card.add_layout(grid)

        self._example = label("", "Dim")
        card.add(self._example)

        summary = QHBoxLayout()
        summary.setSpacing(28)
        self._row_folders = MetricBlock("Folder rencana", "0")
        self._row_files = MetricBlock("File tercakup", "0")
        self._row_size = MetricBlock("Total ukuran", "0 B")
        summary.addWidget(self._row_folders, 1)
        summary.addWidget(self._row_files, 1)
        summary.addWidget(self._row_size, 1)
        summary.addStretch(1)
        card.add_layout(summary)
        return card

    def _build_preview(self) -> QWidget:
        card = Card("Pratinjau Struktur", "rencana folder per grup file")
        self._export = QPushButton("Ekspor CSV")
        self._export.setObjectName("Ghost")
        self._export.setCursor(Qt.PointingHandCursor)
        self._export.setEnabled(False)
        self._export.clicked.connect(self._export_plan)
        card.add_trailing(self._export)

        self._table = QTableWidget(0, 4)
        self._table.setHorizontalHeaderLabels(["Folder Tujuan", "Kategori", "File", "Ukuran"])
        self._table.verticalHeader().setVisible(False)
        self._table.setShowGrid(False)
        self._table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self._table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self._table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self._table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeToContents)
        self._table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeToContents)
        self._table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeToContents)
        self._table.setMinimumHeight(300)

        self._empty = EmptyState(
            "Belum ada rencana",
            "Jalankan pemindaian, lalu tekan “Buat Pratinjau” untuk melihat usulan struktur folder.",
            "organizer",
            "#5B8CFF",
        )
        card.add(self._table, 1)
        card.add(self._empty)
        self._table.setVisible(False)
        return card

    # ---------------------------------------------------------------- actions
    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme

    def refresh(self) -> None:
        if self.db.closed:
            return
        self._destination.setText(self.db.get_setting("destination_root"))
        self._load_selected_template()

    def _load_selected_template(self) -> None:
        key = self.db.get_setting("organize_template", "category_year")
        index = self._template.findData(key)
        if index >= 0:
            self._template.setCurrentIndex(index)
        self._on_template_changed()

    def _on_template_changed(self) -> None:
        key = self._template.currentData() or "category_year"
        meta = TEMPLATES.get(key, {})
        self._example.setText(f"Contoh hasil: {meta.get('example', '-')}")

    def _persist_destination(self) -> None:
        value = self._destination.text().strip()
        if value != self.db.get_setting("destination_root"):
            self.db.set_setting("destination_root", value)
            self.db.log_activity("Folder tujuan diperbarui", value or "(kosong)", "info")

    def _browse_destination(self) -> None:
        folder = QFileDialog.getExistingDirectory(self, "Pilih folder tujuan")
        if folder:
            self._destination.setText(folder)
            self._persist_destination()

    def generate_plan(self) -> None:
        self._persist_destination()
        template = self._template.currentData() or "category_year"
        destination = self._destination.text().strip()
        if not destination:
            QMessageBox.information(
                self,
                "Folder tujuan belum dipilih",
                "Tentukan folder tujuan terlebih dahulu agar rencana memiliki target yang jelas.",
            )
            return

        files = self.db.all_files_minimal()
        if not files:
            QMessageBox.information(
                self,
                "Belum ada file",
                "Jalankan pemindaian terlebih dahulu agar rencana bisa dibuat.",
            )
            return

        self.db.set_setting("organize_template", template)
        plan = build_plan(files, destination, template)
        self._plan = plan
        self._render_plan(plan)
        self.db.log_activity(
            "Pratinjau folder dibuat",
            f"{len(plan.groups)} folder • {human_count(plan.total_files)} file • template {TEMPLATES[template]['label']}",
            "info",
        )

    def _render_plan(self, plan: OrganizationPlan) -> None:
        self._row_folders.set_value(human_count(len(plan.groups)))
        self._row_files.set_value(human_count(plan.total_files))
        self._row_size.set_value(human_size(plan.total_size))

        self._table.setRowCount(0)
        for row, group in enumerate(plan.groups):
            self._table.insertRow(row)
            path_item = QTableWidgetItem(str(plan.target_for(group)))
            path_item.setToolTip(str(plan.target_for(group)))
            category_item = QTableWidgetItem(group.category)
            category_item.setForeground(
                QBrush(QColor(CATEGORY_COLORS.get(group.category, self._theme.text)))
            )
            files_item = QTableWidgetItem(human_count(group.files))
            files_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            size_item = QTableWidgetItem(human_size(group.size))
            size_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self._table.setItem(row, 0, path_item)
            self._table.setItem(row, 1, category_item)
            self._table.setItem(row, 2, files_item)
            self._table.setItem(row, 3, size_item)

        has_rows = bool(plan.groups)
        self._table.setVisible(has_rows)
        self._empty.setVisible(not has_rows)
        self._export.setEnabled(has_rows)

    def _export_plan(self) -> None:
        if self._plan is None:
            return
        target, _filter = QFileDialog.getSaveFileName(
            self, "Simpan rencana organisasi", "rencana-organisasi.csv", "CSV (*.csv)"
        )
        if not target:
            return
        path = export_plan_csv(self._plan, target)
        self.db.log_activity("Rencana diekspor", str(path), "success")
        answer = QMessageBox.question(
            self,
            "Rencana tersimpan",
            f"Rencana disimpan di:\n{path}\n\nBuka folder penyimpanan?",
        )
        if answer == QMessageBox.Yes:
            open_in_file_manager(str(path.parent))
