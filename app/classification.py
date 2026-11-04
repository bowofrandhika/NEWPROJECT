"""Mesin klasifikasi file.

V1.0 memakai *rule engine* berbasis ekstensi. Antarmuka `BaseClassifier`
disiapkan agar V1.1 dapat menambahkan AI lokal (Ollama) maupun cloud AI tanpa
mengubah pemanggil. Sesuai prinsip keamanan proyek, classifier apa pun hanya
memberi *saran*; pemindahan file tetap butuh persetujuan pengguna.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Protocol

from .constants import EXTENSION_TO_CATEGORY, OTHER_CATEGORY


@dataclass(frozen=True)
class Classification:
    category: str
    confidence: float
    reason: str


class BaseClassifier(Protocol):
    name: str

    def classify(self, path: str) -> Classification:  # pragma: no cover - protokol
        ...


def file_extension(path: str) -> str:
    """Ambil ekstensi tanpa titik, lowercase. '.env' tidak dianggap ekstensi."""
    name = os.path.basename(path)
    stem, dot, ext = name.rpartition(".")
    if not dot or not stem:
        return ""
    return ext.lower()


class RuleBasedClassifier:
    """Klasifikasi deterministik berbasis tabel ekstensi."""

    name = "Rule Engine"

    def __init__(self) -> None:
        self._map = dict(EXTENSION_TO_CATEGORY)

    def classify(self, path: str) -> Classification:
        ext = file_extension(path)
        category = self._map.get(ext)
        if category:
            return Classification(category, 0.95, f"ekstensi .{ext}")
        if ext:
            return Classification(OTHER_CATEGORY, 0.30, f"ekstensi .{ext} belum terdaftar")
        return Classification(OTHER_CATEGORY, 0.20, "file tanpa ekstensi")

    def category_extensions(self) -> dict[str, tuple[str, ...]]:
        grouped: dict[str, list[str]] = {}
        for ext, category in self._map.items():
            grouped.setdefault(category, []).append(ext)
        return {name: tuple(sorted(exts)) for name, exts in grouped.items()}


class AIClassifierStub:
    """Placeholder V1.1.

    Rencana: kirim nama file + ekstrak teks (PyMuPDF/OpenPyXL) ke Ollama lokal
    atau cloud API, lalu simpan hasil sebagai *usulan* ber-confidence yang harus
    disetujui pengguna sebelum dipakai.
    """

    name = "AI Classifier (V1.1)"
    available = False

    def classify(self, path: str) -> Classification:
        return RuleBasedClassifier().classify(path)


_default_classifier = RuleBasedClassifier()


def default_classifier() -> RuleBasedClassifier:
    return _default_classifier


def classify_path(path: str) -> Classification:
    return _default_classifier.classify(path)
