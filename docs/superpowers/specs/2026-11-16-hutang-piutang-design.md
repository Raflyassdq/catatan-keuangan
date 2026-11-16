# Sistem Pencatatan Hutang & Piutang - Design Doc

**Tanggal:** 2026-11-16  
**Status:** Disetujui (Hasil Sesi Grill-Me)

---

## 1. Intent & Problem Statement

Pengguna membutuhkan sistem pencatatan Hutang (kewajiban membayar ke orang lain) dan Piutang (tagihan/uang pengguna yang dipinjam orang lain). Pengguna ingin mengetahui:
1. Berapa total uang pengguna yang masih berada di luar (Piutang) dan siapa saja yang berhutang.
2. Berapa total kewajiban yang harus dibayarkan (Hutang) dan kepada siapa saja.
3. Fitur pelunasan bertahap (cicil) atau lunas penuh yang otomatis memotong/menambah saldo dompet riil saat transaksi pembayaran terjadi.

---

## 2. Struktur Data Google Sheets

Sheet baru bernama **`HutangPiutang`**:

| Kolom | Tipe | Contoh |
| :--- | :--- | :--- |
| **ID** | String | `debt-1718000000` |
| **Tanggal** | String | `16/11/2026` |
| **Jenis** | String | `Piutang` atau `Hutang` |
| **Nama Pihak** | String | `Budi` |
| **Nominal Total** | Number | `1000000` |
| **Terbayar** | Number | `400000` |
| **Sisa** | Number | `600000` |
| **Status** | String | `Belum Lunas` atau `Lunas` |
| **Jatuh Tempo** | String | `30/11/2026` (opsional) |
| **Catatan** | String | `Pinjam untuk servis motor` |

---

## 3. Alur Kerja (Workflows)

### A. Pencatatan Baru (Hutang / Piutang)
- Input:
  - Jenis: `Piutang (Orang berhutang ke saya)` atau `Hutang (Saya berhutang ke orang)`
  - Nama Orang / Pihak
  - Nominal Total (Rp ...)
  - Tanggal Pencatatan
  - Jatuh Tempo (Opsional)
  - Catatan (Opsional)
- Awalnya nilai `Terbayar` = 0, `Sisa` = Nominal Total, `Status` = "Belum Lunas".

### B. Pelunasan (Bayar / Terima Pembayaran)
- Pengguna memilih transaksi hutang/piutang yang ingin dilunasi, lalu menekan tombol **"Lunasi / Cicil"**.
- Input:
  - Nominal Bayar (bisa penuh atau sebagian)
  - Dompet Terkait:
    - Jika Bayar Hutang: Uang keluar dari dompet mana (misal: `CASH` atau `BRI`).
    - Jika Terima Piutang: Uang masuk ke dompet mana (misal: `DANA` atau `BCA`).
  - Tanggal Pembayaran
  - Catatan Pembayaran
- Efek Sistem:
  1. Baris `HutangPiutang` diperbarui: `Terbayar` bertambah, `Sisa` berkurang. Jika `Sisa <= 0`, status berubah menjadi `Lunas`.
  2. Otomatis membuat baris transaksi riil:
     - Jika Bayar Hutang -> Dicatat di sheet `Pengeluaran` dengan kategori `Bayar Hutang` dari dompet terpilih.
     - Jika Terima Piutang -> Dicatat di sheet `Pemasukan` dengan kategori `Pelunasan Piutang` ke dompet terpilih.
  3. Saldo dompet riil langsung ter-update secara otomatis!

---

## 4. Antarmuka Pengguna (UI)

- **Kartu Ringkasan di Dashboard:**
  - Terletak di bawah Carousel Dompet.
  - Menampilkan:
    - **Total Piutang:** Rp ... *(Uang di Luar)*
    - **Total Hutang:** Rp ... *(Kewajiban)*
  - Tombol aksi:
    - Tombol `+ Catat`: Membuka formulir tambah hutang/piutang baru.
    - Mengetuk kartu: Membuka modal daftar lengkap hutang & piutang.
- **Modal Daftar Hutang & Piutang:**
  - Tab filter status: `Semua` | `Belum Lunas` | `Lunas`.
  - Tab filter jenis: `Semua` | `Piutang (Uang di Luar)` | `Hutang (Kewajiban)`.
  - Kartu per item dengan:
    - Nama pihak & badge jenis
    - Progress pembayaran visual
    - Nominal Sisa (besar dan jelas)
    - Tombol aksi cepat: **Lunasi / Cicil**, **Hapus**.
