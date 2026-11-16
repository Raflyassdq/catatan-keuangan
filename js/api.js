/**
 * Data Access Layer (API Client)
 * Menangani komunikasi data ke Google Apps Script Web App
 */
const API = {
  /**
   * Validasi format URL Apps Script
   */
  validateUrl(url) {
    if (!url || typeof url !== "string") {
      return { valid: false, message: "URL Google Apps Script belum diisi." };
    }

    const clean = url.trim();

    // Deteksi jika user menyalin URL redirect sementara dari browser
    if (clean.includes("script.googleusercontent.com")) {
      return {
        valid: false,
        message: "Link yang dimasukkan adalah link redirect (googleusercontent.com). Harap salin Web App URL asli dari Apps Script yang berakhiran '/exec'."
      };
    }

    if (!clean.startsWith("https://script.google.com/macros/s/")) {
      return {
        valid: false,
        message: "Format URL tidak sesuai. URL harus berawalan 'https://script.google.com/macros/s/...'"
      };
    }

    if (!clean.endsWith("/exec")) {
      return {
        valid: false,
        message: "URL Apps Script harus berakhiran '/exec'. Pastikan Anda menyalin URL Web App hasil Deploy."
      };
    }

    return { valid: true };
  },

  /**
   * Status konfigurasi
   */
  isConfigured() {
    const url = APP_CONFIG.getScriptUrl();
    return this.validateUrl(url).valid;
  },

  /**
   * Mengambil semua transaksi dari spreadsheet (Mendukung Fetch + Fallback JSONP)
   */
  async fetchTransactions() {
    const scriptUrl = APP_CONFIG.getScriptUrl();
    const check = this.validateUrl(scriptUrl);
    if (!check.valid) {
      throw new Error(check.message);
    }

    const token = APP_CONFIG.getSecretToken();

    // Coba Fetch standar terlebih dahulu
    try {
      const targetUrl = `${scriptUrl}?token=${encodeURIComponent(token)}&action=getAll&_t=${Date.now()}`;
      const response = await fetch(targetUrl, {
        method: "GET",
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`Server Google merespons status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status !== "success") {
        throw new Error(result.message || "Spreadsheet menolak permintaan.");
      }

      return result.data;
    } catch (fetchErr) {
      console.warn("Fetch standar gagal (kemungkinan batasan CORS file:///), mencoba jalur JSONP...", fetchErr);

      // Fallback ke JSONP (Sangat ampuh jika dibuka dari file:/// lokal)
      try {
        const jsonpData = await this.fetchJsonp(`${scriptUrl}?token=${encodeURIComponent(token)}&action=getAll`);
        if (jsonpData.status !== "success") {
          throw new Error(jsonpData.message || "Gagal memuat data lewat JSONP.");
        }
        return jsonpData.data;
      } catch (jsonpErr) {
        console.error("Jalur JSONP juga gagal:", jsonpErr);
        throw new Error(
          fetchErr.message && fetchErr.message !== "Failed to fetch"
            ? fetchErr.message
            : "Koneksi ditolak oleh browser. Pastikan URL Web App benar dan saat Deploy memilih 'Who has access: Anyone'."
        );
      }
    }
  },

  /**
   * Helper request JSONP untuk mengatasi blokade CORS saat file dibuka lokal (file:///)
   */
  fetchJsonp(url) {
    return new Promise((resolve, reject) => {
      const callbackName = "jsonp_cb_" + Math.round(100000 * Math.random());
      const script = document.createElement("script");
      const separator = url.includes("?") ? "&" : "?";
      script.src = `${url}${separator}callback=${callbackName}&_t=${Date.now()}`;

      // Timer batas waktu 10 detik
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Batas waktu koneksi habis (Timeout). Periksa koneksi internet atau Web App URL."));
      }, 10000);

      function cleanup() {
        if (script.parentNode) script.parentNode.removeChild(script);
        delete window[callbackName];
        clearTimeout(timeout);
      }

      window[callbackName] = function (data) {
        cleanup();
        resolve(data);
      };

      script.onerror = function () {
        cleanup();
        reject(new Error("Gagal menghubungi Google Apps Script via JSONP."));
      };

      document.body.appendChild(script);
    });
  },

  /**
   * Menyimpan transaksi baru (Pemasukan atau Pengeluaran)
   */
  async addTransaction(transactionData) {
    const scriptUrl = APP_CONFIG.getScriptUrl();
    const check = this.validateUrl(scriptUrl);
    if (!check.valid) throw new Error(check.message);

    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "add",
      type: transactionData.type,
      data: {
        date: transactionData.date,
        amount: Number(transactionData.amount),
        category: transactionData.category,
        note: transactionData.note || "",
        source: transactionData.source || transactionData.category || ""
      }
    };

    return this.postRequest(payload);
  },

  /**
   * Mengedit baris transaksi yang sudah ada
   */
  async updateTransaction(type, rowIndex, updatedData) {
    const scriptUrl = APP_CONFIG.getScriptUrl();
    const check = this.validateUrl(scriptUrl);
    if (!check.valid) throw new Error(check.message);

    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "update",
      type: type,
      rowIndex: rowIndex,
      data: {
        date: updatedData.date,
        amount: Number(updatedData.amount),
        category: updatedData.category,
        note: updatedData.note || "",
        source: updatedData.source || updatedData.category || ""
      }
    };

    return this.postRequest(payload);
  },

  /**
   * Menghapus baris transaksi dari spreadsheet
   */
  async deleteTransaction(type, rowIndex) {
    const scriptUrl = APP_CONFIG.getScriptUrl();
    const check = this.validateUrl(scriptUrl);
    if (!check.valid) throw new Error(check.message);

    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "delete",
      type: type,
      rowIndex: rowIndex
    };

    return this.postRequest(payload);
  },

  /**
   * Helper pengiriman POST request yang aman dari CORS preflight
   */
  async postRequest(payload) {
    const scriptUrl = APP_CONFIG.getScriptUrl();

    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`Koneksi gagal dengan status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status !== "success") {
        throw new Error(result.message || "Gagal memproses data di spreadsheet");
      }

      return result;
    } catch (error) {
      console.error("API POST error:", error);
      throw error;
    }
  }
};
