"""Entry point SmartFile Organizer.

Contoh penggunaan:
    python main.py
    python main.py --db "D:/data/smartfile.db" --theme light
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PySide6.QtGui import QFont, QFontDatabase, QIcon
from PySide6.QtWidgets import QApplication

from app.constants import APP_ID, APP_NAME, APP_VERSION
from app.database import Database
from app.theme import get_theme
from app.ui.main_window import MainWindow
from app.utils import default_database_path

PREFERRED_FONTS = ("Inter", "Segoe UI Variable Text", "Segoe UI", "SF Pro Text", "Noto Sans", "DejaVu Sans")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=APP_NAME)
    parser.add_argument("--db", default=None, help="Path file database SQLite")
    parser.add_argument("--theme", choices=("dark", "light"), default=None, help="Tema awal aplikasi")
    parser.add_argument("--reset", action="store_true", help="Kosongkan indeks sebelum aplikasi dibuka")
    parser.add_argument("--version", action="version", version=f"{APP_NAME} {APP_VERSION}")
    return parser.parse_args(argv)


def pick_font() -> QFont:
    families = set(QFontDatabase.families())
    for name in PREFERRED_FONTS:
        if name in families:
            font = QFont(name)
            break
    else:
        font = QFont()
    font.setPointSizeF(9.5)
    return font


def resolve_icon() -> QIcon:
    icon_path = Path(__file__).resolve().parent / "assets" / "icon.png"
    if icon_path.exists():
        return QIcon(str(icon_path))
    return QIcon()


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    application = QApplication(sys.argv[:1])
    application.setApplicationName(APP_NAME)
    application.setApplicationDisplayName(APP_NAME)
    application.setOrganizationName(APP_ID)
    application.setApplicationVersion(APP_VERSION)
    application.setFont(pick_font())
    application.setWindowIcon(resolve_icon())

    db_path = Path(args.db).expanduser() if args.db else default_database_path()
    db = Database(db_path)
    if args.reset:
        db.reset()

    if args.theme:
        db.set_setting("theme", args.theme)

    if db.get_setting("theme") not in ("dark", "light"):
        db.set_setting("theme", get_theme("dark").name)

    if db.file_count() == 0 and not db.recent_activity(1):
        db.log_activity(
            f"{APP_NAME} {APP_VERSION} dijalankan",
            f"database aktif di {db_path.parent}",
            "info",
        )

    window = MainWindow(db)
    window.show()
    return application.exec()


if __name__ == "__main__":
    raise SystemExit(main())
