"""Dashboard: ringkasan aktivitas file, penyimpanan, dan klasifikasi."""

from __future__ import annotations

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QHBoxLayout,
    QProgressBar,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from ...constants import CATEGORY_COLORS
from ...database import Database
from ...theme import DARK, ThemeTokens
from ...utils import format_timestamp, human_count, human_size
from ..widgets.activity import ActivityFeed
from ..widgets.charts import CategoryBreakdown, DonutChart
from ..widgets.common import Card, EmptyState, InfoRow, StatCard, clear_layout, label
from ..widgets.flow_layout import FlowLayout


class DashboardPage(QWidget):
    navigate = Signal(str)

    def __init__(self, db: Database, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.db = db
        self._theme: ThemeTokens = DARK

        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QScrollArea.NoFrame)
        outer.addWidget(scroll)

        content = QWidget()
        content.setObjectName("DashboardContent")
        scroll.setWidget(content)

        root = QVBoxLayout(content)
        root.setContentsMargins(24, 22, 24, 24)
        root.setSpacing(16)

        self._banner = self._build_banner()
        root.addWidget(self._banner)

        self._card_files = StatCard(
            "TOTAL FILES", "0", "belum ada folder sumber", "explorer", "#4F8CFF"
        )
        self._card_classified = StatCard(
            "CLASSIFIED", "0", "0% oleh rule engine", "classifier", "#22C55E"
        )
        self._card_duplicates = StatCard(
            "POTENTIAL DUPLICATES", "0", "deteksi nama + ukuran", "duplicates", "#FBBF24"
        )
        self._card_storage = StatCard(
            "STORAGE INDEXED", "0 B", "belum ada pemindaian", "database", "#A855F7"
        )

        self._stats_flow = FlowLayout(h_spacing=16, v_spacing=16)
        for card in (
            self._card_files,
            self._card_classified,
            self._card_duplicates,
            self._card_storage,
        ):
            self._stats_flow.addWidget(card)
        root.addLayout(self._stats_flow)

        # --- baris grafik + aktivitas -------------------------------------
        middle = QHBoxLayout()
        middle.setSpacing(16)

        self._storage_card = Card("Storage Analytics", "distribusi ukuran per kategori")
        storage_body = QHBoxLayout()
        storage_body.setSpacing(18)
        self._donut = DonutChart()
        self._breakdown = CategoryBreakdown()
        storage_body.addWidget(self._donut, 3)
        breakdown_holder = QWidget()
        breakdown_layout = QVBoxLayout(breakdown_holder)
        breakdown_layout.setContentsMargins(0, 0, 0, 0)
        breakdown_layout.addWidget(self._breakdown)
        breakdown_layout.addStretch(1)
        storage_body.addWidget(breakdown_holder, 4)
        self._storage_card.add_layout(storage_body)
        self._storage_card.setMinimumHeight(300)
        middle.addWidget(self._storage_card, 5)

        self._activity_card = Card("Recent Activities", "audit aktivitas terakhir")
        self._activity_card.body.setContentsMargins(0, 0, 0, 0)
        see_all = QPushButton("Lihat semua")
        see_all.setObjectName("Ghost")
        see_all.setCursor(Qt.PointingHandCursor)
        see_all.clicked.connect(lambda: self.navigate.emit("history"))
        self._activity_card.add_trailing(see_all)
        self._activity_feed = ActivityFeed(max_items=7)
        activity_scroll = QScrollArea()
        activity_scroll.setWidgetResizable(True)
        activity_scroll.setFrameShape(QScrollArea.NoFrame)
        activity_scroll.setWidget(self._activity_feed)
        self._activity_card.add(activity_scroll, 1)
        self._activity_card.setMinimumHeight(300)
        middle.addWidget(self._activity_card, 4)
        root.addLayout(middle)

        # --- baris klasifikasi + folder terbesar --------------------------
        bottom = QHBoxLayout()
        bottom.setSpacing(16)

        self._coverage_card = Card("Classification Coverage", "rule engine V1.0")
        self._coverage_percent = label("0%", "CardValue")
        self._coverage_bar = QProgressBar()
        self._coverage_bar.setRange(0, 100)
        self._coverage_bar.setValue(0)
        self._coverage_bar.setTextVisible(False)
        self._classified_row = InfoRow("Terkategori", "0")
        self._unclassified_row = InfoRow("Belum dikenali", "0")
        self._last_scan_row = InfoRow("Pemindaian terakhir", "-")
        self._coverage_card.add(self._coverage_percent)
        self._coverage_card.add(self._coverage_bar)
        self._coverage_card.add(self._classified_row)
        self._coverage_card.add(self._unclassified_row)
        self._coverage_card.add(self._last_scan_row)
        self._coverage_card.body.addStretch(1)
        bottom.addWidget(self._coverage_card, 2)

        self._folders_card = Card("Folder Terbesar", "berdasarkan total ukuran")
        self._folders_holder = QVBoxLayout()
        self._folders_holder.setSpacing(10)
        self._folders_card.add_layout(self._folders_holder)
        self._folders_card.body.addStretch(1)
        self._folders_card.setMinimumHeight(220)
        bottom.addWidget(self._folders_card, 3)

        self._scans_card = Card("Scan Terakhir", "riwayat pemindaian")
        self._scans_holder = QVBoxLayout()
        self._scans_holder.setSpacing(10)
        self._scans_card.add_layout(self._scans_holder)
        self._scans_card.body.addStretch(1)
        self._scans_card.setMinimumHeight(220)
        bottom.addWidget(self._scans_card, 3)

        root.addLayout(bottom)
        root.addStretch(1)

        self.refresh()

    # ------------------------------------------------------------------ build
    def _build_banner(self) -> QWidget:
        banner = Card(soft=True, padding=16)
        banner.setObjectName("Banner")
        banner_layout = QHBoxLayout()
        banner_layout.setSpacing(14)

        text_column = QVBoxLayout()
        text_column.setSpacing(2)
        self._banner_title = label("Mulai dengan menambahkan folder sumber", "SectionTitle")
        self._banner_text = label(
            "SmartFile Organizer tidak memindahkan file apa pun tanpa persetujuan Anda. "
            "Tambahkan folder, jalankan pemindaian, lalu tinjau hasil klasifikasinya.",
            "Muted",
            wrap=True,
        )
        text_column.addWidget(self._banner_title)
        text_column.addWidget(self._banner_text)

        self._banner_button = QPushButton("Tambah folder sumber")
        self._banner_button.setObjectName("Primary")
        self._banner_button.setCursor(Qt.PointingHandCursor)
        self._banner_button.clicked.connect(lambda: self.navigate.emit("settings"))

        self._banner_secondary = QPushButton("Buka File Scanner")
        self._banner_secondary.setObjectName("Ghost")
        self._banner_secondary.setCursor(Qt.PointingHandCursor)
        self._banner_secondary.clicked.connect(lambda: self.navigate.emit("scanner"))

        actions = QVBoxLayout()
        actions.setSpacing(6)
        actions.addWidget(self._banner_button)
        actions.addWidget(self._banner_secondary)

        banner_layout.addLayout(text_column, 1)
        banner_layout.addLayout(actions, 0)
        banner.add_layout(banner_layout)
        return banner

    # ---------------------------------------------------------------- actions
    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme
        self._donut.set_theme(theme)
        self._breakdown.set_theme(theme)
        self._activity_feed.set_theme(theme)
        self.refresh()

    def refresh(self) -> None:
        if self.db.closed:
            return
        stats = self.db.stats()
        files = stats["files"]
        classified = stats["classified"]
        duplicates = stats["duplicates"]
        roots = stats["roots"]

        self._card_files.set_value(
            human_count(files),
            f"dari {roots} folder sumber" if roots else "belum ada folder sumber",
        )
        percent = (classified / files * 100) if files else 0.0
        self._card_classified.set_value(human_count(classified), f"{percent:.0f}% oleh rule engine")
        self._card_duplicates.set_value(
            human_count(duplicates["groups"]),
            f"{human_count(duplicates['files'])} file • {human_size(duplicates['wasted'])} potensi hemat",
        )
        self._card_storage.set_value(
            human_size(stats["total_size"]),
            f"scan terakhir {format_timestamp(stats['last_scan_at'])}"
            if stats["last_scan_at"]
            else "belum ada pemindaian",
        )

        categories = [
            {
                "label": item["category"],
                "color": CATEGORY_COLORS.get(item["category"], "#94A3B8"),
                "count": item["count"],
                "size": item["size"],
            }
            for item in stats["categories"]
        ]
        self._donut.set_data(categories)
        self._breakdown.set_data(categories)

        self._coverage_percent.setText(f"{percent:.0f}%")
        self._coverage_bar.setValue(int(round(percent)))
        self._classified_row.set_value(human_count(classified))
        self._unclassified_row.set_value(human_count(stats["unclassified"]))
        self._last_scan_row.set_value(format_timestamp(stats["last_scan_at"]))

        self._activity_feed.set_theme(self._theme)
        self._activity_feed.set_items(self.db.recent_activity(7))

        self._fill_folders(self.db.largest_folders(4))
        self._fill_scans(self.db.recent_scans(3))

        has_files = files > 0
        self._banner.setVisible(not has_files)
        if roots and not has_files:
            self._banner_title.setText("Folder sumber sudah siap — jalankan pemindaian")
            self._banner_text.setText(
                "Database masih kosong. Buka File Scanner untuk mengindeks isi folder sumber "
                "dan melihat klasifikasi awal."
            )
            self._banner_button.setText("Buka File Scanner")

    # ----------------------------------------------------------------- helpers
    def _clear(self, layout) -> None:
        clear_layout(layout)

    def _fill_folders(self, folders: list[dict]) -> None:
        self._clear(self._folders_holder)
        if not folders:
            self._folders_holder.addWidget(EmptyState("Belum ada folder", "Folder muncul setelah pemindaian.", "folder", "#94A3B8"))
            return
        for record in folders:
            row = QWidget()
            row_layout = QHBoxLayout(row)
            row_layout.setContentsMargins(0, 0, 0, 0)
            row_layout.setSpacing(10)
            name = str(record["folder"]).rstrip("/\\").split("/")[-1].split("\\")[-1] or record["folder"]
            name_label = label(name, "StrongText")
            name_label.setToolTip(str(record["folder"]))
            meta = label(f"{human_count(record['count'])} file", "Muted")
            size = label(human_size(record["size"]), "BodyText")
            row_layout.addWidget(name_label, 1)
            row_layout.addWidget(meta)
            row_layout.addWidget(size)
            self._folders_holder.addWidget(row)

    def _fill_scans(self, scans: list[dict]) -> None:
        self._clear(self._scans_holder)
        if not scans:
            self._scans_holder.addWidget(EmptyState("Belum ada pemindaian", "Riwayat scan tampil di sini.", "history", "#94A3B8"))
            return
        for scan in scans:
            row = QWidget()
            row_layout = QVBoxLayout(row)
            row_layout.setContentsMargins(0, 0, 0, 0)
            row_layout.setSpacing(1)
            path = str(scan.get("root_path", ""))
            title = label(path.rstrip("/\\").split("/")[-1].split("\\")[-1] or path, "StrongText")
            title.setToolTip(path)
            status = scan.get("status", "running")
            detail = label(
                f"{human_count(scan.get('files_found', 0))} file • {human_size(scan.get('total_size', 0))} • {status}",
                "Muted",
            )
            row_layout.addWidget(title)
            row_layout.addWidget(detail)
            self._scans_holder.addWidget(row)
