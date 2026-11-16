/**
 * Konfigurasi Utama Aplikasi Catatan Keuangan
 * Anda dapat mengubah URL Web App Google Apps Script di sini,
 * atau melalui menu Pengaturan di dalam aplikasi (tersimpan di HP Anda).
 */
const APP_CONFIG = {
  // Masukkan URL Web App Google Script Anda di bawah ini
  DEFAULT_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx7G4VA7qs4bctPzeAKk3ARuXMRaN7_XDtf1ggdFgXEdzFemZDlJX0wXXwumJWBFruP1Q/exec",
  
  // Token rahasia yang sama persis dengan yang di Code.gs
  DEFAULT_SECRET_TOKEN: "SECRET_KEUANGAN_2026",

  // Kategori Pemasukan
  INCOME_CATEGORIES: [
    "Gaji",
    "Bonus / Uang Lembur",
    "Transfer dari Keluarga",
    "Lain-lain"
  ],

  // Kategori Pengeluaran
  EXPENSE_CATEGORIES: [
    "Makan & Minum",
    "Transportasi",
    "Belanja Kebutuhan Rumah",
    "Hiburan & Hobi",
    "Kesehatan",
    "Pakaian & Penampilan",
    "Pendidikan",
    "Tabungan / Investasi",
    "Skincare & Kosmetik",
    "Lain-lain"
  ],

  // Mendapatkan URL aktif (dari localStorage jika pengguna pernah menyimpan, atau default)
  getScriptUrl() {
    return localStorage.getItem("cfg_script_url") || this.DEFAULT_SCRIPT_URL;
  },

  // Mendapatkan Token aktif
  getSecretToken() {
    return localStorage.getItem("cfg_secret_token") || this.DEFAULT_SECRET_TOKEN;
  },

  // Simpan konfigurasi ke local storage
  saveCredentials(url, token) {
    if (url) localStorage.setItem("cfg_script_url", url.trim());
    if (token) localStorage.setItem("cfg_secret_token", token.trim());
  }
};
