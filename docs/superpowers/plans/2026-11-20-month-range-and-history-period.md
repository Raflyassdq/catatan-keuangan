# Month Range Selector & Synchronized History Period Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghadirkan fitur pemilihan rentang multi-bulan (misal: Januari – Maret 2026) dengan interaksi 2-tap pada grid 12 bulan modal, serta menambahkan filter periode waktu pada tab Riwayat yang tersinkronisasi penuh dengan Dashboard.

**Architecture:** 
1. Memperluas modal `#modal-month-picker` dengan status rentang dan tombol "Terapkan Rentang", serta visualisasi highlight `.range-start`, `.range-between`, dan `.range-end`.
2. Mengekstrak fungsi helper `isDateInSelectedPeriod(itemDate)` di `js/app.js` untuk digunakan bersama oleh penyaringan Dashboard (`getFilteredTransactionsByPeriod()`) dan penyaringan Riwayat (`renderHistoryList()`).
3. Menambahkan barisan filter periode `#history-period-bar` di `#view-history` dan menyinkronkan status tombol aktif di kedua tab.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS Custom Properties, Service Worker cache.

**Spec:** `docs/superpowers/specs/2026-11-20-month-range-selector-design.md`

## Global Constraints
* Barisan filter periode pada tab Riwayat harus tetap nyaman diakses di ponsel tanpa bertabrakan dengan filter jenis transaksi atau kotak pencarian.
* Transaksi Pindah Dana (Transfer) tetap dapat difilter dan dilihat pada periode terpilih di tab Riwayat (sementara di dashboard tetap diexclude dari pemasukan/pengeluaran).
* Tidak mengubah backend Google Apps Script / `Code.gs`.
* Seluruh berkas yang dimodifikasi (`index.html`, `css/style.css`, `js/app.js`, `sw.js`) wajib disinkronkan ke folder `public/`.
* Versi cache Service Worker ditingkatkan ke `catatan-keuangan-v17`.

## Review Focus
1. **Urutan Tap Terbalik:** Jika pengguna menekan bulan yang lebih akhir terlebih dahulu (misal Maret) lalu bulan yang lebih awal (misal Januari), sistem harus otomatis mengurutkannya (`start = Jan`, `end = Mar`).
2. **Pemilihan 1 Bulan Tunggal:** Jika pengguna hanya mengetuk 1 bulan lalu menekan "Terapkan", rentang adalah 1 bulan (`start === end`), dengan label yang rapi (`📅 Jan 2026`).
3. **Pindah Dana (Transfer) di Tab Riwayat:** Saat memfilter riwayat periode (misal Mei 2025), transaksi Transfer pada periode tersebut harus tetap muncul saat tab jenis "Semua" atau "Pindah Dana" dipilih.
4. **Sinkronisasi Dua Arah:** Mengubah periode di tab Riwayat harus otomatis memperbarui tombol filter dan ringkasan di Dashboard, begitu pula sebaliknya.
5. **Kalkulasi Hari Riil Rentang:** Pembagi rata-rata pengeluaran harian harus menjumlahkan hari riil seluruh bulan dalam rentang (misal Jan–Mar = 31+28+31 = 90 hari).

---

### Task 1: Markup & Styling Modal Rentang Bulan dan Filter Periode Riwayat
**Files:**
- Modify: `index.html`
- Modify: `css/style.css`

**Interfaces:**
- Produces:
  - Elemen `#picker-range-status` dan `#btn-apply-month-range` di `#modal-month-picker`
  - Elemen `#history-period-bar` dengan tombol filter periode di `#view-history`
  - CSS classes: `.range-status-badge`, `.btn-apply-range`, `.month-picker-btn.range-start`, `.month-picker-btn.range-end`, `.month-picker-btn.range-between`

- [ ] **Step 1: Tambahkan status rentang dan tombol terapkan pada modal di `index.html`**
  Menambahkan `#picker-range-status` di atas grid bulan dan `#btn-apply-month-range` di footer aksi `#modal-month-picker`.
- [ ] **Step 2: Tambahkan `#history-period-bar` di `#view-history` `index.html`**
  Menempatkan barisan filter periode di bawah kotak pencarian riwayat dengan pill `Bulan Ini`, `Minggu Ini`, `Hari Ini`, `Semua`, dan `📅 Pilih Bulan`.
- [ ] **Step 3: Tambahkan gaya CSS rentang bulan dan filter riwayat di `css/style.css`**
  Menambahkan aturan untuk badge status rentang, efek pita highlight antar-bulan, serta margin dan scrolling bar filter riwayat.
- [ ] **Step 4: Commit perubahan Task 1**
  Run: `git add index.html css/style.css; git commit -m "feat: add month range modal controls and history period filter markup"`

---

### Task 2: Logika Interaksi 2-Tap Rentang Bulan pada Modal
**Files:**
- Modify: `js/app.js`
- Test: `node -c js/app.js`

**Interfaces:**
- Produces:
  - `state.rangeStartMonth: number`
  - `state.rangeEndMonth: number`
  - `state.rangeSelectionStep: "start" | "end"`
  - `renderMonthPicker()` yang mendukung render range highlight

- [ ] **Step 1: Tambahkan state rentang dan DOM element baru di `js/app.js`**
  Mendaftarkan `rangeStartMonth`, `rangeEndMonth`, `rangeSelectionStep` di `state`, serta referensi `#picker-range-status`, `#btn-apply-month-range`, `#btn-filter-history-custom-month`, dan `.filter-pill[data-period]` di `DOM`.
- [ ] **Step 2: Perbarui fungsi `renderMonthPicker()` di `js/app.js`**
  Menghitung kelas `.range-start`, `.range-end`, `.range-between`, dan memperbarui teks pada `#picker-range-status` (misal: `Rentang: Jan – Mar 2026 (3 Bulan)`).
- [ ] **Step 3: Implementasikan interaksi klik 2-tap pada tombol bulan dan tombol terapkan**
  - Tap 1: tentukan start.
  - Tap 2: tentukan end (otomatis urutkan jika terbalik).
  - Tombol "Terapkan Rentang": set `state.selectedPeriod = (start === end) ? "custom-month" : "custom-range"`, terapkan ke dashboard & riwayat, dan tutup modal.
- [ ] **Step 4: Validasi sintaks berkas `js/app.js`**
  Run: `node -c js/app.js`
  Expected: exit code 0.
- [ ] **Step 5: Commit perubahan Task 2**
  Run: `git add js/app.js; git commit -m "feat: implement 2-tap month range picker interaction"`

---

### Task 3: Filter Periode Terpadu (Dashboard & Riwayat) & Perhitungan Hari Riil
**Files:**
- Modify: `js/app.js`
- Test: `node -c js/app.js`

**Interfaces:**
- Produces:
  - Helper `isDateInSelectedPeriod(itemDate) -> boolean`
  - Helper `updatePeriodPillLabels(label) -> void`
  - Penyaringan periode pada `renderHistoryList()`
  - Logika pembagi hari riil rentang multi-bulan di `renderDashboard()`

- [ ] **Step 1: Buat fungsi `isDateInSelectedPeriod(itemDate)` di `js/app.js`**
  Mengecek kecocokan tanggal terhadap `today`, `this-week`, `this-month`, `custom-month`, `custom-range`, atau `all`.
- [ ] **Step 2: Perbarui `getFilteredTransactionsByPeriod()` dan `renderDashboard()`**
  - Gunakan `isDateInSelectedPeriod()` untuk menyaring transaksi.
  - Hitung total hari riil pada seluruh bulan dalam rentang untuk pembagi rata-rata harian.
  - Perbarui label periode: `Periode: [Start] – [End] [Tahun] ([N] Bulan)`.
- [ ] **Step 3: Perbarui `renderHistoryList()` dan event listener filter periode**
  - Filter daftar transaksi riwayat dengan `isDateInSelectedPeriod(itemDate)`.
  - Pasang event listener pada `#history-period-bar` yang tersinkronisasi dua arah dengan barisan filter periode dashboard.
  - Perbarui status teks kosong riwayat saat filter periode menghasilkan 0 transaksi.
- [ ] **Step 4: Tulis dan jalankan skrip verifikasi logika test**
  Run: `node .superpowers/sdd/test-range-logic.cjs`
  Expected: exit code 0.
- [ ] **Step 5: Commit perubahan Task 3**
  Run: `git add js/app.js; git commit -m "feat: implement unified period filtering for dashboard and history"`

---

### Task 4: Sinkronisasi Service Worker v17 & Folder Public
**Files:**
- Modify: `sw.js`
- Modify: `index.html`
- Modify: `public/index.html`
- Modify: `public/css/style.css`
- Modify: `public/js/app.js`
- Modify: `public/sw.js`
- Test: `node -c js/app.js; node -c sw.js; node -c public/js/app.js; node -c public/sw.js`

- [ ] **Step 1: Tingkatkan versi Service Worker ke `catatan-keuangan-v17`**
- [ ] **Step 2: Tingkatkan query string skrip di `index.html` ke `?v=17`**
- [ ] **Step 3: Sinkronkan seluruh berkas ke folder `public/`**
- [ ] **Step 4: Jalankan uji sintaks Node.js pada seluruh berkas JS**
  Run: `node -c js/app.js; node -c sw.js; node -c public/js/app.js; node -c public/sw.js`
  Expected: exit code 0.
- [ ] **Step 5: Commit perubahan Task 4**
  Run: `git add sw.js index.html public/; git commit -m "chore: bump service worker to v17 and sync public directory"`
- [ ] **Step 6: Push perubahan ke GitHub repository**
  Run: `git push origin main` (unsandboxed)
  Expected: successfully pushed to remote.
