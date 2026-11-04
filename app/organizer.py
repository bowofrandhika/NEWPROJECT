"""Folder Generator (V1.2) — untuk V1.0 hanya menghasilkan *rencana*.

Tidak ada file yang dipindahkan atau disalin di versi ini. Rencana ditampilkan
dan bisa diekspor ke CSV untuk ditinjau pengguna terlebih dahulu.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

TEMPLATES: dict[str, dict[str, str]] = {
    "category": {
        "label": "Kategori",
        "description": "satu folder per kategori file",
        "example": "Documents/",
    },
    "category_year": {
        "label": "Kategori / Tahun",
        "description": "kategori lalu tahun modifikasi",
        "example": "Documents/2024/",
    },
    "year_month": {
        "label": "Tahun / Bulan",
        "description": "arsip kronologis",
        "example": "2024/03-Maret/",
    },
    "extension": {
        "label": "Ekstensi",
        "description": "satu folder per ekstensi",
        "example": "pdf/",
    },
}

MONTH_NAMES = (
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
)


@dataclass
class PlanGroup:
    relative_folder: str
    category: str
    files: int = 0
    size: int = 0


@dataclass
class OrganizationPlan:
    template: str
    destination: str
    groups: list[PlanGroup] = field(default_factory=list)

    @property
    def total_files(self) -> int:
        return sum(group.files for group in self.groups)

    @property
    def total_size(self) -> int:
        return sum(group.size for group in self.groups)

    def target_for(self, group: PlanGroup) -> Path:
        return Path(self.destination) / group.relative_folder


def _year_month(modified_at: str | None) -> tuple[str, str]:
    moment = _parse_datetime(modified_at)
    return str(moment.year), f"{moment.month:02d}-{MONTH_NAMES[moment.month - 1]}"


def _parse_datetime(value: str | None) -> datetime:
    if value:
        try:
            parsed = datetime.fromisoformat(value)
            return parsed.astimezone() if parsed.tzinfo else parsed
        except ValueError:
            pass
    return datetime.now()


def _relative_folder(template: str, record: dict[str, Any]) -> str:
    category = record.get("category") or "Other"
    if template == "category":
        return f"{category}/"
    if template == "extension":
        ext = record.get("ext") or "no-extension"
        return f"{ext.lower()}/"
    year, month = _year_month(record.get("modified_at"))
    if template == "year_month":
        return f"{year}/{month}/"
    return f"{category}/{year}/"


def build_plan(
    files: Iterable[dict[str, Any]], destination: str, template: str = "category_year"
) -> OrganizationPlan:
    """Bangun rencana pengelompokan folder tanpa menyentuh filesystem."""
    if template not in TEMPLATES:
        template = "category_year"

    plan = OrganizationPlan(template=template, destination=str(destination))
    buckets: dict[str, PlanGroup] = {}
    for record in files:
        relative = _relative_folder(template, record)
        group = buckets.get(relative)
        if group is None:
            group = PlanGroup(
                relative_folder=relative,
                category=record.get("category") or "Other",
            )
            buckets[relative] = group
        group.files += 1
        group.size += int(record.get("size") or 0)

    plan.groups = sorted(
        buckets.values(), key=lambda group: (-group.files, group.relative_folder.lower())
    )
    return plan


def export_plan_csv(plan: OrganizationPlan, target_csv: str | Path) -> Path:
    """Ekspor rencana ke CSV untuk audit manual."""
    path = Path(target_csv)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            ["destination", "relative_folder", "category", "files", "total_bytes"]
        )
        for group in plan.groups:
            writer.writerow(
                [
                    plan.destination,
                    group.relative_folder,
                    group.category,
                    group.files,
                    group.size,
                ]
            )
    return path
