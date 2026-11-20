# Receipt OCR Scanner (Hybrid AI & Local) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghadirkan fitur pemindai struk/nota belanja otomatis (*Receipt OCR Scanner*) dengan arsitektur hybrid (Gemini 1.5 Flash Vision saat online & OCR lokal saat offline) yang mengisi formulir transaksi secara instan.

**Architecture:** 
1. Di antarmuka formulir transaksi, kartu aksi pemindai ramah sentuh (`#btn-scan-receipt`) setinggi 48px memicu kamera ponsel atau unggah galeri.
2. Gambar dikompresi di sisi klien via Canvas HTML5 menjadi string Base64 ringan ($\approx 200\text{--}400\text{ KB}$).
3. Jika ponsel online dan terdapat API key, permintaan dikirim ke backend Google Apps Script (`Code.gs`) yang memanggil model Gemini 1.5 Flash Vision untuk menghasilkan data transaksi terstruktur (`amount`, `date`, `merchant`, `category`, `note`).
4. Jika offline atau panggilan AI gagal, sistem otomatis beralih ke pustaka OCR lokal (Tesseract.js) untuk mengekstrak nominal dan tanggal dengan rumus pencarian pola (*regex*).
5. Data hasil ekstraksi otomatis mengisi (*pre-fill*) kolom formulir transaksi untuk diperiksa pengguna sebelum disimpan.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5 Canvas API & File API, CSS Custom Properties, Google Apps Script, Google Gemini 1.5 Flash Vision API, Tesseract.js (WebAssembly), Service Worker.

**Spec:** `docs/superpowers/specs/2026-11-20-receipt-scanner-hybrid-design.md`

## Global Constraints
* Input file pemindai harus memicu kamera belakang ponsel secara langsung (`accept="image/*" capture="environment"`).
* Kartu tombol pemindai harus memiliki target sentuh minimal 48px untuk kenyamanan jempol di ponsel (*anti-slop*).
* Pemrosesan gambar dan pembacaan teks tidak boleh membekukan antarmuka (*main UI thread*).
* Seluruh berkas yang dimodifikasi (`index.html`, `css/style.css`, `js/config.js`, `js/api.js`, `js/app.js`, `sw.js`, `google-apps-script/Code.gs`) wajib disinkronkan ke folder `public/`.
* Versi cache Service Worker ditingkatkan ke `catatan-keuangan-v18`.

## Review Focus
1. **Struk Tanpa Tanggal:** Jika tanggal pada struk tidak terbaca atau terpotong, sistem harus mengisi tanggal hari ini secara otomatis tanpa memicu error `NaN` atau input tanggal kosong.
2. **Struk dengan Banyak Baris Angka:** Pada struk yang memiliki Subtotal, Diskon, dan PPN, AI harus mengambil nilai **Grand Total** riil yang dibayar pengguna.
3. **Peralihan Otomatis Saat Offline:** Saat ponsel berada dalam mode pesawat atau tanpa koneksi internet, pemindai langsung menjalankan mode OCR lokal tanpa menampilkan pesan error jaringan yang membingungkan.
4. **Pembatalan Pemindaian:** Tombol "Batal" pada banner pemindaian harus segera menghentikan proses dan mengembalikan kartu aksi ke kondisi siap pakai.
5. **Aksesibilitas & Keyboard:** Kartu aksi pemindai dapat difokuskan dan diaktifkan menggunakan tombol Enter atau Spasi pada keyboard.

---

### Task 1: Markup & Styling Kartu Pemindai Struk & Pengaturan Gemini API Key
**Files:**
- Modify: `index.html`
- Modify: `css/style.css`

**Interfaces:**
- Produces:
  - Elemen `#btn-scan-receipt`, `#input-receipt-file`, `#scan-receipt-status`, `#btn-cancel-scan` di `#modal-transaction`
  - Elemen `#settings-gemini-key` di `#modal-settings`
  - CSS classes: `.scan-receipt-card`, `.scan-receipt-icon`, `.scan-receipt-info`, `.scan-receipt-status`, `.scan-spinner`, `.btn-cancel-scan`

- [ ] **Step 1: Tambahkan elemen kartu pemindai struk di `#modal-transaction` `index.html`**
  Menyisipkan `#btn-scan-receipt` dengan input file kamera tersembunyi dan banner status `#scan-receipt-status` di atas tombol pilihan jenis transaksi.
- [ ] **Step 2: Tambahkan kolom input Gemini API Key di `#modal-settings` `index.html`**
  Menyisipkan input password `#settings-gemini-key` dan teks panduan di bawah input Token Rahasia.
- [ ] **Step 3: Tambahkan aturan CSS untuk kartu pemindai dan status pemindaian di `css/style.css`**
  Menata gaya kartu aksi (tinggi minimal 48px, border putus-putus beraksen tema, ikon kamera 22px), animasi spinner pemindaian, dan tombol batal.
- [ ] **Step 4: Commit perubahan Task 1**
  Run: `git add index.html css/style.css; git commit -m "feat: add receipt scanner markup and styles"`

---

### Task 2: Penyimpanan API Key di `js/config.js` & Integrasi Backend di `Code.gs`
**Files:**
- Modify: `js/config.js`
- Modify: `google-apps-script/Code.gs`
- Test: `node -c js/config.js`

**Interfaces:**
- Produces:
  - `APP_CONFIG.getGeminiKey() -> string`
  - `APP_CONFIG.saveGeminiKey(key: string) -> void`
  - Action `scanReceipt` pada fungsi `doPost(e)` di `google-apps-script/Code.gs`

- [ ] **Step 1: Tambahkan method `getGeminiKey()` dan `saveGeminiKey()` di `js/config.js`**
  Menyimpan API key di `localStorage` dengan kunci `"cfg_gemini_key"`.
- [ ] **Step 2: Tambahkan fungsi `handleReceiptScan(e)` di `google-apps-script/Code.gs`**
  Menerima payload Base64 dan memanggil Google Gemini 1.5 Flash Vision REST API (`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=...`) dengan instruksi prompt JSON terstruktur.
- [ ] **Step 3: Validasi sintaks `js/config.js`**
  Run: `node -c js/config.js`
  Expected: exit code 0.
- [ ] **Step 4: Commit perubahan Task 2**
  Run: `git add js/config.js google-apps-script/Code.gs; git commit -m "feat: add Gemini key config and backend AI scan handler"`

---

### Task 3: Kompresi Gambar, Orchestration Hybrid & Pre-fill Form di `js/app.js`
**Files:**
- Modify: `js/api.js`
- Modify: `js/app.js`
- Test: `node -c js/api.js; node -c js/app.js; node .superpowers/sdd/test-receipt-parser.cjs`

**Interfaces:**
- Produces:
  - `API.scanReceipt(imageBase64, apiKey) -> Promise<object>`
  - Helper `compressReceiptImage(file) -> Promise<string>`
  - Helper `parseReceiptLocally(imageFile) -> Promise<object>`
  - Orchestrator `scanReceipt(file) -> Promise<void>`
  - Form pre-fill logic untuk nominal, tanggal, catatan toko, dan kategori

- [ ] **Step 1: Tambahkan fungsi `API.scanReceipt` di `js/api.js`**
  Mengirim request POST dengan action `scanReceipt` ke Google Apps Script Web App.
- [ ] **Step 2: Implementasikan kompresi gambar berbasis Canvas di `js/app.js`**
  Membuat fungsi `compressReceiptImage(file)` yang mengubah gambar ke dimensi maksimal 1200px dan kualitas JPEG 0.75.
- [ ] **Step 3: Implementasikan pembaca OCR lokal berbasis Tesseract.js di `js/app.js`**
  Membuat fungsi lazy-loader untuk memuat pustaka Tesseract.js hanya saat dibutuhkan, lalu mengekstrak nominal, tanggal, dan nama toko via regex.
- [ ] **Step 4: Hubungkan kartu aksi kamera dan pengisian formulir otomatis**
  - Mengatur listener klik pada `#btn-scan-receipt` untuk memicu `#input-receipt-file`.
  - Menampilkan banner status loading pemindaian dengan mode yang aktif ("Mode AI" atau "Mode Lokal").
  - Saat hasil diterima: isi `DOM.inputNominal`, `DOM.inputDate`, `DOM.inputNote`, dan pilih kategori yang cocok.
  - Berikan feedback getaran (*haptic*) dan toast konfirmasi.
- [ ] **Step 5: Tulis dan jalankan skrip verifikasi parser struk**
  Run: `node .superpowers/sdd/test-receipt-parser.cjs`
  Expected: exit code 0.
- [ ] **Step 6: Commit perubahan Task 3**
  Run: `git add js/api.js js/app.js; git commit -m "feat: implement hybrid receipt scanner orchestration and form prefill"`

---

### Task 4: Sinkronisasi Service Worker v18 & Folder Public
**Files:**
- Modify: `sw.js`
- Modify: `index.html`
- Modify: `public/index.html`
- Modify: `public/css/style.css`
- Modify: `public/js/config.js`
- Modify: `public/js/api.js`
- Modify: `public/js/app.js`
- Modify: `public/sw.js`
- Test: `node -c js/config.js; node -c js/api.js; node -c js/app.js; node -c sw.js; node -c public/js/app.js; node -c public/sw.js`

- [ ] **Step 1: Tingkatkan versi Service Worker ke `catatan-keuangan-v18` di `sw.js`**
- [ ] **Step 2: Tingkatkan query string skrip di `index.html` ke `?v=18`**
- [ ] **Step 3: Sinkronkan seluruh berkas ke folder `public/`**
- [ ] **Step 4: Jalankan uji sintaks Node.js pada seluruh berkas JS**
  Run: `node -c js/config.js; node -c js/api.js; node -c js/app.js; node -c sw.js; node -c public/js/app.js; node -c public/sw.js`
  Expected: exit code 0.
- [ ] **Step 5: Commit perubahan Task 4**
  Run: `git add sw.js index.html public/; git commit -m "chore: bump service worker to v18 and sync public directory"`
- [ ] **Step 6: Push perubahan ke GitHub repository**
  Run: `git push origin main` (unsandboxed)
  Expected: successfully pushed to remote.
