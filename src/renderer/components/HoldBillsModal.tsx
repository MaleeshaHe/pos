import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, Trash2, Play, ShoppingCart, Search, Filter, User, Calendar, DollarSign, X } from 'lucide-react';
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

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && filteredBills.length > 0 && !searchQuery) {
        // Quick resume first bill with Enter
        handleResume(filteredBills[0].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredBills, searchQuery]);

  const stats = getTotalStats();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Held Bills Manager"
      size="lg"
    >
      <div className="flex flex-col h-[80vh]">
        {/* Statistics Panel */}
        {heldBills.length > 0 && !loading && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-700 mb-1">
                  <Clock size={18} />
                  <span className="text-xs font-medium">Total Bills</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{filteredBills.length}</p>
                {searchQuery && filteredBills.length !== heldBills.length && (
                  <p className="text-xs text-gray-500">of {heldBills.length} total</p>
                )}
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-700 mb-1">
                  <DollarSign size={18} />
                  <span className="text-xs font-medium">Total Value</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-700 mb-1">
                  <ShoppingCart size={18} />
                  <span className="text-xs font-medium">Total Items</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalItems}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        {heldBills.length > 0 && !loading && (
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by bill number, customer, or notes..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'total' | 'customer')}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none bg-white cursor-pointer"
                >
                  <option value="date">Sort by Date</option>
                  <option value="total">Sort by Total</option>
                  <option value="customer">Sort by Customer</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bills List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading held bills...</p>
            </div>
          ) : heldBills.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
                <Clock size={40} className="text-yellow-600" />
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-2">No held bills</p>
              <p className="text-sm text-gray-500 mb-1">Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">F5</kbd> to save a bill for later</p>
              <p className="text-xs text-gray-400 mt-4">
                💡 Tip: Held bills are perfect for managing interrupted sales
              </p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search size={32} className="text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-2">No matching bills</p>
              <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBills.map((bill, index) => (
                <div
                  key={bill.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    selectedBillId === bill.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-yellow-400 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedBillId(bill.id)}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 text-base">
                          #{bill.billNumber || bill.id}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-full font-semibold border border-yellow-300">
                          On Hold
                        </span>
                        {index === 0 && !searchQuery && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                            Press Enter ↵
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock size={12} className="text-yellow-600" />
                          <span className="font-semibold text-yellow-700">{getTimeAgo(bill.createdAt)}</span>
                          <span className="text-gray-400">• {formatDateTime(bill.createdAt)}</span>
                        </p>
                        {bill.customerId && (
                          <p className="text-xs text-gray-700 flex items-center gap-1">
                            <User size={12} className="text-blue-600" />
                            <span className="font-medium">{bill.customerName || `Customer #${bill.customerId}`}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600 mb-1">
                        {formatCurrency(bill.total)}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center justify-end gap-1">
                        <ShoppingCart size={12} />
                        {bill.items?.length || 0} item{(bill.items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  {bill.items && bill.items.length > 0 && (
                    <div className="mb-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <ShoppingCart size={12} />
                        Items in this bill:
                      </p>
                      <div className="space-y-1.5">
                        {bill.items.slice(0, 3).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-gray-700 font-medium">
                              <span className="inline-block w-6 text-blue-600 font-bold">{item.quantity}×</span>
                              {item.productName}
                            </span>
                            <span className="font-bold text-gray-900">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                        {bill.items.length > 3 && (
                          <p className="text-gray-500 italic text-xs pt-1 border-t border-gray-300">
                            +{bill.items.length - 3} more item{bill.items.length - 3 > 1 ? 's' : ''}...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bill Notes */}
                  {bill.notes && (
                    <div className="mb-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1">
                        📝 Notes:
                      </p>
                      <p className="text-xs text-gray-700 italic leading-relaxed">{bill.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResume(bill.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      <Play size={16} />
                      Resume Bill
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(bill.id);
                      }}
                      className="px-4 py-2.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:text-red-700 font-semibold transition-all border border-red-300"
                      title="Delete this held bill"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              <p>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm">Esc</kbd> to close
                {filteredBills.length > 0 && !searchQuery && (
                  <>
                    {' • '}
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm">Enter</kbd> to resume first bill
                  </>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 font-semibold shadow-md transition-all"
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
