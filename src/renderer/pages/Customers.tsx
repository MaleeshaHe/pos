import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit, Users as UsersIcon, CreditCard } from 'lucide-react';

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
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
          <p className="text-gray-600">Manage customer relationships</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          <Plus size={20} />
          Add Customer
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
            placeholder="Search customers by name or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Member Level</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Loyalty Points</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Credit Limit</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Current Credit</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
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
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <UsersIcon size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No customers found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      {customer.email && (
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600">{customer.phone || '-'}</p>
                      {customer.address && (
                        <p className="text-xs text-gray-500">{customer.address}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium capitalize">
                        {customer.memberLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-blue-600">
                      {customer.loyaltyPoints} pts
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {formatCurrency(customer.creditLimit)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span
                        className={`font-semibold ${
                          customer.currentCredit > 0 ? 'text-orange-600' : 'text-green-600'
                        }`}
                      >
                        {formatCurrency(customer.currentCredit)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit size={16} />
                        </button>
                        {customer.currentCredit > 0 && (
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Manage Credit">
                            <CreditCard size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
