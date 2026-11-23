# Dukungan Unggah Struk dari Galeri & Kamera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengaktifkan pemilih media bawaan ponsel (kamera langsung & galeri/album foto) pada fitur pemindai struk/nota belanja tanpa mengubah alur kompresi dan analisis OCR.

**Architecture:** Menghapus atribut `capture="environment"` dari elemen `<input type="file" id="input-receipt-file">` di `index.html` agar peramban mobile (iOS & Android) otomatis memunculkan sheet pilihan native (Take Photo / Photo Library / Choose File). Menyesuaikan teks deskripsi kartu pemindai agar pengguna mengetahui struk bisa dipilih dari galeri. Memperbarui versi cache Service Worker ke `v20` dan menyinkronkan seluruh perubahan ke direktori `public/`.

**Tech Stack:** HTML5 File API, Vanilla JavaScript, Service Worker Cache API.

**Spec:** `docs/superpowers/specs/2026-11-23-gallery-upload-receipt-scanner-design.md`

## Global Constraints
* Elemen `<input type="file">` harus tetap tersembunyi dan dipicu oleh kartu tombol `#btn-scan-receipt`.
* Atribut `accept="image/*"` harus dipertahankan untuk membatasi tipe berkas hanya gambar.
* Seluruh berkas yang dimodifikasi wajib disinkronkan ke direktori `public/`.
* Versi cache Service Worker ditingkatkan ke `catatan-keuangan-v20` dan query string di `index.html` ke `?v=20`.

## Review Focus
1. **Pemilih Native di iOS & Android:** Menghapus `capture="environment"` memastikan peramban menampilkan dialog pilihan bawaan tanpa langsung membuka kamera belakang secara paksa.
2. **Kompatibilitas Format Berkas:** Gambar dari galeri (JPEG, PNG, HEIC yang dikonversi peramban, WebP) harus tetap terbaca oleh `FileReader` dan dikompresi dengan lancar via Canvas.
3. **Deskripsi Kartu Informatif:** Teks kartu pemindai dengan jelas mengindikasikan bahwa pengguna dapat memotret atau memilih foto struk dari galeri.
4. **Pembatalan Pemilihan Gambar:** Jika pengguna membuka pemilih galeri lalu menekan "Cancel", aplikasi tidak boleh mengalami error atau menampilkan status loading palsu.
5. **Sinkronisasi Paritas Folder Public:** Berkas di root dan `public/` harus 100% identik secara hash.

---

### Task 1: Hapus Atribut Capture & Sesuaikan Teks di `index.html`
**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces:
  - `<input type="file" id="input-receipt-file" accept="image/*" style="display: none;">` tanpa atribut `capture`
  - Elemen `.scan-receipt-desc` dengan teks yang ramah galeri & kamera

- [ ] **Step 1: Hapus `capture="environment"` pada input berkas di `index.html`**
  Ubah baris 358 dari:
  `<input type="file" id="input-receipt-file" accept="image/*" capture="environment" style="display: none;">`
  Menjadi:
  `<input type="file" id="input-receipt-file" accept="image/*" style="display: none;">`
- [ ] **Step 2: Sesuaikan teks deskripsi kartu pemindai di `index.html`**
  Ubah teks `.scan-receipt-desc` menjadi:
  `Foto atau pilih dari galeri untuk isi otomatis nominal, tanggal, & toko`
- [ ] **Step 3: Commit perubahan Task 1**
  Run: `git add index.html; git commit -m "feat: enable native gallery and camera chooser for receipt scanner"`

---

### Task 2: Peningkatan Versi Service Worker v20, Sinkronisasi Folder Public & Deploy
**Files:**
- Modify: `sw.js`
- Modify: `index.html`
- Modify: `public/index.html`
- Modify: `public/sw.js`
- Test: `node -c sw.js; node -c public/sw.js`

- [ ] **Step 1: Tingkatkan versi Service Worker ke `catatan-keuangan-v20` di `sw.js`**
- [ ] **Step 2: Tingkatkan query string versi di `index.html` ke `?v=20`**
- [ ] **Step 3: Salin seluruh berkas yang dimodifikasi ke direktori `public/`**
- [ ] **Step 4: Validasi sintaks Node.js dan paritas hash**
  Run: `node -c sw.js; node -c public/sw.js`
- [ ] **Step 5: Commit perubahan Task 2**
  Run: `git add sw.js index.html public/; git commit -m "chore: bump service worker to v20 and sync public directory"`
- [ ] **Step 6: Push perubahan ke GitHub repository**
  Run: `git push origin main`
