import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Download,
  Upload,
  Printer,
  PackagePlus,
  PackageMinus,
  CheckSquare,
  Square,
} from 'lucide-react';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import BulkImportModal from '../components/BulkImportModal';

interface Product {
  id: number;
  name: string;
  nameSi?: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  reorderLevel: number;
  unit: string;
  categoryId?: number;
  brandId?: number;
  isActive: boolean;
}

const Products = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');

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
      toast.error(t('products.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDelete = async (productId: number) => {
    if (!confirm(t('products.deleteConfirm'))) {
      return;
    }

    try {
      const result = await window.api.deleteProduct(productId);
      if (result.success) {
        toast.success(t('products.deleteSuccess'));
        loadProducts();
      } else {
        toast.error(result.error || t('products.deleteFailed'));
      }
    } catch (error) {
      toast.error(t('common.errorOccurred'));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error(t('products.noSelected'));
      return;
    }

    if (!confirm(t('products.bulkDeleteConfirm', { count: selectedProducts.length }))) {
      return;
    }

    try {
      for (const productId of selectedProducts) {
        await window.api.deleteProduct(productId);
      }
      toast.success(t('products.bulkDeleteSuccess', { count: selectedProducts.length }));
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      toast.error(t('products.bulkDeleteFailed'));
    }
  };

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      toast.error(t('products.noToExport'));
      return;
    }

    // Create CSV content
    const headers = ['SKU', 'Name', 'Name (Sinhala)', 'Barcode', 'Cost Price', 'Selling Price', 'Stock', 'Reorder Level', 'Unit', 'Status'];
    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.nameSi || '',
      p.barcode || '',
      p.costPrice,
      p.sellingPrice,
      p.stock,
      p.reorderLevel,
      p.unit,
      p.stock === 0 ? 'Out of Stock' : p.stock <= p.reorderLevel ? 'Low Stock' : 'In Stock'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(t('products.exportSuccess'));
  };

  const handlePrintBarcodes = () => {
    if (selectedProducts.length === 0) {
      toast.error(t('products.selectToPrint'));
      return;
    }

    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Product Barcodes</title>
        <style>
          @media print {
            @page { size: 58mm auto; margin: 0; }
            body { margin: 0; padding: 0; }
          }
          .barcode-label {
            width: 58mm;
            padding: 5mm;
            border: 1px solid #000;
            margin-bottom: 2mm;
            page-break-after: always;
            font-family: monospace;
          }
          .product-name {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 2px;
          }
          .barcode {
            font-size: 14px;
            letter-spacing: 2px;
            margin: 5px 0;
          }
          .price {
            font-size: 16px;
            font-weight: bold;
            margin-top: 3px;
          }
          .sku {
            font-size: 10px;
            color: #666;
          }
        </style>
      </head>
      <body>
        ${selectedProductsData.map(p => `
          <div class="barcode-label">
            <div class="product-name">${p.name}</div>
            <div class="sku">SKU: ${p.sku}</div>
            ${p.barcode ? `<div class="barcode">*${p.barcode}*</div>` : ''}
            <div class="price">Rs. ${p.sellingPrice.toFixed(2)}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);

    toast.success(t('products.barcodePrinted'));
  };

  const handleStockAdjustment = (product: Product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  const toggleProductSelection = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (filterStatus === 'inStock') {
      matchesFilter = product.stock > product.reorderLevel;
    } else if (filterStatus === 'lowStock') {
      matchesFilter = product.stock > 0 && product.stock <= product.reorderLevel;
    } else if (filterStatus === 'outOfStock') {
      matchesFilter = product.stock === 0;
    }

    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock > p.reorderLevel).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('products.inventoryManagement')}</h1>
          <p className="text-gray-600">{t('products.subtitleAlt')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            <Upload size={18} />
            {t('common.import')}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            <Download size={18} />
            {t('common.export')}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus size={20} />
            {t('products.addProduct')}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">{t('products.totalProducts')}</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">{t('products.inStock')}</p>
          <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">{t('products.lowStock')}</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">{t('products.outOfStock')}</p>
          <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">{t('products.totalValue')}</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('products.searchPlaceholder')}
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
              onClick={() => setFilterStatus('inStock')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'inStock' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('products.inStock')}
            </button>
            <button
              onClick={() => setFilterStatus('lowStock')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'lowStock' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('products.lowStock')}
            </button>
            <button
              onClick={() => setFilterStatus('outOfStock')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'outOfStock' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('products.outOfStock')}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="mb-6 bg-blue-50 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-blue-900">
            {t('products.selectedCount', { count: selectedProducts.length })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrintBarcodes}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              <Printer size={16} />
              {t('products.printBarcodes')}
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
            >
              <Trash2 size={16} />
              {t('products.deleteSelected')}
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4">
                  <button onClick={toggleSelectAll} className="text-gray-700">
                    {selectedProducts.length === filteredProducts.length ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">{t('products.sku')}</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">{t('products.name')}</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">{t('products.barcode')}</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">{t('products.cost')}</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">{t('products.price')}</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">{t('products.stock')}</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">{t('products.status')}</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">{t('products.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                    <p>{t('products.noProducts')}</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      selectedProducts.includes(product.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <button onClick={() => toggleProductSelection(product.id)}>
                        {selectedProducts.includes(product.id) ? (
                          <CheckSquare size={18} className="text-blue-600" />
                        ) : (
                          <Square size={18} className="text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{product.sku}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        {product.nameSi && <p className="text-xs text-gray-500">{product.nameSi}</p>}
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
                          product.stock <= product.reorderLevel ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {product.stock} {product.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {product.stock === 0 ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {t('products.outOfStock')}
                        </span>
                      ) : product.stock <= product.reorderLevel ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          {t('products.lowStock')}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {t('products.inStock')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStockAdjustment(product)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title={t('products.adjustStock')}
                        >
                          {product.stock <= product.reorderLevel ? (
                            <PackagePlus size={16} />
                          ) : (
                            <PackageMinus size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title={t('common.edit')}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title={t('common.delete')}
                        >
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

      {/* Modals */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadProducts}
      />

      {selectedProduct && (
        <>
          <EditProductModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedProduct(null);
            }}
            onSuccess={loadProducts}
            product={selectedProduct}
          />

          <StockAdjustmentModal
            isOpen={showStockModal}
            onClose={() => {
              setShowStockModal(false);
              setSelectedProduct(null);
            }}
            onSuccess={loadProducts}
            product={selectedProduct}
          />
        </>
      )}

      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={loadProducts}
      />
    </div>
  );
};

export default Products;
