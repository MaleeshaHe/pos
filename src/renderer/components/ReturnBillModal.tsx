import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Search, RotateCcw, CheckCircle, Minus, Plus } from 'lucide-react';
import Modal from './Modal';

interface ReturnBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BillItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  returnQuantity: number;
}

const ReturnBillModal = ({ isOpen, onClose }: ReturnBillModalProps) => {
  const [billNumber, setBillNumber] = useState('');
  const [bill, setBill] = useState<any>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'credit'>('cash');

  const handleSearchBill = async () => {
    if (!billNumber.trim()) {
      toast.error('Please enter a bill number');
      return;
    }

    setLoading(true);
    try {
      const result = await window.api.getBillByNumber(billNumber);
      if (result.success && result.data) {
        setBill(result.data);

        // Get bill items
        const billItemsResult = await window.api.getBill(result.data.id);
        if (billItemsResult.success && billItemsResult.data.items) {
          setItems(
            billItemsResult.data.items.map((item: any) => ({
              ...item,
              returnQuantity: 0,
            }))
          );
        }

        toast.success('Bill found!');
      } else {
        toast.error('Bill not found');
        setBill(null);
        setItems([]);
      }
    } catch (error) {
      toast.error('Error searching for bill');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateReturnQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    const item = newItems[index];
    newItems[index].returnQuantity = Math.max(0, Math.min(quantity, item.quantity));
    setItems(newItems);
  };

  const handleProcessReturn = async () => {
    const itemsToReturn = items.filter((item) => item.returnQuantity > 0);

    if (itemsToReturn.length === 0) {
      toast.error('Please select items to return');
      return;
    }

    if (!confirm('Are you sure you want to process this return/refund?')) {
      return;
    }

    setProcessing(true);
    try {
      const refundAmount = itemsToReturn.reduce(
        (sum, item) => sum + item.unitPrice * item.returnQuantity,
        0
      );

      // Create a negative bill entry for the return
      const returnBillData = {
        customerId: bill.customerId || null,
        userId: bill.userId,
        subtotal: -refundAmount,
        discount: 0,
        total: -refundAmount,
        paymentMethod: refundMethod,
        paidAmount: refundMethod === 'cash' ? refundAmount : 0,
        changeAmount: 0,
        creditAmount: refundMethod === 'credit' ? refundAmount : 0,
        notes: `Return for Bill #${bill.billNumber}`,
        items: itemsToReturn.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: -item.returnQuantity, // Negative quantity for return
          unitPrice: item.unitPrice,
          discount: 0,
          subtotal: -(item.unitPrice * item.returnQuantity),
        })),
      };

      const result = await window.api.createBill(returnBillData);

      if (result.success) {
        toast.success(`Return processed! Refund: Rs. ${refundAmount.toFixed(2)}`);

        // Print return receipt if needed
        console.log('Return receipt for:', result.data);

        // Reset form
        setBillNumber('');
        setBill(null);
        setItems([]);
        onClose();
      } else {
        toast.error(result.error || 'Failed to process return');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalRefund = () => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.returnQuantity, 0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Return / Refund" size="xl">
      <div className="p-6">
        {/* Bill Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bill Number
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchBill()}
              placeholder="Enter bill number (e.g., BILL-20250114-001)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <button
              onClick={handleSearchBill}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search size={18} />
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bill Information */}
        {bill && (
          <>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Bill Number</p>
                  <p className="font-semibold text-gray-900">{bill.billNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(bill.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Amount</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(bill.total)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900 capitalize">{bill.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Refund Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Method
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setRefundMethod('cash')}
                  className={`flex-1 py-2 rounded-lg font-medium border-2 ${
                    refundMethod === 'cash'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  Cash Refund
                </button>
                <button
                  onClick={() => setRefundMethod('credit')}
                  className={`flex-1 py-2 rounded-lg font-medium border-2 ${
                    refundMethod === 'credit'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  disabled={!bill.customerId}
                >
                  Credit to Account
                </button>
              </div>
              {refundMethod === 'credit' && !bill.customerId && (
                <p className="text-xs text-red-600 mt-1">
                  This bill has no customer account for credit refund
                </p>
              )}
            </div>

            {/* Items to Return */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Items to Return
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">
                          Product
                        </th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">
                          Unit Price
                        </th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">
                          Sold Qty
                        </th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">
                          Return Qty
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">
                          Refund
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3">
                            <p className="text-sm font-medium text-gray-900">
                              {item.productName}
                            </p>
                          </td>
                          <td className="py-2 px-3 text-center text-sm text-gray-600">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-2 px-3 text-center text-sm font-semibold text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  updateReturnQuantity(index, item.returnQuantity - 1)
                                }
                                className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
                                disabled={item.returnQuantity === 0}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-12 text-center font-semibold text-sm">
                                {item.returnQuantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateReturnQuantity(index, item.returnQuantity + 1)
                                }
                                className="w-6 h-6 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded"
                                disabled={item.returnQuantity >= item.quantity}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-sm text-orange-600">
                            {formatCurrency(item.unitPrice * item.returnQuantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-right font-semibold text-gray-700">
                          Total Refund:
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-lg text-orange-600">
                          {formatCurrency(getTotalRefund())}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            disabled={processing}
          >
            Cancel
          </button>
          {bill && (
            <button
              onClick={handleProcessReturn}
              disabled={processing || getTotalRefund() === 0}
              className="flex-1 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Process Return
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ReturnBillModal;
