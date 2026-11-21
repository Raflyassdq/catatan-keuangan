/**
 * Catatan Keuangan Pribadi - Google Apps Script Backend
 * Mendukung Multi-Dompet, Pindah Dana (Transfer), Kategori Dinamis, dan Hutang/Piutang
 */

const CONFIG = {
  SECRET_TOKEN: "SECRET_KEUANGAN_2026",
  GEMINI_API_KEY: "", // Masukkan Gemini API Key di sini atau di Script Properties
  SHEET_INCOME: "Pemasukan",
  SHEET_EXPENSE: "Pengeluaran",
  SHEET_TRANSFER: "Transfer",
  SHEET_WALLET: "Dompet",
  SHEET_CATEGORY: "Kategori",
  SHEET_DEBT: "HutangPiutang"
};

/**
 * Inisialisasi awal seluruh sheet dan header otomatis
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet Pemasukan
  let incomeSheet = ss.getSheetByName(CONFIG.SHEET_INCOME);
  if (!incomeSheet) incomeSheet = ss.insertSheet(CONFIG.SHEET_INCOME);
  if (incomeSheet.getLastRow() === 0) {
    incomeSheet.appendRow(["Tanggal", "Nominal", "Kategori", "Catatan", "Dompet"]);
    formatHeader(incomeSheet, 5);
  }

  // 2. Sheet Pengeluaran
  let expenseSheet = ss.getSheetByName(CONFIG.SHEET_EXPENSE);
  if (!expenseSheet) expenseSheet = ss.insertSheet(CONFIG.SHEET_EXPENSE);
  if (expenseSheet.getLastRow() === 0) {
    expenseSheet.appendRow(["Tanggal", "Nominal", "Kategori", "Catatan", "Dompet"]);
    formatHeader(expenseSheet, 5);
  }

  // 3. Sheet Transfer (Pindah Dana)
  let transferSheet = ss.getSheetByName(CONFIG.SHEET_TRANSFER);
  if (!transferSheet) transferSheet = ss.insertSheet(CONFIG.SHEET_TRANSFER);
  if (transferSheet.getLastRow() === 0) {
    transferSheet.appendRow(["Tanggal", "Nominal", "Dari Dompet", "Ke Dompet", "Catatan"]);
    formatHeader(transferSheet, 5);
  }

  // 4. Sheet Dompet (Daftar Akun / Saldo Awal)
  let walletSheet = ss.getSheetByName(CONFIG.SHEET_WALLET);
  if (!walletSheet) walletSheet = ss.insertSheet(CONFIG.SHEET_WALLET);
  if (walletSheet.getLastRow() === 0) {
    walletSheet.appendRow(["Nama Dompet", "Saldo Awal"]);
    formatHeader(walletSheet, 2);
    const defaults = [
      ["CASH", 0],
      ["BRI", 0],
      ["BSI", 0],
      ["TABUNGAN JAGO", 0],
      ["DANA", 0],
      ["GOPAY", 0],
      ["SHOPEEPAY", 0],
      ["DEBITUR", 0],
      ["RDN", 0]
    ];
    defaults.forEach(w => walletSheet.appendRow(w));
  }

  // 5. Sheet Kategori
  let categorySheet = ss.getSheetByName(CONFIG.SHEET_CATEGORY);
  if (!categorySheet) categorySheet = ss.insertSheet(CONFIG.SHEET_CATEGORY);
  if (categorySheet.getLastRow() === 0) {
    categorySheet.appendRow(["Jenis", "Nama Kategori"]);
    formatHeader(categorySheet, 2);
    const defaultCategories = [
      ["Pemasukan", "Gaji"],
      ["Pemasukan", "Bonus / Uang Lembur"],
      ["Pemasukan", "Dari Keluarga"],
      ["Pemasukan", "Pelunasan Piutang"],
      ["Pengeluaran", "Makan & Minum"],
      ["Pengeluaran", "Transportasi"],
      ["Pengeluaran", "Belanja Kebutuhan Rumah"],
      ["Pengeluaran", "Hiburan & Hobi"],
      ["Pengeluaran", "Kesehatan"],
      ["Pengeluaran", "Pakaian & Penampilan"],
      ["Pengeluaran", "Pendidikan"],
      ["Pengeluaran", "Tabungan / Investasi"],
      ["Pengeluaran", "Skincare & Kosmetik"],
      ["Pengeluaran", "Bayar Utang"]
    ];
    defaultCategories.forEach(c => categorySheet.appendRow(c));
  }

  // 6. Sheet Utang & Piutang
  let debtSheet = getDebtSheet(ss);
  if (!debtSheet) debtSheet = ss.insertSheet("UtangPiutang");
  if (debtSheet.getLastRow() === 0) {
    debtSheet.appendRow([
      "ID", "Tanggal", "Jenis", "Nama Pihak", "Nominal Total", "Terbayar", "Sisa", "Status", "Jatuh Tempo", "Catatan"
    ]);
    formatHeader(debtSheet, 10);
  }

  Logger.log("Inisialisasi seluruh sheet selesai!");
}

function formatHeader(sheet, numCols) {
  const range = sheet.getRange(1, 1, 1, numCols);
  range.setFontWeight("bold");
  range.setBackground("#F3F4F6");
}

/**
 * Handle GET Request (Membaca Semua Data)
 */
function doGet(e) {
  const callback = (e && e.parameter && e.parameter.callback) || null;
  try {
    const token = e && e.parameter && e.parameter.token;
    if (token !== CONFIG.SECRET_TOKEN) {
      return createJsonResponse({ status: "error", message: "Token otentikasi tidak valid" }, callback);
    }

    ensureSheetsExist();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const incomeData = readSheetRows(ss.getSheetByName(CONFIG.SHEET_INCOME), "Pemasukan");
    const expenseData = readSheetRows(ss.getSheetByName(CONFIG.SHEET_EXPENSE), "Pengeluaran");
    const transferData = readTransferRows(ss.getSheetByName(CONFIG.SHEET_TRANSFER));
    const walletData = readWalletRows(ss.getSheetByName(CONFIG.SHEET_WALLET));
    const categoryData = readCategoryRows(ss.getSheetByName(CONFIG.SHEET_CATEGORY));
    const debtData = readDebtRows(getDebtSheet(ss));

    // Gabungkan transaksi untuk riwayat
    const allTransactions = incomeData.concat(expenseData).concat(transferData);

    return createJsonResponse({
      status: "success",
      data: {
        transactions: allTransactions,
        income: incomeData,
        expense: expenseData,
        transfers: transferData,
        wallets: walletData,
        categories: categoryData,
        debts: debtData
      }
    }, callback);
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() }, callback);
  }
}

/**
 * Handle POST Request (Menulis, Mengedit, Menghapus)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: "error", message: "Tidak ada data yang diterima" });
    }

    const payload = JSON.parse(e.postData.contents);
    if (payload.token !== CONFIG.SECRET_TOKEN) {
      return createJsonResponse({ status: "error", message: "Token otentikasi tidak valid" });
    }

    ensureSheetsExist();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = payload.action;

    // 1. TAMBAH TRANSAKSI
    if (action === "add") {
      const type = payload.type;
      const sheetName = type === "Pemasukan" ? CONFIG.SHEET_INCOME : CONFIG.SHEET_EXPENSE;
      const sheet = ss.getSheetByName(sheetName);
      const data = payload.data;

      const rowData = [
        data.date,
        Number(data.amount),
        data.category || "",
        data.note || "",
        data.wallet || data.source || "CASH"
      ];
      sheet.appendRow(rowData);

      return createJsonResponse({
        status: "success",
        message: "Data " + type + " berhasil disimpan",
        data: { rowIndex: sheet.getLastRow() }
      });
    }

    // 2. PINDAH DANA
    if (action === "transfer") {
      const sheet = ss.getSheetByName(CONFIG.SHEET_TRANSFER);
      const data = payload.data;

      const rowData = [
        data.date,
        Number(data.amount),
        data.fromWallet,
        data.toWallet,
        data.note || ""
      ];
      sheet.appendRow(rowData);

      return createJsonResponse({
        status: "success",
        message: "Pindah dana berhasil dicatat",
        data: { rowIndex: sheet.getLastRow() }
      });
    }

    // 3. TAMBAH DOMPET BARU
    if (action === "addWallet") {
      const sheet = ss.getSheetByName(CONFIG.SHEET_WALLET);
      const data = payload.data;
      sheet.appendRow([data.name, Number(data.initialBalance || 0)]);
      return createJsonResponse({ status: "success", message: "Dompet berhasil ditambahkan" });
    }

    // 3b. UPDATE DOMPET
    if (action === "updateWallet") {
      const sheet = ss.getSheetByName(CONFIG.SHEET_WALLET);
      const data = payload.data;
      const rowIndex = Number(payload.rowIndex);
      if (rowIndex && rowIndex >= 2) {
        sheet.getRange(rowIndex, 1, 1, 2).setValues([[data.name, Number(data.initialBalance || 0)]]);
      } else {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
          for (let i = 0; i < names.length; i++) {
            if (names[i][0] === data.name) {
              sheet.getRange(i + 2, 2).setValue(Number(data.initialBalance || 0));
              break;
            }
          }
        }
      }
      return createJsonResponse({ status: "success", message: "Dompet berhasil diperbarui" });
    }

    // 3c. HAPUS DOMPET
    if (action === "deleteWallet") {
      const sheet = ss.getSheetByName(CONFIG.SHEET_WALLET);
      const rowIndex = Number(payload.rowIndex);
      const walletName = payload.walletName || (payload.data && payload.data.name);

      let deleted = false;
      if (rowIndex && rowIndex >= 2 && rowIndex <= sheet.getLastRow()) {
        if (walletName) {
          const currentName = String(sheet.getRange(rowIndex, 1).getValue()).trim();
          if (currentName.toLowerCase() === String(walletName).trim().toLowerCase()) {
            sheet.deleteRow(rowIndex);
            deleted = true;
          }
        } else {
          sheet.deleteRow(rowIndex);
          deleted = true;
        }
      }

      if (!deleted && walletName) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
          for (let i = 0; i < names.length; i++) {
            if (String(names[i][0]).trim().toLowerCase() === String(walletName).trim().toLowerCase()) {
              sheet.deleteRow(i + 2);
              deleted = true;
              break;
            }
          }
        }
      }

      if (!deleted) {
        return createJsonResponse({ status: "error", message: "Dompet tidak ditemukan di Google Sheets" });
      }
      return createJsonResponse({ status: "success", message: "Dompet berhasil dihapus" });
    }

    // 4. TAMBAH KATEGORI BARU
    if (action === "addCategory") {
      const sheet = ss.getSheetByName(CONFIG.SHEET_CATEGORY);
      const data = payload.data;
      sheet.appendRow([data.type, data.name]);
      return createJsonResponse({ status: "success", message: "Kategori berhasil ditambahkan" });
    }

    // 4b. HAPUS KATEGORI
    if (action === "deleteCategory") {
      const sheet = ss.getSheetByName(CONFIG.SHEET_CATEGORY);
      const rowIndex = Number(payload.rowIndex);
      const catName = payload.name || (payload.data && payload.data.name);
      const catType = payload.type || (payload.data && payload.data.type);

      let deleted = false;
      if (rowIndex && rowIndex >= 2 && rowIndex <= sheet.getLastRow()) {
        if (catName) {
          const rowVal = sheet.getRange(rowIndex, 1, 1, 2).getValues()[0];
          if (String(rowVal[1]).trim().toLowerCase() === String(catName).trim().toLowerCase()) {
            sheet.deleteRow(rowIndex);
            deleted = true;
          }
        } else {
          sheet.deleteRow(rowIndex);
          deleted = true;
        }
      }

      if (!deleted && catName) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
          for (let i = 0; i < rows.length; i++) {
            const rType = String(rows[i][0]).trim().toLowerCase();
            const rName = String(rows[i][1]).trim().toLowerCase();
            if (rName === String(catName).trim().toLowerCase() && (!catType || rType === String(catType).trim().toLowerCase())) {
              sheet.deleteRow(i + 2);
              deleted = true;
              break;
            }
          }
        }
      }

      if (!deleted) {
        return createJsonResponse({ status: "error", message: "Kategori tidak ditemukan di Google Sheets" });
      }
      return createJsonResponse({ status: "success", message: "Kategori berhasil dihapus" });
    }

    // 5. TAMBAH UTANG / PIUTANG BARU
    if (action === "addDebt") {
      let sheet = getDebtSheet(ss);
      if (!sheet) sheet = ss.insertSheet("UtangPiutang");

      const data = payload.data;
      const totalAmount = Number(data.amount) || 0;
      const id = "debt-" + Date.now();
      const rawType = data.type;
      const cleanType = (rawType === "Hutang" || rawType === "Utang") ? "Utang" : "Piutang";

      const rowData = [
        id,
        data.date,
        cleanType, // "Utang" atau "Piutang"
        data.person,
        totalAmount,
        0, // Terbayar awal
        totalAmount, // Sisa awal
        "Belum Lunas",
        data.dueDate || "",
        data.note || ""
      ];
      sheet.appendRow(rowData);

      return createJsonResponse({
        status: "success",
        message: "Data " + cleanType + " berhasil dicatat",
        data: { rowIndex: sheet.getLastRow() }
      });
    }

    // 6. PELUNASAN / CICIL UTANG & PIUTANG
    if (action === "payDebt") {
      const debtSheet = getDebtSheet(ss);
      const data = payload.data;
      const rowIndex = Number(payload.rowIndex);
      const payAmount = Number(data.payAmount) || 0;

      if (!debtSheet || !rowIndex || rowIndex < 2 || payAmount <= 0) {
        return createJsonResponse({ status: "error", message: "Data pelunasan tidak valid" });
      }

      const rowValues = debtSheet.getRange(rowIndex, 1, 1, 10).getValues()[0];
      const rawType = String(rowValues[2]);
      const isPayable = rawType === "Hutang" || rawType === "Utang";
      const debtType = isPayable ? "Utang" : "Piutang";
      const person = String(rowValues[3]);
      const totalAmount = Number(rowValues[4]) || 0;
      const currentPaid = Number(rowValues[5]) || 0;

      const newPaid = currentPaid + payAmount;
      const newRemaining = Math.max(0, totalAmount - newPaid);
      const newStatus = newRemaining <= 0 ? "Lunas" : "Belum Lunas";

      // Update baris UtangPiutang / HutangPiutang
      debtSheet.getRange(rowIndex, 6, 1, 3).setValues([[newPaid, newRemaining, newStatus]]);

      // Otomatis catat transaksi kas riil di sheet yang sesuai
      const walletName = data.wallet || "CASH";
      const payDate = data.date || normalizeDate(new Date());

      if (isPayable) {
        // Bayar Utang = Pengeluaran kas
        const expenseSheet = ss.getSheetByName(CONFIG.SHEET_EXPENSE);
        expenseSheet.appendRow([
          payDate,
          payAmount,
          "Bayar Utang",
          `Pelunasan utang ke ${person}${data.note ? " - " + data.note : ""}`,
          walletName
        ]);
      } else {
        // Terima Piutang = Pemasukan kas
        const incomeSheet = ss.getSheetByName(CONFIG.SHEET_INCOME);
        incomeSheet.appendRow([
          payDate,
          payAmount,
          "Pelunasan Piutang",
          `Terima piutang dari ${person}${data.note ? " - " + data.note : ""}`,
          walletName
        ]);
      }

      return createJsonResponse({
        status: "success",
        message: `Pelunasan ${debtType} sebesar Rp ${payAmount.toLocaleString('id-ID')} berhasil dicatat!`
      });
    }

    // 7. HAPUS UTANG / PIUTANG
    if (action === "deleteDebt") {
      const rowIndex = Number(payload.rowIndex);
      const sheet = getDebtSheet(ss);
      if (sheet) {
        sheet.deleteRow(rowIndex);
      }
      return createJsonResponse({ status: "success", message: "Data utang/piutang berhasil dihapus" });
    }

    // 8. UPDATE TRANSAKSI
    if (action === "update") {
      const type = payload.type;
      const rowIndex = Number(payload.rowIndex);
      const data = payload.data;

      if (type === "Transfer") {
        const sheet = ss.getSheetByName(CONFIG.SHEET_TRANSFER);
        const rowData = [data.date, Number(data.amount), data.fromWallet, data.toWallet, data.note || ""];
        sheet.getRange(rowIndex, 1, 1, 5).setValues([rowData]);
      } else {
        const sheetName = type === "Pemasukan" ? CONFIG.SHEET_INCOME : CONFIG.SHEET_EXPENSE;
        const sheet = ss.getSheetByName(sheetName);
        const rowData = [data.date, Number(data.amount), data.category || "", data.note || "", data.wallet || "CASH"];
        sheet.getRange(rowIndex, 1, 1, 5).setValues([rowData]);
      }

      return createJsonResponse({ status: "success", message: "Transaksi berhasil diperbarui" });
    }

    // 9. HAPUS TRANSAKSI
    if (action === "delete") {
      const type = payload.type;
      const rowIndex = Number(payload.rowIndex);
      let sheetName = CONFIG.SHEET_EXPENSE;
      if (type === "Pemasukan") sheetName = CONFIG.SHEET_INCOME;
      if (type === "Transfer") sheetName = CONFIG.SHEET_TRANSFER;

      const sheet = ss.getSheetByName(sheetName);
      sheet.deleteRow(rowIndex);
      return createJsonResponse({ status: "success", message: "Transaksi berhasil dihapus" });
    }

    // 10. PEMINDAI STRUK (RECEIPT SCANNER DENGAN GEMINI VISION)
    if (action === "scanReceipt") {
      return handleReceiptScan(payload);
    }

    return createJsonResponse({ status: "error", message: "Action tidak dikenali: " + action });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * Analisis Foto Struk Belanja menggunakan Google Gemini 1.5 Flash Vision REST API
 */
function handleReceiptScan(payload) {
  try {
    const apiKey = (payload.apiKey || "").trim() ||
      (CONFIG.GEMINI_API_KEY || "").trim() ||
      PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
    if (!apiKey) {
      return createJsonResponse({
        status: "error",
        message: "API Key Gemini belum disetel di Google Apps Script atau menu Pengaturan."
      });
    }

    let imageBase64 = payload.image || (payload.data && payload.data.image) || "";
    if (!imageBase64) {
      return createJsonResponse({
        status: "error",
        message: "Data gambar struk tidak ditemukan."
      });
    }

    let mimeType = "image/jpeg";
    if (imageBase64.indexOf("data:") === 0) {
      const match = imageBase64.match(/^data:([^;]+);base64,/);
      if (match) {
        mimeType = match[1];
        imageBase64 = imageBase64.substring(match[0].length);
      }
    }

    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + encodeURIComponent(apiKey);

    const promptText = "Kamu adalah asisten keuangan pribadi cerdas. Analisis foto struk atau nota pembayaran belanja ini dengan sangat teliti. " +
      "Foto ini bisa berupa struk kasir cetak komputer MAUPUN NOTA KONTAN MANUAL TULISAN TANGAN dengan tabel barang dan coretan pena/pensil.\n\n" +
      "Ekstrak data transaksi dalam format JSON:\n" +
      "1. amount: Total pembayaran akhir (Grand Total / Total Bayar / Jumlah Rp di baris total bawah) yang sebenarnya dibayarkan oleh pembeli, dalam bentuk ANGKA bulat murni tanpa simbol 'Rp', titik ribuan, atau koma (contoh: jika tertulis 'Jumlah Rp. 55.000', isi angka 55000). Jangan ambil subtotal atau harga satuan per baris jika ada total akhir.\n" +
      "2. date: Tanggal transaksi dalam format YYYY-MM-DD. Jika tahun tidak tertulis, gunakan tahun berjalan. Jika tanggal sama sekali tidak ada, isi string kosong \"\".\n" +
      "3. merchant: Nama toko, warung, atau judul nota jika ada. Jika tidak ada nama toko, buat ringkasan toko/penjual yang wajar atau isi string kosong \"\".\n" +
      "4. category: Rekomendasi kategori pengeluaran yang paling relevan (pilihan: \"Makan & Minum\", \"Transportasi\", \"Belanja Kebutuhan Rumah\", \"Hiburan & Hobi\", \"Kesehatan\", \"Pakaian & Penampilan\", \"Pendidikan\", \"Skincare & Kosmetik\").\n" +
      "5. note: Ringkasan singkat transaksi atau daftar nama barang yang dibeli (contoh: \"Roti Sobek, Rinso, Tepung\").\n\n" +
      "Jawab HANYA dalam format JSON valid tanpa tanda backtick atau markdown: {\"amount\": 0, \"date\": \"\", \"merchant\": \"\", \"category\": \"\", \"note\": \"\"}";

    const requestBody = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: "application/json"
      }
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(geminiUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      let errDetail = responseText;
      try {
        const errObj = JSON.parse(responseText);
        if (errObj.error && errObj.error.message) errDetail = errObj.error.message;
      } catch (e) {}
      return createJsonResponse({
        status: "error",
        message: "Gemini API Error (" + responseCode + "): " + errDetail
      });
    }

    const geminiData = JSON.parse(responseText);
    const candidates = geminiData.candidates;
    if (!candidates || candidates.length === 0 || !candidates[0].content || !candidates[0].content.parts || candidates[0].content.parts.length === 0) {
      return createJsonResponse({
        status: "error",
        message: "Tidak ada respons teks yang dihasilkan dari analisis struk."
      });
    }

    let rawJson = candidates[0].content.parts[0].text.trim();
    rawJson = rawJson.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsedResult = {};
    try {
      parsedResult = JSON.parse(rawJson);
    } catch (parseErr) {
      const amountMatch = rawJson.match(/"amount"\s*:\s*([0-9.]+)/i);
      const dateMatch = rawJson.match(/"date"\s*:\s*"([^"]+)"/i);
      const merchantMatch = rawJson.match(/"merchant"\s*:\s*"([^"]+)"/i);
      const categoryMatch = rawJson.match(/"category"\s*:\s*"([^"]+)"/i);
      const noteMatch = rawJson.match(/"note"\s*:\s*"([^"]+)"/i);

      parsedResult = {
        amount: amountMatch ? Number(amountMatch[1]) : 0,
        date: dateMatch ? dateMatch[1] : "",
        merchant: merchantMatch ? merchantMatch[1] : "",
        category: categoryMatch ? categoryMatch[1] : "",
        note: noteMatch ? noteMatch[1] : ""
      };
    }

    return createJsonResponse({
      status: "success",
      message: "Struk berhasil dipindai dengan Gemini Vision",
      data: {
        amount: Number(parsedResult.amount) || 0,
        date: parsedResult.date || "",
        merchant: parsedResult.merchant || "",
        category: parsedResult.category || "",
        note: parsedResult.note || (parsedResult.merchant ? parsedResult.merchant : "Belanja struk")
      }
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Gagal memproses struk: " + err.toString()
    });
  }
}

function normalizeDate(rawDate) {
  if (!rawDate) return "";
  if (Object.prototype.toString.call(rawDate) === "[object Date]" || rawDate instanceof Date) {
    const d = new Date(rawDate);
    const dd = ("0" + d.getDate()).slice(-2);
    const mm = ("0" + (d.getMonth() + 1)).slice(-2);
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  const str = String(rawDate).trim();
  const parsed = Date.parse(str);
  if (!isNaN(parsed) && str.length > 10 && !str.includes("/")) {
    const d = new Date(parsed);
    const dd = ("0" + d.getDate()).slice(-2);
    const mm = ("0" + (d.getMonth() + 1)).slice(-2);
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return str;
}

function readSheetRows(sheet, type) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  const results = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rawAmount = row[1];
    if (!rawAmount && rawAmount !== 0) continue;

    const rowNumber = i + 2;
    results.push({
      id: `${type.toLowerCase()}-${rowNumber}`,
      rowIndex: rowNumber,
      type: type,
      date: normalizeDate(row[0]),
      amount: Number(rawAmount) || 0,
      category: String(row[2] || ""),
      note: String(row[3] || ""),
      wallet: String(row[4] || "CASH"),
      source: String(row[4] || "CASH")
    });
  }

  return results;
}

function readTransferRows(sheet) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  const results = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rawAmount = row[1];
    if (!rawAmount && rawAmount !== 0) continue;

    const rowNumber = i + 2;
    results.push({
      id: `trf-${rowNumber}`,
      rowIndex: rowNumber,
      type: "Transfer",
      date: normalizeDate(row[0]),
      amount: Number(rawAmount) || 0,
      fromWallet: String(row[2] || "CASH"),
      toWallet: String(row[3] || "BRI"),
      category: "Pindah Dana",
      note: String(row[4] || "")
    });
  }

  return results;
}

function readWalletRows(sheet) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const results = [];

  for (let i = 0; i < values.length; i++) {
    const name = String(values[i][0] || "").trim();
    if (!name) continue;
    results.push({
      id: `w-${i + 2}`,
      rowIndex: i + 2,
      name: name,
      initialBalance: Number(values[i][1]) || 0
    });
  }

  return results;
}

function readCategoryRows(sheet) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const results = [];

  for (let i = 0; i < values.length; i++) {
    const type = String(values[i][0] || "").trim();
    const name = String(values[i][1] || "").trim();
    if (!name) continue;
    results.push({
      rowIndex: i + 2,
      type: type,
      name: name
    });
  }

  return results;
}

function readDebtRows(sheet) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  const results = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const totalAmount = Number(row[4]);
    if (!totalAmount && totalAmount !== 0) continue;

    const rowNumber = i + 2;
    const rawType = String(row[2] || "Piutang");
    const cleanType = (rawType === "Hutang" || rawType === "Utang") ? "Utang" : "Piutang";

    results.push({
      id: String(row[0] || `debt-${rowNumber}`),
      rowIndex: rowNumber,
      date: normalizeDate(row[1]),
      type: cleanType,
      person: String(row[3] || ""),
      amount: totalAmount,
      paid: Number(row[5]) || 0,
      remaining: Number(row[6]) || 0,
      status: String(row[7] || "Belum Lunas"),
      dueDate: normalizeDate(row[8]),
      note: String(row[9] || "")
    });
  }

  return results;
}

function getDebtSheet(ss) {
  return ss.getSheetByName("UtangPiutang") || ss.getSheetByName("HutangPiutang");
}

function ensureSheetsExist() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(CONFIG.SHEET_WALLET) || !getDebtSheet(ss)) {
    setupSheets();
  }
}

function createJsonResponse(data, callbackName) {
  const jsonString = JSON.stringify(data);
  if (callbackName) {
    return ContentService.createTextOutput(`${callbackName}(${jsonString})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}
