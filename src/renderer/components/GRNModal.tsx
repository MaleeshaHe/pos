import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Package, CheckCircle } from 'lucide-react';
import Modal from './Modal';

interface GRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseId: number;
}

interface PurchaseItem {
  id: number;
  productId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  costPrice: number;
  total: number;
  receivedQuantity: number;
}

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
}

const GRNModal = ({ isOpen, onClose, onSuccess, purchaseId }: GRNModalProps) => {
  const [loading, setLoading] = useState(false);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && purchaseId) {
      loadPurchaseDetails();
    }
  }, [isOpen, purchaseId]);

  const loadPurchaseDetails = async () => {
    try {
      // Get purchase details
      const purchasesResult = await window.api.getPurchases();
      if (purchasesResult.success) {
        const purchaseData = purchasesResult.data.find((p: Purchase) => p.id === purchaseId);

        if (purchaseData) {
          // Get supplier name
          const suppliersResult = await window.api.getSuppliers();
          if (suppliersResult.success) {
            const supplier = suppliersResult.data.find((s: any) => s.id === purchaseData.supplierId);
            purchaseData.supplierName = supplier?.name || 'Unknown Supplier';
          }
          setPurchase(purchaseData);
        }
      }

      // Get purchase items
      const itemsResult = await window.api.getPurchaseItems(purchaseId);
      if (itemsResult.success) {
        // Enrich items with product details
        const productsResult = await window.api.getProducts();
        if (productsResult.success) {
          const productMap = new Map(
            productsResult.data.map((p: any) => [p.id, { name: p.nameEn, sku: p.sku }])
          );

          const enrichedItems = itemsResult.data.map((item: PurchaseItem) => ({
            ...item,
            productName: productMap.get(item.productId)?.name || 'Unknown Product',
            sku: productMap.get(item.productId)?.sku || '',
            receivedQuantity: item.quantity, // Default to full quantity
          }));

          setItems(enrichedItems);
        }
      }
    } catch (error) {
      toast.error('Failed to load purchase details');
      console.error(error);
    }
  };

  const updateReceivedQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].receivedQuantity = Math.max(0, Math.min(quantity, newItems[index].quantity));
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!receivedDate) {
      toast.error('Please enter received date');
      return;
    }

    const totalReceived = items.reduce((sum, item) => sum + item.receivedQuantity, 0);
    if (totalReceived === 0) {
      toast.error('Please receive at least one item');
      return;
    }

    setLoading(true);

    try {
      // Update stock for each received item
      for (const item of items) {
        if (item.receivedQuantity > 0) {
          // Get current product stock
          const productsResult = await window.api.getProducts();
          if (productsResult.success) {
            const product = productsResult.data.find((p: any) => p.id === item.productId);
            if (product) {
              const newStock = product.stock + item.receivedQuantity;

              // Update product stock
              await window.api.updateProduct(item.productId, {
                ...product,
                stock: newStock,
              });

              // Create stock log entry
              await window.api.createStockLog({
                productId: item.productId,
                type: 'purchase',
                quantity: item.receivedQuantity,
                previousStock: product.stock,
                newStock: newStock,
                referenceType: 'purchase',
                referenceId: purchaseId,
                notes: `GRN for PO ${purchase?.purchaseOrderNo}`,
              });
            }
          }
        }
      }

      // Check if all items are fully received
      const allFullyReceived = items.every(item => item.receivedQuantity === item.quantity);
      const anyReceived = items.some(item => item.receivedQuantity > 0);

      // Update purchase status
      if (purchase) {
        const newStatus = allFullyReceived ? 'completed' : (anyReceived ? 'received' : purchase.status);

        const result = await window.api.updatePurchase(purchaseId, {
          ...purchase,
          status: newStatus,
          receivedDate: receivedDate,
          notes: notes || purchase.notes,
        });

        if (result.success) {
          toast.success('GRN processed successfully! Stock updated.');
          onSuccess();
          onClose();
        } else {
          toast.error(result.error || 'Failed to update purchase');
        }
      }
    } catch (error) {
      toast.error('An error occurred while processing GRN');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!purchase) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Goods Received Note (GRN)" size="xl">
      <form onSubmit={handleSubmit} className="p-6">
        {/* Purchase Order Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600">PO Number</p>
              <p className="text-sm font-semibold text-gray-900">{purchase.purchaseOrderNo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Supplier</p>
              <p className="text-sm font-semibold text-gray-900">{purchase.supplierName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Order Date</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(purchase.orderDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Amount</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(purchase.totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Received Date */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Received Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        {/* Items to Receive */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Items to Receive
          </label>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Product</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">SKU</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">Ordered Qty</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">Received Qty</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Cost Price</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3">
                        <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                      </td>
                      <td className="py-2 px-3 text-center text-sm text-gray-600">
                        {item.sku}
                      </td>
                      <td className="py-2 px-3 text-center text-sm text-gray-900 font-semibold">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          step="1"
                          value={item.receivedQuantity}
                          onChange={(e) => updateReceivedQuantity(index, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-right text-sm text-gray-600">
                        {formatCurrency(item.costPrice)}
                      </td>
                      <td className="py-2 px-3 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(item.receivedQuantity * item.costPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="py-3 px-3 text-right font-semibold text-gray-700">
                      Total Received Value:
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-lg text-blue-600">
                      {formatCurrency(
                        items.reduce((sum, item) => sum + (item.receivedQuantity * item.costPrice), 0)
                      )}
                    </td>
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Additional notes about this GRN..."
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Confirm Receipt & Update Stock
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GRNModal;
