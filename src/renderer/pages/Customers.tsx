import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit,
  Users as UsersIcon,
  CreditCard,
  History,
  AlertCircle,
  Star,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import AddCustomerModal from '../components/AddCustomerModal';
import EditCustomerModal from '../components/EditCustomerModal';
import CreditHistoryModal from '../components/CreditHistoryModal';
import CreditPaymentModal from '../components/CreditPaymentModal';

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit: number;
  currentCredit: number;
  loyaltyPoints: number;
  memberLevel: string;
  notes?: string;
  isVIP?: boolean;
}

const Customers = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreditHistoryModal, setShowCreditHistoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'vip' | 'credit' | 'active'>('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const result = await window.api.getCustomers();
      if (result.success) {
        setCustomers(result.data);
      }
    } catch (error) {
      toast.error(t('customers.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleViewCreditHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCreditHistoryModal(true);
  };

  const handleMakePayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPaymentModal(true);
  };

  const getCreditStatus = (customer: Customer) => {
    const creditUsage = (customer.currentCredit / customer.creditLimit) * 100;
    if (creditUsage >= 90) return 'critical';
    if (creditUsage >= 75) return 'warning';
    return 'normal';
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.id.toString().includes(searchQuery);

    let matchesFilter = true;
    if (filterStatus === 'vip') {
      matchesFilter = customer.isVIP === true;
    } else if (filterStatus === 'credit') {
      matchesFilter = customer.currentCredit > 0;
    } else if (filterStatus === 'active') {
      matchesFilter = customer.loyaltyPoints > 100;
    }

    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const getMemberLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-orange-100 text-orange-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
    };
    return colors[level.toLowerCase()] || 'bg-blue-100 text-blue-800';
  };

  // Calculate statistics
  const stats = {
    total: customers.length,
    vip: customers.filter(c => c.isVIP).length,
    withCredit: customers.filter(c => c.currentCredit > 0).length,
    totalCreditOut: customers.reduce((sum, c) => sum + c.currentCredit, 0),
    totalLoyaltyPoints: customers.reduce((sum, c) => sum + c.loyaltyPoints, 0),
    criticalCredit: customers.filter(c => getCreditStatus(c) === 'critical').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('customers.customerManagement')}</h1>
          <p className="text-gray-600">{t('customers.subtitleAlt')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus size={20} />
          {t('customers.addCustomer')}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{t('customers.totalCustomers')}</p>
            <UsersIcon size={20} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{t('customers.vipCustomers')}</p>
            <Star size={20} className="text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.vip}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{t('customers.withCredit')}</p>
            <CreditCard size={20} className="text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.withCredit}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{t('customers.creditOut')}</p>
            <DollarSign size={20} className="text-red-600" />
          </div>
          <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalCreditOut)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{t('customers.loyalty')}</p>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.totalLoyaltyPoints}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{t('customers.criticalCredit')}</p>
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.criticalCredit}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('customers.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('common.all')}
            </button>
            <button
              onClick={() => setFilterStatus('vip')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'vip' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('customers.vip')}
            </button>
            <button
              onClick={() => setFilterStatus('credit')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'credit' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('customers.hasCredit')}
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('customers.active')}
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">{t('customers.name')}</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">{t('customers.contact')}</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">{t('customers.memberLevel')}</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">{t('customers.loyalty')}</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">{t('customers.creditLimit')}</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">{t('customers.currentCredit')}</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">{t('customers.status')}</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">{t('customers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    <UsersIcon size={48} className="mx-auto mb-2 opacity-50" />
                    <p>{t('customers.noCustomers')}</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const creditStatus = getCreditStatus(customer);
                  const creditUsage = customer.creditLimit > 0
                    ? (customer.currentCredit / customer.creditLimit) * 100
                    : 0;

                  return (
                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                              {customer.isVIP && (
                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{t('customers.idLabel')} {customer.id}</p>
                            {customer.notes && (
                              <p className="text-xs text-blue-600 italic">{customer.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{customer.phone || '-'}</p>
                        {customer.email && (
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getMemberLevelColor(customer.memberLevel)}`}>
                          {customer.memberLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-blue-600">
                        {customer.loyaltyPoints} {t('customers.pts')}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600">
                        {formatCurrency(customer.creditLimit)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${
                              customer.currentCredit > 0 ? 'text-orange-600' : 'text-green-600'
                            }`}
                          >
                            {formatCurrency(customer.currentCredit)}
                          </p>
                          {customer.currentCredit > 0 && customer.creditLimit > 0 && (
                            <p className="text-xs text-gray-500">{creditUsage.toFixed(0)}{t('customers.percentUsed')}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {creditStatus === 'critical' ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center justify-center gap-1">
                            <AlertCircle size={12} />
                            {t('customers.critical')}
                          </span>
                        ) : creditStatus === 'warning' ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            {t('customers.warning')}
                          </span>
                        ) : customer.currentCredit > 0 ? (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            {t('customers.hasCredit')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {t('customers.good')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title={t('customers.editCustomer')}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleViewCreditHistory(customer)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                            title={t('customers.viewCreditHistory')}
                          >
                            <History size={16} />
                          </button>
                          {customer.currentCredit > 0 && (
                            <button
                              onClick={() => handleMakePayment(customer)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title={t('customers.makePayment')}
                            >
                              <CreditCard size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadCustomers}
      />

      {selectedCustomer && (
        <>
          <EditCustomerModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedCustomer(null);
            }}
            onSuccess={loadCustomers}
            customer={selectedCustomer}
          />

          <CreditHistoryModal
            isOpen={showCreditHistoryModal}
            onClose={() => {
              setShowCreditHistoryModal(false);
              setSelectedCustomer(null);
            }}
            customer={selectedCustomer}
          />

          <CreditPaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedCustomer(null);
            }}
            onSuccess={loadCustomers}
            customer={selectedCustomer}
          />
        </>
      )}
    </div>
  );
};

export default Customers;
