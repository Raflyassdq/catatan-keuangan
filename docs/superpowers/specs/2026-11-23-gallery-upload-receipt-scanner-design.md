# Spesifikasi Desain: Dukungan Unggah Foto Struk dari Galeri Ponsel

**Tanggal:** 23 November 2026  
**Status:** Disetujui Pengguna (*User Approved Option 1*)  
**Penulis:** Antigravity & User  

---

## 1. Latar Belakang & Masalah
Saat ini, kartu aksi *Pindai Struk / Nota* di formulir transaksi menggunakan elemen input berkas:
```html
<input type="file" id="input-receipt-file" accept="image/*" capture="environment" style="display: none;">
```
Keberadaan atribut `capture="environment"` memaksa sistem operasi ponsel (iOS Safari & Android Chrome) untuk langsung membuka viewfinder kamera belakang, sehingga pengguna tidak dapat memilih foto struk yang sudah ada di galeri foto, hasil unduhan, atau tangkapan layar (*screenshot*) e-receipt.

## 2. Solusi Terpilih (Opsi 1: Native Mobile Chooser)
Menghapus atribut pembatas `capture="environment"` dari elemen input berkas `<input type="file" id="input-receipt-file" accept="image/*">`.

Dengan atribut `accept="image/*"` tanpa `capture`:
* **Di iOS (iPhone/iPad):** Peramban otomatis memunculkan sheet pilihan native: *"Photo Library"* (Galeri), *"Take Photo"* (Kamera Langsung), atau *"Choose File"*.
* **Di Android (Chrome/Samsung Internet):** Peramban otomatis memunculkan dialog pemilih native: *"Kamera"* atau *"File / Galeri"*.
* **Di Desktop / Laptop:** Menampilkan dialog pemilih berkas gambar dari penyimpanan komputer.

Seluruh alur pemrosesan gambar yang ada (kompresi Canvas 1200px 0.75 JPEG, analisis Gemini AI / OCR lokal, haptic feedback, dan auto-prefill form) tetap berjalan mulus tanpa perubahan logika komputasi.

## 3. Berkas yang Dimodifikasi
1. `index.html`:
   - Hapus `capture="environment"` dari `#input-receipt-file`.
   - Sesuaikan subteks pada `.scan-receipt-desc`: `"Foto atau pilih dari galeri untuk isi otomatis nominal, tanggal, & toko"`.
   - Tingkatkan query string versi skrip/CSS ke `?v=20`.
2. `sw.js`:
   - Tingkatkan versi cache Service Worker ke `catatan-keuangan-v20`.
3. `public/index.html` & `public/sw.js`:
   - Sinkronisasi identik dari file root.

## 4. Kriteria Keberhasilan & Pengujian
* Elemen `#input-receipt-file` tidak lagi memiliki atribut `capture="environment"`.
* Saat tombol diklik di perangkat mobile, peramban menampilkan pilihan native kamera atau galeri.
* Validasi sintaks Node.js untuk seluruh berkas JS.
* Hash parity identik antara root dan direktori `public/`.
