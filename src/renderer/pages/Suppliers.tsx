import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react';
import AddSupplierModal from '../components/AddSupplierModal';

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  currentDue: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

const Suppliers = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const result = await window.api.getSuppliers();
      if (result.success) {
        setSuppliers(result.data);
      }
    } catch (error) {
      toast.error(t('suppliers.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('suppliers.title')}</h1>
          <p className="text-gray-600">{t('suppliers.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus size={20} />
          {t('suppliers.addSupplier')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('suppliers.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">{t('suppliers.supplierName')}</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">{t('suppliers.contactPerson')}</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">{t('suppliers.phoneEmail')}</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">{t('suppliers.paymentTerms')}</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">{t('suppliers.currentDue')}</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">{t('suppliers.status')}</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">{t('suppliers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <Users size={48} className="mx-auto mb-2 opacity-50" />
                    <p>{t('suppliers.noFound')}</p>
                    <p className="text-sm mt-1">{t('suppliers.addFirst')}</p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{supplier.name}</p>
                          {supplier.address && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin size={12} />
                              {supplier.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {supplier.contactPerson || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {supplier.phone && (
                          <p className="flex items-center gap-1 text-gray-600">
                            <Phone size={12} />
                            {supplier.phone}
                          </p>
                        )}
                        {supplier.email && (
                          <p className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                            <Mail size={12} />
                            {supplier.email}
                          </p>
                        )}
                        {!supplier.phone && !supplier.email && <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {supplier.paymentTerms || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span
                        className={`font-semibold ${
                          supplier.currentDue > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {formatCurrency(supplier.currentDue)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {supplier.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {t('suppliers.active')}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {t('suppliers.inactive')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      <AddSupplierModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadSuppliers}
      />
    </div>
  );
};

export default Suppliers;
