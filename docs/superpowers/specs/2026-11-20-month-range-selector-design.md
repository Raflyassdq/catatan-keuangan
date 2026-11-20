# Month Range Selector (Rentang Multi-Bulan) Design Document

**Date:** 2026-11-20  
**Topic:** Fitur Rentang Bulan (e.g. Januari – Maret 2026)  
**Status:** Approved (Opsi A)

## 1. Intent & Why
Pengguna membutuhkan kemampuan untuk melihat ringkasan keuangan dalam rentang multi-bulan sekaligus (misalnya 3 bulan berturut-turut seperti Januari – Maret, kuartal, atau semester) secara bebas, untuk mempermudah evaluasi keuangan berkala tanpa harus menghitung manual satu per satu bulan.

## 2. Goals, Non-Goals, & Anti-Goals
* **Goals:**
  * Memungkinkan pemilihan rentang bulan awal dan bulan akhir langsung pada modal grid 12 bulan yang sudah ada (`Opsi A: 2-Tap Range Selection`).
  * Memberikan umpan balik visual yang jelas pada grid:
    * Bulan Mulai & Bulan Selesai disorot dengan warna solid aktif (`var(--color-primary)`).
    * Bulan di antara rentang disorot dengan pita warna lembut (`var(--color-primary-light)`).
    * Indikator teks status rentang (misal: `📅 Rentang: Jan – Mar 2026 (3 Bulan)`).
  * Saat rentang diterapkan:
    * Filter periode aktif dengan label tombol: `📅 Jan – Mar 2026`.
    * Teks periode di dashboard: `Periode: Januari – Maret 2026 (3 Bulan)`.
    * Semua kalkulasi (saldo, pemasukan, pengeluaran, donat kategori, perbandingan arus kas, pemasukan terbesar, pengeluaran terbesar) otomatis menghitung seluruh transaksi dalam rentang tersebut.
    * Rata-rata harian dihitung secara akurat berdasarkan total hari riil dari rentang bulan yang dipilih.
* **Non-Goals:**
  * Mengubah backend Google Apps Script (semua kalkulasi rentang bulan dilakukan di sisi klien pada data transaksi yang telah dimuat).
* **Anti-Goals:**
  * Menambah kerumitan modal baru atau membuat form dropdown bertingkat yang sempit di layar HP.
  * Menghilangkan kemampuan memilih 1 bulan tunggal (pengguna tetap bisa memilih 1 bulan jika hanya mengetuk 1 bulan lalu menekan terapkan).

## 3. Approaches Considered & Trade-offs
* **Opsi A (2-Tap Range Selection di Grid 12 Bulan) — TERPILIH**:
  * Tap pertama memilih bulan awal, tap kedua memilih bulan akhir. Menghubungkan bulan dengan highlight pita.
  * *Trade-off:* Memerlukan sedikit logika status tap (apakah sedang memilih start atau end), namun sangat cepat dan natural bagi pengguna di layar sentuh.
* **Opsi B (Dua Selector Terpisah 'Dari & Sampai' + Preset Kuartal)**:
  * Menaruh dua kontrol dropdown terpisah di dalam modal.
  * *Trade-off:* Lebih banyak elemen kontrol form yang memakan ruang vertikal di layar ponsel.

## 4. Detailed Specification

### A. Interaksi & UI Modal (`index.html` & `css/style.css`)
* Di dalam modal `#modal-month-picker`:
  * Tambahkan indikator status rentang:
    ```html
    <div id="picker-range-status" class="range-status-badge">
      <span>Pilih bulan awal & bulan akhir</span>
    </div>
    ```
  * Tombol aksi di bawah grid:
    * Tombol **"Terapkan Rentang"** (`#btn-apply-month-range`)
    * Tombol **"Bulan Sekarang"** (`#btn-picker-current-month`)
* Status visual pada tombol bulan `.month-picker-btn`:
  * `.active` / `.range-start`: Bulan awal (kiri rounded).
  * `.range-end`: Bulan akhir (kanan rounded).
  * `.range-between`: Bulan di antara rentang (background `var(--color-primary-light)`, warna teks `var(--color-primary)`, border-radius 0).

### B. Logika State & Filter (`js/app.js`)
* **State**:
  * `rangeStartMonth`: `number` (0-11, default: `new Date().getMonth()`).
  * `rangeEndMonth`: `number` (0-11, default: `new Date().getMonth()`).
  * `rangeSelectionStep`: `"start" | "end"`.
* **Interaksi Klik Bulan di Grid**:
  * Jika sedang memilih `start` (atau reset): tetapkan `rangeStartMonth = clickedMonth`, `rangeEndMonth = clickedMonth`, ubah step ke `"end"`.
  * Jika sedang memilih `end`:
    * Jika `clickedMonth < rangeStartMonth`: otomatis balikkan (`rangeStartMonth = clickedMonth`, `rangeEndMonth = previousStart`).
    * Lainnya: `rangeEndMonth = clickedMonth`.
    * Ubah step kembali ke `"start"`.
  * Perbarui visual highlight pada 12 tombol bulan.
* **Filter Transaksi (`getFilteredTransactionsByPeriod`)**:
  * Saat `period === "custom-range"`:
    ```javascript
    const m = itemDate.getMonth();
    const y = itemDate.getFullYear();
    return y === state.customYear && m >= state.rangeStartMonth && m <= state.rangeEndMonth;
    ```
* **Kalkulasi Hari Riil untuk Rata-rata Harian**:
  * Iterasi dari `rangeStartMonth` sampai `rangeEndMonth`:
    * Hitung jumlah hari tiap bulan dengan `new Date(state.customYear, m + 1, 0).getDate()`.
    * Jika bulan tersebut adalah bulan berjalan (`m === now.getMonth() && y === now.getFullYear()`), gunakan `now.getDate()`.
    * Jumlahkan total hari sebagai pembagi rata-rata pengeluaran harian.
* **Label Teks**:
  * Tombol Filter Pill:
    * Jika 1 bulan: `📅 [Bulan Singkat] [Tahun]` (misal: `📅 Jan 2026`).
    * Jika rentang: `📅 [Start] – [End] [Tahun]` (misal: `📅 Jan – Mar 2026`).
  * Teks Periode Dashboard (`DOM.periodText`):
    * `Periode: [Nama Bulan Start] – [Nama Bulan End] [Tahun] ([N] Bulan)`.

### C. Sync & Versi Service Worker
* Bump Service Worker ke `catatan-keuangan-v17`.
* Sinkronkan ke folder `public/`.
