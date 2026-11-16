/**
 * Data Access Layer (API Client)
 * Menangani komunikasi data ke Google Apps Script Web App
 */
const API = {
  validateUrl(url) {
    if (!url || typeof url !== "string") {
      return { valid: false, message: "URL Google Apps Script belum diisi." };
    }

    const clean = url.trim();
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
        message: "URL Apps Script harus berakhiran '/exec'."
      };
    }

    return { valid: true };
  },

  isConfigured() {
    const url = APP_CONFIG.getScriptUrl();
    return this.validateUrl(url).valid;
  },

  /**
   * Mengambil semua data (Transaksi, Dompet, Kategori, Transfer)
   */
  async fetchTransactions() {
    const scriptUrl = APP_CONFIG.getScriptUrl();
    const check = this.validateUrl(scriptUrl);
    if (!check.valid) throw new Error(check.message);

    const token = APP_CONFIG.getSecretToken();

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
      console.warn("Fetch standar gagal, mencoba JSONP fallback...", fetchErr);

      try {
        const jsonpData = await this.fetchJsonp(`${scriptUrl}?token=${encodeURIComponent(token)}&action=getAll`);
        if (jsonpData.status !== "success") {
          throw new Error(jsonpData.message || "Gagal memuat data lewat JSONP.");
        }
        return jsonpData.data;
      } catch (jsonpErr) {
        throw new Error(
          fetchErr.message && fetchErr.message !== "Failed to fetch"
            ? fetchErr.message
            : "Koneksi ditolak oleh browser. Pastikan URL Web App benar dan saat Deploy memilih 'Who has access: Anyone'."
        );
      }
    }
  },

  fetchJsonp(url) {
    return new Promise((resolve, reject) => {
      const callbackName = "jsonp_cb_" + Math.round(100000 * Math.random());
      const script = document.createElement("script");
      const separator = url.includes("?") ? "&" : "?";
      script.src = `${url}${separator}callback=${callbackName}&_t=${Date.now()}`;

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Batas waktu koneksi habis (Timeout)."));
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
   * Menyimpan transaksi baru (Pemasukan / Pengeluaran)
   */
  async addTransaction(transactionData) {
    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "add",
      type: transactionData.type,
      data: {
        date: transactionData.date,
        amount: Number(transactionData.amount),
        category: transactionData.category,
        note: transactionData.note || "",
        wallet: transactionData.wallet || "Cash"
      }
    };
    return this.postRequest(payload);
  },

  /**
   * Pindah Dana (Transfer Antar Dompet)
   */
  async transferFunds(transferData) {
    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "transfer",
      data: {
        date: transferData.date,
        amount: Number(transferData.amount),
        fromWallet: transferData.fromWallet,
        toWallet: transferData.toWallet,
        note: transferData.note || ""
      }
    };
    return this.postRequest(payload);
  },

  /**
   * Tambah Dompet Baru
   */
  async addWallet(walletData) {
    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "addWallet",
      data: {
        name: walletData.name.trim(),
        initialBalance: Number(walletData.initialBalance) || 0
      }
    };
    return this.postRequest(payload);
  },

  /**
   * Update Saldo Awal / Nama Dompet
   */
  async updateWallet(walletData) {
    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "updateWallet",
      rowIndex: walletData.rowIndex,
      data: {
        name: walletData.name.trim(),
        initialBalance: Number(walletData.initialBalance) || 0
      }
    };
    return this.postRequest(payload);
  },

  /**
   * Tambah Kategori Baru
   */
  async addCategory(categoryData) {
    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "addCategory",
      data: {
        type: categoryData.type,
        name: categoryData.name.trim()
      }
    };
    return this.postRequest(payload);
  },

  /**
   * Tambah Hutang / Piutang Baru
   */
  async addDebt(debtData) {
    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "addDebt",
      data: {
        date: debtData.date,
        type: debtData.type, // "Hutang" atau "Piutang"
        person: debtData.person.trim(),
        amount: Number(debtData.amount),
        dueDate: debtData.dueDate || "",
        note: debtData.note || ""
      }
    };
    return this.postRequest(payload);
  },

  /**
   * Pelunasan / Cicil Hutang & Piutang (Update hutang + Catat kas di dompet)
   */
  async payDebt(payData) {
    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "payDebt",
      rowIndex: payData.rowIndex,
      data: {
        payAmount: Number(payData.payAmount),
        wallet: payData.wallet || "CASH",
        date: payData.date,
        note: payData.note || ""
      }
    };
    return this.postRequest(payload);
  },

  /**
   * Hapus Data Hutang / Piutang
   */
  async deleteDebt(rowIndex) {
    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "deleteDebt",
      rowIndex: rowIndex
    };
    return this.postRequest(payload);
  },

  /**
   * Update Transaksi
   */
  async updateTransaction(type, rowIndex, updatedData) {
    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "update",
      type: type,
      rowIndex: rowIndex,
      data: updatedData
    };
    return this.postRequest(payload);
  },

  /**
   * Hapus Transaksi (Pemasukan / Pengeluaran / Transfer)
   */
  async deleteTransaction(type, rowIndex) {
    const payload = {
      token: APP_CONFIG.getSecretToken(),
      action: "delete",
      type: type,
      rowIndex: rowIndex
    };
    return this.postRequest(payload);
  },

  async postRequest(payload) {
    const scriptUrl = APP_CONFIG.getScriptUrl();
    const check = this.validateUrl(scriptUrl);
    if (!check.valid) throw new Error(check.message);

    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
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
