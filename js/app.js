/**
 * Catatan Keuangan Pribadi - Application Controller
 * Menghubungkan UI, interaksi pengguna, Chart.js, dan Data Layer (API)
 */

(function () {
  "use strict";

  // State Aplikasi
  const state = {
    transactions: [],
    selectedPeriod: "this-month",
    historyTypeFilter: "all",
    searchQuery: "",
    activeTransaction: null,
    isEditing: false,
    editingType: "Pengeluaran",
    editingRowIndex: null,
    chartDonut: null,
    chartBar: null
  };

  // DOM Elements
  const DOM = {
    // Navigasi
    navTabDashboard: document.getElementById("nav-tab-dashboard"),
    navTabHistory: document.getElementById("nav-tab-history"),
    navBtnAddQuick: document.getElementById("nav-btn-add-quick"),
    viewDashboard: document.getElementById("view-dashboard"),
    viewHistory: document.getElementById("view-history"),

    // Status Koneksi
    btnOpenSettings: document.getElementById("btn-open-settings"),
    syncIndicator: document.getElementById("sync-indicator"),
    syncText: document.getElementById("sync-text"),

    // Dashboard Summary
    netBalance: document.getElementById("summary-net-balance"),
    totalIncome: document.getElementById("summary-total-income"),
    totalExpense: document.getElementById("summary-total-expense"),
    periodText: document.getElementById("summary-period-text"),
    periodButtons: document.querySelectorAll(".filter-pill[data-period]"),

    // Insights
    topExpense: document.getElementById("insight-top-expense"),
    dailyAverage: document.getElementById("insight-daily-average"),

    // Charts & States
    chartCategoryCanvas: document.getElementById("chart-category-donut"),
    chartComparisonCanvas: document.getElementById("chart-comparison-bar"),
    chartDonutEmpty: document.getElementById("chart-donut-empty"),
    chartBarEmpty: document.getElementById("chart-bar-empty"),

    // Riwayat
    inputSearch: document.getElementById("input-search"),
    historyTypeButtons: document.querySelectorAll(".filter-pill[data-history-type]"),
    transactionsContainer: document.getElementById("transactions-container"),
    historyStateBox: document.getElementById("history-state-box"),
    historyStateTitle: document.getElementById("history-state-title"),
    historyStateDesc: document.getElementById("history-state-desc"),
    btnRetryFetch: document.getElementById("btn-retry-fetch"),

    // Modal Form Transaksi
    modalTx: document.getElementById("modal-transaction"),
    modalTxTitle: document.getElementById("modal-tx-title"),
    btnCloseTxModal: document.getElementById("btn-close-tx-modal"),
    formTx: document.getElementById("form-transaction"),
    toggleTypeExpense: document.getElementById("toggle-type-expense"),
    toggleTypeIncome: document.getElementById("toggle-type-income"),
    inputNominal: document.getElementById("input-nominal"),
    selectCategory: document.getElementById("select-category"),
    groupSource: document.getElementById("group-source"),
    inputSource: document.getElementById("input-source"),
    inputDate: document.getElementById("input-date"),
    inputNote: document.getElementById("input-note"),
    btnSubmitTx: document.getElementById("btn-submit-tx"),

    // Modal Detail
    modalDetail: document.getElementById("modal-detail"),
    btnCloseDetailModal: document.getElementById("btn-close-detail-modal"),
    detailType: document.getElementById("detail-type"),
    detailAmount: document.getElementById("detail-amount"),
    detailCategory: document.getElementById("detail-category"),
    detailRowSource: document.getElementById("detail-row-source"),
    detailSource: document.getElementById("detail-source"),
    detailDate: document.getElementById("detail-date"),
    detailNote: document.getElementById("detail-note"),
    btnEditFromDetail: document.getElementById("btn-edit-from-detail"),
    btnDeleteFromDetail: document.getElementById("btn-delete-from-detail"),

    // Modal Hapus
    modalConfirmDelete: document.getElementById("modal-confirm-delete"),
    btnCloseDelModal: document.getElementById("btn-close-del-modal"),
    btnCancelDelete: document.getElementById("btn-cancel-delete"),
    btnConfirmDelete: document.getElementById("btn-confirm-delete"),

    // Modal Pengaturan
    modalSettings: document.getElementById("modal-settings"),
    btnCloseSettingsModal: document.getElementById("btn-close-settings-modal"),
    formSettings: document.getElementById("form-settings"),
    settingsScriptUrl: document.getElementById("settings-script-url"),
    settingsSecretToken: document.getElementById("settings-secret-token"),

    // Toast
    toastContainer: document.getElementById("toast-container")
  };

  /**
   * Helper Format Rupiah
   */
  function formatRupiah(number) {
    const val = Math.round(Number(number) || 0);
    return "Rp " + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  /**
   * Parse angka bersih dari string input Rupiah
   */
  function parseRupiahInput(str) {
    return Number(String(str).replace(/[^0-9]/g, "")) || 0;
  }

  /**
   * Helper format tanggal ke DD/MM/YYYY
   */
  function formatDateForSheet(dateObj) {
    const d = ("0" + dateObj.getDate()).slice(-2);
    const m = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
  }

  /**
   * Parse fleksibel dari string atau Date object
   */
  function parseSheetDate(strDate) {
    if (!strDate) return new Date();
    if (strDate instanceof Date) return strDate;
    const str = String(strDate).trim();

    // Jika format DD/MM/YYYY
    const parts = str.split("/");
    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const year = Number(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    // Format standar atau ISO
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  /**
   * Format tampilan tanggal yang rapi dan elegan (contoh: "16 Nov 2026")
   */
  function formatDisplayDate(dateInput) {
    const d = parseSheetDate(dateInput);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const day = ("0" + d.getDate()).slice(-2);
    const month = months[d.getMonth()] || "";
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  /**
   * Format Date Object ke YYYY-MM-DD untuk input HTML date
   */
  function toInputDateString(dateObj) {
    const y = dateObj.getFullYear();
    const m = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    const d = ("0" + dateObj.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }

  /**
   * Tampilkan Toast Notifikasi
   */
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span aria-hidden="true">${type === "success" ? "✓" : "!"}</span>
      <span>${message}</span>
    `;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      toast.style.transition = "all 0.25s ease";
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  /**
   * Update Status Koneksi di Header
   */
  function updateConnectionBadge() {
    if (!API.isConfigured()) {
      DOM.syncIndicator.className = "sync-dot offline";
      DOM.syncText.textContent = "Atur URL";
    } else {
      DOM.syncIndicator.className = "sync-dot";
      DOM.syncText.textContent = "Tersambung";
    }
  }

  /**
   * Buka / Tutup Modal Sheet
   */
  function openModal(modalEl) {
    modalEl.classList.add("active");
  }

  function closeModal(modalEl) {
    modalEl.classList.remove("active");
  }

  /**
   * Populasi Kategori Dropdown berdasarkan Jenis Transaksi
   */
  function populateCategories(type, selectedCategory = "") {
    DOM.selectCategory.innerHTML = "";
    const list = type === "Pemasukan" ? APP_CONFIG.INCOME_CATEGORIES : APP_CONFIG.EXPENSE_CATEGORIES;

    list.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      if (cat === selectedCategory) {
        option.selected = true;
      }
      DOM.selectCategory.appendChild(option);
    });
  }

  /**
   * Ganti Tab Transaksi di Modal Form (Pemasukan / Pengeluaran)
   */
  function setTransactionFormType(type) {
    state.editingType = type;
    if (type === "Pengeluaran") {
      DOM.toggleTypeExpense.classList.add("active");
      DOM.toggleTypeIncome.classList.remove("active");
      DOM.groupSource.style.display = "none";
      populateCategories("Pengeluaran");
    } else {
      DOM.toggleTypeIncome.classList.add("active");
      DOM.toggleTypeExpense.classList.remove("active");
      DOM.groupSource.style.display = "block";
      populateCategories("Pemasukan");
    }
  }

  /**
   * Buka Modal Tambah Transaksi Cepat (< 10 detik flow)
   */
  function openQuickAddModal() {
    state.isEditing = false;
    state.editingRowIndex = null;
    DOM.modalTxTitle.textContent = "Tambah Transaksi";
    DOM.btnSubmitTx.querySelector("span").textContent = "Simpan Transaksi";

    // Reset Form
    DOM.inputNominal.value = "";
    DOM.inputNote.value = "";
    DOM.inputSource.value = "";
    DOM.inputDate.value = toInputDateString(new Date());

    setTransactionFormType("Pengeluaran");
    openModal(DOM.modalTx);

    // Auto focus nominal input
    setTimeout(() => {
      DOM.inputNominal.focus();
    }, 150);
  }

  /**
   * Switch View (Dashboard vs Riwayat)
   */
  function switchView(viewName) {
    if (viewName === "dashboard") {
      DOM.viewDashboard.style.display = "block";
      DOM.viewHistory.style.display = "none";
      DOM.navTabDashboard.classList.add("active");
      DOM.navTabHistory.classList.remove("active");
      renderDashboard();
    } else {
      DOM.viewDashboard.style.display = "none";
      DOM.viewHistory.style.display = "block";
      DOM.navTabHistory.classList.add("active");
      DOM.navTabDashboard.classList.remove("active");
      renderHistoryList();
    }
  }

  /**
   * Filter Transaksi Berdasarkan Periode Terpilih
   */
  function getFilteredTransactionsByPeriod() {
    const now = new Date();
    const period = state.selectedPeriod;

    return state.transactions.filter((item) => {
      const itemDate = parseSheetDate(item.date);

      if (period === "today") {
        return (
          itemDate.getDate() === now.getDate() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );
      }

      if (period === "this-week") {
        // Ambil hari Senin minggu ini
        const day = now.getDay() || 7; // 1 = Senin, 7 = Minggu
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + 1);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return itemDate >= monday && itemDate <= sunday;
      }

      if (period === "this-month") {
        return (
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );
      }

      // 'all'
      return true;
    });
  }

  /**
   * Render Tampilan Dashboard & Visualisasi Chart.js
   */
  function renderDashboard() {
    const filtered = getFilteredTransactionsByPeriod();

    let totalInc = 0;
    let totalExp = 0;
    const categoryTotals = {};

    filtered.forEach((tx) => {
      if (tx.type === "Pemasukan") {
        totalInc += Number(tx.amount) || 0;
      } else {
        const amt = Number(tx.amount) || 0;
        totalExp += amt;
        const cat = tx.category || "Lain-lain";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      }
    });

    const netBal = totalInc - totalExp;

    // Update Angka Summary
    DOM.netBalance.textContent = formatRupiah(netBal);
    DOM.totalIncome.textContent = formatRupiah(totalInc);
    DOM.totalExpense.textContent = formatRupiah(totalExp);

    // Update Label Periode
    const periodLabels = {
      "today": "Hari Ini",
      "this-week": "Minggu Ini",
      "this-month": "Bulan Ini",
      "all": "Semua Waktu"
    };
    DOM.periodText.textContent = `Periode: ${periodLabels[state.selectedPeriod] || "Bulan Ini"}`;

    // Update Insights
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
      DOM.topExpense.textContent = `${sortedCategories[0][0]} (${formatRupiah(sortedCategories[0][1])})`;
    } else {
      DOM.topExpense.textContent = "Belum ada pengeluaran";
    }

    // Rata-rata harian
    const now = new Date();
    let divisor = 1;
    if (state.selectedPeriod === "this-month") {
      divisor = Math.max(1, now.getDate());
    } else if (state.selectedPeriod === "this-week") {
      divisor = Math.max(1, now.getDay() || 7);
    } else if (state.selectedPeriod === "today") {
      divisor = 1;
    } else {
      divisor = 30;
    }
    const avgDaily = Math.round(totalExp / divisor);
    DOM.dailyAverage.textContent = totalExp > 0 ? `${formatRupiah(avgDaily)} / hari` : "Rp 0 / hari";

    // Render Charts
    renderCategoryDonut(categoryTotals, totalExp);
    renderComparisonBar(totalInc, totalExp);
  }

  /**
   * Chart 1: Donut Kategori Pengeluaran
   */
  function renderCategoryDonut(categoryTotals, totalExp) {
    if (state.chartDonut) {
      state.chartDonut.destroy();
      state.chartDonut = null;
    }

    const labels = Object.keys(categoryTotals);
    const dataValues = Object.values(categoryTotals);

    if (labels.length === 0 || totalExp === 0) {
      DOM.chartCategoryCanvas.style.display = "none";
      DOM.chartDonutEmpty.style.display = "flex";
      return;
    }

    DOM.chartCategoryCanvas.style.display = "block";
    DOM.chartDonutEmpty.style.display = "none";

    // Palette elegan soft pink, coral, sage, amber
    const palette = [
      "#E8829A", "#F2B5C5", "#E5A99B", "#F6D2C9", 
      "#C5A3B8", "#A3C4BC", "#BFD8D2", "#DFCCF1"
    ];

    const ctx = DOM.chartCategoryCanvas.getContext("2d");
    state.chartDonut = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: palette.slice(0, labels.length),
          borderWidth: 2,
          borderColor: "#FFFFFF"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              font: { family: "Plus Jakarta Sans", size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const val = context.raw || 0;
                const pct = ((val / totalExp) * 100).toFixed(1);
                return ` ${context.label}: ${formatRupiah(val)} (${pct}%)`;
              }
            }
          }
        },
        cutout: "68%"
      }
    });
  }

  /**
   * Chart 2: Perbandingan Pemasukan vs Pengeluaran (Bar)
   */
  function renderComparisonBar(income, expense) {
    if (state.chartBar) {
      state.chartBar.destroy();
      state.chartBar = null;
    }

    if (income === 0 && expense === 0) {
      DOM.chartComparisonCanvas.style.display = "none";
      DOM.chartBarEmpty.style.display = "flex";
      return;
    }

    DOM.chartComparisonCanvas.style.display = "block";
    DOM.chartBarEmpty.style.display = "none";

    const ctx = DOM.chartComparisonCanvas.getContext("2d");
    state.chartBar = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Pemasukan", "Pengeluaran"],
        datasets: [{
          data: [income, expense],
          backgroundColor: ["#16A34A", "#E8829A"],
          borderRadius: 8,
          maxBarThickness: 48
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return " " + formatRupiah(ctx.raw);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (val) {
                if (val >= 1000000) return (val / 1000000) + "jt";
                if (val >= 1000) return (val / 1000) + "rb";
                return val;
              },
              font: { family: "Plus Jakarta Sans", size: 11 }
            },
            grid: { color: "#F3F4F6" }
          },
          x: {
            grid: { display: false },
            font: { family: "Plus Jakarta Sans", size: 12, weight: 600 }
          }
        }
      }
    });
  }

  /**
   * Render Riwayat Transaksi
   */
  function renderHistoryList() {
    DOM.transactionsContainer.innerHTML = "";

    let list = [...state.transactions];

    // Filter Jenis
    if (state.historyTypeFilter !== "all") {
      list = list.filter((item) => item.type === state.historyTypeFilter);
    }

    // Filter Pencarian
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter((item) => 
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q)) ||
        (item.source && item.source.toLowerCase().includes(q))
      );
    }

    // Urutkan dari baris terbaru
    list.sort((a, b) => {
      const dateA = parseSheetDate(a.date);
      const dateB = parseSheetDate(b.date);
      return dateB - dateA;
    });

    if (list.length === 0) {
      DOM.historyStateBox.style.display = "flex";
      DOM.btnRetryFetch.style.display = "none";
      if (state.searchQuery.trim()) {
        DOM.historyStateTitle.textContent = "Tidak Ditemukan";
        DOM.historyStateDesc.textContent = "Tidak ada transaksi yang cocok dengan kata kunci pencarian Anda.";
      } else {
        DOM.historyStateTitle.textContent = "Belum Ada Transaksi";
        DOM.historyStateDesc.textContent = "Tekan tombol (+) untuk mencatat transaksi pertama Anda.";
      }
      return;
    }

    DOM.historyStateBox.style.display = "none";

    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "transaction-card";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${item.type} ${item.category} sebesar ${formatRupiah(item.amount)}`);

      const isInc = item.type === "Pemasukan";
      const badgeIcon = isInc ? "↓" : "↑";

      card.innerHTML = `
        <div class="transaction-left">
          <div class="transaction-type-badge ${isInc ? "income" : "expense"}" aria-hidden="true">
            <span style="font-weight: 800; font-size: 1.1rem;">${badgeIcon}</span>
          </div>
          <div class="transaction-details">
            <span class="transaction-category">${item.category}</span>
            <div class="transaction-meta">
              <span>${formatDisplayDate(item.date)}</span>
              ${item.note ? `<span>• ${item.note}</span>` : ""}
            </div>
          </div>
        </div>
        <div class="transaction-right">
          <span class="transaction-amount ${isInc ? "income" : "expense"}">
            ${isInc ? "+" : "-"} ${formatRupiah(item.amount)}
          </span>
        </div>
      `;

      card.addEventListener("click", () => openDetailModal(item));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetailModal(item);
        }
      });

      DOM.transactionsContainer.appendChild(card);
    });
  }

  /**
   * Buka Modal Detail Transaksi
   */
  function openDetailModal(item) {
    state.activeTransaction = item;

    DOM.detailType.textContent = item.type;
    DOM.detailAmount.textContent = formatRupiah(item.amount);
    DOM.detailCategory.textContent = item.category;
    DOM.detailDate.textContent = formatDisplayDate(item.date);
    DOM.detailNote.textContent = item.note || "-";

    if (item.type === "Pemasukan" && item.source) {
      DOM.detailRowSource.style.display = "flex";
      DOM.detailSource.textContent = item.source;
    } else {
      DOM.detailRowSource.style.display = "none";
    }

    openModal(DOM.modalDetail);
  }

  /**
   * Buka Modal Edit dari Detail
   */
  function openEditModal() {
    closeModal(DOM.modalDetail);

    const item = state.activeTransaction;
    if (!item) return;

    state.isEditing = true;
    state.editingRowIndex = item.rowIndex;
    state.editingType = item.type;

    DOM.modalTxTitle.textContent = "Edit Transaksi";
    DOM.btnSubmitTx.querySelector("span").textContent = "Simpan Perubahan";

    setTransactionFormType(item.type);
    DOM.inputNominal.value = formatRupiah(item.amount).replace("Rp ", "");
    populateCategories(item.type, item.category);
    DOM.inputDate.value = toInputDateString(parseSheetDate(item.date));
    DOM.inputNote.value = item.note || "";
    if (item.source) DOM.inputSource.value = item.source;

    openModal(DOM.modalTx);
  }

  /**
   * Fetch Data dari Spreadsheet
   */
  async function loadData() {
    if (!API.isConfigured()) {
      updateConnectionBadge();
      DOM.historyStateBox.style.display = "flex";
      DOM.historyStateTitle.textContent = "Koneksi Belum Diatur";
      DOM.historyStateDesc.textContent = "Buka Pengaturan untuk memasukkan Web App URL dari Google Apps Script.";
      DOM.btnRetryFetch.style.display = "inline-block";
      DOM.btnRetryFetch.textContent = "Buka Pengaturan";
      DOM.btnRetryFetch.onclick = () => openModal(DOM.modalSettings);
      return;
    }

    DOM.syncIndicator.className = "sync-dot syncing";
    DOM.syncText.textContent = "Menyinkronkan...";

    try {
      const data = await API.fetchTransactions();
      state.transactions = data.transactions || [];
      updateConnectionBadge();
      renderDashboard();
      renderHistoryList();
    } catch (error) {
      DOM.syncIndicator.className = "sync-dot offline";
      DOM.syncText.textContent = "Gagal";
      showToast(error.message || "Gagal memuat data dari Spreadsheet", "error");

      DOM.historyStateBox.style.display = "flex";
      DOM.historyStateTitle.textContent = "Gagal Memuat Data";
      DOM.historyStateDesc.textContent = error.message || "Pastikan URL Google Script sudah benar.";
      DOM.btnRetryFetch.style.display = "inline-block";
      DOM.btnRetryFetch.textContent = "Coba Lagi";
      DOM.btnRetryFetch.onclick = loadData;
    }
  }

  /**
   * Inisialisasi Event Listeners
   */
  function initEvents() {
    // 1. Navigasi Bottom
    DOM.navTabDashboard.addEventListener("click", () => switchView("dashboard"));
    DOM.navTabHistory.addEventListener("click", () => switchView("history"));
    DOM.navBtnAddQuick.addEventListener("click", openQuickAddModal);

    // 2. Filter Periode di Dashboard
    DOM.periodButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        DOM.periodButtons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        state.selectedPeriod = btn.dataset.period;
        renderDashboard();
      });
    });

    // 3. Search & Filter di Riwayat
    DOM.inputSearch.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderHistoryList();
    });

    DOM.historyTypeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        DOM.historyTypeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.historyTypeFilter = btn.dataset.historyType;
        renderHistoryList();
      });
    });

    // 4. Modal Form Toggle Pemasukan / Pengeluaran
    DOM.toggleTypeExpense.addEventListener("click", () => setTransactionFormType("Pengeluaran"));
    DOM.toggleTypeIncome.addEventListener("click", () => setTransactionFormType("Pemasukan"));

    // 5. Input Nominal Formatting Mask
    DOM.inputNominal.addEventListener("input", (e) => {
      const rawNum = parseRupiahInput(e.target.value);
      if (rawNum === 0) {
        e.target.value = "";
      } else {
        e.target.value = rawNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
    });

    // 6. Form Submit (Tambah / Edit Transaksi)
    DOM.formTx.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nominal = parseRupiahInput(DOM.inputNominal.value);
      if (nominal <= 0) {
        showToast("Nominal transaksi harus lebih dari 0", "error");
        DOM.inputNominal.focus();
        return;
      }

      const category = DOM.selectCategory.value;
      const dateVal = DOM.inputDate.value;
      if (!dateVal) {
        showToast("Pilih tanggal transaksi", "error");
        return;
      }

      const formattedDate = formatDateForSheet(new Date(dateVal));
      const note = DOM.inputNote.value.trim();
      const source = DOM.inputSource.value.trim();
      const type = state.editingType;

      // Disable button saat proses kirim
      DOM.btnSubmitTx.disabled = true;
      DOM.btnSubmitTx.querySelector("span").textContent = "Menyimpan...";

      try {
        if (state.isEditing) {
          await API.updateTransaction(type, state.editingRowIndex, {
            date: formattedDate,
            amount: nominal,
            category: category,
            note: note,
            source: source
          });
          showToast("Transaksi berhasil diperbarui!", "success");
        } else {
          await API.addTransaction({
            type: type,
            date: formattedDate,
            amount: nominal,
            category: category,
            note: note,
            source: source
          });
          showToast("Transaksi berhasil disimpan!", "success");
        }

        closeModal(DOM.modalTx);
        await loadData();
      } catch (err) {
        showToast(err.message || "Gagal menyimpan transaksi", "error");
      } finally {
        DOM.btnSubmitTx.disabled = false;
        DOM.btnSubmitTx.querySelector("span").textContent = state.isEditing ? "Simpan Perubahan" : "Simpan Transaksi";
      }
    });

    // 7. Tutup Modal
    DOM.btnCloseTxModal.addEventListener("click", () => closeModal(DOM.modalTx));
    DOM.btnCloseDetailModal.addEventListener("click", () => closeModal(DOM.modalDetail));
    DOM.btnCloseDelModal.addEventListener("click", () => closeModal(DOM.modalConfirmDelete));
    DOM.btnCancelDelete.addEventListener("click", () => closeModal(DOM.modalConfirmDelete));
    DOM.btnCloseSettingsModal.addEventListener("click", () => closeModal(DOM.modalSettings));

    // Klik luar modal sheet untuk menutup
    [DOM.modalTx, DOM.modalDetail, DOM.modalConfirmDelete, DOM.modalSettings].forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    // 8. Edit & Delete Action dari Detail Modal
    DOM.btnEditFromDetail.addEventListener("click", openEditModal);
    DOM.btnDeleteFromDetail.addEventListener("click", () => {
      closeModal(DOM.modalDetail);
      openModal(DOM.modalConfirmDelete);
    });

    // 9. Konfirmasi Hapus Transaksi
    DOM.btnConfirmDelete.addEventListener("click", async () => {
      const item = state.activeTransaction;
      if (!item) return;

      DOM.btnConfirmDelete.disabled = true;
      DOM.btnConfirmDelete.textContent = "Menghapus...";

      try {
        await API.deleteTransaction(item.type, item.rowIndex);
        showToast("Transaksi berhasil dihapus dari Sheet", "success");
        closeModal(DOM.modalConfirmDelete);
        await loadData();
      } catch (err) {
        showToast(err.message || "Gagal menghapus transaksi", "error");
      } finally {
        DOM.btnConfirmDelete.disabled = false;
        DOM.btnConfirmDelete.textContent = "Ya, Hapus";
      }
    });

    // 10. Pengaturan Koneksi
    DOM.btnOpenSettings.addEventListener("click", () => {
      DOM.settingsScriptUrl.value = APP_CONFIG.getScriptUrl();
      DOM.settingsSecretToken.value = APP_CONFIG.getSecretToken();
      openModal(DOM.modalSettings);
    });

    DOM.formSettings.addEventListener("submit", async (e) => {
      e.preventDefault();
      const url = DOM.settingsScriptUrl.value.trim();
      const token = DOM.settingsSecretToken.value.trim();

      APP_CONFIG.saveCredentials(url, token);
      closeModal(DOM.modalSettings);
      showToast("Pengaturan disimpan. Menghubungkan...", "success");
      await loadData();
    });

    // Tutup modal dengan tombol Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal(DOM.modalTx);
        closeModal(DOM.modalDetail);
        closeModal(DOM.modalConfirmDelete);
        closeModal(DOM.modalSettings);
      }
    });
  }

  /**
   * Registrasi Service Worker untuk PWA
   */
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").then(
          (reg) => console.log("Service Worker terdaftar dengan scope:", reg.scope),
          (err) => console.log("Service Worker gagal didaftarkan:", err)
        );
      });
    }
  }

  /**
   * Bootstrapping Aplikasi
   */
  function init() {
    initEvents();
    registerServiceWorker();
    loadData();
  }

  // Jalankan saat DOM siap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
