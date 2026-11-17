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
    debts: [],
    debtFilter: "all",
    activePayingDebt: null,
    walletSortMode: APP_CONFIG.getWalletSort(),
    walletOrder: APP_CONFIG.getWalletOrder(),
    donutCategoryType: "Pengeluaran",
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
    btnRefreshData: document.getElementById("btn-refresh-data"),
    btnOpenSettings: document.getElementById("btn-open-settings"),
    syncIndicator: document.getElementById("sync-indicator"),
    syncText: document.getElementById("sync-text"),

    // Dashboard Summary
    netBalance: document.getElementById("summary-net-balance"),
    totalIncome: document.getElementById("summary-total-income"),
    totalExpense: document.getElementById("summary-total-expense"),
    periodText: document.getElementById("summary-period-text"),
    periodButtons: document.querySelectorAll(".filter-pill[data-period]"),

    // Wallets Carousel & Reordering
    walletsCarousel: document.getElementById("wallets-carousel"),
    btnTriggerAddWallet: document.getElementById("btn-trigger-add-wallet"),
    btnTriggerSortWallet: document.getElementById("btn-trigger-sort-wallet"),
    modalSortWallets: document.getElementById("modal-sort-wallets"),
    btnCloseSortWallets: document.getElementById("btn-close-sort-wallets"),
    walletReorderContainer: document.getElementById("wallet-reorder-container"),
    walletSortPills: document.querySelectorAll(".wallet-sort-pill[data-wallet-sort]"),

    // Insights
    topExpense: document.getElementById("insight-top-expense"),
    dailyAverage: document.getElementById("insight-daily-average"),

    // Charts & States
    chartCategoryTitle: document.getElementById("chart-category-title"),
    btnChartExpense: document.getElementById("btn-chart-expense"),
    btnChartIncome: document.getElementById("btn-chart-income"),
    chartCategoryCanvas: document.getElementById("chart-category-donut"),
    chartComparisonCanvas: document.getElementById("chart-comparison-bar"),
    chartDonutEmpty: document.getElementById("chart-donut-empty"),
    chartDonutEmptyTitle: document.getElementById("chart-donut-empty-title"),
    chartDonutEmptyDesc: document.getElementById("chart-donut-empty-desc"),
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

    // Debts Summary Card & Dashboard Triggers
    cardDebtsSummary: document.getElementById("card-debts-summary"),
    btnTriggerAddDebt: document.getElementById("btn-trigger-add-debt"),
    summaryTotalReceivables: document.getElementById("summary-total-receivables"),
    summaryTotalPayables: document.getElementById("summary-total-payables"),

    // Modal Debts List
    modalDebtsList: document.getElementById("modal-debts-list"),
    btnCloseDebtsList: document.getElementById("btn-close-debts-list"),
    btnModalAddDebt: document.getElementById("btn-modal-add-debt"),
    debtsItemsContainer: document.getElementById("debts-items-container"),
    debtFilterButtons: document.querySelectorAll(".filter-pill[data-debt-filter]"),

    // Modal Add Debt
    modalAddDebt: document.getElementById("modal-add-debt"),
    btnCloseAddDebt: document.getElementById("btn-close-add-debt"),
    formAddDebt: document.getElementById("form-add-debt"),
    selectDebtType: document.getElementById("select-debt-type"),
    inputDebtPerson: document.getElementById("input-debt-person"),
    inputDebtAmount: document.getElementById("input-debt-amount"),
    inputDebtDate: document.getElementById("input-debt-date"),
    inputDebtDueDate: document.getElementById("input-debt-due-date"),
    inputDebtNote: document.getElementById("input-debt-note"),
    btnSubmitDebt: document.getElementById("btn-submit-debt"),

    // Modal Pay Debt
    modalPayDebt: document.getElementById("modal-pay-debt"),
    btnClosePayDebt: document.getElementById("btn-close-pay-debt"),
    formPayDebt: document.getElementById("form-pay-debt"),
    inputPayDebtRowIndex: document.getElementById("input-pay-debt-row-index"),
    inputPayDebtType: document.getElementById("input-pay-debt-type"),
    payDebtPersonLabel: document.getElementById("pay-debt-person-label"),
    payDebtRemainingLabel: document.getElementById("pay-debt-remaining-label"),
    inputPayDebtAmount: document.getElementById("input-pay-debt-amount"),
    selectPayDebtWallet: document.getElementById("select-pay-debt-wallet"),
    inputPayDebtDate: document.getElementById("input-pay-debt-date"),
    inputPayDebtNote: document.getElementById("input-pay-debt-note"),
    btnSubmitPayDebt: document.getElementById("btn-submit-pay-debt"),

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

  function parseInputDate(strVal) {
    if (!strVal) return null;
    const parts = strVal.split("-");
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(strVal);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
   * Mengambil daftar dompet terurut berdasarkan sortMode & urutan kustom
   */
  function getSortedWallets() {
    let rawWallets = [];
    if (state.wallets && state.wallets.length > 0) {
      rawWallets = [...state.wallets];
    } else {
      rawWallets = [...APP_CONFIG.DEFAULT_WALLETS];
    }

    const sortMode = state.walletSortMode || "custom";

    if (sortMode === "balance-desc") {
      return rawWallets.sort((a, b) => (Number(b.currentBalance) || 0) - (Number(a.currentBalance) || 0));
    }
    if (sortMode === "balance-asc") {
      return rawWallets.sort((a, b) => (Number(a.currentBalance) || 0) - (Number(b.currentBalance) || 0));
    }
    if (sortMode === "name-asc") {
      return rawWallets.sort((a, b) => a.name.localeCompare(b.name, "id", { sensitivity: "base" }));
    }
    if (sortMode === "name-desc") {
      return rawWallets.sort((a, b) => b.name.localeCompare(a.name, "id", { sensitivity: "base" }));
    }

    // Default / "custom": gunakan urutan state.walletOrder jika ada
    if (Array.isArray(state.walletOrder) && state.walletOrder.length > 0) {
      const orderMap = {};
      state.walletOrder.forEach((name, idx) => {
        orderMap[String(name).toLowerCase()] = idx;
      });

      return rawWallets.sort((a, b) => {
        const idxA = orderMap[String(a.name).toLowerCase()] !== undefined ? orderMap[String(a.name).toLowerCase()] : 999;
        const idxB = orderMap[String(b.name).toLowerCase()] !== undefined ? orderMap[String(b.name).toLowerCase()] : 999;
        return idxA - idxB;
      });
    }

    return rawWallets;
  }

  /**
   * Mengambil daftar dompet aktif (sudah terurut)
   */
  function getActiveWallets() {
    return getSortedWallets();
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
    const rawWallets = state.wallets && state.wallets.length > 0 ? state.wallets : APP_CONFIG.DEFAULT_WALLETS;
    rawWallets.forEach((w) => {
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
    state.wallets = rawWallets.map((w) => ({
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
    const sorted = getSortedWallets();

    sorted.forEach((w) => {
      const card = document.createElement("div");
      card.className = "wallet-card";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Dompet ${w.name}: ${formatRupiah(w.currentBalance)}`);

      // Tentukan inisial ikon
      let iconText = "💰";
      const lower = w.name.toLowerCase();
      if (lower.includes("bank") || lower.includes("bca") || lower.includes("mandiri") || lower.includes("bni") || lower.includes("bri") || lower.includes("bsi")) {
        iconText = "🏦";
      } else if (lower.includes("gopay") || lower.includes("shopee") || lower.includes("dana") || lower.includes("ovo") || lower.includes("jago")) {
        iconText = "📱";
      } else if (lower.includes("cash") || lower.includes("tunai")) {
        iconText = "💵";
      } else if (lower.includes("rdn") || lower.includes("saham") || lower.includes("invest")) {
        iconText = "📈";
      }

      card.innerHTML = `
        <div class="wallet-card-header">
          <div class="wallet-card-icon" aria-hidden="true">${iconText}</div>
          <span class="wallet-card-name">${escapeHtml(w.name)}</span>
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
   * Render Daftar Reorder Dompet di Modal Urutkan
   */
  function renderWalletReorderList() {
    if (!DOM.walletReorderContainer) return;
    DOM.walletReorderContainer.innerHTML = "";

    const sorted = getSortedWallets();

    // Update kelas active pada pill sort
    if (DOM.walletSortPills) {
      DOM.walletSortPills.forEach((pill) => {
        if (pill.dataset.walletSort === state.walletSortMode) {
          pill.classList.add("active");
        } else {
          pill.classList.remove("active");
        }
      });
    }

    sorted.forEach((w, index) => {
      const item = document.createElement("div");
      item.className = "wallet-reorder-item";
      item.setAttribute("draggable", "true");
      item.dataset.index = index;
      item.dataset.walletName = w.name;

      // Inisial ikon
      let iconText = "💰";
      const lower = w.name.toLowerCase();
      if (lower.includes("bank") || lower.includes("bca") || lower.includes("mandiri") || lower.includes("bni") || lower.includes("bri") || lower.includes("bsi")) {
        iconText = "🏦";
      } else if (lower.includes("gopay") || lower.includes("shopee") || lower.includes("dana") || lower.includes("ovo") || lower.includes("jago")) {
        iconText = "📱";
      } else if (lower.includes("cash") || lower.includes("tunai")) {
        iconText = "💵";
      } else if (lower.includes("rdn") || lower.includes("saham") || lower.includes("invest")) {
        iconText = "📈";
      }

      item.innerHTML = `
        <div class="wallet-reorder-info">
          <div class="wallet-reorder-handle" title="Tahan & geser untuk memindahkan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="5" r="1"/>
              <circle cx="9" cy="12" r="1"/>
              <circle cx="9" cy="19" r="1"/>
              <circle cx="15" cy="5" r="1"/>
              <circle cx="15" cy="12" r="1"/>
              <circle cx="15" cy="19" r="1"/>
            </svg>
          </div>
          <div class="wallet-card-icon" style="width: 26px; height: 26px; font-size: 0.75rem;">${iconText}</div>
          <div style="min-width: 0; flex: 1;">
            <div class="wallet-reorder-name">${escapeHtml(w.name)}</div>
            <div class="wallet-reorder-balance">${formatRupiah(w.currentBalance || 0)}</div>
          </div>
        </div>
        <div class="wallet-reorder-actions">
          <button type="button" class="btn-reorder-arrow btn-move-up" data-index="${index}" ${index === 0 ? "disabled" : ""} aria-label="Geser ${w.name} ke atas">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m18 15-6-6-6 6"/>
            </svg>
          </button>
          <button type="button" class="btn-reorder-arrow btn-move-down" data-index="${index}" ${index === sorted.length - 1 ? "disabled" : ""} aria-label="Geser ${w.name} ke bawah">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
        </div>
      `;

      // Event listener tombol panah ⬆️ dan ⬇️
      const btnUp = item.querySelector(".btn-move-up");
      if (btnUp) {
        btnUp.addEventListener("click", (e) => {
          e.stopPropagation();
          moveWalletPosition(index, index - 1);
        });
      }

      const btnDown = item.querySelector(".btn-move-down");
      if (btnDown) {
        btnDown.addEventListener("click", (e) => {
          e.stopPropagation();
          moveWalletPosition(index, index + 1);
        });
      }

      // Drag and drop events
      item.addEventListener("dragstart", (e) => {
        item.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index);
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const toIndex = index;
        if (!isNaN(fromIndex) && fromIndex !== toIndex) {
          moveWalletPosition(fromIndex, toIndex);
        }
      });

      DOM.walletReorderContainer.appendChild(item);
    });
  }

  /**
   * Pindahkan posisi dompet dari fromIndex ke toIndex
   */
  function moveWalletPosition(fromIndex, toIndex) {
    const list = getSortedWallets();
    if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return;

    // Pindahkan elemen
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);

    // Otomatis beralih ke mode custom dan simpan daftar urutan
    const newOrder = list.map((w) => w.name);
    state.walletSortMode = "custom";
    state.walletOrder = newOrder;

    APP_CONFIG.saveWalletSort("custom");
    APP_CONFIG.saveWalletOrder(newOrder);

    renderWalletReorderList();
    renderWalletsCarousel();
    populateWalletDropdowns();
  }

  /**
   * Terapkan Mode Urutan Cepat (Saldo Tertinggi, Terendah, A-Z, Z-A)
   */
  function applyWalletSortMode(sortMode) {
    state.walletSortMode = sortMode;
    APP_CONFIG.saveWalletSort(sortMode);

    if (sortMode !== "custom") {
      const sorted = getSortedWallets();
      const newOrder = sorted.map((w) => w.name);
      state.walletOrder = newOrder;
      APP_CONFIG.saveWalletOrder(newOrder);
    }

    renderWalletReorderList();
    renderWalletsCarousel();
    populateWalletDropdowns();

    const sortLabels = {
      custom: "Urutan Kustom",
      "balance-desc": "Saldo Tertinggi",
      "balance-asc": "Saldo Terendah",
      "name-asc": "Nama (A - Z)",
      "name-desc": "Nama (Z - A)"
    };
    showToast(`Urutan dompet: ${sortLabels[sortMode] || sortMode}`, "success");
  }

  /**
   * Render Ringkasan Utang & Piutang di Dashboard
   */
  function renderDebtsSummary() {
    if (!DOM.summaryTotalReceivables || !DOM.summaryTotalPayables) return;

    let totalReceivables = 0;
    let totalPayables = 0;

    (state.debts || []).forEach((debt) => {
      const remaining = Number(debt.remaining) || 0;
      const isPaid = debt.status === "Lunas" || remaining <= 0;
      if (!isPaid) {
        if (debt.type === "Piutang") {
          totalReceivables += remaining;
        } else if (debt.type === "Hutang" || debt.type === "Utang") {
          totalPayables += remaining;
        }
      }
    });

    DOM.summaryTotalReceivables.textContent = formatRupiah(totalReceivables);
    DOM.summaryTotalPayables.textContent = formatRupiah(totalPayables);
  }

  /**
   * Render Daftar Utang & Piutang dalam Modal
   */
  function renderDebtsList() {
    if (!DOM.debtsItemsContainer) return;

    const filter = state.debtFilter || "all";
    const debts = state.debts || [];

    const filtered = debts.filter((item) => {
      const isPaid = item.status === "Lunas" || (Number(item.remaining) || 0) <= 0;
      if (filter === "unpaid") return !isPaid;
      if (filter === "paid") return isPaid;
      if (filter === "receivable") return item.type === "Piutang";
      if (filter === "payable") return item.type === "Utang" || item.type === "Hutang";
      return true; // all
    });

    if (filtered.length === 0) {
      DOM.debtsItemsContainer.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; color: var(--color-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📑</div>
          <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-text-main);">Tidak ada data</div>
          <div style="font-size: 0.82rem; margin-top: 4px;">Tidak ada utang atau piutang pada kategori ini.</div>
        </div>
      `;
      return;
    }

    let html = "";
    filtered.forEach((debt) => {
      const isReceivable = debt.type === "Piutang";
      const displayType = isReceivable ? "Piutang" : "Utang";
      const totalAmount = Number(debt.amount) || 0;
      const paidAmount = Number(debt.paid) || 0;
      const remainingAmount = Number(debt.remaining) || 0;
      const isPaid = debt.status === "Lunas" || remainingAmount <= 0;
      const percent = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

      html += `
        <div class="debt-card">
          <div class="debt-card-header">
            <div class="debt-person-name">${escapeHtml(debt.person)}</div>
            <div class="debt-badges">
              <span class="badge-tag ${isReceivable ? 'receivable' : 'payable'}">${escapeHtml(displayType)}</span>
              <span class="badge-tag ${isPaid ? 'paid' : 'unpaid'}">${isPaid ? 'Lunas' : 'Belum Lunas'}</span>
            </div>
          </div>

          <div class="debt-progress-wrapper" title="${percent}% terbayar">
            <div class="debt-progress-bar ${isReceivable ? '' : 'payable'}" style="width: ${percent}%;"></div>
          </div>

          <div class="debt-numbers-row">
            <div>
              <span style="font-size: 0.78rem; color: var(--color-text-muted);">Sisa: </span>
              <span class="debt-remaining" style="color: ${isReceivable ? 'var(--color-income)' : 'var(--color-expense)'};">
                ${formatRupiah(remainingAmount)}
              </span>
            </div>
            <div style="font-size: 0.78rem; color: var(--color-text-muted);">
              Total: ${formatRupiah(totalAmount)}
            </div>
          </div>

          <div class="debt-meta-info">
            <span>Tgl: ${formatDisplayDate(debt.date)}</span>
            ${debt.dueDate ? ` • <span>Jatuh Tempo: <strong>${formatDisplayDate(debt.dueDate)}</strong></span>` : ''}
            ${debt.note ? `<div style="margin-top: 4px; font-style: italic; color: var(--color-text-muted);">"${escapeHtml(debt.note)}"</div>` : ''}
          </div>

          <div class="debt-actions-row">
            ${!isPaid ? `
              <button type="button" class="btn-pay-action btn-trigger-pay" data-row-index="${debt.rowIndex}">
                ${isReceivable ? 'Terima Pembayaran' : 'Bayar / Cicil'}
              </button>
            ` : `
              <div style="flex: 1; display: flex; align-items: center; font-size: 0.82rem; color: var(--color-income); font-weight: 700;">
                ✓ Selesai Lunas
              </div>
            `}
            <button type="button" class="btn-delete-debt btn-trigger-del-debt" data-row-index="${debt.rowIndex}" data-person="${escapeHtml(debt.person)}" aria-label="Hapus Utang / Piutang">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    });

    DOM.debtsItemsContainer.innerHTML = html;

    // Pasang event listener untuk tombol aksi di tiap kartu
    DOM.debtsItemsContainer.querySelectorAll(".btn-trigger-pay").forEach((btn) => {
      btn.addEventListener("click", () => {
        const rowIndex = Number(btn.dataset.rowIndex);
        openPayDebtModal(rowIndex);
      });
    });

    DOM.debtsItemsContainer.querySelectorAll(".btn-trigger-del-debt").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const rowIndex = Number(btn.dataset.rowIndex);
        const person = btn.dataset.person || "pihak ini";
        if (confirm(`Apakah Anda yakin ingin menghapus catatan utang/piutang untuk ${person}?`)) {
          btn.disabled = true;
          try {
            await API.deleteDebt(rowIndex);
            showToast("Catatan utang/piutang berhasil dihapus!", "success");
            await loadData();
            renderDebtsList();
          } catch (err) {
            showToast(err.message || "Gagal menghapus catatan", "error");
          } finally {
            btn.disabled = false;
          }
        }
      });
    });
  }

  /**
   * Buka Form Tambah Hutang/Piutang Baru
   */
  function openAddDebtModal() {
    DOM.formAddDebt.reset();
    DOM.inputDebtDate.value = toInputDateString(new Date());
    DOM.inputDebtDueDate.value = "";
    DOM.inputDebtAmount.value = "";
    openModal(DOM.modalAddDebt);
    setTimeout(() => DOM.inputDebtPerson.focus(), 150);
  }

  /**
   * Buka Form Pelunasan / Cicilan
   */
  function openPayDebtModal(rowIndex) {
    const debt = (state.debts || []).find((d) => Number(d.rowIndex) === Number(rowIndex));
    if (!debt) return;

    state.activePayingDebt = debt;
    const isReceivable = debt.type === "Piutang";
    const displayType = isReceivable ? "Piutang" : "Utang";

    DOM.inputPayDebtRowIndex.value = debt.rowIndex;
    DOM.inputPayDebtType.value = debt.type;
    DOM.payDebtPersonLabel.textContent = `${displayType}: ${debt.person}`;
    DOM.payDebtRemainingLabel.textContent = formatRupiah(debt.remaining);

    // Default pelunasan penuh sisa
    const rem = Number(debt.remaining) || 0;
    DOM.inputPayDebtAmount.value = rem > 0 ? rem.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
    DOM.inputPayDebtDate.value = toInputDateString(new Date());
    DOM.inputPayDebtNote.value = "";

    populatePayDebtWallets();

    openModal(DOM.modalPayDebt);
    setTimeout(() => DOM.inputPayDebtAmount.focus(), 150);
  }

  /**
   * Isi Opsi Dompet untuk Modal Pelunasan
   */
  function populatePayDebtWallets(selectedWallet = "") {
    if (!DOM.selectPayDebtWallet) return;
    DOM.selectPayDebtWallet.innerHTML = "";
    const wallets = getActiveWallets();
    wallets.forEach((w) => {
      const opt = document.createElement("option");
      opt.value = w.name;
      opt.textContent = `${w.name} (Saldo: ${formatRupiah(w.currentBalance || 0)})`;
      if (selectedWallet && w.name === selectedWallet) {
        opt.selected = true;
      }
      DOM.selectPayDebtWallet.appendChild(opt);
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
    renderDebtsSummary();

    // Total Saldo Bersih Global = jumlah seluruh saldo dompet saat ini
    const totalGlobalNetBalance = state.wallets.reduce((acc, w) => acc + (w.currentBalance || 0), 0);
    DOM.netBalance.textContent = formatRupiah(totalGlobalNetBalance);

    // Filter transaksi untuk ringkasan periode
    const filtered = getFilteredTransactionsByPeriod();

    let totalInc = 0;
    let totalExp = 0;
    const categoryExpenseTotals = {};
    const categoryIncomeTotals = {};

    filtered.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "Pemasukan") {
        totalInc += amt;
        const cat = tx.category || "Lain-lain";
        categoryIncomeTotals[cat] = (categoryIncomeTotals[cat] || 0) + amt;
      } else if (tx.type === "Pengeluaran") {
        totalExp += amt;
        const cat = tx.category || "Lain-lain";
        categoryExpenseTotals[cat] = (categoryExpenseTotals[cat] || 0) + amt;
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
    const sortedCategories = Object.entries(categoryExpenseTotals).sort((a, b) => b[1] - a[1]);
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

    // Toggle Kategori Donut (Pengeluaran vs Pemasukan)
    const isIncomeTab = state.donutCategoryType === "Pemasukan";
    if (DOM.chartCategoryTitle) {
      DOM.chartCategoryTitle.textContent = isIncomeTab ? "Kategori Pemasukan" : "Kategori Pengeluaran";
    }

    if (DOM.btnChartExpense && DOM.btnChartIncome) {
      if (isIncomeTab) {
        DOM.btnChartIncome.classList.add("active");
        DOM.btnChartExpense.classList.remove("active");
      } else {
        DOM.btnChartExpense.classList.add("active");
        DOM.btnChartIncome.classList.remove("active");
      }
    }

    if (isIncomeTab) {
      renderCategoryDonut("Pemasukan", categoryIncomeTotals, totalInc);
    } else {
      renderCategoryDonut("Pengeluaran", categoryExpenseTotals, totalExp);
    }

    renderComparisonBar(totalInc, totalExp);
  }

  function renderCategoryDonut(type, categoryTotals, totalAmount) {
    if (state.chartDonut) {
      state.chartDonut.destroy();
      state.chartDonut = null;
    }

    const labels = Object.keys(categoryTotals);
    const dataValues = Object.values(categoryTotals);

    if (labels.length === 0 || totalAmount === 0) {
      DOM.chartCategoryCanvas.style.display = "none";
      DOM.chartDonutEmpty.style.display = "flex";
      if (DOM.chartDonutEmptyTitle) {
        DOM.chartDonutEmptyTitle.textContent = type === "Pemasukan" ? "Belum ada pemasukan" : "Belum ada pengeluaran";
      }
      if (DOM.chartDonutEmptyDesc) {
        DOM.chartDonutEmptyDesc.textContent = type === "Pemasukan"
          ? "Belum ada data pemasukan pada periode yang dipilih."
          : "Belum ada data pengeluaran pada periode yang dipilih.";
      }
      return;
    }

    DOM.chartCategoryCanvas.style.display = "block";
    DOM.chartDonutEmpty.style.display = "none";

    // Palet warna pengeluaran (Dusty Rose dkk) vs pemasukan (Soft Blue & Sky tones)
    const expensePalette = [
      "#E8829A", "#F2B5C5", "#E5A99B", "#F6D2C9",
      "#C5A3B8", "#A3C4BC", "#BFD8D2", "#DFCCF1"
    ];

    const incomePalette = [
      "#5B9CE6", "#7AAEEA", "#6BA5EC", "#91C0F4",
      "#A8CDF6", "#5C8BDE", "#7A9FE6", "#B8D7FA"
    ];

    const palette = type === "Pemasukan" ? incomePalette : expensePalette;

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
                const pct = totalAmount > 0 ? ((val / totalAmount) * 100).toFixed(1) : 0;
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
          backgroundColor: ["#5B9CE6", "#E8829A"],
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
      return false;
    }

    DOM.syncIndicator.className = "sync-dot syncing";
    DOM.syncText.textContent = "Menyinkronkan...";

    try {
      const data = await API.fetchTransactions();
      state.transactions = data.transactions || [];
      state.wallets = data.wallets && data.wallets.length > 0 ? data.wallets : APP_CONFIG.DEFAULT_WALLETS;
      state.categories = data.categories || [];
      state.debts = data.debts || [];

      updateConnectionBadge();
      renderDashboard();
      renderHistoryList();
      if (DOM.modalDebtsList && DOM.modalDebtsList.classList.contains("active")) {
        renderDebtsList();
      }
      return true;
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
      return false;
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

    // Toggle Kategori Grafik Donut (Pengeluaran / Pemasukan)
    if (DOM.btnChartExpense) {
      DOM.btnChartExpense.addEventListener("click", () => {
        if (state.donutCategoryType !== "Pengeluaran") {
          state.donutCategoryType = "Pengeluaran";
          renderDashboard();
        }
      });
    }

    if (DOM.btnChartIncome) {
      DOM.btnChartIncome.addEventListener("click", () => {
        if (state.donutCategoryType !== "Pemasukan") {
          state.donutCategoryType = "Pemasukan";
          renderDashboard();
        }
      });
    }

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

    // Atur & Urutkan Dompet Trigger & Events
    if (DOM.btnTriggerSortWallet) {
      DOM.btnTriggerSortWallet.addEventListener("click", () => {
        renderWalletReorderList();
        openModal(DOM.modalSortWallets);
      });
    }

    if (DOM.btnCloseSortWallets) {
      DOM.btnCloseSortWallets.addEventListener("click", () => closeModal(DOM.modalSortWallets));
    }

    if (DOM.walletSortPills) {
      DOM.walletSortPills.forEach((pill) => {
        pill.addEventListener("click", () => {
          applyWalletSortMode(pill.dataset.walletSort);
        });
      });
    }

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

    // Debts Summary & Modals Trigger
    if (DOM.cardDebtsSummary) {
      DOM.cardDebtsSummary.addEventListener("click", (e) => {
        if (e.target.closest("#btn-trigger-add-debt")) return;
        renderDebtsList();
        openModal(DOM.modalDebtsList);
      });
    }

    if (DOM.btnTriggerAddDebt) {
      DOM.btnTriggerAddDebt.addEventListener("click", (e) => {
        e.stopPropagation();
        openAddDebtModal();
      });
    }

    if (DOM.btnModalAddDebt) {
      DOM.btnModalAddDebt.addEventListener("click", () => {
        openAddDebtModal();
      });
    }

    // Filter pills di Modal Debts List
    if (DOM.debtFilterButtons) {
      DOM.debtFilterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          DOM.debtFilterButtons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          state.debtFilter = btn.dataset.debtFilter;
          renderDebtsList();
        });
      });
    }

    // Tutup Modals Hutang/Piutang
    if (DOM.btnCloseDebtsList) {
      DOM.btnCloseDebtsList.addEventListener("click", () => closeModal(DOM.modalDebtsList));
    }
    if (DOM.btnCloseAddDebt) {
      DOM.btnCloseAddDebt.addEventListener("click", () => closeModal(DOM.modalAddDebt));
    }
    if (DOM.btnClosePayDebt) {
      DOM.btnClosePayDebt.addEventListener("click", () => closeModal(DOM.modalPayDebt));
    }

    // Format Mask Input Nominal Hutang & Pembayaran
    if (DOM.inputDebtAmount) {
      DOM.inputDebtAmount.addEventListener("input", (e) => {
        const raw = parseRupiahInput(e.target.value);
        e.target.value = raw === 0 ? "" : raw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      });
    }
    if (DOM.inputPayDebtAmount) {
      DOM.inputPayDebtAmount.addEventListener("input", (e) => {
        const raw = parseRupiahInput(e.target.value);
        e.target.value = raw === 0 ? "" : raw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      });
    }

    // Form Submit Tambah Hutang/Piutang
    if (DOM.formAddDebt) {
      DOM.formAddDebt.addEventListener("submit", async (e) => {
        e.preventDefault();
        const type = DOM.selectDebtType.value;
        const person = DOM.inputDebtPerson.value.trim();
        const amount = parseRupiahInput(DOM.inputDebtAmount.value);
        const dateVal = DOM.inputDebtDate.value;
        const dueDateVal = DOM.inputDebtDueDate.value;
        const note = DOM.inputDebtNote.value.trim();

        if (!person) {
          showToast("Masukkan nama pihak / orang", "error");
          DOM.inputDebtPerson.focus();
          return;
        }

        if (amount <= 0) {
          showToast("Nominal harus lebih dari 0", "error");
          DOM.inputDebtAmount.focus();
          return;
        }

        if (!dateVal) {
          showToast("Pilih tanggal transaksi", "error");
          return;
        }

        DOM.btnSubmitDebt.disabled = true;
        DOM.btnSubmitDebt.querySelector("span").textContent = "Menyimpan...";

        try {
          const dateObj = parseInputDate(dateVal);
          const dueDateObj = dueDateVal ? parseInputDate(dueDateVal) : null;

          await API.addDebt({
            type: type,
            person: person,
            amount: amount,
            date: formatDateForSheet(dateObj),
            dueDate: dueDateObj ? formatDateForSheet(dueDateObj) : "",
            note: note
          });

          showToast(`${type} berhasil dicatat!`, "success");
          closeModal(DOM.modalAddDebt);
          await loadData();
          renderDebtsList();
        } catch (err) {
          showToast(err.message || `Gagal mencatat ${type}`, "error");
        } finally {
          DOM.btnSubmitDebt.disabled = false;
          DOM.btnSubmitDebt.querySelector("span").textContent = "Simpan Data";
        }
      });
    }

    // Form Submit Pelunasan / Cicil
    if (DOM.formPayDebt) {
      DOM.formPayDebt.addEventListener("submit", async (e) => {
        e.preventDefault();
        const rowIndex = Number(DOM.inputPayDebtRowIndex.value);
        const debtType = DOM.inputPayDebtType.value;
        const payAmount = parseRupiahInput(DOM.inputPayDebtAmount.value);
        const wallet = DOM.selectPayDebtWallet.value;
        const dateVal = DOM.inputPayDebtDate.value;
        const note = DOM.inputPayDebtNote.value.trim();

        if (!rowIndex || payAmount <= 0) {
          showToast("Nominal pembayaran harus lebih dari 0", "error");
          DOM.inputPayDebtAmount.focus();
          return;
        }

        if (!dateVal) {
          showToast("Pilih tanggal pembayaran", "error");
          return;
        }

        DOM.btnSubmitPayDebt.disabled = true;
        DOM.btnSubmitPayDebt.querySelector("span").textContent = "Menyimpan...";

        try {
          const dateObj = parseInputDate(dateVal);

          await API.payDebt({
            rowIndex: rowIndex,
            payAmount: payAmount,
            wallet: wallet,
            date: formatDateForSheet(dateObj),
            note: note
          });

          const isReceivable = debtType === "Piutang";
          const displayType = isReceivable ? "Piutang" : "Utang";
          showToast(`Pelunasan ${displayType} berhasil dicatat ke dompet ${wallet}!`, "success");
          closeModal(DOM.modalPayDebt);
          await loadData();
          renderDebtsList();
        } catch (err) {
          showToast(err.message || "Gagal mencatat pelunasan", "error");
        } finally {
          DOM.btnSubmitPayDebt.disabled = false;
          DOM.btnSubmitPayDebt.querySelector("span").textContent = "Catat Pelunasan";
        }
      });
    }

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
      DOM.modalSettings,
      DOM.modalDebtsList,
      DOM.modalAddDebt,
      DOM.modalPayDebt,
      DOM.modalSortWallets
    ].filter(Boolean).forEach((modal) => {
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

    // Refresh Manual Data
    if (DOM.btnRefreshData) {
      DOM.btnRefreshData.addEventListener("click", async () => {
        if (DOM.btnRefreshData.classList.contains("spinning")) return;
        DOM.btnRefreshData.classList.add("spinning");
        DOM.btnRefreshData.disabled = true;
        try {
          const success = await loadData();
          if (success) {
            showToast("Data berhasil diperbarui!", "success");
          }
        } catch (err) {
          showToast("Gagal memperbarui data: " + (err.message || err), "error");
        } finally {
          DOM.btnRefreshData.classList.remove("spinning");
          DOM.btnRefreshData.disabled = false;
        }
      });
    }

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
        [
          DOM.modalTx,
          DOM.modalDetail,
          DOM.modalAddWallet,
          DOM.modalEditWallet,
          DOM.modalAddCategory,
          DOM.modalConfirmDelete,
          DOM.modalSettings,
          DOM.modalDebtsList,
          DOM.modalAddDebt,
          DOM.modalPayDebt,
          DOM.modalSortWallets
        ].filter(Boolean).forEach(closeModal);
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
