import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DollarSign, CreditCard, Wallet, Plus, Trash2, Receipt, CheckCircle, Banknote, ArrowRight } from 'lucide-react';
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
      <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100">
        {/* Total Amount Display */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 mb-6 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
          <div className="relative flex items-end justify-between">
            <div>
              <p className="text-sm text-blue-100 mb-2 font-medium uppercase tracking-wide">Total Amount</p>
              <p className="text-6xl font-bold text-white tracking-tight drop-shadow-lg">{formatCurrency(total)}</p>
            </div>
            {customer && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <p className="text-xs text-blue-100 mb-1">Customer</p>
                <p className="text-base font-bold text-white">{customer.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">Payment Method</label>
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`group flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all duration-200 ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                  : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-emerald-400 hover:shadow-md'
              }`}
            >
              <DollarSign size={24} className={paymentMethod === 'cash' ? '' : 'group-hover:text-emerald-500'} />
              <span className="text-sm">Cash</span>
            </button>

            <button
              onClick={() => setPaymentMethod('card')}
              className={`group flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all duration-200 ${
                paymentMethod === 'card'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                  : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-blue-400 hover:shadow-md'
              }`}
            >
              <CreditCard size={24} className={paymentMethod === 'card' ? '' : 'group-hover:text-blue-500'} />
              <span className="text-sm">Card</span>
            </button>

            <button
              onClick={() => setPaymentMethod('credit')}
              className={`group flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all duration-200 ${
                paymentMethod === 'credit'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                  : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-amber-400 hover:shadow-md'
              }`}
              disabled={!customer}
            >
              <Wallet size={24} className={paymentMethod === 'credit' ? '' : 'group-hover:text-amber-500'} />
              <span className="text-sm">Credit</span>
            </button>

            <button
              onClick={() => setPaymentMethod('split')}
              className={`group flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all duration-200 ${
                paymentMethod === 'split'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                  : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-purple-400 hover:shadow-md'
              }`}
            >
              <Plus size={24} className={paymentMethod === 'split' ? '' : 'group-hover:text-purple-500'} />
              <span className="text-sm">Split</span>
            </button>
          </div>
        </div>

        {/* Cash / Card Payment with Calculator */}
        {(paymentMethod === 'cash' || paymentMethod === 'card') && (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-5">
              {/* Left side - Amount input and quick actions */}
              <div className="col-span-2 space-y-3">
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
                  <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                    {paymentMethod === 'cash' ? 'Cash Received' : 'Card Amount'}
                  </label>
                  <input
                    type="text"
                    value={paidAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setPaidAmount(value);
                      }
                    }}
                    placeholder="0.00"
                    className="w-full px-4 py-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-5xl font-bold text-center bg-gradient-to-br from-gray-50 to-white text-gray-900 transition-all"
                    autoFocus
                  />
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={setExactAmount}
                    className="py-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    Exact
                  </button>
                  <button
                    onClick={roundUpAmount}
                    className="py-3 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    Round Up
                  </button>
                  <button
                    onClick={clearAmount}
                    className="py-3 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    Clear
                  </button>
                </div>

                {/* Quick Amount Buttons (Cash only) */}
                {paymentMethod === 'cash' && (
                  <div className="grid grid-cols-5 gap-2">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setPaidAmount(amount.toString())}
                        className="py-2.5 text-sm bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-emerald-100 border-2 border-gray-200 hover:border-emerald-400 rounded-lg font-bold text-gray-700 hover:text-emerald-700 transition-all"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side - Calculator Numpad */}
              <div className="col-span-1">
                <div className="bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-sm">
                  <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">Calculator</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.'].map((num) => (
                      <button
                        key={num}
                        onClick={() => appendNumber(num)}
                        className="py-3.5 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-500 hover:to-blue-600 border-2 border-gray-200 hover:border-blue-500 rounded-xl font-bold text-lg text-gray-700 hover:text-white transition-all active:scale-95 shadow-sm hover:shadow-md"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Display */}
            {paidAmount && parseFloat(paidAmount) >= total && (
              <div className="mt-5 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-300 shadow-lg animate-scaleIn">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500 rounded-xl shadow-md">
                      <Banknote className="text-white" size={24} />
                    </div>
                    <span className="text-lg font-bold text-gray-800">Change to Return</span>
                  </div>
                  <span className="text-5xl font-bold text-emerald-600">
                    {formatCurrency(getChangeAmount())}
                  </span>
                </div>

                {/* Denominations Breakdown */}
                {getChangeAmount() > 0 && (
                  <div className="pt-4 border-t-2 border-emerald-200">
                    <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">Suggested Breakdown</p>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(getDenominationsBreakdown()).map(([denom, count]) => (
                        <div key={denom} className="bg-white rounded-xl px-3 py-2.5 text-center border-2 border-emerald-200 shadow-sm">
                          <div className="text-xs font-bold text-emerald-700">Rs. {denom}</div>
                          <div className="text-xl font-bold text-gray-900">×{count}</div>
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
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-500 rounded-xl shadow-md">
                  <Wallet className="text-white" size={22} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Credit Payment</h3>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between py-2.5 border-b-2 border-amber-200">
                  <span className="text-gray-600 font-medium">Customer:</span>
                  <span className="font-bold text-gray-900">{customer.name}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b-2 border-amber-200">
                  <span className="text-gray-600 font-medium">Credit Limit:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(customer.creditLimit)}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b-2 border-amber-200">
                  <span className="text-gray-600 font-medium">Current Credit:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(customer.currentCredit)}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b-2 border-amber-200">
                  <span className="text-gray-600 font-medium">Available:</span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(customer.creditLimit - customer.currentCredit)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b-2 border-amber-200">
                  <span className="text-gray-600 font-medium">This Bill:</span>
                  <span className="font-bold text-amber-600">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between py-3 mt-2 bg-white rounded-xl px-4 shadow-sm">
                  <span className="font-bold text-gray-900">New Balance:</span>
                  <span className={`font-bold text-lg ${customer.currentCredit + total > customer.creditLimit ? 'text-red-600' : 'text-gray-900'}`}>
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
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Split Payments</label>
              <button
                onClick={addSplitPayment}
                className="text-sm text-white font-bold flex items-center gap-1 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Plus size={16} />
                Add Payment
              </button>
            </div>

            <div className="space-y-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border-2 border-purple-200 shadow-sm">
              {splitPayments.map((payment, index) => (
                <div key={index} className="flex gap-3 items-center bg-white rounded-xl p-3 border-2 border-purple-100 shadow-sm">
                  <select
                    value={payment.method}
                    onChange={(e) => {
                      const newSplitPayments = [...splitPayments];
                      newSplitPayments[index].method = e.target.value as 'cash' | 'card';
                      setSplitPayments(newSplitPayments);
                    }}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-semibold bg-white"
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
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-bold bg-white"
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

            {/* Split Payment Summary */}
            <div className="mt-4 p-5 bg-white rounded-2xl border-2 border-purple-200 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Paid:</span>
                  <span className="text-2xl font-bold text-purple-600">{formatCurrency(getTotalSplitPayment())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Bill Total:</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-purple-200">
                  <span className="text-base font-bold text-gray-700">Change:</span>
                  <span className={`text-3xl font-bold ${getChangeAmount() >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(getChangeAmount())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Receipt Option */}
        <div className="mb-6 bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={printReceipt}
              onChange={(e) => setPrintReceipt(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 border-2 border-gray-300"
            />
            <Receipt size={20} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
            <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Print Receipt</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t-2 border-gray-300">
          <button
            onClick={onClose}
            className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 font-bold text-base transition-all shadow-sm"
            disabled={loading}
          >
            Cancel (Esc)
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-[2] py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
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
