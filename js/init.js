import { apiRunner } from './api.js';
import { setActiveTab, setupTabNavigation, setupDiscountRadioButtons, setupPriceUpdateHandlers, formatMoney } from './utils.js';

export function loadData() {
  apiRunner
    .withSuccessHandler(({ allPackages, pt, students, promotion }) => {
      window.packages = [
        ...(Array.isArray(allPackages?.NonPT) ? allPackages.NonPT : []),
        ...(Array.isArray(allPackages?.PT) ? allPackages.PT : [])
      ];
      window.ptList = pt;
      window.__allStudentsCache = students || []; 
      window.currentPromotion = promotion;
      
      if (typeof window.updatePackageOptions === 'function') window.updatePackageOptions();
      if (typeof window.updateRenewPackageOptions === 'function') window.updateRenewPackageOptions();
      if (typeof window.updatePTOptions === 'function') window.updatePTOptions();
    })
    .withFailureHandler(err => console.error('Lỗi tải dữ liệu:', err))
    .getInitialData();
}

export function setButtonLoading(buttonId, isLoading, loadingText = 'Đang xử lý...') {
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

export function getStaffName() {
  const el = document.getElementById('staffName');
  const v = el ? String(el.value || '').trim() : '';
  return v || 'Lễ tân';
}

export function syncStaffToForms() {
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

export function initStaffName() {
  const el = document.getElementById('staffName');
  if (!el) return;
  try {
    const stored = localStorage.getItem('aly_staff');
    if (stored && !String(el.value || '').trim()) el.value = stored;
  } catch (e) {}
  const save = () => {
    const v = String(el.value || '').trim();
    try { localStorage.setItem('aly_staff', v); } catch (e) {}
    syncStaffToForms();
  };
  el.addEventListener('change', save);
  el.addEventListener('blur', save);
  syncStaffToForms();
}

export function parseVnd(text) {
  return Number(String(text || '').replace(/[^0-9]/g, '')) || 0;
}

export function setupPaymentBlock(cfg) {
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

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  initStaffName();
  loadData();
  setActiveTab('checkIn');
  setupTabNavigation();
  setupDiscountRadioButtons();
  setupPriceUpdateHandlers();
  
  setupPaymentBlock({
    statusId: 'paymentStatus',
    methodId: 'paymentMethod',
    splitId: 'registerPaymentSplit',
    cashId: 'registerCashPaid',
    transferId: 'registerTransferPaid',
    hintId: 'registerDebtHint',
    getTotal: () => parseVnd(document.getElementById('totalPrice')?.value)
  });
  // ... other setupPaymentBlock calls
});
