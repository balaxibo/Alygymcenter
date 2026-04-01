/**
 * File xử lý Gói chờ kích hoạt cho Frontend ALY GYM CENTER
 */

/**
 * Load danh sách gói chờ kích hoạt
 */
async function loadPendingPackages() {
  try {
    showGlobalLoading(true, 'Đang tải danh sách gói chờ...');
    
    const response = await callAPI('getPendingPackages');
    
    if (response.success) {
      displayPendingPackages(response.data);
    } else {
      throw new Error(response.error || 'Không thể tải danh sách gói chờ');
    }
    
  } catch (error) {
    console.error('Load pending packages error:', error);
    showToast('Lỗi tải danh sách gói chờ: ' + error.message, 'error');
    showPendingError(error.message);
  } finally {
    showGlobalLoading(false);
  }
}

/**
 * Hiển thị danh sách gói chờ
 * @param {Array} packages - Danh sách gói chờ
 */
function displayPendingPackages(packages) {
  const contentEl = document.getElementById('pendingContent');
  const notificationEl = document.getElementById('pendingNotification');
  
  if (!contentEl || !notificationEl) return;
  
  if (!packages || packages.length === 0) {
    contentEl.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <div class="text-4xl mb-2">📋</div>
        <p>Không có gói nào đang chờ kích hoạt</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="space-y-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Danh sách gói chờ kích hoạt (${packages.length})</h3>
        <button onclick="loadPendingPackages()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          🔄 Tải lại
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th class="border border-gray-300 px-4 py-2 text-left">Mã HV</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Họ tên</th>
              <th class="border border-gray-300 px-4 py-2 text-left">SĐT</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Gói tập</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Ngày đăng ký</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Ngày kích hoạt dự kiến</th>
              <th class="border border-gray-300 px-4 py-2 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  packages.forEach((pkg, index) => {
    const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    html += `
      <tr class="${rowClass} hover:bg-yellow-50">
        <td class="border border-gray-300 px-4 py-2 font-mono">${escapeHtml(pkg.studentCode || '')}</td>
        <td class="border border-gray-300 px-4 py-2">${escapeHtml(pkg.studentName || '')}</td>
        <td class="border border-gray-300 px-4 py-2">${escapeHtml(pkg.phone || '')}</td>
        <td class="border border-gray-300 px-4 py-2">
          <div class="text-sm">
            <div class="font-semibold">${escapeHtml(pkg.packageCode || '')}</div>
            <div class="text-gray-600">${pkg.sessions || 0} buổi</div>
            <div class="text-blue-600">${formatMoney(pkg.price || 0, true)}</div>
          </div>
        </td>
        <td class="border border-gray-300 px-4 py-2">${formatDDMMYYYY(pkg.registerDate) || ''}</td>
        <td class="border border-gray-300 px-4 py-2">
          <span class="text-orange-600 font-semibold">${formatDDMMYYYY(pkg.expectedActivationDate) || ''}</span>
        </td>
        <td class="border border-gray-300 px-4 py-2 text-center">
          <div class="flex gap-2 justify-center">
            <button onclick="viewPendingPackage('${pkg.id}')" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
              👁️ Xem
            </button>
            <button onclick="activatePendingPackage('${pkg.id}')" class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">
              ✅ Kích hoạt
            </button>
            <button onclick="deletePendingPackage('${pkg.id}')" class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors">
              🗑️ Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  contentEl.innerHTML = html;
  notificationEl.innerHTML = '';
}

/**
 * Xem chi tiết gói chờ
 * @param {string} packageId - ID của gói
 */
async function viewPendingPackage(packageId) {
  try {
    showGlobalLoading(true, 'Đang tải thông tin gói...');
    
    const response = await callAPI('getPendingPackageDetail', { packageId: packageId });
    
    if (response.success && response.data) {
      showPendingPackageDetail(response.data);
    } else {
      throw new Error(response.error || 'Không thể tải thông tin gói');
    }
    
  } catch (error) {
    console.error('View pending package error:', error);
    showToast('Lỗi tải thông tin gói: ' + error.message, 'error');
  } finally {
    showGlobalLoading(false);
  }
}

/**
 * Hiển thị chi tiết gói chờ
 * @param {Object} packageData - Dữ liệu gói
 */
function showPendingPackageDetail(packageData) {
  // Tạo modal để hiển thị chi tiết
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">Chi tiết gói chờ kích hoạt</h3>
        <button onclick="closePendingDetailModal()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="font-semibold text-gray-700 mb-2">Thông tin học viên</h4>
          <div class="space-y-1 text-sm">
            <div><strong>Mã HV:</strong> ${escapeHtml(packageData.studentCode || '')}</div>
            <div><strong>Họ tên:</strong> ${escapeHtml(packageData.studentName || '')}</div>
            <div><strong>SĐT:</strong> ${escapeHtml(packageData.phone || '')}</div>
            <div><strong>Địa chỉ:</strong> ${escapeHtml(packageData.address || '')}</div>
          </div>
        </div>
        
        <div>
          <h4 class="font-semibold text-gray-700 mb-2">Thông tin gói tập</h4>
          <div class="space-y-1 text-sm">
            <div><strong>Gói tập:</strong> ${escapeHtml(packageData.packageCode || '')}</div>
            <div><strong>Hình thức:</strong> ${escapeHtml(packageData.trainingType || '')}</div>
            <div><strong>Số buổi:</strong> ${packageData.sessions || 0}</div>
            <div><strong>Giá:</strong> ${formatMoney(packageData.price || 0, true)}</div>
            <div><strong>HLV:</strong> ${escapeHtml(packageData.ptName || '')}</div>
          </div>
        </div>
        
        <div>
          <h4 class="font-semibold text-gray-700 mb-2">Thông tin đăng ký</h4>
          <div class="space-y-1 text-sm">
            <div><strong>Ngày đăng ký:</strong> ${formatDDMMYYYY(packageData.registerDate) || ''}</div>
            <div><strong>Ngày kích hoạt dự kiến:</strong> ${formatDDMMYYYY(packageData.expectedActivationDate) || ''}</div>
            <div><strong>Nhân viên:</strong> ${escapeHtml(packageData.staffName || '')}</div>
          </div>
        </div>
        
        <div>
          <h4 class="font-semibold text-gray-700 mb-2">Thanh toán</h4>
          <div class="space-y-1 text-sm">
            <div><strong>Trạng thái:</strong> <span class="font-semibold ${packageData.paymentStatus === 'Đã thanh toán' ? 'text-green-600' : 'text-red-600'}">${packageData.paymentStatus || ''}</span></div>
            <div><strong>Hình thức:</strong> ${packageData.paymentMethod || ''}</div>
            <div><strong>Tiền mặt:</strong> ${formatMoney(packageData.cashPaid || 0, true)}</div>
            <div><strong>Chuyển khoản:</strong> ${formatMoney(packageData.transferPaid || 0, true)}</div>
          </div>
        </div>
      </div>
      
      ${packageData.notes ? `
        <div class="mt-4">
          <h4 class="font-semibold text-gray-700 mb-2">Ghi chú</h4>
          <div class="bg-gray-50 p-3 rounded text-sm">${escapeHtml(packageData.notes)}</div>
        </div>
      ` : ''}
      
      <div class="mt-6 flex gap-3 justify-end">
        <button onclick="closePendingDetailModal()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors">
          Đóng
        </button>
        <button onclick="activatePendingPackage('${packageData.id}')" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
          ✅ Kích hoạt ngay
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  window.currentPendingModal = modal;
}

/**
 * Đóng modal chi tiết gói chờ
 */
function closePendingDetailModal() {
  if (window.currentPendingModal) {
    window.currentPendingModal.remove();
    window.currentPendingModal = null;
  }
}

/**
 * Kích hoạt gói chờ
 * @param {string} packageId - ID của gói
 */
async function activatePendingPackage(packageId) {
  if (!confirm('Bạn có chắc chắn muốn kích hoạt gói này?')) {
    return;
  }
  
  try {
    showGlobalLoading(true, 'Đang kích hoạt gói...');
    
    const response = await callAPI('activatePendingPackage', { 
      packageId: packageId,
      activationDate: new Date().toISOString().split('T')[0],
      staffName: getStaffName()
    });
    
    if (response.success) {
      showToast('Kích hoạt gói thành công!', 'success');
      closePendingDetailModal();
      loadPendingPackages(); // Tải lại danh sách
    } else {
      throw new Error(response.error || 'Kích hoạt thất bại');
    }
    
  } catch (error) {
    console.error('Activate pending package error:', error);
    showToast('Lỗi kích hoạt gói: ' + error.message, 'error');
  } finally {
    showGlobalLoading(false);
  }
}

/**
 * Xóa gói chờ
 * @param {string} packageId - ID của gói
 */
async function deletePendingPackage(packageId) {
  if (!confirm('Bạn có chắc chắn muốn xóa gói này? Hành động này không thể hoàn tác!')) {
    return;
  }
  
  try {
    showGlobalLoading(true, 'Đang xóa gói...');
    
    const response = await callAPI('deletePendingPackage', { packageId: packageId });
    
    if (response.success) {
      showToast('Xóa gói thành công!', 'success');
      loadPendingPackages(); // Tải lại danh sách
    } else {
      throw new Error(response.error || 'Xóa gói thất bại');
    }
    
  } catch (error) {
    console.error('Delete pending package error:', error);
    showToast('Lỗi xóa gói: ' + error.message, 'error');
  } finally {
    showGlobalLoading(false);
  }
}

/**
 * Đăng ký gói chờ mới
 */
async function registerPendingPackage() {
  try {
    const formData = getPendingFormData();
    const validation = validatePendingData(formData);
    
    if (!validation.isValid) {
      showToast(validation.message, 'error');
      return;
    }
    
    showGlobalLoading(true, 'Đang đăng ký gói chờ...');
    setButtonLoading('submitPendingBtn', true, 'Đang xử lý...');
    
    const response = await callAPI('registerPendingPackage', formData);
    
    if (response.success) {
      showToast('Đăng ký gói chờ thành công!', 'success');
      resetPendingForm();
      loadPendingPackages(); // Tải lại danh sách
    } else {
      throw new Error(response.error || 'Đăng ký thất bại');
    }
    
  } catch (error) {
    console.error('Register pending package error:', error);
    showToast('Lỗi đăng ký gói chờ: ' + error.message, 'error');
  } finally {
    showGlobalLoading(false);
    setButtonLoading('submitPendingBtn', false);
  }
}

/**
 * Lấy dữ liệu từ form gói chờ
 * @returns {Object} - Form data
 */
function getPendingFormData() {
  return {
    studentCode: document.getElementById('pendingStudentCode')?.value?.trim() || '',
    studentName: document.getElementById('pendingStudentName')?.value?.trim() || '',
    phone: normalizePhone10(document.getElementById('pendingPhone')?.value || ''),
    address: document.getElementById('pendingAddress')?.value?.trim() || '',
    trainingType: document.getElementById('pendingTrainingType')?.value || '',
    packageCode: document.getElementById('pendingPackageCode')?.value || '',
    ptCode: document.getElementById('pendingPtCode')?.value || '',
    expectedActivationDate: document.getElementById('pendingExpectedActivationDate')?.value || '',
    totalPrice: parseVnd(document.getElementById('pendingTotalPrice')?.value || '0'),
    paymentStatus: document.getElementById('pendingPaymentStatus')?.value || 'Chưa thanh toán',
    paymentMethod: document.getElementById('pendingPaymentMethod')?.value || '',
    cashPaid: parseVnd(document.getElementById('pendingCashPaid')?.value || '0'),
    transferPaid: parseVnd(document.getElementById('pendingTransferPaid')?.value || '0'),
    discountAmount: parseVnd(document.getElementById('pendingDiscountAmount')?.value || '0'),
    discountPercent: parseFloat(document.getElementById('pendingDiscountPercent')?.value || '0'),
    notes: document.getElementById('pendingNotes')?.value?.trim() || '',
    staffName: getStaffName(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Validate dữ liệu gói chờ
 * @param {Object} data - Dữ liệu cần validate
 * @returns {Object} - Kết quả validation
 */
function validatePendingData(data) {
  if (!data.studentCode) {
    return { isValid: false, message: 'Vui lòng nhập mã học viên' };
  }
  
  if (!data.studentName) {
    return { isValid: false, message: 'Vui lòng nhập họ tên học viên' };
  }
  
  if (!data.phone || !validatePhone(data.phone)) {
    return { isValid: false, message: 'Số điện thoại không hợp lệ' };
  }
  
  if (!data.trainingType) {
    return { isValid: false, message: 'Vui lòng chọn hình thức tập' };
  }
  
  if (!data.packageCode) {
    return { isValid: false, message: 'Vui lòng chọn gói tập' };
  }
  
  if (!data.expectedActivationDate) {
    return { isValid: false, message: 'Vui lòng chọn ngày kích hoạt dự kiến' };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Hiển thị lỗi gói chờ
 * @param {string} errorMessage - Thông báo lỗi
 */
function showPendingError(errorMessage) {
  const notificationEl = document.getElementById('pendingNotification');
  if (!notificationEl) return;
  
  notificationEl.innerHTML = `
    <div class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
      <div class="flex items-center gap-2">
        <span class="text-2xl">❌</span>
        <span class="font-bold">Lỗi</span>
      </div>
      <div class="text-sm mt-2">${escapeHtml(errorMessage || 'Có lỗi xảy ra')}</div>
    </div>
  `;
}

/**
 * Reset form gói chờ
 */
function resetPendingForm() {
  const form = document.getElementById('pendingForm');
  if (form) {
    form.reset();
  }
  
  // Reset các field đặc biệt
  document.getElementById('pendingTotalPrice').value = '0 VNĐ';
  document.getElementById('pendingPaymentSplit').classList.add('hidden');
  document.getElementById('pendingCashPaid').value = '';
  document.getElementById('pendingTransferPaid').value = '';
  document.getElementById('pendingDebtHint').textContent = '';
}

// Export các hàm
window.loadPendingPackages = loadPendingPackages;
window.displayPendingPackages = displayPendingPackages;
window.viewPendingPackage = viewPendingPackage;
window.showPendingPackageDetail = showPendingPackageDetail;
window.closePendingDetailModal = closePendingDetailModal;
window.activatePendingPackage = activatePendingPackage;
window.deletePendingPackage = deletePendingPackage;
window.registerPendingPackage = registerPendingPackage;
window.getPendingFormData = getPendingFormData;
window.validatePendingData = validatePendingData;
window.showPendingError = showPendingError;
window.resetPendingForm = resetPendingForm;

console.log('Pending module loaded');
