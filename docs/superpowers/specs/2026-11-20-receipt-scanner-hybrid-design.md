# Receipt OCR Scanner (Hybrid AI & Local) Design Document

**Date:** 2026-11-20  
**Topic:** Pemindai Struk / Nota Otomatis (Receipt OCR Scanner) Hybrid  
**Status:** Approved (Pendekatan 1: Inline Action Card + Hybrid Architecture)

## 1. Intent & Why
Pengguna ingin mencatat pengeluaran secara cepat dan praktis tanpa mengetik manual dengan cara memotret struk belanja (minimarket, bensin, restoran, kafe, atau nota warung). Sistem secara otomatis mengekstrak total nominal, tanggal, nama merchant/toko, dan menebak kategori pengeluaran yang tepat ke dalam formulir transaksi.

## 2. Goals, Non-Goals, & Anti-Goals
* **Goals:**
  * Menambahkan kartu aksi pemindai ramah sentuhan (`#btn-scan-receipt`) setinggi 48px di bagian paling atas formulir transaksi (`#modal-transaction`).
  * Mendukung pembukaan kamera langsung pada ponsel (`accept="image/*" capture="environment"`) maupun unggah dari galeri foto.
  * **Arsitektur Hybrid Cerdas:**
    * **Online:** Menggunakan Google Apps Script + Gemini 1.5 Flash Vision untuk akurasi tinggi ($\approx 98\%$), pemahaman diskon/pajak, dan pemilihan kategori cerdas.
    * **Offline / Cadangan:** Otomatis beralih ke pemrosesan OCR lokal di perangkat jika ponsel sedang tidak ada internet atau kuota AI habis.
  * Mengisi otomatis (*pre-fill*) kolom formulir:
    * Nominal total belanja (format Rupiah rapi).
    * Tanggal transaksi (`YYYY-MM-DD`).
    * Catatan (nama toko + ringkasan item singkat).
    * Pilihan kategori transaksi yang cocok.
  * Tetap mempertahankan prinsip *human-in-the-loop*: Pengguna selalu memiliki kendali untuk meninjau, memilih dompet pembayaran, atau menyesuaikan data sebelum menekan tombol "Simpan Transaksi".
  * Menambahkan kolom input opsional "Gemini API Key" pada modal *Pengaturan Koneksi* (`#modal-settings`) yang disimpan secara aman.
* **Non-Goals:**
  * Menyimpan berkas gambar struk secara permanen di server (gambar hanya diproses sementara dalam memori/Base64 untuk ekstraksi data teks).
  * Otomatis menyimpan transaksi tanpa konfirmasi pengguna.
* **Anti-Goals:**
  * Tombol scanner kecil yang sulit ditekan jempol.
  * Mengharuskan setup API berbayar atau rumit (Gemini AI Studio gratis 1.500 scan/hari).
  * Aplikasi macet atau gagal total saat tidak ada koneksi internet (karena ada fallback lokal).

## 3. Approaches Considered & Trade-offs
* **Pendekatan UI:**
  * **Pendekatan 1 (Kartu Aksi Ramah Sentuhan di Atas Form) — TERPILIH**:
    * Tinggi 48px, ikon kamera jelas, teks panduan informatif. Sangat ergonomis dan memenuhi standar aksesibilitas sentuh mobile (*anti-slop*).
  * **Pendekatan 2 (Tombol Minimalis di Header/Tab)**:
    * Terlalu kecil dan rentan salah sentuh di layar ponsel sempit.
* **Pendekatan Mesin OCR:**
  * **Hybrid (AI Vision + Fallback Lokal) — TERPILIH**:
    * Memberikan yang terbaik dari kedua dunia: akurasi tinggi saat online dan keandalan tanpa henti saat offline.

## 4. Detailed Specification

### A. Antarmuka Formulir Transaksi (`index.html` & `css/style.css`)
* Di dalam `#modal-transaction .modal-sheet`:
  * Tepat di atas pilihan jenis transaksi (`.transaction-type-toggle`), tambahkan:
    ```html
    <!-- Tombol Kartu Pindai Struk -->
    <div id="btn-scan-receipt" class="scan-receipt-card" role="button" tabindex="0" aria-label="Pindai Struk Belanja">
      <input type="file" id="input-receipt-file" accept="image/*" capture="environment" style="display: none;">
      <div class="scan-receipt-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>
      <div class="scan-receipt-info">
        <div class="scan-receipt-title">Pindai Struk / Nota</div>
        <div class="scan-receipt-desc">Foto struk untuk isi otomatis nominal, tanggal, & toko</div>
      </div>
    </div>

    <!-- Banner Status Pemindaian -->
    <div id="scan-receipt-status" class="scan-receipt-status" style="display: none;">
      <div class="scan-spinner"></div>
      <div class="scan-status-info">
        <div id="scan-status-title" class="scan-status-title">Menganalisis struk...</div>
        <div id="scan-status-mode" class="scan-status-mode">Mode AI (Gemini Vision)</div>
      </div>
      <button type="button" id="btn-cancel-scan" class="btn-cancel-scan" aria-label="Batalkan pemindaian">Batal</button>
    </div>
    ```
* Di dalam `#modal-settings`:
  * Tambahkan kolom input "Gemini API Key (Opsional)":
    ```html
    <div class="form-group">
      <label for="settings-gemini-key" class="form-label">Gemini API Key (Opsional untuk AI Scan)</label>
      <input type="password" id="settings-gemini-key" class="form-input" placeholder="Tempel API key gratis di sini">
      <span class="form-hint">Dapatkan gratis di aistudio.google.com. Jika kosong/offline, pemindai otomatis menggunakan mode lokal.</span>
    </div>
    ```

### B. Styling CSS (`css/style.css`)
* `.scan-receipt-card`:
  * Layout flex horizontal, padding 12px 14px, radius `var(--radius-md)`.
  * Background `var(--color-bg)`, border `1px dashed var(--color-primary)`.
  * Hover/Active state: background `var(--color-primary-light)`, sedikit scale transform `0.98`.
* `.scan-receipt-icon`:
  * Lingkaran 38px, background `var(--color-primary-light)`, color `var(--color-primary)`.
* `.scan-receipt-status`:
  * Animasi spinner ringkas dengan tombol batal yang responsif.

### C. Alur Pemrosesan Gambar & Logika Hybrid (`js/app.js` & `google-apps-script/Code.gs`)
1. **Kompresi Citra Client-Side (`compressImage(file)`)**:
   * Membaca file gambar lewat `FileReader` dan me-render ke Canvas HTML5 dengan ukuran maksimal lebar 1200px dan kualitas JPEG 0.75.
   * Menghasilkan string Base64 ringan ($\approx 200\text{--}400\text{ KB}$).
2. **Penentuan Mesin (Hybrid Orchestration)**:
   * Jika `navigator.onLine` aktif dan terdapat Gemini API Key:
     * Kirim permintaan ke backend Google Apps Script dengan action `scanReceipt`.
   * Jika sedang offline atau panggilan AI gagal/kuota habis:
     * Jalankan fallback OCR lokal (Tesseract.js).
3. **Backend Google Apps Script (`Code.gs`)**:
   * Endpoint `doPost` menerima `{ action: "scanReceipt", imageBase64: "...", apiKey: "..." }`.
   * Memanggil Google Gemini 1.5 Flash endpoint dengan prompt ekstraksi JSON terstruktur:
     `{ amount: number, date: "YYYY-MM-DD", merchant: string, category: string, note: string }`.
   * Mengembalikan respons JSON ke aplikasi.
4. **Fallback OCR Lokal (Client-Side)**:
   * Memuat Tesseract.js secara dinamis (lazy-load hanya saat dibutuhkan).
   * Melakukan pemindaian regex pada teks hasil ekstraksi:
     * Nominal: mencari pola nominal terbesar setelah kata kunci `TOTAL|JUMLAH|HARGA|RP`.
     * Tanggal: mendeteksi format `DD/MM/YYYY`, `DD-MM-YYYY`.
     * Toko: mengambil baris teratas struk.
5. **Pengisian Formulir Otomatis**:
   * Kolom nominal diformat ke Rupiah (`formatRupiahInput`).
   * Kolom tanggal diisi tanggal transaksi struk (atau tanggal hari ini jika tidak terbaca).
   * Kolom catatan diisi nama toko / merchant.
   * Kategori dicocokkan dengan daftar kategori yang ada pada `state.categories`.
   * Menampilkan toast konfirmasi: *"✓ Struk berhasil dipindai! Silakan periksa sebelum menyimpan."*
   * Haptic feedback getaran lembut (`navigator.vibrate(50)`).

### D. Keamanan, PWA & Versi Service Worker
* API Key disimpan di `localStorage` melalui modul konfigurasi (`APP_CONFIG`) dan tidak dipublikasikan ke repositori publik.
* Service Worker ditingkatkan ke versi `catatan-keuangan-v18`.
* Seluruh berkas disinkronkan ke folder `public/`.
