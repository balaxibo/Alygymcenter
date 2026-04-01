/**
 * File tiện ích chung cho Frontend ALY GYM CENTER
 * Chứa các hàm helper, validation, UI utilities
 */

/**
 * Hiển thị loading message
 * @param {string} elementId - ID của element
 * @param {string} message - Nội dung loading
 */
function showLoading(elementId, message = 'Đang xử lý...') {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="bg-yellow-100 text-yellow-800 p-3 rounded flex items-center gap-2">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
      ${message}
    </div>`;
  }
}

/**
 * Hiển thị success message
 * @param {string} elementId - ID của element
 * @param {string} message - Nội dung message
 */
function showSuccess(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="bg-green-100 text-green-800 p-3 rounded border border-green-300">✅ Thành công ${message}</div>`;
  }
}

/**
 * Hiển thị error message
 * @param {string} elementId - ID của element
 * @param {string} message - Nội dung message
 */
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="bg-red-100 text-red-800 p-3 rounded border border-red-300">❌ ${message}</div>`;
  }
}

/**
 * Validate số điện thoại
 * @param {string} phone - Số điện thoại
 * @returns {boolean} - True nếu hợp lệ
 */
function validatePhone(phone) {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(String(phone || '').replace(/\D/g, ''));
}

/**
 * Validate mã học viên
 * @param {string} studentId - Mã học viên
 * @returns {boolean} - True nếu hợp lệ
 */
function validateStudentId(studentId) {
  return /^AG\d{3,}$/i.test(String(studentId || '')) || /^APT\d{3,}$/i.test(String(studentId || ''));
}

/**
 * Escape HTML để tránh XSS
 * @param {string} str - Chuỗi cần escape
 * @returns {string} - Chuỗi đã escape
 */
function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

/**
 * Format số điện thoại
 * @param {string} phone - Số điện thoại
 * @returns {string} - Số đã format
 */
function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  let cleanPhone = String(phone).trim().replace(/\D/g, '');
  
  if (cleanPhone.length === 9) cleanPhone = '0' + cleanPhone;
  if (cleanPhone.startsWith('84') && cleanPhone.length === 11) cleanPhone = '0' + cleanPhone.substring(2);
  
  return cleanPhone;
}

/**
 * Copy text to clipboard
 * @param {string} elementId - ID của input element
 */
function copyText(elementId) {
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
      setTimeout(() => { 
        el.classList.remove('ring-2','ring-green-500'); 
      }, 1200);
    }).catch(()=>{});
  }
}

/**
 * Paste text from clipboard
 * @param {string} elementId - ID của input element
 */
function pasteText(elementId) {
  const btn = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
  
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(t => {
      const el = document.getElementById(elementId);
      if (el) {
        el.value = (t || '').trim();
        el.classList.add('ring-2','ring-blue-500');
        setTimeout(() => { 
          el.classList.remove('ring-2','ring-blue-500'); 
        }, 1200);
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

/**
 * Convert date sang input value format
 * @param {Date} date - Date object
 * @returns {string} - YYYY-MM-DD
 */
function toDateInputValue(date) {
  const local = new Date(date);
  local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return local.toISOString().split('T')[0];
}

/**
 * Format date sang dd/MM/yyyy
 * @param {Date|string} v - Date hoặc string
 * @returns {string} - dd/MM/yyyy
 */
function formatDDMMYYYY(v) {
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

/**
 * Kích hoạt tab
 * @param {string} tabId - ID của tab
 */
function setActiveTab(tabId) {
  // ẩn tất cả tabs
  document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
  
  // hiển thị tab được chọn
  const el = document.getElementById(tabId + 'Tab');
  if (el) el.style.display = 'block';
  
  // cập nhật button styles
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-blue-700', 'text-white', 'shadow-md');
    btn.classList.add('bg-gray-100', 'text-gray-700', 'shadow');
  });
  
  const activeButton = document.querySelector(`.tab-btn[onclick="setActiveTab('${tabId}')"]`);
  if (activeButton) {
    activeButton.classList.remove('bg-gray-100', 'text-gray-700', 'shadow');
    activeButton.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-blue-700', 'text-white', 'shadow-md');
  }
  
  // Load data cho các tab đặc biệt
  if (tabId === 'alert') {
    if (typeof loadInactiveStudents === 'function') loadInactiveStudents();
  }
  if (tabId === 'revenue') {
    if (typeof onRevenueTabActive === 'function') onRevenueTabActive();
  }
}

/**
 * Setup navigation cho tabs
 */
function setupTabNavigation() {
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const attr = e.target.getAttribute('onclick') || '';
      const m = attr.match(/setActiveTab\('(\w+)'\)/);
      const tabId = m ? m[1] : null;
      if (tabId) setActiveTab(tabId);
    });
  });
}

/**
 * Setup discount radio buttons
 */
function setupDiscountRadioButtons() {
  // Register Tab
  const discountTypeAmount = document.getElementById('discountTypeAmount');
  const discountTypePercent = document.getElementById('discountTypePercent');
  const discountAmountInput = document.getElementById('discountAmount');
  const discountPercentInput = document.getElementById('discountPercent');
  
  if (discountTypeAmount && discountTypePercent) {
    discountTypeAmount.addEventListener('change', function() {
      if (this.checked) {
        if (discountAmountInput) discountAmountInput.disabled = false;
        if (discountPercentInput) { 
          discountPercentInput.disabled = true; 
          discountPercentInput.value = ''; 
        }
        if (typeof recalculateTotal === 'function') recalculateTotal('register');
      }
    });
    
    discountTypePercent.addEventListener('change', function() {
      if (this.checked) {
        if (discountPercentInput) discountPercentInput.disabled = false;
        if (discountAmountInput) { 
          discountAmountInput.disabled = true; 
          discountAmountInput.value = ''; 
        }
        if (typeof recalculateTotal === 'function') recalculateTotal('register');
      }
    });
  }
  
  // Renew Tab - tương tự
  setupRenewDiscountHandlers();
  
  // Pending Tab - tương tự
  setupPendingDiscountHandlers();
}

/**
 * Setup discount handlers cho Renew tab
 */
function setupRenewDiscountHandlers() {
  const renewDiscountTypeAmount = document.getElementById('renewDiscountTypeAmount');
  const renewDiscountTypePercent = document.getElementById('renewDiscountTypePercent');
  const renewDiscountAmountInput = document.getElementById('renewDiscountAmount');
  const renewDiscountPercentInput = document.getElementById('renewDiscountPercent');
  
  if (renewDiscountTypeAmount && renewDiscountTypePercent) {
    renewDiscountTypeAmount.addEventListener('change', function() {
      if (this.checked) {
        if (renewDiscountAmountInput) renewDiscountAmountInput.disabled = false;
        if (renewDiscountPercentInput) { 
          renewDiscountPercentInput.disabled = true; 
          renewDiscountPercentInput.value = ''; 
        }
        if (typeof recalculateTotal === 'function') recalculateTotal('renew');
      }
    });
    
    renewDiscountTypePercent.addEventListener('change', function() {
      if (this.checked) {
        if (renewDiscountPercentInput) renewDiscountPercentInput.disabled = false;
        if (renewDiscountAmountInput) { 
          renewDiscountAmountInput.disabled = true; 
          renewDiscountAmountInput.value = ''; 
        }
        if (typeof recalculateTotal === 'function') recalculateTotal('renew');
      }
    });
  }
}

/**
 * Setup discount handlers cho Pending tab
 */
function setupPendingDiscountHandlers() {
  const pendingDiscountTypeAmount = document.getElementById('pendingDiscountTypeAmount');
  const pendingDiscountTypePercent = document.getElementById('pendingDiscountTypePercent');
  const pendingDiscountAmountInput = document.getElementById('pendingDiscountAmount');
  const pendingDiscountPercentInput = document.getElementById('pendingDiscountPercent');
  
  if (pendingDiscountTypeAmount && pendingDiscountTypePercent) {
    pendingDiscountTypeAmount.addEventListener('change', function() {
      if (this.checked) {
        if (pendingDiscountAmountInput) pendingDiscountAmountInput.disabled = false;
        if (pendingDiscountPercentInput) { 
          pendingDiscountPercentInput.disabled = true; 
          pendingDiscountPercentInput.value = ''; 
        }
        if (typeof recalculateTotal === 'function') recalculateTotal('pending');
      }
    });
    
    pendingDiscountTypePercent.addEventListener('change', function() {
      if (this.checked) {
        if (pendingDiscountPercentInput) pendingDiscountPercentInput.disabled = false;
        if (pendingDiscountAmountInput) { 
          pendingDiscountAmountInput.disabled = true; 
          pendingDiscountAmountInput.value = ''; 
        }
        if (typeof recalculateTotal === 'function') recalculateTotal('pending');
      }
    });
  }
}

/**
 * Setup price update handlers
 */
function setupPriceUpdateHandlers() {
  // Register handlers
  const discountAmountInput = document.getElementById('discountAmount');
  const discountPercentInput = document.getElementById('discountPercent');
  if (discountAmountInput) discountAmountInput.addEventListener('input', () => { 
    if (typeof recalculateTotal === 'function') recalculateTotal('register'); 
  });
  if (discountPercentInput) discountPercentInput.addEventListener('input', () => { 
    if (typeof recalculateTotal === 'function') recalculateTotal('register'); 
  });

  // Renew handlers
  const renewModeRenew = document.getElementById('renewModeRenew');
  const renewModePending = document.getElementById('renewModePending');
  [renewModeRenew, renewModePending].forEach(el => { 
    if (el) el.addEventListener('change', toggleRenewModeFields); 
  });
  
  const issueRenew = document.getElementById('renewIssueMonthCard');
  const segmentRenew = document.getElementById('renewMonthCardSegment');
  const renewDiscountAmountInput = document.getElementById('renewDiscountAmount');
  const renewDiscountPercentInput = document.getElementById('renewDiscountPercent');
  
  if (issueRenew) issueRenew.addEventListener('change', () => { 
    if (typeof recalculateTotal === 'function') recalculateTotal('renew'); 
  });
  if (segmentRenew) segmentRenew.addEventListener('change', () => { 
    if (typeof recalculateTotal === 'function') recalculateTotal('renew'); 
  });
  if (renewDiscountAmountInput) renewDiscountAmountInput.addEventListener('input', () => { 
    if (typeof recalculateTotal === 'function') recalculateTotal('renew'); 
  });
  if (renewDiscountPercentInput) renewDiscountPercentInput.addEventListener('input', () => { 
    if (typeof recalculateTotal === 'function') recalculateTotal('renew'); 
  });

  // Pending handlers
  const issuePending = document.getElementById('pendingIssueMonthCard');
  const segmentPending = document.getElementById('pendingMonthCardSegment');
  const pendingDiscountAmountInput = document.getElementById('pendingDiscountAmount');
  const pendingDiscountPercentInput = document.getElementById('pendingDiscountPercent');
  
  if (issuePending) issuePending.addEventListener('change', () => { 
    if (typeof recalculateTotal === 'function') recalculateTotal('pending'); 
  });
  if (segmentPending) segmentPending.addEventListener('change', () => { 
    if (typeof recalculateTotal === 'function') recalculateTotal('pending'); 
  });
  if (pendingDiscountAmountInput) pendingDiscountAmountInput.addEventListener('input', () => { 
    if (typeof recalculateTotal === 'function') recalculateTotal('pending'); 
  });
  if (pendingDiscountPercentInput) pendingDiscountPercentInput.addEventListener('input', () => { 
    if (typeof recalculateTotal === 'function') recalculateTotal('pending'); 
  });
}

// Export các hàm
window.showLoading = showLoading;
window.showSuccess = showSuccess;
window.showError = showError;
window.validatePhone = validatePhone;
window.validateStudentId = validateStudentId;
window.escapeHtml = escapeHtml;
window.formatPhoneNumber = formatPhoneNumber;
window.copyText = copyText;
window.pasteText = pasteText;
window.toDateInputValue = toDateInputValue;
window.formatDDMMYYYY = formatDDMMYYYY;
window.setActiveTab = setActiveTab;
window.setupTabNavigation = setupTabNavigation;
window.setupDiscountRadioButtons = setupDiscountRadioButtons;
window.setupPriceUpdateHandlers = setupPriceUpdateHandlers;
