/**
 * Catatan Keuangan Pribadi - Google Apps Script Backend
 * 
 * Hubungkan script ini dengan Google Sheets milik Anda.
 * Deploy sebagai Web App dengan akses: "Anyone" (Siapa saja).
 */

// Token rahasia untuk melindungi endpoint Anda dari akses luar
// Ganti token ini dengan kata sandi rahasia pilihan Anda!
const CONFIG = {
  SECRET_TOKEN: "SECRET_KEUANGAN_2026",
  SHEET_INCOME: "Pemasukan",
  SHEET_EXPENSE: "Pengeluaran"
};

/**
 * Inisialisasi awal sheet dan header jika belum ada
 * Jalankan fungsi ini satu kali di editor Apps Script jika membuat spreadsheet baru
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Sheet Pemasukan
  let incomeSheet = ss.getSheetByName(CONFIG.SHEET_INCOME);
  if (!incomeSheet) {
    incomeSheet = ss.insertSheet(CONFIG.SHEET_INCOME);
  }
  if (incomeSheet.getLastRow() === 0) {
    incomeSheet.appendRow(["Tanggal", "Nominal", "Kategori", "Catatan", "Sumber"]);
    const headerRange = incomeSheet.getRange(1, 1, 1, 5);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#F3F4F6");
  }
  
  // Setup Sheet Pengeluaran
  let expenseSheet = ss.getSheetByName(CONFIG.SHEET_EXPENSE);
  if (!expenseSheet) {
    expenseSheet = ss.insertSheet(CONFIG.SHEET_EXPENSE);
  }
  if (expenseSheet.getLastRow() === 0) {
    expenseSheet.appendRow(["Tanggal", "Nominal", "Kategori", "Catatan"]);
    const headerRange = expenseSheet.getRange(1, 1, 1, 4);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#F3F4F6");
  }
  
  Logger.log("Inisialisasi sheet selesai!");
}

/**
 * Handle GET Request (Membaca Data)
 * Endpoint: ?token=xxx&action=getAll | getSummary
 */
function doGet(e) {
  const callback = (e && e.parameter && e.parameter.callback) || null;
  try {
    const token = e && e.parameter && e.parameter.token;
    if (token !== CONFIG.SECRET_TOKEN) {
      return createJsonResponse({ status: "error", message: "Token otentikasi tidak valid" }, callback);
    }
    
    // Pastikan sheet sudah ada
    ensureSheetsExist();

    const action = (e && e.parameter && e.parameter.action) || "getAll";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "getAll") {
      const incomeData = readSheetRows(ss.getSheetByName(CONFIG.SHEET_INCOME), "Pemasukan");
      const expenseData = readSheetRows(ss.getSheetByName(CONFIG.SHEET_EXPENSE), "Pengeluaran");
      
      // Gabungkan dan urutkan transaksi (terbaru lebih awal)
      const allTransactions = incomeData.concat(expenseData);
      
      return createJsonResponse({
        status: "success",
        data: {
          transactions: allTransactions,
          income: incomeData,
          expense: expenseData
        }
      }, callback);
    }

    return createJsonResponse({ status: "error", message: "Action tidak dikenali" }, callback);
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() }, callback);
  }
}

/**
 * Handle POST Request (Menambah, Mengedit, Menghapus Data)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: "error", message: "Tidak ada payload data yang diterima" });
    }

    const payload = JSON.parse(e.postData.contents);
    if (payload.token !== CONFIG.SECRET_TOKEN) {
      return createJsonResponse({ status: "error", message: "Token otentikasi tidak valid" }, 403);
    }

    ensureSheetsExist();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = payload.action;
    const type = payload.type; // "Pemasukan" atau "Pengeluaran"
    const sheetName = type === "Pemasukan" ? CONFIG.SHEET_INCOME : CONFIG.SHEET_EXPENSE;
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return createJsonResponse({ status: "error", message: "Sheet tidak ditemukan: " + sheetName });
    }

    // 1. TAMBAH TRANSAKSI
    if (action === "add") {
      const data = payload.data;
      if (!data || !data.amount || !data.category || !data.date) {
        return createJsonResponse({ status: "error", message: "Data tidak lengkap" });
      }

      let rowData = [];
      if (type === "Pemasukan") {
        rowData = [
          data.date,                        // Tanggal (DD/MM/YYYY)
          Number(data.amount),              // Nominal
          data.category || "",              // Kategori
          data.note || "",                  // Catatan
          data.source || data.category || ""// Sumber
        ];
      } else {
        rowData = [
          data.date,                        // Tanggal (DD/MM/YYYY)
          Number(data.amount),              // Nominal
          data.category || "",              // Kategori
          data.note || ""                   // Catatan
        ];
      }

      sheet.appendRow(rowData);
      const newRowIndex = sheet.getLastRow();

      return createJsonResponse({
        status: "success",
        message: "Data " + type + " berhasil disimpan",
        data: { rowIndex: newRowIndex }
      });
    }

    // 2. UPDATE TRANSAKSI
    if (action === "update") {
      const rowIndex = Number(payload.rowIndex);
      const data = payload.data;
      if (!rowIndex || rowIndex < 2) {
        return createJsonResponse({ status: "error", message: "Baris data tidak valid untuk diedit" });
      }

      if (type === "Pemasukan") {
        const rowData = [
          data.date,
          Number(data.amount),
          data.category || "",
          data.note || "",
          data.source || data.category || ""
        ];
        sheet.getRange(rowIndex, 1, 1, 5).setValues([rowData]);
      } else {
        const rowData = [
          data.date,
          Number(data.amount),
          data.category || "",
          data.note || ""
        ];
        sheet.getRange(rowIndex, 1, 1, 4).setValues([rowData]);
      }

      return createJsonResponse({
        status: "success",
        message: "Data " + type + " baris " + rowIndex + " berhasil diperbarui"
      });
    }

    // 3. HAPUS TRANSAKSI
    if (action === "delete") {
      const rowIndex = Number(payload.rowIndex);
      if (!rowIndex || rowIndex < 2) {
        return createJsonResponse({ status: "error", message: "Baris data tidak valid untuk dihapus" });
      }

      sheet.deleteRow(rowIndex);
      return createJsonResponse({
        status: "success",
        message: "Data " + type + " baris " + rowIndex + " berhasil dihapus"
      });
    }

    return createJsonResponse({ status: "error", message: "Action POST tidak dikenali: " + action });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * Membaca semua baris data dari sheet tertentu
 */
function readSheetRows(sheet, type) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return []; // Hanya header atau kosong

  const lastCol = type === "Pemasukan" ? 5 : 4;
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const results = [];
  for (let i = 0; i < values.length; i++) {
    const rowNumber = i + 2; // Baris 1 adalah header
    const row = values[i];
    
    // Pastikan nominal valid
    const rawDate = row[0];
    const rawAmount = row[1];
    if (!rawAmount && rawAmount !== 0) continue;

    let formattedDate = "";
    if (Object.prototype.toString.call(rawDate) === "[object Date]" || rawDate instanceof Date) {
      const d = new Date(rawDate);
      const dd = ("0" + d.getDate()).slice(-2);
      const mm = ("0" + (d.getMonth() + 1)).slice(-2);
      const yyyy = d.getFullYear();
      formattedDate = `${dd}/${mm}/${yyyy}`;
    } else {
      const str = String(rawDate || "").trim();
      const parsed = Date.parse(str);
      if (!isNaN(parsed) && str.length > 10 && !str.includes("/")) {
        const d = new Date(parsed);
        const dd = ("0" + d.getDate()).slice(-2);
        const mm = ("0" + (d.getMonth() + 1)).slice(-2);
        const yyyy = d.getFullYear();
        formattedDate = `${dd}/${mm}/${yyyy}`;
      } else {
        formattedDate = str;
      }
    }

    if (type === "Pemasukan") {
      results.push({
        id: `inc-${rowNumber}`,
        rowIndex: rowNumber,
        type: "Pemasukan",
        date: formattedDate,
        amount: Number(rawAmount) || 0,
        category: String(row[2] || "Lain-lain"),
        note: String(row[3] || ""),
        source: String(row[4] || row[2] || "")
      });
    } else {
      results.push({
        id: `exp-${rowNumber}`,
        rowIndex: rowNumber,
        type: "Pengeluaran",
        date: formattedDate,
        amount: Number(rawAmount) || 0,
        category: String(row[2] || "Lain-lain"),
        note: String(row[3] || "")
      });
    }
  }

  return results;
}

/**
 * Pastikan kedua sheet ada
 */
function ensureSheetsExist() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(CONFIG.SHEET_INCOME) || !ss.getSheetByName(CONFIG.SHEET_EXPENSE)) {
    setupSheets();
  }
}

/**
 * Helper pembungkus response JSON (mendukung JSONP jika ada parameter callback)
 */
function createJsonResponse(data, callbackName) {
  const jsonString = JSON.stringify(data);
  if (callbackName) {
    return ContentService.createTextOutput(`${callbackName}(${jsonString})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}
