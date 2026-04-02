// config.js - PHIÊN BẢN ĐÃ SỬA HOÀN TOÀN

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycby7G2z1ff_4KLy3iXrwo5oHTXqxp0ghNXJERJ9tLZVn323SDQNB3TWnWtSxg9HBAntd/exec';

// ==================== HÀM GỌI API ====================
async function callAPI(action, params = {}) {
  try {
    console.log(`📡 Gọi API: ${action}`);

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({ action, params })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    const result = JSON.parse(text);

    if (result.success === true || result.status === 'success') {
      console.log(`✅ API ${action} thành công`);
      return result.data || result;
    } else {
      throw new Error(result.error || result.message || 'Lỗi server');
    }
  } catch (error) {
    console.error(`❌ API Failed [${action}]:`, error.message);
    if (typeof window.showToast === 'function') {
      window.showToast(`Lỗi kết nối server: ${error.message}`, 'error');
    }
    throw error;
  }
}

// ==================== CÁC HÀM GLOBAL ====================
function showGlobalLoading(show, message = 'Đang tải...') {
  let el = document.getElementById('globalLoading');
  if (show) {
    if (!el) {
      el = document.createElement('div');
      el.id = 'globalLoading';
      el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
      el.innerHTML = `
        <div style="background:white;padding:25px 40px;border-radius:12px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.3);">
          <div class="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p style="margin:0;font-weight:600;color:#1f2937;">${message}</p>
        </div>`;
      document.body.appendChild(el);
    }
  } else if (el) {
    el.remove();
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
  toast.style.cssText = `position:fixed;top:20px;right:20px;z-index:10000;padding:14px 20px;border-radius:8px;color:white;font-weight:600;box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.2);background:${colors[type] || colors.info};`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3200);
}

// Expose ra window
window.callAPI = callAPI;
window.showGlobalLoading = showGlobalLoading;
window.showToast = showToast;

console.log('✅ Config ALY GYM initialized successfully');
