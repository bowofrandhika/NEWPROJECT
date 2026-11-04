"""AI Classification: rule engine aktif dan rencana integrasi AI (V1.1)."""

from __future__ import annotations

from PySide6.QtCore import Qt
from PySide6.QtGui import QBrush, QColor
from PySide6.QtWidgets import (
    QAbstractItemView,
    QComboBox,
    QGridLayout,
    QHBoxLayout,
    QHeaderView,
    QLineEdit,
    QPushButton,
    QScrollArea,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from ...classification import RuleBasedClassifier
from ...constants import CATEGORY_COLORS, CATEGORY_NAMES, SAFETY_PRINCIPLE
from ...database import Database
from ...theme import DARK, ThemeTokens
from ...utils import human_count
from ..widgets.common import BulletItem, Card, Pill, label


class ClassifierPage(QWidget):
    def __init__(self, db: Database, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.db = db
        self._theme: ThemeTokens = DARK
        self._classifier = RuleBasedClassifier()

        outer = QVBoxLayout(self)
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

        root.addWidget(self._build_rule_card(), 1)

        columns = QHBoxLayout()
        columns.setSpacing(16)
        columns.addWidget(self._build_ai_card(), 1)
        columns.addWidget(self._build_safety_card(), 1)
        root.addLayout(columns)

        self.refresh()

    # ------------------------------------------------------------------ build
    def _build_rule_card(self) -> QWidget:
        card = Card("Rule Engine", "aktif pada V1.0 — deterministik dan dapat diaudit")
        card.add_trailing(Pill("AKTIF", "active"))

        self._coverage = label("0 dari 0 file berhasil diklasifikasikan", "Muted")

        self._table = QTableWidget(0, 3)
        self._table.setHorizontalHeaderLabels(["Kategori", "Ekstensi", "Jumlah file"])
        self._table.verticalHeader().setVisible(False)
        self._table.setShowGrid(False)
        self._table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self._table.setSelectionMode(QAbstractItemView.NoSelection)
        self._table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self._table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self._table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeToContents)
        self._table.setMinimumHeight(430)

        card.add(self._coverage)
        card.add(self._table, 1)
        return card

    def _build_ai_card(self) -> QWidget:
        card = Card("AI Classification", "direncanakan untuk V1.1")
        card.add_trailing(Pill("V1.1", "planned"))

        card.add(
            label(
                "Lapisan AI akan menambahkan konteks isi dokumen di atas rule engine: "
                "PyMuPDF dan OpenPyXL mengekstrak teks, lalu Ollama lokal (atau cloud API) "
                "memberi usulan kategori beserta tingkat keyakinan.",
                "BodyText",
                wrap=True,
            )
        )

        grid = QGridLayout()
        grid.setHorizontalSpacing(10)
        grid.setVerticalSpacing(8)
        provider = QComboBox()
        provider.addItems(["Ollama (lokal)", "Cloud AI API"])
        provider.setEnabled(False)
        model = QLineEdit("qwen2.5:7b-instruct")
        model.setEnabled(False)
        endpoint = QLineEdit("http://localhost:11434")
        endpoint.setEnabled(False)
        threshold = QLineEdit("0.85")
        threshold.setEnabled(False)
        for row, (caption, widget) in enumerate(
            (
                ("Provider", provider),
                ("Model", model),
                ("Endpoint", endpoint),
                ("Ambang keyakinan", threshold),
            )
        ):
            grid.addWidget(label(caption, "Muted"), row, 0)
            grid.addWidget(widget, row, 1)
        grid.setColumnStretch(1, 1)
        card.add_layout(grid)

        activate = QPushButton("Aktifkan AI Classification")
        activate.setObjectName("Primary")
        activate.setEnabled(False)
        activate_row = QHBoxLayout()
        activate_row.addWidget(activate)
        activate_row.addStretch(1)
        card.add_layout(activate_row)
        card.body.addStretch(1)
        return card

    def _build_safety_card(self) -> QWidget:
        card = Card("Prinsip Keamanan", "approval gate sebelum eksekusi")
        card.add_trailing(Pill("WAJIB", "active"))
        card.add(label(SAFETY_PRINCIPLE, "BodyText", wrap=True))
        card.add(
            label(
                "Alur yang akan dipakai mulai V1.2:",
                "Muted",
            )
        )
        for index, text in enumerate(
            (
                "Sistem membuat rencana (dry-run) tanpa menyentuh file.",
                "Pengguna meninjau rencana per kategori dan bisa mengubahnya.",
                "Eksekusi hanya terjadi setelah persetujuan eksplisit.",
                "Auto-organization dibuka per kategori setelah aturan stabil.",
            ),
            start=1,
        ):
            card.add(BulletItem(f"{index}. {text}", "#34D399"))
        card.body.addStretch(1)
        return card

    # ---------------------------------------------------------------- refresh
    def set_theme(self, theme: ThemeTokens) -> None:
        self._theme = theme
        self.refresh()

    def refresh(self) -> None:
        if self.db.closed:
            return
        counts = {item["category"]: item["count"] for item in self.db.category_breakdown()}
        extensions = self._classifier.category_extensions()
        total = self.db.file_count()
        classified = sum(counts.get(name, 0) for name in CATEGORY_NAMES if name != "Other")

        self._coverage.setText(
            f"{human_count(classified)} dari {human_count(total)} file berhasil diklasifikasikan "
            f"({(classified / total * 100) if total else 0:.0f}% coverage)."
        )

        categories = [name for name in CATEGORY_NAMES if name != "Other"]
        categories.append("Other")
        self._table.setRowCount(0)
        for row, name in enumerate(categories):
            self._table.insertRow(row)
            name_item = QTableWidgetItem(name)
            name_item.setForeground(QBrush(QColor(CATEGORY_COLORS.get(name, self._theme.text))))
            ext_list = extensions.get(name, ())
            ext_text = ", ".join(f".{ext}" for ext in ext_list) if ext_list else "— (fallback)"
            ext_item = QTableWidgetItem(ext_text)
            ext_item.setToolTip(ext_text)
            count_item = QTableWidgetItem(human_count(counts.get(name, 0)))
            count_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self._table.setItem(row, 0, name_item)
            self._table.setItem(row, 1, ext_item)
            self._table.setItem(row, 2, count_item)
