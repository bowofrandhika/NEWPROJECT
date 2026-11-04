"""Membuat ikon aplikasi (PNG & ICO) tanpa dependensi tambahan.

Jalankan: python scripts/generate_icon.py
"""

from __future__ import annotations

import os
from pathlib import Path

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

from PySide6.QtCore import QRectF, Qt  # noqa: E402
from PySide6.QtGui import (  # noqa: E402
    QGuiApplication,
    QColor,
    QFont,
    QImage,
    QLinearGradient,
    QPainter,
    QPainterPath,
)

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"


def render(size: int) -> QImage:
    image = QImage(size, size, QImage.Format_ARGB32)
    image.fill(Qt.transparent)

    painter = QPainter(image)
    painter.setRenderHint(QPainter.Antialiasing, True)

    gradient = QLinearGradient(0, 0, size, size)
    gradient.setColorAt(0.0, QColor("#6C9BFF"))
    gradient.setColorAt(1.0, QColor("#2F5BFF"))

    plate = QPainterPath()
    plate.addRoundedRect(QRectF(0, 0, size, size), size * 0.24, size * 0.24)
    painter.fillPath(plate, gradient)

    # Glyph folder + garis pemindaian
    scale = size / 512.0
    painter.setPen(
        Qt.NoPen
    )
    folder = QPainterPath()
    folder.moveTo(96 * scale, 176 * scale)
    folder.lineTo(214 * scale, 176 * scale)
    folder.lineTo(252 * scale, 222 * scale)
    folder.lineTo(416 * scale, 222 * scale)
    folder.lineTo(416 * scale, 372 * scale)
    folder.lineTo(96 * scale, 372 * scale)
    folder.closeSubpath()
    painter.setBrush(QColor(255, 255, 255, 235))
    painter.fillPath(folder, QColor(255, 255, 255, 235))

    painter.setBrush(QColor("#2F5BFF"))
    painter.drawRoundedRect(QRectF(140 * scale, 268 * scale, 150 * scale, 26 * scale), 13 * scale, 13 * scale)
    painter.drawRoundedRect(QRectF(140 * scale, 312 * scale, 230 * scale, 26 * scale), 13 * scale, 13 * scale)

    painter.setPen(QColor(255, 255, 255, 210))
    font = QFont("DejaVu Sans")
    font.setWeight(QFont.Black)
    font.setPixelSize(int(112 * scale))
    painter.setFont(font)
    painter.drawText(
        QRectF(0, 300 * scale, size, 180 * scale),
        Qt.AlignCenter,
        "SF",
    )
    painter.end()
    return image


def main() -> int:
    application = QGuiApplication.instance() or QGuiApplication([])
    ASSETS.mkdir(parents=True, exist_ok=True)
    image = render(512)
    png_path = ASSETS / "icon.png"
    image.save(str(png_path), "PNG")
    ico_path = ASSETS / "icon.ico"
    saved_ico = image.save(str(ico_path), "ICO")
    print(f"PNG  -> {png_path}")
    if saved_ico:
        print(f"ICO  -> {ico_path}")
    else:
        print("ICO  -> dilewati (plugin ICO tidak tersedia di sistem ini)")
    del application
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
