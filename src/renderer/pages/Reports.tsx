import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FileText, Download, Calendar, TrendingUp, DollarSign, Package, Users, Printer } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';

type ReportType = 'sales' | 'products' | 'customers' | 'zreport' | 'profit';

const Reports = () => {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { id: 'sales' as ReportType, name: 'Sales Summary', description: 'Total sales and revenue overview', icon: TrendingUp },
    { id: 'products' as ReportType, name: 'Product-wise Sales', description: 'Best selling products analysis', icon: Package },
    { id: 'customers' as ReportType, name: 'Customer Credit', description: 'Outstanding customer credits', icon: Users },
    { id: 'zreport' as ReportType, name: 'Z-Report (Cash In/Out)', description: 'Daily cash reconciliation', icon: DollarSign },
    { id: 'profit' as ReportType, name: 'Profit & Loss', description: 'Revenue vs cost analysis', icon: FileText },
  ];

  const setQuickFilter = (filter: 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth') => {
    const now = new Date();
    let start: Date, end: Date;

    switch (filter) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case 'week':
        start = subDays(now, 7);
        end = now;
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      switch (reportType) {
        case 'sales':
          await generateSalesReport();
          break;
        case 'products':
          await generateProductSalesReport();
          break;
        case 'customers':
          await generateCustomerCreditReport();
          break;
        case 'zreport':
          await generateZReport();
          break;
        case 'profit':
          await generateProfitReport();
          break;
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateSalesReport = async () => {
    const billsResult = await window.api.getBills();
    if (!billsResult.success) {
      toast.error('Failed to load bills');
      return;
    }

    const bills = billsResult.data.filter((bill: any) => {
      const billDate = new Date(bill.createdAt);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      return billDate >= start && billDate <= end;
    });

    const totalSales = bills.reduce((sum: number, bill: any) => sum + bill.total, 0);
    const totalDiscount = bills.reduce((sum: number, bill: any) => sum + bill.discount, 0);
    const totalTax = bills.reduce((sum: number, bill: any) => sum + bill.tax, 0);
    const cashSales = bills.filter((b: any) => b.paymentMethod === 'cash').reduce((sum: number, bill: any) => sum + bill.total, 0);
    const cardSales = bills.filter((b: any) => b.paymentMethod === 'card').reduce((sum: number, bill: any) => sum + bill.total, 0);
    const creditSales = bills.filter((b: any) => b.paymentMethod === 'credit').reduce((sum: number, bill: any) => sum + bill.creditAmount, 0);

    setReportData({
      type: 'sales',
      totalTransactions: bills.length,
      totalSales,
      totalDiscount,
      totalTax,
      cashSales,
      cardSales,
      creditSales,
      averageTransaction: bills.length > 0 ? totalSales / bills.length : 0,
    });
  };

  const generateProductSalesReport = async () => {
    const billsResult = await window.api.getBills();
    if (!billsResult.success) return;

    const bills = billsResult.data.filter((bill: any) => {
      const billDate = new Date(bill.createdAt);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      return billDate >= start && billDate <= end;
    });

    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const bill of bills) {
      const itemsResult = await window.api.getBillItems(bill.id);
      if (itemsResult.success) {
        itemsResult.data.forEach((item: any) => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.productName,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.subtotal;
        });
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    setReportData({
      type: 'products',
      products: topProducts,
      totalProducts: Object.keys(productSales).length,
    });
  };

  const generateCustomerCreditReport = async () => {
    const customersResult = await window.api.getCustomers();
    if (!customersResult.success) return;

    const customersWithCredit = customersResult.data
      .filter((customer: any) => customer.currentCredit > 0)
      .sort((a: any, b: any) => b.currentCredit - a.currentCredit);

    const totalCredit = customersWithCredit.reduce((sum: number, customer: any) => sum + customer.currentCredit, 0);

    setReportData({
      type: 'customers',
      customers: customersWithCredit,
      totalCustomers: customersWithCredit.length,
      totalCreditOutstanding: totalCredit,
    });
  };

  const generateZReport = async () => {
    const billsResult = await window.api.getBills();
    if (!billsResult.success) return;

    const bills = billsResult.data.filter((bill: any) => {
      const billDate = new Date(bill.createdAt);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      return billDate >= start && billDate <= end;
    });

    const cashIn = bills
      .filter((b: any) => b.paymentMethod === 'cash')
      .reduce((sum: number, bill: any) => sum + bill.paidAmount, 0);

    const cardIn = bills
      .filter((b: any) => b.paymentMethod === 'card')
      .reduce((sum: number, bill: any) => sum + bill.paidAmount, 0);

    const creditIn = bills
      .filter((b: any) => b.paymentMethod === 'credit')
      .reduce((sum: number, bill: any) => sum + bill.creditAmount, 0);

    const totalIn = cashIn + cardIn;
    const totalTransactions = bills.length;

    setReportData({
      type: 'zreport',
      cashIn,
      cardIn,
      creditIn,
      totalIn,
      totalTransactions,
      openingBalance: 0,
      closingBalance: totalIn,
    });
  };

  const generateProfitReport = async () => {
    const billsResult = await window.api.getBills();
    if (!billsResult.success) return;

    const bills = billsResult.data.filter((bill: any) => {
      const billDate = new Date(bill.createdAt);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      return billDate >= start && billDate <= end;
    });

    let totalRevenue = 0;
    let totalCost = 0;

    for (const bill of bills) {
      totalRevenue += bill.total;

      const itemsResult = await window.api.getBillItems(bill.id);
      if (itemsResult.success) {
        for (const item of itemsResult.data) {
          const productResult = await window.api.getProduct(item.productId);
          if (productResult.success && productResult.data) {
            totalCost += productResult.data.costPrice * item.quantity;
          }
        }
      }
    }

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    setReportData({
      type: 'profit',
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
      totalTransactions: bills.length,
    });
  };

  const exportToCSV = () => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }

    let csvContent = '';
    let filename = '';

    switch (reportData.type) {
      case 'sales':
        filename = `sales-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
        csvContent = [
          ['Sales Summary Report'],
          [`Period: ${dateRange.startDate} to ${dateRange.endDate}`],
          [''],
          ['Metric', 'Value'],
          ['Total Transactions', reportData.totalTransactions],
          ['Total Sales', `Rs. ${reportData.totalSales.toFixed(2)}`],
          ['Total Discount', `Rs. ${reportData.totalDiscount.toFixed(2)}`],
          ['Total Tax', `Rs. ${reportData.totalTax.toFixed(2)}`],
          ['Cash Sales', `Rs. ${reportData.cashSales.toFixed(2)}`],
          ['Card Sales', `Rs. ${reportData.cardSales.toFixed(2)}`],
          ['Credit Sales', `Rs. ${reportData.creditSales.toFixed(2)}`],
          ['Average Transaction', `Rs. ${reportData.averageTransaction.toFixed(2)}`],
        ].map(row => row.join(',')).join('\n');
        break;

      case 'products':
        filename = `product-sales-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
        csvContent = [
          ['Product Sales Report'],
          [`Period: ${dateRange.startDate} to ${dateRange.endDate}`],
          [''],
          ['Product Name', 'Quantity Sold', 'Total Revenue'],
          ...reportData.products.map((p: any) => [
            `"${p.name}"`,
            p.quantity,
            `Rs. ${p.revenue.toFixed(2)}`
          ])
        ].map(row => row.join(',')).join('\n');
        break;

      case 'customers':
        filename = `customer-credit-${dateRange.startDate}.csv`;
        csvContent = [
          ['Customer Credit Report'],
          [`As of: ${dateRange.endDate}`],
          [''],
          ['Customer Name', 'Phone', 'Credit Limit', 'Current Credit', 'Available Credit'],
          ...reportData.customers.map((c: any) => [
            `"${c.name}"`,
            c.phone || 'N/A',
            `Rs. ${c.creditLimit.toFixed(2)}`,
            `Rs. ${c.currentCredit.toFixed(2)}`,
            `Rs. ${(c.creditLimit - c.currentCredit).toFixed(2)}`
          ])
        ].map(row => row.join(',')).join('\n');
        break;

      case 'zreport':
        filename = `z-report-${dateRange.startDate}.csv`;
        csvContent = [
          ['Z-Report (Cash In/Out)'],
          [`Date: ${dateRange.startDate}`],
          [''],
          ['Category', 'Amount'],
          ['Opening Balance', `Rs. ${reportData.openingBalance.toFixed(2)}`],
          ['Cash In', `Rs. ${reportData.cashIn.toFixed(2)}`],
          ['Card In', `Rs. ${reportData.cardIn.toFixed(2)}`],
          ['Credit Sales', `Rs. ${reportData.creditIn.toFixed(2)}`],
          ['Total In', `Rs. ${reportData.totalIn.toFixed(2)}`],
          ['Closing Balance', `Rs. ${reportData.closingBalance.toFixed(2)}`],
          ['Total Transactions', reportData.totalTransactions],
        ].map(row => row.join(',')).join('\n');
        break;

      case 'profit':
        filename = `profit-loss-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
        csvContent = [
          ['Profit & Loss Report'],
          [`Period: ${dateRange.startDate} to ${dateRange.endDate}`],
          [''],
          ['Metric', 'Amount'],
          ['Total Revenue', `Rs. ${reportData.totalRevenue.toFixed(2)}`],
          ['Total Cost', `Rs. ${reportData.totalCost.toFixed(2)}`],
          ['Gross Profit', `Rs. ${reportData.grossProfit.toFixed(2)}`],
          ['Profit Margin', `${reportData.profitMargin.toFixed(2)}%`],
          ['Total Transactions', reportData.totalTransactions],
        ].map(row => row.join(',')).join('\n');
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    toast.success('Report exported to CSV');
  };

  const exportToPDF = () => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups for PDF export');
      return;
    }

    let reportContent = '';

    switch (reportData.type) {
      case 'sales':
        reportContent = `
          <h2>Sales Summary Report</h2>
          <p>Period: ${dateRange.startDate} to ${dateRange.endDate}</p>
          <table>
            <tr><td>Total Transactions:</td><td>${reportData.totalTransactions}</td></tr>
            <tr><td>Total Sales:</td><td>Rs. ${reportData.totalSales.toFixed(2)}</td></tr>
            <tr><td>Total Discount:</td><td>Rs. ${reportData.totalDiscount.toFixed(2)}</td></tr>
            <tr><td>Total Tax:</td><td>Rs. ${reportData.totalTax.toFixed(2)}</td></tr>
            <tr><td>Cash Sales:</td><td>Rs. ${reportData.cashSales.toFixed(2)}</td></tr>
            <tr><td>Card Sales:</td><td>Rs. ${reportData.cardSales.toFixed(2)}</td></tr>
            <tr><td>Credit Sales:</td><td>Rs. ${reportData.creditSales.toFixed(2)}</td></tr>
            <tr><td>Average Transaction:</td><td>Rs. ${reportData.averageTransaction.toFixed(2)}</td></tr>
          </table>
        `;
        break;

      case 'products':
        reportContent = `
          <h2>Product Sales Report</h2>
          <p>Period: ${dateRange.startDate} to ${dateRange.endDate}</p>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity Sold</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.products.map((p: any) => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.quantity}</td>
                  <td>Rs. ${p.revenue.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case 'customers':
        reportContent = `
          <h2>Customer Credit Report</h2>
          <p>As of: ${dateRange.endDate}</p>
          <p>Total Outstanding Credit: Rs. ${reportData.totalCreditOutstanding.toFixed(2)}</p>
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Credit Limit</th>
                <th>Current Credit</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.customers.map((c: any) => `
                <tr>
                  <td>${c.name}</td>
                  <td>${c.phone || 'N/A'}</td>
                  <td>Rs. ${c.creditLimit.toFixed(2)}</td>
                  <td>Rs. ${c.currentCredit.toFixed(2)}</td>
                  <td>Rs. ${(c.creditLimit - c.currentCredit).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case 'zreport':
        reportContent = `
          <h2>Z-Report (Daily Cash In/Out)</h2>
          <p>Date: ${dateRange.startDate}</p>
          <table>
            <tr><td>Opening Balance:</td><td>Rs. ${reportData.openingBalance.toFixed(2)}</td></tr>
            <tr><td>Cash In:</td><td>Rs. ${reportData.cashIn.toFixed(2)}</td></tr>
            <tr><td>Card In:</td><td>Rs. ${reportData.cardIn.toFixed(2)}</td></tr>
            <tr><td>Credit Sales:</td><td>Rs. ${reportData.creditIn.toFixed(2)}</td></tr>
            <tr><td><strong>Total In:</strong></td><td><strong>Rs. ${reportData.totalIn.toFixed(2)}</strong></td></tr>
            <tr><td>Closing Balance:</td><td>Rs. ${reportData.closingBalance.toFixed(2)}</td></tr>
            <tr><td>Total Transactions:</td><td>${reportData.totalTransactions}</td></tr>
          </table>
        `;
        break;

      case 'profit':
        reportContent = `
          <h2>Profit & Loss Report</h2>
          <p>Period: ${dateRange.startDate} to ${dateRange.endDate}</p>
          <table>
            <tr><td>Total Revenue:</td><td>Rs. ${reportData.totalRevenue.toFixed(2)}</td></tr>
            <tr><td>Total Cost:</td><td>Rs. ${reportData.totalCost.toFixed(2)}</td></tr>
            <tr><td><strong>Gross Profit:</strong></td><td class="${reportData.grossProfit >= 0 ? 'profit' : 'loss'}"><strong>Rs. ${reportData.grossProfit.toFixed(2)}</strong></td></tr>
            <tr><td>Profit Margin:</td><td>${reportData.profitMargin.toFixed(2)}%</td></tr>
            <tr><td>Total Transactions:</td><td>${reportData.totalTransactions}</td></tr>
          </table>
        `;
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report - ${reportTypes.find(t => t.id === reportData.type)?.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          h2 { color: #1e40af; margin-bottom: 10px; }
          p { color: #6b7280; margin-bottom: 20px; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          tr:hover { background-color: #f9fafb; }
          .profit { color: #16a34a; }
          .loss { color: #dc2626; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; margin-bottom: 5px;">Premium POS</h1>
          <p style="color: #6b7280; margin: 0;">Business Report</p>
        </div>
        ${reportContent}
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
          Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);

    toast.success('Opening PDF print dialog...');
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
        <p className="text-gray-600">Generate comprehensive business reports and insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Type Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Report Types</h2>
            <div className="space-y-2">
              {reportTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    reportType === type.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <type.icon size={20} className={reportType === type.id ? 'text-blue-600' : 'text-gray-400'} />
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{type.name}</p>
                      <p className="text-xs text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Configuration & Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {reportTypes.find((t) => t.id === reportType)?.name}
            </h2>

            {/* Date Range Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Date Filters */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setQuickFilter('today')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  Today
                </button>
                <button
                  onClick={() => setQuickFilter('yesterday')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  Yesterday
                </button>
                <button
                  onClick={() => setQuickFilter('week')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setQuickFilter('month')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  This Month
                </button>
                <button
                  onClick={() => setQuickFilter('lastMonth')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  Last Month
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={generateReport}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                <FileText size={20} />
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
              {reportData && (
                <>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    <Download size={20} />
                    CSV
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    <Printer size={20} />
                    PDF
                  </button>
                </>
              )}
            </div>

            {/* Report Preview - continued in next part... */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
