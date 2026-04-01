/**
 * File xử lý QR Scanner cho Frontend ALY GYM CENTER
 * Sử dụng html5-qrcode library để quét mã QR
 */

/**
 * Bắt đầu quét mã QR
 */
function startQRScan() {
  if (qrScanner) return;
  
  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerText = 'Đang khởi động camera... Đưa mã QR vào khung quét.';
    resultDiv.className = 'bg-yellow-200 text-yellow-800 p-2 rounded mt-2';
  }
  
  // Tính toán kích thước QR box phù hợp với màn hình
  const qrBoxSize = Math.min(window.innerWidth * 0.8, 400);
  
  try {
    qrScanner = new Html5Qrcode('reader');
    
    qrScanner.start(
      { facingMode: 'environment' }, // Sử dụng camera sau
      { 
        fps: 10, 
        qrbox: { width: qrBoxSize, height: qrBoxSize },
        // Thêm các tùy chọn để cải thiện performance
        aspectRatio: 1.0
      },
      (qrCodeMessage) => {
        // Callback khi quét thành công
        if (!/^[a-zA-Z0-9]+$/.test(qrCodeMessage)) {
          if (resultDiv) {
            resultDiv.innerText = 'Mã QR không hợp lệ. Hãy thử lại.';
            resultDiv.className = 'bg-red-200 text-red-800 p-2 rounded mt-2';
          }
          return;
        }
        
        // Ngăn xử lý nhiều lần cùng lúc
        if (qrScanner.__processing) return;
        qrScanner.__processing = true;
        
        if (resultDiv) {
          resultDiv.innerText = 'Đang xử lý mã QR...';
          resultDiv.className = 'bg-yellow-200 text-yellow-800 p-2 rounded mt-2';
        }
        
        // Gọi API để xử lý check-in
        submitCheckInCaller(qrCodeMessage, 'qr');
        
        // Dừng scanner sau khi quét thành công
        stopQRScan();
      },
      (error) => {
        // Callback khi có lỗi (không phải lỗi nghiêm trọng)
        console.warn('QR Scan warning:', error);
        // Không hiển thị lỗi cho user để tránh làm phiền
      }
    ).catch(err => {
      // Xử lý lỗi khi không thể khởi động camera
      console.error('QR Scanner start error:', err);
      
      if (resultDiv) {
        const errorMessage = err && err.message ? err.message : err;
        let friendlyMessage = 'Không thể khởi động camera';
        
        // Phân tích lỗi và đưa ra thông báo thân thiện
        if (errorMessage.includes('Permission denied')) {
          friendlyMessage = 'Vui lòng cấp quyền truy cập camera cho ứng dụng';
        } else if (errorMessage.includes('NotAllowedError')) {
          friendlyMessage = 'Trình duyệt không cho phép truy cập camera. Vui lòng kiểm tra cài đặt.';
        } else if (errorMessage.includes('NotFoundError')) {
          friendlyMessage = 'Không tìm thấy camera trên thiết bị';
        } else if (errorMessage.includes('NotSupportedError')) {
          friendlyMessage = 'Trình duyệt không hỗ trợ camera. Vui lòng sử dụng Chrome/Firefox phiên bản mới';
        } else if (errorMessage.includes('NotReadableError')) {
          friendlyMessage = 'Camera đang được sử dụng bởi ứng dụng khác';
        }
        
        resultDiv.innerText = `${friendlyMessage}: ${errorMessage}`;
        resultDiv.className = 'bg-red-200 text-red-800 p-2 rounded mt-2';
      }
      
      qrScanner = null;
    });
    
  } catch (error) {
    console.error('QR Scanner initialization error:', error);
    
    if (resultDiv) {
      resultDiv.innerText = `Lỗi khởi tạo QR Scanner: ${error.message}`;
      resultDiv.className = 'bg-red-200 text-red-800 p-2 rounded mt-2';
    }
    
    qrScanner = null;
  }
}

/**
 * Dừng quét mã QR
 */
function stopQRScan() {
  if (!qrScanner) return;
  
  qrScanner.stop().then(() => {
    return qrScanner.clear();
  }).then(() => {
    qrScanner = null;
    
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
      resultDiv.innerText = 'Đã dừng quét.';
      resultDiv.className = '';
    }
    
    console.log('QR Scanner stopped successfully');
  }).catch(err => {
    console.error('Stop QR Scan Error:', err);
    // Đảm bảo qrScanner được reset ngay cả khi có lỗi
    qrScanner = null;
    
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
      resultDiv.innerText = 'Có lỗi khi dừng quét, nhưng đã được reset.';
      resultDiv.className = 'bg-yellow-200 text-yellow-800 p-2 rounded mt-2';
    }
  });
}

/**
 * Kiểm tra xem thiết bị có hỗ trợ camera không
 * @returns {Promise<boolean>} - True nếu có hỗ trợ
 */
async function checkCameraSupport() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    return videoDevices.length > 0;
  } catch (error) {
    console.error('Camera support check failed:', error);
    return false;
  }
}

/**
 * Yêu cầu quyền truy cập camera
 * @returns {Promise<boolean>} - True nếu được cấp quyền
 */
async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    
    // Dừng stream ngay sau khi có quyền
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error('Camera permission request failed:', error);
    return false;
  }
}

/**
 * Hiển thị thông báo lỗi camera thân thiện
 * @param {Error} error - Lỗi từ camera
 */
function showCameraError(error) {
  const resultDiv = document.getElementById('result');
  if (!resultDiv) return;
  
  let friendlyMessage = 'Lỗi camera không xác định';
  
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    friendlyMessage = 'Vui lòng cấp quyền truy cập camera trong cài đặt trình duyệt';
  } else if (error.name === 'NotFoundError') {
    friendlyMessage = 'Không tìm thấy camera trên thiết bị này';
  } else if (error.name === 'NotSupportedError') {
    friendlyMessage = 'Trình duyệt không hỗ trợ camera. Vui lòng dùng Chrome/Firefox';
  } else if (error.name === 'NotReadableError') {
    friendlyMessage = 'Camera đang được sử dụng. Vui lòng đóng các ứng dụng khác';
  } else if (error.name === 'OverconstrainedError') {
    friendlyMessage = 'Camera không đáp ứng yêu cầu. Vui lòng thử lại';
  }
  
  resultDiv.innerText = friendlyMessage;
  resultDiv.className = 'bg-red-200 text-red-800 p-2 rounded mt-2';
  
  // Hiển thị toast notification
  showToast(friendlyMessage, 'error', 5000);
}

/**
 * Tự động dừng scanner khi chuyển tab hoặc ẩn trang
 */
function handleVisibilityChange() {
  if (document.hidden && qrScanner) {
    stopQRScan();
  }
}

/**
 * Cleanup khi unload trang
 */
function cleanupScanner() {
  if (qrScanner) {
    stopQRScan();
  }
}

// Event listeners
document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('beforeunload', cleanupScanner);

// Export các hàm
window.startQRScan = startQRScan;
window.stopQRScan = stopQRScan;
window.checkCameraSupport = checkCameraSupport;
window.requestCameraPermission = requestCameraPermission;
window.showCameraError = showCameraError;

console.log('QR Scanner module loaded');
