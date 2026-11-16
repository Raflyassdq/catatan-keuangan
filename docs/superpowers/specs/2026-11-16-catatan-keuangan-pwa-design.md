# Catatan Keuangan Pribadi — Design Doc

**Tanggal:** 2026-11-16  
**Status:** Menunggu persetujuan client

---

## Intent & Why

Pemilik butuh cara mencatat transaksi keuangan harian langsung dari HP, saat transaksi terjadi, tanpa harus buka laptop dan spreadsheet. Keterlambatan pencatatan selama ini menyebabkan data tidak akurat. Solusinya adalah aplikasi web yang bisa di-install ke layar utama HP (iOS & Android), input secepat mungkin, dan langsung tersimpan ke Google Sheets milik pemilik.

---

## Goals

- Input transaksi (pemasukan / pengeluaran) bisa selesai dalam kurang dari 10 detik.
- Data langsung masuk ke Google Sheets yang dimiliki pemilik, tanpa perantara layanan berbayar.
- Bisa di-install ke layar utama iPhone (iOS PWA via Safari).
- Dashboard dan riwayat membantu pemilik memahami pola keuangan.
- Edit dan hapus transaksi bisa dilakukan dari aplikasi.

## Non-Goals

- Bukan aplikasi multi-user / keluarga (hanya untuk pemilik sendiri).
- Tidak ada fitur budget / target tabungan di versi pertama.
- Tidak ada sinkronisasi offline penuh (data butuh koneksi internet untuk tersimpan).
- Tidak ada notifikasi push.

## Anti-Goals

- Jangan simpan data di server pihak ketiga (Supabase, Firebase, dll.) — data harus tetap di Google Sheets pemilik.
- Jangan buat UI yang terasa seperti template AI: hindari gradien biru-ungu, glow berlebihan, glassmorphism di mana-mana.
- Jangan ada navigasi atau tombol yang tidak berfungsi.

---

## Constraints

- Hosting: **gratis** (GitHub Pages atau Netlify).
- Backend: **Google Apps Script** (gratis, quota personal lebih dari cukup).
- Tidak ada biaya bulanan.
- Bahasa antarmuka: Bahasa Indonesia.
- Format angka: Rupiah (Rp 1.250.000).
- Target device utama: iPhone (iOS Safari), secondary Android Chrome.

---

## Approaches

### Opsi yang Dipertimbangkan

**A — Frontend PWA (GitHub Pages) + Google Apps Script API** *(Dipilih)*  
Frontend HTML/CSS/JS murni di-host di GitHub Pages (gratis). Apps Script di-deploy sebagai Web App dengan URL endpoint. Frontend memanggil endpoint itu untuk baca/tulis Sheet. Apps Script tidak memerlukan OAuth dari sisi pengguna karena berjalan di akun Google pemilik.

**B — Supabase + Edge Function**  
Ditolak karena tidak memenuhi syarat "data di Google Sheets pemilik" dan menambah dependensi layanan pihak ketiga.

**C — Semua di dalam Google Apps Script**  
Ditolak karena tidak mendukung Service Worker, tidak bisa jadi PWA sejati, URL tidak ramah untuk di-pin ke layar HP.

### Alasan Memilih A

- Gratis sepenuhnya.
- Data sepenuhnya di Google akun pemilik.
- Frontend sebagai PWA sejati: bisa di-install ke layar utama iOS dan Android.
- Kode frontend dan backend terpisah bersih, mudah dikelola.

---

## Struktur Data

### Google Sheets: Spreadsheet baru bernama "Keuangan Pribadi"

**Sheet "Pemasukan"**

| Kolom | Tipe | Contoh |
|-------|------|--------|
| Tanggal | Date (DD/MM/YYYY) | 16/11/2026 |
| Nominal | Number | 5000000 |
| Kategori | String | Gaji |
| Catatan | String | Gaji bulan November |
| Sumber | String | Gaji |

**Sheet "Pengeluaran"**

| Kolom | Tipe | Contoh |
|-------|------|--------|
| Tanggal | Date (DD/MM/YYYY) | 16/11/2026 |
| Nominal | Number | 45000 |
| Kategori | String | Makan & Minum |
| Catatan | String | Makan siang |

> Baris pertama di setiap sheet adalah header (tidak dihitung sebagai data).

### Kategori Pemasukan (dropdown di aplikasi)
- Gaji
- Bonus / Uang Lembur
- Transfer dari Keluarga

### Kategori Pengeluaran (dropdown di aplikasi)
- Makan & Minum
- Transportasi
- Belanja Kebutuhan Rumah
- Hiburan & Hobi
- Kesehatan
- Pakaian & Penampilan
- Pendidikan
- Tabungan / Investasi
- Skincare & Kosmetik

---

## Arsitektur

```
[iPhone / Android Browser]
        |
        | HTTPS fetch (JSON)
        v
[Google Apps Script Web App]  <-- deployed as doPost / doGet
        |
        | SpreadsheetApp API
        v
[Google Sheets: "Keuangan Pribadi"]
  - Sheet: Pemasukan
  - Sheet: Pengeluaran
```

**Frontend (PWA)**
- HTML tunggal (`index.html`) + CSS (`style.css`) + JS (`app.js`)
- Service Worker (`sw.js`) untuk installability di iOS/Android
- Web App Manifest (`manifest.json`) dengan ikon dan theme color
- Di-host di GitHub Pages

**Backend (Apps Script)**
- Satu file `Code.gs`
- `doGet(e)`: membaca data dari Sheet, mengembalikan JSON
- `doPost(e)`: menulis baris baru, mengedit baris, atau menghapus baris
- Autentikasi: URL endpoint mengandung token rahasia (query param `token=SECRET`) yang harus cocok dengan konstanta di script. Ini cukup untuk pemakaian personal.

---

## Fitur & Layar

### 1. Input Transaksi (halaman utama / modal cepat)
- Toggle Pemasukan / Pengeluaran
- Field: Nominal (numpad besar), Kategori (dropdown), Tanggal (default hari ini), Catatan (opsional)
- Tombol "Simpan" — feedback sukses/gagal jelas
- Target: selesai dalam < 10 detik

### 2. Dashboard
- Summary cards: Total Pemasukan, Total Pengeluaran, Saldo Bersih
- Filter periode: Hari Ini, Minggu Ini, Bulan Ini, Custom
- Grafik donut pengeluaran per kategori
- Grafik tren pemasukan vs pengeluaran (bar atau line)
- Insight: kategori terbesar, rata-rata harian, perbandingan bulan sebelumnya

### 3. Riwayat Transaksi
- Daftar semua transaksi (terbaru di atas)
- Filter: jenis (semua/pemasukan/pengeluaran), kategori, rentang tanggal
- Tiap item: tap untuk lihat detail, opsi Edit dan Hapus (dengan konfirmasi)

### 4. Bottom Navigation
- 3 tab: Dashboard, Tambah (CTA utama, paling menonjol di tengah), Riwayat

---

## Desain Visual

**Palet warna:**
- Base: `#FAFAF7` (cream putih bersih)
- Surface: `#FFFFFF`
- Aksen utama: `#E8829A` (dusty rose / pink elegan — bukan hot pink)
- Aksen sekunder: `#F2B5C5` (pink muda untuk hover/state)
- Teks utama: `#1A1A2E` (near-black)
- Teks sekunder: `#6B7280`
- Pemasukan: `#22C55E` (hijau)
- Pengeluaran: `#E8829A` (aksen pink)
- Error: `#EF4444`

**Tipografi:** `Plus Jakarta Sans` (Google Fonts) — modern, bersih, cocok untuk app finansial personal. Bukan Inter atau Geist (menghindari default AI). Alasan: karakter yang sedikit lebih warm dibanding Inter, cocok dengan nuansa pink/cream.

**Gaya visual:**
- Flat dengan shadow tipis dan selektif (hanya pada card yang perlu elevasi)
- Border radius konsisten: 12px card, 8px input, 24px tombol CTA utama
- Glassmorphism: **tidak digunakan** (menghindari slop)
- Glow: **tidak digunakan**
- Bottom navigation solid, tidak transparan
- Tombol CTA "+" di tengah bottom nav sedikit raised (lebih besar dari tab lain)

**States yang wajib ada:**
- Loading: skeleton card atau spinner sederhana
- Empty: pesan singkat + ilustrasi sederhana (SVG inline, bukan undraw)
- Error: pesan jelas + tombol coba lagi

---

## Keamanan

- Apps Script Web App di-deploy dengan akses: "Anyone" (agar bisa diakses dari frontend tanpa OAuth)
- Dilindungi dengan **secret token** di URL (`?token=RAHASIA_KAMU`). Token disimpan di:
  - Apps Script: sebagai konstanta di `Code.gs`
  - Frontend: sebagai konstanta di `config.js` (tidak di-commit ke repo publik, atau pakai GitHub Secrets jika pakai CI)
- Risiko: jika URL bocor, orang lain bisa akses Sheet. Untuk pemakaian personal ini acceptable (data tidak mengandung informasi sensitif pihak lain).
- Builder's call: token disimpan di `config.js` yang masuk `.gitignore` jika repo publik, atau di environment variable Netlify jika host di sana.

---

## Panduan Setup (garis besar, detail di README)

1. Buat spreadsheet Google Sheets baru
2. Buka Apps Script, paste `Code.gs`, deploy sebagai Web App
3. Salin URL endpoint ke `config.js` di frontend
4. Upload/push ke GitHub, aktifkan GitHub Pages
5. Buka URL di Safari iOS > "Add to Home Screen"

---

## Apa yang Diserahkan ke Builder

- Pemilihan library grafik: **Chart.js** (ringan, tidak perlu npm, bisa via CDN) — builder's call
- Format tanggal di Sheet: `DD/MM/YYYY` sebagai string — lebih mudah dibaca manusia di Sheet
- Jumlah transaksi yang dimuat per halaman di Riwayat: 50 terbaru — builder's call, bisa disesuaikan
- Ikon yang digunakan: SVG inline sederhana yang relevan per fitur, bukan icon library generik

---

*Design doc ini dibuat berdasarkan sesi brainstorming dengan pemilik pada 16 November 2026.*
