/**
 * config.js - PHIÊN BẢN TỐI ƯU CUỐI CÙNG - TẬP TRUNG XỬ LÝ CORS
 */

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbztNpEjyUAn9tcZCmEsvZFROoriIS8r3fzzQDLmJFz0mBErQOg8MZn-oDRe2gZqhHVCzQ/exec';

// ==================== HÀM GỌI API (TỐI ƯU CORS) ====================
// Sử dụng proxy đáng tin cậy (corsproxy.io)
async function callAPI(action, params = {}) {
  try {
    console.log(`📡 Gọi API: ${action}`);

    const payload = JSON.stringify({ action, params });

    // Dùng proxy để bypass CORS
    const proxyUrl = `https://corsproxy.io/?` + encodeURIComponent(API_BASE_URL);

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        action: action,
        payload: payload
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    const result = JSON.parse(text);

    if (result.success || result.status === 'success') {
      console.log(`✅ API ${action} thành công`);
      return result.data || result;
    } else {
      throw new Error(result.error || result.message || 'Lỗi server');
    }
  } catch (error) {
    console.error(`❌ API Failed [${action}]:`, error.message);
    if (typeof window.showToast === 'function') {
      window.showToast(`Lỗi kết nối: ${error.message}`, 'error');
    }
    throw error;
  }
}

window.callAPI = callAPI;

// ==================== GLOBAL HELPERS ====================
function showGlobalLoading(show, message = 'Đang tải...') {
  let el = document.getElementById('globalLoading');
  if (show) {
    if (!el) {
      el = document.createElement('div');
      el.id = 'globalLoading';
      el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;';
      el.innerHTML = `
        <div style="background:white;padding:25px 40px;border-radius:12px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.4);">
          <div style="margin:0 auto 15px;width:40px;height:40px;border:5px solid #3b82f6;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>
          <p style="margin:0;font-weight:600;">${message}</p>
        </div>`;
      document.body.appendChild(el);
    }
  } else if (el) {
    el.remove();
  }
}

function showToast(message, type = 'info') {
  const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;top:20px;right:20px;z-index:100000;padding:14px 20px;border-radius:8px;color:white;font-weight:600;box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.3);background:${colors[type] || '#3b82f6'};`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Expose tất cả ra window
window.callAPI = callAPI;
window.showGlobalLoading = showGlobalLoading;
window.showToast = showToast;

console.log('✅ Config ALY GYM initialized - Sử dụng dữ liệu thật từ Google Sheet');
