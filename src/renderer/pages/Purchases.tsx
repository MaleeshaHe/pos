import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Search, Eye, Package, Calendar, DollarSign, TrendingUp, PackageCheck } from 'lucide-react';
import AddPurchaseModal from '../components/AddPurchaseModal';
import GRNModal from '../components/GRNModal';

interface Purchase {
  id: number;
  supplierId: number;
  supplierName?: string;
  purchaseOrderNo: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  totalAmount: number;
  status: string;
  notes?: string;
  receivedDate?: string;
  createdAt: string;
}

const Purchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const result = await window.api.getPurchases();
      if (result.success) {
        // Enrich purchases with supplier names
        const suppliersResult = await window.api.getSuppliers();
        if (suppliersResult.success) {
          const supplierMap = new Map(
            suppliersResult.data.map((s: any) => [s.id, s.name])
          );
          const enrichedPurchases = result.data.map((p: Purchase) => ({
            ...p,
            supplierName: supplierMap.get(p.supplierId) || 'Unknown Supplier',
          }));
          setPurchases(enrichedPurchases);
        } else {
          setPurchases(result.data);
        }
      }
    } catch (error) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.purchaseOrderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplierName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      received: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleReceiveGoods = (purchaseId: number) => {
    setSelectedPurchaseId(purchaseId);
    setShowGRNModal(true);
  };

  // Calculate statistics
  const stats = {
    total: purchases.length,
    pending: purchases.filter(p => p.status === 'pending').length,
    received: purchases.filter(p => p.status === 'received').length,
    totalValue: purchases.reduce((sum, p) => sum + p.totalAmount, 0),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Purchase Orders</h1>
          <p className="text-gray-600">Manage your purchase orders and inventory procurement</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus size={20} />
          New Purchase Order
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Received</p>
              <p className="text-2xl font-bold text-blue-600">{stats.received}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by PO number or supplier name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">PO Number</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Supplier</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Order Date</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Expected Delivery</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Total Amount</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
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
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No purchase orders found</p>
                    <p className="text-sm mt-1">Create your first purchase order to get started</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-gray-900">{purchase.purchaseOrderNo}</p>
                      {purchase.notes && (
                        <p className="text-xs text-gray-500 truncate max-w-xs">{purchase.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {purchase.supplierName}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(purchase.orderDate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {purchase.expectedDeliveryDate ? formatDate(purchase.expectedDeliveryDate) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(purchase.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(purchase.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {(purchase.status === 'pending' || purchase.status === 'received') && (
                          <button
                            onClick={() => handleReceiveGoods(purchase.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Receive Goods (GRN)"
                          >
                            <PackageCheck size={16} />
                          </button>
                        )}
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                          <Eye size={16} />
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

      {/* Add Purchase Modal */}
      <AddPurchaseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadPurchases}
      />

      {/* GRN Modal */}
      <GRNModal
        isOpen={showGRNModal}
        onClose={() => setShowGRNModal(false)}
        onSuccess={loadPurchases}
        purchaseId={selectedPurchaseId}
      />
    </div>
  );
};

export default Purchases;
