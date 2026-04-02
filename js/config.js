/**
 * File cấu hình cho Frontend ALY GYM CENTER
 * Chứa API endpoint và các hàm tiện ích chung
 */

// Cấu hình API
const API_CONFIG = {
  // URL của Google Apps Script Web App
  // Thay đổi URL này khi deploy backend
  BASE_URL: 'https://script.google.com/macros/s/AKfycby7G2z1ff_4KLy3iXrwo5oHTXqxp0ghNXJERJ9tLZVn323SDQNB3TWnWtSxg9HBAntd/exec',
  
  // Timeout cho request (ms)
  TIMEOUT: 30000,
  
  // Số lần retry tối đa
  MAX_RETRIES: 3
};

// Fallback data khi API không hoạt động (dựa trên CSV structure)
const FALLBACK_DATA = {
  packages: {
    NonPT: [
      { code: 'Basic', sessions: 26, price: 200000, type: 'Gym_NonPT', name: 'Basic' },
      { code: 'VIP1', sessions: 78, price: 600000, type: 'Gym_NonPT', name: 'VIP1' },
      { code: 'VIP2', sessions: 156, price: 1200000, type: 'Gym_NonPT', name: 'VIP2' },
      { code: 'Basic_Out', sessions: 26, price: 250000, type: 'Gym_NonPT', name: 'Basic_Out' },
      { code: 'VIP1_Out', sessions: 78, price: 750000, type: 'Gym_NonPT', name: 'VIP1_Out' },
      { code: 'VIP2_Out', sessions: 156, price: 1500000, type: 'Gym_NonPT', name: 'VIP2_Out' }
    ],
    PT: [
      { code: 'PT1:1:10', sessions: 10, price: 2500000, type: 'Gym_PT', name: 'PT1:1 - 10 buổi' },
      { code: 'PT1:1:20', sessions: 20, price: 4000000, type: 'Gym_PT', name: 'PT1:1 - 20 buổi' },
      { code: 'PT1:1:30', sessions: 30, price: 6000000, type: 'Gym_PT', name: 'PT1:1 - 30 buổi' }
    ]
  },
  ptList: [
    { code: 'PT002', name: 'Quang Thành', phone: '' }
  ]
};

// Make FALLBACK_DATA global
window.FALLBACK_DATA = FALLBACK_DATA;



/**
 * Hàm gọi API đến backend GAS
 * @param {string} action - Tên action cần gọi
 * @param {Object} params - Tham số gửi đi
 * @returns {Promise} - Promise với kết quả từ API
 */
/**
 * Hiển thị/ẩn trạng thái loading toàn màn hình
 * @param {boolean} show - Hiển thị/ẩn
 * @param {string} message - Thông báo
 */
function showGlobalLoading(show, message = 'Đang xử lý...') {
  let loadingElement = document.getElementById('globalLoading');
  
  if (show) {
    if (!loadingElement) {
      loadingElement = document.createElement('div');
      loadingElement.id = 'globalLoading';
      loadingElement.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; 
                    justify-content: center; z-index: 9999;">
          <div style="background: white; padding: 30px; border-radius: 10px; 
                      text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <div class="loading-spinner" style="margin: 0 auto 15px;"></div>
            <p style="margin: 0; font-weight: bold;">${message}</p>
          </div>
        </div>
      `;
      document.body.appendChild(loadingElement);
    }
  } else {
    if (loadingElement) {
      loadingElement.remove();
    }
  }
}

/**
 * Hiển thị thông báo toast
 * @param {string} message - Thông báo
 * @param {string} type - Loại thông báo (success, error, warning, info)
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    padding: 15px 20px; border-radius: 5px; color: white;
    font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: all 0.3s ease; max-width: 300px;
  `;
  
  // Set màu theo type
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };
  toast.style.background = colors[type] || colors.info;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Auto remove sau 3 giây
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Make functions global
window.showGlobalLoading = showGlobalLoading;
window.showToast = showToast;

export async function callAPI(action, params = {}) {
  try {
    const payload = JSON.stringify({ action, params });

    const response = await fetch(API_CONFIG.BASE_URL, {
      method: 'POST',
      // mode: 'cors',                    // Có thể bỏ hoặc giữ
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'   // ← RẤT QUAN TRỌNG: Tránh preflight
      },
      body: payload
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      throw new Error('Server trả về không phải JSON');
    }

    if (result.success === true || result.status === 'success') {
      return result.data || result;
    } else {
      throw new Error(result.error || result.message || 'Lỗi không xác định từ server');
    }
  } catch (error) {
    console.error(`❌ API Failed [${action}]:`, error.message);
    if (typeof window.showToast === 'function') {
      window.showToast(`Không kết nối được server: ${error.message}`, 'error');
    }
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
