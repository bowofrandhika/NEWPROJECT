# Build SmartFile Organizer menjadi EXE Windows.
#
# Pemakaian (PowerShell, dari root proyek):
#   powershell -ExecutionPolicy Bypass -File scripts\build_windows.ps1
#
# Hasil: dist\SmartFileOrganizer\SmartFileOrganizer.exe

param(
    [switch]$OneFile,
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "== SmartFile Organizer — build Windows ==" -ForegroundColor Cyan
Write-Host "Python: $((Get-Command python).Source)"

if (-not (Test-Path ".venv")) {
    Write-Host "Membuat virtual environment .venv ..." -ForegroundColor Yellow
    python -m venv .venv
}

$python = Join-Path $root ".venv\Scripts\python.exe"
$pip = Join-Path $root ".venv\Scripts\pip.exe"

Write-Host "Memasang dependensi ..." -ForegroundColor Yellow
& $pip install --upgrade pip | Out-Null
& $pip install -r requirements-dev.txt

if (-not $SkipTests) {
    Write-Host "Menjalankan test ..." -ForegroundColor Yellow
    & $python -m unittest discover -s tests
    if ($LASTEXITCODE -ne 0) { throw "Test gagal — build dihentikan." }
}

Write-Host "Membuat ikon aplikasi ..." -ForegroundColor Yellow
& $python scripts\generate_icon.py

Write-Host "Menjalankan PyInstaller ..." -ForegroundColor Yellow
& $python -m PyInstaller smartfile.spec --noconfirm --clean

$target = "dist\SmartFileOrganizer\SmartFileOrganizer.exe"
if ($OneFile) {
    Write-Host "Membuat versi onefile tambahan ..." -ForegroundColor Yellow
    & $python -m PyInstaller --noconfirm --clean --onefile --windowed `
        --name SmartFileOrganizer-portable `
        --icon assets\icon.ico `
        --add-data "assets\icon.png;assets" `
        main.py
    $target = "dist\SmartFileOrganizer-portable.exe"
}

if (Test-Path $target) {
    $sizeMb = [math]::Round((Get-Item $target).Length / 1MB, 1)
    Write-Host ""
    Write-Host "SELESAI: $target ($sizeMb MB)" -ForegroundColor Green
    Write-Host "Jalankan dengan double-click, atau dari PowerShell: .\$target" -ForegroundColor Green
} else {
    throw "Build selesai tetapi executable tidak ditemukan."
}
