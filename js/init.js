/**
 * File khởi tạo cho Frontend ALY GYM CENTER
 * Chứa các hàm khởi tạo, load dữ liệu ban đầu
 */

// Global variables
let packages = [];
let ptList = [];
let qrScanner = null;
let pendingPackages = [];
let currentPromotion = null;

async function loadData() {
  try {
    showGlobalLoading(true, 'Đang tải dữ liệu thật từ Google Sheet...');

    const SPREADSHEET_ID = '12m5QkQ73vu_W4WyWR31Lxk5pflSoRuwKioycbGkE_Kc';

    // Lấy Packages từ sheet DS_Goi
    const pkgResponse = await fetch(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=DS_Goi`);
    const pkgText = await pkgResponse.text();
    const pkgData = JSON.parse(pkgText.substring(47).slice(0, -2)); // Google trả về JSONP

    const packagesRaw = pkgData.table.rows.map(row => ({
      code: row.c[3] ? row.c[3].v : '',           // Mã gói (cột D)
      sessions: row.c[4] ? row.c[4].v : 0,        // Số buổi
      price: row.c[5] ? Number(String(row.c[5].v).replace(/[^0-9]/g, '')) : 0,
      type: row.c[1] ? row.c[1].v : 'Gym_NonPT',  // Hình thức tập
      name: row.c[2] ? row.c[2].v : ''
    }));

    // Lấy PT List từ sheet DanhSach_PT
    const ptResponse = await fetch(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=DanhSach_PT`);
    const ptText = await ptResponse.text();
    const ptData = JSON.parse(ptText.substring(47).slice(0, -2));

    const ptListRaw = ptData.table.rows.map(row => ({
      code: row.c[1] ? row.c[1].v : '',
      name: row.c[2] ? row.c[2].v : ''
    })).filter(pt => pt.code && pt.name);

    // Gán dữ liệu thật
    packages = packagesRaw;
    ptList = ptListRaw;

    console.log(`✅ Tải thành công từ Google Sheet: ${packages.length} gói | ${ptList.length} PT`);

    updatePackageOptions();
    updateRenewPackageOptions();
    updatePTOptions();

    showToast('Đã tải dữ liệu thật từ Google Sheet!', 'success');

  } catch (error) {
    console.error('Lỗi tải dữ liệu trực tiếp từ Sheet:', error);
    showToast('Không thể tải dữ liệu từ Google Sheet', 'error');
  } finally {
    showGlobalLoading(false);
  }
}

/**
 * Hiển thị/ẩn trạng thái loading cho nút bấm
 * @param {string} buttonId - ID của nút
 * @param {boolean} isLoading - Trạng thái loading
 * @param {string} loadingText - Text hiển thị
 */
function setButtonLoading(buttonId, isLoading, loadingText = 'Đang xử lý...') {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  
  if (isLoading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${loadingText}`;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.classList.remove('opacity-75', 'cursor-not-allowed');
  }
}

/**
 * Lấy tên nhân viên từ form
 * @returns {string} - Tên nhân viên
 */
function getStaffName() {
  const el = document.getElementById('staffName');
  const v = el ? String(el.value || '').trim() : '';
  return v || 'Lễ tân';
}

/**
 * Đồng bộ tên nhân viên sang các form khác
 */
function syncStaffToForms() {
  const v = getStaffName();
  
  const revStaff = document.getElementById('revStaff');
  if (revStaff) {
    const cur = String(revStaff.value || '').trim();
    if (!cur || cur === 'Lễ tân') revStaff.value = v;
  }
  
  const revUpdateStaff = document.getElementById('revUpdateStaff');
  if (revUpdateStaff) {
    const cur2 = String(revUpdateStaff.value || '').trim();
    if (!cur2 || cur2 === 'Lễ tân') revUpdateStaff.value = v;
  }
}

/**
 * Khởi tạo tên nhân viên
 */
function initStaffName() {
  const el = document.getElementById('staffName');
  if (!el) return;
  
  try {
    const stored = localStorage.getItem('aly_staff');
    if (stored && !String(el.value || '').trim()) el.value = stored;
  } catch (e) {}
  
  const save = () => {
    const v = String(el.value || '').trim();
    try { 
      localStorage.setItem('aly_staff', v); 
    } catch (e) {}
    syncStaffToForms();
  };
  
  el.addEventListener('change', save);
  el.addEventListener('blur', save);
  syncStaffToForms();
}

/**
 * Parse VND string sang number
 * @param {string} text - Chuỗi tiền
 * @returns {number} - Số tiền
 */
function parseVnd(text) {
  return Number(String(text || '').replace(/[^0-9]/g, '')) || 0;
}

/**
 * Setup payment block cho các form
 * @param {Object} cfg - Cấu hình payment block
 */
function setupPaymentBlock(cfg) {
  const statusEl = document.getElementById(cfg.statusId);
  const methodEl = document.getElementById(cfg.methodId);
  if (!statusEl || !methodEl) return;

  const splitEl = cfg.splitId ? document.getElementById(cfg.splitId) : null;
  const cashEl = cfg.cashId ? document.getElementById(cfg.cashId) : null;
  const transferEl = cfg.transferId ? document.getElementById(cfg.transferId) : null;
  const hintEl = cfg.hintId ? document.getElementById(cfg.hintId) : null;

  const getTotal = () => {
    if (typeof cfg.getTotal === 'function') return cfg.getTotal();
    return 0;
  };

  const clearSplit = () => {
    if (cashEl) cashEl.value = '';
    if (transferEl) transferEl.value = '';
  };

  const updateHint = () => {
    const total = getTotal();
    const paid = parseVnd(cashEl ? cashEl.value : 0) + parseVnd(transferEl ? transferEl.value : 0);
    
    if (!hintEl) return;
    
    const debt = total - paid;
    
    if (statusEl.value === 'Chưa thanh toán') {
      hintEl.textContent = total > 0 ? `Còn nợ: ${formatMoney(total, true)}` : '';
      return;
    }
    
    if (paid <= 0) {
      hintEl.textContent = '';
      return;
    }
    
    if (debt > 0) hintEl.textContent = `Còn nợ: ${formatMoney(debt, true)}`;
    else if (debt < 0) hintEl.textContent = `Dư: ${formatMoney(-debt, true)}`;
    else hintEl.textContent = 'Đã đủ';
  };

  const applyState = () => {
    const status = statusEl.value;
    
    if (status === 'Chưa thanh toán') {
      methodEl.value = '';
      methodEl.disabled = true;
      if (splitEl) splitEl.classList.add('hidden');
      clearSplit();
      updateHint();
      return;
    }
    
    methodEl.disabled = false;
    if (!methodEl.value) methodEl.value = 'Tiền mặt';
    
    if (splitEl) {
      splitEl.classList.toggle('hidden', methodEl.value !== 'Tiền mặt + Chuyển khoản');
      if (methodEl.value !== 'Tiền mặt + Chuyển khoản') clearSplit();
    }
    
    updateHint();
  };

  statusEl.addEventListener('change', applyState);
  methodEl.addEventListener('change', applyState);
  if (cashEl) cashEl.addEventListener('input', updateHint);
  if (transferEl) transferEl.addEventListener('input', updateHint);

  applyState();
}

/**
 * Update PT options cho các select
 */
function updatePTOptions() {
  const selects = [
    document.getElementById('ptCode'),
    document.getElementById('renewPtCode'),
    document.getElementById('pendingPtCode')
  ].filter(Boolean);
  
  if (selects.length === 0) return;
  
  const ptListSafe = Array.isArray(ptList) ? ptList : [];
  
  selects.forEach(select => {
    const current = select.value;
    select.innerHTML = '';
    select.add(new Option('-- Chọn HLV --', ''));
    
    ptListSafe.forEach(pt => {
      let code = '';
      let name = '';
      
      if (pt && typeof pt === 'object' && !Array.isArray(pt)) {
        code = pt.code || '';
        name = pt.name || '';
      } else if (Array.isArray(pt)) {
        code = pt[1] || pt[0] || '';
        name = pt[2] || pt[1] || '';
      }
      
      if (code) {
        const opt = new Option(`${name} (${code})`, code);
        select.add(opt);
      }
    });
    
    if (current && [...select.options].some(o => o.value === current)) {
      select.value = current;
    }
  });
}

/**
 * Update package options cho register form
 */
function updatePackageOptions() {
  const type = document.getElementById('trainingType')?.value || 'NonPT';
  const select = document.getElementById('packageCode');
  if (!select) return;
  
  const currentValue = select.value;
  select.innerHTML = '';
  select.add(new Option('Chọn gói', ''));
  
  const pkgList = Array.isArray(packages) ? packages : [];
  let filteredPackages;
  
  if (type === 'NonPT') {
    filteredPackages = pkgList.filter(p => p.type === 'Gym_NonPT');
  } else {
    filteredPackages = pkgList.filter(p => p.type === 'Gym_PT' && String(p.code || '').startsWith(type + ':'));
  }
  
  filteredPackages.forEach(p => {
    if (p && p.code) {
      const opt = new Option(`${p.code} - ${p.sessions} buổi - ${formatMoney(p.price, true)}`, p.code);
      opt.dataset.sessions = p.sessions;
      opt.dataset.price = p.price;
      select.add(opt);
    }
  });
  
  if (currentValue && [...select.options].some(o => o.value === currentValue)) {
    select.value = currentValue;
  } else {
    select.value = '';
  }
  
  const regMonthEl = document.getElementById('registerMonthCardFields');
  const regTypeContainer = document.getElementById('registerMonthCardTypeContainer');
  if (regMonthEl) regMonthEl.style.display = (type.startsWith('PT')) ? 'grid' : 'none';
  
  updateTotalPrice();
}

/**
 * Update package options cho renew form
 */
function updateRenewPackageOptions() {
  // Implementation sẽ được thêm sau khi có renew.js
}

/**
 * Update total price cho register form
 */
function updateTotalPrice() {
  const select = document.getElementById('packageCode');
  if (!select) return;
  
  const originalPrice = Number(select.selectedOptions[0]?.dataset.price || 0);
  const packageCode = select.value;
  const el = document.getElementById('totalPrice');
  
  if (!packageCode) {
    if (el) el.value = '0 VNĐ';
    return;
  }

  if (typeof currentPromotion !== 'undefined' && currentPromotion && currentPromotion.isActive && isPromotionStillValid()) {
    // Check promotion - sẽ được implement sau
    setTotalWithMonthCard(originalPrice, 'register');
  } else {
    setTotalWithMonthCard(originalPrice, 'register');
  }
}

/**
 * Khởi tạo ứng dụng
 */
document.addEventListener('DOMContentLoaded', () => {
  initStaffName();
  loadData();
  setActiveTab('checkIn');
  setupTabNavigation();
  setupDiscountRadioButtons();
  setupPriceUpdateHandlers();
  
  // Setup payment blocks
  setupPaymentBlock({
    statusId: 'paymentStatus',
    methodId: 'paymentMethod',
    splitId: 'registerPaymentSplit',
    cashId: 'registerCashPaid',
    transferId: 'registerTransferPaid',
    hintId: 'registerDebtHint',
    getTotal: () => parseVnd(document.getElementById('totalPrice')?.value)
  });
  
  setupPaymentBlock({
    statusId: 'renewPaymentStatus',
    methodId: 'renewPaymentMethod',
    splitId: 'renewPaymentSplit',
    cashId: 'renewCashPaid',
    transferId: 'renewTransferPaid',
    hintId: 'renewDebtHint',
    getTotal: () => parseVnd(document.getElementById('renewTotalPrice')?.value)
  });
  
  setupPaymentBlock({
    statusId: 'pendingPaymentStatus',
    methodId: 'pendingPaymentMethod',
    splitId: 'pendingPaymentSplit',
    cashId: 'pendingCashPaid',
    transferId: 'pendingTransferPaid',
    hintId: 'pendingDebtHint',
    getTotal: () => parseVnd(document.getElementById('pendingTotalPrice')?.value)
  });
  
  setupPaymentBlock({
    statusId: 'revPaymentStatus',
    methodId: 'revPaymentMethod',
    splitId: 'revSplit',
    cashId: 'revCashPaid',
    transferId: 'revTransferPaid',
    hintId: 'revDebtHint',
    getTotal: () => parseVnd(document.getElementById('revQuantity')?.value) * parseVnd(document.getElementById('revPrice')?.value)
  });
  
  setupPaymentBlock({
    statusId: 'revUpdatePaymentStatus',
    methodId: 'revUpdatePaymentMethod',
    splitId: 'revUpdateSplit',
    cashId: 'revUpdateCashPaid',
    transferId: 'revUpdateTransferPaid',
    hintId: 'revUpdateDebtHint',
    getTotal: () => 0
  });
  
  setupPaymentBlock({
    statusId: 'ptSinglePaymentStatus',
    methodId: 'ptSinglePaymentMethod',
    splitId: 'ptSinglePaymentSplit',
    cashId: 'ptSingleCashPaid',
    transferId: 'ptSingleTransferPaid',
    hintId: 'ptSingleDebtHint',
    getTotal: () => parseVnd(document.getElementById('ptSinglePrice')?.value)
  });
  
  // Setup PT single session
  const sel = document.getElementById('checkinTrainingType');
  const box = document.getElementById('ptSingleSessionBox');
  const priceBox = document.getElementById('ptSinglePriceBox');
  const chk = document.getElementById('ptPayPerSession');
  const manualInput = document.getElementById('manualInput');
  
  if (sel && box) {
    const toggle = () => {
      const v = sel.value || '';
      box.classList.toggle('hidden', v !== 'PT');
      if (priceBox) priceBox.classList.add('hidden');
      if (chk) chk.checked = false;
      if (typeof refreshPtSinglePayEligibility === 'function') refreshPtSinglePayEligibility();
    };
    sel.addEventListener('change', toggle);
    toggle();
  }
  
  if (chk && priceBox) {
    chk.addEventListener('change', () => {
      priceBox.classList.toggle('hidden', !chk.checked);
    });
  }
  
  if (manualInput) {
    manualInput.addEventListener('input', () => {
      if (typeof refreshPtSinglePayEligibility === 'function') refreshPtSinglePayEligibility();
    });
    manualInput.addEventListener('blur', () => {
      if (typeof refreshPtSinglePayEligibility === 'function') refreshPtSinglePayEligibility();
    });
  }
});

// Export các hàm
window.loadData = loadData;
window.setButtonLoading = setButtonLoading;
window.getStaffName = getStaffName;
window.syncStaffToForms = syncStaffToForms;
window.initStaffName = initStaffName;
window.parseVnd = parseVnd;
window.setupPaymentBlock = setupPaymentBlock;
window.updatePTOptions = updatePTOptions;
window.updatePackageOptions = updatePackageOptions;
window.updateRenewPackageOptions = updateRenewPackageOptions;
window.updateTotalPrice = updateTotalPrice;
