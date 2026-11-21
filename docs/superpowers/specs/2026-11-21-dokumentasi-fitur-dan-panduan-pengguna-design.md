# Spesifikasi Desain: Dokumentasi Fitur & Panduan Pengguna

**Tanggal:** 21 November 2026  
**Status:** Menunggu Persetujuan (*Draft Pending Approval*)  
**Penulis:** Antigravity (Google DeepMind) & User  

---

## 1. Latar Belakang & Tujuan

Aplikasi Catatan Keuangan Pribadi (Mobile PWA) telah mengalami perkembangan signifikan dari versi awal hingga versi 18 (`catatan-keuangan-v18`). Fitur-fitur mutakhir seperti multi-dompet dinamis, pencatatan utang-piutang terintegrasi kas riil, pemindai struk belanja hybrid (Gemini 1.5 Flash Vision & OCR lokal), penyaring rentang bulan kustom, grafik analitik Chart.js, serta tema ganda telah aktif dan berjalan stabil.

Namun, berkas `README.md` yang ada saat ini masih merupakan versi instalasi awal dan belum mendokumentasikan fitur-fitur tersebut. Proyek ini membutuhkan dua dokumen terpisah:
1. **Panduan Pengguna (`PANDUAN_PENGGUNA.txt`)**: Panduan langkah demi langkah berformat teks murni (*plain text*) yang mudah dipahami oleh pengguna awam tanpa memerlukan aplikasi pembaca markdown, ditempatkan di *root repository*.
2. **Dokumentasi Teknis (`docs/DOKUMENTASI_FITUR.md`)**: Dokumentasi arsitektur sistem, alur data, kontrak API Google Apps Script, skema tabel Google Sheets, dan spesifikasi modul untuk pemeliharaan kode oleh pengembang di masa mendatang.
3. **Pembaruan `README.md`**: Menambahkan navigasi cepat dan tautan menuju kedua berkas dokumentasi tersebut.

---

## 2. Pendekatan yang Dipertimbangkan (*Approaches*)

* **Pendekatan 1: Berkas Terbuka di Root & Subfolder Docs (Dipilih)**
  - `PANDUAN_PENGGUNA.txt` di root repository.
  - `docs/DOKUMENTASI_FITUR.md` di direktori `docs/`.
  - Tautan referensi disematkan pada `README.md`.
  - *Trade-off*: Pengguna awam dapat langsung melihat dan membuka panduan teks saat membuka folder proyek atau repositori, sementara pengembang dapat membaca arsitektur teknis di folder `docs/`.

* **Pendekatan 2: Semua Terpusat di Subfolder `docs/`**
  - Seluruh dokumentasi (`docs/PANDUAN_PENGGUNA.txt` dan `docs/DOKUMENTASI_FITUR.md`) diletakkan di dalam `docs/`.
  - *Trade-off*: Folder root lebih minimalis, namun pengguna awam harus membuka subfolder terlebih dahulu untuk menemukan panduan teks.

**Keputusan:** Pendekatan 1 dipilih karena memprioritaskan kemudahan akses bagi pengguna akhir aplikasi.

---

## 3. Rincian Spesifikasi Berkas

### A. Panduan Pengguna (`PANDUAN_PENGGUNA.txt`)
* **Format:** Plain text UTF-8 dengan penataan tata letak ASCII art rapi (garis pemisah `===` dan `---`), penomoran bab yang jelas, dan bahasa Indonesia santun yang mudah dipahami siapa saja (termasuk ibu rumah tangga / pengguna non-teknis).
* **Struktur Isi:**
  1. **Pengantar Aplikasi**: Keunggulan aplikasi (100% gratis selamanya, tanpa iklan, data tersimpan di Google Sheets pribadi, cepat dibuka di HP).
  2. **Persiapan & Cara Pasang di HP (PWA)**:
     - Panduan pasang di Android (Google Chrome -> Tambahkan ke Layar Utama).
     - Panduan pasang di iPhone / iPad (Safari -> Bagikan / Share -> Tambahkan ke Layar Utama).
  3. **Pengaturan Awal**: Cara memasukkan Web App URL dari Google Apps Script dan Token Rahasia.
  4. **Panduan Lengkap 12 Fitur Utama**:
     - *Fitur 1: Mencatat Pengeluaran & Pemasukan* (Format nominal otomatis Rupiah, pilih dompet, kategori, tanggal, catatan).
     - *Fitur 2: Pemindai Struk / Nota Otomatis* (Cara foto struk via kamera/galeri, pemrosesan Mode AI vs Mode Lokal, verifikasi data sebelum simpan).
     - *Fitur 3: Multi-Dompet & Saldo Real-Time* (Melihat saldo terkini tiap akun dompet/bank/e-wallet, menambah dompet baru, mengatur saldo awal, menghapus dompet).
     - *Fitur 4: Mengatur Urutan Tampilan Dompet* (Menyesuaikan posisi dompet favorit: Custom urut, saldo terbanyak, saldo tersedikit, nama A-Z).
     - *Fitur 5: Pindah Dana (Transfer Antar Dompet)* (Pindah saldo antar rekening tanpa mempengaruhi grafik pengeluaran bulanan).
     - *Fitur 6: Catatan Utang & Piutang* (Mencatat pinjaman, batas jatuh tempo, status Belum Lunas/Lunas, dan fitur cicil yang otomatis mencatat mutasi kas riil).
     - *Fitur 7: Mengelola Kategori Transaksi* (Menambah atau menghapus kategori pemasukan & pengeluaran sesuai kebutuhan).
     - *Fitur 8: Penyaring Periode & Rentang Bulan Kustom* (Filter Hari Ini, Minggu Ini, Bulan Ini, dan pemilih rentang bulan kustom).
     - *Fitur 9: Dasbor Analisis & Grafik Keuangan* (Membaca saldo bersih, rata-rata belanja harian, pengeluaran terbesar, Donut Chart kategori, dan Bar Chart arus kas).
     - *Fitur 10: Riwayat Transaksi & Pencarian Instan* (Mencari transaksi lewat kata kunci catatan/toko/nominal, mengubah/mengedit data, menghapus data).
     - *Fitur 11: Mengganti Tema Tampilan* (Saklar tema Soft Pink Kas Mama dan Blue Modern).
     - *Fitur 12: Mode Offline & Sinkronisasi* (Kemampuan aplikasi dibuka tanpa sinyal dan cara memperbarui data saat sinyal kembali).
  5. **Tanya Jawab & Solusi Masalah Umum (FAQ)**: Penanganan masalah umum seperti kamera tidak menyala, teks struk buram, dan status koneksi merah.

---

### B. Dokumentasi Teknis (`docs/DOKUMENTASI_FITUR.md`)
* **Format:** Markdown GitHub Flavored dengan tabel skema data, diagram alur Mermaid, dan blok kode terformat.
* **Struktur Isi:**
  1. **Arsitektur Sistem Global**:
     - Arsitektur Serverless (Frontend Mobile Client <-> Service Worker v18 <-> Google Apps Script Web App <-> Google Sheets DB).
     - Komponen Eksternal: Gemini 1.5 Flash Vision REST API & Tesseract.js (WASM OCR).
     - Diagram Alur Sistem (*Mermaid Diagram*).
  2. **Topologi & Struktur Berkas**:
     - Penjelasan peran `index.html`, `css/style.css`, `js/config.js`, `js/api.js`, `js/app.js`, `sw.js`, dan `google-apps-script/Code.gs`.
     - Aturan sinkronisasi folder root ke folder `public/`.
  3. **Skema Basis Data Google Sheets**:
     - Tabel `Pemasukan` (Kolom: Tanggal, Nominal, Kategori, Catatan, Dompet).
     - Tabel `Pengeluaran` (Kolom: Tanggal, Nominal, Kategori, Catatan, Dompet).
     - Tabel `Transfer` (Kolom: Tanggal, Nominal, Dari Dompet, Ke Dompet, Catatan).
     - Tabel `Dompet` (Kolom: Nama Dompet, Saldo Awal).
     - Tabel `Kategori` (Kolom: Jenis, Nama Kategori).
     - Tabel `UtangPiutang` (Kolom: ID, Tanggal, Jenis, Nama Pihak, Nominal Total, Terbayar, Sisa, Status, Jatuh Tempo, Catatan).
  4. **Kontrak Komunikasi API (Google Apps Script)**:
     - Endpoint `doGet(e)`: Mendukung mode GET standar & JSONP fallback dengan aksi `getAll`.
     - Endpoint `doPost(e)`: Spesifikasi payload dan respons untuk aksi `add`, `update`, `delete`, `transfer`, `addWallet`, `updateWallet`, `deleteWallet`, `addCategory`, `deleteCategory`, `addDebt`, `payDebt`, `deleteDebt`, dan `scanReceipt`.
  5. **State Management & Algoritma Sisi Klien**:
     - Struktur objek `state` di `js/app.js`.
     - Algoritma perhitungan saldo dompet: $\text{Saldo Akhir} = \text{Saldo Awal} + \sum \text{Masuk} - \sum \text{Keluar} + \sum \text{Transfer Masuk} - \sum \text{Transfer Keluar}$.
     - Algoritma filter rentang periode sinkron antara Dasbor dan Riwayat.
  6. **Arsitektur Hybrid Pemindai Struk (OCR Scanner)**:
     - Pipeline kompresi Canvas HTML5 (skala maksimal 1200px, kualitas JPEG 0.75).
     - Logika eskalasi fallback: Apps Script (Gemini 1.5 Flash Vision) $\rightarrow$ Direct REST Gemini API $\rightarrow$ Local OCR (Tesseract.js) + Regex parser.
     - Penanganan pembatalan (*cancellation token*) dan auto-prefill form tanpa auto-submit (*Human-in-the-Loop*).
  7. **Service Worker & PWA Caching Strategy**:
     - Versi cache: `catatan-keuangan-v18`.
     - Kebijakan cache-first untuk static assets, bypass/network-only untuk request Google Apps Script dan API eksternal.
  8. **Keamanan & Token Otentikasi**:
     - Penyimpanan credential di `localStorage` peramban.
     - Validasi `SECRET_TOKEN` di setiap request mutasi `doPost`.

---

### C. Pembaruan `README.md`
- Menambahkan bab navigasi dokumentasi yang menghubungkan pembaca ke `PANDUAN_PENGGUNA.txt` (untuk panduan operasional pengguna) dan `docs/DOKUMENTASI_FITUR.md` (untuk arsitektur teknis lengkap).

---

## 4. Kriteria Keberhasilan & Verifikasi

1. Berkas `PANDUAN_PENGGUNA.txt` berhasil dibuat di root dengan penataan tata letak teks yang rapi dan memuat ke-12 fitur secara mendalam.
2. Berkas `docs/DOKUMENTASI_FITUR.md` berhasil dibuat dengan diagram Mermaid yang valid secara sintaksis dan mencakup seluruh kontrak API serta skema database.
3. Berkas `README.md` berhasil diperbarui dan disinkronkan ke `public/README.md` (jika ada).
4. Tidak ada perubahan yang merusak kode aplikasi yang sedang berjalan.
