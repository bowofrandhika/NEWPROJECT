"""Helper kecil yang dipakai banyak modul."""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path


def utc_now_iso() -> str:
    """Timestamp ISO-8601 UTC tanpa microsecond."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def human_size(num_bytes: float | int | None) -> str:
    """Format ukuran byte menjadi string ringkas (1.4 MB, 12.0 GB, ...)."""
    size = float(num_bytes or 0)
    if size <= 0:
        return "0 B"
    units = ("B", "KB", "MB", "GB", "TB", "PB")
    index = 0
    while size >= 1024 and index < len(units) - 1:
        size /= 1024.0
        index += 1
    if index == 0:
        return f"{int(size)} {units[index]}"
    return f"{size:.1f} {units[index]}"


def human_count(value: int | None) -> str:
    """Format angka dengan pemisah ribuan (12.450)."""
    return f"{int(value or 0):,}".replace(",", ".")


def time_ago(iso_timestamp: str | None) -> str:
    """Ubah timestamp ISO menjadi teks relatif sederhana."""
    if not iso_timestamp:
        return "-"
    try:
        moment = datetime.fromisoformat(iso_timestamp)
    except ValueError:
        return iso_timestamp
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    delta = datetime.now(timezone.utc) - moment
    seconds = int(delta.total_seconds())
    if seconds < 45:
        return "baru saja"
    if seconds < 3600:
        return f"{seconds // 60} menit lalu"
    if seconds < 86400:
        return f"{seconds // 3600} jam lalu"
    if seconds < 86400 * 30:
        return f"{seconds // 86400} hari lalu"
    return moment.astimezone().strftime("%d %b %Y")


def format_timestamp(iso_timestamp: str | None) -> str:
    if not iso_timestamp:
        return "-"
    try:
        moment = datetime.fromisoformat(iso_timestamp)
    except ValueError:
        return iso_timestamp
    if moment.tzinfo is not None:
        moment = moment.astimezone()
    return moment.strftime("%d %b %Y %H:%M")


def app_data_dir() -> Path:
    """Folder data aplikasi yang mengikuti konvensi tiap OS."""
    override = os.environ.get("SMARTFILE_DATA_DIR")
    if override:
        path = Path(override).expanduser()
        path.mkdir(parents=True, exist_ok=True)
        return path

    if sys.platform.startswith("win"):
        base = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming"))
        path = base / "SmartFileOrganizer"
    elif sys.platform == "darwin":
        path = Path.home() / "Library" / "Application Support" / "SmartFileOrganizer"
    else:
        base = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))
        path = base / "smartfile-organizer"
    path.mkdir(parents=True, exist_ok=True)
    return path


def default_database_path() -> Path:
    return app_data_dir() / "smartfile.db"


def is_hidden(path: str, name: str | None = None) -> bool:
    """Deteksi file/folder tersembunyi lintas platform."""
    label = name if name is not None else os.path.basename(path)
    if label.startswith("."):
        return True
    if sys.platform.startswith("win"):
        try:
            import ctypes

            attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
            if attrs != -1 and attrs & 0x2:  # FILE_ATTRIBUTE_HIDDEN
                return True
        except Exception:  # pragma: no cover - hanya relevan di Windows
            return False
    return False


def shorten_path(path: str, max_length: int = 58) -> str:
    if len(path) <= max_length:
        return path
    keep = max_length - 3
    head = path[: keep // 2]
    tail = path[-(keep - keep // 2):]
    return f"{head}...{tail}"


def open_in_file_manager(folder: str) -> bool:
    """Buka folder di file manager bawaan OS."""
    from PySide6.QtCore import QUrl
    from PySide6.QtGui import QDesktopServices

    target = Path(folder)
    if not target.exists():
        return False
    return QDesktopServices.openUrl(QUrl.fromLocalFile(str(target)))


def open_path(path: str) -> bool:
    from PySide6.QtCore import QUrl
    from PySide6.QtGui import QDesktopServices

    target = Path(path)
    if not target.exists():
        return False
    return QDesktopServices.openUrl(QUrl.fromLocalFile(str(target)))
