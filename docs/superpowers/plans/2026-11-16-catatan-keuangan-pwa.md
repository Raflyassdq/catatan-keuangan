# Catatan Keuangan Pribadi PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi web mobile-first PWA catatan keuangan pribadi yang terhubung langsung ke Google Sheets milik pengguna via Google Apps Script, dengan dashboard interaktif, visualisasi grafik, dan alur input < 10 detik.

**Architecture:** Layered Architecture memisahkan UI (HTML5/CSS3/Vanilla JS), API/Data Layer (`api.js`), dan Backend Serverless (`Code.gs` pada Google Apps Script). Data tersimpan permanen di Google Sheets dalam dua sheet terpisah ("Pemasukan" dan "Pengeluaran"). Dilengkapi Web App Manifest dan Service Worker untuk dukungan instalasi iOS dan Android.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom Properties, Flexbox, Grid), Chart.js (via CDN), Google Apps Script (JavaScript 1.8), Service Worker API, Web App Manifest.

**Spec:** `docs/superpowers/specs/2026-11-16-catatan-keuangan-pwa-design.md`

## Global Constraints

- Standar Desain: antislop & antislop-ui aktif. Tanpa template neon ungu-biru, tanpa glassmorphism berlebihan, tanpa fake data.
- Palet Warna: Cream/Off-white base (`#FAFAF7`), Dusty Rose accent (`#E8829A`), Deep dark text (`#1A1A2E`).
- Tipografi: Plus Jakarta Sans via Google Fonts.
- Touch Target: Minimal 44px untuk semua elemen interaktif di mobile (iOS/Android).
- Keamanan: Token otentikasi rahasia pada request Google Apps Script.
- CORS Resilience: Request ke Apps Script dikirim tanpa preflight OPTIONS (`text/plain` payload / standard POST) untuk menghindari blokade CORS browser.

## Review Focus

1. Penanganan CORS & Redirect Google Apps Script pada mobile browser.
2. Responsivitas dan Safe Area Insets iOS (notch & bottom bar iPhone).
3. Akurasi kalkulasi mata uang Rupiah dan formatting input angka ribuan.
4. Konsistensi row index saat melakukan Edit dan Delete data pada Google Sheets.
5. Ketersediaan 3 state visual wajib (Loading, Empty, Error) di seluruh tampilan data.

---

### Task 1: Google Apps Script Backend API

**Files:**
- Create: `google-apps-script/Code.gs`

**Interfaces:**
- Produces: Web App API endpoints (`doGet`, `doPost`)
- Query parameters: `token`, `action` (`summary`, `list`, `categories`)
- POST body: `{ token, action: 'add'|'update'|'delete', type: 'Pemasukan'|'Pengeluaran', data, rowIndex }`
- Response: `{ status: 'success'|'error', data: any, message?: string }`

- [ ] **Step 1: Write `google-apps-script/Code.gs`**
  - Implementasi verifikasi secret token.
  - Implementasi auto-setup header jika sheet baru dibuat:
    - Pemasukan: `Tanggal`, `Nominal`, `Kategori`, `Catatan`, `Sumber`
    - Pengeluaran: `Tanggal`, `Nominal`, `Kategori`, `Catatan`
  - Implementasi handler `doGet(e)`:
    - `action=list`: membaca baris data dengan row index asli.
    - `action=summary`: mengembalikan agregasi total pemasukan, pengeluaran, dan per kategori.
  - Implementasi handler `doPost(e)`:
    - Penanganan raw payload string JSON (bypass CORS preflight).
    - `action=add`: `sheet.appendRow(...)`.
    - `action=update`: update sel pada baris target sesuai row index.
    - `action=delete`: `sheet.deleteRow(rowIndex)`.
  - Output berupa JSON dengan CORS header friendly.

---

### Task 2: PWA Shell, Web Manifest & Service Worker

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Create: `public/icons/icon-192.svg`
- Create: `public/icons/icon-512.svg`

**Interfaces:**
- Produces: Standalone installability metadata, cache-first static shell strategy.

- [ ] **Step 1: Write `public/manifest.json`**
  - Nama: "Catatan Keuangan"
  - Short name: "Keuangan"
  - Start URL: `./index.html`
  - Display: `standalone`
  - Theme color: `#FAFAF7`, Background color: `#FAFAF7`
  - Icons 192x192 & 512x512.
- [ ] **Step 2: Create App Icons in `public/icons/`**
  - Buat icon SVG yang bersih, elegan dengan tema dompet/keuangan bernuansa dusty rose & cream.
- [ ] **Step 3: Write `public/sw.js`**
  - Cache static assets (`index.html`, `css/style.css`, `js/app.js`, `js/api.js`, `js/config.js`).
  - Network-first untuk API calls ke Google Apps Script.

---

### Task 3: Design System, Layout & Core Styles

**Files:**
- Create: `public/css/style.css`

**Interfaces:**
- Produces: CSS variables, responsive mobile layout, bottom navigation, card elevation, form controls, badges.

- [ ] **Step 1: Write `public/css/style.css`**
  - Define CSS custom properties:
    - `--color-bg: #FAFAF7`
    - `--color-surface: #FFFFFF`
    - `--color-primary: #E8829A`
    - `--color-primary-dark: #D46B83`
    - `--color-primary-light: #FCEEF1`
    - `--color-income: #22C55E`
    - `--color-income-light: #EDFBF2`
    - `--color-text: #1A1A2E`
    - `--color-text-muted: #6B7280`
    - `--color-border: #E5E7EB`
    - `--font-main: 'Plus Jakarta Sans', sans-serif`
  - Setup safe-area-inset padding untuk iOS Safari.
  - Implementasi komponen:
    - Header & Top Bar dengan badge status koneksi.
    - Summary Cards (Total Pemasukan, Total Pengeluaran, Saldo).
    - Floating / Bottom Navigation Bar dengan tombol Add (+) di tengah.
    - Transaction item card dengan swipe/click affordances.
    - Form controls (Rupiah input, custom styled select, date input).
    - Modal dialogs (Add Transaction, Edit Transaction, Confirm Delete).
    - Feedback toast & notification pill.
    - Empty states, loading skeleton, dan error banners.

---

### Task 4: Configuration & API Client Layer

**Files:**
- Create: `public/js/config.js`
- Create: `public/js/api.js`

**Interfaces:**
- Produces: `API` client object with methods:
  - `API.fetchData(periodFilter)` -> Promise<TransactionResponse>
  - `API.addTransaction(transactionData)` -> Promise<ApiResponse>
  - `API.updateTransaction(rowIndex, transactionData)` -> Promise<ApiResponse>
  - `API.deleteTransaction(type, rowIndex)` -> Promise<ApiResponse>

- [ ] **Step 1: Write `public/js/config.js`**
  - Export konfigurasi default: `SCRIPT_URL`, `SECRET_TOKEN`, `CATEGORIES` default.
- [ ] **Step 2: Write `public/js/api.js`**
  - Menggunakan native `fetch` dengan strategi bypass preflight (`text/plain` POST body).
  - Normalisasi data response dari Google Apps Script.
  - Defensive error handling jika Apps Script offline atau kuota habis.

---

### Task 5: User Interface Structure & HTML Document

**Files:**
- Create: `public/index.html`

**Interfaces:**
- Produces: Semantically structured single-page application shell.
- Consumes: Google Fonts, Chart.js CDN, `style.css`, JS modules.

- [ ] **Step 1: Write `public/index.html`**
  - Include viewport meta tag dengan `viewport-fit=cover` untuk iOS.
  - Include iOS PWA meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.
  - Struktur sections:
    - `#view-dashboard`: Summary cards, Filter selector (Hari Ini, Minggu Ini, Bulan Ini, Kustom), Charts container, Insights summary.
    - `#view-history`: Search bar, Filter chips, Transaction list container, Pagination/infinite scroll trigger.
    - `#modal-transaction`: Modal formulir Tambah/Edit transaksi (Toggle Jenis, Input Nominal dengan prefix Rp, Dropdown Kategori dinamis, Input Tanggal, Catatan).
    - `#modal-confirm-delete`: Dialog konfirmasi hapus transaksi.
    - `#nav-bottom`: Bottom navigation bar (3 items: Dashboard, Tambah, Riwayat).
    - `#toast-container`: Wadah notifikasi feedback.

---

### Task 6: Application Controller & UI Logic

**Files:**
- Create: `public/js/app.js`

**Interfaces:**
- Produces: Main application event routing, state management, form handlers, currency mask, chart bindings.

- [ ] **Step 1: Implement Currency Formatter & Input Mask**
  - Fungsi `formatRupiah(number)` -> "Rp 1.250.000"
  - Event listener input nominal untuk memformat angka secara real-time saat pengguna mengetik.
- [ ] **Step 2: Implement Navigation & Tab Switching**
  - Switch antara view Dashboard dan Riwayat.
  - Membuka modal Tambah Transaksi saat tombol '+' ditekan (selesai dalam < 10 detik).
- [ ] **Step 3: Implement Transaction Form Submission**
  - Validasi field wajib (nominal > 0, kategori terisi, tanggal valid).
  - Disable button dan tampilkan spinner saat request dikirim.
  - Tampilkan toast notifikasi sukses/gagal.
  - Refresh data lokal tanpa perlu reload browser.
- [ ] **Step 4: Implement Dashboard Analytics & Chart.js Integration**
  - Inisialisasi Chart.js Donut untuk Pengeluaran per Kategori.
  - Inisialisasi Chart.js Bar untuk Pemasukan vs Pengeluaran.
  - Hitung metrik insight: Kategori Terbesar, Rata-rata Pengeluaran Harian.
- [ ] **Step 5: Implement History List, Search & Filter**
  - Filter berdasarkan teks pencarian (catatan/kategori).
  - Filter berdasarkan jenis (Semua / Pemasukan / Pengeluaran).
  - Click item untuk membuka modal Edit / Hapus.
- [ ] **Step 6: Implement Edit & Delete Flow**
  - Populate data ke form saat mode Edit.
  - Konfirmasi eksplisit sebelum memanggil `API.deleteTransaction`.

---

### Task 7: Offline Support & Service Worker Registration

**Files:**
- Modify: `public/js/app.js`

- [ ] **Step 1: Register Service Worker in `app.js`**
  - Cek ketersediaan `'serviceWorker' in navigator`.
  - Registrasi `sw.js` dengan fallback graceful jika dibuka di web tanpa HTTPS lokal.

---

### Task 8: Documentation, Setup Guide & Testing Checklist

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write Non-Programmer Step-by-Step Guide**
  - Panduan 1: Membuat Google Spreadsheet baru dengan 2 sheet ("Pemasukan" dan "Pengeluaran").
  - Panduan 2: Memasang Google Apps Script (`Extensions` > `Apps Script`), paste `Code.gs`, deploy sebagai Web App (Access: Anyone).
  - Panduan 3: Menghubungkan Frontend (`config.js`).
  - Panduan 4: Menjalankan lokal (Live Server / browser langsung) & Deploy ke GitHub Pages gratis.
  - Panduan 5: Memasang ke layar utama iPhone (Safari > Share > Add to Home Screen).
  - Checklist Pengujian fungsional untuk client.
