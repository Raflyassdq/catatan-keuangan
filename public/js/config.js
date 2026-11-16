/**
 * Konfigurasi Utama Aplikasi Catatan Keuangan
 */
const APP_CONFIG = {
  DEFAULT_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx7G4VA7qs4bctPzeAKk3ARuXMRaN7_XDtf1ggdFgXEdzFemZDlJX0wXXwumJWBFruP1Q/exec",
  DEFAULT_SECRET_TOKEN: "SECRET_KEUANGAN_2026",

  // Default Dompet Awal jika backend belum siap
  DEFAULT_WALLETS: [
    { name: "Cash", initialBalance: 0 },
    { name: "Bank 1", initialBalance: 0 },
    { name: "Bank 2", initialBalance: 0 },
    { name: "GoPay", initialBalance: 0 },
    { name: "ShopeePay", initialBalance: 0 },
    { name: "DANA", initialBalance: 0 }
  ],

  // Default Kategori Pemasukan
  DEFAULT_INCOME_CATEGORIES: [
    "Gaji",
    "Bonus / Uang Lembur",
    "Transfer dari Keluarga",
    "Lain-lain"
  ],

  // Default Kategori Pengeluaran
  DEFAULT_EXPENSE_CATEGORIES: [
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

  getScriptUrl() {
    return localStorage.getItem("cfg_script_url") || this.DEFAULT_SCRIPT_URL;
  },

  getSecretToken() {
    return localStorage.getItem("cfg_secret_token") || this.DEFAULT_SECRET_TOKEN;
  },

  saveCredentials(url, token) {
    if (url) localStorage.setItem("cfg_script_url", url.trim());
    if (token) localStorage.setItem("cfg_secret_token", token.trim());
  }
};
