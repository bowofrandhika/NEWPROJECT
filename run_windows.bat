@echo off
REM Menjalankan SmartFile Organizer dari source (Windows).
REM Pertama kali akan membuat virtual environment dan memasang dependensi.

setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [1/3] Membuat virtual environment...
    python -m venv .venv || goto :error
    echo [2/3] Memasang dependensi...
    ".venv\Scripts\python.exe" -m pip install --upgrade pip >nul
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt || goto :error
) else (
    echo [1/3] Virtual environment ditemukan.
)

echo [3/3] Menjalankan SmartFile Organizer...
".venv\Scripts\python.exe" main.py %*
if errorlevel 1 goto :error
goto :eof

:error
echo.
echo Terjadi kesalahan. Pastikan Python 3.10+ terpasang dan ada di PATH.
pause
exit /b 1
