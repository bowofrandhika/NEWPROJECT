"""Jendela utama SmartFile Organizer: top bar, sidebar, dan stacked pages."""

from __future__ import annotations

from PySide6.QtCore import Qt
from PySide6.QtGui import QKeySequence, QShortcut
from PySide6.QtWidgets import (
    QApplication,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QStackedWidget,
    QVBoxLayout,
    QWidget,
)

from ..constants import APP_NAME, APP_TAGLINE
from ..database import Database
from ..icons import icon
from ..theme import ThemeTokens, build_stylesheet, get_theme
from .pages.classifier_page import ClassifierPage
from .pages.dashboard_page import DashboardPage
from .pages.explorer_page import ExplorerPage
from .pages.organizer_page import OrganizerPage
from .pages.roadmap_page import DuplicatesPage, HistoryPage, SyncCenterPage
from .pages.scanner_page import ScannerPage
from .pages.settings_page import SettingsPage
from .widgets.sidebar import NAV_ITEMS, Sidebar

PAGE_META: dict[str, tuple[str, str]] = {
    "dashboard": ("Dashboard", "Ringkasan aktivitas file, penyimpanan, dan klasifikasi"),
    "scanner": ("File Scanner", "Pemindaian folder sumber dengan progres real-time"),
    "explorer": ("File Explorer", "Telusuri direktori sumber dan file terindeks"),
    "classifier": ("AI Classification", "Rule engine aktif — lapisan AI menyusul di V1.1"),
    "organizer": ("Folder Generator", "Susun rencana struktur folder sebelum eksekusi"),
    "sync": ("Sync Center", "Sinkronisasi otomatis dan manual — V1.4"),
    "duplicates": ("Duplicate Manager", "Deteksi dini file duplikat — V1.5"),
    "history": ("Activity Log & History", "Audit aktivitas dan rencana version history"),
    "settings": ("Settings", "Tema, folder, opsi pemindaian, dan database"),
}

AUTO_COLLAPSE_WIDTH = 1180


class MainWindow(QMainWindow):
    def __init__(self, db: Database, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.db = db
        self._theme: ThemeTokens = get_theme(db.get_setting("theme", "dark"))
        self._manual_sidebar = False
        self._pages: dict[str, QWidget] = {}

        self.setWindowTitle(f"{APP_NAME} — {APP_TAGLINE}")
        self.resize(1380, 880)
        self.setMinimumSize(940, 640)

        root = QWidget()
        root.setObjectName("Root")
        self.setCentralWidget(root)
        layout = QHBoxLayout(root)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        self.sidebar = Sidebar()
        self.sidebar.navigate.connect(self.navigate)
        layout.addWidget(self.sidebar)

        right = QWidget()
        right_layout = QVBoxLayout(right)
        right_layout.setContentsMargins(0, 0, 0, 0)
        right_layout.setSpacing(0)

        right_layout.addWidget(self._build_topbar())

        self.stack = QStackedWidget()
        right_layout.addWidget(self.stack, 1)
        layout.addWidget(right, 1)

        self._register_pages()
        self.navigate("dashboard")
        self._apply_theme(self._theme.name, persist=False)
        self._install_shortcuts()

    # ----------------------------------------------------------------- topbar
    def _build_topbar(self) -> QWidget:
        bar = QWidget()
        bar.setObjectName("TopBar")
        bar.setFixedHeight(72)
        layout = QHBoxLayout(bar)
        layout.setContentsMargins(18, 10, 20, 10)
        layout.setSpacing(12)

        self._menu_button = QPushButton()
        self._menu_button.setObjectName("IconButton")
        self._menu_button.setCursor(Qt.PointingHandCursor)
        self._menu_button.setFixedSize(36, 36)
        self._menu_button.setToolTip("Lipat sidebar")
        self._menu_button.clicked.connect(self.toggle_sidebar)

        titles = QVBoxLayout()
        titles.setSpacing(1)
        titles.setContentsMargins(0, 0, 0, 0)
        self._title = QLabel("Dashboard")
        self._title.setObjectName("PageTitle")
        self._subtitle = QLabel("")
        self._subtitle.setObjectName("PageSubtitle")
        titles.addWidget(self._title)
        titles.addWidget(self._subtitle)

        self._search = QLineEdit()
        self._search.setPlaceholderText("Cari file...  (Ctrl+F)")
        self._search.setClearButtonEnabled(True)
        self._search.setFixedWidth(280)
        self._search.setMinimumHeight(36)
        self._search.returnPressed.connect(self._run_search)
        self._search.textChanged.connect(self._on_search_text)

        self._theme_button = QPushButton()
        self._theme_button.setObjectName("IconButton")
        self._theme_button.setCursor(Qt.PointingHandCursor)
        self._theme_button.setFixedSize(36, 36)
        self._theme_button.setToolTip("Ganti tema (Ctrl+Shift+T)")
        self._theme_button.clicked.connect(self.toggle_theme)

        self._settings_button = QPushButton()
        self._settings_button.setObjectName("IconButton")
        self._settings_button.setCursor(Qt.PointingHandCursor)
        self._settings_button.setFixedSize(36, 36)
        self._settings_button.setToolTip("Settings")
        self._settings_button.clicked.connect(lambda: self.navigate("settings"))

        layout.addWidget(self._menu_button)
        layout.addLayout(titles)
        layout.addStretch(1)
        layout.addWidget(self._search)
        layout.addWidget(self._theme_button)
        layout.addWidget(self._settings_button)
        return bar

    # ------------------------------------------------------------------ pages
    def _register_pages(self) -> None:
        self.dashboard = DashboardPage(self.db)
        self.scanner = ScannerPage(self.db)
        self.explorer = ExplorerPage(self.db)
        self.classifier = ClassifierPage(self.db)
        self.organizer = OrganizerPage(self.db)
        self.sync = SyncCenterPage(self.db)
        self.duplicates = DuplicatesPage(self.db)
        self.history = HistoryPage(self.db)
        self.settings = SettingsPage(self.db)

        mapping = {
            "dashboard": self.dashboard,
            "scanner": self.scanner,
            "explorer": self.explorer,
            "classifier": self.classifier,
            "organizer": self.organizer,
            "sync": self.sync,
            "duplicates": self.duplicates,
            "history": self.history,
            "settings": self.settings,
        }
        for key, page in mapping.items():
            self._pages[key] = page
            self.stack.addWidget(page)

        self.dashboard.navigate.connect(self.navigate)
        self.scanner.navigate.connect(self.navigate)
        self.scanner.data_changed.connect(self._on_data_changed)
        self.settings.data_changed.connect(self._on_data_changed)
        self.settings.theme_changed.connect(self._apply_theme)

    def navigate(self, key: str) -> None:
        page = self._pages.get(key)
        if page is None:
            return
        self.stack.setCurrentWidget(page)
        self.sidebar.set_active(key)
        title, subtitle = PAGE_META.get(key, (APP_NAME, ""))
        self._title.setText(title)
        self._subtitle.setText(subtitle)
        if hasattr(page, "refresh"):
            page.refresh()

    def _on_data_changed(self) -> None:
        if self.db.closed:
            return
        for page in (self.dashboard, self.scanner, self.explorer, self.duplicates, self.history):
            if hasattr(page, "refresh"):
                page.refresh()

    # ------------------------------------------------------------------ theme
    def _apply_theme(self, name: str, persist: bool = True) -> None:
        self._theme = get_theme(name)
        if persist:
            self.db.set_setting("theme", self._theme.name)
        application = QApplication.instance()
        if application is not None:
            application.setStyleSheet(build_stylesheet(self._theme))

        self.sidebar.set_theme(self._theme)
        self._menu_button.setIcon(icon("menu", self._theme.text_muted, 20))
        theme_icon = "sun" if self._theme.is_dark else "moon"
        self._theme_button.setIcon(icon(theme_icon, self._theme.text_muted, 19))
        self._theme_button.setToolTip(
            "Aktifkan Light Mode" if self._theme.is_dark else "Aktifkan Dark Mode"
        )
        self._settings_button.setIcon(icon("settings", self._theme.text_muted, 19))

        for page in self._pages.values():
            if hasattr(page, "set_theme"):
                page.set_theme(self._theme)
        if hasattr(self, "settings") and self.settings.isVisible():
            self.settings.refresh()

    def toggle_theme(self) -> None:
        target = "light" if self._theme.is_dark else "dark"
        self._apply_theme(target)
        self.db.log_activity("Tema diperbarui", target, "info")

    # ---------------------------------------------------------------- layout
    def toggle_sidebar(self) -> None:
        self.sidebar.toggle_collapsed()
        self._manual_sidebar = True

    def resizeEvent(self, event) -> None:  # noqa: N802
        super().resizeEvent(event)
        if self._manual_sidebar:
            return
        self.sidebar.set_collapsed(self.width() < AUTO_COLLAPSE_WIDTH)

    # ----------------------------------------------------------------- search
    def _on_search_text(self, text: str) -> None:
        if not text.strip():
            return
        if self.stack.currentWidget() is not self.explorer:
            self.navigate("explorer")
        self.explorer.set_search(text)

    def _run_search(self) -> None:
        text = self._search.text().strip()
        self.navigate("explorer")
        self.explorer.set_search(text)

    # -------------------------------------------------------------- shortcuts
    def _install_shortcuts(self) -> None:
        for index, (key, _text, _icon) in enumerate(NAV_ITEMS, start=1):
            shortcut = QShortcut(QKeySequence(f"Ctrl+{index}"), self)
            shortcut.activated.connect(lambda target=key: self.navigate(target))

        QShortcut(QKeySequence.Find, self).activated.connect(self._focus_search)
        QShortcut(QKeySequence.Refresh, self).activated.connect(self._refresh_current)
        QShortcut(QKeySequence("Ctrl+Shift+T"), self).activated.connect(self.toggle_theme)
        QShortcut(QKeySequence("Ctrl+B"), self).activated.connect(self.toggle_sidebar)

    def _focus_search(self) -> None:
        self._search.setFocus()
        self._search.selectAll()

    def _refresh_current(self) -> None:
        page = self.stack.currentWidget()
        if hasattr(page, "refresh"):
            page.refresh()

    # ------------------------------------------------------------------ close
    def closeEvent(self, event) -> None:  # noqa: N802
        worker = getattr(self.scanner, "_worker", None)
        if worker is not None and worker.isRunning():
            answer = QMessageBox.question(
                self,
                "Pemindaian masih berjalan",
                "Pemindaian sedang berlangsung. Hentikan dan keluar?",
            )
            if answer != QMessageBox.Yes:
                event.ignore()
                return
            worker.request_stop()
            worker.wait(3000)
        self.db.close()
        super().closeEvent(event)
