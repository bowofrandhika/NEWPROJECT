"""Tema Adaptive Interface: Dark Mode & Light Mode.

Semua warna berasal dari token di satu tempat, sehingga penambahan tema baru
cukup menambah satu entri di `THEMES`.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ThemeTokens:
    name: str
    label: str
    is_dark: bool
    bg: str
    sidebar: str
    surface: str
    surface_alt: str
    surface_hover: str
    border: str
    border_strong: str
    text: str
    text_muted: str
    text_dim: str
    accent: str
    accent_hover: str
    accent_soft: str
    accent_text: str
    success: str
    warning: str
    danger: str


DARK = ThemeTokens(
    name="dark",
    label="Dark Mode",
    is_dark=True,
    bg="#0E1119",
    sidebar="#121623",
    surface="#161B28",
    surface_alt="#1C2231",
    surface_hover="#222A3B",
    border="#232B3D",
    border_strong="#2E3850",
    text="#E8ECF5",
    text_muted="#98A2B8",
    text_dim="#6B768F",
    accent="#5B8CFF",
    accent_hover="#7099FF",
    accent_soft="rgba(91, 140, 255, 0.16)",
    accent_text="#BFD1FF",
    success="#34D399",
    warning="#FBBF24",
    danger="#F87171",
)

LIGHT = ThemeTokens(
    name="light",
    label="Light Mode",
    is_dark=False,
    bg="#F4F6FB",
    sidebar="#FFFFFF",
    surface="#FFFFFF",
    surface_alt="#F3F6FC",
    surface_hover="#EAF0FB",
    border="#E2E8F2",
    border_strong="#CBD5E6",
    text="#111827",
    text_muted="#5B6577",
    text_dim="#8A94A6",
    accent="#2F6BFF",
    accent_hover="#1F5BEF",
    accent_soft="rgba(47, 107, 255, 0.10)",
    accent_text="#1D4ED8",
    success="#059669",
    warning="#D97706",
    danger="#DC2626",
)

THEMES: dict[str, ThemeTokens] = {"dark": DARK, "light": LIGHT}


def get_theme(name: str) -> ThemeTokens:
    return THEMES.get((name or "dark").lower(), DARK)


def build_stylesheet(t: ThemeTokens) -> str:
    return f"""
#Root {{ background: {t.bg}; }}
#Sidebar {{ background: {t.sidebar}; border-right: 1px solid {t.border}; }}
#LogoMark {{ background: {t.accent}; border-radius: 11px; }}
#LogoText {{ color: #FFFFFF; font-size: 15px; font-weight: 800; }}
#AppName {{ color: {t.text}; font-size: 13px; font-weight: 700; }}
#AppTag {{ color: {t.text_dim}; font-size: 10px; }}
#VersionPill {{
    color: {t.accent_text}; background: {t.accent_soft};
    border-radius: 8px; padding: 3px 8px; font-size: 10px; font-weight: 700;
}}

QPushButton#NavButton {{
    background: transparent; border: none; border-radius: 10px;
    padding: 10px 12px; color: {t.text_muted}; text-align: left;
    font-size: 13px; font-weight: 600;
}}
QPushButton#NavButton:hover {{ background: {t.surface_hover}; color: {t.text}; }}
QPushButton#NavButton:checked {{ background: {t.accent_soft}; color: {t.accent}; }}
QPushButton#NavButton:disabled {{ color: {t.text_dim}; }}

#TopBar {{ background: {t.bg}; border-bottom: 1px solid {t.border}; }}
#PageTitle {{ color: {t.text}; font-size: 19px; font-weight: 700; }}
#PageSubtitle {{ color: {t.text_muted}; font-size: 11px; }}

QFrame#Card {{
    background: {t.surface}; border: 1px solid {t.border}; border-radius: 14px;
}}
QFrame#SoftCard {{
    background: {t.surface_alt}; border: 1px solid {t.border}; border-radius: 12px;
}}
QFrame#Banner {{
    background: {t.accent_soft}; border: 1px solid {t.border_strong}; border-radius: 12px;
}}
QFrame#Divider {{ background: {t.border}; border: none; max-height: 1px; }}

#CardTitle {{ color: {t.text_muted}; font-size: 11px; font-weight: 600; }}
#CardValue {{ color: {t.text}; font-size: 27px; font-weight: 700; }}
#CardHint {{ color: {t.text_dim}; font-size: 10px; }}
#SectionTitle {{ color: {t.text}; font-size: 14px; font-weight: 700; }}
#SectionHint {{ color: {t.text_muted}; font-size: 11px; }}
#Muted {{ color: {t.text_muted}; font-size: 11px; }}
#Dim {{ color: {t.text_dim}; font-size: 11px; }}
#BodyText {{ color: {t.text}; font-size: 12px; }}
#StrongText {{ color: {t.text}; font-size: 12px; font-weight: 600; }}
#AccentText {{ color: {t.accent}; font-size: 12px; font-weight: 600; }}
#Monospace {{ color: {t.text_muted}; font-family: "Consolas", "Menlo", monospace; font-size: 11px; }}

#Badge {{
    color: {t.text_muted}; background: {t.surface_alt}; border: 1px solid {t.border};
    border-radius: 8px; padding: 3px 8px; font-size: 10px; font-weight: 600;
}}
#BadgeActive {{
    color: {t.success}; background: {t.surface_alt};
    border: 1px solid {t.success}; border-radius: 8px;
    padding: 3px 8px; font-size: 10px; font-weight: 700;
}}
#BadgePlanned {{
    color: {t.text_muted}; background: {t.surface_alt};
    border: 1px dashed {t.border_strong}; border-radius: 8px;
    padding: 3px 8px; font-size: 10px; font-weight: 600;
}}

QPushButton#Primary {{
    background: {t.accent}; color: #FFFFFF; border: none; border-radius: 9px;
    padding: 9px 18px; font-size: 12px; font-weight: 700;
}}
QPushButton#Primary:hover {{ background: {t.accent_hover}; }}
QPushButton#Primary:disabled {{ background: {t.border_strong}; color: {t.text_dim}; }}

QPushButton#Ghost {{
    background: transparent; border: 1px solid {t.border_strong}; border-radius: 9px;
    padding: 8px 14px; color: {t.text}; font-size: 12px; font-weight: 600;
}}
QPushButton#Ghost:hover {{ background: {t.surface_hover}; }}
QPushButton#Ghost:disabled {{ color: {t.text_dim}; border-color: {t.border}; }}

QPushButton#Danger {{
    background: transparent; border: 1px solid {t.danger}; border-radius: 9px;
    padding: 8px 14px; color: {t.danger}; font-size: 12px; font-weight: 600;
}}
QPushButton#Danger:hover {{ background: rgba(248, 113, 113, 0.12); }}

QPushButton#SegButton {{
    background: transparent; border: none; border-radius: 7px;
    padding: 7px 14px; color: {t.text_muted}; font-size: 12px; font-weight: 600;
}}
QPushButton#SegButton:checked {{ background: {t.surface}; color: {t.text}; }}
QPushButton#SegButton:hover {{ color: {t.text}; }}
#Segmented {{ background: {t.surface_alt}; border: 1px solid {t.border}; border-radius: 9px; }}

QToolButton#IconButton {{
    background: transparent; border: none; border-radius: 9px; padding: 6px;
}}
QToolButton#IconButton:hover {{ background: {t.surface_hover}; }}

QLineEdit, QComboBox, QSpinBox {{
    background: {t.surface_alt}; border: 1px solid {t.border}; border-radius: 9px;
    padding: 8px 11px; color: {t.text}; font-size: 12px;
    selection-background-color: {t.accent}; selection-color: #FFFFFF;
}}
QLineEdit:focus, QComboBox:focus, QSpinBox:focus {{ border: 1px solid {t.accent}; }}
QLineEdit:disabled, QComboBox:disabled, QSpinBox:disabled {{
    color: {t.text_dim}; background: {t.surface};
}}
QComboBox::drop-down {{ border: none; width: 22px; }}
QComboBox QAbstractItemView {{
    background: {t.surface}; color: {t.text}; border: 1px solid {t.border};
    selection-background-color: {t.accent_soft}; outline: none; padding: 4px;
}}
QSpinBox::up-button, QSpinBox::down-button {{ width: 14px; border: none; }}

QCheckBox {{ color: {t.text}; font-size: 12px; spacing: 8px; }}
QCheckBox::indicator {{
    width: 16px; height: 16px; border-radius: 5px;
    border: 1px solid {t.border_strong}; background: {t.surface_alt};
}}
QCheckBox::indicator:checked {{ background: {t.accent}; border: 1px solid {t.accent}; }}

QProgressBar {{
    background: {t.surface_alt}; border: none; border-radius: 5px;
    height: 8px; text-align: center; color: transparent;
}}
QProgressBar::chunk {{ background: {t.accent}; border-radius: 5px; }}

QTableWidget, QTableView {{
    background: transparent; border: none; color: {t.text};
    font-size: 12px; gridline-color: {t.border};
    selection-background-color: {t.accent_soft}; selection-color: {t.text};
}}
QHeaderView::section {{
    background: {t.surface_alt}; color: {t.text_muted};
    border: none; border-bottom: 1px solid {t.border};
    padding: 8px 10px; font-size: 11px; font-weight: 700;
}}
QTableWidget::item {{ padding: 6px 8px; border-bottom: 1px solid {t.border}; }}
QTableCornerButton::section {{ background: {t.surface_alt}; border: none; }}

QTreeWidget {{
    background: transparent; border: none; color: {t.text}; font-size: 12px;
    outline: none;
}}
QTreeWidget::item {{ padding: 5px 4px; border-radius: 6px; }}
QTreeWidget::item:hover {{ background: {t.surface_hover}; }}
QTreeWidget::item:selected {{ background: {t.accent_soft}; color: {t.accent}; }}

QListWidget {{ background: transparent; border: none; color: {t.text}; outline: none; }}
QListWidget::item {{
    background: {t.surface_alt}; border: 1px solid {t.border}; border-radius: 10px;
    padding: 8px; margin: 3px 0px;
}}
QListWidget::item:selected {{ border: 1px solid {t.accent}; color: {t.text}; }}

QScrollArea {{ background: transparent; border: none; }}
QScrollArea > QWidget > QWidget {{ background: transparent; }}

QScrollBar:vertical {{ background: transparent; width: 10px; margin: 2px; }}
QScrollBar::handle:vertical {{
    background: {t.border_strong}; border-radius: 5px; min-height: 30px;
}}
QScrollBar::handle:vertical:hover {{ background: {t.text_dim}; }}
QScrollBar:horizontal {{ background: transparent; height: 10px; margin: 2px; }}
QScrollBar::handle:horizontal {{
    background: {t.border_strong}; border-radius: 5px; min-width: 30px;
}}
QScrollBar::add-line, QScrollBar::sub-line {{ height: 0; width: 0; }}
QScrollBar::add-page, QScrollBar::sub-page {{ background: transparent; }}

QSplitter::handle {{ background: {t.border}; }}
QSplitter::handle:hover {{ background: {t.accent}; }}
QSplitter::handle:horizontal {{ width: 1px; }}
QSplitter::handle:vertical {{ height: 1px; }}

QToolTip {{
    background: {t.surface}; color: {t.text}; border: 1px solid {t.border};
    padding: 6px 8px; border-radius: 6px;
}}
QMenu {{
    background: {t.surface}; color: {t.text}; border: 1px solid {t.border};
    border-radius: 10px; padding: 6px;
}}
QMenu::item {{ padding: 7px 18px; border-radius: 6px; font-size: 12px; }}
QMenu::item:selected {{ background: {t.accent_soft}; color: {t.text}; }}

QMessageBox {{ background: {t.surface}; }}
QMessageBox QLabel {{ color: {t.text}; font-size: 12px; }}
QStatusBar {{ background: {t.sidebar}; color: {t.text_muted}; }}
"""
