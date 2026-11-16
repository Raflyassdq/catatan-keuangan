# Panduan Lengkap: Aplikasi Catatan Keuangan Pribadi (Mobile PWA)

Aplikasi web mobile-first untuk mencatat pemasukan dan pengeluaran harian dalam hitungan detik (< 10 detik), langsung tersimpan secara aman ke Google Sheets milik Anda sendiri tanpa biaya bulanan (100% Gratis).

---

## Daftar Isi
1. [Struktur File](#struktur-file)
2. [Langkah 1: Setup Google Sheets & Google Apps Script](#langkah-1-setup-google-sheets--google-apps-script)
3. [Langkah 2: Hubungkan Frontend ke Google Apps Script](#langkah-2-hubungkan-frontend-ke-google-apps-script)
4. [Langkah 3: Hosting Frontend Gratis (GitHub Pages)](#langkah-3-hosting-frontend-gratis-github-pages)
5. [Langkah 4: Memasang ke Layar Utama iPhone (iOS) & Android](#langkah-4-memasang-ke-layar-utama-iphone-ios--android)
6. [Checklist Pengujian Fungsional](#checklist-pengujian-fungsional)

---

## Struktur File

```text
d:\Pemasukan\
├── google-apps-script/
│   └── Code.gs              <- Kode backend untuk Google Apps Script
├── public/
│   ├── index.html           <- Antarmuka utama aplikasi
│   ├── manifest.json        <- Konfigurasi PWA (instalasi ke HP)
│   ├── sw.js                <- Service Worker (dukungan offline shell)
│   ├── css/
│   │   └── style.css        <- Desain visual elegan (Cream & Dusty Rose)
│   ├── js/
│   │   ├── config.js        <- Konfigurasi URL dan kategori
│   │   ├── api.js           <- Komunikasi data ke Google Sheets
│   │   └── app.js           <- Logika aplikasi, grafik, dan kalkulasi
│   └── icons/
│       ├── icon-192.svg     <- Ikon aplikasi di layar HP
│       └── icon-512.svg
└── README.md                <- Panduan ini
```

---

## Langkah 1: Setup Google Sheets & Google Apps Script

Tidak perlu membuat tabel manual satu per satu, script akan membuatnya secara otomatis!

1. Buka browser di laptop atau HP, lalu kunjungi [Google Sheets](https://sheets.google.com).
2. Buat spreadsheet baru dan beri nama file: **Keuangan Pribadi**.
3. Di menu bar atas Google Sheets, klik **Extensions** (Ekstensi) > **Apps Script**.
4. Akan terbuka tab baru editor script:
   - Hapus semua kode bawaan yang ada di editor (`function myFunction() { ... }`).
   - Buka file [`google-apps-script/Code.gs`](google-apps-script/Code.gs), salin (copy) seluruh isinya, lalu tempel (paste) ke editor Apps Script.
5. *(Opsional)* Jika Anda ingin mengganti kata sandi rahasia, ubah baris `SECRET_TOKEN: "SECRET_KEUANGAN_2026"` dengan kata sandi Anda sendiri.
6. Klik ikon **Save** (Simpan/disket) di bagian atas editor.
7. Di dropdown fungsi (di sebelah tombol Debug), pilih fungsi `setupSheets`, lalu klik **Run** (Jalankan).
   - *Catatan:* Google akan meminta izin akses ("Authorization Required"). Klik **Review Permissions** > pilih akun Google Anda > klik **Advanced** > klik **Go to Untitled project (unsafe)** > klik **Allow**.
   - Setelah dijalankan, kembali ke tab Google Sheets Anda. Anda akan melihat dua sheet sudah otomatis dibuat rapi: **"Pemasukan"** dan **"Pengeluaran"**.
8. **Deploy sebagai Web App**:
   - Di pojok kanan atas Apps Script, klik tombol biru **Deploy** > **New deployment**.
   - Klik ikon gerigi (Select type) > pilih **Web app**.
   - Isi formulir:
     - **Description**: `Keuangan API v1`
     - **Execute as**: `Me (email-anda@gmail.com)`
     - **Who has access**: **`Anyone`** *(Wajib pilih 'Anyone' agar aplikasi di HP Anda bisa mengirim data tanpa login berulang-ulang)*.
   - Klik **Deploy**.
   - Salin dan simpan **Web app URL** yang muncul (bentuknya seperti: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Langkah 2: Hubungkan Frontend ke Google Apps Script

Ada dua cara mudah:

### Cara A: Melalui Menu Pengaturan di Aplikasi (Paling Praktis)
1. Buka aplikasi di browser (bisa buka file `public/index.html` langsung).
2. Di pojok kanan atas, klik tombol status **Atur URL**.
3. Tempelkan **Web app URL** yang Anda salin tadi.
4. Klik **Simpan & Tes Koneksi**. Status akan berubah menjadi **Tersambung** (titik hijau).

### Cara B: Mengisi Langsung di File `config.js`
1. Buka file [`public/js/config.js`](public/js/config.js).
2. Masukkan URL Anda ke bagian:
   ```javascript
   DEFAULT_SCRIPT_URL: "https://script.google.com/macros/s/AKfycb.../exec",
   ```
3. Simpan file.

---

## Langkah 3: Hosting Frontend Gratis (GitHub Pages)

Agar aplikasi memiliki link web resmi ber-HTTPS yang bisa dibuka dari HP kapan saja:

1. Buat repositori baru di [GitHub](https://github.com/new) (misal: `catatan-keuangan`).
2. Upload semua file yang ada di dalam folder `public/` ke repositori tersebut (pastikan file `index.html` berada di root repositori).
3. Buka menu **Settings** di repositori GitHub Anda.
4. Di panel kiri, klik **Pages**.
5. Pada bagian **Branch**, pilih `main` dan folder `/(root)`, lalu klik **Save**.
6. Tunggu sekitar 1-2 menit, GitHub Pages akan memberikan URL aplikasi Anda, contohnya:  
   `https://username.github.io/catatan-keuangan/`

---

## Langkah 4: Memasang ke Layar Utama iPhone (iOS) & Android

### Di iPhone (iOS Safari):
1. Buka browser **Safari** di iPhone Anda (harus Safari agar bisa dijadikan PWA).
2. Kunjungi link GitHub Pages aplikasi Anda.
3. Tekan tombol **Share** (ikon kotak dengan panah ke atas di bagian bawah layar Safari).
4. Gulir ke bawah dan pilih **Add to Home Screen** (Tambahkan ke Layar Utama).
5. Beri nama (misal: "Keuangan") lalu tekan **Add** di pojok kanan atas.
6. Ikon aplikasi bernuansa dusty rose elegan sekarang muncul di layar utama iPhone Anda. Saat diketuk, aplikasi akan terbuka layaknya aplikasi native iOS tanpa bar browser!

### Di Android (Google Chrome):
1. Buka **Google Chrome** di HP Android Anda.
2. Kunjungi link aplikasi.
3. Tekan ikon titik tiga di pojok kanan atas > pilih **Install app** atau **Tambahkan ke Layar Utama**.
4. Aplikasi siap digunakan.

---

## Checklist Pengujian Fungsional

Centang setiap poin di bawah ini untuk memastikan seluruh sistem berjalan sempurna:

- [ ] **1. Inisialisasi Sheet**: Buka Google Sheets dan pastikan sheet `Pemasukan` (kolom: Tanggal, Nominal, Kategori, Catatan, Sumber) dan `Pengeluaran` (kolom: Tanggal, Nominal, Kategori, Catatan) sudah terbuat dengan benar.
- [ ] **2. Tes Koneksi**: Buka aplikasi, klik badge di kanan atas, pastikan status tertulis `Tersambung` dengan indikator hijau.
- [ ] **3. Input Pengeluaran Cepat (< 10 detik)**:
  - Tekan tombol (+) di tengah bawah navigasi.
  - Masukkan nominal (misal: `45.000`), pilih kategori `Makan & Minum`, biarkan tanggal hari ini.
  - Tekan **Simpan Transaksi**.
  - Pastikan notifikasi sukses muncul dan data langsung masuk sebagai baris baru di sheet `Pengeluaran`.
- [ ] **4. Input Pemasukan**:
  - Buka form (+), tekan tombol toggle `Pemasukan`.
  - Masukkan nominal (misal: `5.000.000`), kategori `Gaji`, isi sumber `Kantor`.
  - Tekan **Simpan Transaksi**.
  - Pastikan data masuk ke sheet `Pemasukan`.
- [ ] **5. Pembaruan Ringkasan (Dashboard)**:
  - Cek kartu `Saldo Bersih`: nominal harus otomatis terhitung (Pemasukan dikurangi Pengeluaran).
  - Cek kartu `Pemasukan` dan `Pengeluaran`.
- [ ] **6. Filter Periode**:
  - Coba ganti filter periode antara `Hari Ini`, `Minggu Ini`, `Bulan Ini`, dan `Semua`.
  - Pastikan angka total dan grafik menyesuaikan dengan tanggal transaksi.
- [ ] **7. Visualisasi Grafik**:
  - Grafik Donut harus menampilkan persentase pengeluaran per kategori.
  - Grafik Batang harus menampilkan perbandingan total masuk vs keluar.
- [ ] **8. Tab Riwayat & Pencarian**:
  - Buka tab `Riwayat` di pojok kanan bawah.
  - Ketik nama kategori atau catatan di kotak pencarian, pastikan daftar transaksi terfilter secara instan.
- [ ] **9. Fitur Edit Transaksi**:
  - Ketuk salah satu kartu transaksi di tab Riwayat.
  - Tekan tombol **Edit**, ubah nominalnya, lalu simpan.
  - Periksa di Google Sheets, pastikan angka pada baris tersebut sudah terupdate.
- [ ] **10. Fitur Hapus Transaksi**:
  - Ketuk salah satu kartu transaksi, tekan tombol **Hapus**.
  - Konfirmasi penghapusan pada dialog pop-up.
  - Periksa di Google Sheets, pastikan baris transaksi tersebut sudah terhapus secara rapi.
