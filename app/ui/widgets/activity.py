"""Feed aktivitas (Activity Log) untuk dashboard dan halaman history."""

from __future__ import annotations

from PySide6.QtCore import Qt
from PySide6.QtWidgets import QHBoxLayout, QLabel, QVBoxLayout, QWidget

from ...theme import DARK, ThemeTokens
from ...utils import time_ago
from .common import label

LEVEL_COLORS = {
    "info": "#5B8CFF",
    "success": "#34D399",
    "warning": "#FBBF24",
    "danger": "#F87171",
}


class ActivityFeed(QWidget):
    def __init__(self, parent: QWidget | None = None, max_items: int = 8) -> None:
        super().__init__(parent)
        self._max_items = max_items
        self._theme: ThemeTokens = DARK
        self._layout = QVBoxLayout(self)
        self._layout.setContentsMargins(0, 0, 0, 0)
        self._layout.setSpacing(0)

    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme

    def set_items(self, items: list[dict]) -> None:
        while self._layout.count():
            item = self._layout.takeAt(0)
            widget = item.widget()
            if widget is not None:
                widget.setParent(None)
                widget.deleteLater()

        if not items:
            empty = label("Belum ada aktivitas. Jalankan pemindaian pertama Anda.", "Muted")
            empty.setAlignment(Qt.AlignCenter)
            empty.setContentsMargins(0, 18, 0, 18)
            self._layout.addWidget(empty)
            return

        for index, record in enumerate(items[: self._max_items]):
            if index:
                line = QWidget()
                line.setFixedHeight(1)
                line.setStyleSheet(f"background: {self._theme.border};")
                self._layout.addWidget(line)
            self._layout.addWidget(self._row(record))

    def _row(self, record: dict) -> QWidget:
        row = QWidget()
        row.setMinimumHeight(44 if record.get("detail") else 32)
        layout = QHBoxLayout(row)
        layout.setContentsMargins(0, 8, 0, 8)
        layout.setSpacing(12)

        color = LEVEL_COLORS.get(str(record.get("level", "info")), self._theme.accent)
        dot = QLabel()
        dot.setFixedSize(9, 9)
        dot.setStyleSheet(f"background: {color}; border-radius: 4px;")
        dot.setToolTip(str(record.get("level", "info")))

        text_column = QVBoxLayout()
        text_column.setContentsMargins(0, 0, 0, 0)
        text_column.setSpacing(1)
        text_column.addWidget(label(str(record.get("action", "")), "StrongText"))
        detail = str(record.get("detail", "") or "")
        if detail:
            detail_label = label(detail, "Muted", wrap=False)
            detail_label.setToolTip(detail)
            text_column.addWidget(detail_label)

        stamp = label(time_ago(str(record.get("created_at", ""))), "Dim")
        stamp.setAlignment(Qt.AlignRight | Qt.AlignTop)

        layout.addWidget(dot, 0, Qt.AlignTop)
        layout.addLayout(text_column, 1)
        layout.addWidget(stamp, 0, Qt.AlignTop)
        return row
