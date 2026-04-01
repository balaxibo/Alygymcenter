/**
 * File xử lý tiền tệ cho Frontend ALY GYM CENTER
 * Chứa các hàm format, parse và tính toán tiền tệ
 */

/**
 * Format số tiền sang định dạng VNĐ
 * @param {number} amount - Số tiền cần format
 * @param {boolean} includeCurrency - Có hiển thị đơn vị VNĐ không
 * @returns {string} - Chuỗi đã format
 */
function formatMoney(amount, includeCurrency = false) {
  if (!amount && amount !== 0) return '';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
  if (isNaN(numAmount)) return '';
  
  const formatted = numAmount.toLocaleString('vi-VN');
  return includeCurrency ? `${formatted} VNĐ` : formatted;
}

/**
 * Parse chuỗi tiền đã format về số
 * @param {string} formattedAmount - Chuỗi tiền đã format
 * @returns {number} - Số tiền
 */
function parseMoney(formattedAmount) {
  if (!formattedAmount) return 0;
  
  const cleanAmount = formattedAmount.toString().replace(/[^\d.,-]/g, '');
  const normalizedAmount = cleanAmount.replace(/\./g, '').replace(/,/g, '.');
  const result = parseFloat(normalizedAmount);
  
  return isNaN(result) ? 0 : result;
}

/**
 * Xử lý input tiền tệ khi người dùng nhập
 * @param {HTMLInputElement} input - Input element
 */
function handleMoneyInput(input) {
  if (!input) return;
  
  const cursorPosition = input.selectionStart;
  const oldValue = input.value;
  const numValue = parseMoney(input.value);
  const newValue = formatMoney(numValue);
  
  input.value = newValue;
  
  const lengthDiff = newValue.length - oldValue.length;
  const newCursorPosition = Math.max(0, cursorPosition + lengthDiff);
  
  setTimeout(() => {
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  }, 0);
  
  // Trigger event để các hàm khác có thể lắng nghe
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Tính giá cuối cùng sau khi áp dụng giảm giá
 * @param {number} pkgPrice - Giá gói tập
 * @param {number} cardPrice - Giá thẻ tháng
 * @param {number} discountAmount - Giảm giá theo số tiền
 * @param {number} discountPercent - Giảm giá theo %
 * @returns {number} - Giá cuối cùng
 */
function calculateFinalPrice(pkgPrice, cardPrice, discountAmount, discountPercent) {
  let total = (Number(pkgPrice) || 0) + (Number(cardPrice) || 0);
  
  if (discountAmount > 0) {
    total = Math.max(0, total - discountAmount);
  }
  
  if (discountPercent > 0) {
    total = Math.max(0, total - Math.round(total * discountPercent / 100));
  }
  
  return total;
}

/**
 * Set tổng tiền bao gồm thẻ tháng
 * @param {number} pkgPrice - Giá gói tập
 * @param {string} mode - Mode: register, renew, pending
 */
function setTotalWithMonthCard(pkgPrice, mode = 'register') {
  let seg = 'chungCu';
  let trainingType = 'NonPT';
  let el = null;
  let issueCard = false;
  
  // Xác định các element và giá trị input dựa trên mode
  if (mode === 'renew') {
    seg = document.getElementById('renewMonthCardSegment')?.value || 'chungCu';
    trainingType = document.getElementById('renewTrainingType')?.value;
    el = document.getElementById('renewTotalPrice');
    const issueCardCheck = document.getElementById('renewIssueMonthCard')?.checked;
    const onlyCard = document.getElementById('renewMonthCardOnly')?.checked;
    
    if (onlyCard) {
      issueCard = true;
    } else if (trainingType && trainingType.startsWith('PT') && issueCardCheck) {
      issueCard = true;
    }
  } else if (mode === 'pending') {
    seg = document.getElementById('pendingMonthCardSegment')?.value || 'chungCu';
    trainingType = document.getElementById('pendingTrainingType')?.value;
    el = document.getElementById('pendingTotalPrice');
    const pendingIssue = document.getElementById('pendingIssueMonthCard')?.checked;
    
    if (trainingType && trainingType.startsWith('PT') && pendingIssue) {
      issueCard = true;
    }
  } else {
    seg = document.getElementById('registerMonthCardSegment')?.value || 'chungCu';
    trainingType = document.getElementById('trainingType')?.value;
    el = document.getElementById('totalPrice');
    
    if (trainingType && trainingType.startsWith('PT')) issueCard = true;
  }

  // Lấy thông tin giảm giá
  const discountAmount = mode === 'renew'
    ? parseMoney(document.getElementById('renewDiscountAmount')?.value || '0')
    : (mode === 'pending' 
        ? parseMoney(document.getElementById('pendingDiscountAmount')?.value || '0')
        : parseMoney(document.getElementById('discountAmount')?.value || '0'));
        
  const discountPercent = mode === 'renew'
    ? parseFloat(document.getElementById('renewDiscountPercent')?.value || '0')
    : (mode === 'pending'
        ? parseFloat(document.getElementById('pendingDiscountPercent')?.value || '0')
        : parseFloat(document.getElementById('discountPercent')?.value || '0'));

  // Tính giá thẻ tháng client-side để tăng tốc độ
  let cardPrice = 0;
  if (issueCard) {
    cardPrice = (seg === 'chungCu') ? 200000 : 250000;
  }

  const total = calculateFinalPrice(pkgPrice, cardPrice, discountAmount, discountPercent);
  
  if (el) {
    el.value = formatMoney(total, true);
    // Store base price (package price) for recalculation without server call
    el.dataset.basePrice = pkgPrice;
  }
}

/**
 * Tính lại tổng tiền
 * @param {string} mode - Mode: register, renew, pending
 */
function recalculateTotal(mode) {
  let el = null;
  
  if (mode === 'renew') {
    el = document.getElementById('renewTotalPrice');
  } else if (mode === 'pending') {
    el = document.getElementById('pendingTotalPrice');
  } else {
    el = document.getElementById('totalPrice');
  }
  
  if (el && el.dataset.basePrice) {
    const pkgPrice = Number(el.dataset.basePrice);
    setTotalWithMonthCard(pkgPrice, mode);
  }
}

// Export các hàm
window.formatMoney = formatMoney;
window.parseMoney = parseMoney;
window.handleMoneyInput = handleMoneyInput;
window.setTotalWithMonthCard = setTotalWithMonthCard;
window.calculateFinalPrice = calculateFinalPrice;
window.recalculateTotal = recalculateTotal;
