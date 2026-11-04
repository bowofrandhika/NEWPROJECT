"""File Explorer: menelusuri indeks folder sumber dan tujuan."""

from __future__ import annotations

import os
from pathlib import Path

from PySide6.QtCore import QTimer, Qt, Signal
from PySide6.QtGui import QAction, QBrush, QColor
from PySide6.QtWidgets import (
    QAbstractItemView,
    QApplication,
    QComboBox,
    QHBoxLayout,
    QHeaderView,
    QLineEdit,
    QMenu,
    QMessageBox,
    QPushButton,
    QSplitter,
    QTableWidget,
    QTableWidgetItem,
    QTreeWidget,
    QTreeWidgetItem,
    QVBoxLayout,
    QWidget,
)

from ...constants import CATEGORY_COLORS, CATEGORY_NAMES
from ...database import Database
from ...theme import DARK, ThemeTokens
from ...utils import format_timestamp, human_count, human_size, open_in_file_manager, open_path
from ..widgets.common import Card, EmptyState, label

ALL_FILES = "__all__"


class ExplorerPage(QWidget):
    data_changed = Signal()

    def __init__(self, db: Database, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.db = db
        self._theme: ThemeTokens = DARK
        self._folder_prefix = ""
        self._limit = 500

        root = QVBoxLayout(self)
        root.setContentsMargins(24, 22, 24, 24)
        root.setSpacing(16)

        root.addWidget(self._build_toolbar())
        root.addWidget(self._build_body(), 1)

        self._search_timer = QTimer(self)
        self._search_timer.setSingleShot(True)
        self._search_timer.setInterval(220)
        self._search_timer.timeout.connect(self.refresh)

    # ------------------------------------------------------------------ build
    def _build_toolbar(self) -> QWidget:
        bar = QWidget()
        layout = QHBoxLayout(bar)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(10)

        self._search = QLineEdit()
        self._search.setPlaceholderText("Cari nama file atau path...")
        self._search.setClearButtonEnabled(True)
        self._search.setMinimumWidth(240)
        self._search.textChanged.connect(lambda _t: self._search_timer.start())

        self._category = QComboBox()
        self._category.addItem("Semua kategori", "")
        for name in CATEGORY_NAMES:
            self._category.addItem(name, name)
        self._category.currentIndexChanged.connect(lambda _i: self.refresh())

        self._count_label = label("0 file", "Muted")

        refresh = QPushButton("Muat ulang")
        refresh.setObjectName("Ghost")
        refresh.setCursor(Qt.PointingHandCursor)
        refresh.clicked.connect(self.refresh)

        layout.addWidget(self._search, 1)
        layout.addWidget(self._category)
        layout.addWidget(self._count_label)
        layout.addWidget(refresh)
        return bar

    def _build_body(self) -> QWidget:
        splitter = QSplitter(Qt.Horizontal)
        splitter.setChildrenCollapsible(False)

        tree_card = Card("Direktori", "indeks folder sumber")
        self._tree = QTreeWidget()
        self._tree.setHeaderHidden(True)
        self._tree.setIndentation(14)
        self._tree.setAnimated(True)
        self._tree.currentItemChanged.connect(self._on_folder_selected)
        tree_card.add(self._tree, 1)
        tree_card.setMinimumWidth(230)
        splitter.addWidget(tree_card)

        table_card = Card("File Terindeks", "klik kanan untuk aksi")
        self._table = QTableWidget(0, 5)
        self._table.setHorizontalHeaderLabels(["Nama", "Kategori", "Ukuran", "Diubah", "Folder"])
        self._table.verticalHeader().setVisible(False)
        self._table.setShowGrid(False)
        self._table.setAlternatingRowColors(False)
        self._table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self._table.setSelectionMode(QAbstractItemView.SingleSelection)
        self._table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self._table.setSortingEnabled(True)
        self._table.setContextMenuPolicy(Qt.CustomContextMenu)
        self._table.customContextMenuRequested.connect(self._show_context_menu)
        self._table.doubleClicked.connect(self._open_selected)
        header = self._table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.Stretch)
        header.setSectionResizeMode(1, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(2, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(3, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(4, QHeaderView.Stretch)
        self._empty = EmptyState(
            "Belum ada file terindeks",
            "Tambahkan folder sumber lalu jalankan pemindaian dari halaman File Scanner.",
            "explorer",
            "#5B8CFF",
        )
        table_card.add(self._table, 1)
        table_card.add(self._empty)
        self._empty.setVisible(False)
        splitter.addWidget(table_card)

        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 3)
        splitter.setSizes([280, 820])
        return splitter

    # ------------------------------------------------------------------ state
    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme
        self.refresh()

    def set_search(self, text: str) -> None:
        self._search.setText(text)
        self.refresh()

    def refresh(self) -> None:
        if self.db.closed:
            return
        self._rebuild_tree()
        self._load_files()

    # ------------------------------------------------------------------- tree
    def _rebuild_tree(self) -> None:
        current = self._tree.currentItem()
        current_path = current.data(0, Qt.UserRole) if current else ALL_FILES

        self._tree.blockSignals(True)
        self._tree.clear()

        roots = [record["path"] for record in self.db.list_roots()]
        folders = self.db.folder_counts(2000)
        totals: dict[str, dict[str, int]] = {}

        for record in folders:
            folder = os.path.normpath(str(record["folder"]))
            matched_root = next(
                (
                    root
                    for root in sorted(roots, key=len, reverse=True)
                    if folder == root or folder.startswith(root + os.sep)
                ),
                None,
            )
            if matched_root is None:
                continue
            cursor = folder
            while True:
                entry = totals.setdefault(cursor, {"count": 0, "size": 0})
                entry["count"] += int(record["count"])
                entry["size"] += int(record["size"])
                if cursor == matched_root:
                    break
                parent = os.path.dirname(cursor)
                if not parent or len(parent) < len(matched_root):
                    break
                cursor = parent

        total_files = self.db.file_count()
        all_item = QTreeWidgetItem([f"Semua file   ({human_count(total_files)})"])
        all_item.setData(0, Qt.UserRole, ALL_FILES)
        self._tree.addTopLevelItem(all_item)

        nodes: dict[str, QTreeWidgetItem] = {}
        for root in roots:
            info = totals.get(root, {"count": 0, "size": 0})
            root_item = QTreeWidgetItem(
                [f"{Path(root).name or root}   ({human_count(info['count'])})"]
            )
            root_item.setData(0, Qt.UserRole, root)
            root_item.setToolTip(0, root)
            self._tree.addTopLevelItem(root_item)
            nodes[root] = root_item

        for folder in sorted(totals):
            if folder in nodes:
                continue
            info = totals[folder]
            parent_path = os.path.dirname(folder)
            parent_item = nodes.get(parent_path)
            if parent_item is None:
                continue
            item = QTreeWidgetItem([f"{os.path.basename(folder)}   ({human_count(info['count'])})"])
            item.setData(0, Qt.UserRole, folder)
            item.setToolTip(0, folder)
            parent_item.addChild(item)
            nodes[folder] = item

        self._tree.expandToDepth(1)
        self._tree.blockSignals(False)

        target = nodes.get(current_path, all_item)
        self._tree.setCurrentItem(target)

    def _on_folder_selected(self, current: QTreeWidgetItem | None, _previous=None) -> None:
        if current is None:
            return
        value = current.data(0, Qt.UserRole)
        self._folder_prefix = "" if value in (ALL_FILES, None) else str(value)
        self._load_files()

    # ------------------------------------------------------------------ table
    def _load_files(self) -> None:
        search = self._search.text().strip()
        category = self._category.currentData() or ""
        rows = self.db.query_files(
            search=search,
            category=category,
            folder_prefix=self._folder_prefix,
            limit=self._limit,
        )
        total = self.db.count_files(
            search=search, category=category, folder_prefix=self._folder_prefix
        )

        self._table.setSortingEnabled(False)
        self._table.setRowCount(0)
        for row_index, record in enumerate(rows):
            self._table.insertRow(row_index)
            name_item = QTableWidgetItem(str(record["name"]))
            name_item.setToolTip(str(record["path"]))
            name_item.setData(Qt.UserRole, str(record["path"]))
            name_item.setIcon(self._file_icon(str(record["category"])))

            category_item = QTableWidgetItem(str(record["category"]))
            category_item.setForeground(
                QBrush(QColor(CATEGORY_COLORS.get(str(record["category"]), self._theme.text)))
            )

            size_item = QTableWidgetItem(human_size(record["size"]))
            size_item.setData(Qt.UserRole, int(record["size"]))
            size_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)

            modified_item = QTableWidgetItem(format_timestamp(record["modified_at"]))
            folder_item = QTableWidgetItem(str(record["folder"]))
            folder_item.setToolTip(str(record["folder"]))

            self._table.setItem(row_index, 0, name_item)
            self._table.setItem(row_index, 1, category_item)
            self._table.setItem(row_index, 2, size_item)
            self._table.setItem(row_index, 3, modified_item)
            self._table.setItem(row_index, 4, folder_item)

        self._table.setSortingEnabled(True)
        has_rows = bool(rows)
        self._table.setVisible(has_rows)
        self._empty.setVisible(not has_rows)

        shown = human_count(len(rows))
        self._count_label.setText(
            f"Menampilkan {shown} dari {human_count(total)} file"
            if total > len(rows)
            else f"{human_count(total)} file"
        )

    def _file_icon(self, category: str):
        from ...icons import icon

        return icon("folder", CATEGORY_COLORS.get(category, self._theme.text_muted), 16)

    # ----------------------------------------------------------------- actions
    def _selected_path(self) -> str | None:
        row = self._table.currentRow()
        if row < 0:
            return None
        item = self._table.item(row, 0)
        if item is None:
            return None
        return item.data(Qt.UserRole)

    def _show_context_menu(self, position) -> None:
        path = self._selected_path()
        if not path:
            return
        menu = QMenu(self)
        open_file = QAction("Buka file", self)
        open_file.triggered.connect(self._open_selected)
        open_folder = QAction("Buka folder", self)
        open_folder.triggered.connect(lambda: self._open_folder(path))
        copy_path = QAction("Salin path", self)
        copy_path.triggered.connect(lambda: self._copy_path(path))
        menu.addAction(open_file)
        menu.addAction(open_folder)
        menu.addSeparator()
        menu.addAction(copy_path)
        menu.exec(self._table.viewport().mapToGlobal(position))

    def _open_selected(self, *_args) -> None:
        path = self._selected_path()
        if path and not open_path(path):
            QMessageBox.warning(self, "File tidak ditemukan", f"Path tidak tersedia:\n{path}")

    def _open_folder(self, path: str) -> None:
        if not open_in_file_manager(str(Path(path).parent)):
            QMessageBox.warning(self, "Folder tidak dapat dibuka", path)

    def _copy_path(self, path: str) -> None:
        QApplication.clipboard().setText(path)
        self._count_label.setText("Path disalin ke clipboard")
