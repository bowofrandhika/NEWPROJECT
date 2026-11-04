"""Konstanta global SmartFile Organizer.

Semua nilai yang dipakai lintas modul (nama aplikasi, kategori file, roadmap)
dikumpulkan di sini agar mudah diubah tanpa menyentuh logika UI.
"""

from __future__ import annotations

from dataclasses import dataclass

APP_NAME = "SmartFile Organizer"
APP_TAGLINE = "Intelligent File Management & Synchronization System"
APP_VERSION = "1.0.0"
APP_ID = "SmartFileOrganizer"
APP_AUTHOR = "SmartFile Project"


@dataclass(frozen=True)
class FileCategory:
    """Satu kategori klasifikasi beserta ekstensi yang dipetakan ke sana."""

    name: str
    color: str
    description: str
    extensions: tuple[str, ...]


CATEGORIES: tuple[FileCategory, ...] = (
    FileCategory(
        name="Documents",
        color="#4F8CFF",
        description="Dokumen teks dan naskah",
        extensions=(
            "doc", "docx", "docm", "odt", "rtf", "txt", "md", "markdown",
            "pages", "wps", "tex", "log",
        ),
    ),
    FileCategory(
        name="Spreadsheets",
        color="#22C55E",
        description="Tabel, laporan, dan data tabular",
        extensions=("xls", "xlsx", "xlsm", "ods", "csv", "tsv", "numbers"),
    ),
    FileCategory(
        name="Presentations",
        color="#F59E0B",
        description="Materi presentasi dan slide",
        extensions=("ppt", "pptx", "pptm", "odp", "pps", "ppsx", "key"),
    ),
    FileCategory(
        name="Ebooks",
        color="#8B5CF6",
        description="PDF, buku digital, dan hasil pindai",
        extensions=("pdf", "epub", "mobi", "azw", "azw3", "djvu", "fb2", "cbz", "cbr"),
    ),
    FileCategory(
        name="Images",
        color="#A855F7",
        description="Foto, desain, dan aset visual",
        extensions=(
            "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "tif", "tiff",
            "heic", "heif", "raw", "cr2", "nef", "arw", "psd", "ai", "xcf",
        ),
    ),
    FileCategory(
        name="Video",
        color="#EF4444",
        description="Rekaman dan materi video",
        extensions=(
            "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v", "mpg",
            "mpeg", "3gp", "ts",
        ),
    ),
    FileCategory(
        name="Audio",
        color="#EC4899",
        description="Musik, rekaman suara, dan podcast",
        extensions=("mp3", "wav", "flac", "aac", "ogg", "m4a", "wma", "opus", "aiff", "mid"),
    ),
    FileCategory(
        name="Archives",
        color="#14B8A6",
        description="Paket terkompresi dan image disk",
        extensions=("zip", "rar", "7z", "tar", "gz", "bz2", "xz", "tgz", "iso", "cab"),
    ),
    FileCategory(
        name="Code",
        color="#6366F1",
        description="Kode sumber, konfigurasi, dan notebook",
        extensions=(
            "py", "js", "jsx", "ts", "tsx", "html", "css", "scss", "json",
            "xml", "yml", "yaml", "toml", "ini", "sh", "bat", "ps1", "c",
            "cpp", "h", "hpp", "java", "cs", "go", "rs", "php", "rb", "sql",
            "ipynb", "vue", "svelte",
        ),
    ),
    FileCategory(
        name="Installers",
        color="#F97316",
        description="Paket instalasi dan aplikasi portabel",
        extensions=("exe", "msi", "msix", "apk", "dmg", "pkg", "deb", "rpm", "appimage"),
    ),
    FileCategory(
        name="Other",
        color="#94A3B8",
        description="Belum dikenali oleh rule engine",
        extensions=(),
    ),
)

CATEGORY_NAMES: tuple[str, ...] = tuple(category.name for category in CATEGORIES)
CATEGORY_COLORS: dict[str, str] = {c.name: c.color for c in CATEGORIES}

EXTENSION_TO_CATEGORY: dict[str, str] = {
    ext: category.name
    for category in CATEGORIES
    for ext in category.extensions
}

OTHER_CATEGORY = "Other"

# Folder sistem yang dilewati scanner agar hasil pemindaian tetap relevan.
SKIP_DIR_NAMES: frozenset[str] = frozenset(
    {
        ".git", ".svn", ".hg", "node_modules", "__pycache__", ".venv", "venv",
        "env", ".idea", ".vscode", ".gradle", ".next", ".nuxt", "dist",
        "build", "target", "$recycle.bin", "system volume information",
        "recovery", "windows", "windows.old", "program files",
        "program files (x86)", "programdata", "appdata",
        ".cache", ".local", ".npm", ".m2", "site-packages",
    }
)

ROADMAP: tuple[dict[str, str], ...] = (
    {
        "version": "V1.0",
        "title": "Dashboard, Database, Scanner, File Explorer",
        "status": "active",
        "detail": "Fondasi aplikasi: SQLite index, pemindaian folder, rule engine dasar, explorer.",
    },
    {
        "version": "V1.1",
        "title": "AI Classification",
        "status": "planned",
        "detail": "Ollama lokal dan cloud AI dengan approval gate sebelum klasifikasi dipakai.",
    },
    {
        "version": "V1.2",
        "title": "Automatic Folder Generator",
        "status": "planned",
        "detail": "Pembuatan struktur folder otomatis dari template yang sudah disetujui.",
    },
    {
        "version": "V1.3",
        "title": "Copy, Move & Flexible Organization",
        "status": "planned",
        "detail": "Eksekusi rencana organisasi dengan undo dan mode copy-first.",
    },
    {
        "version": "V1.4",
        "title": "Automatic & Manual Synchronization",
        "status": "planned",
        "detail": "Sinkronisasi sumber ke tujuan, watchdog real-time, dan jadwal.",
    },
    {
        "version": "V1.5",
        "title": "Duplicate Detection",
        "status": "planned",
        "detail": "Deteksi duplikat berbasis hash, preview penghapusan, dan laporan.",
    },
    {
        "version": "V1.6",
        "title": "Version History & Document Relationship",
        "status": "planned",
        "detail": "Riwayat versi dokumen dan graf keterkaitan antar dokumen.",
    },
    {
        "version": "V2.0",
        "title": "Enterprise Features",
        "status": "planned",
        "detail": "Multi-user, kebijakan retensi, enkripsi, dan optimasi performa berskala besar.",
    },
)

SAFETY_PRINCIPLE = (
    "AI tidak boleh mengambil keputusan pemindahan file tanpa persetujuan pengguna "
    "pada tahap awal penggunaan. Setelah aturan klasifikasi dianggap stabil, pengguna "
    "dapat mengaktifkan Auto-Organization untuk kategori tertentu."
)
