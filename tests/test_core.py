"""Test inti tanpa Qt: database, klasifikasi, organizer, dan opsi scanner.

Jalankan: python -m unittest discover -s tests -v
"""

from __future__ import annotations

import csv
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.classification import RuleBasedClassifier, classify_path, file_extension  # noqa: E402
from app.constants import CATEGORY_NAMES, SAFETY_PRINCIPLE  # noqa: E402
from app.database import Database  # noqa: E402
from app.organizer import build_plan, export_plan_csv  # noqa: E402
from app.scanner import ScanOptions  # noqa: E402
from app.utils import human_size, shorten_path, time_ago, utc_now_iso  # noqa: E402


class ClassifierTests(unittest.TestCase):
    def setUp(self) -> None:
        self.classifier = RuleBasedClassifier()

    def test_known_extensions(self) -> None:
        casos = {
            "laporan.docx": "Documents",
            "anggaran.xlsx": "Spreadsheets",
            "profil.pptx": "Presentations",
            "kontrak.pdf": "Ebooks",
            "foto.JPG": "Images",
            "rekaman.mp4": "Video",
            "podcast.mp3": "Audio",
            "backup.zip": "Archives",
            "main.py": "Code",
            "installer.exe": "Installers",
        }
        for filename, expected in casos.items():
            with self.subTest(filename=filename):
                self.assertEqual(self.classifier.classify(filename).category, expected)

    def test_unknown_extension_is_other(self) -> None:
        result = self.classifier.classify("data.xyz")
        self.assertEqual(result.category, "Other")
        self.assertLess(result.confidence, 0.5)

    def test_file_without_extension(self) -> None:
        self.assertEqual(classify_path("Makefile").category, "Other")
        self.assertEqual(file_extension(".env"), "")
        self.assertEqual(file_extension("arsip.tar.gz"), "gz")

    def test_every_category_mapped(self) -> None:
        grouped = self.classifier.category_extensions()
        for name in CATEGORY_NAMES:
            if name != "Other":
                self.assertIn(name, grouped)
                self.assertTrue(grouped[name])


class DatabaseTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db = Database(Path(self.tmp.name) / "test.db")
        self.addCleanup(self.db.close)

    def _record(self, name: str, folder: str = "/data/Docs", size: int = 1024) -> dict:
        ext = name.rsplit(".", 1)[-1] if "." in name else ""
        return {
            "path": f"{folder}/{name}",
            "name": name,
            "folder": folder,
            "ext": ext,
            "category": classify_path(name).category,
            "confidence": 0.95,
            "size": size,
            "modified_at": utc_now_iso(),
            "root_path": "/data",
        }

    def test_default_settings(self) -> None:
        self.assertEqual(self.db.get_setting("theme"), "dark")
        self.assertTrue(self.db.get_bool("skip_system_dirs"))
        self.assertFalse(self.db.get_bool("include_hidden"))

    def test_setting_roundtrip(self) -> None:
        self.db.set_setting("theme", "light")
        self.assertEqual(self.db.get_setting("theme"), "light")
        self.db.set_setting("include_hidden", True)
        self.assertTrue(self.db.get_bool("include_hidden"))

    def test_upsert_is_idempotent(self) -> None:
        record = self._record("kontrak.pdf")
        self.db.upsert_files([record])
        self.db.upsert_files([record])
        self.assertEqual(self.db.file_count(), 1)

    def test_stats_and_breakdown(self) -> None:
        self.db.upsert_files(
            [
                self._record("a.docx", size=1000),
                self._record("b.xlsx", size=2000),
                self._record("c.xyz", size=500),
            ]
        )
        stats = self.db.stats()
        self.assertEqual(stats["files"], 3)
        self.assertEqual(stats["total_size"], 3500)
        self.assertEqual(stats["classified"], 2)
        self.assertEqual(stats["unclassified"], 1)
        breakdown = {item["category"]: item for item in stats["categories"]}
        self.assertEqual(breakdown["Documents"]["count"], 1)

    def test_search_and_filters(self) -> None:
        self.db.upsert_files(
            [
                self._record("laporan.pdf", folder="/data/Docs/2024"),
                self._record("laporan.docx", folder="/data/Docs/2024"),
                self._record("gambar.png", folder="/data/Media"),
            ]
        )
        self.assertEqual(len(self.db.query_files(search="laporan")), 2)
        self.assertEqual(len(self.db.query_files(category="Images")), 1)
        self.assertEqual(len(self.db.query_files(folder_prefix="/data/Docs", include_subfolders=True)), 2)
        self.assertEqual(len(self.db.query_files(folder_prefix="/data/Docs")), 2)
        self.assertEqual(self.db.count_files(search="laporan"), 2)

    def test_duplicate_summary(self) -> None:
        self.db.upsert_files(
            [
                self._record("sama.pdf", folder="/data/A", size=5000),
                self._record("sama.pdf", folder="/data/B", size=5000),
                self._record("beda.pdf", folder="/data/A", size=100),
            ]
        )
        summary = self.db.duplicate_summary()
        self.assertEqual(summary["groups"], 1)
        self.assertEqual(summary["files"], 2)
        self.assertEqual(summary["wasted"], 5000)
        self.assertEqual(len(self.db.duplicate_groups()), 1)

    def test_roots_and_cascade_delete(self) -> None:
        self.db.add_root("/data")
        self.assertFalse(self.db.add_root("/data"))  # duplikat ditolak
        self.db.upsert_files([self._record("a.pdf")])
        self.assertEqual(len(self.db.list_roots()), 1)
        self.db.remove_root("/data")
        self.assertEqual(self.db.file_count(), 0)

    def test_activity_log_and_reset(self) -> None:
        self.db.log_activity("Pemindaian selesai", "10 file", "success")
        activity = self.db.recent_activity()
        self.assertEqual(activity[0]["action"], "Pemindaian selesai")
        self.db.reset()
        self.assertEqual(self.db.recent_activity(), [])
        self.assertEqual(self.db.file_count(), 0)
        self.assertEqual(self.db.get_setting("theme"), "dark")


class OrganizerTests(unittest.TestCase):
    FILES = [
        {"path": "a/x.docx", "name": "x.docx", "ext": "docx", "category": "Documents",
         "size": 1000, "modified_at": "2024-03-05T10:00:00+00:00"},
        {"path": "a/y.pdf", "name": "y.pdf", "ext": "pdf", "category": "Ebooks",
         "size": 2000, "modified_at": "2023-11-11T10:00:00+00:00"},
        {"path": "a/z.docx", "name": "z.docx", "ext": "docx", "category": "Documents",
         "size": 3000, "modified_at": "2024-04-05T10:00:00+00:00"},
    ]

    def test_category_template(self) -> None:
        plan = build_plan(self.FILES, "/arsip", "category")
        folders = {group.relative_folder: group for group in plan.groups}
        self.assertIn("Documents/", folders)
        self.assertEqual(folders["Documents/"].files, 2)
        self.assertEqual(plan.total_files, 3)
        self.assertEqual(plan.total_size, 6000)

    def test_year_month_template(self) -> None:
        plan = build_plan(self.FILES, "/arsip", "year_month")
        folders = {group.relative_folder for group in plan.groups}
        self.assertIn("2024/03-Maret/", folders)
        self.assertIn("2023/11-November/", folders)

    def test_unknown_template_fallback(self) -> None:
        plan = build_plan(self.FILES, "/arsip", "tidak-ada")
        self.assertEqual(plan.template, "category_year")

    def test_export_csv(self) -> None:
        plan = build_plan(self.FILES, "/arsip", "category")
        with tempfile.TemporaryDirectory() as tmp:
            path = export_plan_csv(plan, Path(tmp) / "rencana.csv")
            with path.open(encoding="utf-8") as handle:
                rows = list(csv.reader(handle))
        self.assertEqual(rows[0][0], "destination")
        self.assertEqual(len(rows), 3)  # header + 2 kategori


class ScannerOptionsTests(unittest.TestCase):
    def test_size_filters(self) -> None:
        options = ScanOptions(min_size_kb=1, max_size_mb=2)
        self.assertFalse(options.accepts_size(10))
        self.assertTrue(options.accepts_size(5 * 1024))
        self.assertFalse(options.accepts_size(5 * 1024 * 1024))

    def test_unlimited_max(self) -> None:
        options = ScanOptions()
        self.assertTrue(options.accepts_size(10**12))


class UtilsTests(unittest.TestCase):
    def test_human_size(self) -> None:
        self.assertEqual(human_size(0), "0 B")
        self.assertEqual(human_size(512), "512 B")
        self.assertEqual(human_size(1536), "1.5 KB")
        self.assertEqual(human_size(1024**3), "1.0 GB")

    def test_shorten_path(self) -> None:
        long_path = "/sangat/panjang/" + "x" * 100 + "/file.pdf"
        shortened = shorten_path(long_path, 40)
        self.assertLessEqual(len(shortened), 43)
        self.assertIn("...", shortened)

    def test_time_ago(self) -> None:
        self.assertEqual(time_ago(None), "-")
        self.assertIn("baru", time_ago(utc_now_iso()))

    def test_safety_principle_present(self) -> None:
        self.assertIn("persetujuan pengguna", SAFETY_PRINCIPLE)


if __name__ == "__main__":
    unittest.main()
