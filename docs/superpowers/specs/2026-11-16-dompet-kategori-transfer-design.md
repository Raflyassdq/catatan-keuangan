# Sistem Dompet Digital, Kategori Dinamis & Pindah Dana - Design Doc

**Tanggal:** 2026-11-16  
**Status:** Siap Dikerjakan (Hasil Wawancara Grill-Me)

---

## 1. Intent & Problem Statement

Pengguna dan pasangannya memiliki beberapa sumber dana/rekening (Cash, Bank 1, Bank 2, GoPay, ShopeePay, DANA). Sebelumnya, seluruh pengeluaran dan pemasukan hanya tercatat sebagai satu saldo global tanpa mengetahui uang tersebut berada di rekening/kantong mana. Pengguna juga sering melakukan pindah dana antar-rekening (misal: tarik tunai dari Bank ke Cash, top-up GoPay dari Bank) dan membutuhkan fleksibilitas menambah kategori transaksi baru langsung dari aplikasi.

---

## 2. Fitur Baru

### A. Dompet Digital / Sumber Uang (Multi-Wallet)
- Daftar dompet tersimpan di Google Sheets pada sheet baru bernama **`Dompet`** (kolom: `Nama Dompet | Saldo Awal`).
- Default dompet awal: `Cash`, `Bank 1`, `Bank 2`, `GoPay`, `ShopeePay`, `DANA`.
- Pengguna bisa menambah dompet baru dan mengisi saldo awal.
- Setiap transaksi **Pengeluaran** memilih dompet asal (uang keluar dari mana).
- Setiap transaksi **Pemasukan** memilih dompet tujuan (uang masuk ke mana).
- **Kalkulasi Saldo Tiap Dompet:**
  $$\text{Saldo Dompet} = \text{Saldo Awal} + \sum\text{Pemasukan} - \sum\text{Pengeluaran} + \sum\text{Transfer Masuk} - \sum\text{Transfer Keluar}$$
- Total Saldo Bersih di dashboard adalah penjumlahan dari seluruh saldo dompet aktif.

### B. Pindah Dana (Transfer Antar Dompet)
- Ditambahkan tab ke-3 di popup modal input utama: `[Pengeluaran] | [Pemasukan] | [Pindah Dana]`.
- Input Pindah Dana:
  - Nominal (Rp ...)
  - Dari Dompet (Dropdown dompet asal)
  - Ke Dompet (Dropdown dompet tujuan, divalidasi tidak boleh sama dengan asal)
  - Tanggal
  - Catatan (Opsional)
- Dicatat di Google Sheets pada sheet baru bernama **`Transfer`** (kolom: `Tanggal | Nominal | Dari Dompet | Ke Dompet | Catatan`).
- Transaksi transfer tidak memengaruhi total pengeluaran atau pemasukan global di dashboard (hanya mutasi antar-dompet).
- Tampil di tab Riwayat dengan badge khusus warna biru/abu-abu netral (Transfer).

### C. Kategori Dinamis (Custom Categories)
- Daftar kategori disimpan di Google Sheets pada sheet baru bernama **`Kategori`** (kolom: `Jenis | Nama Kategori`).
- Pengguna bisa menambah kategori baru langsung dari form input transaksi lewat tombol *"+ Tambah Kategori"* atau dari menu Kelola Kategori.
- Otomatis tersinkronisasi antara HP pengguna dan HP pasangannya.

### D. Tampilan UI Dashboard (Anti-Slop & Mobile-First)
- Di bawah kartu Saldo Bersih, terdapat **Carousel Kartu Dompet Horizontal** (bisa digeser ke samping dengan sentuhan jempol):
  - Kartu per dompet menampilkan: Ikon jenis dompet, Nama Dompet, Saldo Saat Ini.
  - Kartu terakhir: tombol *"+ Tambah Dompet"*.
- Modal kelola dompet & modal kelola kategori yang bersih, ramah sentuhan, tanpa pop-up yang berantakan.

---

## 3. Struktur Google Sheets Terbaru

1. **`Pemasukan`**: `Tanggal | Nominal | Kategori | Catatan | Dompet` (menggunakan kolom ke-5).
2. **`Pengeluaran`**: `Tanggal | Nominal | Kategori | Catatan | Dompet` (ditambahkan kolom ke-5).
3. **`Transfer`**: `Tanggal | Nominal | Dari Dompet | Ke Dompet | Catatan` (sheet baru).
4. **`Dompet`**: `Nama Dompet | Saldo Awal` (sheet baru).
5. **`Kategori`**: `Jenis | Nama Kategori` (sheet baru).

Backend `Code.gs` akan dilengkapi fungsi auto-setup agar otomatis membuat sheet `Transfer`, `Dompet`, dan `Kategori` jika belum ada saat fungsi dijalankan.

---

## 4. Keamanan & Sinkronisasi
- Seluruh data baru (Dompet, Kategori, Transfer) tetap menggunakan `SECRET_TOKEN` yang sama.
- Backend Apps Script mendukung endpoint GET `getAll` yang mengembalikan transaksi, dompet, saldo per dompet, dan daftar kategori sekaligus dalam 1 kali fetch hemat kuota.
