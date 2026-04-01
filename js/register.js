/**
 * File xử lý Đăng ký học viên cho Frontend ALY GYM CENTER
 */

/**
 * Submit đăng ký học viên mới
 */
async function submitRegistration() {
  try {
    // Lấy dữ liệu từ form
    const formData = getRegistrationFormData();
    
    // Validate dữ liệu
    const validation = validateRegistrationData(formData);
    if (!validation.isValid) {
      showToast(validation.message, 'error');
      return;
    }
    
    // Hiển thị loading
    setButtonLoading('submitRegisterBtn', true, 'Đang đăng ký...');
    showGlobalLoading(true, 'Đang xử lý đăng ký học viên...');
    
    // Gọi API
    const response = await callAPI('registerStudent', formData);
    
    if (response.success) {
      // Hiển thị kết quả
      showRegistrationSuccess(response.data);
      
      // Reset form
      resetRegisterForm();
      
      showToast('Đăng ký học viên thành công!', 'success');
      
    } else {
      throw new Error(response.error || 'Đăng ký thất bại');
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    showToast(error.message || 'Có lỗi xảy ra khi đăng ký', 'error', 5000);
    showRegistrationError(error.message);
  } finally {
    setButtonLoading('submitRegisterBtn', false);
    showGlobalLoading(false);
  }
}

/**
 * Lấy dữ liệu từ form đăng ký
 * @returns {Object} - Form data
 */
function getRegistrationFormData() {
  return {
    name: document.getElementById('regName')?.value?.trim() || '',
    phone: normalizePhone10(document.getElementById('regPhone')?.value || ''),
    dob: document.getElementById('regDob')?.value || '',
    address: document.getElementById('regAddress')?.value?.trim() || '',
    trainingType: document.getElementById('trainingType')?.value || '',
    packageCode: document.getElementById('packageCode')?.value || '',
    ptCode: document.getElementById('ptCode')?.value || '',
    startDate: document.getElementById('regStartDate')?.value || '',
    totalPrice: parseVnd(document.getElementById('totalPrice')?.value || '0'),
    paymentStatus: document.getElementById('paymentStatus')?.value || 'Chưa thanh toán',
    paymentMethod: document.getElementById('paymentMethod')?.value || '',
    cashPaid: parseVnd(document.getElementById('registerCashPaid')?.value || '0'),
    transferPaid: parseVnd(document.getElementById('registerTransferPaid')?.value || '0'),
    notes: document.getElementById('regNotes')?.value?.trim() || '',
    staffName: getStaffName(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Validate dữ liệu đăng ký
 * @param {Object} data - Dữ liệu cần validate
 * @returns {Object} - Kết quả validation
 */
function validateRegistrationData(data) {
  // Kiểm tra các trường bắt buộc
  if (!data.name) {
    return { isValid: false, message: 'Vui lòng nhập họ tên học viên' };
  }
  
  if (!data.phone) {
    return { isValid: false, message: 'Vui lòng nhập số điện thoại' };
  }
  
  if (!validatePhone(data.phone)) {
    return { isValid: false, message: 'Số điện thoại không hợp lệ' };
  }
  
  if (!data.trainingType) {
    return { isValid: false, message: 'Vui lòng chọn hình thức tập' };
  }
  
  if (!data.packageCode) {
    return { isValid: false, message: 'Vui lòng chọn gói tập' };
  }
  
  if (data.trainingType.startsWith('PT') && !data.ptCode) {
    return { isValid: false, message: 'Vui lòng chọn huấn luyện viên' };
  }
  
  if (!data.startDate) {
    return { isValid: false, message: 'Vui lòng chọn ngày bắt đầu' };
  }
  
  if (!isValidDate(data.startDate)) {
    return { isValid: false, message: 'Ngày bắt đầu không hợp lệ' };
  }
  
  if (data.paymentStatus !== 'Chưa thanh toán' && !data.paymentMethod) {
    return { isValid: false, message: 'Vui lòng chọn hình thức thanh toán' };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Hiển thị kết quả đăng ký thành công
 * @param {Object} data - Dữ liệu trả về từ API
 */
function showRegistrationSuccess(data) {
  const notificationEl = document.getElementById('registerNotification');
  if (!notificationEl) return;
  
  notificationEl.innerHTML = `
    <div class="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">✅</span>
        <span class="font-bold text-lg">Đăng ký thành công!</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <strong>Mã học viên:</strong> ${escapeHtml(data.studentCode || '')}<br>
          <strong>Họ tên:</strong> ${escapeHtml(data.name || '')}<br>
          <strong>SĐT:</strong> ${escapeHtml(data.phone || '')}<br>
          <strong>Hình thức:</strong> ${escapeHtml(data.trainingType || '')}
        </div>
        <div>
          <strong>Gói tập:</strong> ${escapeHtml(data.packageCode || '')}<br>
          <strong>Số buổi:</strong> ${data.sessions || 0}<br>
          <strong>Hạn dùng:</strong> ${formatDDMMYYYY(data.expiryDate) || ''}<br>
          <strong>Tổng tiền:</strong> ${formatMoney(data.totalPrice || 0, true)}
        </div>
      </div>
      ${data.qrCode ? `
        <div class="mt-3 p-3 bg-white rounded border border-green-300 text-center">
          <div class="text-xs text-gray-600 mb-1">Mã QR cho học viên:</div>
          <div class="font-mono text-lg font-bold text-blue-600">${data.qrCode}</div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Hiển thị lỗi đăng ký
 * @param {string} errorMessage - Thông báo lỗi
 */
function showRegistrationError(errorMessage) {
  const notificationEl = document.getElementById('registerNotification');
  if (!notificationEl) return;
  
  notificationEl.innerHTML = `
    <div class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
      <div class="flex items-center gap-2">
        <span class="text-2xl">❌</span>
        <span class="font-bold">Đăng ký thất bại</span>
      </div>
      <div class="text-sm mt-2">${escapeHtml(errorMessage || 'Có lỗi xảy ra')}</div>
    </div>
  `;
}

/**
 * Reset form đăng ký
 */
function resetRegisterForm() {
  const form = document.getElementById('registerForm');
  if (form) {
    form.reset();
  }
  
  // Reset các field đặc biệt
  document.getElementById('totalPrice').value = '0 VNĐ';
  document.getElementById('registerPaymentSplit').classList.add('hidden');
  document.getElementById('registerCashPaid').value = '';
  document.getElementById('registerTransferPaid').value = '';
  document.getElementById('registerDebtHint').textContent = '';
  
  // Ẩn PT code container
  document.getElementById('ptCodeContainer').style.display = 'none';
  
  // Clear notification
  document.getElementById('registerNotification').innerHTML = '';
  
  // Reset package options
  updatePackageOptions();
}

/**
 * Update PT code container visibility
 */
function updatePTCodeContainer() {
  const trainingType = document.getElementById('trainingType')?.value || '';
  const container = document.getElementById('ptCodeContainer');
  
  if (container) {
    container.style.display = trainingType.startsWith('PT') ? 'block' : 'none';
    
    if (trainingType.startsWith('PT')) {
      const ptCode = document.getElementById('ptCode');
      if (ptCode && !ptCode.value) {
        ptCode.value = '';
      }
    }
  }
}

/**
 * Validate mã học viên trùng lặp
 * @param {string} phone - Số điện thoại
 * @returns {Promise<boolean>} - True nếu trùng
 */
async function checkDuplicateStudent(phone) {
  try {
    const response = await callAPI('validateStudentCode', { phone: phone });
    return response.success && response.data.exists;
  } catch (error) {
    console.error('Error checking duplicate student:', error);
    return false;
  }
}

/**
 * Auto-generate student code based on training type
 * @param {string} trainingType - Hình thức tập
 * @returns {string} - Mã học viên
 */
function generateStudentCode(trainingType) {
  const prefix = trainingType.startsWith('PT') ? 'APT' : 'AG';
  const random = Math.floor(Math.random() * 9000) + 1000;
  return prefix + random;
}

/**
 * Setup form validation và events
 */
document.addEventListener('DOMContentLoaded', () => {
  // Training type change event
  const trainingTypeEl = document.getElementById('trainingType');
  if (trainingTypeEl) {
    trainingTypeEl.addEventListener('change', () => {
      updatePTCodeContainer();
      updatePackageOptions();
    });
  }
  
  // Phone validation
  const phoneEl = document.getElementById('regPhone');
  if (phoneEl) {
    phoneEl.addEventListener('blur', async () => {
      const phone = normalizePhone10(phoneEl.value);
      if (phone && validatePhone(phone)) {
        const isDuplicate = await checkDuplicateStudent(phone);
        if (isDuplicate) {
          showToast('Số điện thoại đã được đăng ký', 'warning');
        }
      }
    });
  }
  
  // Package code change event
  const packageCodeEl = document.getElementById('packageCode');
  if (packageCodeEl) {
    packageCodeEl.addEventListener('change', updateTotalPrice);
  }
  
  // Payment method change event
  const paymentMethodEl = document.getElementById('paymentMethod');
  if (paymentMethodEl) {
    paymentMethodEl.addEventListener('change', () => {
      const splitEl = document.getElementById('registerPaymentSplit');
      if (paymentMethodEl.value === 'Tiền mặt + Chuyển khoản') {
        splitEl.classList.remove('hidden');
      } else {
        splitEl.classList.add('hidden');
        document.getElementById('registerCashPaid').value = '';
        document.getElementById('registerTransferPaid').value = '';
      }
    });
  }
  
  // Initialize
  updatePTCodeContainer();
});

// Export các hàm
window.submitRegistration = submitRegistration;
window.getRegistrationFormData = getRegistrationFormData;
window.validateRegistrationData = validateRegistrationData;
window.showRegistrationSuccess = showRegistrationSuccess;
window.showRegistrationError = showRegistrationError;
window.resetRegisterForm = resetRegisterForm;
window.updatePTCodeContainer = updatePTCodeContainer;
window.checkDuplicateStudent = checkDuplicateStudent;
window.generateStudentCode = generateStudentCode;

console.log('Register module loaded');
