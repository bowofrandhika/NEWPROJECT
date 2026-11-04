#!/usr/bin/env bash
# Menjalankan SmartFile Organizer dari source (Linux/macOS).
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -x ".venv/bin/python" ]; then
    echo "[1/3] Membuat virtual environment..."
    python3 -m venv .venv
    echo "[2/3] Memasang dependensi..."
    .venv/bin/python -m pip install --quiet --upgrade pip
    .venv/bin/python -m pip install -r requirements.txt
else
    echo "[1/3] Virtual environment ditemukan."
fi

echo "[3/3] Menjalankan SmartFile Organizer..."
exec .venv/bin/python main.py "$@"
