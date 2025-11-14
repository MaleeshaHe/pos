import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, User, Calendar, CreditCard, FileText, Package } from 'lucide-react';
import Modal from './Modal';

interface BillDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  billId: number;
}

interface BillItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

interface BillData {
  bill: any;
  items: BillItem[];
  customer?: any;
}

const BillDetailsModal = ({ isOpen, onClose, billId }: BillDetailsModalProps) => {
  const [billData, setBillData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && billId) {
      loadBillDetails();
    }
  }, [isOpen, billId]);

  const loadBillDetails = async () => {
    setLoading(true);
    try {
      const result = await window.api.getBillById(billId);
      if (result.success) {
        setBillData(result.data);
      }
    } catch (error) {
      console.error('Failed to load bill details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bill Details" size="lg">
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : billData ? (
          <>
            {/* Bill Header Info */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Bill Number</p>
                  <p className="text-lg font-bold text-blue-600">{billData.bill.billNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Date & Time</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <p className="text-sm text-gray-900">
                      {format(new Date(billData.bill.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                {billData.customer && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Customer</p>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      <p className="text-sm font-semibold text-gray-900">{billData.customer.name}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-gray-500" />
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {billData.bill.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Item-wise Breakdown */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Package size={18} className="text-gray-700" />
                <h3 className="text-lg font-bold text-gray-800">Items</h3>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Item</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Qty</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Unit Price</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Discount</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-700">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-sm text-gray-700">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-orange-600">
                          {item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(billData.bill.subtotal)}
                </span>
              </div>
              {billData.bill.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Discount</span>
                  <span className="text-sm font-semibold text-orange-600">
                    -{formatCurrency(billData.bill.discount)}
                  </span>
                </div>
              )}
              {billData.bill.tax > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(billData.bill.tax)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                <span className="text-base font-bold text-gray-900">Grand Total</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(billData.bill.total)}
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mt-4 bg-green-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Paid Amount</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(billData.bill.paidAmount)}
                </span>
              </div>
              {billData.bill.changeAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Change Given</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(billData.bill.changeAmount)}
                  </span>
                </div>
              )}
              {billData.bill.creditAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Credit Amount</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {formatCurrency(billData.bill.creditAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            {billData.bill.notes && (
              <div className="mt-4 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FileText size={16} className="text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Notes</p>
                    <p className="text-sm text-gray-900">{billData.bill.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <p>Failed to load bill details</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BillDetailsModal;
