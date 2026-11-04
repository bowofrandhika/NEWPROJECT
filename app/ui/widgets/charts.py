"""Visualisasi data: donut chart penyimpanan dan bar kategori."""

from __future__ import annotations

from PySide6.QtCore import QRectF, Qt
from PySide6.QtGui import QColor, QFont, QPainter, QPen
from PySide6.QtWidgets import QSizePolicy, QWidget

from ...theme import DARK, ThemeTokens
from ...utils import human_count, human_size


class DonutChart(QWidget):
    """Donut chart distribusi ukuran file per kategori."""

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._items: list[dict] = []
        self._theme: ThemeTokens = DARK
        self.setMinimumSize(210, 210)
        self.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)

    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme
        self.update()

    def set_data(self, items: list[dict]) -> None:
        self._items = [item for item in items if int(item.get("size", 0)) > 0]
        self.update()

    def sizeHint(self):  # noqa: N802
        from PySide6.QtCore import QSize

        return QSize(230, 230)

    def paintEvent(self, event) -> None:  # noqa: N802
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing, True)
        theme = self._theme
        painter.fillRect(self.rect(), QColor(theme.surface))

        side = min(self.width(), self.height()) - 12
        if side <= 40:
            painter.end()
            return
        rect = QRectF(
            (self.width() - side) / 2,
            (self.height() - side) / 2,
            side,
            side,
        )
        thickness = max(12.0, side * 0.15)
        inner = rect.adjusted(thickness / 2, thickness / 2, -thickness / 2, -thickness / 2)

        total = sum(int(item["size"]) for item in self._items)
        if total <= 0:
            pen = QPen(QColor(theme.border_strong), thickness)
            pen.setCapStyle(Qt.FlatCap)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)
            painter.drawEllipse(inner)
            painter.setPen(QColor(theme.text_dim))
            font = QFont(self.font())
            font.setPointSizeF(9.5)
            painter.setFont(font)
            painter.drawText(rect, Qt.AlignCenter, "Belum ada data")
            painter.end()
            return

        start_angle = 90 * 16  # mulai dari atas
        gap = 1.6 * 16 if len(self._items) > 1 else 0
        for item in self._items:
            span = -int(round(int(item["size"]) / total * 360 * 16))
            if span == 0:
                continue
            pen = QPen(QColor(item.get("color", theme.accent)), thickness)
            pen.setCapStyle(Qt.FlatCap)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)
            painter.drawArc(inner, start_angle, span + gap if span + gap < 0 else span)
            start_angle += span

        painter.setPen(QColor(theme.text))
        value_font = QFont(self.font())
        value_font.setPointSizeF(15)
        value_font.setWeight(QFont.Bold)
        painter.setFont(value_font)
        text_rect = rect.adjusted(0, -6, 0, -6)
        painter.drawText(text_rect, Qt.AlignCenter, human_size(total))

        painter.setPen(QColor(theme.text_dim))
        hint_font = QFont(self.font())
        hint_font.setPointSizeF(8.5)
        painter.setFont(hint_font)
        painter.drawText(
            rect.adjusted(0, 26, 0, 26), Qt.AlignCenter, f"{human_count(sum(int(i.get('count', 0)) for i in self._items))} file"
        )
        painter.end()


class CategoryBreakdown(QWidget):
    """Daftar kategori dengan bar proporsional terhadap ukuran."""

    ROW_HEIGHT = 34

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._items: list[dict] = []
        self._theme: ThemeTokens = DARK
        self.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
        self.setMinimumHeight(120)

    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme
        self.update()

    def set_data(self, items: list[dict]) -> None:
        self._items = items
        self.setMinimumHeight(max(120, len(items) * self.ROW_HEIGHT + 24))
        self.updateGeometry()
        self.update()

    def sizeHint(self):  # noqa: N802
        from PySide6.QtCore import QSize

        return QSize(320, max(120, len(self._items) * self.ROW_HEIGHT + 24))

    def paintEvent(self, event) -> None:  # noqa: N802
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing, True)
        theme = self._theme
        painter.fillRect(self.rect(), QColor(theme.surface))

        body_font = QFont(self.font())
        body_font.setPointSizeF(9.5)
        small_font = QFont(self.font())
        small_font.setPointSizeF(8.5)

        if not self._items:
            painter.setPen(QColor(theme.text_dim))
            painter.setFont(body_font)
            painter.drawText(self.rect(), Qt.AlignCenter, "Belum ada file terindeks")
            painter.end()
            return

        total_size = max(1, sum(int(item.get("size", 0)) for item in self._items))
        total_count = max(1, sum(int(item.get("count", 0)) for item in self._items))
        width = self.width()

        footer = 20
        available = max(40, self.height() - footer - 2)
        row_height = min(float(self.ROW_HEIGHT), available / len(self._items))

        y = 2.0
        for item in self._items:
            size = int(item.get("size", 0))
            count = int(item.get("count", 0))
            color = QColor(item.get("color", theme.accent))

            painter.setPen(Qt.NoPen)
            painter.setBrush(color)
            painter.drawEllipse(QRectF(0, y + 4, 9, 9))

            painter.setFont(body_font)
            painter.setPen(QColor(theme.text))
            name = str(item.get("label", "Other"))
            painter.drawText(QRectF(18, y, width * 0.45, 18), Qt.AlignVCenter, name)

            painter.setFont(small_font)
            painter.setPen(QColor(theme.text_muted))
            painter.drawText(
                QRectF(width * 0.40, y, width * 0.60 - 2, 18),
                Qt.AlignVCenter | Qt.AlignRight,
                f"{human_count(count)} file  •  {human_size(size)}",
            )

            track = QRectF(18, y + 19, max(10.0, width - 20), 4)
            painter.setPen(Qt.NoPen)
            painter.setBrush(QColor(theme.surface_alt))
            painter.drawRoundedRect(track, 2, 2)
            ratio = size / total_size
            painter.setBrush(color)
            painter.drawRoundedRect(
                QRectF(track.x(), track.y(), max(3.0, track.width() * ratio), 4), 2, 2
            )

            y += row_height

        painter.setFont(small_font)
        painter.setPen(QColor(theme.text_dim))
        painter.drawText(
            QRectF(0, self.height() - 17, self.width(), 15),
            Qt.AlignRight | Qt.AlignVCenter,
            f"{human_count(total_count)} file total",
        )
        painter.end()


class MiniBars(QWidget):
    """Bar chart ringkas untuk 7 aktivitas terakhir (dipakai di dashboard)."""

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._values: list[float] = []
        self._labels: list[str] = []
        self._theme: ThemeTokens = DARK
        self.setMinimumHeight(90)

    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme
        self.update()

    def set_data(self, labels: list[str], values: list[float]) -> None:
        self._labels = labels
        self._values = values
        self.update()

    def paintEvent(self, event) -> None:  # noqa: N802
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing, True)
        theme = self._theme
        painter.fillRect(self.rect(), QColor(theme.surface))
        if not self._values or max(self._values or [0]) <= 0:
            painter.setPen(QColor(theme.text_dim))
            painter.drawText(self.rect(), Qt.AlignCenter, "Belum ada aktivitas pemindaian")
            painter.end()
            return

        count = len(self._values)
        available = self.width() - 8
        gap = 10.0
        bar_width = max(6.0, (available - gap * (count - 1)) / count)
        peak = max(self._values)
        base_y = self.height() - 20

        for index, value in enumerate(self._values):
            height = (value / peak) * (base_y - 12) if peak else 0
            x = 4 + index * (bar_width + gap)
            color = QColor(theme.accent)
            color.setAlpha(230 if index == count - 1 else 120)
            painter.setPen(Qt.NoPen)
            painter.setBrush(color)
            painter.drawRoundedRect(QRectF(x, base_y - height, bar_width, max(3, height)), 4, 4)

            if index < len(self._labels):
                painter.setPen(QColor(theme.text_dim))
                font = QFont(self.font())
                font.setPointSizeF(8)
                painter.setFont(font)
                painter.drawText(
                    QRectF(x - 6, base_y + 3, bar_width + 12, 16),
                    Qt.AlignHCenter,
                    self._labels[index],
                )
        painter.end()
