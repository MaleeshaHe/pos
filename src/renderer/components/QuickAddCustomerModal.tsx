import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { User, Phone, Mail, CreditCard, Save, X } from 'lucide-react';
import Modal from './Modal';

interface QuickAddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: any) => void;
}

const QuickAddCustomerModal = ({ isOpen, onClose, onSuccess }: QuickAddCustomerModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: '0',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Customer name is required!');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Phone number is required!');
      return;
    }

    setLoading(true);
    try {
      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        creditLimit: parseFloat(formData.creditLimit) || 0,
      };

      const result = await window.api.createCustomer(customerData);

      if (result.success) {
        toast.success('Customer added successfully!');

        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: '',
          address: '',
          creditLimit: '0',
        });

        // Call success callback with new customer
        onSuccess(result.data);
      } else {
        toast.error(result.error || 'Failed to add customer');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        creditLimit: '0',
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Quick Add Customer" size="md">
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> You can add customers quickly during billing. Just enter name and phone number to get started!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={14} className="inline mr-1" />
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter customer name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone size={14} className="inline mr-1" />
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g., 0771234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail size={14} className="inline mr-1" />
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Address (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address (Optional)
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter customer address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={2}
            />
          </div>

          {/* Credit Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard size={14} className="inline mr-1" />
              Credit Limit (Rs.)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-600 mt-1">
              Set credit limit to 0 if customer doesn't need credit facility
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              <X size={16} className="inline mr-1" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Add Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default QuickAddCustomerModal;
