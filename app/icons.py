"""Ikon garis (line icons) yang digambar dengan QPainter.

Tidak ada file aset gambar sehingga aplikasi tetap ringan dan ikon otomatis
mengikuti warna tema (dark/light).
"""

from __future__ import annotations

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QIcon, QPainter, QPainterPath, QPen, QPixmap

_CACHE: dict[tuple[str, str, int], QIcon] = {}

ICON_NAMES = (
    "dashboard", "scanner", "explorer", "classifier", "organizer", "sync",
    "duplicates", "history", "settings", "search", "sun", "moon", "menu",
    "plus", "refresh", "play", "stop", "folder", "database", "export",
    "check", "close", "chevron", "sparkle", "shield", "arrow-right",
)


def icon(name: str, color: str, size: int = 20) -> QIcon:
    key = (name, color, size)
    cached = _CACHE.get(key)
    if cached is not None:
        return cached

    ratio = 2
    pixmap = QPixmap(size * ratio, size * ratio)
    pixmap.fill(Qt.transparent)
    pixmap.setDevicePixelRatio(ratio)

    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.Antialiasing, True)
    painter.scale(size / 24.0, size / 24.0)
    _paint(name, painter, QColor(color))
    painter.end()

    result = QIcon(pixmap)
    _CACHE[key] = result
    return result


def _pen(color: QColor, width: float = 1.9) -> QPen:
    pen = QPen(color, width)
    pen.setCapStyle(Qt.RoundCap)
    pen.setJoinStyle(Qt.RoundJoin)
    return pen


def _rounded(painter: QPainter, color: QColor, x, y, w, h, radius=2.0, filled=False):
    path = QPainterPath()
    path.addRoundedRect(QRectF(x, y, w, h), radius, radius)
    if filled:
        painter.fillPath(path, color)
    else:
        painter.drawPath(path)


def _paint(name: str, p: QPainter, color: QColor) -> None:
    if name in {"play", "stop", "sparkle", "check"}:
        p.setPen(Qt.NoPen)
        p.setBrush(color)
    else:
        p.setPen(_pen(color))
        p.setBrush(Qt.NoBrush)

    if name == "dashboard":
        for x, y in ((3.5, 3.5), (13.5, 3.5), (3.5, 13.5), (13.5, 13.5)):
            _rounded(p, color, x, y, 7, 7, 2.0)

    elif name == "scanner":
        # bingkai pemindai dengan garis tengah
        p.drawLine(QPointF(8, 3), QPointF(4.5, 3))
        p.drawLine(QPointF(4.5, 3), QPointF(4.5, 6.5))
        p.drawLine(QPointF(16, 3), QPointF(19.5, 3))
        p.drawLine(QPointF(19.5, 3), QPointF(19.5, 6.5))
        p.drawLine(QPointF(8, 21), QPointF(4.5, 21))
        p.drawLine(QPointF(4.5, 21), QPointF(4.5, 17.5))
        p.drawLine(QPointF(16, 21), QPointF(19.5, 21))
        p.drawLine(QPointF(19.5, 21), QPointF(19.5, 17.5))
        p.drawLine(QPointF(3.5, 12), QPointF(20.5, 12))

    elif name == "explorer":
        p.drawLine(QPointF(8, 6), QPointF(20.5, 6))
        p.drawLine(QPointF(8, 12), QPointF(20.5, 12))
        p.drawLine(QPointF(8, 18), QPointF(20.5, 18))
        p.drawLine(QPointF(3.6, 6), QPointF(3.9, 6))
        p.drawLine(QPointF(3.6, 12), QPointF(3.9, 12))
        p.drawLine(QPointF(3.6, 18), QPointF(3.9, 18))

    elif name == "classifier":
        p.setPen(Qt.NoPen)
        p.setBrush(color)
        star = QPainterPath()
        star.moveTo(10, 2.5)
        star.cubicTo(10.8, 7.2, 12.8, 9.2, 17.5, 10)
        star.cubicTo(12.8, 10.8, 10.8, 12.8, 10, 17.5)
        star.cubicTo(9.2, 12.8, 7.2, 10.8, 2.5, 10)
        star.cubicTo(7.2, 9.2, 9.2, 7.2, 10, 2.5)
        p.fillPath(star, color)
        p.setBrush(QColor(color.red(), color.green(), color.blue(), 170))
        dot = QPainterPath()
        dot.addEllipse(QRectF(15.5, 15.5, 5.5, 5.5))
        p.fillPath(dot, QColor(color.red(), color.green(), color.blue(), 180))

    elif name == "organizer":
        folder = QPainterPath()
        folder.moveTo(3, 7.2)
        folder.lineTo(9.4, 7.2)
        folder.lineTo(11.4, 9.6)
        folder.lineTo(21, 9.6)
        folder.lineTo(21, 19)
        folder.lineTo(3, 19)
        folder.closeSubpath()
        p.drawPath(folder)
        p.drawLine(QPointF(12, 12.4), QPointF(12, 16.2))
        p.drawLine(QPointF(10.1, 14.3), QPointF(13.9, 14.3))

    elif name == "sync":
        p.drawLine(QPointF(4, 9), QPointF(17, 9))
        p.drawLine(QPointF(14, 5.6), QPointF(17.4, 9))
        p.drawLine(QPointF(14, 12.4), QPointF(17.4, 9))
        p.drawLine(QPointF(20, 15), QPointF(7, 15))
        p.drawLine(QPointF(10, 11.6), QPointF(6.6, 15))
        p.drawLine(QPointF(10, 18.4), QPointF(6.6, 15))

    elif name == "duplicates":
        _rounded(p, color, 3, 3, 12.5, 12.5, 3.0)
        _rounded(p, color, 8.5, 8.5, 12.5, 12.5, 3.0)

    elif name == "history":
        p.drawEllipse(QRectF(3, 3, 18, 18))
        p.drawLine(QPointF(12, 7.2), QPointF(12, 12.4))
        p.drawLine(QPointF(12, 12.4), QPointF(15.6, 14.4))

    elif name == "settings":
        p.drawEllipse(QRectF(8.4, 8.4, 7.2, 7.2))
        p.drawEllipse(QRectF(3.6, 3.6, 16.8, 16.8))
        for angle in range(0, 360, 45):
            from math import cos, radians, sin

            rad = radians(angle)
            x1 = 12 + 8.4 * cos(rad)
            y1 = 12 + 8.4 * sin(rad)
            x2 = 12 + 11.0 * cos(rad)
            y2 = 12 + 11.0 * sin(rad)
            p.drawLine(QPointF(x1, y1), QPointF(x2, y2))

    elif name == "search":
        p.drawEllipse(QRectF(4, 4, 12.5, 12.5))
        p.drawLine(QPointF(15.4, 15.4), QPointF(20.5, 20.5))

    elif name == "sun":
        p.drawEllipse(QRectF(8, 8, 8, 8))
        for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0),
                       (-0.7, -0.7), (0.7, -0.7), (-0.7, 0.7), (0.7, 0.7)):
            p.drawLine(
                QPointF(12 + dx * 7.4, 12 + dy * 7.4),
                QPointF(12 + dx * 9.8, 12 + dy * 9.8),
            )

    elif name == "moon":
        outer = QPainterPath()
        outer.addEllipse(QRectF(3.2, 3.2, 17.6, 17.6))
        cut = QPainterPath()
        cut.addEllipse(QRectF(9.5, 1.6, 17.6, 17.6))
        p.setPen(Qt.NoPen)
        p.fillPath(outer.subtracted(cut), color)

    elif name == "menu":
        p.drawLine(QPointF(4, 7), QPointF(20, 7))
        p.drawLine(QPointF(4, 12), QPointF(20, 12))
        p.drawLine(QPointF(4, 17), QPointF(20, 17))

    elif name == "plus":
        p.drawLine(QPointF(12, 5), QPointF(12, 19))
        p.drawLine(QPointF(5, 12), QPointF(19, 12))

    elif name == "refresh":
        path = QPainterPath()
        path.arcMoveTo(QRectF(4, 4, 16, 16), 60)
        path.arcTo(QRectF(4, 4, 16, 16), 60, 290)
        p.drawPath(path)
        p.drawLine(QPointF(16.2, 2.6), QPointF(17.6, 6.6))
        p.drawLine(QPointF(17.6, 6.6), QPointF(13.6, 7.4))

    elif name == "play":
        triangle = QPainterPath()
        triangle.moveTo(7.5, 4.5)
        triangle.lineTo(19.5, 12)
        triangle.lineTo(7.5, 19.5)
        triangle.closeSubpath()
        p.fillPath(triangle, color)

    elif name == "stop":
        _rounded(p, color, 6, 6, 12, 12, 2.6, filled=True)

    elif name == "folder":
        folder = QPainterPath()
        folder.moveTo(3, 7.2)
        folder.lineTo(9.4, 7.2)
        folder.lineTo(11.4, 9.6)
        folder.lineTo(21, 9.6)
        folder.lineTo(21, 19)
        folder.lineTo(3, 19)
        folder.closeSubpath()
        p.drawPath(folder)

    elif name == "database":
        p.drawEllipse(QRectF(4, 3, 16, 5.4))
        p.drawLine(QPointF(4, 5.7), QPointF(4, 18.3))
        p.drawLine(QPointF(20, 5.7), QPointF(20, 18.3))
        path = QPainterPath()
        path.arcMoveTo(QRectF(4, 15.6, 16, 5.4), 180)
        path.arcTo(QRectF(4, 15.6, 16, 5.4), 180, 180)
        p.drawPath(path)
        path2 = QPainterPath()
        path2.arcMoveTo(QRectF(4, 9.8, 16, 5.4), 180)
        path2.arcTo(QRectF(4, 9.8, 16, 5.4), 180, 180)
        p.drawPath(path2)

    elif name == "export":
        p.drawLine(QPointF(12, 15), QPointF(12, 4))
        p.drawLine(QPointF(8, 7.6), QPointF(12, 4))
        p.drawLine(QPointF(16, 7.6), QPointF(12, 4))
        p.drawLine(QPointF(4.5, 13), QPointF(4.5, 20))
        p.drawLine(QPointF(4.5, 20), QPointF(19.5, 20))
        p.drawLine(QPointF(19.5, 20), QPointF(19.5, 13))

    elif name == "check":
        path = QPainterPath()
        path.moveTo(5.5, 12.5)
        path.lineTo(10, 17)
        path.lineTo(18.5, 7)
        p.setPen(_pen(color, 2.4))
        p.setBrush(Qt.NoBrush)
        p.drawPath(path)

    elif name == "close":
        p.drawLine(QPointF(6, 6), QPointF(18, 18))
        p.drawLine(QPointF(18, 6), QPointF(6, 18))

    elif name == "chevron":
        p.drawLine(QPointF(9, 5), QPointF(16, 12))
        p.drawLine(QPointF(16, 12), QPointF(9, 19))

    elif name == "arrow-right":
        p.drawLine(QPointF(4, 12), QPointF(19, 12))
        p.drawLine(QPointF(13, 6), QPointF(19, 12))
        p.drawLine(QPointF(13, 18), QPointF(19, 12))

    elif name == "sparkle":
        star = QPainterPath()
        star.moveTo(12, 2.5)
        star.cubicTo(12.9, 8.1, 15.9, 11.1, 21.5, 12)
        star.cubicTo(15.9, 12.9, 12.9, 15.9, 12, 21.5)
        star.cubicTo(11.1, 15.9, 8.1, 12.9, 2.5, 12)
        star.cubicTo(8.1, 11.1, 11.1, 8.1, 12, 2.5)
        p.fillPath(star, color)

    elif name == "shield":
        shield = QPainterPath()
        shield.moveTo(12, 2.8)
        shield.lineTo(20, 6)
        shield.lineTo(20, 12)
        shield.cubicTo(20, 17, 16.4, 20, 12, 21.4)
        shield.cubicTo(7.6, 20, 4, 17, 4, 12)
        shield.lineTo(4, 6)
        shield.closeSubpath()
        p.drawPath(shield)
