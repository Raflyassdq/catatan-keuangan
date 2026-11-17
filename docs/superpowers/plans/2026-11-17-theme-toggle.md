# Theme Toggle (Pink & Blue Mode) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan pengubah tema instan (Mode Pink & Mode Biru) di header aplikasi dalam bentuk kapsul ganda khusus ikon (*icon-only segmented pill*), tersimpan permanen di perangkat.

**Architecture:** Menggunakan variabel CSS yang di-override saat atribut `data-theme="blue"` disematkan pada tag `<html>`. Preferensi disimpan di `localStorage` melalui modul `APP_CONFIG` dan dibaca sejak awal rendering `<head>` untuk mencegah *flicker*.

**Tech Stack:** Vanilla JavaScript (ES6+), CSS Custom Properties, HTML5, LocalStorage, Service Worker.

**Spec:** `docs/superpowers/specs/2026-11-17-theme-toggle-design.md`

## Global Constraints
* Header height tetap 34px sejajar dengan tombol Refresh data.
* Lebar kapsul tidak boleh melebihi 60px agar tidak menggeser status "Terkoneksi" di layar HP 375px.
* Tidak memerlukan modifikasi backend Google Apps Script / `Code.gs`.
* Berkas di root (`index.html`, `css/style.css`, `js/config.js`, `js/app.js`, `sw.js`) dan `public/` wajib selalu 100% sinkron.

## Review Focus
* Persistence: Memuat ulang halaman harus tetap mempertahankan tema yang terakhir dipilih.
* Anti-Flicker: Tidak boleh ada kedipan warna pink sebelum berganti ke biru saat aplikasi pertama kali dimuat.
* Visual Contrast: Kontras teks dan ikon di mode biru harus tetap terbaca jelas (memenuhi standar WCAG).
* Multi-Device: Di layar ponsel sempit (360px - 390px), header tidak boleh mengalami overflow horizontal atau baris patah.
* Touch Targets: Kedua bulatan warna di dalam kapsul harus mudah disentuh jari (memiliki padding aktif yang memadai).

---

### Task 1: Konfigurasi & Persistensi Tema di Storage
**Files:**
- Modify: `js/config.js`
- Test: Syntax check `node -c js/config.js`

**Interfaces:**
- Produces: `APP_CONFIG.getTheme() -> string`, `APP_CONFIG.saveTheme(theme: string) -> void`

- [ ] **Step 1: Tambahkan method `getTheme()` dan `saveTheme()` di `js/config.js`**
  Menyimpan tema ke `localStorage` dengan key `"cfg_theme"`, default ke `"pink"`.
- [ ] **Step 2: Validasi sintaks berkas konfigurasi**
  Run: `node -c js/config.js`
  Expected: exit code 0.
- [ ] **Step 3: Commit perubahan Task 1**
  Run: `git add js/config.js; git commit -m "feat: add getTheme and saveTheme to APP_CONFIG"`

---

### Task 2: Struktur Header & Styling CSS Tema Biru
**Files:**
- Modify: `index.html`
- Modify: `css/style.css`

**Interfaces:**
- Consumes: `APP_CONFIG.getTheme()`
- Produces: Elemen `#theme-toggle-pill`, `#btn-theme-pink`, `#btn-theme-blue`, rule CSS `[data-theme="blue"]`

- [ ] **Step 1: Tambahkan skrip anti-flicker di `<head>` `index.html`**
  Menyisipkan tag `<script>` inline di `<head>` sebelum stylesheet untuk mengecek tema dari `localStorage` dan langsung menerapkan `data-theme` ke `document.documentElement`.
- [ ] **Step 2: Tambahkan elemen `#theme-toggle-pill` di `.top-actions-wrapper` `index.html`**
  Menempatkan kapsul mini tepat sebelum `#btn-refresh-data`.
- [ ] **Step 3: Tambahkan aturan CSS variabel untuk tema biru dan styling kapsul di `css/style.css`**
  Mendefinisikan override `[data-theme="blue"]` untuk `--color-primary`, `--color-primary-dark`, `--color-primary-light`, dll, serta gaya `.theme-toggle-pill`, `.theme-dot-btn`, dan `.theme-color-dot`.
- [ ] **Step 4: Commit perubahan Task 2**
  Run: `git add index.html css/style.css; git commit -m "feat: add theme toggle pill markup and blue theme styles"`

---

### Task 3: Logika Interaktivitas & Pergantian Tema
**Files:**
- Modify: `js/app.js`
- Test: Syntax check `node -c js/app.js`

**Interfaces:**
- Consumes: `#btn-theme-pink`, `#btn-theme-blue`, `APP_CONFIG.saveTheme()`, `APP_CONFIG.getTheme()`
- Produces: `setTheme(themeName: string) -> void`

- [ ] **Step 1: Daftarkan elemen tombol tema dan brand icon ke dalam `DOM` di `js/app.js`**
- [ ] **Step 2: Buat fungsi `setTheme(themeName)` di `js/app.js`**
  Mengubah atribut `data-theme` di `<html>`, mengupdate kelas `.active` pada tombol bulatan, mengganti emoji brand (`🌸` vs `💎`), dan menyimpan preferensi ke `APP_CONFIG`.
- [ ] **Step 3: Hubungkan event listener klik tombol tema di `initEvents()`**
- [ ] **Step 4: Validasi sintaks berkas `js/app.js`**
  Run: `node -c js/app.js`
  Expected: exit code 0.
- [ ] **Step 5: Commit perubahan Task 3**
  Run: `git add js/app.js; git commit -m "feat: implement interactive theme switching in app.js"`

---

### Task 4: Sinkronisasi Service Worker & Folder Public
**Files:**
- Modify: `sw.js`
- Modify: `public/index.html`
- Modify: `public/css/style.css`
- Modify: `public/js/config.js`
- Modify: `public/js/app.js`
- Modify: `public/sw.js`

- [ ] **Step 1: Tingkatkan versi cache Service Worker ke `v15`**
- [ ] **Step 2: Salin seluruh berkas yang dimodifikasi ke folder `public/`**
- [ ] **Step 3: Validasi sintaks seluruh berkas JS**
  Run: `node -c js/config.js; node -c js/app.js; node -c sw.js; node -c public/js/config.js; node -c public/js/app.js; node -c public/sw.js`
  Expected: exit code 0.
- [ ] **Step 4: Commit dan Push ke `origin/main`**
  Run: `git add . ; git commit -m "feat: complete theme toggle with blue mode and sync public" ; git push origin main`
