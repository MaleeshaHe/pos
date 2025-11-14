import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, Trash2, Play, ShoppingCart, Search, Filter, User, Calendar, DollarSign, X, Package, FileText, ChevronRight } from 'lucide-react';
import Modal from './Modal';

interface HoldBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: (bill: any) => void;
}

const HoldBillsModal = ({ isOpen, onClose, onResume }: HoldBillsModalProps) => {
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'customer'>('date');
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHeldBills();
      setSearchQuery('');
      setSelectedBillId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter and sort bills
    let result = [...heldBills];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (bill) =>
          bill.billNumber?.toLowerCase().includes(query) ||
          bill.customerName?.toLowerCase().includes(query) ||
          bill.notes?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'total':
          return b.total - a.total;
        case 'customer':
          return (a.customerName || 'Walk-in').localeCompare(b.customerName || 'Walk-in');
        default:
          return 0;
      }
    });

    setFilteredBills(result);

    // Auto-select first bill if current selection is not in filtered results
    if (result.length > 0 && (!selectedBillId || !result.find(b => b.id === selectedBillId))) {
      setSelectedBillId(result[0].id);
    } else if (result.length === 0) {
      setSelectedBillId(null);
    }
  }, [heldBills, searchQuery, sortBy]);

  const loadHeldBills = async () => {
    setLoading(true);
    try {
      const result = await window.api.getHeldBills();
      if (result.success) {
        setHeldBills(result.data);
      }
    } catch (error) {
      toast.error('Failed to load held bills');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (billId: number) => {
    try {
      const result = await window.api.resumeBill(billId);
      if (result.success) {
        onResume(result.data);
        loadHeldBills(); // Refresh list
      } else {
        toast.error(result.error || 'Failed to resume bill');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    }
  };

  const handleDelete = async (billId: number) => {
    if (!confirm('Are you sure you want to delete this held bill?')) {
      return;
    }

    try {
      const result = await window.api.deleteHeldBill(billId);
      if (result.success) {
        toast.success('Held bill deleted');
        setSelectedBillId(null);
        loadHeldBills();
      } else {
        toast.error(result.error || 'Failed to delete bill');
      }
    } catch (error) {
      toast.error('Failed to delete bill');
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDateTime(dateString);
  };

  const getTotalStats = () => {
    const totalValue = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
    const totalItems = filteredBills.reduce((sum, bill) => sum + (bill.items?.length || 0), 0);
    return { totalValue, totalItems };
  };

  const selectedBill = filteredBills.find(b => b.id === selectedBillId);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && selectedBill) {
        handleResume(selectedBill.id);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = filteredBills.findIndex(b => b.id === selectedBillId);
        if (currentIndex < filteredBills.length - 1) {
          setSelectedBillId(filteredBills[currentIndex + 1].id);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = filteredBills.findIndex(b => b.id === selectedBillId);
        if (currentIndex > 0) {
          setSelectedBillId(filteredBills[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredBills, selectedBillId, selectedBill]);

  const stats = getTotalStats();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Held Bills Manager"
      size="xl"
    >
      <div className="flex flex-col h-[85vh]">
        {/* Statistics Panel */}
        {heldBills.length > 0 && !loading && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 px-6 py-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-700 mb-1">
                  <Clock size={16} />
                  <span className="text-xs font-medium">Total Bills</span>
                </div>
                <p className="text-xl font-bold text-gray-800">{filteredBills.length}</p>
                {searchQuery && filteredBills.length !== heldBills.length && (
                  <p className="text-xs text-gray-500">of {heldBills.length} total</p>
                )}
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-700 mb-1">
                  <DollarSign size={16} />
                  <span className="text-xs font-medium">Total Value</span>
                </div>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-700 mb-1">
                  <ShoppingCart size={16} />
                  <span className="text-xs font-medium">Total Items</span>
                </div>
                <p className="text-xl font-bold text-gray-800">{stats.totalItems}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Two Columns */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading held bills...</p>
            </div>
          ) : heldBills.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 mb-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
                <Clock size={40} className="text-yellow-600" />
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-2">No held bills</p>
              <p className="text-sm text-gray-500 mb-1">Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">F5</kbd> to save a bill for later</p>
              <p className="text-xs text-gray-400 mt-4">
                💡 Tip: Held bills are perfect for managing interrupted sales
              </p>
            </div>
          ) : (
            <>
              {/* Left Column - Bills List */}
              <div className="w-2/5 border-r border-gray-200 flex flex-col bg-gray-50">
                {/* Search and Filter */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search bills..."
                      className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'total' | 'customer')}
                      className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs appearance-none bg-white cursor-pointer"
                    >
                      <option value="date">📅 Sort by Date</option>
                      <option value="total">💰 Sort by Amount</option>
                      <option value="customer">👤 Sort by Customer</option>
                    </select>
                  </div>
                </div>

                {/* Bills List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredBills.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Search size={32} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700 mb-1">No matching bills</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredBills.map((bill, index) => (
                        <div
                          key={bill.id}
                          onClick={() => setSelectedBillId(bill.id)}
                          className={`p-4 cursor-pointer transition-all ${
                            selectedBillId === bill.id
                              ? 'bg-blue-50 border-l-4 border-l-blue-600'
                              : 'bg-white hover:bg-gray-50 border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 text-sm">
                                  #{bill.billNumber || bill.id}
                                </h3>
                                {index === 0 && selectedBillId === bill.id && (
                                  <ChevronRight size={14} className="text-blue-600" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                                <Clock size={10} className="text-yellow-600" />
                                <span className="font-medium text-yellow-700">{getTimeAgo(bill.createdAt)}</span>
                              </p>
                              {bill.customerId && (
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <User size={10} className="text-blue-600" />
                                  <span className="truncate">{bill.customerName || `#${bill.customerId}`}</span>
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-sm font-bold text-blue-600">
                                {formatCurrency(bill.total)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {bill.items?.length || 0} items
                              </p>
                            </div>
                          </div>
                          {bill.notes && (
                            <p className="text-xs text-gray-500 italic truncate mt-1">
                              📝 {bill.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Bill Details */}
              <div className="w-3/5 flex flex-col bg-white">
                {selectedBill ? (
                  <>
                    {/* Detail Header */}
                    <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Bill #{selectedBill.billNumber || selectedBill.id}
                          </h2>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-full font-semibold border border-yellow-300">
                              ⏸ On Hold
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-blue-600 mb-1">
                            {formatCurrency(selectedBill.total)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedBill.items?.length || 0} item{(selectedBill.items?.length || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Bill Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                            <Clock size={12} className="text-yellow-600" />
                            Held Time
                          </p>
                          <p className="font-semibold text-gray-900">{getTimeAgo(selectedBill.createdAt)}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatFullDateTime(selectedBill.createdAt)}</p>
                        </div>
                        <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                            <User size={12} className="text-blue-600" />
                            Customer
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedBill.customerName || 'Walk-in Customer'}
                          </p>
                          {selectedBill.customerId && (
                            <p className="text-xs text-gray-500 mt-1">ID: {selectedBill.customerId}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <Package size={16} className="text-blue-600" />
                          Items in this bill
                        </h3>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                          <div className="divide-y divide-gray-200">
                            {selectedBill.items && selectedBill.items.length > 0 ? (
                              selectedBill.items.map((item: any, idx: number) => (
                                <div key={idx} className="p-3 flex items-center justify-between hover:bg-white transition-colors">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <span className="text-sm font-bold text-blue-600">{item.quantity}×</span>
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatCurrency(item.unitPrice)} × {item.quantity}
                                        {item.discount > 0 && (
                                          <span className="text-green-600 ml-1">(-{formatCurrency(item.discount)})</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-center text-sm text-gray-500">
                                No items found
                              </div>
                            )}
                          </div>

                          {/* Bill Summary */}
                          <div className="bg-white border-t-2 border-gray-300 p-4">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between text-gray-600">
                                <span>Subtotal:</span>
                                <span className="font-medium">{formatCurrency(selectedBill.subtotal)}</span>
                              </div>
                              {selectedBill.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Discount:</span>
                                  <span className="font-medium">-{formatCurrency(selectedBill.discount)}</span>
                                </div>
                              )}
                              {selectedBill.tax > 0 && (
                                <div className="flex justify-between text-gray-600">
                                  <span>Tax:</span>
                                  <span className="font-medium">{formatCurrency(selectedBill.tax)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t-2 border-gray-300">
                                <span>Total:</span>
                                <span className="text-blue-600">{formatCurrency(selectedBill.total)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bill Notes */}
                      {selectedBill.notes && (
                        <div className="mb-6">
                          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <FileText size={16} className="text-blue-600" />
                            Notes
                          </h3>
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-gray-700 italic leading-relaxed">{selectedBill.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleResume(selectedBill.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-bold shadow-lg hover:shadow-xl transition-all text-sm"
                        >
                          <Play size={18} />
                          Resume Bill
                        </button>
                        <button
                          onClick={() => handleDelete(selectedBill.id)}
                          className="px-6 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:text-red-700 font-bold transition-all border-2 border-red-300 text-sm"
                          title="Delete this held bill"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                      <FileText size={48} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Bill Selected</h3>
                    <p className="text-sm text-gray-500 max-w-md">
                      Select a bill from the list on the left to view its details and manage it
                    </p>
                    <div className="mt-6 text-xs text-gray-400 space-y-1">
                      <p>💡 Tip: Use arrow keys ↑↓ to navigate</p>
                      <p>💡 Press Enter to resume selected bill</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              <p className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm">Esc</kbd>
                <span>Close</span>
                {selectedBill && (
                  <>
                    <span className="text-gray-400">•</span>
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm">Enter</kbd>
                    <span>Resume</span>
                    <span className="text-gray-400">•</span>
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm">↑↓</kbd>
                    <span>Navigate</span>
                  </>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 font-semibold shadow-md transition-all text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default HoldBillsModal;
