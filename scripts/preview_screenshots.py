"""Utilitas pengembangan: buat data demo + tangkapan layar tiap halaman.

Dipakai untuk dokumentasi (README) dan pemeriksaan visual tanpa membuka
jendela sungguhan:

    QT_QPA_PLATFORM=offscreen python scripts/preview_screenshots.py
"""

from __future__ import annotations

import os
import random
import shutil
import sys
import tempfile
from pathlib import Path

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from PySide6.QtWidgets import QApplication  # noqa: E402

from app.classification import classify_path  # noqa: E402
from app.constants import APP_NAME  # noqa: E402
from app.database import Database  # noqa: E402
from app.ui.main_window import MainWindow  # noqa: E402
from app.utils import utc_now_iso  # noqa: E402

DEMO_ROOT = Path(tempfile.gettempdir()) / "SmartFileDemo"
SCREENSHOT_DIR = ROOT / "docs" / "screenshots"

SAMPLE_TREE: dict[str, list[tuple[str, int]]] = {
    "Documents/Kontrak": [
        ("Kontrak Kerja Sama 2024.docx", 184_320),
        ("Kontrak Kerja Sama 2023.docx", 176_128),
        ("Addendum Kontrak.pdf", 512_000),
        ("Catatan Negosiasi.txt", 12_400),
    ],
    "Documents/Laporan": [
        ("Laporan Tahunan 2024.pdf", 3_240_000),
        ("Laporan Tahunan 2024 - revisi.pdf", 3_240_000),
        ("Ringkasan Eksekutif.docx", 98_000),
        ("Notulen Rapat.md", 8_200),
    ],
    "Keuangan": [
        ("Anggaran 2024.xlsx", 245_760),
        ("Realiasasi Q1.xlsx", 180_224),
        ("Rekap Transaksi.csv", 92_400),
        ("Invoice-0124.pdf", 128_000),
    ],
    "Presentasi": [
        ("Company Profile.pptx", 5_120_000),
        ("Roadmap Produk.pptx", 2_400_000),
        ("Pitch Deck Final.key", 8_200_000),
    ],
    "Media/Foto": [
        ("IMG_2201.jpg", 4_200_000),
        ("IMG_2202.jpg", 4_050_000),
        ("logo-perusahaan.png", 84_000),
        ("hero-banner.webp", 640_000),
    ],
    "Media/Video": [
        ("Company_Profile_1080p.mp4", 148_000_000),
        ("Townhall 2024.mp4", 92_000_000),
    ],
    "Media/Audio": [
        ("Podcast Episode 12.mp3", 24_000_000),
        ("Voice Note.wav", 6_400_000),
    ],
    "Arsip": [
        ("Backup Laporan 2024.zip", 48_000_000),
        ("Arsip Kontrak.zip", 12_000_000),
        ("Installer Aplikasi.exe", 86_000_000),
        ("Dataset Pelanggan.tar.gz", 32_000_000),
        ("logo-perusahaan.png", 84_000),
        ("Company_Profile_1080p.mp4", 148_000_000),
    ],
    "Proyek": [
        ("main.py", 6_200),
        ("index.tsx", 12_400),
        ("config.yaml", 1_800),
        ("schema.sql", 4_100),
        ("notebook_analisis.ipynb", 420_000),
    ],
}

ACTIVITIES = [
    ("Klasifikasi rule engine dijalankan", "semua file dikenali berdasarkan ekstensi", "info"),
    ("Folder sumber ditambahkan", "D:/ARSIP", "info"),
    ("Pratinjau folder dibuat", "34 folder • 1.187 file", "info"),
    ("Folder sumber dihapus", "E:/Backup Lama", "warning"),
]


def build_demo_files() -> None:
    if DEMO_ROOT.exists():
        shutil.rmtree(DEMO_ROOT, ignore_errors=True)
    for folder, files in SAMPLE_TREE.items():
        target = DEMO_ROOT / folder
        target.mkdir(parents=True, exist_ok=True)
        for name, size in files:
            path = target / name
            # File kecil dibuat nyata agar explorer bisa membukanya, sisanya placeholder.
            path.write_bytes(b"0" * min(size, 2048))


def seed_database(db: Database) -> None:
    records = []
    for path in DEMO_ROOT.rglob("*"):
        if not path.is_file():
            continue
        result = classify_path(str(path))
        records.append(
            {
                "path": str(path),
                "name": path.name,
                "folder": str(path.parent),
                "ext": path.suffix.lstrip(".").lower(),
                "category": result.category,
                "confidence": result.confidence,
                "size": _size_for(path),
                "modified_at": utc_now_iso(),
                "root_path": str(DEMO_ROOT),
            }
        )
    # Tambahkan variasi agar statistik terlihat realistis.
    rng = random.Random(7)
    base = len(records)
    for index in range(base, base + 640):
        category = rng.choice(
            ["Documents", "Spreadsheets", "Ebooks", "Images", "Video", "Audio", "Archives", "Code"]
        )
        ext_map = {
            "Documents": "docx",
            "Spreadsheets": "xlsx",
            "Ebooks": "pdf",
            "Images": "jpg",
            "Video": "mp4",
            "Audio": "mp3",
            "Archives": "zip",
            "Code": "py",
        }
        size = int(rng.lognormvariate(13, 1.4))
        records.append(
            {
                "path": f"{DEMO_ROOT}/_demo/file_{index:04d}.{ext_map[category]}",
                "name": f"file_{index:04d}.{ext_map[category]}",
                "folder": f"{DEMO_ROOT}/_demo",
                "ext": ext_map[category],
                "category": category,
                "confidence": 0.95,
                "size": size,
                "modified_at": utc_now_iso(),
                "root_path": str(DEMO_ROOT),
            }
        )

    db.add_root(str(DEMO_ROOT))
    db.upsert_files(records)
    db.set_setting("destination_root", str(DEMO_ROOT.parent / "SmartFileArchive"))
    for action, detail, level in ACTIVITIES:
        db.log_activity(action, detail, level)
    db.finish_scan(db.start_scan(str(DEMO_ROOT)), len(records), sum(r["size"] for r in records))
    db.log_activity(
        "Pemindaian selesai",
        f"{len(records)} file • {sum(r['size'] for r in records) / 1e9:.2f} GB",
        "success",
    )


def _size_for(path: Path) -> int:
    for folder, files in SAMPLE_TREE.items():
        for name, size in files:
            if path.name == name:
                return size
    return path.stat().st_size


def capture(window: MainWindow, pages: list[str], theme: str) -> None:
    window._apply_theme(theme)
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    for key in pages:
        window.navigate(key)
        page = window.stack.currentWidget()
        if key == "organizer" and hasattr(page, "generate_plan"):
            # Isi pratinjau agar dokumentasi memperlihatkan hasil nyata.
            page.generate_plan()
        # Beri beberapa siklus event agar layout (termasuk scroll area) stabil.
        for _ in range(4):
            QApplication.processEvents()
        pixmap = window.grab()
        target = SCREENSHOT_DIR / f"{key}-{theme}.png"
        pixmap.save(str(target), "PNG")
        print(f"captured {target.relative_to(ROOT)}")


def main() -> int:
    build_demo_files()
    db_dir = Path(tempfile.mkdtemp(prefix="smartfile-demo-"))
    db = Database(db_dir / "demo.db")
    seed_database(db)

    application = QApplication(sys.argv[:1])
    application.setApplicationName(APP_NAME)
    from main import pick_font

    application.setFont(pick_font())

    window = MainWindow(db)
    window.resize(1440, 900)
    window.show()

    capture(window, ["dashboard", "explorer", "scanner", "organizer"], "dark")
    capture(window, ["dashboard"], "light")

    db.close()
    shutil.rmtree(db_dir, ignore_errors=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
