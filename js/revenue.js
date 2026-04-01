/**
 * File xử lý Doanh thu cho Frontend ALY GYM CENTER
 */

/**
 * Load dữ liệu doanh thu
 */
async function loadRevenueData() {
  try {
    const startDate = document.getElementById('revenueStartDate')?.value || '';
    const endDate = document.getElementById('revenueEndDate')?.value || '';
    const reportType = document.getElementById('revenueReportType')?.value || 'daily';
    
    showGlobalLoading(true, 'Đang tải dữ liệu doanh thu...');
    
    const response = await callAPI('getRevenueData', {
      startDate: startDate,
      endDate: endDate,
      reportType: reportType
    });
    
    if (response.success) {
      displayRevenueData(response.data);
      displayRevenueCharts(response.data);
    } else {
      throw new Error(response.error || 'Không thể tải dữ liệu doanh thu');
    }
    
  } catch (error) {
    console.error('Load revenue data error:', error);
    showToast('Lỗi tải dữ liệu doanh thu: ' + error.message, 'error');
    showRevenueError(error.message);
  } finally {
    showGlobalLoading(false);
  }
}

/**
 * Hiển thị dữ liệu doanh thu
 * @param {Object} data - Dữ liệu doanh thu
 */
function displayRevenueData(data) {
  const contentEl = document.getElementById('revenueContent');
  if (!contentEl) return;
  
  const { summary, details, chartData } = data;
  
  let html = `
    <!-- Filter Section -->
    <div class="bg-gray-50 p-4 rounded-lg mb-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
          <input type="date" id="revenueStartDate" class="w-full p-2 border rounded" value="${document.getElementById('revenueStartDate')?.value || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
          <input type="date" id="revenueEndDate" class="w-full p-2 border rounded" value="${document.getElementById('revenueEndDate')?.value || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Loại báo cáo</label>
          <select id="revenueReportType" class="w-full p-2 border rounded">
            <option value="daily">Theo ngày</option>
            <option value="weekly">Theo tuần</option>
            <option value="monthly">Theo tháng</option>
          </select>
        </div>
        <div>
          <button onclick="loadRevenueData()" class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            📊 Xem báo cáo
          </button>
        </div>
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-green-600 font-medium">Tổng doanh thu</p>
            <p class="text-2xl font-bold text-green-800">${formatMoney(summary.totalRevenue || 0, true)}</p>
          </div>
          <div class="text-3xl">💰</div>
        </div>
      </div>
      
      <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-blue-600 font-medium">Tiền mặt</p>
            <p class="text-2xl font-bold text-blue-800">${formatMoney(summary.cashRevenue || 0, true)}</p>
          </div>
          <div class="text-3xl">💵</div>
        </div>
      </div>
      
      <div class="bg-purple-50 border border-purple-200 p-4 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-purple-600 font-medium">Chuyển khoản</p>
            <p class="text-2xl font-bold text-purple-800">${formatMoney(summary.transferRevenue || 0, true)}</p>
          </div>
          <div class="text-3xl">🏦</div>
        </div>
      </div>
      
      <div class="bg-orange-50 border border-orange-200 p-4 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-orange-600 font-medium">Số giao dịch</p>
            <p class="text-2xl font-bold text-orange-800">${summary.totalTransactions || 0}</p>
          </div>
          <div class="text-3xl">📈</div>
        </div>
      </div>
    </div>
    
    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-4">Biểu đồ doanh thu</h3>
        <div id="revenueChart" class="h-64 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <div class="loading-spinner mx-auto mb-2"></div>
            <p>Đang tải biểu đồ...</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-4">Phân loại doanh thu</h3>
        <div id="categoryChart" class="h-64 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <div class="loading-spinner mx-auto mb-2"></div>
            <p>Đang tải biểu đồ...</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Details Table -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Chi tiết giao dịch</h3>
        <div class="flex gap-2">
          <button onclick="exportRevenueData('excel')" class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors">
            📥 Excel
          </button>
          <button onclick="exportRevenueData('pdf')" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
            📄 PDF
          </button>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th class="border border-gray-300 px-4 py-2 text-left">Ngày</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Mã HV</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Họ tên</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Loại</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Gói tập</th>
              <th class="border border-gray-300 px-4 py-2 text-right">Tổng tiền</th>
              <th class="border border-gray-300 px-4 py-2 text-left">TT Thanh toán</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Nhân viên</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  if (details && details.length > 0) {
    details.forEach((transaction, index) => {
      const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
      html += `
        <tr class="${rowClass} hover:bg-yellow-50">
          <td class="border border-gray-300 px-4 py-2">${formatDDMMYYYY(transaction.date) || ''}</td>
          <td class="border border-gray-300 px-4 py-2 font-mono">${escapeHtml(transaction.studentCode || '')}</td>
          <td class="border border-gray-300 px-4 py-2">${escapeHtml(transaction.studentName || '')}</td>
          <td class="border border-gray-300 px-4 py-2">
            <span class="px-2 py-1 rounded text-xs font-medium ${getTransactionTypeStyle(transaction.type)}">
              ${transaction.type || ''}
            </span>
          </td>
          <td class="border border-gray-300 px-4 py-2">${escapeHtml(transaction.packageCode || '')}</td>
          <td class="border border-gray-300 px-4 py-2 text-right font-semibold">${formatMoney(transaction.amount || 0, true)}</td>
          <td class="border border-gray-300 px-4 py-2">
            <span class="px-2 py-1 rounded text-xs font-medium ${getPaymentStatusStyle(transaction.paymentStatus)}">
              ${transaction.paymentStatus || ''}
            </span>
          </td>
          <td class="border border-gray-300 px-4 py-2">${escapeHtml(transaction.staffName || '')}</td>
        </tr>
      `;
    });
  } else {
    html += `
      <tr>
        <td colspan="8" class="border border-gray-300 px-4 py-8 text-center text-gray-500">
          Không có dữ liệu giao dịch trong khoảng thời gian đã chọn
        </td>
      </tr>
    `;
  }
  
  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  contentEl.innerHTML = html;
}

/**
 * Lấy style cho loại giao dịch
 * @param {string} type - Loại giao dịch
 * @returns {string} - CSS classes
 */
function getTransactionTypeStyle(type) {
  const styles = {
    'Đăng ký mới': 'bg-blue-100 text-blue-800',
    'Gia hạn': 'bg-green-100 text-green-800',
    'Buổi lẻ PT': 'bg-purple-100 text-purple-800',
    'Thẻ tháng': 'bg-orange-100 text-orange-800'
  };
  return styles[type] || 'bg-gray-100 text-gray-800';
}

/**
 * Lấy style cho trạng thái thanh toán
 * @param {string} status - Trạng thái thanh toán
 * @returns {string} - CSS classes
 */
function getPaymentStatusStyle(status) {
  const styles = {
    'Đã thanh toán': 'bg-green-100 text-green-800',
    'Thanh toán một phần': 'bg-yellow-100 text-yellow-800',
    'Chưa thanh toán': 'bg-red-100 text-red-800'
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Hiển thị biểu đồ doanh thu
 * @param {Object} data - Dữ liệu biểu đồ
 */
function displayRevenueCharts(data) {
  // Biểu đồ doanh thu theo thời gian
  displayRevenueLineChart(data.chartData?.timeSeries || []);
  
  // Biểu đồ phân loại doanh thu
  displayRevenuePieChart(data.chartData?.categories || {});
}

/**
 * Hiển thị biểu đồ đường doanh thu
 * @param {Array} timeSeries - Dữ liệu time series
 */
function displayRevenueLineChart(timeSeries) {
  const chartEl = document.getElementById('revenueChart');
  if (!chartEl || !timeSeries.length) {
    if (chartEl) {
      chartEl.innerHTML = '<p class="text-gray-500 text-center">Không có dữ liệu</p>';
    }
    return;
  }
  
  // Tạo biểu đồ đơn giản bằng CSS/HTML
  const maxValue = Math.max(...timeSeries.map(item => item.revenue));
  const chartHeight = 200;
  
  let html = '<div class="relative h-full">';
  html += '<div class="absolute inset-0 flex items-end justify-between gap-1">';
  
  timeSeries.forEach(item => {
    const height = (item.revenue / maxValue) * chartHeight;
    const color = item.revenue > 0 ? 'bg-blue-500' : 'bg-gray-300';
    
    html += `
      <div class="flex-1 flex flex-col items-center">
        <div class="${color} w-full rounded-t" style="height: ${height}px; min-height: 2px;"></div>
        <div class="text-xs text-gray-600 mt-1 text-center">${formatDDMMYYYY(item.date).slice(0, 5)}</div>
        <div class="text-xs font-semibold">${formatMoney(item.revenue, false)}</div>
      </div>
    `;
  });
  
  html += '</div></div>';
  chartEl.innerHTML = html;
}

/**
 * Hiển thị biểu đồ tròn phân loại doanh thu
 * @param {Object} categories - Dữ liệu categories
 */
function displayRevenuePieChart(categories) {
  const chartEl = document.getElementById('categoryChart');
  if (!chartEl || !Object.keys(categories).length) {
    if (chartEl) {
      chartEl.innerHTML = '<p class="text-gray-500 text-center">Không có dữ liệu</p>';
    }
    return;
  }
  
  const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  let html = '<div class="space-y-2">';
  let colorIndex = 0;
  
  Object.entries(categories).forEach(([category, amount]) => {
    const percentage = total > 0 ? (amount / total * 100).toFixed(1) : 0;
    const color = colors[colorIndex % colors.length];
    
    html += `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: ${color}"></div>
          <span class="text-sm">${category}</span>
        </div>
        <div class="text-right">
          <div class="text-sm font-semibold">${formatMoney(amount, true)}</div>
          <div class="text-xs text-gray-600">${percentage}%</div>
        </div>
      </div>
    `;
    
    colorIndex++;
  });
  
  html += '</div>';
  chartEl.innerHTML = html;
}

/**
 * Export dữ liệu doanh thu
 * @param {string} format - Format: excel, pdf
 */
async function exportRevenueData(format) {
  try {
    const startDate = document.getElementById('revenueStartDate')?.value || '';
    const endDate = document.getElementById('revenueEndDate')?.value || '';
    const reportType = document.getElementById('revenueReportType')?.value || 'daily';
    
    showGlobalLoading(true, `Đang xuất file ${format.toUpperCase()}...`);
    
    const response = await callAPI('exportRevenueData', {
      startDate: startDate,
      endDate: endDate,
      reportType: reportType,
      format: format
    });
    
    if (response.success && response.data.downloadUrl) {
      // Tải file
      const link = document.createElement('a');
      link.href = response.data.downloadUrl;
      link.download = `doanh-thu-${startDate}-${endDate}.${format}`;
      link.click();
      
      showToast(`Xuất file ${format.toUpperCase()} thành công!`, 'success');
    } else {
      throw new Error(response.error || 'Xuất file thất bại');
    }
    
  } catch (error) {
    console.error('Export revenue error:', error);
    showToast('Lỗi xuất file: ' + error.message, 'error');
  } finally {
    showGlobalLoading(false);
  }
}

/**
 * Hiển thị lỗi doanh thu
 * @param {string} errorMessage - Thông báo lỗi
 */
function showRevenueError(errorMessage) {
  const contentEl = document.getElementById('revenueContent');
  if (!contentEl) return;
  
  contentEl.innerHTML = `
    <div class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
      <div class="flex items-center gap-2">
        <span class="text-2xl">❌</span>
        <span class="font-bold">Lỗi tải dữ liệu</span>
      </div>
      <div class="text-sm mt-2">${escapeHtml(errorMessage || 'Có lỗi xảy ra')}</div>
    </div>
  `;
}

/**
 * Called khi revenue tab được active
 */
function onRevenueTabActive() {
  // Set default dates (last 7 days)
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  
  const startDateEl = document.getElementById('revenueStartDate');
  const endDateEl = document.getElementById('revenueEndDate');
  
  if (startDateEl && !startDateEl.value) {
    startDateEl.value = toDateInputValue(lastWeek);
  }
  
  if (endDateEl && !endDateEl.value) {
    endDateEl.value = toDateInputValue(today);
  }
  
  // Load data
  loadRevenueData();
}

// Export các hàm
window.loadRevenueData = loadRevenueData;
window.displayRevenueData = displayRevenueData;
window.displayRevenueCharts = displayRevenueCharts;
window.displayRevenueLineChart = displayRevenueLineChart;
window.displayRevenuePieChart = displayRevenuePieChart;
window.exportRevenueData = exportRevenueData;
window.showRevenueError = showRevenueError;
window.onRevenueTabActive = onRevenueTabActive;

console.log('Revenue module loaded');
