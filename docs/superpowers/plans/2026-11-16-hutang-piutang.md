# Hutang & Piutang Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun sistem pelacakan Hutang & Piutang lengkap terintegrasi ke Google Sheets, kartu ringkasan di dashboard, modal daftar berfilter, dan alur pelunasan otomatis yang memotong/menambah saldo dompet riil.

**Architecture:** Memperluas Google Apps Script backend (`Code.gs`) dengan sheet `HutangPiutang`, API endpoint `addDebt`, `payDebt`, `deleteDebt`, serta frontend SPA dengan kartu ringkasan dashboard, modal daftar hutang/piutang, modal formulir baru, dan modal bayar pelunasan.

**Tech Stack:** Vanilla JavaScript (ES6+), Google Apps Script, HTML5/CSS3 (Antislop standards).

**Spec:** `docs/superpowers/specs/2026-11-16-hutang-piutang-design.md`

## Global Constraints

- Standar Desain: antislop & antislop-ui aktif.
- Format Mata Uang: Rupiah (`Rp 1.000.000`).
- Format Tanggal: Tanggal singkat Indonesia (`DD MMM YYYY`).
- Pelunasan wajib menghubungkan dompet riil sehingga saldo kas langsung ter-update.

## Review Focus

1. Kalkulasi Sisa Hutang/Piutang ($\text{Sisa} = \text{Nominal} - \text{Terbayar}$).
2. Pelunasan otomatis mencatat transaksi Pengeluaran/Pemasukan ke sheet kas.
3. Status otomatis beralih ke "Lunas" saat Sisa mencapai 0.
4. Total Piutang dan Total Hutang dihitung akurat dari akumulasi sisa transaksi yang belum lunas.
5. Responsif dan ramah sentuhan jempol di iPhone Safari.

---

### Task 1: Update Google Apps Script Backend (`Code.gs`)

**Files:**
- Modify: `google-apps-script/Code.gs`

**Interfaces:**
- Produces:
  - Sheet `HutangPiutang`: `ID | Tanggal | Jenis | Nama Pihak | Nominal | Terbayar | Sisa | Status | Jatuh Tempo | Catatan`
  - Endpoint GET `getAll`: menyertakan field `debts: []`
  - Endpoint POST:
    - `action === 'addDebt'`: `{ date, type, person, amount, dueDate, note }`
    - `action === 'payDebt'`: `{ debtRowIndex, debtId, payAmount, wallet, date, note }`
    - `action === 'deleteDebt'`: `{ rowIndex }`

- [ ] **Step 1: Update `setupSheets()` in `Code.gs`**
  - Buat sheet `HutangPiutang` otomatis dengan 10 kolom header jika belum ada.
- [ ] **Step 2: Update `doGet` in `Code.gs`**
  - Baca baris `HutangPiutang` dan kembalikan di dalam payload `getAll`.
- [ ] **Step 3: Update `doPost` in `Code.gs`**
  - Implementasi handler `addDebt`, `payDebt`, dan `deleteDebt`.

---

### Task 2: Update API Client (`js/api.js` & `public/js/api.js`)

**Files:**
- Modify: `js/api.js` & `public/js/api.js`

**Interfaces:**
- Produces:
  - `API.addDebt({ date, type, person, amount, dueDate, note })`
  - `API.payDebt({ debtRowIndex, debtId, payAmount, wallet, date, note })`
  - `API.deleteDebt(rowIndex)`

- [ ] **Step 1: Tambahkan method `addDebt`, `payDebt`, `deleteDebt` di `api.js`**

---

### Task 3: Update HTML & CSS Antarmuka

**Files:**
- Modify: `index.html` & `public/index.html`
- Modify: `css/style.css` & `public/css/style.css`

**Interfaces:**
- Produces:
  - Dashboard: `#card-debts-summary` (Ringkasan Piutang & Hutang)
  - Modal `#modal-debts-list`: Daftar lengkap berfilter (Semua, Piutang, Hutang, Lunas, Belum Lunas)
  - Modal `#modal-add-debt`: Formulir catat hutang/piutang baru
  - Modal `#modal-pay-debt`: Formulir pelunasan (Nominal bayar + Pilihan dompet kas)
  - Styling CSS kartu hutang piutang, progress bar, dan badge status.

- [ ] **Step 1: Tambahkan CSS komponen Hutang/Piutang di `style.css`**
- [ ] **Step 2: Tambahkan markup HTML di `index.html`**

---

### Task 4: Update Logika Controller (`js/app.js` & `public/js/app.js`)

**Files:**
- Modify: `js/app.js` & `public/js/app.js`

**Interfaces:**
- Produces:
  - State: `debts: []`
  - Kalkulasi total Piutang (belum lunas) & total Hutang (belum lunas)
  - Render kartu ringkasan dashboard
  - Render daftar hutang piutang dengan filter
  - Event listener catat hutang baru
  - Event listener pelunasan cicilan / lunas

- [ ] **Step 1: Hitung total Piutang & Hutang di `renderDashboard()`**
- [ ] **Step 2: Render daftar item hutang/piutang di modal**
- [ ] **Step 3: Tangani form submit tambah hutang & bayar pelunasan**

---

### Task 5: Testing, Cache Bump, dan Git Push

**Files:**
- Modify: `sw.js` & `public/sw.js` (bump v7)
- Modify: `index.html` (bump v=7)
- Deploy: Commit & Push ke GitHub

- [ ] **Step 1: Jalankan syntax check Node.js**
- [ ] **Step 2: Bump versi cache ke `v7`**
- [ ] **Step 3: Git commit & push ke `main`**
- [ ] **Step 4: Update panduan `Code.gs` ke pengguna**
