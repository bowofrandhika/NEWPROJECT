"""Pemindai folder sumber berbasis QThread.

Worker hanya berjalan di atas filesystem dan mengirim batch ke thread UI;
penulisan SQLite dilakukan oleh halaman pemanggil agar koneksi tetap aman.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from PySide6.QtCore import QThread, Signal

from .classification import classify_path
from .constants import SKIP_DIR_NAMES
from .utils import is_hidden


@dataclass
class ScanOptions:
    include_hidden: bool = False
    skip_system_dirs: bool = True
    follow_symlinks: bool = False
    min_size_kb: int = 0
    max_size_mb: int = 0

    @property
    def min_size_bytes(self) -> int:
        return max(0, self.min_size_kb) * 1024

    @property
    def max_size_bytes(self) -> int:
        return max(0, self.max_size_mb) * 1024 * 1024

    def accepts_size(self, size: int) -> bool:
        if size < self.min_size_bytes:
            return False
        if self.max_size_bytes and size > self.max_size_bytes:
            return False
        return True


@dataclass
class ScanProgress:
    scanned: int = 0
    indexed: int = 0
    skipped: int = 0
    total_size: int = 0
    current: str = ""
    current_root: str = ""
    categories: dict[str, int] = field(default_factory=dict)


class ScanWorker(QThread):
    """Memindai satu atau beberapa root secara rekursif."""

    progress = Signal(object)  # ScanProgress
    batch = Signal(list)  # list[dict] siap masuk database
    finished_ok = Signal(object)  # ScanProgress
    failed = Signal(str)

    BATCH_SIZE = 200

    def __init__(self, roots: list[str], options: ScanOptions, parent=None) -> None:
        super().__init__(parent)
        self._roots = [str(Path(root)) for root in roots]
        self._options = options
        self._stop_requested = False

    def request_stop(self) -> None:
        self._stop_requested = True

    @property
    def stop_requested(self) -> bool:
        return self._stop_requested

    # ------------------------------------------------------------------ run
    def run(self) -> None:  # pragma: no cover - dijalankan di thread terpisah
        state = ScanProgress()
        pending: list[dict] = []
        errors: list[str] = []

        try:
            for root in self._roots:
                if self._stop_requested:
                    break
                state.current_root = root
                if not Path(root).exists():
                    errors.append(f"Folder tidak ditemukan: {root}")
                    continue
                for file_path, stat in self._walk(root):
                    if self._stop_requested:
                        break
                    state.scanned += 1
                    state.current = file_path
                    if not self._options.accepts_size(stat.st_size):
                        state.skipped += 1
                        self._emit_throttled(state)
                        continue

                    result = classify_path(file_path)
                    size = int(stat.st_size)
                    state.indexed += 1
                    state.total_size += size
                    state.categories[result.category] = (
                        state.categories.get(result.category, 0) + 1
                    )
                    pending.append(
                        {
                            "path": file_path,
                            "name": os.path.basename(file_path),
                            "folder": os.path.dirname(file_path),
                            "ext": os.path.splitext(file_path)[1].lstrip(".").lower(),
                            "category": result.category,
                            "confidence": result.confidence,
                            "size": size,
                            "modified_at": _iso(stat.st_mtime),
                            "root_path": root,
                        }
                    )
                    if len(pending) >= self.BATCH_SIZE:
                        self.batch.emit(pending)
                        pending = []
                    self._emit_throttled(state)

            if pending:
                self.batch.emit(pending)
            self.progress.emit(state)
            if errors:
                state.current = "; ".join(errors)
            self.finished_ok.emit(state)
        except Exception as exc:  # pragma: no cover - jaring pengaman
            self.failed.emit(str(exc))

    # -------------------------------------------------------------- helpers
    def _walk(self, root: str):
        options = self._options
        for dirpath, dirnames, filenames in os.walk(root, followlinks=options.follow_symlinks):
            if self._stop_requested:
                return
            kept: list[str] = []
            for name in dirnames:
                if not options.include_hidden and is_hidden(os.path.join(dirpath, name), name):
                    continue
                if options.skip_system_dirs and name.lower() in SKIP_DIR_NAMES:
                    continue
                kept.append(name)
            dirnames[:] = kept

            for name in filenames:
                if self._stop_requested:
                    return
                if not options.include_hidden and name.startswith("."):
                    continue
                full_path = os.path.join(dirpath, name)
                try:
                    stat = os.stat(full_path)
                except OSError:
                    continue
                if not os.path.isfile(full_path):
                    continue
                yield full_path, stat

    def _emit_throttled(self, state: ScanProgress) -> None:
        # Emit setiap 40 file agar UI tetap responsif tanpa membanjiri event loop.
        if state.scanned % 40 == 0:
            self.progress.emit(
                ScanProgress(
                    scanned=state.scanned,
                    indexed=state.indexed,
                    skipped=state.skipped,
                    total_size=state.total_size,
                    current=state.current,
                    current_root=state.current_root,
                    categories=dict(state.categories),
                )
            )


def _iso(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).replace(microsecond=0).isoformat()


def build_options(db) -> ScanOptions:
    """Ambil opsi pemindaian dari tabel settings."""
    return ScanOptions(
        include_hidden=db.get_bool("include_hidden"),
        skip_system_dirs=db.get_bool("skip_system_dirs"),
        follow_symlinks=db.get_bool("follow_symlinks"),
        min_size_kb=db.get_int("min_size_kb"),
        max_size_mb=db.get_int("max_size_mb"),
    )
