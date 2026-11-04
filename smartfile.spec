# -*- mode: python ; coding: utf-8 -*-
"""Konfigurasi PyInstaller untuk SmartFile Organizer.

Build:
    python scripts/generate_icon.py
    pyinstaller smartfile.spec --noconfirm --clean

Hasil: dist/SmartFileOrganizer/SmartFileOrganizer.exe (mode onedir, tanpa konsol).
"""

from pathlib import Path

project_root = Path(SPECPATH).resolve()  # noqa: F821 (variabel bawaan PyInstaller)

datas = []
icon_png = project_root / "assets" / "icon.png"
if icon_png.exists():
    datas.append((str(icon_png), "assets"))

icon_ico = project_root / "assets" / "icon.ico"
icon_path = str(icon_ico) if icon_ico.exists() else None

a = Analysis(
    ["main.py"],
    pathex=[str(project_root)],
    binaries=[],
    datas=datas,
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "PySide6.QtWebEngineCore",
        "PySide6.QtWebEngineWidgets",
        "PySide6.QtQuick",
        "PySide6.QtQml",
        "PySide6.Qt3DCore",
        "PySide6.QtMultimedia",
        "PySide6.QtCharts",
        "PySide6.QtDataVisualization",
        "tkinter",
        "unittest",
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="SmartFileOrganizer",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    icon=icon_path,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name="SmartFileOrganizer",
)
