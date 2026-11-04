"""Lapisan database SQLite untuk SmartFile Organizer.

Semua akses data lewat kelas `Database` agar UI tidak pernah menulis SQL
langsung. Skema dibuat otomatis saat pertama kali dijalankan.
"""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator, Sequence

from .classification import classify_path
from .utils import human_count, utc_now_iso

SCHEMA_VERSION = 1

DEFAULT_SETTINGS: dict[str, str] = {
    "theme": "dark",
    "destination_root": "",
    "include_hidden": "0",
    "skip_system_dirs": "1",
    "follow_symlinks": "0",
    "min_size_kb": "0",
    "max_size_mb": "0",
    "auto_organize": "0",
    "organize_template": "category_year",
    "last_scan_at": "",
}

_SCHEMA = """
CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roots (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    path     TEXT UNIQUE NOT NULL,
    label    TEXT,
    added_at TEXT NOT NULL,
    enabled  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS files (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    path        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    folder      TEXT NOT NULL,
    ext         TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL DEFAULT 'Other',
    confidence  REAL NOT NULL DEFAULT 0,
    size        INTEGER NOT NULL DEFAULT 0,
    modified_at TEXT,
    indexed_at  TEXT NOT NULL,
    root_path   TEXT
);

CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);
CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);
CREATE INDEX IF NOT EXISTS idx_files_size ON files(size);
CREATE INDEX IF NOT EXISTS idx_files_root ON files(root_path);

CREATE TABLE IF NOT EXISTS scans (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    root_path   TEXT NOT NULL,
    started_at  TEXT NOT NULL,
    finished_at TEXT,
    files_found INTEGER NOT NULL DEFAULT 0,
    total_size  INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'running'
);

CREATE TABLE IF NOT EXISTS activity (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    action     TEXT NOT NULL,
    detail     TEXT,
    level      TEXT NOT NULL DEFAULT 'info',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


class Database:
    """Koneksi SQLite tunggal yang dipakai di thread UI."""

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(self.path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA foreign_keys=ON")
        self._conn.executescript(_SCHEMA)
        self._conn.execute(
            "INSERT OR IGNORE INTO meta(key, value) VALUES('schema_version', ?)",
            (str(SCHEMA_VERSION),),
        )
        self._seed_settings()
        self._conn.commit()
        self._closed = False

    # ------------------------------------------------------------------ core
    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        try:
            yield self._conn
            self._conn.commit()
        except Exception:
            self._conn.rollback()
            raise

    def close(self) -> None:
        if getattr(self, "_closed", False):
            return
        self._conn.close()
        self._closed = True

    @property
    def closed(self) -> bool:
        return getattr(self, "_closed", False)

    def _seed_settings(self) -> None:
        now = utc_now_iso()
        with self._conn:
            for key, value in DEFAULT_SETTINGS.items():
                self._conn.execute(
                    "INSERT OR IGNORE INTO settings(key, value, updated_at) VALUES(?,?,?)",
                    (key, value, now),
                )

    # -------------------------------------------------------------- settings
    def get_setting(self, key: str, default: str = "") -> str:
        row = self._conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
        if row is None:
            return DEFAULT_SETTINGS.get(key, default)
        return str(row["value"])

    def get_bool(self, key: str) -> bool:
        return self.get_setting(key, "0") in {"1", "true", "True", "yes"}

    def get_int(self, key: str) -> int:
        try:
            return int(self.get_setting(key, "0"))
        except ValueError:
            return 0

    def set_setting(self, key: str, value: str | int | bool) -> None:
        stored = str(int(value)) if isinstance(value, bool) else str(value)
        with self.transaction() as conn:
            conn.execute(
                "INSERT INTO settings(key, value, updated_at) VALUES(?,?,?) "
                "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
                (key, stored, utc_now_iso()),
            )

    # ----------------------------------------------------------------- roots
    def add_root(self, path: str) -> bool:
        normalized = str(Path(path).expanduser().resolve())
        try:
            with self.transaction() as conn:
                conn.execute(
                    "INSERT INTO roots(path, label, added_at) VALUES(?,?,?)",
                    (normalized, Path(normalized).name or normalized, utc_now_iso()),
                )
            return True
        except sqlite3.IntegrityError:
            return False

    def remove_root(self, path: str) -> None:
        with self.transaction() as conn:
            conn.execute("DELETE FROM roots WHERE path = ?", (path,))
            conn.execute("DELETE FROM files WHERE root_path = ?", (path,))

    def list_roots(self) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            """
            SELECT r.path, r.label, r.added_at, COUNT(f.id) AS file_count,
                   COALESCE(SUM(f.size), 0) AS total_size
            FROM roots r
            LEFT JOIN files f ON f.root_path = r.path
            GROUP BY r.path
            ORDER BY r.added_at ASC
            """
        ).fetchall()
        return [dict(row) for row in rows]

    # ----------------------------------------------------------------- files
    def upsert_files(self, records: Sequence[dict[str, Any]]) -> int:
        """Simpan batch hasil pemindaian. Return jumlah baris yang diproses."""
        if not records:
            return 0
        now = utc_now_iso()
        rows = [
            (
                record["path"],
                record["name"],
                record["folder"],
                record.get("ext", ""),
                record.get("category", "Other"),
                float(record.get("confidence", 0.0)),
                int(record.get("size", 0)),
                record.get("modified_at"),
                now,
                record.get("root_path"),
            )
            for record in records
        ]
        with self.transaction() as conn:
            conn.executemany(
                """
                INSERT INTO files(path, name, folder, ext, category, confidence,
                                  size, modified_at, indexed_at, root_path)
                VALUES(?,?,?,?,?,?,?,?,?,?)
                ON CONFLICT(path) DO UPDATE SET
                    name=excluded.name,
                    folder=excluded.folder,
                    ext=excluded.ext,
                    category=excluded.category,
                    confidence=excluded.confidence,
                    size=excluded.size,
                    modified_at=excluded.modified_at,
                    indexed_at=excluded.indexed_at,
                    root_path=excluded.root_path
                """,
                rows,
            )
        return len(rows)

    def index_single_file(self, path: str, root_path: str | None = None) -> bool:
        target = Path(path)
        try:
            stat = target.stat()
        except OSError:
            return False
        result = classify_path(str(target))
        self.upsert_files(
            [
                {
                    "path": str(target),
                    "name": target.name,
                    "folder": str(target.parent),
                    "ext": target.suffix.lstrip(".").lower(),
                    "category": result.category,
                    "confidence": result.confidence,
                    "size": stat.st_size,
                    "modified_at": _iso_from_timestamp(stat.st_mtime),
                    "root_path": root_path,
                }
            ]
        )
        return True

    def clear_index(self) -> None:
        with self.transaction() as conn:
            conn.execute("DELETE FROM files")

    def file_count(self) -> int:
        return int(self._conn.execute("SELECT COUNT(*) FROM files").fetchone()[0])

    def query_files(
        self,
        search: str = "",
        category: str = "",
        folder_prefix: str = "",
        limit: int = 800,
        offset: int = 0,
        include_subfolders: bool = True,
    ) -> list[dict[str, Any]]:
        clauses: list[str] = []
        params: list[Any] = []
        if search:
            clauses.append("(name LIKE ? OR path LIKE ?)")
            like = f"%{search}%"
            params.extend([like, like])
        if category:
            clauses.append("category = ?")
            params.append(category)
        if folder_prefix:
            if include_subfolders:
                # substr dipakai agar aman terhadap karakter wildcard pada path.
                clauses.append("(folder = ? OR substr(folder, 1, ?) = ?)")
                params.extend([folder_prefix, len(folder_prefix) + 1, folder_prefix + os.sep])
            else:
                clauses.append("folder = ?")
                params.append(folder_prefix)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        params.extend([limit, offset])
        rows = self._conn.execute(
            f"""
            SELECT path, name, folder, ext, category, confidence, size, modified_at, root_path
            FROM files
            {where}
            ORDER BY modified_at DESC, name COLLATE NOCASE ASC
            LIMIT ? OFFSET ?
            """,
            params,
        ).fetchall()
        return [dict(row) for row in rows]

    def count_files(
        self,
        search: str = "",
        category: str = "",
        folder_prefix: str = "",
        include_subfolders: bool = True,
    ) -> int:
        clauses: list[str] = []
        params: list[Any] = []
        if search:
            clauses.append("(name LIKE ? OR path LIKE ?)")
            like = f"%{search}%"
            params.extend([like, like])
        if category:
            clauses.append("category = ?")
            params.append(category)
        if folder_prefix:
            if include_subfolders:
                # substr dipakai agar aman terhadap karakter wildcard pada path.
                clauses.append("(folder = ? OR substr(folder, 1, ?) = ?)")
                params.extend([folder_prefix, len(folder_prefix) + 1, folder_prefix + os.sep])
            else:
                clauses.append("folder = ?")
                params.append(folder_prefix)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        return int(
            self._conn.execute(f"SELECT COUNT(*) FROM files {where}", params).fetchone()[0]
        )

    def all_files_minimal(self) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT path, name, ext, category, size, modified_at FROM files"
        ).fetchall()
        return [dict(row) for row in rows]

    def category_breakdown(self) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            """
            SELECT category, COUNT(*) AS count, COALESCE(SUM(size), 0) AS size
            FROM files GROUP BY category ORDER BY size DESC
            """
        ).fetchall()
        return [dict(row) for row in rows]

    def extension_breakdown(self, limit: int = 12) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            """
            SELECT CASE WHEN ext = '' THEN '(tanpa ekstensi)' ELSE '.' || ext END AS label,
                   COUNT(*) AS count, COALESCE(SUM(size), 0) AS size
            FROM files GROUP BY ext ORDER BY count DESC, size DESC LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]

    def folder_counts(self, limit: int = 500) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            """
            SELECT folder, COUNT(*) AS count, COALESCE(SUM(size), 0) AS size
            FROM files GROUP BY folder ORDER BY folder ASC LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]

    def largest_folders(self, limit: int = 5) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            """
            SELECT folder, COUNT(*) AS count, COALESCE(SUM(size), 0) AS size
            FROM files GROUP BY folder ORDER BY size DESC LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]

    def duplicate_summary(self) -> dict[str, int]:
        """Deteksi awal duplikat berbasis nama + ukuran (hash menyusul di V1.5)."""
        row = self._conn.execute(
            """
            SELECT COUNT(*) AS groups,
                   COALESCE(SUM(repeats), 0) AS files,
                   COALESCE(SUM(extra_bytes), 0) AS wasted
            FROM (
                SELECT LOWER(name) AS lname, size, COUNT(*) AS repeats,
                       (COUNT(*) - 1) * size AS extra_bytes
                FROM files
                WHERE size > 0
                GROUP BY lname, size
                HAVING COUNT(*) > 1
            )
            """
        ).fetchone()
        return {
            "groups": int(row["groups"] or 0),
            "files": int(row["files"] or 0),
            "wasted": int(row["wasted"] or 0),
        }

    def duplicate_groups(self, limit: int = 40) -> list[dict[str, Any]]:
        """Daftar grup duplikat potensial (nama + ukuran identik)."""
        rows = self._conn.execute(
            """
            SELECT MIN(name) AS name, LOWER(name) AS key_name, size, COUNT(*) AS copies,
                   (COUNT(*) - 1) * size AS wasted
            FROM files
            WHERE size > 0
            GROUP BY key_name, size
            HAVING COUNT(*) > 1
            ORDER BY wasted DESC, name COLLATE NOCASE ASC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]

    # ----------------------------------------------------------------- stats
    def stats(self) -> dict[str, Any]:
        row = self._conn.execute(
            """
            SELECT COUNT(*) AS files,
                   COALESCE(SUM(size), 0) AS total_size,
                   SUM(CASE WHEN category <> 'Other' AND confidence >= 0.5 THEN 1 ELSE 0 END)
                       AS classified,
                   SUM(CASE WHEN category = 'Other' THEN 1 ELSE 0 END) AS unclassified
            FROM files
            """
        ).fetchone()
        duplicates = self.duplicate_summary()
        roots = self.list_roots()
        return {
            "files": int(row["files"] or 0),
            "total_size": int(row["total_size"] or 0),
            "classified": int(row["classified"] or 0),
            "unclassified": int(row["unclassified"] or 0),
            "duplicates": duplicates,
            "roots": len(roots),
            "categories": self.category_breakdown(),
            "last_scan_at": self.get_setting("last_scan_at", ""),
        }

    # ----------------------------------------------------------------- scans
    def start_scan(self, root_path: str) -> int:
        with self.transaction() as conn:
            cursor = conn.execute(
                "INSERT INTO scans(root_path, started_at, status) VALUES(?,?, 'running')",
                (root_path, utc_now_iso()),
            )
            return int(cursor.lastrowid)

    def finish_scan(
        self, scan_id: int, files_found: int, total_size: int, status: str = "completed"
    ) -> None:
        with self.transaction() as conn:
            conn.execute(
                """
                UPDATE scans SET finished_at = ?, files_found = ?, total_size = ?, status = ?
                WHERE id = ?
                """,
                (utc_now_iso(), files_found, total_size, status, scan_id),
            )
            conn.execute(
                "INSERT INTO settings(key, value, updated_at) VALUES('last_scan_at', ?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
                (utc_now_iso(), utc_now_iso()),
            )

    def recent_scans(self, limit: int = 5) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT * FROM scans ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(row) for row in rows]

    # -------------------------------------------------------------- activity
    def log_activity(self, action: str, detail: str = "", level: str = "info") -> None:
        with self.transaction() as conn:
            conn.execute(
                "INSERT INTO activity(action, detail, level, created_at) VALUES(?,?,?,?)",
                (action, detail, level, utc_now_iso()),
            )
            conn.execute(
                "DELETE FROM activity WHERE id NOT IN "
                "(SELECT id FROM activity ORDER BY id DESC LIMIT 500)"
            )

    def recent_activity(self, limit: int = 12) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT * FROM activity ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(row) for row in rows]

    # ----------------------------------------------------------------- reset
    def reset(self) -> None:
        with self.transaction() as conn:
            conn.execute("DELETE FROM files")
            conn.execute("DELETE FROM roots")
            conn.execute("DELETE FROM scans")
            conn.execute("DELETE FROM activity")
            conn.execute("DELETE FROM settings")
        self._seed_settings()

    def summary_line(self) -> str:
        stats = self.stats()
        return (
            f"{human_count(stats['files'])} file terindeks dari {stats['roots']} folder sumber"
        )


def _iso_from_timestamp(timestamp: float) -> str:
    from datetime import datetime, timezone

    return datetime.fromtimestamp(timestamp, tz=timezone.utc).replace(microsecond=0).isoformat()


def open_database(path: str | Path) -> Database:
    return Database(path)
