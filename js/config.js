/**
 * File cấu hình cho Frontend ALY GYM CENTER
 * Chứa API endpoint và các hàm tiện ích chung
 */

// Cấu hình API
const API_CONFIG = {
  // URL của Google Apps Script Web App
  // Thay đổi URL này khi deploy backend
  BASE_URL: 'https://script.google.com/macros/s/AKfycbzP6EHg7LVnw5WeXvsSZ4JZS2Itid5cl7EZkGpl4cr4_q10zibCuMFSW0UuTOEvz7rC/exec',
  
  // Timeout cho request (ms)
  TIMEOUT: 30000,
  
  // Số lần retry tối đa
  MAX_RETRIES: 3
};

// Fallback data khi API không hoạt động
const FALLBACK_DATA = {
  packages: {
    NonPT: [
      { code: 'GYM001', sessions: 10, price: 1500000, type: 'Gym_NonPT' },
      { code: 'GYM002', sessions: 20, price: 2500000, type: 'Gym_NonPT' },
      { code: 'GYM003', sessions: 30, price: 3500000, type: 'Gym_NonPT' }
    ],
    PT: [
      { code: 'PT1:1-001', sessions: 10, price: 5000000, type: 'Gym_PT' },
      { code: 'PT1:1-002', sessions: 20, price: 9000000, type: 'Gym_PT' },
      { code: 'PT2:1-001', sessions: 10, price: 3000000, type: 'Gym_PT' }
    ]
  },
  ptList: [
    { code: 'PT001', name: 'Nguyễn Văn A' },
    { code: 'PT002', name: 'Trần Thị B' },
    { code: 'PT003', name: 'Lê Văn C' }
  ]
};

/**
 * Hàm gọi API đến backend GAS
 * @param {string} action - Tên action cần gọi
 * @param {Object} params - Tham số gửi đi
 * @returns {Promise} - Promise với kết quả từ API
 */
async function callAPI(action, params = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(API_CONFIG.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: action,
        params: params,
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Kiểm tra lỗi từ backend
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Vui lòng thử lại.');
    }
    
    // Log lỗi để debug
    console.error(`API Error (${action}):`, error);
    
    throw error;
  }
}

/**
 * Hiển thị toast notification
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo: success, error, warning, info
 * @param {number} duration - Thời gian hiển thị (ms)
 */
function showToast(message, type = 'info', duration = 3000) {
  // Tạo toast container nếu chưa có
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(toastContainer);
  }
  
  // Tạo toast element
  const toast = document.createElement('div');
  const toastId = 'toast-' + Date.now();
  toast.id = toastId;
  
  // Cấu hình styles theo type
  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-blue-500 text-white'
  };
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.className = `${typeStyles[type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[250px] max-w-md animate-pulse`;
  toast.innerHTML = `
    <span class="text-lg">${icons[type]}</span>
    <span class="flex-1">${message}</span>
    <button onclick="removeToast('${toastId}')" class="ml-2 hover:opacity-70">×</button>
  `;
  
  // Thêm vào container
  toastContainer.appendChild(toast);
  
  // Tự động remove sau duration
  setTimeout(() => {
    removeToast(toastId);
  }, duration);
}

/**
 * Remove toast element
 * @param {string} toastId - ID của toast cần remove
 */
function removeToast(toastId) {
  const toast = document.getElementById(toastId);
  if (toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
}

/**
 * Hiển thị loading state
 * @param {boolean} show - Hiển thị/ẩn loading
 * @param {string} message - Nội dung loading
 */
function showGlobalLoading(show, message = 'Đang xử lý...') {
  let loadingOverlay = document.getElementById('global-loading');
  
  if (show) {
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'global-loading';
      loadingOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      loadingOverlay.innerHTML = `
        <div class="bg-white rounded-lg p-6 flex items-center gap-3 shadow-xl">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="text-gray-700">${message}</span>
        </div>
      `;
      document.body.appendChild(loadingOverlay);
    } else {
      loadingOverlay.querySelector('span').textContent = message;
      loadingOverlay.style.display = 'flex';
    }
  } else {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
}

/**
 * Format tiền tệ VNĐ
 * @param {number} amount - Số tiền
 * @param {boolean} showSymbol - Hiển thị符号 VNĐ
 * @returns {string} - Chuỗi đã format
 */
function formatMoney(amount, showSymbol = true) {
  if (typeof amount !== 'number') {
    amount = Number(String(amount || '').replace(/[^0-9]/g, '')) || 0;
  }
  const formatted = amount.toLocaleString('vi-VN');
  return showSymbol ? `${formatted} VNĐ` : formatted;
}

/**
 * Xử lý input tiền tệ
 * @param {HTMLInputElement} input - Input element
 */
function handleMoneyInput(input) {
  if (!input) return;
  
  let value = String(input.value || '').replace(/[^0-9]/g, '');
  if (value) {
    input.value = formatMoney(Number(value), false);
  } else {
    input.value = '';
  }
  
  // Trigger event để các hàm khác có thể lắng nghe
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Format số điện thoại về 10 số
 * @param {string} phone - Số điện thoại
 * @returns {string} - Số đã format
 */
function normalizePhone10(phone) {
  if (!phone) return '';
  let cleanPhone = String(phone).replace(/\D/g, '');
  
  // Xóa số 84 ở đầu
  if (cleanPhone.startsWith('84') && cleanPhone.length === 11) {
    cleanPhone = cleanPhone.substring(2);
  }
  
  // Thêm số 0 nếu thiếu
  if (cleanPhone.length === 9) {
    cleanPhone = '0' + cleanPhone;
  }
  
  return cleanPhone;
}

/**
 * Format ngày tháng
 * @param {Date|string} date - Ngày cần format
 * @returns {string} - Chuỗi dd/MM/yyyy
 */
function formatDate(date) {
  if (!date) return '';
  
  let d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Kiểm tra xem ngày có hợp lệ không
 * @param {Date|string} date - Ngày cần kiểm tra
 * @returns {boolean} - True nếu hợp lệ
 */
function isValidDate(date) {
  if (!date) return false;
  
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Escape HTML để tránh XSS
 * @param {string} str - Chuỗi cần escape
 * @returns {string} - Chuỗi đã escape
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Export các hàm global
window.callAPI = callAPI;
window.showToast = showToast;
window.removeToast = removeToast;
window.showGlobalLoading = showGlobalLoading;
window.formatMoney = formatMoney;
window.handleMoneyInput = handleMoneyInput;
window.normalizePhone10 = normalizePhone10;
window.formatDate = formatDate;
window.isValidDate = isValidDate;
window.escapeHtml = escapeHtml;

// Log khởi tạo
console.log('Frontend ALY GYM initialized');
