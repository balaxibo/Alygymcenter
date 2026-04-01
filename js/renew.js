/**
 * File xử lý Gia hạn gói tập cho Frontend ALY GYM CENTER
 */

/**
 * Tìm kiếm học viên để gia hạn
 */
async function searchStudentForRenew() {
  try {
    const searchQuery = document.getElementById('searchStudentId')?.value?.trim() || '';
    const trainingType = document.getElementById('renewSearchTrainingType')?.value || '';
    
    if (!searchQuery) {
      showToast('Vui lòng nhập thông tin tìm kiếm', 'warning');
      return;
    }
    
    showGlobalLoading(true, 'Đang tìm kiếm học viên...');
    setButtonLoading('renewSearchButton', true, 'Đang tìm kiếm...');
    
    const response = await callAPI('searchStudentForRenew', {
      searchQuery: searchQuery,
      trainingType: trainingType
    });
    
    if (response.success && response.data) {
      displayStudentInfo(response.data);
      showRenewForm(response.data);
      showToast('Tìm thấy học viên', 'success');
    } else {
      showToast('Không tìm thấy học viên phù hợp', 'error');
      clearStudentInfo();
      hideRenewForm();
    }
    
  } catch (error) {
    console.error('Search student error:', error);
    showToast('Lỗi tìm kiếm: ' + error.message, 'error');
    clearStudentInfo();
    hideRenewForm();
  } finally {
    showGlobalLoading(false);
    setButtonLoading('renewSearchButton', false);
  }
}

/**
 * Hiển thị thông tin học viên
 * @param {Object} studentData - Dữ liệu học viên
 */
function displayStudentInfo(studentData) {
  const infoEl = document.getElementById('renewStudentInfo');
  if (!infoEl) return;
  
  infoEl.innerHTML = `
    <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
      <h3 class="font-semibold text-blue-800 mb-2">Thông tin học viên</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <strong>Mã HV:</strong> ${escapeHtml(studentData.studentCode || '')}<br>
          <strong>Họ tên:</strong> ${escapeHtml(studentData.name || '')}<br>
          <strong>SĐT:</strong> ${escapeHtml(studentData.phone || '')}
        </div>
        <div>
          <strong>Gói hiện tại:</strong> ${escapeHtml(studentData.currentPackage || '')}<br>
          <strong>Số buổi còn lại:</strong> ${studentData.remainingSessions || 0}<br>
          <strong>Hạn dùng:</strong> ${formatDDMMYYYY(studentData.expiryDate) || ''}
        </div>
        <div>
          <strong>Hình thức tập:</strong> ${escapeHtml(studentData.trainingType || '')}<br>
          <strong>HLV:</strong> ${escapeHtml(studentData.ptName || '')}<br>
          <strong>Ngày đăng ký:</strong> ${formatDDMMYYYY(studentData.registerDate) || ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Hiển thị form gia hạn
 * @param {Object} studentData - Dữ liệu học viên
 */
function showRenewForm(studentData) {
  const formEl = document.getElementById('renewForm');
  if (!formEl) return;
  
  // Điền thông tin học viên vào hidden fields
  document.getElementById('studentId').value = studentData.studentCode || '';
  document.getElementById('sheetName').value = studentData.sheetName || '';
  document.getElementById('currentPackageCode').value = studentData.currentPackage || '';
  
  // Set training type
  const trainingTypeEl = document.getElementById('renewTrainingType');
  if (trainingTypeEl) {
    trainingTypeEl.value = studentData.trainingType || 'NonPT';
    trainingTypeEl.disabled = true; // Disable khi không đổi gói
  }
  
  // Load package options
  updateRenewPackageOptions(studentData.trainingType);
  
  // Set PT code nếu là PT
  if (studentData.trainingType && studentData.trainingType.startsWith('PT')) {
    const ptCodeEl = document.getElementById('renewPtCode');
    if (ptCodeEl) {
      ptCodeEl.value = studentData.ptCode || '';
    }
  }
  
  // Set ngày bắt đầu mặc định là ngày sau khi hết hạn
  const startDateEl = document.getElementById('renewStartDate');
  if (startDateEl && studentData.expiryDate) {
    const expiryDate = new Date(studentData.expiryDate);
    const nextDay = new Date(expiryDate);
    nextDay.setDate(nextDay.getDate() + 1);
    startDateEl.value = toDateInputValue(nextDay);
  }
  
  // Hiển thị form
  formEl.classList.remove('hidden');
}

/**
 * Ẩn form gia hạn
 */
function hideRenewForm() {
  const formEl = document.getElementById('renewForm');
  if (formEl) {
    formEl.classList.add('hidden');
  }
}

/**
 * Xóa thông tin học viên
 */
function clearStudentInfo() {
  const infoEl = document.getElementById('renewStudentInfo');
  if (infoEl) {
    infoEl.innerHTML = '';
  }
}

/**
 * Update package options cho renew form
 * @param {string} trainingType - Hình thức tập
 */
function updateRenewPackageOptions(trainingType = null) {
  const type = trainingType || document.getElementById('renewTrainingType')?.value || 'NonPT';
  const select = document.getElementById('renewPackageCode');
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
  
  updateRenewTotalPrice();
}

/**
 * Update tổng tiền cho renew
 */
function updateRenewTotalPrice() {
  const select = document.getElementById('renewPackageCode');
  if (!select) return;
  
  const originalPrice = Number(select.selectedOptions[0]?.dataset.price || 0);
  const packageCode = select.value;
  const el = document.getElementById('renewTotalPrice');
  
  if (!packageCode) {
    if (el) el.value = '0 VNĐ';
    return;
  }
  
  setTotalWithMonthCard(originalPrice, 'renew');
}

/**
 * Toggle renew mode fields
 */
function toggleRenewModeFields() {
  const renewMode = document.querySelector('input[name="renewMode"]:checked')?.value || 'renewNow';
  const expectedActivationContainer = document.getElementById('renewExpectedActivationContainer');
  const startDateContainer = document.getElementById('renewStartDateContainer');
  
  if (renewMode === 'pendingLater') {
    if (expectedActivationContainer) expectedActivationContainer.style.display = 'block';
    if (startDateContainer) startDateContainer.style.display = 'none';
  } else {
    if (expectedActivationContainer) expectedActivationContainer.style.display = 'none';
    if (startDateContainer) startDateContainer.style.display = 'block';
  }
}

/**
 * Toggle renew PT fields
 */
function toggleRenewPTFields() {
  const switchToggle = document.getElementById('renewSwitchPackageToggle')?.checked || false;
  const trainingTypeEl = document.getElementById('renewTrainingType');
  const ptFields = document.getElementById('renewPtFields');
  const monthCardFields = document.getElementById('renewMonthCardFields');
  
  if (switchToggle) {
    trainingTypeEl.disabled = false;
    
    // Show/hide PT fields based on training type
    const trainingType = trainingTypeEl.value || '';
    if (ptFields) {
      ptFields.classList.toggle('hidden', !trainingType.startsWith('PT'));
    }
    
    // Show month card options for PT
    if (monthCardFields && trainingType.startsWith('PT')) {
      monthCardFields.classList.remove('hidden');
    } else if (monthCardFields) {
      monthCardFields.classList.add('hidden');
    }
  } else {
    trainingTypeEl.disabled = true;
    if (ptFields) ptFields.classList.add('hidden');
    if (monthCardFields) monthCardFields.classList.add('hidden');
  }
  
  updateRenewPackageOptions();
}

/**
 * Xác nhận và gia hạn
 */
async function confirmAndRenew() {
  try {
    const formData = getRenewFormData();
    const validation = validateRenewData(formData);
    
    if (!validation.isValid) {
      showToast(validation.message, 'error');
      return;
    }
    
    showGlobalLoading(true, 'Đang gia hạn gói tập...');
    setButtonLoading('submitBtn', true, 'Đang xử lý...');
    
    const response = await callAPI('renewStudent', formData);
    
    if (response.success) {
      showRenewSuccess(response.data);
      showToast('Gia hạn thành công!', 'success');
      
      // Reset form sau 3 giây
      setTimeout(() => {
        resetRenewForm();
      }, 3000);
    } else {
      throw new Error(response.error || 'Gia hạn thất bại');
    }
    
  } catch (error) {
    console.error('Renew error:', error);
    showToast('Lỗi gia hạn: ' + error.message, 'error');
    showRenewError(error.message);
  } finally {
    showGlobalLoading(false);
    setButtonLoading('submitBtn', false);
  }
}

/**
 * Lấy dữ liệu từ form gia hạn
 * @returns {Object} - Form data
 */
function getRenewFormData() {
  const renewMode = document.querySelector('input[name="renewMode"]:checked')?.value || 'renewNow';
  const switchPackage = document.getElementById('renewSwitchPackageToggle')?.checked || false;
  
  return {
    studentId: document.getElementById('studentId')?.value || '',
    sheetName: document.getElementById('sheetName')?.value || '',
    currentPackageCode: document.getElementById('currentPackageCode')?.value || '',
    renewMode: renewMode,
    switchPackage: switchPackage,
    trainingType: switchPackage ? document.getElementById('renewTrainingType')?.value : '',
    packageCode: document.getElementById('renewPackageCode')?.value || '',
    ptCode: document.getElementById('renewPtCode')?.value || '',
    startDate: renewMode === 'pendingLater' ? null : document.getElementById('renewStartDate')?.value,
    expectedActivationDate: renewMode === 'pendingLater' ? document.getElementById('renewExpectedActivationDate')?.value : null,
    sessions: Number(document.getElementById('sessions')?.value || 0),
    totalPrice: parseVnd(document.getElementById('renewTotalPrice')?.value || '0'),
    paymentStatus: document.getElementById('renewPaymentStatus')?.value || 'Chưa thanh toán',
    paymentMethod: document.getElementById('renewPaymentMethod')?.value || '',
    cashPaid: parseVnd(document.getElementById('renewCashPaid')?.value || '0'),
    transferPaid: parseVnd(document.getElementById('renewTransferPaid')?.value || '0'),
    discountAmount: parseVnd(document.getElementById('renewDiscountAmount')?.value || '0'),
    discountPercent: parseFloat(document.getElementById('renewDiscountPercent')?.value || '0'),
    referrer: document.getElementById('renewReferrer')?.value?.trim() || '',
    notes: document.getElementById('renewNotes')?.value?.trim() || '',
    issueMonthCard: document.getElementById('renewIssueMonthCard')?.checked || false,
    monthCardOnly: document.getElementById('renewMonthCardOnly')?.checked || false,
    monthCardSegment: document.getElementById('renewMonthCardSegment')?.value || 'chungCu',
    staffName: getStaffName(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Validate dữ liệu gia hạn
 * @param {Object} data - Dữ liệu cần validate
 * @returns {Object} - Kết quả validation
 */
function validateRenewData(data) {
  if (!data.studentId) {
    return { isValid: false, message: 'Thiếu thông tin học viên' };
  }
  
  if (!data.packageCode) {
    return { isValid: false, message: 'Vui lòng chọn gói tập' };
  }
  
  if (data.switchPackage && data.trainingType && data.trainingType.startsWith('PT') && !data.ptCode) {
    return { isValid: false, message: 'Vui lòng chọn huấn luyện viên' };
  }
  
  if (data.renewMode === 'renewNow' && !data.startDate) {
    return { isValid: false, message: 'Vui lòng chọn ngày bắt đầu' };
  }
  
  if (data.renewMode === 'pendingLater' && !data.expectedActivationDate) {
    return { isValid: false, message: 'Vui lòng chọn ngày kích hoạt dự kiến' };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Hiển thị kết quả gia hạn thành công
 * @param {Object} data - Dữ liệu trả về
 */
function showRenewSuccess(data) {
  const notificationEl = document.getElementById('renewNotification');
  if (!notificationEl) return;
  
  notificationEl.innerHTML = `
    <div class="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">✅</span>
        <span class="font-bold text-lg">Gia hạn thành công!</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <strong>Mã HV:</strong> ${escapeHtml(data.studentCode || '')}<br>
          <strong>Gói mới:</strong> ${escapeHtml(data.newPackage || '')}<br>
          <strong>Số buổi:</strong> ${data.sessions || 0}<br>
          <strong>Ngày bắt đầu:</strong> ${formatDDMMYYYY(data.startDate) || ''}
        </div>
        <div>
          <strong>Hạn dùng:</strong> ${formatDDMMYYYY(data.expiryDate) || ''}<br>
          <strong>Tổng tiền:</strong> ${formatMoney(data.totalPrice || 0, true)}<br>
          <strong>Thanh toán:</strong> ${data.paymentStatus || ''}<br>
          <strong>Nhân viên:</strong> ${escapeHtml(data.staffName || '')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Hiển thị lỗi gia hạn
 * @param {string} errorMessage - Thông báo lỗi
 */
function showRenewError(errorMessage) {
  const notificationEl = document.getElementById('renewNotification');
  if (!notificationEl) return;
  
  notificationEl.innerHTML = `
    <div class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
      <div class="flex items-center gap-2">
        <span class="text-2xl">❌</span>
        <span class="font-bold">Gia hạn thất bại</span>
      </div>
      <div class="text-sm mt-2">${escapeHtml(errorMessage || 'Có lỗi xảy ra')}</div>
    </div>
  `;
}

/**
 * Reset form gia hạn
 */
function resetRenewForm() {
  // Clear search
  document.getElementById('searchStudentId').value = '';
  document.getElementById('renewSearchTrainingType').value = '';
  
  // Clear student info
  clearStudentInfo();
  
  // Hide form
  hideRenewForm();
  
  // Clear notification
  document.getElementById('renewNotification').innerHTML = '';
}

/**
 * Generate PT group ID
 */
function generatePTGroupIdRenew() {
  const groupId = 'PT' + Date.now().toString().slice(-6);
  const inputEl = document.getElementById('renewPtGroupId');
  if (inputEl) {
    inputEl.value = groupId;
  }
  return groupId;
}

// Export các hàm
window.searchStudentForRenew = searchStudentForRenew;
window.displayStudentInfo = displayStudentInfo;
window.showRenewForm = showRenewForm;
window.hideRenewForm = hideRenewForm;
window.clearStudentInfo = clearStudentInfo;
window.updateRenewPackageOptions = updateRenewPackageOptions;
window.updateRenewTotalPrice = updateRenewTotalPrice;
window.toggleRenewModeFields = toggleRenewModeFields;
window.toggleRenewPTFields = toggleRenewPTFields;
window.confirmAndRenew = confirmAndRenew;
window.getRenewFormData = getRenewFormData;
window.validateRenewData = validateRenewData;
window.showRenewSuccess = showRenewSuccess;
window.showRenewError = showRenewError;
window.resetRenewForm = resetRenewForm;
window.generatePTGroupIdRenew = generatePTGroupIdRenew;

console.log('Renew module loaded');
