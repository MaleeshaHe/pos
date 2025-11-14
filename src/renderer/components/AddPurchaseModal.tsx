import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Package } from 'lucide-react';
import Modal from './Modal';

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PurchaseItem {
  productId: number;
  productName?: string;
  quantity: number;
  costPrice: number;
  total: number;
}

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  nameEn: string;
  nameSi: string;
  sku: string;
  costPrice: number;
}

const AddPurchaseModal = ({ isOpen, onClose, onSuccess }: AddPurchaseModalProps) => {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    notes: '',
  });
  const [items, setItems] = useState<PurchaseItem[]>([
    { productId: 0, quantity: 1, costPrice: 0, total: 0 },
  ]);

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      loadProducts();
    }
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      const result = await window.api.getSuppliers();
      if (result.success) {
        setSuppliers(result.data.filter((s: any) => s.isActive));
      }
    } catch (error) {
      toast.error('Failed to load suppliers');
    }
  };

  const loadProducts = async () => {
    try {
      const result = await window.api.getProducts();
      if (result.success) {
        setProducts(result.data.filter((p: any) => p.isActive));
      }
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.supplierId) {
      toast.error('Please select a supplier');
      return;
    }

    if (!formData.orderDate) {
      toast.error('Please enter order date');
      return;
    }

    // Validate items
    const validItems = items.filter(item => item.productId > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    // Check for duplicate products
    const productIds = validItems.map(item => item.productId);
    const uniqueProductIds = new Set(productIds);
    if (productIds.length !== uniqueProductIds.size) {
      toast.error('Duplicate products found. Please remove duplicates.');
      return;
    }

    setLoading(true);

    try {
      // Calculate total amount
      const totalAmount = validItems.reduce((sum, item) => sum + item.total, 0);

      // Generate PO number
      const poNumber = `PO-${Date.now()}`;

      const purchaseData = {
        supplierId: parseInt(formData.supplierId),
        purchaseOrderNo: poNumber,
        orderDate: formData.orderDate,
        expectedDeliveryDate: formData.expectedDeliveryDate || null,
        totalAmount,
        status: 'pending',
        notes: formData.notes || null,
        items: validItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          costPrice: item.costPrice,
          total: item.total,
        })),
      };

      const result = await window.api.createPurchase(purchaseData);

      if (result.success) {
        toast.success('Purchase order created successfully!');
        // Reset form
        setFormData({
          supplierId: '',
          orderDate: new Date().toISOString().split('T')[0],
          expectedDeliveryDate: '',
          notes: '',
        });
        setItems([{ productId: 0, quantity: 1, costPrice: 0, total: 0 }]);
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to create purchase order');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const addItem = () => {
    setItems([...items, { productId: 0, quantity: 1, costPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product changed, update cost price
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].costPrice = product.costPrice;
        newItems[index].productName = product.nameEn;
      }
    }

    // Recalculate total
    newItems[index].total = newItems[index].quantity * newItems[index].costPrice;

    setItems(newItems);
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Purchase Order" size="xl">
      <form onSubmit={handleSubmit} className="p-6">
        {/* Supplier and Date Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => updateField('supplierId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.orderDate}
              onChange={(e) => updateField('orderDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
            <input
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => updateField('expectedDeliveryDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Products <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Product</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">Quantity</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Cost Price</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Total</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2 px-3">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        >
                          <option value={0}>Select Product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.nameEn} ({product.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.costPrice}
                          onChange={(e) => updateItem(index, 'costPrice', parseFloat(e.target.value) || 0)}
                          className="w-28 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </td>
                      <td className="py-2 px-3 text-sm text-right font-semibold">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="py-3 px-3 text-right font-semibold text-gray-700">
                      Grand Total:
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-lg text-blue-600">
                      {formatCurrency(calculateGrandTotal())}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Additional notes about this purchase order..."
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Package size={18} />
                Create Purchase Order
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPurchaseModal;
