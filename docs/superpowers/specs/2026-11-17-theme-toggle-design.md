# Theme Switching (Pink & Blue Mode) Design Document

**Date:** 2026-11-17  
**Topic:** Theme Switching (Pink / Blue Mode)  
**Status:** Approved  

## 1. Intent & Why
Pengguna ingin personalisasi visual aplikasi keuangan pribadi dengan kemampuan beralih antara tema bawaan (**Mode Pink / Dusty Rose**) dan tema alternatif (**Mode Biru / Cerulean Blue**) secara instan dan tersimpan di perangkat.

## 2. Goals, Non-Goals, & Anti-Goals
* **Goals:**
  * Menyediakan tombol pengubah tema langsung di header aplikasi.
  * Tampilan tombol berupa kapsul ganda khusus ikon (*icon-only segmented pill*) selebar ~58px dan tinggi 34px yang memuat bulatan pink dan bulatan biru.
  * Mengubah warna aksen utama aplikasi (tombol submit/tambah, navigasi aktif, status fokus, floating quick-add button, brand icon) saat mode biru aktif.
  * Menyimpan preferensi tema di `localStorage` (`cfg_theme`) agar tema yang dipilih tetap aktif saat aplikasi dibuka kembali.
* **Non-Goals:**
  * Mengubah skrip Google Apps Script / database spreadsheet (fitur ini 100% sisi visual/frontend).
  * Menghilangkan kontras antara pemasukan dan pengeluaran (pemasukan tetap menggunakan biru dan pengeluaran tetap menggunakan pink).
* **Anti-Goals:**
  * Menambahkan teks label yang memakan tempat horizontal di header sehingga mendesak judul "Keuangan" atau status "Terkoneksi".
  * Terjadinya *flash of unstyled theme* (kedipan warna salah saat halaman dimuat).

## 3. Approaches Considered & Trade-offs
1. **Opsi 1: Single Button Switcher (Lingkaran 34x34px)**: Menggunakan satu tombol bulat palet warna. Sangat ringkas, tetapi pengguna tidak melihat langsung kedua opsi tema berdampingan.
2. **Opsi 2: Kapsul Teks Panjang (`[ 🌸 Pink | 💧 Biru ]`)**: Terlalu lebar (~85px), mendesak elemen header di layar sempit.
3. **Opsi 3: Kapsul Ganda Khusus Ikon (`[ 🔴 Pink Dot | 🔵 Blue Dot ]`) — TERPILIH**:
   * Menampilkan dua bulatan warna berdampingan dalam kapsul mini 58x34px.
   * Sangat hemat ruang, kedua opsi langsung terlihat, dan status aktif tampak jelas.

## 4. Detailed Specification
* **HTML (`index.html`)**:
  * Tambahkan `.theme-toggle-pill` di dalam `.top-actions-wrapper` tepat sebelum `#btn-refresh-data`:
    ```html
    <div id="theme-toggle-pill" class="theme-toggle-pill" role="radiogroup" aria-label="Pilih Tema Tampilan">
      <button type="button" id="btn-theme-pink" class="theme-dot-btn active" data-theme="pink" aria-label="Tema Pink" title="Tema Pink">
        <span class="theme-color-dot dot-pink"></span>
      </button>
      <button type="button" id="btn-theme-blue" class="theme-dot-btn" data-theme="blue" aria-label="Tema Biru" title="Tema Biru">
        <span class="theme-color-dot dot-blue"></span>
      </button>
    </div>
    ```
* **CSS (`css/style.css`)**:
  * `.theme-toggle-pill`, `.theme-dot-btn`, `.theme-color-dot`.
  * `[data-theme="blue"]` overrides:
    * `--color-primary`: `#5B9CE6`
    * `--color-primary-dark`: `#4388D6`
    * `--color-primary-light`: `#EEF4FD`
    * `--color-primary-rgb`: `91, 156, 230`
    * `--color-border-focus`: `#5B9CE6`
    * `--shadow-float`: `0 6px 20px rgba(91, 156, 230, 0.28)`
* **Configuration & Logic (`js/config.js` & `js/app.js`)**:
  * `APP_CONFIG.getTheme()` & `APP_CONFIG.saveTheme(theme)`.
  * Di `index.html`: skrip inline kecil di `<head>` membaca tema tersimpan sebelum render body agar tidak ada *flicker*.
  * Event listener untuk `#btn-theme-pink` dan `#btn-theme-blue` di `js/app.js` untuk menerapkan tema, mengganti kelas aktif, dan menyimpan ke `localStorage`.
* **Sync & PWA**:
  * Sinkronisasi ke berkas `public/`.
  * Bump Service Worker cache name ke `v15`.
