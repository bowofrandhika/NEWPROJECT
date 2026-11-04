"""Komponen UI dasar yang dipakai ulang di semua halaman."""

from __future__ import annotations

from PySide6.QtCore import QSize, Qt
from PySide6.QtGui import QColor, QPixmap, QPainter
from PySide6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QSizePolicy,
    QVBoxLayout,
    QWidget,
)

from ...icons import icon


def label(text: str, object_name: str = "BodyText", wrap: bool = False) -> QLabel:
    widget = QLabel(text)
    widget.setObjectName(object_name)
    widget.setWordWrap(wrap)
    return widget


def clear_layout(layout) -> None:
    """Kosongkan layout dan langsung lepaskan widget dari tampilan."""
    while layout.count():
        item = layout.takeAt(0)
        widget = item.widget()
        if widget is not None:
            widget.setParent(None)
            widget.deleteLater()
            continue
        child = item.layout()
        if child is not None:
            clear_layout(child)


def divider() -> QFrame:
    line = QFrame()
    line.setObjectName("Divider")
    line.setFixedHeight(1)
    line.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
    return line


def tool_button(name: str, tooltip: str, color: str, size: int = 20) -> QPushButton:
    button = QPushButton()
    button.setObjectName("IconButton")
    button.setIcon(icon(name, color, size))
    button.setIconSize(QSize(size, size))
    button.setToolTip(tooltip)
    button.setCursor(Qt.PointingHandCursor)
    button.setFixedSize(QSize(size + 18, size + 18))
    return button


class Card(QFrame):
    """Kartu permukaan dengan judul opsional dan area isi vertikal."""

    def __init__(
        self,
        title: str = "",
        hint: str = "",
        parent: QWidget | None = None,
        soft: bool = False,
        padding: int = 18,
        spacing: int = 12,
    ) -> None:
        super().__init__(parent)
        self.setObjectName("SoftCard" if soft else "Card")
        root = QVBoxLayout(self)
        root.setContentsMargins(padding, padding, padding, padding)
        root.setSpacing(spacing)

        self.header_widget: QWidget | None = None
        self._header_layout: QHBoxLayout | None = None
        self.title_label: QLabel | None = None

        if title:
            header = QWidget()
            header_layout = QHBoxLayout(header)
            header_layout.setContentsMargins(0, 0, 0, 0)
            header_layout.setSpacing(8)
            self.title_label = label(title, "SectionTitle")
            header_layout.addWidget(self.title_label)
            if hint:
                header_layout.addWidget(label(hint, "SectionHint"))
            header_layout.addStretch(1)
            root.addWidget(header)
            self.header_widget = header
            self._header_layout = header_layout

        self.body = QVBoxLayout()
        self.body.setContentsMargins(0, 0, 0, 0)
        self.body.setSpacing(spacing)
        root.addLayout(self.body, 1)
        self._root = root

    def add_trailing(self, widget: QWidget) -> None:
        if self._header_layout is None:
            return
        self._header_layout.addWidget(widget)

    def add(self, widget: QWidget, stretch: int = 0) -> None:
        self.body.addWidget(widget, stretch)

    def add_layout(self, layout, stretch: int = 0) -> None:
        self.body.addLayout(layout, stretch)


class Pill(QLabel):
    def __init__(self, text: str, kind: str = "Badge", parent: QWidget | None = None) -> None:
        super().__init__(text, parent)
        self.setObjectName({"default": "Badge", "active": "BadgeActive", "planned": "BadgePlanned"}.get(kind, "Badge"))
        self.setAlignment(Qt.AlignCenter)
        self.setSizePolicy(QSizePolicy.Maximum, QSizePolicy.Fixed)


class StatCard(QFrame):
    """Kartu metrik dengan chip ikon berwarna."""

    def __init__(
        self,
        title: str,
        value: str = "0",
        hint: str = "",
        icon_name: str = "dashboard",
        accent: str = "#5B8CFF",
        parent: QWidget | None = None,
    ) -> None:
        super().__init__(parent)
        self.setObjectName("Card")
        self.setMinimumWidth(210)
        self.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)

        root = QHBoxLayout(self)
        root.setContentsMargins(18, 16, 18, 16)
        root.setSpacing(14)

        self._chip = QFrame()
        self._chip.setFixedSize(QSize(40, 40))
        chip_layout = QVBoxLayout(self._chip)
        chip_layout.setContentsMargins(0, 0, 0, 0)
        self._chip_icon = QLabel()
        self._chip_icon.setAlignment(Qt.AlignCenter)
        chip_layout.addWidget(self._chip_icon)

        column = QVBoxLayout()
        column.setContentsMargins(0, 0, 0, 0)
        column.setSpacing(2)
        self._title = label(title, "CardTitle")
        self._value = label(value, "CardValue")
        self._hint = label(hint, "CardHint")
        column.addWidget(self._title)
        column.addWidget(self._value)
        column.addWidget(self._hint)

        root.addWidget(self._chip, 0, Qt.AlignTop)
        root.addLayout(column, 1)

        self._icon_name = icon_name
        self.set_accent(accent)

    def set_accent(self, accent: str) -> None:
        color = QColor(accent)
        self._accent = accent
        self._chip.setStyleSheet(
            f"QFrame {{ background: rgba({color.red()}, {color.green()}, {color.blue()}, 0.14);"
            f" border: 1px solid rgba({color.red()}, {color.green()}, {color.blue()}, 0.32);"
            " border-radius: 11px; }"
        )
        self._chip_icon.setPixmap(icon(self._icon_name, accent, 19).pixmap(19, 19))

    def set_value(self, value: str, hint: str | None = None) -> None:
        self._value.setText(value)
        if hint is not None:
            self._hint.setText(hint)


class MetricBlock(QWidget):
    """Nilai besar dengan keterangan kecil di bawahnya."""

    def __init__(
        self,
        caption: str,
        value: str = "0",
        color: str = "",
        parent: QWidget | None = None,
    ) -> None:
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(1)
        self._value = QLabel(value)
        self._value.setObjectName("SectionTitle")
        if color:
            self._value.setStyleSheet(f"color: {color}; font-size: 15px; font-weight: 700;")
        self._caption = label(caption, "CardTitle")
        layout.addWidget(self._value)
        layout.addWidget(self._caption)

    def set_value(self, value: str) -> None:
        self._value.setText(value)


class InfoRow(QWidget):
    """Baris label kiri / nilai kanan."""

    def __init__(self, key: str, value: str = "", parent: QWidget | None = None) -> None:
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(10)
        self._key = label(key, "Muted")
        self._value = label(value, "StrongText")
        self._value.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
        self._value.setWordWrap(False)
        layout.addWidget(self._key, 1)
        layout.addWidget(self._value)

    def set_value(self, value: str) -> None:
        self._value.setText(value)


class BulletItem(QWidget):
    def __init__(self, text: str, color: str = "#5B8CFF", parent: QWidget | None = None) -> None:
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(9)
        dot = QLabel()
        pixmap = QPixmap(8, 8)
        pixmap.fill(Qt.transparent)
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.Antialiasing, True)
        painter.setPen(Qt.NoPen)
        painter.setBrush(QColor(color))
        painter.drawEllipse(0, 0, 8, 8)
        painter.end()
        dot.setPixmap(pixmap)
        dot.setFixedSize(10, 10)
        body = label(text, "BodyText", wrap=True)
        layout.addWidget(dot, 0, Qt.AlignTop)
        layout.addWidget(body, 1)


class EmptyState(QWidget):
    def __init__(
        self,
        title: str,
        subtitle: str = "",
        icon_name: str = "folder",
        color: str = "#5B8CFF",
        parent: QWidget | None = None,
    ) -> None:
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 32, 20, 32)
        layout.setSpacing(8)
        layout.setAlignment(Qt.AlignCenter)
        glyph = QLabel()
        glyph.setPixmap(icon(icon_name, color, 34).pixmap(34, 34))
        glyph.setAlignment(Qt.AlignCenter)
        heading = label(title, "SectionTitle")
        heading.setAlignment(Qt.AlignCenter)
        layout.addWidget(glyph, 0, Qt.AlignHCenter)
        layout.addWidget(heading, 0, Qt.AlignHCenter)
        if subtitle:
            sub = label(subtitle, "Muted", wrap=True)
            sub.setAlignment(Qt.AlignCenter)
            sub.setMaximumWidth(420)
            layout.addWidget(sub, 0, Qt.AlignHCenter)
