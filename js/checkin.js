import { apiRunner } from './api.js';
import { showLoading, showError, escapeHtml, formatDDMMYYYY } from './utils.js';
import { getStaffName, setButtonLoading } from './init.js';
import { parseMoney, formatMoney } from './money.js';

export function handleManualCheckIn() {
  const input = document.getElementById('manualInput')?.value.trim() || '';
  submitCheckInCaller(input, 'manual');
}

let __searchTimeout = null;

export function handleManualInputSearch(inputEl) {
  const query = inputEl.value.trim().toLowerCase();
  const suggestionBox = document.getElementById('manualInputSuggestions');
  
  if (query.length < 2) {
    if (suggestionBox) suggestionBox.classList.add('hidden');
    return;
  }

  clearTimeout(__searchTimeout);
  __searchTimeout = setTimeout(() => performSearch(query), 200);
}

function performSearch(query) {
  const suggestionBox = document.getElementById('manualInputSuggestions');
  if (!suggestionBox) return;

  const matches = (window.__allStudentsCache || []).filter(s => 
    s.id.toLowerCase().includes(query) || 
    s.name.toLowerCase().includes(query) || 
    (s.phone && s.phone.includes(query))
  ).slice(0, 10);

  if (matches.length > 0) {
    suggestionBox.innerHTML = matches.map(s => `
      <div class="p-2 hover:bg-blue-100 cursor-pointer border-b last:border-0" onclick="selectStudentSuggestion('${s.id}', '${s.name.replace(/'/g, "\\'")}')">
        <div class="font-bold text-sm">${s.name}</div>
        <div class="text-xs text-gray-500">${s.id} ${s.phone ? ' - ' + s.phone : ''}</div>
      </div>
    `).join('');
    suggestionBox.classList.remove('hidden');
  } else {
    suggestionBox.classList.add('hidden');
  }
}

export function selectStudentSuggestion(id, name) {
  const inputEl = document.getElementById('manualInput');
  const suggestionBox = document.getElementById('manualInputSuggestions');
  if (inputEl) inputEl.value = id;
  if (suggestionBox) suggestionBox.classList.add('hidden');
  
  const trainingTypeEl = document.getElementById('checkinTrainingType');
  if (trainingTypeEl) {
    if (id.startsWith('APT')) {
      trainingTypeEl.value = 'PT';
    } else if (id.startsWith('AG')) {
      trainingTypeEl.value = 'NonPT';
    }
    trainingTypeEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

export function submitCheckInCaller(input, source) {
  if (typeof source === 'undefined') source = 'manual';
  const notificationEl = document.getElementById('checkInNotification');
  if (!notificationEl) return;
  
  const doneEarly = () => {
    setButtonLoading('checkInButton', false);
    if (window.qrScanner && window.qrScanner.__processing) window.qrScanner.__processing = false;
  };

  setButtonLoading('checkInButton', true, 'Đang điểm danh...');
  showLoading('checkInNotification', 'Đang xử lý điểm danh...');

  const upperInput = (input || '').toUpperCase().trim();
  let trainingType = document.getElementById('checkinTrainingType')?.value || '';

  if (!trainingType) {
    notificationEl.innerHTML = '<div class="bg-red-100 text-red-700 p-2 rounded">❗ Vui lòng chọn hình thức tập trước khi điểm danh.</div>';
    doneEarly();
    return;
  }

  const payPerSession = !!document.getElementById('ptPayPerSession')?.checked;
  const payPerSessionAllowed = !document.getElementById('ptPayPerSession')?.disabled;
  const singlePriceStr = document.getElementById('ptSinglePrice')?.value || '';
  const singlePrice = Number((singlePriceStr || '').replace(/[^0-9]/g,'')) || 0;
  
  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('checkInButton', false);
      renderCheckInResult(result);
      if (window.qrScanner && window.qrScanner.__processing) window.qrScanner.__processing = false;
    })
    .withFailureHandler(err => {
      setButtonLoading('checkInButton', false);
      notificationEl.innerHTML = `<div class="bg-red-100 text-red-800 p-2 rounded">❌ Lỗi: ${err.message || err}</div>`;
      if (window.qrScanner && window.qrScanner.__processing) window.qrScanner.__processing = false;
    })
    .submitCheckIn({
      studentId: input,
      phone: input,
      fullName: input,
      trainingType,
      payPerSession: (payPerSession && payPerSessionAllowed),
      singlePrice,
      staff: getStaffName()
    });
}

function renderCheckInResult(result) {
  const box = document.getElementById('checkInNotification');
  if (!box) return;
  
  if (result.error) {
    box.innerHTML = `<div class="bg-red-100 text-red-800 p-3 rounded">❌ ${escapeHtml(result.error)}</div>`;
    return;
  }

  box.innerHTML = `
    <div class="bg-green-50 p-3 rounded shadow text-sm space-y-2">
      <div><strong>🔎 Mã HV:</strong> ${escapeHtml(result.maHV || result.studentId || '')}</div>
      <div><strong>👤 Họ tên:</strong> ${escapeHtml(result.hoTen || result.fullName || '')}</div>
      <div class="mt-2 font-medium">${escapeHtml(result.message || 'Điểm danh thành công')}</div>
    </div>
  `;
}

// Global exposure
window.handleManualCheckIn = handleManualCheckIn;
window.handleManualInputSearch = handleManualInputSearch;
window.selectStudentSuggestion = selectStudentSuggestion;
window.submitCheckInCaller = submitCheckInCaller;
