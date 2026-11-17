/**
 * Konfigurasi Utama Aplikasi Catatan Keuangan
 */
const APP_CONFIG = {
  DEFAULT_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx7G4VA7qs4bctPzeAKk3ARuXMRaN7_XDtf1ggdFgXEdzFemZDlJX0wXXwumJWBFruP1Q/exec",
  DEFAULT_SECRET_TOKEN: "SECRET_KEUANGAN_2026",

  // 9 Dompet riil dengan saldo awal diatur ke 0 (dapat diatur bebas via aplikasi)
  DEFAULT_WALLETS: [
    { name: "CASH", initialBalance: 0 },
    { name: "BRI", initialBalance: 0 },
    { name: "BSI", initialBalance: 0 },
    { name: "TABUNGAN JAGO", initialBalance: 0 },
    { name: "DANA", initialBalance: 0 },
    { name: "GOPAY", initialBalance: 0 },
    { name: "SHOPEEPAY", initialBalance: 0 },
    { name: "DEBITUR", initialBalance: 0 },
    { name: "RDN", initialBalance: 0 }
  ],

  DEFAULT_INCOME_CATEGORIES: [
    "Gaji",
    "Bonus / Uang Lembur",
    "Dari Keluarga"
  ],

  DEFAULT_EXPENSE_CATEGORIES: [
    "Makan & Minum",
    "Transportasi",
    "Belanja Kebutuhan Rumah",
    "Hiburan & Hobi",
    "Kesehatan",
    "Pakaian & Penampilan",
    "Pendidikan",
    "Tabungan / Investasi",
    "Skincare & Kosmetik"
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
  },

  getWalletSort() {
    return localStorage.getItem("cfg_wallet_sort") || "custom";
  },

  saveWalletSort(sortMode) {
    localStorage.setItem("cfg_wallet_sort", sortMode);
  },

  getWalletOrder() {
    try {
      const saved = localStorage.getItem("cfg_wallet_order");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  saveWalletOrder(orderArray) {
    localStorage.setItem("cfg_wallet_order", JSON.stringify(orderArray));
  }
};
