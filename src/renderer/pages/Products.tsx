import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import AddProductModal from '../components/AddProductModal';

interface Product {
  id: number;
  name: string;
  nameSi?: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  costPrice: number;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  categoryId?: number;
  brandId?: number;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await window.api.getProducts();
      if (result.success) {
        setProducts(result.data);
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-600">Manage your inventory</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus size={20} />
          Add Product
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
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">SKU</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Barcode</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Cost</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Price</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Stock</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
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
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No products found</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{product.sku}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        {product.nameSi && (
                          <p className="text-xs text-gray-500">{product.nameSi}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{product.barcode || '-'}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {formatCurrency(product.costPrice)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span
                        className={`font-semibold ${
                          product.currentStock <= product.reorderLevel
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {product.currentStock} {product.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {product.currentStock <= product.reorderLevel ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Low Stock
                        </span>
                      ) : product.currentStock === 0 ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          In Stock
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

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadProducts}
      />
    </div>
  );
};

export default Products;
