import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DollarSign, CreditCard, Wallet, Plus, Trash2, Receipt, CheckCircle } from 'lucide-react';
import Modal from './Modal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  customer: any;
  onComplete: (paymentData: any) => void;
}

interface SplitPayment {
  method: 'cash' | 'card';
  amount: number;
}

const PaymentModal = ({ isOpen, onClose, total, customer, onComplete }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit' | 'split'>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([
    { method: 'cash', amount: 0 },
    { method: 'card', amount: 0 },
  ]);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Pre-fill with total amount for cash payment
      if (paymentMethod === 'cash') {
        setPaidAmount(total.toFixed(2));
      }

      // Reset split payments
      setSplitPayments([
        { method: 'cash', amount: Math.floor(total / 2) },
        { method: 'card', amount: total - Math.floor(total / 2) },
      ]);
    }
  }, [isOpen, total, paymentMethod]);

  const handlePayment = async () => {
    if (paymentMethod === 'credit') {
      if (!customer) {
        toast.error('Please select a customer for credit payment!');
        return;
      }

      const availableCredit = customer.creditLimit - customer.currentCredit;
      if (total > availableCredit) {
        toast.error(`Insufficient credit limit! Available: Rs. ${availableCredit.toFixed(2)}`);
        return;
      }

      setLoading(true);
      onComplete({
        method: 'credit',
        paidAmount: 0,
        changeAmount: 0,
        creditAmount: total,
        splitPayments: null,
        printReceipt,
      });
      setLoading(false);
      return;
    }

    if (paymentMethod === 'split') {
      const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid < total) {
        toast.error(`Split payments total (Rs. ${totalPaid.toFixed(2)}) is less than bill total!`);
        return;
      }

      setLoading(true);
      onComplete({
        method: 'split',
        paidAmount: totalPaid,
        changeAmount: Math.max(0, totalPaid - total),
        creditAmount: 0,
        splitPayments: splitPayments,
        printReceipt,
      });
      setLoading(false);
      return;
    }

    // Cash or Card payment
    const paid = parseFloat(paidAmount) || 0;
    if (paid < total) {
      toast.error(`Paid amount (Rs. ${paid.toFixed(2)}) is less than total!`);
      return;
    }

    setLoading(true);
    onComplete({
      method: paymentMethod,
      paidAmount: paid,
      changeAmount: Math.max(0, paid - total),
      creditAmount: 0,
      splitPayments: null,
      printReceipt,
    });
    setLoading(false);
  };

  const updateSplitPayment = (index: number, amount: number) => {
    const newSplitPayments = [...splitPayments];
    newSplitPayments[index].amount = Math.max(0, amount);
    setSplitPayments(newSplitPayments);
  };

  const addSplitPayment = () => {
    setSplitPayments([...splitPayments, { method: 'cash', amount: 0 }]);
  };

  const removeSplitPayment = (index: number) => {
    if (splitPayments.length > 2) {
      setSplitPayments(splitPayments.filter((_, i) => i !== index));
    }
  };

  const getTotalSplitPayment = () => {
    return splitPayments.reduce((sum, p) => sum + p.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const getChangeAmount = () => {
    if (paymentMethod === 'credit') return 0;
    if (paymentMethod === 'split') {
      return Math.max(0, getTotalSplitPayment() - total);
    }
    const paid = parseFloat(paidAmount) || 0;
    return Math.max(0, paid - total);
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment" size="lg">
      <div className="p-6">
        {/* Total Amount Display */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(total)}</p>
          {customer && (
            <p className="text-sm text-gray-600 mt-2">
              Customer: <span className="font-semibold">{customer.name}</span>
            </p>
          )}
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium border-2 transition-colors ${
                paymentMethod === 'cash'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
              }`}
            >
              <DollarSign size={20} />
              Cash
            </button>

            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium border-2 transition-colors ${
                paymentMethod === 'card'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              <CreditCard size={20} />
              Card
            </button>

            <button
              onClick={() => setPaymentMethod('credit')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium border-2 transition-colors ${
                paymentMethod === 'credit'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
              }`}
              disabled={!customer}
            >
              <Wallet size={20} />
              Credit
            </button>

            <button
              onClick={() => setPaymentMethod('split')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium border-2 transition-colors ${
                paymentMethod === 'split'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
              }`}
            >
              <Plus size={20} />
              Split
            </button>
          </div>
        </div>

        {/* Cash / Card Payment */}
        {(paymentMethod === 'cash' || paymentMethod === 'card') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {paymentMethod === 'cash' ? 'Cash Received' : 'Card Amount'}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-2xl font-semibold text-center"
              autoFocus
            />

            {/* Quick Amount Buttons (Cash only) */}
            {paymentMethod === 'cash' && (
              <div className="flex gap-2 mt-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setPaidAmount(amount.toString())}
                    className="flex-1 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded font-medium"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            )}

            {/* Change Display */}
            {paidAmount && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Change:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(getChangeAmount())}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Credit Payment */}
        {paymentMethod === 'credit' && customer && (
          <div className="mb-6">
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Credit Payment</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-semibold">{customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit Limit:</span>
                  <span className="font-semibold">{formatCurrency(customer.creditLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Credit:</span>
                  <span className="font-semibold">{formatCurrency(customer.currentCredit)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-orange-200">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(customer.creditLimit - customer.currentCredit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">This Bill:</span>
                  <span className="font-semibold text-orange-600">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-orange-200">
                  <span>New Balance:</span>
                  <span className={customer.currentCredit + total > customer.creditLimit ? 'text-red-600' : 'text-gray-800'}>
                    {formatCurrency(customer.currentCredit + total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Split Payment */}
        {paymentMethod === 'split' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Split Payments</label>
              <button
                onClick={addSplitPayment}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus size={16} />
                Add Payment
              </button>
            </div>

            <div className="space-y-3">
              {splitPayments.map((payment, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <select
                    value={payment.method}
                    onChange={(e) => {
                      const newSplitPayments = [...splitPayments];
                      newSplitPayments[index].method = e.target.value as 'cash' | 'card';
                      setSplitPayments(newSplitPayments);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payment.amount}
                    onChange={(e) => updateSplitPayment(index, parseFloat(e.target.value) || 0)}
                    placeholder="Amount"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />

                  {splitPayments.length > 2 && (
                    <button
                      onClick={() => removeSplitPayment(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Split Payment Summary */}
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="font-semibold">{formatCurrency(getTotalSplitPayment())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bill Total:</span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-purple-200">
                  <span className="font-semibold">Change:</span>
                  <span className={`font-bold ${getChangeAmount() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(getChangeAmount())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Receipt Option */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={printReceipt}
              onChange={(e) => setPrintReceipt(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <Receipt size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Print Receipt</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Complete Sale
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
