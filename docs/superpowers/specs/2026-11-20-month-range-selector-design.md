# Month Range Selector & Synchronized History Period Filter Design Document

**Date:** 2026-11-20  
**Topic:** Fitur Rentang Bulan & Filter Periode Riwayat Transaksi Terpadu  
**Status:** Approved (Opsi A + Pendekatan 1)

## 1. Intent & Why
Pengguna membutuhkan:
1. Kemampuan memilih rentang multi-bulan bebas (misalnya Januari – Maret 2026, kuartal, atau semester) langsung dari modal grid 12 bulan yang praktis.
2. Filter periode waktu pada tab **Riwayat Transaksi** yang tersinkronisasi dengan Dashboard, sehingga pengguna dapat meninjau daftar transaksi (Semua, Pengeluaran, Pemasukan, maupun Pindah Dana) pada bulan tertentu (misal: Mei 2025) atau rentang waktu tertentu dengan mudah.

## 2. Goals, Non-Goals, & Anti-Goals
* **Goals:**
  * **Rentang Multi-Bulan (Opsi A):**
    * Interaksi 2-Tap di grid 12 bulan modal `#modal-month-picker` untuk menentukan bulan awal dan bulan akhir.
    * Visualisasi pita highlight (`--color-primary-light`) menghubungkan bulan awal dan akhir.
    * Tombol "Terapkan Rentang" dan reset ke "Bulan Sekarang".
    * Dashboard menghitung ringkasan saldo, pemasukan, pengeluaran, donat kategori, arus kas, top income, dan top expense sesuai rentang tersebut.
    * Rata-rata harian menghitung total hari riil pada bulan-bulan dalam rentang yang dipilih.
  * **Filter Periode Terpadu di Tab Riwayat (Pendekatan 1):**
    * Tab Riwayat memiliki barisan filter periode yang selaras dengan Dashboard (`Bulan Ini`, `Minggu Ini`, `Hari Ini`, `Semua Waktu`, `📅 Pilih Periode/Rentang`).
    * Perubahan filter periode di Riwayat langsung memperbarui Dashboard, dan sebaliknya.
    * Filter jenis transaksi (`Semua`, `Pengeluaran`, `Pemasukan`, `Pindah Dana`) dan kotak pencarian teks tetap bekerja beriringan dengan filter periode waktu.
    * Transaksi `Pindah Dana (Transfer)` tetap dapat dilihat dan difilter pada periode waktu terpilih di tab Riwayat.
* **Non-Goals:**
  * Mengubah backend Google Apps Script / `Code.gs`. Seluruh filter dilakukan di client-side.
* **Anti-Goals:**
  * Membuat pengaturan periode yang terpisah-pisah dan membingungkan antara Dashboard dan Riwayat.
  * Menghilangkan kemampuan memilih 1 bulan tunggal.

## 3. Approaches Considered & Trade-offs
* **Fitur Rentang Bulan**:
  * **Opsi A (2-Tap Range Selection di Grid 12 Bulan) — TERPILIH**: Modern, cepat di layar ponsel, satu modal untuk 1 bulan tunggal maupun rentang multi-bulan.
* **Filter Periode di Riwayat**:
  * **Pendekatan 1 (Sinkron & Terpadu dengan Dashboard) — TERPILIH**: Pengalaman pengguna mulus tanpa kebingungan saat berpindah tab. Tombol filter periode tersedia di kedua tab.

## 4. Detailed Specification

### A. Modal Grid 12 Bulan & Rentang Multi-Bulan (`index.html` & `css/style.css`)
* Di dalam `#modal-month-picker`:
  * Badge status rentang: `#picker-range-status` (misal: `📅 Rentang: Jan – Mar 2026 (3 Bulan)`).
  * Tombol aksi footer:
    * `#btn-apply-month-range` ("Terapkan Rentang")
    * `#btn-picker-current-month` ("Bulan Sekarang")
* Styling CSS:
  * `.month-picker-btn.range-start`: background `--color-primary`, border-radius kiri.
  * `.month-picker-btn.range-end`: background `--color-primary`, border-radius kanan.
  * `.month-picker-btn.range-between`: background `--color-primary-light`, text `--color-primary`, border-radius 0.

### B. Tampilan Tab Riwayat Transaksi (`index.html` & `css/style.css`)
* Di dalam `#view-history`:
  * Tepat di bawah `.search-box-wrapper`, tambahkan baris filter periode riwayat:
    ```html
    <div id="history-period-bar" class="filter-bar" role="tablist" aria-label="Filter periode riwayat">
      <button class="filter-pill active" data-period="this-month" role="tab">Bulan Ini</button>
      <button class="filter-pill" data-period="this-week" role="tab">Minggu Ini</button>
      <button class="filter-pill" data-period="today" role="tab">Hari Ini</button>
      <button class="filter-pill" data-period="all" role="tab">Semua</button>
      <button type="button" id="btn-filter-history-custom-month" class="filter-pill" data-period="custom-month" role="tab">📅 Pilih Bulan</button>
    </div>
    ```
  * Di bawahnya adalah barisan filter jenis transaksi (`data-history-type="all|Pengeluaran|Pemasukan|Transfer"`).

### C. Logika State & Filter (`js/app.js`)
* **State Tambahan**:
  * `rangeStartMonth`: `number` (0-11)
  * `rangeEndMonth`: `number` (0-11)
  * `rangeSelectionStep`: `"start" | "end"`
* **Helper Filter Periode Transaksi**:
  * Ekstrak fungsi pembantu `isDateInSelectedPeriod(itemDate)` agar dipakai bersama oleh `getFilteredTransactionsByPeriod()` (Dashboard) dan `renderHistoryList()` (Riwayat).
  * Untuk Dashboard: transfer diabaikan (`if (item.type === "Transfer") return false`).
  * Untuk Riwayat: transfer tetap diproses dan disaring berdasarkan tanggalnya.
* **Sinkronisasi Antar-Tab**:
  * Saat periode diganti di Dashboard atau di Riwayat, tombol filter pill aktif di kedua tab otomatis diperbarui bersamaan dengan labelnya (misal: `📅 Jan – Mar 2026`).
* **Empty State Riwayat**:
  * Jika riwayat kosong karena filter periode, tampilkan deskripsi: "Tidak ada transaksi pada periode yang dipilih."

### D. Sync & Versi Cache
* Bump Service Worker ke `catatan-keuangan-v17`.
* Sinkronkan seluruh berkas ke folder `public/`.
