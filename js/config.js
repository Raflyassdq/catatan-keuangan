/**
 * Konfigurasi Utama Aplikasi Catatan Keuangan
 */
const APP_CONFIG = {
  DEFAULT_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx7G4VA7qs4bctPzeAKk3ARuXMRaN7_XDtf1ggdFgXEdzFemZDlJX0wXXwumJWBFruP1Q/exec",
  DEFAULT_SECRET_TOKEN: "SECRET_KEUANGAN_2026",

  // Default Dompet Awal sesuai akun riil Anda
  DEFAULT_WALLETS: [
    { name: "CASH", initialBalance: 12500 },
    { name: "BRI", initialBalance: 333037 },
    { name: "BSI", initialBalance: 43735 },
    { name: "TABUNGAN JAGO", initialBalance: 6223299 },
    { name: "DANA", initialBalance: 5321 },
    { name: "GOPAY", initialBalance: 33669 },
    { name: "SHOPEEPAY", initialBalance: -23275 },
    { name: "DEBITUR", initialBalance: 803143 },
    { name: "RDN", initialBalance: 397546 }
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
