export function showLoading(elementId, message) {
  if (typeof message === 'undefined') message = 'Đang xử lý...';
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="bg-yellow-100 text-yellow-800 p-3 rounded flex items-center gap-2">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
      ${message}
    </div>`;
  }
}

export function showSuccess(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="bg-green-100 text-green-800 p-3 rounded border border-green-300">✅ Thành công ${message}</div>`;
  }
}

export function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="bg-red-100 text-red-800 p-3 rounded border border-red-300">❌ ${message}</div>`;
  }
}

export function validatePhone(phone) {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(String(phone || '').replace(/\D/g, ''));
}

export function validateStudentId(studentId) {
  return /^AG\d{3,}$/i.test(String(studentId || '')) || /^APT\d{3,}$/i.test(String(studentId || ''));
}

export function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

export function formatPhoneNumber(phone) {
  if (!phone) return '';
  let cleanPhone = String(phone).trim().replace(/\D/g, '');
  if (cleanPhone.length === 9) cleanPhone = '0' + cleanPhone;
  if (cleanPhone.startsWith('84') && cleanPhone.length === 11) cleanPhone = '0' + cleanPhone.substring(2);
  return cleanPhone;
}

export function copyText(elementId) {
  const el = document.getElementById(elementId);
  const btn = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
  if (el && el.value && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(el.value).then(() => {
      if (btn) {
        btn.disabled = true;
        btn.classList.add('bg-blue-100','text-gray-400','cursor-not-allowed');
        setTimeout(() => {
          btn.disabled = false;
          btn.classList.remove('bg-blue-100','text-gray-400','cursor-not-allowed');
        }, 1200);
      }
      el.classList.add('ring-2','ring-green-500');
      setTimeout(() => { el.classList.remove('ring-2','ring-green-500'); }, 1200);
    }).catch(()=>{});
  }
}

export function pasteText(elementId) {
  const btn = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(t => {
      const el = document.getElementById(elementId);
      if (el) {
        el.value = (t || '').trim();
        el.classList.add('ring-2','ring-blue-500');
        setTimeout(() => { el.classList.remove('ring-2','ring-blue-500'); }, 1200);
      }
      if (btn) {
        btn.disabled = true;
        btn.classList.add('bg-blue-100','text-gray-400','cursor-not-allowed');
        setTimeout(() => {
          btn.disabled = false;
          btn.classList.remove('bg-blue-100','text-gray-400','cursor-not-allowed');
        }, 1200);
      }
    }).catch(()=>{});
  }
}

export function toDateInputValue(date) {
  const local = new Date(date);
  local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return local.toISOString().split('T')[0];
}

export function formatDDMMYYYY(v) {
  if (!v) return '';
  if (v instanceof Date && !isNaN(v)) {
    const d = String(v.getDate()).padStart(2,'0');
    const m = String(v.getMonth()+1).padStart(2,'0');
    const y = v.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const s = String(v);
  const dObj = new Date(s);
  if (!isNaN(dObj)) return formatDDMMYYYY(dObj);
  return s;
}

export function setActiveTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
  const el = document.getElementById(tabId + 'Tab');
  if (el) el.style.display = 'block';
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.classList.remove('bg-blue-700', 'text-white');
    btn.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
  });
  const activeButton = document.querySelector(`.tabs button[onclick="setActiveTab('${tabId}')"]`);
  if (activeButton) {
    activeButton.classList.remove('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
    activeButton.classList.add('bg-blue-700', 'text-white');
  }
  if (tabId === 'alert') {
    if (typeof window.loadInactiveStudents === 'function') window.loadInactiveStudents();
  }
  if (tabId === 'revenue') {
    if (typeof window.onRevenueTabActive === 'function') window.onRevenueTabActive();
  }
}

export function setupTabNavigation() {
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const attr = e.target.getAttribute('onclick') || '';
      const m = attr.match(/setActiveTab\('(\w+)'\)/);
      const tabId = m ? m[1] : null;
      if (tabId) setActiveTab(tabId);
    });
  });
}

export function setupDiscountRadioButtons() {
  const discountTypeAmount = document.getElementById('discountTypeAmount');
  const discountTypePercent = document.getElementById('discountTypePercent');
  const discountAmountInput = document.getElementById('discountAmount');
  const discountPercentInput = document.getElementById('discountPercent');
  if (discountTypeAmount && discountTypePercent) {
    discountTypeAmount.addEventListener('change', function() {
      if (this.checked) {
        if (discountAmountInput) discountAmountInput.disabled = false;
        if (discountPercentInput) { discountPercentInput.disabled = true; discountPercentInput.value = ''; }
        if (typeof window.recalculateTotal === 'function') window.recalculateTotal('register');
      }
    });
    discountTypePercent.addEventListener('change', function() {
      if (this.checked) {
        if (discountPercentInput) discountPercentInput.disabled = false;
        if (discountAmountInput) { discountAmountInput.disabled = true; discountAmountInput.value = ''; }
        if (typeof window.recalculateTotal === 'function') window.recalculateTotal('register');
      }
    });
  }
  // Renew Tab Discount Handlers
  const renewDiscountTypeAmount = document.getElementById('renewDiscountTypeAmount');
  const renewDiscountTypePercent = document.getElementById('renewDiscountTypePercent');
  const renewDiscountAmountInput = document.getElementById('renewDiscountAmount');
  const renewDiscountPercentInput = document.getElementById('renewDiscountPercent');
  if (renewDiscountTypeAmount && renewDiscountTypePercent) {
    renewDiscountTypeAmount.addEventListener('change', function() {
      if (this.checked) {
        if (renewDiscountAmountInput) renewDiscountAmountInput.disabled = false;
        if (renewDiscountPercentInput) { renewDiscountPercentInput.disabled = true; renewDiscountPercentInput.value = ''; }
        if (typeof window.recalculateTotal === 'function') window.recalculateTotal('renew');
      }
    });
    renewDiscountTypePercent.addEventListener('change', function() {
      if (this.checked) {
        if (renewDiscountPercentInput) renewDiscountPercentInput.disabled = false;
        if (renewDiscountAmountInput) { renewDiscountAmountInput.disabled = true; renewDiscountAmountInput.value = ''; }
        if (typeof window.recalculateTotal === 'function') window.recalculateTotal('renew');
      }
    });
  }

  // Pending Tab Discount Handlers
  const pendingDiscountTypeAmount = document.getElementById('pendingDiscountTypeAmount');
  const pendingDiscountTypePercent = document.getElementById('pendingDiscountTypePercent');
  const pendingDiscountAmountInput = document.getElementById('pendingDiscountAmount');
  const pendingDiscountPercentInput = document.getElementById('pendingDiscountPercent');
  if (pendingDiscountTypeAmount && pendingDiscountTypePercent) {
    pendingDiscountTypeAmount.addEventListener('change', function() {
      if (this.checked) {
        if (pendingDiscountAmountInput) pendingDiscountAmountInput.disabled = false;
        if (pendingDiscountPercentInput) { pendingDiscountPercentInput.disabled = true; pendingDiscountPercentInput.value = ''; }
        if (typeof window.recalculateTotal === 'function') window.recalculateTotal('pending');
      }
    });
    pendingDiscountTypePercent.addEventListener('change', function() {
      if (this.checked) {
        if (pendingDiscountPercentInput) pendingDiscountPercentInput.disabled = false;
        if (pendingDiscountAmountInput) { pendingDiscountAmountInput.disabled = true; pendingDiscountAmountInput.value = ''; }
        if (typeof window.recalculateTotal === 'function') window.recalculateTotal('pending');
      }
    });
  }
}

export function setupPriceUpdateHandlers() {
  // Register handlers
  const discountAmountInput = document.getElementById('discountAmount');
  const discountPercentInput = document.getElementById('discountPercent');
  if (discountAmountInput) discountAmountInput.addEventListener('input', () => { if (typeof window.recalculateTotal === 'function') window.recalculateTotal('register'); });
  if (discountPercentInput) discountPercentInput.addEventListener('input', () => { if (typeof window.recalculateTotal === 'function') window.recalculateTotal('register'); });

  // Renew handlers
  const renewModeRenew = document.getElementById('renewModeRenew');
  const renewModePending = document.getElementById('renewModePending');
  [renewModeRenew, renewModePending].forEach(el => { if (el) el.addEventListener('change', () => { if (typeof window.toggleRenewModeFields === 'function') window.toggleRenewModeFields(); }); });
  
  const issueRenew = document.getElementById('renewIssueMonthCard');
  const segmentRenew = document.getElementById('renewMonthCardSegment');
  const renewDiscountAmountInput = document.getElementById('renewDiscountAmount');
  const renewDiscountPercentInput = document.getElementById('renewDiscountPercent');
  
  if (issueRenew) issueRenew.addEventListener('change', () => { if (typeof window.recalculateTotal === 'function') window.recalculateTotal('renew'); });
  if (segmentRenew) segmentRenew.addEventListener('change', () => { if (typeof window.recalculateTotal === 'function') window.recalculateTotal('renew'); });
  if (renewDiscountAmountInput) renewDiscountAmountInput.addEventListener('input', () => { if (typeof window.recalculateTotal === 'function') window.recalculateTotal('renew'); });
  if (renewDiscountPercentInput) renewDiscountPercentInput.addEventListener('input', () => { if (typeof window.recalculateTotal === 'function') window.recalculateTotal('renew'); });

  // Pending handlers
  const issuePending = document.getElementById('pendingIssueMonthCard');
  const segmentPending = document.getElementById('pendingMonthCardSegment');
  const pendingDiscountAmountInput = document.getElementById('pendingDiscountAmount');
  const pendingDiscountPercentInput = document.getElementById('pendingDiscountPercent');
  
  if (issuePending) issuePending.addEventListener('change', () => { if (typeof window.recalculateTotal === 'function') window.recalculateTotal('pending'); });
  if (segmentPending) segmentPending.addEventListener('change', () => { if (typeof window.recalculateTotal === 'function') window.recalculateTotal('pending'); });
  if (pendingDiscountAmountInput) pendingDiscountAmountInput.addEventListener('input', () => { if (typeof window.recalculateTotal === 'function') window.recalculateTotal('pending'); });
  if (pendingDiscountPercentInput) pendingDiscountPercentInput.addEventListener('input', () => { if (typeof window.recalculateTotal === 'function') window.recalculateTotal('pending'); });
}
