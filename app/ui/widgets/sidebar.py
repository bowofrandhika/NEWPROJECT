"""Sidebar navigasi yang bisa dilipat (mode ikon) pada lebar jendela kecil."""

from __future__ import annotations

from PySide6.QtCore import QSize, Qt, Signal
from PySide6.QtWidgets import (
    QButtonGroup,
    QFrame,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QSizePolicy,
    QVBoxLayout,
    QWidget,
)

from ...constants import APP_NAME, APP_TAGLINE, APP_VERSION
from ...icons import icon
from ...theme import DARK, ThemeTokens

NAV_ITEMS: tuple[tuple[str, str, str], ...] = (
    ("dashboard", "Dashboard", "dashboard"),
    ("scanner", "File Scanner", "scanner"),
    ("explorer", "File Explorer", "explorer"),
    ("classifier", "AI Classification", "classifier"),
    ("organizer", "Folder Generator", "organizer"),
    ("sync", "Sync Center", "sync"),
    ("duplicates", "Duplicates", "duplicates"),
    ("history", "History", "history"),
    ("settings", "Settings", "settings"),
)

EXPANDED_WIDTH = 252
COLLAPSED_WIDTH = 76


class Sidebar(QFrame):
    navigate = Signal(str)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("Sidebar")
        self._theme: ThemeTokens = DARK
        self._collapsed = False
        self._buttons: dict[str, QPushButton] = {}

        self.setFixedWidth(EXPANDED_WIDTH)
        root = QVBoxLayout(self)
        root.setContentsMargins(14, 18, 14, 16)
        root.setSpacing(6)

        root.addWidget(self._build_brand())
        root.addSpacing(14)

        self._group = QButtonGroup(self)
        self._group.setExclusive(True)
        for key, text, icon_name in NAV_ITEMS:
            button = QPushButton(text)
            button.setObjectName("NavButton")
            button.setCheckable(True)
            button.setCursor(Qt.PointingHandCursor)
            button.setIconSize(QSize(18, 18))
            button.setFixedHeight(42)
            button.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
            button.clicked.connect(lambda _checked=False, target=key: self.navigate.emit(target))
            self._group.addButton(button)
            self._buttons[key] = button
            root.addWidget(button)

        root.addStretch(1)
        root.addWidget(self._build_footer())

        self.set_theme(DARK)
        self.set_active("dashboard")

    # --------------------------------------------------------------- building
    def _build_brand(self) -> QWidget:
        brand = QWidget()
        layout = QHBoxLayout(brand)
        layout.setContentsMargins(2, 0, 2, 0)
        layout.setSpacing(11)

        mark = QFrame()
        mark.setObjectName("LogoMark")
        mark.setFixedSize(40, 40)
        mark_layout = QVBoxLayout(mark)
        mark_layout.setContentsMargins(0, 0, 0, 0)
        logo_text = QLabel("SF")
        logo_text.setObjectName("LogoText")
        logo_text.setAlignment(Qt.AlignCenter)
        mark_layout.addWidget(logo_text)

        self._brand_text = QWidget()
        text_layout = QVBoxLayout(self._brand_text)
        text_layout.setContentsMargins(0, 0, 0, 0)
        text_layout.setSpacing(0)
        name = QLabel(APP_NAME)
        name.setObjectName("AppName")
        tagline = QLabel("Smart file management")
        tagline.setObjectName("AppTag")
        tagline.setToolTip(APP_TAGLINE)
        text_layout.addWidget(name)
        text_layout.addWidget(tagline)

        layout.addWidget(mark)
        layout.addWidget(self._brand_text, 1)
        return brand

    def _build_footer(self) -> QWidget:
        footer = QWidget()
        layout = QHBoxLayout(footer)
        layout.setContentsMargins(2, 0, 2, 0)
        layout.setSpacing(8)
        self._version = QLabel(f"v{APP_VERSION} • SQLite")
        self._version.setObjectName("AppTag")
        layout.addWidget(self._version)
        layout.addStretch(1)
        return footer

    # ------------------------------------------------------------------ state
    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme
        for key, _text, icon_name in NAV_ITEMS:
            self._buttons[key].setIcon(icon(icon_name, theme.text_muted, 18))
        self._version.setStyleSheet(f"color: {theme.text_dim}; font-size: 10px;")
        self._refresh_checked_icon()

    def set_active(self, key: str) -> None:
        button = self._buttons.get(key)
        if button is None:
            return
        for other in self._buttons.values():
            other.setChecked(other is button)
        self._refresh_checked_icon()

    def _refresh_checked_icon(self) -> None:
        for key, _text, icon_name in NAV_ITEMS:
            button = self._buttons[key]
            color = self._theme.accent if button.isChecked() else self._theme.text_muted
            button.setIcon(icon(icon_name, color, 18))

    @property
    def collapsed(self) -> bool:
        return self._collapsed

    def set_collapsed(self, collapsed: bool) -> None:
        if collapsed == self._collapsed:
            return
        self._collapsed = collapsed
        self.setFixedWidth(COLLAPSED_WIDTH if collapsed else EXPANDED_WIDTH)
        self._brand_text.setVisible(not collapsed)
        self._version.setVisible(not collapsed)
        for key, text, _icon in NAV_ITEMS:
            button = self._buttons[key]
            button.setText("" if collapsed else text)
            button.setToolTip(text if collapsed else "")
            button.setStyleSheet(
                "QPushButton#NavButton { padding: 0px; text-align: center; }" if collapsed else ""
            )
            button.setIconSize(QSize(20 if collapsed else 18, 20 if collapsed else 18))
        if not collapsed:
            self.set_theme(self._theme)

    def toggle_collapsed(self) -> None:
        self.set_collapsed(not self._collapsed)
