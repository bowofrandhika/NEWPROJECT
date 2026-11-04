"""Halaman modul lanjutan: Sync Center, Duplicate Manager, dan History.

V1.0 belum mengeksekusi sinkronisasi maupun penghapusan duplikat. Halaman ini
menampilkan data yang sudah tersedia, rencana fitur, serta prinsip keamanan.
"""

from __future__ import annotations

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QAbstractItemView,
    QHBoxLayout,
    QHeaderView,
    QPushButton,
    QScrollArea,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from ...constants import ROADMAP
from ...database import Database
from ...theme import DARK, ThemeTokens
from ...utils import human_count, human_size
from ..widgets.activity import ActivityFeed
from ..widgets.common import BulletItem, Card, EmptyState, InfoRow, Pill, StatCard, label


def _scrollable(widget: QWidget) -> QVBoxLayout:
    outer = QVBoxLayout(widget)
    outer.setContentsMargins(0, 0, 0, 0)
    scroll = QScrollArea()
    scroll.setWidgetResizable(True)
    scroll.setFrameShape(QScrollArea.NoFrame)
    outer.addWidget(scroll)
    content = QWidget()
    scroll.setWidget(content)
    root = QVBoxLayout(content)
    root.setContentsMargins(24, 22, 24, 24)
    root.setSpacing(16)
    return root


class _PlannedModule(QWidget):
    """Kerangka halaman modul yang belum aktif."""

    version = "V1.x"
    heading = "Modul"
    summary = ""
    features: tuple[str, ...] = ()

    def __init__(self, db: Database, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.db = db
        self._theme: ThemeTokens = DARK
        root = _scrollable(self)

        banner = Card("", soft=True, padding=18)
        banner.setObjectName("Banner")
        banner_layout = QHBoxLayout()
        banner_layout.setSpacing(14)
        text_column = QVBoxLayout()
        text_column.setSpacing(3)
        heading = label(self.heading, "SectionTitle")
        heading.setStyleSheet("font-size: 16px;")
        summary = label(self.summary, "Muted", wrap=True)
        text_column.addWidget(heading)
        text_column.addWidget(summary)
        banner_layout.addLayout(text_column, 1)
        banner_layout.addWidget(Pill(self.version, "planned"), 0, Qt.AlignTop)
        banner.add_layout(banner_layout)
        root.addWidget(banner)

        features_card = Card("Rencana Fitur", f"target {self.version}")
        for feature in self.features:
            features_card.add(BulletItem(feature, "#5B8CFF"))
        features_card.body.addStretch(1)
        root.addWidget(features_card)

        principle = Card("Prinsip Eksekusi", "aman secara default")
        principle.add(
            label(
                "Semua aksi massal (sinkronisasi, pemindahan, penghapusan duplikat) akan "
                "menampilkan pratinjau dampak terlebih dahulu dan menyediakan undo selama "
                "masa retensi yang dapat dikonfigurasi.",
                "BodyText",
                wrap=True,
            )
        )
        root.addWidget(principle)

        roadmap_card = Card("Roadmap", "urutan rilis yang direncanakan")
        for item in ROADMAP:
            row = QWidget()
            row_layout = QHBoxLayout(row)
            row_layout.setContentsMargins(0, 4, 0, 4)
            row_layout.setSpacing(10)
            row_layout.addWidget(Pill(item["version"], "active" if item["status"] == "active" else "planned"))
            text = QVBoxLayout()
            text.setSpacing(1)
            text.addWidget(label(item["title"], "StrongText"))
            text.addWidget(label(item["detail"], "Dim", wrap=True))
            row_layout.addLayout(text, 1)
            roadmap_card.add(row)
        roadmap_card.body.addStretch(1)
        root.addWidget(roadmap_card)
        root.addStretch(1)

    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme

    def refresh(self) -> None:
        pass


class SyncCenterPage(_PlannedModule):
    version = "V1.4"
    heading = "Sync Center"
    summary = (
        "Sinkronisasi otomatis dan manual antara folder sumber dan folder tujuan. "
        "V1.0 baru menyiapkan fondasi indeks, sehingga eksekusi belum diaktifkan."
    )
    features = (
        "Sinkronisasi satu arah (mirror) dan dua arah dengan resolusi konflik.",
        "Pemantauan real-time memakai Watchdog untuk folder yang dipilih.",
        "Penjadwalan (interval, harian) dan sinkronisasi manual sekali klik.",
        "Log sinkronisasi per file dengan status berhasil, dilewati, atau konflik.",
    )


class DuplicatesPage(QWidget):
    def __init__(self, db: Database, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.db = db
        self._theme: ThemeTokens = DARK
        root = _scrollable(self)

        banner = Card("", soft=True, padding=18)
        banner.setObjectName("Banner")
        banner_layout = QHBoxLayout()
        banner_layout.setSpacing(14)
        column = QVBoxLayout()
        column.setSpacing(3)
        heading = label("Duplicate Manager", "SectionTitle")
        heading.setStyleSheet("font-size: 16px;")
        column.addWidget(heading)
        column.addWidget(
            label(
                "Deteksi awal pada V1.0 memakai kombinasi nama dan ukuran file. "
                "Deteksi berbasis hash SHA-256 dan pratinjau penghapusan menyusul di V1.5.",
                "Muted",
                wrap=True,
            )
        )
        banner_layout.addLayout(column, 1)
        banner_layout.addWidget(Pill("V1.5", "planned"), 0, Qt.AlignTop)
        banner.add_layout(banner_layout)
        root.addWidget(banner)

        cards = QHBoxLayout()
        cards.setSpacing(16)
        self._card_groups = StatCard("GRUP DUPLIKAT", "0", "nama + ukuran identik", "duplicates", "#FBBF24")
        self._card_files = StatCard("FILE BERULANG", "0", "kandidat duplikat", "explorer", "#F97316")
        self._card_wasted = StatCard("POTENSI HEMAT", "0 B", "jika duplikat dihapus (V1.5)", "database", "#34D399")
        for card in (self._card_groups, self._card_files, self._card_wasted):
            cards.addWidget(card, 1)
        root.addLayout(cards)

        table_card = Card("Kandidat Duplikat", "diurutkan dari potensi penghematan terbesar")
        self._table = QTableWidget(0, 4)
        self._table.setHorizontalHeaderLabels(["Nama file", "Ukuran", "Jumlah salinan", "Potensi hemat"])
        self._table.verticalHeader().setVisible(False)
        self._table.setShowGrid(False)
        self._table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self._table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self._table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self._table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeToContents)
        self._table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeToContents)
        self._table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeToContents)
        self._table.setMinimumHeight(320)
        self._empty = EmptyState(
            "Tidak ada kandidat duplikat",
            "Jalankan pemindaian terlebih dahulu, atau memang tidak ada file dengan nama dan ukuran sama.",
            "duplicates",
            "#34D399",
        )
        table_card.add(self._table, 1)
        table_card.add(self._empty)
        root.addWidget(table_card)

        note = Card("Batasan V1.0", "transparansi metode")
        note.add(
            label(
                "Pencocokan nama + ukuran bisa menghasilkan positif palsu (misalnya dua file "
                "berbeda dengan nama sama). Karena itu V1.0 tidak menyediakan tombol hapus; "
                "verifikasi hash akan ditambahkan pada V1.5.",
                "BodyText",
                wrap=True,
            )
        )
        root.addWidget(note)
        root.addStretch(1)

        self.refresh()

    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme
        self.refresh()

    def refresh(self) -> None:
        if self.db.closed:
            return
        summary = self.db.duplicate_summary()
        self._card_groups.set_value(human_count(summary["groups"]))
        self._card_files.set_value(human_count(summary["files"]))
        self._card_wasted.set_value(human_size(summary["wasted"]))

        groups = self.db.duplicate_groups(60)
        self._table.setRowCount(0)
        for row, record in enumerate(groups):
            self._table.insertRow(row)
            name_item = QTableWidgetItem(str(record["name"]))
            size_item = QTableWidgetItem(human_size(record["size"]))
            size_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            copies_item = QTableWidgetItem(human_count(record["copies"]))
            copies_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            wasted_item = QTableWidgetItem(human_size(record["wasted"]))
            wasted_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self._table.setItem(row, 0, name_item)
            self._table.setItem(row, 1, size_item)
            self._table.setItem(row, 2, copies_item)
            self._table.setItem(row, 3, wasted_item)

        has_rows = bool(groups)
        self._table.setVisible(has_rows)
        self._empty.setVisible(not has_rows)


class HistoryPage(QWidget):
    def __init__(self, db: Database, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.db = db
        self._theme: ThemeTokens = DARK
        root = _scrollable(self)

        header = Card("", soft=True, padding=18)
        header.setObjectName("Banner")
        header_layout = QHBoxLayout()
        column = QVBoxLayout()
        column.setSpacing(3)
        heading = label("Activity Log", "SectionTitle")
        heading.setStyleSheet("font-size: 16px;")
        column.addWidget(heading)
        column.addWidget(
            label(
                "Audit aktivitas sistem: pemindaian, perubahan folder, dan pembuatan rencana. "
                "Version History per dokumen menyusul pada V1.6.",
                "Muted",
                wrap=True,
            )
        )
        header_layout.addLayout(column, 1)
        header_layout.addWidget(Pill("V1.6", "planned"), 0, Qt.AlignTop)
        header.add_layout(header_layout)
        root.addWidget(header)

        self._stats_card = Card("Ringkasan", "kondisi indeks saat ini")
        self._row_files = InfoRow("File terindeks", "0")
        self._row_roots = InfoRow("Folder sumber", "0")
        self._row_size = InfoRow("Total ukuran", "0 B")
        self._row_scan = InfoRow("Pemindaian terakhir", "-")
        for row in (self._row_files, self._row_roots, self._row_size, self._row_scan):
            self._stats_card.add(row)
        root.addWidget(self._stats_card)

        log_card = Card("Riwayat Aktivitas", "50 entri terakhir")
        refresh_button = QPushButton("Muat ulang")
        refresh_button.setObjectName("Ghost")
        refresh_button.setCursor(Qt.PointingHandCursor)
        refresh_button.clicked.connect(self.refresh)
        log_card.add_trailing(refresh_button)
        self._feed = ActivityFeed(max_items=50)
        log_card.add(self._feed)
        root.addWidget(log_card)

        planned = Card("Version History & Document Relationship", "direncanakan V1.6")
        for feature in (
            "Snapshot versi dokumen setiap kali file berubah.",
            "Perbandingan versi dan pemulihan ke versi sebelumnya.",
            "Graf keterkaitan dokumen berdasarkan isi dan referensi.",
        ):
            planned.add(BulletItem(feature, "#A855F7"))
        planned.body.addStretch(1)
        root.addWidget(planned)
        root.addStretch(1)

        self.refresh()

    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme
        self.refresh()

    def refresh(self) -> None:
        if self.db.closed:
            return
        from ...utils import format_timestamp

        stats = self.db.stats()
        self._row_files.set_value(human_count(stats["files"]))
        self._row_roots.set_value(human_count(stats["roots"]))
        self._row_size.set_value(human_size(stats["total_size"]))
        self._row_scan.set_value(format_timestamp(stats["last_scan_at"]))
        self._feed.set_theme(self._theme)
        self._feed.set_items(self.db.recent_activity(50))
