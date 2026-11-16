/**
 * Catatan Keuangan Pribadi - Application Controller
 * Mendukung Multi-Wallet, Pindah Dana (Transfer), dan Kategori Dinamis
 */

(function () {
  "use strict";

  // State Aplikasi
  const state = {
    transactions: [],
    wallets: [],
    categories: [],
    transfers: [],
    selectedPeriod: "this-month",
    historyTypeFilter: "all",
    searchQuery: "",
    activeTransaction: null,
    isEditing: false,
    editingType: "Pengeluaran",
    editingRowIndex: null,
    editingWallet: null,
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

    // Wallets Carousel
    walletsCarousel: document.getElementById("wallets-carousel"),
    btnTriggerAddWallet: document.getElementById("btn-trigger-add-wallet"),

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
    toggleTypeTransfer: document.getElementById("toggle-type-transfer"),
    inputNominal: document.getElementById("input-nominal"),
    
    groupCategory: document.getElementById("group-category"),
    selectCategory: document.getElementById("select-category"),
    btnTriggerAddCategory: document.getElementById("btn-trigger-add-category"),

    groupSingleWallet: document.getElementById("group-single-wallet"),
    labelSingleWallet: document.getElementById("label-single-wallet"),
    selectWallet: document.getElementById("select-wallet"),

    groupTransferWallets: document.getElementById("group-transfer-wallets"),
    selectTransferFrom: document.getElementById("select-transfer-from"),
    selectTransferTo: document.getElementById("select-transfer-to"),

    inputDate: document.getElementById("input-date"),
    inputNote: document.getElementById("input-note"),
    btnSubmitTx: document.getElementById("btn-submit-tx"),

    // Modal Detail
    modalDetail: document.getElementById("modal-detail"),
    btnCloseDetailModal: document.getElementById("btn-close-detail-modal"),
    detailType: document.getElementById("detail-type"),
    detailAmount: document.getElementById("detail-amount"),
    detailRowCategory: document.getElementById("detail-row-category"),
    detailCategory: document.getElementById("detail-category"),
    detailRowWallet: document.getElementById("detail-row-wallet"),
    detailLabelWallet: document.getElementById("detail-label-wallet"),
    detailWallet: document.getElementById("detail-wallet"),
    detailDate: document.getElementById("detail-date"),
    detailNote: document.getElementById("detail-note"),
    btnEditFromDetail: document.getElementById("btn-edit-from-detail"),
    btnDeleteFromDetail: document.getElementById("btn-delete-from-detail"),

    // Modal Tambah Dompet
    modalAddWallet: document.getElementById("modal-add-wallet"),
    btnCloseAddWallet: document.getElementById("btn-close-add-wallet"),
    formAddWallet: document.getElementById("form-add-wallet"),
    inputWalletName: document.getElementById("input-wallet-name"),
    inputWalletInitial: document.getElementById("input-wallet-initial"),
    btnSubmitWallet: document.getElementById("btn-submit-wallet"),

    // Modal Edit Dompet (Atur Saldo Awal)
    modalEditWallet: document.getElementById("modal-edit-wallet"),
    btnCloseEditWallet: document.getElementById("btn-close-edit-wallet"),
    formEditWallet: document.getElementById("form-edit-wallet"),
    editWalletName: document.getElementById("edit-wallet-name"),
    editWalletInitial: document.getElementById("edit-wallet-initial"),
    btnSubmitEditWallet: document.getElementById("btn-submit-edit-wallet"),

    // Modal Tambah Kategori
    modalAddCategory: document.getElementById("modal-add-category"),
    btnCloseAddCat: document.getElementById("btn-close-add-cat"),
    formAddCategory: document.getElementById("form-add-category"),
    selectCatType: document.getElementById("select-cat-type"),
    inputCategoryName: document.getElementById("input-category-name"),
    btnSubmitCategory: document.getElementById("btn-submit-category"),

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
    const num = Math.round(Number(number) || 0);
    const isNegative = num < 0;
    const abs = Math.abs(num);
    const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (isNegative ? "-Rp " : "Rp ") + formatted;
  }

  function parseRupiahInput(str) {
    if (!str) return 0;
    const isNeg = String(str).trim().startsWith("-");
    const num = Number(String(str).replace(/[^0-9]/g, "")) || 0;
    return isNeg ? -num : num;
  }

  function formatDateForSheet(dateObj) {
    const d = ("0" + dateObj.getDate()).slice(-2);
    const m = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
  }

  function parseSheetDate(strDate) {
    if (!strDate) return new Date();
    if (strDate instanceof Date) return strDate;
    const str = String(strDate).trim();

    const parts = str.split("/");
    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const year = Number(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  function formatDisplayDate(dateInput) {
    const d = parseSheetDate(dateInput);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const day = ("0" + d.getDate()).slice(-2);
    const month = months[d.getMonth()] || "";
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function toInputDateString(dateObj) {
    const y = dateObj.getFullYear();
    const m = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    const d = ("0" + dateObj.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }

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
    }, 3200);
  }

  function updateConnectionBadge() {
    if (!API.isConfigured()) {
      DOM.syncIndicator.className = "sync-dot offline";
      DOM.syncText.textContent = "Atur URL";
    } else {
      DOM.syncIndicator.className = "sync-dot";
      DOM.syncText.textContent = "Tersambung";
    }
  }

  function openModal(modalEl) {
    modalEl.classList.add("active");
  }

  function closeModal(modalEl) {
    modalEl.classList.remove("active");
  }

  /**
   * Mengambil daftar kategori aktif berdasarkan jenis
   */
  function getActiveCategories(type) {
    const fromBackend = state.categories
      .filter((c) => c.type === type)
      .map((c) => c.name);

    if (fromBackend.length > 0) return fromBackend;

    return type === "Pemasukan"
      ? APP_CONFIG.DEFAULT_INCOME_CATEGORIES
      : APP_CONFIG.DEFAULT_EXPENSE_CATEGORIES;
  }

  /**
   * Mengambil daftar dompet aktif
   */
  function getActiveWallets() {
    if (state.wallets && state.wallets.length > 0) {
      return state.wallets;
    }
    return APP_CONFIG.DEFAULT_WALLETS;
  }

  /**
   * Populasi Dropdown Kategori
   */
  function populateCategories(type, selectedCategory = "") {
    DOM.selectCategory.innerHTML = "";
    const list = getActiveCategories(type);

    list.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      if (cat === selectedCategory) option.selected = true;
      DOM.selectCategory.appendChild(option);
    });
  }

  /**
   * Populasi Dropdown Dompet (Single & Transfer)
   */
  function populateWalletDropdowns(selectedWallet = "", fromVal = "", toVal = "") {
    const wallets = getActiveWallets();

    // Single Wallet Dropdown
    DOM.selectWallet.innerHTML = "";
    wallets.forEach((w) => {
      const opt = document.createElement("option");
      opt.value = w.name;
      opt.textContent = `${w.name} (${formatRupiah(w.currentBalance || 0)})`;
      if (w.name === selectedWallet) opt.selected = true;
      DOM.selectWallet.appendChild(opt);
    });

    // Transfer From Dropdown
    DOM.selectTransferFrom.innerHTML = "";
    wallets.forEach((w) => {
      const opt = document.createElement("option");
      opt.value = w.name;
      opt.textContent = `${w.name} (${formatRupiah(w.currentBalance || 0)})`;
      if (w.name === fromVal) opt.selected = true;
      DOM.selectTransferFrom.appendChild(opt);
    });

    // Transfer To Dropdown
    DOM.selectTransferTo.innerHTML = "";
    wallets.forEach((w, idx) => {
      const opt = document.createElement("option");
      opt.value = w.name;
      opt.textContent = `${w.name} (${formatRupiah(w.currentBalance || 0)})`;
      // Default to wallet different from 'from'
      if (toVal ? w.name === toVal : idx === 1) opt.selected = true;
      DOM.selectTransferTo.appendChild(opt);
    });
  }

  /**
   * Mengatur Tampilan Formulir Sesuai Jenis Transaksi
   */
  function setTransactionFormType(type) {
    state.editingType = type;

    // Reset tombol tab
    DOM.toggleTypeExpense.className = "type-toggle-btn expense";
    DOM.toggleTypeIncome.className = "type-toggle-btn income";
    DOM.toggleTypeTransfer.className = "type-toggle-btn transfer";

    if (type === "Pengeluaran") {
      DOM.toggleTypeExpense.classList.add("active");
      DOM.groupCategory.style.display = "block";
      DOM.groupSingleWallet.style.display = "block";
      DOM.labelSingleWallet.textContent = "Sumber Dompet (Keluar dari)";
      DOM.groupTransferWallets.style.display = "none";
      populateCategories("Pengeluaran");
      populateWalletDropdowns();
    } else if (type === "Pemasukan") {
      DOM.toggleTypeIncome.classList.add("active");
      DOM.groupCategory.style.display = "block";
      DOM.groupSingleWallet.style.display = "block";
      DOM.labelSingleWallet.textContent = "Dompet Tujuan (Masuk ke)";
      DOM.groupTransferWallets.style.display = "none";
      populateCategories("Pemasukan");
      populateWalletDropdowns();
    } else {
      // Pindah Dana (Transfer)
      DOM.toggleTypeTransfer.classList.add("active");
      DOM.groupCategory.style.display = "none";
      DOM.groupSingleWallet.style.display = "none";
      DOM.groupTransferWallets.style.display = "block";
      populateWalletDropdowns();
    }
  }

  function openQuickAddModal() {
    state.isEditing = false;
    state.editingRowIndex = null;
    DOM.modalTxTitle.textContent = "Tambah Transaksi";
    DOM.btnSubmitTx.querySelector("span").textContent = "Simpan Transaksi";

    DOM.inputNominal.value = "";
    DOM.inputNote.value = "";
    DOM.inputDate.value = toInputDateString(new Date());

    setTransactionFormType("Pengeluaran");
    openModal(DOM.modalTx);

    setTimeout(() => DOM.inputNominal.focus(), 150);
  }

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
   * Menghitung Saldo Setiap Dompet Secara Presisi
   */
  function calculateWalletBalances() {
    const walletMap = {};

    // 1. Inisialisasi dari saldo awal
    const wallets = getActiveWallets();
    wallets.forEach((w) => {
      walletMap[w.name] = Number(w.initialBalance) || 0;
    });

    // 2. Kalkulasi dari seluruh transaksi
    state.transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;

      if (tx.type === "Pemasukan") {
        const wName = tx.wallet || tx.source || "Cash";
        walletMap[wName] = (walletMap[wName] || 0) + amt;
      } else if (tx.type === "Pengeluaran") {
        const wName = tx.wallet || tx.source || "Cash";
        walletMap[wName] = (walletMap[wName] || 0) - amt;
      } else if (tx.type === "Transfer") {
        const fromW = tx.fromWallet || "Cash";
        const toW = tx.toWallet || "Bank 1";
        walletMap[fromW] = (walletMap[fromW] || 0) - amt;
        walletMap[toW] = (walletMap[toW] || 0) + amt;
      }
    });

    // Pasang saldo terhitung ke state.wallets
    state.wallets = wallets.map((w) => ({
      ...w,
      currentBalance: walletMap[w.name] || 0
    }));

    return walletMap;
  }

  /**
   * Render Carousel Dompet di Dashboard
   */
  function renderWalletsCarousel() {
    DOM.walletsCarousel.innerHTML = "";

    state.wallets.forEach((w) => {
      const card = document.createElement("div");
      card.className = "wallet-card";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Dompet ${w.name}: ${formatRupiah(w.currentBalance)}`);

      // Tentukan inisial ikon
      let iconText = "💰";
      const lower = w.name.toLowerCase();
      if (lower.includes("bank") || lower.includes("bca") || lower.includes("mandiri") || lower.includes("bni")) {
        iconText = "🏦";
      } else if (lower.includes("gopay") || lower.includes("shopee") || lower.includes("dana") || lower.includes("ovo")) {
        iconText = "📱";
      } else if (lower.includes("cash") || lower.includes("tunai")) {
        iconText = "💵";
      }

      card.innerHTML = `
        <div class="wallet-card-header">
          <div class="wallet-card-icon" aria-hidden="true">${iconText}</div>
          <span class="wallet-card-name">${w.name}</span>
        </div>
        <div class="wallet-card-balance" style="${w.currentBalance < 0 ? 'color: var(--color-expense);' : ''}">${formatRupiah(w.currentBalance)}</div>
      `;

      // Klik kartu dompet untuk mengatur nama atau saldo awal
      card.addEventListener("click", () => {
        state.editingWallet = w;
        DOM.editWalletName.value = w.name;
        const initial = w.initialBalance || 0;
        DOM.editWalletInitial.value = (initial < 0 ? "-" : "") + Math.abs(initial).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        openModal(DOM.modalEditWallet);
        setTimeout(() => DOM.editWalletInitial.focus(), 150);
      });

      DOM.walletsCarousel.appendChild(card);
    });
  }

  /**
   * Filter Transaksi Berdasarkan Periode
   */
  function getFilteredTransactionsByPeriod() {
    const now = new Date();
    const period = state.selectedPeriod;

    return state.transactions.filter((item) => {
      // Transfer tidak dihitung dalam grafik pemasukan/pengeluaran bulanan
      if (item.type === "Transfer") return false;

      const itemDate = parseSheetDate(item.date);

      if (period === "today") {
        return (
          itemDate.getDate() === now.getDate() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );
      }

      if (period === "this-week") {
        const day = now.getDay() || 7;
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

      return true;
    });
  }

  /**
   * Render Dashboard
   */
  function renderDashboard() {
    calculateWalletBalances();
    renderWalletsCarousel();

    // Total Saldo Bersih Global = jumlah seluruh saldo dompet saat ini
    const totalGlobalNetBalance = state.wallets.reduce((acc, w) => acc + (w.currentBalance || 0), 0);
    DOM.netBalance.textContent = formatRupiah(totalGlobalNetBalance);

    // Filter transaksi untuk ringkasan periode
    const filtered = getFilteredTransactionsByPeriod();

    let totalInc = 0;
    let totalExp = 0;
    const categoryTotals = {};

    filtered.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "Pemasukan") {
        totalInc += amt;
      } else if (tx.type === "Pengeluaran") {
        totalExp += amt;
        const cat = tx.category || "Lain-lain";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      }
    });

    DOM.totalIncome.textContent = formatRupiah(totalInc);
    DOM.totalExpense.textContent = formatRupiah(totalExp);

    const periodLabels = {
      today: "Hari Ini",
      "this-week": "Minggu Ini",
      "this-month": "Bulan Ini",
      all: "Semua Waktu"
    };
    DOM.periodText.textContent = `Periode: ${periodLabels[state.selectedPeriod] || "Bulan Ini"}`;

    // Insights
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
      DOM.topExpense.textContent = `${sortedCategories[0][0]} (${formatRupiah(sortedCategories[0][1])})`;
    } else {
      DOM.topExpense.textContent = "Belum ada pengeluaran";
    }

    const now = new Date();
    let divisor = 1;
    if (state.selectedPeriod === "this-month") divisor = Math.max(1, now.getDate());
    else if (state.selectedPeriod === "this-week") divisor = Math.max(1, now.getDay() || 7);
    else if (state.selectedPeriod === "today") divisor = 1;
    else divisor = 30;

    const avgDaily = Math.round(totalExp / divisor);
    DOM.dailyAverage.textContent = totalExp > 0 ? `${formatRupiah(avgDaily)} / hari` : "Rp 0 / hari";

    renderCategoryDonut(categoryTotals, totalExp);
    renderComparisonBar(totalInc, totalExp);
  }

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
            labels: { boxWidth: 12, font: { family: "Plus Jakarta Sans", size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const val = ctx.raw || 0;
                const pct = ((val / totalExp) * 100).toFixed(1);
                return ` ${ctx.label}: ${formatRupiah(val)} (${pct}%)`;
              }
            }
          }
        },
        cutout: "68%"
      }
    });
  }

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
                if (val >= 1000000) return val / 1000000 + "jt";
                if (val >= 1000) return val / 1000 + "rb";
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
   * Render Riwayat Transaksi (Termasuk Pindah Dana)
   */
  function renderHistoryList() {
    DOM.transactionsContainer.innerHTML = "";

    let list = [...state.transactions];

    if (state.historyTypeFilter !== "all") {
      list = list.filter((item) => item.type === state.historyTypeFilter);
    }

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter((item) =>
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q)) ||
        (item.wallet && item.wallet.toLowerCase().includes(q)) ||
        (item.fromWallet && item.fromWallet.toLowerCase().includes(q)) ||
        (item.toWallet && item.toWallet.toLowerCase().includes(q))
      );
    }

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
        DOM.historyStateDesc.textContent = "Tidak ada transaksi yang cocok dengan kata kunci.";
      } else {
        DOM.historyStateTitle.textContent = "Belum Ada Transaksi";
        DOM.historyStateDesc.textContent = "Tekan tombol (+) untuk mencatat transaksi baru.";
      }
      return;
    }

    DOM.historyStateBox.style.display = "none";

    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "transaction-card";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");

      let badgeClass = "expense";
      let badgeIcon = "↑";
      let title = item.category;
      let subtitle = "";
      let amountPrefix = "-";

      if (item.type === "Pemasukan") {
        badgeClass = "income";
        badgeIcon = "↓";
        amountPrefix = "+";
        subtitle = `${formatDisplayDate(item.date)} • Ke: ${item.wallet || item.source || "Cash"}`;
      } else if (item.type === "Transfer") {
        badgeClass = "transfer";
        badgeIcon = "⇄";
        title = "Pindah Dana";
        amountPrefix = "";
        subtitle = `${formatDisplayDate(item.date)} • ${item.fromWallet} → ${item.toWallet}`;
      } else {
        subtitle = `${formatDisplayDate(item.date)} • Dari: ${item.wallet || "Cash"}`;
      }

      if (item.note) subtitle += ` • ${item.note}`;

      card.innerHTML = `
        <div class="transaction-left">
          <div class="transaction-type-badge ${badgeClass}" aria-hidden="true">
            <span style="font-weight: 800; font-size: 1.1rem;">${badgeIcon}</span>
          </div>
          <div class="transaction-details">
            <span class="transaction-category">${title}</span>
            <div class="transaction-meta">
              <span>${subtitle}</span>
            </div>
          </div>
        </div>
        <div class="transaction-right">
          <span class="transaction-amount ${badgeClass}">
            ${amountPrefix} ${formatRupiah(item.amount)}
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

  function openDetailModal(item) {
    state.activeTransaction = item;

    DOM.detailType.textContent = item.type;
    DOM.detailAmount.textContent = formatRupiah(item.amount);
    DOM.detailDate.textContent = formatDisplayDate(item.date);
    DOM.detailNote.textContent = item.note || "-";

    if (item.type === "Transfer") {
      DOM.detailRowCategory.style.display = "none";
      DOM.detailRowWallet.style.display = "flex";
      DOM.detailLabelWallet.textContent = "Mutasi";
      DOM.detailWallet.textContent = `${item.fromWallet} → ${item.toWallet}`;
    } else {
      DOM.detailRowCategory.style.display = "flex";
      DOM.detailCategory.textContent = item.category;
      DOM.detailRowWallet.style.display = "flex";
      DOM.detailLabelWallet.textContent = item.type === "Pemasukan" ? "Masuk ke" : "Keluar dari";
      DOM.detailWallet.textContent = item.wallet || item.source || "Cash";
    }

    openModal(DOM.modalDetail);
  }

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
    DOM.inputDate.value = toInputDateString(parseSheetDate(item.date));
    DOM.inputNote.value = item.note || "";

    if (item.type === "Transfer") {
      populateWalletDropdowns("", item.fromWallet, item.toWallet);
    } else {
      populateCategories(item.type, item.category);
      populateWalletDropdowns(item.wallet || item.source);
    }

    openModal(DOM.modalTx);
  }

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
      state.wallets = data.wallets && data.wallets.length > 0 ? data.wallets : APP_CONFIG.DEFAULT_WALLETS;
      state.categories = data.categories || [];

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

  function initEvents() {
    // Navigasi Bottom
    DOM.navTabDashboard.addEventListener("click", () => switchView("dashboard"));
    DOM.navTabHistory.addEventListener("click", () => switchView("history"));
    DOM.navBtnAddQuick.addEventListener("click", openQuickAddModal);

    // Filter Periode
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

    // Search & Filter Riwayat
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

    // Form Toggle: Pengeluaran / Pemasukan / Pindah Dana
    DOM.toggleTypeExpense.addEventListener("click", () => setTransactionFormType("Pengeluaran"));
    DOM.toggleTypeIncome.addEventListener("click", () => setTransactionFormType("Pemasukan"));
    DOM.toggleTypeTransfer.addEventListener("click", () => setTransactionFormType("Transfer"));

    // Input Nominal Format Mask
    DOM.inputNominal.addEventListener("input", (e) => {
      const rawNum = parseRupiahInput(e.target.value);
      e.target.value = rawNum === 0 ? "" : rawNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    });

    // Form Submit (Tambah / Edit Transaksi atau Transfer)
    DOM.formTx.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nominal = parseRupiahInput(DOM.inputNominal.value);
      if (nominal <= 0) {
        showToast("Nominal transaksi harus lebih dari 0", "error");
        DOM.inputNominal.focus();
        return;
      }

      const dateVal = DOM.inputDate.value;
      if (!dateVal) {
        showToast("Pilih tanggal transaksi", "error");
        return;
      }

      const formattedDate = formatDateForSheet(new Date(dateVal));
      const note = DOM.inputNote.value.trim();
      const type = state.editingType;

      DOM.btnSubmitTx.disabled = true;
      DOM.btnSubmitTx.querySelector("span").textContent = "Menyimpan...";

      try {
        if (type === "Transfer") {
          const fromW = DOM.selectTransferFrom.value;
          const toW = DOM.selectTransferTo.value;
          if (fromW === toW) {
            showToast("Dompet asal dan tujuan tidak boleh sama!", "error");
            DOM.btnSubmitTx.disabled = false;
            DOM.btnSubmitTx.querySelector("span").textContent = "Simpan Transaksi";
            return;
          }

          if (state.isEditing) {
            await API.updateTransaction("Transfer", state.editingRowIndex, {
              date: formattedDate,
              amount: nominal,
              fromWallet: fromW,
              toWallet: toW,
              note: note
            });
            showToast("Pindah dana berhasil diperbarui!", "success");
          } else {
            await API.transferFunds({
              date: formattedDate,
              amount: nominal,
              fromWallet: fromW,
              toWallet: toW,
              note: note
            });
            showToast("Pindah dana berhasil dicatat!", "success");
          }
        } else {
          // Pemasukan / Pengeluaran
          const category = DOM.selectCategory.value;
          const wallet = DOM.selectWallet.value;

          if (state.isEditing) {
            await API.updateTransaction(type, state.editingRowIndex, {
              date: formattedDate,
              amount: nominal,
              category: category,
              note: note,
              wallet: wallet
            });
            showToast("Transaksi berhasil diperbarui!", "success");
          } else {
            await API.addTransaction({
              type: type,
              date: formattedDate,
              amount: nominal,
              category: category,
              note: note,
              wallet: wallet
            });
            showToast("Transaksi berhasil disimpan!", "success");
          }
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

    // Tambah Dompet Baru Trigger & Form
    DOM.btnTriggerAddWallet.addEventListener("click", () => {
      DOM.inputWalletName.value = "";
      DOM.inputWalletInitial.value = "";
      openModal(DOM.modalAddWallet);
      setTimeout(() => DOM.inputWalletName.focus(), 150);
    });

    DOM.inputWalletInitial.addEventListener("input", (e) => {
      const raw = parseRupiahInput(e.target.value);
      e.target.value = raw === 0 ? "" : raw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    });

    DOM.formAddWallet.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = DOM.inputWalletName.value.trim();
      const initialBal = parseRupiahInput(DOM.inputWalletInitial.value);

      if (!name) return;

      DOM.btnSubmitWallet.disabled = true;
      DOM.btnSubmitWallet.querySelector("span").textContent = "Menyimpan...";

      try {
        await API.addWallet({ name, initialBalance: initialBal });
        showToast(`Dompet '${name}' berhasil ditambahkan!`, "success");
        closeModal(DOM.modalAddWallet);
        await loadData();
      } catch (err) {
        showToast(err.message || "Gagal menambah dompet", "error");
      } finally {
        DOM.btnSubmitWallet.disabled = false;
        DOM.btnSubmitWallet.querySelector("span").textContent = "Simpan Dompet";
      }
    });

    // Tambah Kategori Baru Trigger & Form
    DOM.btnTriggerAddCategory.addEventListener("click", () => {
      DOM.inputCategoryName.value = "";
      DOM.selectCatType.value = state.editingType === "Pemasukan" ? "Pemasukan" : "Pengeluaran";
      openModal(DOM.modalAddCategory);
      setTimeout(() => DOM.inputCategoryName.focus(), 150);
    });

    DOM.formAddCategory.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = DOM.inputCategoryName.value.trim();
      const type = DOM.selectCatType.value;

      if (!name) return;

      DOM.btnSubmitCategory.disabled = true;
      DOM.btnSubmitCategory.querySelector("span").textContent = "Menyimpan...";

      try {
        await API.addCategory({ type, name });
        showToast(`Kategori '${name}' berhasil ditambahkan!`, "success");
        closeModal(DOM.modalAddCategory);
        
        // Perbarui lokal dan pilih kategori baru tersebut di dropdown
        state.categories.push({ type, name });
        populateCategories(state.editingType, name);
      } catch (err) {
        showToast(err.message || "Gagal menambah kategori", "error");
      } finally {
        DOM.btnSubmitCategory.disabled = false;
        DOM.btnSubmitCategory.querySelector("span").textContent = "Simpan Kategori";
      }
    });

    // Tutup Modals
    DOM.btnCloseTxModal.addEventListener("click", () => closeModal(DOM.modalTx));
    DOM.btnCloseDetailModal.addEventListener("click", () => closeModal(DOM.modalDetail));
    DOM.btnCloseAddWallet.addEventListener("click", () => closeModal(DOM.modalAddWallet));
    DOM.btnCloseEditWallet.addEventListener("click", () => closeModal(DOM.modalEditWallet));
    DOM.btnCloseAddCat.addEventListener("click", () => closeModal(DOM.modalAddCategory));
    DOM.btnCloseDelModal.addEventListener("click", () => closeModal(DOM.modalConfirmDelete));
    DOM.btnCancelDelete.addEventListener("click", () => closeModal(DOM.modalConfirmDelete));
    DOM.btnCloseSettingsModal.addEventListener("click", () => closeModal(DOM.modalSettings));

    // Input format saldo awal saat edit dompet
    DOM.editWalletInitial.addEventListener("input", (e) => {
      const isNeg = e.target.value.trim().startsWith("-");
      const raw = Math.abs(parseRupiahInput(e.target.value));
      const formatted = raw === 0 ? "" : raw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      e.target.value = (isNeg ? "-" : "") + formatted;
    });

    // Form Submit Edit Dompet
    DOM.formEditWallet.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!state.editingWallet) return;

      const name = DOM.editWalletName.value.trim();
      const initialBal = parseRupiahInput(DOM.editWalletInitial.value);

      DOM.btnSubmitEditWallet.disabled = true;
      DOM.btnSubmitEditWallet.querySelector("span").textContent = "Menyimpan...";

      try {
        await API.updateWallet({
          rowIndex: state.editingWallet.rowIndex,
          name: name,
          initialBalance: initialBal
        });
        showToast(`Saldo awal '${name}' berhasil disimpan!`, "success");
        closeModal(DOM.modalEditWallet);
        await loadData();
      } catch (err) {
        showToast(err.message || "Gagal memperbarui dompet", "error");
      } finally {
        DOM.btnSubmitEditWallet.disabled = false;
        DOM.btnSubmitEditWallet.querySelector("span").textContent = "Simpan Saldo";
      }
    });

    [
      DOM.modalTx,
      DOM.modalDetail,
      DOM.modalAddWallet,
      DOM.modalEditWallet,
      DOM.modalAddCategory,
      DOM.modalConfirmDelete,
      DOM.modalSettings
    ].forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    // Detail Modal Actions
    DOM.btnEditFromDetail.addEventListener("click", openEditModal);
    DOM.btnDeleteFromDetail.addEventListener("click", () => {
      closeModal(DOM.modalDetail);
      openModal(DOM.modalConfirmDelete);
    });

    // Konfirmasi Hapus Transaksi
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

    // Pengaturan
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

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal(DOM.modalTx);
        closeModal(DOM.modalDetail);
        closeModal(DOM.modalAddWallet);
        closeModal(DOM.modalEditWallet);
        closeModal(DOM.modalAddCategory);
        closeModal(DOM.modalConfirmDelete);
        closeModal(DOM.modalSettings);
      }
    });
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").then(
          (reg) => console.log("Service Worker terdaftar:", reg.scope),
          (err) => console.log("Service Worker gagal didaftarkan:", err)
        );
      });
    }
  }

  function init() {
    initEvents();
    registerServiceWorker();
    loadData();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
