# Arsitektur SmartFile Organizer

Dokumen ini menjelaskan pembagian modul, alur data, dan titik ekstensi untuk versi berikutnya.

## 1. Prinsip desain

1. **Offline-first.** Semua data index ada di SQLite lokal; tidak ada server.
2. **Aman secara default.** V1.0 hanya membaca filesystem. Rencana organisasi bersifat
   *dry-run* dan diekspor ke CSV, bukan dieksekusi.
3. **UI tidak boleh memblokir.** Pemindaian berjalan pada `QThread`; penulisan database
   dilakukan di thread UI dari batch yang dikirim worker.
4. **Satu sumber kebenaran.** Semua akses data melewati `app/database.py`; halaman tidak
   pernah menulis SQL sendiri.
5. **Tema terpusat.** Warna hanya didefinisikan di `app/theme.py` sebagai token, dipakai
   oleh stylesheet dan widget yang menggambar manual (chart, ikon).

## 2. Lapisan

```text
┌──────────────────────────────────────────────────────────────┐
│ main.py            argparse → QApplication → MainWindow       │
├──────────────────────────────────────────────────────────────┤
│ app/ui/main_window.py                                        │
│   ├── Sidebar (navigasi, collapse)                           │
│   ├── TopBar (judul, pencarian global, tema, settings)        │
│   └── QStackedWidget → 9 halaman                             │
├──────────────────────────────────────────────────────────────┤
│ app/ui/pages/*        presentasi + interaksi                 │
│ app/ui/widgets/*      komponen reusable (kartu, chart, feed)  │
├──────────────────────────────────────────────────────────────┤
│ app/scanner.py        ScanWorker (QThread) + ScanOptions      │
│ app/classification.py RuleBasedClassifier                     │
│ app/organizer.py      build_plan() / export_plan_csv()        │
├──────────────────────────────────────────────────────────────┤
│ app/database.py       SQLite: settings, roots, files, scans,  │
│                       activity                                │
│ app/utils.py          format & helper OS                      │
└──────────────────────────────────────────────────────────────┘
```

## 3. Alur pemindaian

```text
FileScannerPage.start_scan()
   └─ ScanWorker(roots, options).start()          # thread terpisah
        ├─ os.walk  → filter folder sistem / hidden / ukuran
        ├─ classify_path() per file               # rule engine
        ├─ emit batch(list[dict]) tiap 200 file    ─┐
        └─ emit progress(ScanProgress) tiap 40 file │
                                                   ▼
                              thread UI: Database.upsert_files(batch)
                                         Database.finish_scan(...)
                                         log_activity("Pemindaian selesai", ...)
                                         data_changed.emit()
                                                   │
                    Dashboard / Explorer / Duplicates / History .refresh()
```

Konsekuensi penting:

- Satu koneksi SQLite (`check_same_thread=False`) hanya dipakai di thread UI.
- Worker tidak menyentuh database, sehingga tidak ada penulisan bersamaan.
- Pemindaian bisa dihentikan (`request_stop`); status scan dicatat sebagai `stopped`.

## 4. Skema & query penting

- `files.path` UNIQUE → `INSERT ... ON CONFLICT(path) DO UPDATE` membuat pemindaian ulang
  idempoten dan memperbarui ukuran/tanggal modifikasi.
- Filter subfolder memakai `substr(folder, 1, n)` bukan `LIKE`, agar karakter `%`/`_` pada
  path tidak dianggap wildcard.
- `duplicate_summary()` mengelompokkan `LOWER(name)` + `size`; hasilnya dipakai dashboard
  dan halaman Duplicates sebagai *deteksi dini*.

## 5. Adaptive Interface

- `FlowLayout` (custom `QLayout`) membungkus kartu metrik; jumlah kolom mengikuti lebar.
- Sidebar otomatis menjadi mode ikon di bawah 1180 px (bisa ditimpa manual via hamburger).
- Semua konten halaman berada di `QScrollArea`, sehingga jendela kecil tetap dapat dipakai.
- Ikon digambar ulang dengan warna tema saat tema berubah (tidak ada aset PNG gelap/terang).

## 6. Titik ekstensi

| Versi | Modul | Rencana |
| --- | --- | --- |
| V1.1 | `classification.py` | Tambah `AIClassifier` (Ollama `/api/generate`, cloud API) yang mengembalikan `Classification(category, confidence, reason)`. Hasil disimpan sebagai *usulan* + status `pending_review` sebelum dipakai. |
| V1.2 | `organizer.py` | `create_folders(plan)` yang hanya membuat direktori kosong, setelah pengguna menekan "Setujui". |
| V1.3 | modul baru `operations.py` | `move_files(plan, mode="copy")` dengan tabel `operations` untuk undo dan dry-run diff. |
| V1.4 | modul baru `sync.py` | `watchdog.Observer` + antrean event; tabel `sync_state` (path, hash, mtime, arah). |
| V1.5 | `hashing.py` | SHA-256 bertahap (chunked) + cache di kolom `files.hash`. |
| V1.6 | modul baru `versions.py` | Snapshot metadata + diff; tabel `file_versions` dan `document_links`. |

Semua operasi tulis harus memegang kontrak berikut:

1. Membuat rencana (tanpa efek samping).
2. Menampilkan pratinjau dampak + jumlah file/byte.
3. Eksekusi hanya setelah persetujuan eksplisit.
4. Mencatat ke `activity` (dan tabel operasi bila ada) agar dapat diaudit/di-undo.

## 7. Pengujian

- **Unit (tanpa Qt):** klasifikasi, query database, statistik duplikat, rencana folder, CSV.
- **Smoke UI (offscreen):** semua halaman dibuat & dirender, tema diganti, pencarian
  memindahkan halaman, `ScanWorker` mengindeks folder nyata, pratinjau organisasi terisi.

Menjalankan: `python -m unittest discover -s tests -v`.

## 8. Catatan versi PySide6

`requirements.txt` membatasi `PySide6<6.10`. Pada 6.12.0 ditemukan kegagalan
`none_dealloc` saat `QTableWidget` diisi ratusan baris di sebagian lingkungan;
PySide6 6.8 (LTS) terbukti stabil dan direkomendasikan untuk build Windows.
