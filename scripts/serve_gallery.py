#!/usr/bin/env python3
"""Server statis untuk galeri antarmuka (docs/gallery).

- Memakai ThreadingHTTPServer supaya banyak gambar bisa dimuat paralel.
- Mengirim header no-store agar screenshot hasil build ulang tidak tersangkut cache.
- Otomatis membangun galeri bila belum ada / jumlah gambarnya kurang.

Pemakaian:
    python scripts/serve_gallery.py                 # port 8000
    python scripts/serve_gallery.py --port 8080
    python scripts/serve_gallery.py --rebuild       # render ulang semua gambar
    python scripts/serve_gallery.py --no-build      # jangan pernah build
"""

from __future__ import annotations

import argparse
import functools
import http.server
import socket
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GALLERY = ROOT / "docs" / "gallery"
IMAGE_DIR = GALLERY / "img"
EXPECTED_IMAGES = 18  # 9 halaman × 2 tema


class GalleryHandler(http.server.SimpleHTTPRequestHandler):
    """Handler statis dengan cache dimatikan dan keep-alive HTTP/1.1."""

    protocol_version = "HTTP/1.1"

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:  # noqa: A002 (API bawaan)
        sys.stderr.write(f"[galeri] {self.address_string()} — {format % args}\n")


def gallery_ready() -> bool:
    images = list(IMAGE_DIR.glob("*.jpg")) if IMAGE_DIR.is_dir() else []
    return (GALLERY / "index.html").is_file() and len(images) >= EXPECTED_IMAGES


def build_gallery() -> bool:
    """Render ulang galeri dari aplikasi (butuh PySide6)."""
    script = ROOT / "scripts" / "build_gallery.py"
    if not script.is_file():
        print("[galeri] scripts/build_gallery.py tidak ditemukan.", file=sys.stderr)
        return False
    print("[galeri] Membangun galeri dari render aplikasi ...", file=sys.stderr)
    result = subprocess.run([sys.executable, str(script)], cwd=str(ROOT))
    if result.returncode != 0:
        print("[galeri] Build gagal — galeri lama tetap disajikan.", file=sys.stderr)
        return False
    return True


def ensure_gallery(rebuild: bool, allow_build: bool) -> None:
    if rebuild:
        if not allow_build:
            print("[galeri] --rebuild diabaikan karena --no-build.", file=sys.stderr)
        elif build_gallery():
            return
    if gallery_ready():
        return
    if not allow_build:
        print("[galeri] Galeri belum lengkap dan --no-build aktif.", file=sys.stderr)
        return
    if build_gallery() and not gallery_ready():
        print("[galeri] Build selesai tetapi jumlah gambar masih kurang.", file=sys.stderr)


def pick_port(preferred: int, host: str) -> int:
    """Pakai port yang diminta; bila sedang dipakai, cari port bebas berikutnya."""
    for candidate in [preferred, *range(preferred + 1, preferred + 20)]:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                probe.bind((host, candidate))
                return candidate
            except OSError:
                continue
    raise SystemExit(f"[galeri] Tidak ada port bebas di sekitar {preferred}.")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Server galeri SmartFile Organizer")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--rebuild", action="store_true", help="render ulang gambar galeri")
    parser.add_argument("--no-build", action="store_true", help="jangan build otomatis")
    args = parser.parse_args(argv)

    ensure_gallery(rebuild=args.rebuild, allow_build=not args.no_build)

    if not (GALLERY / "index.html").is_file():
        print("[galeri] index.html tidak ada; jalankan scripts/build_gallery.py.", file=sys.stderr)
        return 1

    port = pick_port(args.port, args.host)
    if port != args.port:
        print(f"[galeri] Port {args.port} sedang dipakai, memakai port {port}.", file=sys.stderr)

    handler = functools.partial(GalleryHandler, directory=str(GALLERY))
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer((args.host, port), handler) as server:
        print(f"[galeri] Menyajikan {GALLERY}", file=sys.stderr)
        print(f"[galeri] Buka http://localhost:{port} (bind {args.host}:{port})", file=sys.stderr)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n[galeri] Dihentikan.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
