import { apiRunner } from './api.js';
import { formatMoney, parseMoney } from './money.js';
import { validatePhone, showSuccess, showError, showLoading, setTotalWithMonthCard } from './utils.js';
import { getStaffName, setButtonLoading } from './init.js';

export function updatePackageOptions() {
  const type = document.getElementById('trainingType')?.value || 'NonPT';
  const select = document.getElementById('packageCode');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '';
  select.add(new Option('Chọn gói', ''));
  
  const pkgList = Array.isArray(window.packages) ? window.packages : [];
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
  if (currentValue && [...select.options].some(o => o.value === currentValue)) select.value = currentValue; else select.value = '';
  const regMonthEl = document.getElementById('registerMonthCardFields');
  if (regMonthEl) regMonthEl.style.display = (type.startsWith('PT')) ? 'grid' : 'none';
  updateTotalPrice();
}

export function updateTotalPrice() {
  const select = document.getElementById('packageCode');
  if (!select) return;
  const originalPrice = Number(select.selectedOptions[0]?.dataset.price || 0);
  const packageCode = select.value;
  const el = document.getElementById('totalPrice');
  
  if (!packageCode) {
    if (el) el.value = '0 VNĐ';
    return;
  }

  const type = document.getElementById('trainingType')?.value || 'NonPT';
  
  // Call API for promotion details instead of client-side logic if possible, 
  // or keep client-side if it's already there.
  // For now, let's use the API to be sure.
  apiRunner
    .withSuccessHandler(details => {
      if (details && details.isEligible) {
        const promoInfo = document.getElementById('registerPromoInfo');
        if (promoInfo) {
          promoInfo.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded p-2 mt-2">
              <div class="flex items-center">
                <span class="text-red-600 font-bold mr-2">🎉 Khuyến mãi:</span>
                <span>${details.message}</span>
              </div>
            </div>
          `;
          promoInfo.style.display = 'block';
        }
        setTotalWithMonthCard(details.finalPrice, 'register');
      } else {
        const promoInfo = document.getElementById('registerPromoInfo');
        if (promoInfo) promoInfo.style.display = 'none';
        setTotalWithMonthCard(originalPrice, 'register');
      }
    })
    .getPackagePromotionDetails({ packageCode, originalPrice });
}

export function togglePTFields() {
  const trainingType = document.getElementById('trainingType')?.value;
  const showPT = trainingType && trainingType.startsWith('PT');
  
  const ptEl = document.getElementById('ptRow');
  if (ptEl) ptEl.style.display = showPT ? 'grid' : 'none';
  
  const ptGroupEl = document.getElementById('ptGroupField');
  const ptGroupInput = document.getElementById('ptGroupId');
  if (ptGroupEl) ptGroupEl.style.display = (trainingType === 'PT2:1' || trainingType === 'PT3:1') ? 'block' : 'none';
  
  const regMonthEl = document.getElementById('registerMonthCardFields');
  if (regMonthEl) regMonthEl.style.display = showPT ? 'none' : 'grid';
  
  updatePackageOptions();
}

export function submitRegistrationForm() {
  const form = document.getElementById('registerForm');
  
  // Basic validation
  const fullName = document.getElementById('fullName')?.value?.trim();
  const phone = document.getElementById('phone')?.value?.trim();
  const dob = document.getElementById('dob')?.value;
  const packageCode = document.getElementById('packageCode')?.value;
  const startDate = document.getElementById('startDate')?.value;
  
  if (!fullName || !phone || !dob || !packageCode || !startDate) {
    showError('registerNotification', 'Vui lòng điền đầy đủ các trường bắt buộc (*)');
    return;
  }
  
  setButtonLoading('registerButton', true, 'Đang xử lý đăng ký...');
  showLoading('registerNotification', 'Đang xử lý đăng ký...');
  
  const trainingType = document.getElementById('trainingType')?.value || 'NonPT';
  const paymentStatus = document.getElementById('paymentStatus')?.value || 'Đã thanh toán';
  const paymentMethod = paymentStatus === 'Chưa thanh toán' ? '' : (document.getElementById('paymentMethod')?.value || 'Tiền mặt');
  
  const formData = {
    trainingType,
    fullName,
    dob,
    phone,
    address: document.getElementById('address')?.value || '',
    packageCode,
    sessions: document.getElementById('packageCode').selectedOptions[0]?.dataset.sessions || 0,
    price: document.getElementById('packageCode').selectedOptions[0]?.dataset.price || 0,
    ptCode: document.getElementById('ptCode')?.value || '',
    ptGroupId: document.getElementById('ptGroupId')?.value || '',
    monthCardSegment: document.getElementById('registerMonthCardSegment')?.value || 'chungCu',
    startDate,
    paymentStatus,
    paymentMethod,
    cashPaid: parseMoney(document.getElementById('registerCashPaid')?.value || '0'),
    transferPaid: parseMoney(document.getElementById('registerTransferPaid')?.value || '0'),
    staff: getStaffName(),
    notes: document.getElementById('notes')?.value || '',
    referrer: document.getElementById('referrer')?.value || '',
    discountAmount: parseMoney(document.getElementById('discountAmount')?.value || '0'),
    discountPercent: parseFloat(document.getElementById('discountPercent')?.value || '0')
  };

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('registerButton', false);
      if (result && result.status === 'success') {
        // Success message formatting...
        showSuccess('registerNotification', `Đăng ký thành công học viên ${result.fullName} (Mã: ${result.studentId})`);
        form.reset();
        updatePackageOptions();
        togglePTFields();
      } else {
        showError('registerNotification', result?.message || 'Có lỗi xảy ra trong quá trình đăng ký.');
      }
    })
    .withFailureHandler(error => {
      setButtonLoading('registerButton', false);
      showError('registerNotification', error.message || error);
    })
    .registerStudent(formData);
}

// Make functions available globally for HTML onclick handlers
window.updatePackageOptions = updatePackageOptions;
window.updateTotalPrice = updateTotalPrice;
window.togglePTFields = togglePTFields;
window.submitRegistrationForm = submitRegistrationForm;
