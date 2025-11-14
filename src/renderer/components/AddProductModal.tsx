import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddProductModal = ({ isOpen, onClose, onSuccess }: AddProductModalProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    nameSi: '',
    description: '',
    categoryId: '',
    brandId: '',
    costPrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    currentStock: '',
    reorderLevel: '10',
    unit: 'pcs',
    taxRate: '0',
  });

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadBrands();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    const result = await window.api.getCategories();
    if (result.success) {
      setCategories(result.data);
    }
  };

  const loadBrands = async () => {
    const result = await window.api.getBrands();
    if (result.success) {
      setBrands(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.sku || !formData.name || !formData.sellingPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        sku: formData.sku,
        barcode: formData.barcode || null,
        name: formData.name,
        nameSi: formData.nameSi || null,
        description: formData.description || null,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        brandId: formData.brandId ? parseInt(formData.brandId) : null,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice),
        wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : null,
        currentStock: parseFloat(formData.currentStock) || 0,
        reorderLevel: parseFloat(formData.reorderLevel) || 10,
        unit: formData.unit,
        taxRate: parseFloat(formData.taxRate) || 0,
        isActive: true,
      };

      const result = await window.api.createProduct(productData);

      if (result.success) {
        toast.success('Product added successfully!');
        // Reset form
        setFormData({
          sku: '',
          barcode: '',
          name: '',
          nameSi: '',
          description: '',
          categoryId: '',
          brandId: '',
          costPrice: '',
          sellingPrice: '',
          wholesalePrice: '',
          currentStock: '',
          reorderLevel: '10',
          unit: 'pcs',
          taxRate: '0',
        });
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to add product');
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Product" size="lg">
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => updateField('sku', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => updateField('barcode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name (Sinhala)
              </label>
              <input
                type="text"
                value={formData.nameSi}
                onChange={(e) => updateField('nameSi', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select
                value={formData.brandId}
                onChange={(e) => updateField('brandId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => updateField('costPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => updateField('sellingPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.wholesalePrice}
                onChange={(e) => updateField('wholesalePrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentStock}
                  onChange={(e) => updateField('currentStock', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.reorderLevel}
                  onChange={(e) => updateField('reorderLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => updateField('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="l">Liter (l)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="m">Meter (m)</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => updateField('taxRate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProductModal;
