import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DollarSign, CreditCard, Wallet, Plus, Trash2, Receipt, CheckCircle, Banknote } from 'lucide-react';
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Enter to complete payment
      if (e.key === 'Enter' && !loading) {
        e.preventDefault();
        handlePayment();
      }

      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, paidAmount, paymentMethod, splitPayments]);

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

  // Calculator functions for numpad
  const appendNumber = (num: string) => {
    if (paymentMethod === 'cash' || paymentMethod === 'card') {
      const currentValue = paidAmount || '0';
      // Handle decimal point
      if (num === '.' && currentValue.includes('.')) return;
      // Handle leading zero
      if (currentValue === '0' && num !== '.') {
        setPaidAmount(num);
      } else {
        setPaidAmount(currentValue + num);
      }
    }
  };

  const clearAmount = () => {
    setPaidAmount('');
  };

  const setExactAmount = () => {
    setPaidAmount(total.toFixed(2));
  };

  const roundUpAmount = () => {
    const roundedUp = Math.ceil(total / 10) * 10;
    setPaidAmount(roundedUp.toString());
  };

  // Calculate denominations breakdown
  const getDenominationsBreakdown = () => {
    const change = getChangeAmount();
    const denominations = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];
    const breakdown: { [key: number]: number } = {};
    let remaining = Math.floor(change);

    for (const denom of denominations) {
      if (remaining >= denom) {
        breakdown[denom] = Math.floor(remaining / denom);
        remaining = remaining % denom;
      }
    }

    return breakdown;
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment" size="xl">
      <div className="p-6">
        {/* Total Amount Display - Large and Prominent */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 mb-6 shadow-lg">
          <p className="text-sm text-blue-100 mb-2 font-medium">Total Amount</p>
          <p className="text-5xl font-bold text-white mb-3">{formatCurrency(total)}</p>
          {customer && (
            <div className="flex items-center gap-2 text-blue-50 bg-blue-600/30 rounded-lg px-3 py-2 w-fit">
              <span className="text-sm">Customer:</span>
              <span className="font-semibold">{customer.name}</span>
            </div>
          )}
        </div>

        {/* Payment Method Selection - Compact 4-column grid */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Payment Method</label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg font-medium border-2 transition-all ${
                paymentMethod === 'cash'
                  ? 'bg-green-600 text-white border-green-600 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
              }`}
            >
              <DollarSign size={22} />
              <span className="text-sm">Cash</span>
            </button>

            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg font-medium border-2 transition-all ${
                paymentMethod === 'card'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              <CreditCard size={22} />
              <span className="text-sm">Card</span>
            </button>

            <button
              onClick={() => setPaymentMethod('credit')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg font-medium border-2 transition-all ${
                paymentMethod === 'credit'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
              }`}
              disabled={!customer}
            >
              <Wallet size={22} />
              <span className="text-sm">Credit</span>
            </button>

            <button
              onClick={() => setPaymentMethod('split')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg font-medium border-2 transition-all ${
                paymentMethod === 'split'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
              }`}
            >
              <Plus size={22} />
              <span className="text-sm">Split</span>
            </button>
          </div>
        </div>

        {/* Cash / Card Payment with Calculator */}
        {(paymentMethod === 'cash' || paymentMethod === 'card') && (
          <div className="mb-5">
            <div className="grid grid-cols-3 gap-4">
              {/* Left side - Amount input and quick actions */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                  {paymentMethod === 'cash' ? 'Cash Received' : 'Card Amount'}
                </label>
                <input
                  type="text"
                  value={paidAmount}
                  onChange={(e) => {
                    // Only allow numbers and decimal point
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
                      setPaidAmount(value);
                    }
                  }}
                  placeholder="0.00"
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-3xl font-bold text-center bg-gray-50"
                  autoFocus
                />

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button
                    onClick={setExactAmount}
                    className="py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    Exact
                  </button>
                  <button
                    onClick={roundUpAmount}
                    className="py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    Round Up
                  </button>
                  <button
                    onClick={clearAmount}
                    className="py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {/* Quick Amount Buttons (Cash only) */}
                {paymentMethod === 'cash' && (
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setPaidAmount(amount.toString())}
                        className="py-2 text-sm bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg font-bold text-gray-700 transition-all border border-gray-300"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side - Calculator Numpad */}
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Calculator</label>
                <div className="grid grid-cols-3 gap-2">
                  {['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.'].map((num) => (
                    <button
                      key={num}
                      onClick={() => appendNumber(num)}
                      className="py-3 bg-white hover:bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-lg text-gray-700 transition-colors active:bg-gray-200"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Change Display - Large and Animated */}
            {paidAmount && parseFloat(paidAmount) >= total && (
              <div className="mt-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-lg animate-scaleIn">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Banknote className="text-green-600" size={24} />
                    <span className="text-lg font-semibold text-gray-700">Change to Return</span>
                  </div>
                  <span className="text-4xl font-bold text-green-600">
                    {formatCurrency(getChangeAmount())}
                  </span>
                </div>

                {/* Denominations Breakdown */}
                {getChangeAmount() > 0 && (
                  <div className="pt-3 border-t-2 border-green-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Suggested Breakdown</p>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(getDenominationsBreakdown()).map(([denom, count]) => (
                        <div key={denom} className="bg-white rounded-lg px-2 py-1.5 text-center border border-green-200">
                          <div className="text-xs font-bold text-green-700">Rs. {denom}</div>
                          <div className="text-lg font-bold text-gray-800">×{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Credit Payment */}
        {paymentMethod === 'credit' && customer && (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="text-orange-600" size={22} />
                <h3 className="font-bold text-gray-800 text-lg">Credit Payment</h3>
              </div>
              <div className="space-y-2 text-sm">
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

        {/* Split Payment - Enhanced */}
        {paymentMethod === 'split' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Split Payments</label>
              <button
                onClick={addSplitPayment}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={16} />
                Add Payment
              </button>
            </div>

            <div className="space-y-2 bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
              {splitPayments.map((payment, index) => (
                <div key={index} className="flex gap-2 items-center bg-white rounded-lg p-2 border border-purple-200">
                  <select
                    value={payment.method}
                    onChange={(e) => {
                      const newSplitPayments = [...splitPayments];
                      newSplitPayments[index].method = e.target.value as 'cash' | 'card';
                      setSplitPayments(newSplitPayments);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Card</option>
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payment.amount}
                    onChange={(e) => updateSplitPayment(index, parseFloat(e.target.value) || 0)}
                    placeholder="Amount"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-semibold"
                  />

                  {splitPayments.length > 2 && (
                    <button
                      onClick={() => removeSplitPayment(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Split Payment Summary - Enhanced */}
            <div className="mt-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-300">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Paid:</span>
                  <span className="text-xl font-bold text-purple-700">{formatCurrency(getTotalSplitPayment())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Bill Total:</span>
                  <span className="text-xl font-bold text-gray-700">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-purple-200">
                  <span className="text-base font-bold text-gray-700">Change:</span>
                  <span className={`text-2xl font-bold ${getChangeAmount() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(getChangeAmount())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Receipt Option */}
        <div className="mb-6 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={printReceipt}
              onChange={(e) => setPrintReceipt(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <Receipt size={18} className="text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Print Receipt</span>
          </label>
        </div>

        {/* Action Buttons - Enhanced */}
        <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-base transition-colors"
            disabled={loading}
          >
            Cancel (Esc)
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-[2] py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={22} />
                Complete Sale (Enter)
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
