/**
 * File xử lý Check-in cho Frontend ALY GYM CENTER
 * Chứa các hàm xử lý điểm danh học viên
 */

/**
 * Xử lý check-in thủ công
 */
function handleManualCheckIn() {
  const input = document.getElementById('manualInput')?.value.trim() || '';
  submitCheckInCaller(input, 'manual');
}

/**
 * Set trạng thái cho checkbox thanh toán buổi lẻ PT
 * @param {boolean} enabled - Cho phép chọn không
 * @param {string} message - Thông báo hiển thị
 */
function setPtSinglePayState(enabled, message) {
  const chk = document.getElementById('ptPayPerSession');
  const hint = document.getElementById('ptPayPerSessionHint');
  const priceBox = document.getElementById('ptSinglePriceBox');
  const priceInput = document.getElementById('ptSinglePrice');
  
  if (hint) hint.textContent = message || '';
  if (!chk) return;
  
  chk.disabled = !enabled;
  if (!enabled) {
    chk.checked = false;
    if (priceBox) priceBox.classList.add('hidden');
    if (priceInput) priceInput.value = '';
  }
}

/**
 * Kiểm tra eligibility cho thanh toán buổi lẻ PT
 */
async function refreshPtSinglePayEligibility() {
  const trainingType = document.getElementById('checkinTrainingType')?.value || '';
  const input = (document.getElementById('manualInput')?.value || '').toUpperCase().trim();
  const chk = document.getElementById('ptPayPerSession');
  
  if (!chk) return;
  
  if (trainingType !== 'PT') {
    setPtSinglePayState(false, '');
    return;
  }
  
  if (!input.startsWith('APT')) {
    setPtSinglePayState(false, 'Chỉ áp dụng cho học viên APTxxx.');
    return;
  }
  
  try {
    const response = await callAPI('getMonthCardStatus', {
      studentCode: input,
      trainingType: trainingType
    });
    
    if (response.success && response.data && response.data.status === 'success' && response.data.exists && response.data.isActive) {
      const remain = response.data.remain != null ? response.data.remain : '';
      const end = response.data.endDate ? formatDDMMYYYY(response.data.endDate) : '';
      setPtSinglePayState(false, `Thẻ tháng còn hiệu lực${remain !== '' ? ` (${remain} buổi)` : ''}${end ? `, hạn ${end}` : ''}.`);
    } else {
      setPtSinglePayState(true, (response.data && response.data.exists) ? 'Thẻ tháng không còn hiệu lực. Có thể chọn buổi lẻ.' : 'Chưa có thẻ tháng. Có thể chọn buổi lẻ.');
    }
    
  } catch (error) {
    console.error('Lỗi kiểm tra thẻ tháng:', error);
    setPtSinglePayState(true, '');
  }
}

/**
 * Gửi request check-in
 * @param {string} input - Mã học viên hoặc thông tin
 * @param {string} source - Nguồn: manual, qr
 */
async function submitCheckInCaller(input, source = 'manual') {
  const notificationEl = document.getElementById('checkInNotification');
  if (!notificationEl) return;
  
  const doneEarly = () => {
    try { setButtonLoading('checkInButton', false); } catch (e) {}
    try { if (qrScanner && qrScanner.__processing) qrScanner.__processing = false; } catch (e) {}
  };

  const setTrainingTypeSelectValue = (value) => {
    const el = document.getElementById('checkinTrainingType');
    if (!el) return;
    el.value = value;
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
  };

  /**
   * Hiển thị prompt chọn hình thức tập cho học viên APT
   * @param {string} code - Mã học viên
   */
  const showAptTrainingTypePrompt = (code) => {
    window.__pendingAptQrCode = String(code || '').toUpperCase().trim();
    notificationEl.innerHTML = `
      <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded space-y-2">
        <div class="font-semibold">Chọn hình thức tập cho học viên APT</div>
        <div class="text-sm">Mã: <strong>${escapeHtml(window.__pendingAptQrCode)}</strong></div>
        <div class="flex gap-2 flex-wrap">
          <button type="button" id="aptChoosePT" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Tập có HLV (PT)</button>
          <button type="button" id="aptChooseOut" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Tự tập ngoài giờ (Thẻ tháng)</button>
          <button type="button" id="aptChooseCancel" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">Hủy</button>
        </div>
      </div>
    `;
    
    const btnPT = document.getElementById('aptChoosePT');
    const btnOut = document.getElementById('aptChooseOut');
    const btnCancel = document.getElementById('aptChooseCancel');

    const applyChoice = (type) => {
      const pending = window.__pendingAptQrCode;
      window.__pendingAptQrCode = null;
      setTrainingTypeSelectValue(type);
      submitCheckInCaller(pending, 'qr');
    };

    if (btnPT) btnPT.addEventListener('click', () => applyChoice('PT'));
    if (btnOut) btnOut.addEventListener('click', () => applyChoice('OutOfHours'));
    if (btnCancel) btnCancel.addEventListener('click', () => { 
      window.__pendingAptQrCode = null; 
      notificationEl.innerHTML = ''; 
    });
  };

  /**
   * Xử lý thanh toán buổi lẻ PT
   * @param {string} studentCode - Mã học viên
   * @param {Object} studentData - Dữ liệu học viên
   * @returns {Promise<Object>} - Kết quả thanh toán
   */
  const handlePtSinglePayment = async (studentCode, studentData) => {
    const chk = document.getElementById('ptPayPerSession');
    if (!chk || !chk.checked) return null;
    
    const price = parseVnd(document.getElementById('ptSinglePrice')?.value || '0');
    const paymentStatus = document.getElementById('ptSinglePaymentStatus')?.value || 'Chưa thanh toán';
    const paymentMethod = document.getElementById('ptSinglePaymentMethod')?.value || '';
    
    let cashPaid = 0;
    let transferPaid = 0;
    
    if (paymentMethod === 'Tiền mặt + Chuyển khoản') {
      cashPaid = parseVnd(document.getElementById('ptSingleCashPaid')?.value || '0');
      transferPaid = parseVnd(document.getElementById('ptSingleTransferPaid')?.value || '0');
    } else if (paymentMethod === 'Tiền mặt') {
      cashPaid = price;
    } else if (paymentMethod === 'Chuyển khoản') {
      transferPaid = price;
    }
    
    try {
      const response = await callAPI('processPtSinglePayment', {
        studentCode: studentCode,
        studentData: studentData,
        price: price,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
        cashPaid: cashPaid,
        transferPaid: transferPaid,
        staffName: getStaffName()
      });
      
      return response;
    } catch (error) {
      console.error('Lỗi xử lý thanh toán buổi lẻ:', error);
      throw error;
    }
  };

  try {
    // Nếu là mã APT và chưa chọn hình thức tập
    if (input.toUpperCase().startsWith('APT') && source === 'qr' && document.getElementById('checkinTrainingType')?.value === '') {
      showAptTrainingTypePrompt(input);
      return;
    }
    
    // Lấy thông tin training type
    const trainingType = document.getElementById('checkinTrainingType')?.value || '';
    
    // Hiển thị loading
    setButtonLoading('checkInButton', true);
    notificationEl.innerHTML = '<div class="bg-blue-50 text-blue-800 p-3 rounded">🔄 Đang xử lý check-in...</div>';
    
    // Chuẩn bị dữ liệu
    const checkInData = {
      input: input,
      source: source,
      trainingType: trainingType,
      staffName: getStaffName(),
      timestamp: new Date().toISOString()
    };
    
    // Kiểm tra thanh toán buổi lẻ PT
    let ptSinglePaymentResult = null;
    if (trainingType === 'PT' && input.toUpperCase().startsWith('APT')) {
      const chk = document.getElementById('ptPayPerSession');
      if (chk && chk.checked) {
        ptSinglePaymentResult = await handlePtSinglePayment(input, null);
      }
    }
    
    // Gọi API check-in
    const response = await callAPI('processCheckIn', checkInData);
    
    if (response.success) {
      const data = response.data;
      
      // Hiển thị kết quả check-in
      let resultHtml = `
        <div class="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">✅</span>
            <span class="font-bold text-lg">Check-in thành công!</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Mã học viên:</strong> ${escapeHtml(data.studentCode || '')}<br>
              <strong>Họ tên:</strong> ${escapeHtml(data.studentName || '')}<br>
              <strong>SĐT:</strong> ${escapeHtml(data.phone || '')}<br>
              <strong>Hình thức:</strong> ${escapeHtml(data.trainingType || '')}
            </div>
            <div>
              <strong>Gói tập:</strong> ${escapeHtml(data.packageCode || '')}<br>
              <strong>Số buổi còn lại:</strong> ${data.remainingSessions || 0}<br>
              <strong>Hạn dùng:</strong> ${formatDDMMYYYY(data.expiryDate) || ''}<br>
              <strong>Thời gian:</strong> ${formatDDMMYYYY(new Date())} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
      `;
      
      // Thêm thông tin thanh toán buổi lẻ nếu có
      if (ptSinglePaymentResult && ptSinglePaymentResult.success) {
        resultHtml += `
          <div class="border-t border-green-200 pt-2 mt-2">
            <div class="font-semibold text-yellow-700">💰 Thanh toán buổi lẻ PT:</div>
            <div class="text-sm">
              Giá: ${formatMoney(ptSinglePaymentResult.data.price, true)}<br>
              Trạng thái: ${ptSinglePaymentResult.data.paymentStatus}<br>
              ${ptSinglePaymentResult.data.paymentMethod ? `Hình thức: ${ptSinglePaymentResult.data.paymentMethod}<br>` : ''}
            </div>
          </div>
        `;
      }
      
      resultHtml += '</div>';
      
      notificationEl.innerHTML = resultHtml;
      
      // Clear input
      document.getElementById('manualInput').value = '';
      
      // Reset PT single payment form
      const chk = document.getElementById('ptPayPerSession');
      if (chk) {
        chk.checked = false;
        const priceBox = document.getElementById('ptSinglePriceBox');
        if (priceBox) priceBox.classList.add('hidden');
      }
      
      showToast('Check-in thành công!', 'success');
      
    } else {
      throw new Error(response.error || 'Check-in thất bại');
    }
    
  } catch (error) {
    console.error('Check-in error:', error);
    
    const errorMessage = error.message || 'Có lỗi xảy ra khi check-in';
    
    notificationEl.innerHTML = `
      <div class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
        <div class="flex items-center gap-2">
          <span class="text-2xl">❌</span>
          <span class="font-bold">Check-in thất bại</span>
        </div>
        <div class="text-sm mt-2">${escapeHtml(errorMessage)}</div>
        <div class="text-xs mt-2 text-gray-600">
          Input: ${escapeHtml(input)} | Source: ${source} | Time: ${new Date().toLocaleString('vi-VN')}
        </div>
      </div>
    `;
    
    showToast(errorMessage, 'error', 5000);
    
  } finally {
    doneEarly();
  }
}

/**
 * Load lịch sử check-in gần đây
 * @param {string} studentCode - Mã học viên (optional)
 */
async function loadRecentCheckIns(studentCode = null) {
  try {
    const response = await callAPI('getRecentCheckIns', {
      studentCode: studentCode,
      limit: 10
    });
    
    if (response.success) {
      // Hiển thị lịch sử - implement UI sau
      console.log('Recent check-ins:', response.data);
    }
    
  } catch (error) {
    console.error('Lỗi load lịch sử check-in:', error);
  }
}

// Export các hàm
window.handleManualCheckIn = handleManualCheckIn;
window.setPtSinglePayState = setPtSinglePayState;
window.refreshPtSinglePayEligibility = refreshPtSinglePayEligibility;
window.submitCheckInCaller = submitCheckInCaller;
window.loadRecentCheckIns = loadRecentCheckIns;

console.log('Check-in module loaded');
