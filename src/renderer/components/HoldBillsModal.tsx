import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, Trash2, Play, ShoppingCart } from 'lucide-react';
import Modal from './Modal';

interface HoldBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: (bill: any) => void;
}

const HoldBillsModal = ({ isOpen, onClose, onResume }: HoldBillsModalProps) => {
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHeldBills();
    }
  }, [isOpen]);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Held Bills${heldBills.length > 0 ? ` (${heldBills.length})` : ''}`}
      size="lg"
    >
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading held bills...</p>
          </div>
        ) : heldBills.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock size={40} className="text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-2">No held bills</p>
            <p className="text-sm text-gray-500 mb-1">Press F5 or click "Hold Bill" to save a bill for later</p>
            <p className="text-xs text-gray-400 mt-4">
              💡 Tip: Held bills are automatically removed when resumed
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {heldBills.map((bill) => (
              <div
                key={bill.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">
                        Bill #{bill.billNumber || bill.id}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        On Hold
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      <Clock size={12} className="inline mr-1" />
                      {formatDateTime(bill.createdAt)}
                    </p>
                    {bill.customerId && (
                      <p className="text-xs text-gray-600 mt-1">
                        Customer: {bill.customerName || `ID: ${bill.customerId}`}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(bill.total)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {bill.items?.length || 0} items
                    </p>
                  </div>
                </div>

                {/* Items Preview */}
                {bill.items && bill.items.length > 0 && (
                  <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                    <div className="space-y-1">
                      {bill.items.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-gray-700">
                          <span>
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      ))}
                      {bill.items.length > 3 && (
                        <p className="text-gray-500 italic">
                          +{bill.items.length - 3} more items...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Bill Notes */}
                {bill.notes && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <p className="text-gray-600 font-semibold mb-1">📝 Notes:</p>
                    <p className="text-gray-700 italic">{bill.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResume(bill.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    <Play size={16} />
                    Resume
                  </button>
                  <button
                    onClick={() => handleDelete(bill.id)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default HoldBillsModal;
