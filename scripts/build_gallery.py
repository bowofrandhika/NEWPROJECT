"""Membangun galeri HTML dari render offscreen aplikasi asli.

Berguna untuk melihat seluruh halaman tanpa membuka jendela desktop:

    python scripts/build_gallery.py
    python -m http.server 8000 -d docs/gallery
"""

from __future__ import annotations

import os
import shutil
import sys
import tempfile
from pathlib import Path

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

from PySide6.QtWidgets import QApplication  # noqa: E402

import preview_screenshots as demo  # noqa: E402
from app.database import Database  # noqa: E402
from app.ui.main_window import MainWindow  # noqa: E402
from main import pick_font  # noqa: E402

PAGES: tuple[tuple[str, str, str], ...] = (
    ("dashboard", "Dashboard", "Kartu metrik adaptif, donut chart penyimpanan, breakdown kategori, feed aktivitas."),
    ("scanner", "File Scanner", "Pemindaian rekursif di thread terpisah dengan progres, counter, dan pembatalan."),
    ("explorer", "File Explorer", "Pohon direktori, pencarian instan, filter kategori, dan aksi klik kanan."),
    ("classifier", "AI Classification", "Rule engine aktif 10 kategori; panel AI disiapkan untuk V1.1."),
    ("organizer", "Folder Generator", "Pratinjau struktur folder (dry-run) dan ekspor rencana ke CSV."),
    ("duplicates", "Duplicate Manager", "Deteksi dini duplikat berbasis nama + ukuran, tanpa aksi hapus di V1.0."),
    ("history", "Activity Log & History", "Audit aktivitas sistem dan ringkasan kondisi indeks."),
    ("sync", "Sync Center", "Rencana sinkronisasi otomatis & manual (V1.4)."),
    ("settings", "Settings", "Tema, folder sumber/tujuan, opsi pemindaian, dan pemeliharaan database."),
)

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SmartFile Organizer — Galeri Antarmuka V1.0</title>
<link rel="icon" href="favicon.ico">
<style>
  :root {{
    --bg:#0e1119; --surface:#161b28; --surface-alt:#1c2231; --border:#232b3d;
    --text:#e8ecf5; --muted:#98a2b8; --dim:#6b768f; --accent:#5b8cff;
  }}
  [data-theme="light"] {{
    --bg:#f4f6fb; --surface:#ffffff; --surface-alt:#f3f6fc; --border:#e2e8f2;
    --text:#111827; --muted:#5b6577; --dim:#8a94a6; --accent:#2f6bff;
  }}
  * {{ box-sizing:border-box; }}
  body {{
    margin:0; background:var(--bg); color:var(--text);
    font-family:"Inter","Segoe UI",system-ui,-apple-system,sans-serif;
    display:flex; min-height:100vh;
  }}
  aside {{
    width:264px; flex:0 0 264px; background:var(--surface); border-right:1px solid var(--border);
    padding:20px 16px; position:sticky; top:0; height:100vh; overflow-y:auto;
  }}
  .brand {{ display:flex; gap:11px; align-items:center; margin-bottom:20px; }}
  .mark {{
    width:40px; height:40px; border-radius:11px; display:grid; place-items:center;
    background:linear-gradient(135deg,#6c9bff,#2f5bff); color:#fff; font-weight:800; font-size:15px;
  }}
  .brand h1 {{ font-size:14px; margin:0; }}
  .brand p {{ font-size:11px; margin:0; color:var(--dim); }}
  .theme-switch {{ display:flex; gap:4px; background:var(--surface-alt); border:1px solid var(--border);
    border-radius:9px; padding:4px; margin-bottom:16px; }}
  .theme-switch button {{
    flex:1; border:0; background:transparent; color:var(--muted); font:inherit; font-size:11px;
    font-weight:600; padding:6px; border-radius:6px; cursor:pointer;
  }}
  .theme-switch button.active {{ background:var(--surface); color:var(--text); }}
  nav {{ display:flex; flex-direction:column; gap:3px; }}
  nav button {{
    text-align:left; border:0; background:transparent; color:var(--muted); font:inherit;
    font-size:12.5px; font-weight:600; padding:9px 11px; border-radius:9px; cursor:pointer;
  }}
  nav button:hover {{ background:var(--surface-alt); color:var(--text); }}
  nav button.active {{ background:rgba(91,140,255,.16); color:var(--accent); }}
  .side-note {{ margin-top:18px; font-size:10.5px; line-height:1.5; color:var(--dim); }}
  main {{ flex:1; padding:22px 26px 34px; min-width:0; }}
  .head {{ display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:4px; }}
  .head h2 {{ font-size:19px; margin:0; }}
  .pill {{
    font-size:10px; font-weight:700; color:var(--accent); background:rgba(91,140,255,.14);
    border-radius:999px; padding:4px 10px;
  }}
  .caption {{ color:var(--muted); font-size:12px; margin:6px 0 16px; max-width:80ch; }}
  figure {{ margin:0; background:var(--surface); border:1px solid var(--border); border-radius:14px;
    padding:10px; }}
  figure img {{ width:100%; height:auto; display:block; border-radius:8px; }}
  figcaption {{ color:var(--dim); font-size:11px; padding:10px 4px 2px; }}
  .pager {{ display:flex; gap:10px; margin-top:14px; }}
  .pager button {{
    border:1px solid var(--border); background:var(--surface); color:var(--text); font:inherit;
    font-size:12px; font-weight:600; padding:9px 16px; border-radius:9px; cursor:pointer;
  }}
  .pager button:hover {{ border-color:var(--accent); color:var(--accent); }}
  .pager .spacer {{ flex:1; }}
  .disclaimer {{
    margin-top:16px; border:1px solid var(--border); background:var(--surface-alt);
    border-radius:12px; padding:14px 16px; font-size:11.5px; line-height:1.6; color:var(--muted);
  }}
  .disclaimer code {{ color:var(--accent); }}
  @media (max-width: 860px) {{
    body {{ flex-direction:column; }}
    aside {{ width:100%; flex:none; height:auto; position:static; }}
    nav {{ flex-direction:row; overflow-x:auto; }}
    nav button {{ white-space:nowrap; }}
  }}
</style>
</head>
<body data-theme="dark">
<aside>
  <div class="brand">
    <div class="mark">SF</div>
    <div>
      <h1>SmartFile Organizer</h1>
      <p>Galeri antarmuka v1.0</p>
    </div>
  </div>
  <div class="theme-switch">
    <button id="btn-dark" class="active" onclick="setTheme('dark')">Dark Mode</button>
    <button id="btn-light" onclick="setTheme('light')">Light Mode</button>
  </div>
  <nav id="nav"></nav>
  <p class="side-note">
    Render diambil langsung dari aplikasi PySide6 yang berjalan (mode offscreen),
    bukan mockup. Data yang tampil adalah data demo.
  </p>
</aside>
<main>
  <div class="head">
    <h2 id="title">Dashboard</h2>
    <span class="pill">V1.0</span>
  </div>
  <p class="caption" id="caption"></p>
  <figure>
    <img id="shot" alt="Tangkapan layar aplikasi" loading="lazy">
    <figcaption id="filename"></figcaption>
  </figure>
  <div class="pager">
    <button onclick="step(-1)">← Sebelumnya</button>
    <button onclick="step(1)">Berikutnya →</button>
    <span class="spacer"></span>
    <button onclick="window.open(document.getElementById('shot').src, '_blank')">Buka ukuran penuh</button>
  </div>
  <div class="disclaimer">
    Ini galeri statis untuk melihat tampilan. Aplikasi sebenarnya adalah program desktop:
    jalankan <code>run_windows.bat</code> (Windows) atau <code>python main.py</code>, lalu build
    <code>.exe</code> dengan <code>scripts\\build_windows.ps1</code>.
  </div>
</main>
<script>
  const pages = {pages};
  let index = 0;
  let theme = "dark";

  function render() {{
    const page = pages[index];
    document.getElementById("title").textContent = page.title;
    document.getElementById("caption").textContent = page.caption;
    const src = "img/" + page.key + "-" + theme + ".jpg";
    document.getElementById("shot").src = src;
    document.getElementById("filename").textContent = src;
    document.querySelectorAll("#nav button").forEach((btn, i) => {{
      btn.classList.toggle("active", i === index);
    }});
  }}

  function setTheme(next) {{
    theme = next;
    document.body.dataset.theme = next;
    document.getElementById("btn-dark").classList.toggle("active", next === "dark");
    document.getElementById("btn-light").classList.toggle("active", next === "light");
    render();
  }}

  function goto(i) {{
    index = (i + pages.length) % pages.length;
    render();
    window.scrollTo({{ top: 0, behavior: "smooth" }});
  }}

  function step(delta) {{ goto(index + delta); }}

  const nav = document.getElementById("nav");
  pages.forEach((page, i) => {{
    const button = document.createElement("button");
    button.textContent = page.title;
    button.onclick = () => goto(i);
    nav.appendChild(button);
  }});

  document.addEventListener("keydown", (event) => {{
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  }});

  render();
</script>
</body>
</html>
"""


def main() -> int:
    import json

    demo.build_demo_files()
    temp_dir = Path(tempfile.mkdtemp(prefix="smartfile-gallery-"))
    db = Database(temp_dir / "demo.db")
    demo.seed_database(db)

    application = QApplication(sys.argv[:1])
    application.setFont(pick_font())

    window = MainWindow(db)
    window.resize(1440, 900)
    window.show()

    gallery_dir = ROOT / "docs" / "gallery"
    image_dir = gallery_dir / "img"
    shutil.rmtree(image_dir, ignore_errors=True)
    image_dir.mkdir(parents=True, exist_ok=True)

    for theme_name in ("dark", "light"):
        window._apply_theme(theme_name)
        for key, _title, _caption in PAGES:
            window.navigate(key)
            page = window.stack.currentWidget()
            if key == "organizer" and hasattr(page, "generate_plan"):
                page.generate_plan()
            for _ in range(5):
                application.processEvents()
            target = image_dir / f"{key}-{theme_name}.jpg"
            window.grab().save(str(target), "JPG", 82)
            print(f"captured {target.relative_to(ROOT)} ({target.stat().st_size // 1024} KB)")

    favicon = ROOT / "assets" / "icon.ico"
    if favicon.is_file():
        shutil.copy2(favicon, gallery_dir / "favicon.ico")

    payload = [
        {"key": key, "title": title, "caption": caption} for key, title, caption in PAGES
    ]
    html = HTML_TEMPLATE.format(pages=json.dumps(payload, ensure_ascii=False, indent=2))
    (gallery_dir / "index.html").write_text(html, encoding="utf-8")
    print(f"\nGaleri siap: {gallery_dir / 'index.html'}")
    print("Jalankan: python -m http.server 8000 -d docs/gallery")

    db.close()
    shutil.rmtree(temp_dir, ignore_errors=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
