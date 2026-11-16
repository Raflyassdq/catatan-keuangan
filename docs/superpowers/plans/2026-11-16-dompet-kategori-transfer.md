# Multi-Wallet, Custom Categories & Transfer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan sistem Multi-Wallet (dompet digital & rekening), fitur Pindah Dana (Transfer antar dompet), dan penambahan Kategori Dinamis yang tersinkronisasi langsung ke Google Sheets.

**Architecture:** Memperluas Google Apps Script backend (`Code.gs`) dengan 3 sheet baru (`Dompet`, `Transfer`, `Kategori`) serta memperbarui frontend SPA (Carousel dompet di Dashboard, tab Pindah Dana di form +, modal kelola dompet & kategori, serta sinkronisasi multi-perangkat).

**Tech Stack:** Vanilla JavaScript (ES6+), Google Apps Script, HTML5, CSS3 (Horizontal touch scrolling, safe area support), Chart.js.

**Spec:** `docs/superpowers/specs/2026-11-16-dompet-kategori-transfer-design.md`

## Global Constraints

- Standar Desain: antislop & antislop-ui aktif.
- Palet Warna: Cream base (`#FAFAF7`), Surface (`#FFFFFF`), Dusty Rose accent (`#E8829A`).
- Tipografi: Plus Jakarta Sans.
- Format Tanggal: Tanggal singkat Indonesia (`DD MMM YYYY`).
- Keamanan: Token otentikasi pada seluruh aksi tambah/edit/transfer.

## Review Focus

1. Kalkulasi saldo tiap dompet dari rumus: $\text{Saldo Awal} + \text{In} - \text{Out} + \text{Transfer In} - \text{Transfer Out}$.
2. Transaksi transfer tidak boleh terhitung sebagai pengeluaran/pemasukan pada total saldo global dashboard.
3. Dropdown pilihan Dompet pada form Pengeluaran & Pemasukan otomatis terisi dari daftar dompet aktif.
4. Validasi transfer: Dompet asal tidak boleh sama dengan dompet tujuan.
5. Sinkronisasi data dompet dan kategori ke Google Sheets agar terbaca di HP pengguna maupun pasangannya.

---

### Task 1: Update Google Apps Script Backend (`Code.gs`)

**Files:**
- Modify: `google-apps-script/Code.gs`

**Interfaces:**
- Produces:
  - Sheet `Dompet`: `Nama Dompet`, `Saldo Awal`
  - Sheet `Transfer`: `Tanggal`, `Nominal`, `Dari Dompet`, `Ke Dompet`, `Catatan`
  - Sheet `Kategori`: `Jenis`, `Nama Kategori`
  - Columns in `Pengeluaran`: `Tanggal`, `Nominal`, `Kategori`, `Catatan`, `Dompet`
  - Columns in `Pemasukan`: `Tanggal`, `Nominal`, `Kategori`, `Catatan`, `Dompet`
- Actions:
  - `addWallet`: `{ name, initialBalance }`
  - `addCategory`: `{ type: 'Pemasukan'|'Pengeluaran', name }`
  - `transfer`: `{ date, amount, fromWallet, toWallet, note }`
  - `deleteTransfer`: `{ rowIndex }`
  - `getAll`: mengembalikan `transactions`, `wallets`, `categories`, `transfers`

- [ ] **Step 1: Update `setupSheets()` in `Code.gs`**
  - Pastikan sheet `Dompet`, `Transfer`, `Kategori` terbuat otomatis beserta default data:
    - Default Dompet: `Cash` (0), `Bank 1` (0), `Bank 2` (0), `GoPay` (0), `ShopeePay` (0), `DANA` (0).
    - Default Kategori: sinkronkan kategori awal pemasukan & pengeluaran.
- [ ] **Step 2: Update `doGet` in `Code.gs`**
  - Baca data dari sheet `Dompet`, `Transfer`, dan `Kategori` dan kirim dalam response `getAll`.
- [ ] **Step 3: Update `doPost` in `Code.gs`**
  - Dukung aksi:
    - `add` (mendukung kolom `dompet` untuk Pengeluaran & Pemasukan).
    - `transfer` (menulis ke sheet `Transfer`).
    - `addWallet` (menulis ke sheet `Dompet`).
    - `addCategory` (menulis ke sheet `Kategori`).
    - `deleteTransfer` (menghapus baris di sheet `Transfer`).

---

### Task 2: Update Data Access Layer (`api.js` & `config.js`)

**Files:**
- Modify: `js/api.js` & `public/js/api.js`
- Modify: `js/config.js` & `public/js/config.js`

**Interfaces:**
- Produces:
  - `API.transferFunds({ date, amount, fromWallet, toWallet, note })`
  - `API.addWallet({ name, initialBalance })`
  - `API.addCategory({ type, name })`
  - `API.deleteTransfer(rowIndex)`

- [ ] **Step 1: Tambahkan method transfer dan wallet di `api.js`**
- [ ] **Step 2: Update default data di `config.js`**

---

### Task 3: Update Desain & Komponen UI (`index.html` & `style.css`)

**Files:**
- Modify: `index.html` & `public/index.html`
- Modify: `css/style.css` & `public/css/style.css`

**Interfaces:**
- Produces:
  - Carousel Kartu Dompet di Dashboard: `#wallets-carousel`
  - Dropdown Dompet pada Form Transaksi Pemasukan & Pengeluaran
  - Tab ke-3 di Form Input (+): `#toggle-type-transfer` (Pindah Dana)
  - Bagian Form Pindah Dana: Dari Dompet, Ke Dompet
  - Modal Tambah Dompet: `#modal-add-wallet`
  - Modal Tambah Kategori: `#modal-add-category`

- [ ] **Step 1: Tambahkan CSS Carousel Kartu Dompet & Badge Dompet**
  - Horizontal scrolling touch-friendly dengan snap.
  - Kartu dompet dengan nama, saldo, dan ikon.
- [ ] **Step 2: Tambahkan elemen HTML di `index.html`**
  - Section dompet di dashboard.
  - Field dompet dan tab transfer pada modal transaksi.
  - Tombol "+ Tambah Kategori" pada form.
  - Dialog pop-up tambah dompet dan tambah kategori.

---

### Task 4: Update Logika Controller (`app.js`)

**Files:**
- Modify: `js/app.js` & `public/js/app.js`

**Interfaces:**
- Produces:
  - State `wallets`, `transfers`, `categories`.
  - Kalkulasi saldo per dompet.
  - Handler submit Pindah Dana.
  - Handler submit Tambah Dompet & Tambah Kategori.
  - Render kartu dompet di dashboard.
  - Tampilan mutasi transfer di tab Riwayat.

- [ ] **Step 1: Hitung Saldo per Dompet secara akurat**
- [ ] **Step 2: Render Carousel Dompet di Dashboard**
- [ ] **Step 3: Tangani Tab Pindah Dana pada Form (+)**
- [ ] **Step 4: Tangani Tambah Dompet & Tambah Kategori**
- [ ] **Step 5: Render item Transfer di Riwayat dengan badge khusus**

---

### Task 5: Testing, Version Bump, dan Git Push

**Files:**
- Modify: `sw.js` & `public/sw.js` (bump cache v4)
- Modify: `index.html` (bump v=4)
- Deploy: Commit & Push ke GitHub Pages

- [ ] **Step 1: Bump cache Service Worker ke `v4`**
- [ ] **Step 2: Jalankan syntax check Node.js**
- [ ] **Step 3: Git commit & push ke `main`**
- [ ] **Step 4: Update panduan `Code.gs` ke pengguna**
