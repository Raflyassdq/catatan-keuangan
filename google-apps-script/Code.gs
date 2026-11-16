/**
 * Catatan Keuangan Pribadi - Google Apps Script Backend
 * Mendukung Multi-Dompet, Pindah Dana (Transfer), dan Kategori Dinamis
 */

const CONFIG = {
  SECRET_TOKEN: "SECRET_KEUANGAN_2026",
  SHEET_INCOME: "Pemasukan",
  SHEET_EXPENSE: "Pengeluaran",
  SHEET_TRANSFER: "Transfer",
  SHEET_WALLET: "Dompet",
  SHEET_CATEGORY: "Kategori"
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
    // Default Wallets sesuai akun riil
    const defaults = [
      ["CASH", 12500],
      ["BRI", 333037],
      ["BSI", 43735],
      ["TABUNGAN JAGO", 6223299],
      ["DANA", 5321],
      ["GOPAY", 33669],
      ["SHOPEEPAY", -23275],
      ["DEBITUR", 803143],
      ["RDN", 397546]
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
      ["Pemasukan", "Transfer dari Keluarga"],
      ["Pemasukan", "Lain-lain"],
      ["Pengeluaran", "Makan & Minum"],
      ["Pengeluaran", "Transportasi"],
      ["Pengeluaran", "Belanja Kebutuhan Rumah"],
      ["Pengeluaran", "Hiburan & Hobi"],
      ["Pengeluaran", "Kesehatan"],
      ["Pengeluaran", "Pakaian & Penampilan"],
      ["Pengeluaran", "Pendidikan"],
      ["Pengeluaran", "Tabungan / Investasi"],
      ["Pengeluaran", "Skincare & Kosmetik"],
      ["Pengeluaran", "Lain-lain"]
    ];
    defaultCategories.forEach(c => categorySheet.appendRow(c));
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
        categories: categoryData
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

    // 1. TAMBAH TRANSAKSI (Pemasukan / Pengeluaran)
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
        data.wallet || data.source || "Cash"
      ];
      sheet.appendRow(rowData);

      return createJsonResponse({
        status: "success",
        message: "Data " + type + " berhasil disimpan",
        data: { rowIndex: sheet.getLastRow() }
      });
    }

    // 2. PINDAH DANA (TRANSFER ANTAR DOMPET)
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

    // 4. TAMBAH KATEGORI BARU
    if (action === "addCategory") {
      const sheet = ss.getSheetByName(CONFIG.SHEET_CATEGORY);
      const data = payload.data;
      sheet.appendRow([data.type, data.name]);
      return createJsonResponse({ status: "success", message: "Kategori berhasil ditambahkan" });
    }

    // 5. UPDATE TRANSAKSI
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
        const rowData = [data.date, Number(data.amount), data.category || "", data.note || "", data.wallet || "Cash"];
        sheet.getRange(rowIndex, 1, 1, 5).setValues([rowData]);
      }

      return createJsonResponse({ status: "success", message: "Transaksi berhasil diperbarui" });
    }

    // 6. HAPUS TRANSAKSI
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

    return createJsonResponse({ status: "error", message: "Action tidak dikenali: " + action });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * Format tanggal dari sheet menjadi string DD/MM/YYYY yang bersih
 */
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

/**
 * Baca baris transaksi Pemasukan / Pengeluaran
 */
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
      category: String(row[2] || "Lain-lain"),
      note: String(row[3] || ""),
      wallet: String(row[4] || "Cash"),
      source: String(row[4] || "Cash")
    });
  }

  return results;
}

/**
 * Baca baris sheet Transfer
 */
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
      fromWallet: String(row[2] || "Cash"),
      toWallet: String(row[3] || "Bank 1"),
      category: "Pindah Dana",
      note: String(row[4] || "")
    });
  }

  return results;
}

/**
 * Baca sheet Dompet
 */
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

/**
 * Baca sheet Kategori
 */
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
      type: type,
      name: name
    });
  }

  return results;
}

function ensureSheetsExist() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(CONFIG.SHEET_WALLET) || !ss.getSheetByName(CONFIG.SHEET_TRANSFER)) {
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
