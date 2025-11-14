import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowUp, ArrowDown, Receipt, DollarSign, Calendar, FileText } from 'lucide-react';
import Modal from './Modal';

interface CreditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
}

interface Transaction {
  id: number;
  type: 'credit' | 'payment';
  date: string;
  amount: number;
  billNumber?: string;
  paymentMethod?: string;
  notes?: string;
  balance: number;
}

const CreditHistoryModal = ({ isOpen, onClose, customer }: CreditHistoryModalProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && customer) {
      loadCreditHistory();
    }
  }, [isOpen, customer]);

  const loadCreditHistory = async () => {
    setLoading(true);
    try {
      const result = await window.api.getCustomerCredit(customer.id);

      if (result.success) {
        const { bills, payments } = result.data;

        // Combine bills and payments into a single transaction list
        const allTransactions: Transaction[] = [];

        // Add credit bills (only those with creditAmount > 0)
        bills
          .filter((bill: any) => bill.creditAmount > 0)
          .forEach((bill: any) => {
            allTransactions.push({
              id: bill.id,
              type: 'credit',
              date: bill.createdAt,
              amount: bill.creditAmount,
              billNumber: bill.billNumber,
              notes: bill.notes,
              balance: 0, // Will calculate running balance later
            });
          });

        // Add credit payments
        payments.forEach((payment: any) => {
          allTransactions.push({
            id: payment.id,
            type: 'payment',
            date: payment.createdAt,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            notes: payment.notes,
            balance: 0, // Will calculate running balance later
          });
        });

        // Sort by date (oldest first) and calculate running balance
        allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = 0;
        allTransactions.forEach((transaction) => {
          if (transaction.type === 'credit') {
            runningBalance += transaction.amount;
          } else {
            runningBalance -= transaction.amount;
          }
          transaction.balance = runningBalance;
        });

        // Reverse to show newest first in the UI
        setTransactions(allTransactions.reverse());
      }
    } catch (error) {
      console.error('Failed to load credit history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Credit History" size="lg">
      <div className="p-6">
        {/* Customer Info Header */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 text-lg">{customer.name}</h3>
          <p className="text-sm text-gray-600">Customer ID: {customer.id}</p>
        </div>

        {/* Credit Summary Cards */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Credit Limit</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(customer.creditLimit)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Current Credit Balance</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(customer.currentCredit)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Available Credit</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(customer.creditLimit - customer.currentCredit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Credit Usage</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (customer.currentCredit / customer.creditLimit) * 100 >= 90
                        ? 'bg-red-600'
                        : (customer.currentCredit / customer.creditLimit) * 100 >= 75
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{
                      width: `${Math.min(100, (customer.currentCredit / customer.creditLimit) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {customer.creditLimit > 0
                    ? ((customer.currentCredit / customer.creditLimit) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <FileText size={18} />
              Transaction History
            </h4>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Loading transaction history...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt size={48} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No credit transactions found</p>
                <p className="text-sm text-gray-400 mt-1">Credit purchases and payments will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <div
                    key={`${transaction.type}-${transaction.id}`}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Icon */}
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === 'credit'
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-green-100 text-green-600'
                          }`}
                        >
                          {transaction.type === 'credit' ? (
                            <ArrowUp size={16} />
                          ) : (
                            <ArrowDown size={16} />
                          )}
                        </div>

                        {/* Transaction Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">
                              {transaction.type === 'credit' ? 'Credit Purchase' : 'Credit Payment'}
                            </p>
                            {transaction.billNumber && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                {transaction.billNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(transaction.date)}
                            </span>
                            {transaction.paymentMethod && (
                              <span className="flex items-center gap-1">
                                <DollarSign size={12} />
                                {transaction.paymentMethod.toUpperCase()}
                              </span>
                            )}
                          </div>

                          {transaction.notes && (
                            <p className="text-xs text-gray-600 mt-1 italic">{transaction.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Amount and Balance */}
                      <div className="text-right ml-4">
                        <p
                          className={`font-bold ${
                            transaction.type === 'credit' ? 'text-orange-600' : 'text-green-600'
                          }`}
                        >
                          {transaction.type === 'credit' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Balance: {formatCurrency(transaction.balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary Footer */}
        {transactions.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Transactions</span>
              <span className="font-semibold text-gray-900">{transactions.length}</span>
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
      </div>
    </Modal>
  );
};

export default CreditHistoryModal;
