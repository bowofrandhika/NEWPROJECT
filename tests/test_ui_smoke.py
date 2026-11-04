"""Smoke test antarmuka: semua halaman dibuat, tema diganti, pemindaian nyata.

Test ini membutuhkan PySide6 dan akan dilewati bila tidak tersedia atau bila
platform tidak dapat membuat QApplication (misalnya di CI tanpa display).
"""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

try:
    from PySide6.QtWidgets import QApplication
except Exception:  # pragma: no cover - lingkungan tanpa Qt
    QApplication = None

from app.database import Database  # noqa: E402
from app.scanner import ScanOptions, ScanWorker  # noqa: E402

PAGE_KEYS = (
    "dashboard",
    "scanner",
    "explorer",
    "classifier",
    "organizer",
    "sync",
    "duplicates",
    "history",
    "settings",
)


@unittest.skipIf(QApplication is None, "PySide6 tidak tersedia")
class UserInterfaceSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])
        from main import pick_font

        cls.app.setFont(pick_font())

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db = Database(Path(self.tmp.name) / "ui.db")

        source = Path(self.tmp.name) / "Sumber"
        (source / "Dokumen").mkdir(parents=True)
        (source / "Dokumen" / "kontrak.pdf").write_bytes(b"pdf" * 100)
        (source / "Dokumen" / "catatan.docx").write_bytes(b"doc" * 50)
        (source / "foto.jpg").write_bytes(b"jpg" * 200)
        self.source = source
        self.db.add_root(str(source))

        from app.ui.main_window import MainWindow

        self.window = MainWindow(self.db)
        self.window.resize(1280, 840)

    def tearDown(self) -> None:
        # Sembunyikan & hapus jendela lebih dulu agar tidak ada akses ke database
        # setelah koneksi ditutup (closeEvent MainWindow juga menutup database).
        self.window.hide()
        self.window.deleteLater()
        self.app.processEvents()
        self.db.close()
        self.tmp.cleanup()

    def _pump(self, times: int = 3) -> None:
        for _ in range(times):
            self.app.processEvents()

    def test_all_pages_render(self) -> None:
        for key in PAGE_KEYS:
            with self.subTest(page=key):
                self.window.navigate(key)
                self._pump()
                self.assertIsNotNone(self.window.stack.currentWidget())

    def test_theme_toggle(self) -> None:
        self.window.navigate("dashboard")
        initial = self.window._theme.name
        self.window.toggle_theme()
        self._pump()
        self.assertNotEqual(self.window._theme.name, initial)
        self.assertEqual(self.db.get_setting("theme"), self.window._theme.name)

    def test_sidebar_collapse(self) -> None:
        self.window.toggle_sidebar()
        self._pump()
        self.assertTrue(self.window.sidebar.collapsed)
        self.window.toggle_sidebar()
        self._pump()
        self.assertFalse(self.window.sidebar.collapsed)

    def test_search_switches_to_explorer(self) -> None:
        self.window.navigate("dashboard")
        self.window._search.setText("kontrak")
        self._pump()
        self.assertIs(self.window.stack.currentWidget(), self.window.explorer)

    def test_scan_worker_indexes_files(self) -> None:
        worker = ScanWorker(
            [str(self.source)],
            ScanOptions(include_hidden=False, skip_system_dirs=True),
        )
        batches: list[list] = []
        worker.batch.connect(batches.append)
        worker.run()  # sinkron agar test deterministik
        self.db.upsert_files([record for batch in batches for record in batch])
        self.assertEqual(self.db.file_count(), 3)
        categories = {item["category"] for item in self.db.category_breakdown()}
        self.assertIn("Ebooks", categories)
        self.assertIn("Documents", categories)

        self.window._on_data_changed()
        self._pump()
        stats = self.db.stats()
        self.assertEqual(stats["files"], 3)

    def test_organizer_preview(self) -> None:
        self.db.upsert_files(
            [
                {
                    "path": "/arsip/kontrak.pdf",
                    "name": "kontrak.pdf",
                    "folder": "/arsip",
                    "ext": "pdf",
                    "category": "Ebooks",
                    "confidence": 0.95,
                    "size": 2048,
                    "modified_at": "2024-02-02T00:00:00+00:00",
                    "root_path": "/arsip",
                }
            ]
        )
        page = self.window.organizer
        page._destination.setText(str(Path(self.tmp.name) / "Tujuan"))
        page.generate_plan()
        self._pump()
        self.assertIsNotNone(page._plan)
        self.assertGreater(page._table.rowCount(), 0)


if __name__ == "__main__":
    unittest.main()
