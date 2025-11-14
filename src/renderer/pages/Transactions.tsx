import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Receipt,
  Search,
  Calendar,
  Filter,
  Eye,
  Printer,
  RefreshCw,
  DollarSign,
  CreditCard,
  Banknote,
  Users,
  TrendingUp,
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import BillDetailsModal from '../components/BillDetailsModal';

interface Bill {
  id: number;
  billNumber: string;
  customerId?: number;
  customerName?: string;
  userId: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  creditAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
}

const Transactions = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'cash' | 'card' | 'credit' | 'split'>('all');

  useEffect(() => {
    loadBills();
  }, [dateFilter, customDateRange, paymentMethodFilter]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const result = await window.api.getBills();
      if (result.success) {
        setBills(result.data || []);
      } else {
        toast.error('Failed to load transactions');
      }
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    switch (dateFilter) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'custom':
        start = new Date(customDateRange.start);
        end = new Date(customDateRange.end);
        break;
      default:
        start = startOfDay(now);
        end = endOfDay(now);
    }

    return { start, end };
  };

  const filteredBills = bills.filter((bill) => {
    // Search filter
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.id.toString().includes(searchQuery);

    // Date filter
    const { start, end } = getDateRange();
    const billDate = new Date(bill.createdAt);
    const matchesDate = billDate >= start && billDate <= end;

    // Payment method filter
    const matchesPaymentMethod =
      paymentMethodFilter === 'all' || bill.paymentMethod === paymentMethodFilter;

    return matchesSearch && matchesDate && matchesPaymentMethod;
  });

  const stats = {
    totalTransactions: filteredBills.length,
    totalRevenue: filteredBills.reduce((sum, bill) => sum + bill.total, 0),
    cashTransactions: filteredBills.filter((b) => b.paymentMethod === 'cash').length,
    cardTransactions: filteredBills.filter((b) => b.paymentMethod === 'card').length,
    creditTransactions: filteredBills.filter((b) => b.paymentMethod === 'credit').length,
    totalCash: filteredBills
      .filter((b) => b.paymentMethod === 'cash')
      .reduce((sum, bill) => sum + bill.total, 0),
    totalCard: filteredBills
      .filter((b) => b.paymentMethod === 'card')
      .reduce((sum, bill) => sum + bill.total, 0),
    totalCredit: filteredBills
      .filter((b) => b.paymentMethod === 'credit')
      .reduce((sum, bill) => sum + bill.creditAmount, 0),
  };

  const handleViewDetails = async (bill: Bill) => {
    setSelectedBill(bill);
    setShowDetailsModal(true);
  };

  const handlePrintReceipt = async (bill: Bill) => {
    try {
      const result = await window.api.getBillById(bill.id);
      if (result.success) {
        const billData = result.data;
        printReceipt(billData);
      }
    } catch (error) {
      toast.error('Failed to load bill details');
    }
  };

  const printReceipt = (billData: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; padding: 0; }
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            padding: 10px;
            font-size: 12px;
          }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
          .store-name { font-size: 18px; font-weight: bold; }
          .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .items { margin: 10px 0; border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 10px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .totals { margin: 10px 0; }
          .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .grand-total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
          .footer { text-align: center; margin-top: 10px; border-top: 2px dashed #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">Premium POS</div>
          <div>Tax Invoice</div>
        </div>

        <div class="info-row">
          <span>Bill No:</span>
          <span><strong>${billData.bill.billNumber}</strong></span>
        </div>
        <div class="info-row">
          <span>Date:</span>
          <span>${format(new Date(billData.bill.createdAt), 'dd/MM/yyyy HH:mm')}</span>
        </div>
        ${
          billData.customer
            ? `<div class="info-row">
          <span>Customer:</span>
          <span>${billData.customer.name}</span>
        </div>`
            : ''
        }

        <div class="items">
          <div class="item-row" style="font-weight: bold;">
            <span>Item</span>
            <span>Qty x Price</span>
            <span>Total</span>
          </div>
          ${billData.items
            .map(
              (item: any) => `
            <div class="item-row">
              <span>${item.productName}</span>
              <span>${item.quantity} x ${item.unitPrice.toFixed(2)}</span>
              <span>${item.subtotal.toFixed(2)}</span>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>Rs. ${billData.bill.subtotal.toFixed(2)}</span>
          </div>
          ${
            billData.bill.discount > 0
              ? `<div class="total-row">
            <span>Discount:</span>
            <span>-Rs. ${billData.bill.discount.toFixed(2)}</span>
          </div>`
              : ''
          }
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>Rs. ${billData.bill.total.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Payment (${billData.bill.paymentMethod.toUpperCase()}):</span>
            <span>Rs. ${billData.bill.paidAmount.toFixed(2)}</span>
          </div>
          ${
            billData.bill.changeAmount > 0
              ? `<div class="total-row">
            <span>Change:</span>
            <span>Rs. ${billData.bill.changeAmount.toFixed(2)}</span>
          </div>`
              : ''
          }
        </div>

        <div class="footer">
          <div>Thank you for your business!</div>
          <div style="margin-top: 5px;">Please come again</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast.success('Printing receipt...');
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote size={16} className="text-green-600" />;
      case 'card':
        return <CreditCard size={16} className="text-blue-600" />;
      case 'credit':
        return <Users size={16} className="text-orange-600" />;
      default:
        return <DollarSign size={16} className="text-purple-600" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
          <p className="text-gray-600">View and manage all sales transactions</p>
        </div>
        <button
          onClick={loadBills}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <RefreshCw size={20} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <Receipt size={20} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalTransactions}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Cash</p>
            <Banknote size={20} className="text-green-600" />
          </div>
          <p className="text-lg font-bold text-gray-800">
            {stats.cashTransactions} ({formatCurrency(stats.totalCash)})
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Card/Credit</p>
            <CreditCard size={20} className="text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-800">
            {stats.cardTransactions + stats.creditTransactions}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bill number, customer..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Filter</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="credit">Credit</option>
              <option value="split">Split Payment</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Bill Number</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Date & Time</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Payment</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Amount</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Loading transactions...</p>
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <Receipt size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No transactions found</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-blue-600">{bill.billNumber}</p>
                      <p className="text-xs text-gray-500">ID: {bill.id}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900">
                        {format(new Date(bill.createdAt), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500">{format(new Date(bill.createdAt), 'HH:mm:ss')}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900">{bill.customerName || 'Walk-in Customer'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(bill.paymentMethod)}
                        <span className="text-sm text-gray-700 capitalize">{bill.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(bill.total)}</p>
                      {bill.discount > 0 && (
                        <p className="text-xs text-green-600">-{formatCurrency(bill.discount)} discount</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bill.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : bill.status === 'refunded'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetails(bill)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(bill)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title="Print Receipt"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <BillDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBill(null);
          }}
          billId={selectedBill.id}
        />
      )}
    </div>
  );
};

export default Transactions;
