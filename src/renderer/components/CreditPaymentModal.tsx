import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { DollarSign, CreditCard, Banknote, FileText } from 'lucide-react';
import Modal from './Modal';
import { useAuthStore } from '../stores/authStore';

interface CreditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer: any;
}

const CreditPaymentModal = ({ isOpen, onClose, onSuccess, customer }: CreditPaymentModalProps) => {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const paymentAmount = parseFloat(amount);

    // Validation
    if (!amount || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (paymentAmount > customer.currentCredit) {
      toast.error(`Payment amount cannot exceed current credit balance (Rs. ${customer.currentCredit.toFixed(2)})`);
      return;
    }

    setLoading(true);

    try {
      const result = await window.api.createCreditPayment({
        customerId: customer.id,
        amount: paymentAmount,
        paymentMethod,
        notes: notes.trim() || null,
        userId: user?.id,
      });

      if (result.success) {
        toast.success('Credit payment recorded successfully');
        onSuccess();
        onClose();
        resetForm();
      } else {
        toast.error(result.error || 'Failed to record payment');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPaymentMethod('cash');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleQuickAmount = (value: number) => {
    const quickAmount = Math.min(value, customer.currentCredit);
    setAmount(quickAmount.toString());
  };

  const formatCurrency = (value: number) => {
    return `Rs. ${value.toFixed(2)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Record Credit Payment" size="md">
      <form onSubmit={handleSubmit} className="p-6">
        {/* Customer Info */}
        <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-gray-900">{customer.name}</p>
              <p className="text-xs text-gray-600">Customer ID: {customer.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Current Credit</p>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(customer.currentCredit)}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Credit Limit: {formatCurrency(customer.creditLimit)}
          </div>
        </div>

        {/* Payment Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Amount (Rs.) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              max={customer.currentCredit}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Maximum: {formatCurrency(customer.currentCredit)}
          </p>
        </div>

        {/* Quick Amount Buttons */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Amounts
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickAmount(500)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              500
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(1000)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              1,000
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(5000)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              5,000
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(customer.currentCredit)}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
            >
              Full
            </button>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-lg border-2 transition-all ${
                paymentMethod === 'cash'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Banknote
                size={24}
                className={`mx-auto mb-1 ${paymentMethod === 'cash' ? 'text-blue-600' : 'text-gray-400'}`}
              />
              <p className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-blue-900' : 'text-gray-600'}`}>
                Cash
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-lg border-2 transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CreditCard
                size={24}
                className={`mx-auto mb-1 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`}
              />
              <p className={`text-sm font-medium ${paymentMethod === 'card' ? 'text-blue-900' : 'text-gray-600'}`}>
                Card
              </p>
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add payment notes..."
              rows={2}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>

        {/* Remaining Balance Preview */}
        {amount && parseFloat(amount) > 0 && parseFloat(amount) <= customer.currentCredit && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Remaining Credit After Payment:</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(customer.currentCredit - parseFloat(amount))}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
          >
            <DollarSign size={18} />
            {loading ? 'Processing...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreditPaymentModal;
