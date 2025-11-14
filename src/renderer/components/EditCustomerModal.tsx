import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { User, Phone, Mail, MapPin, CreditCard, Star, FileText } from 'lucide-react';
import Modal from './Modal';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer: any;
}

const EditCustomerModal = ({ isOpen, onClose, onSuccess, customer }: EditCustomerModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 0,
    memberLevel: 'bronze',
    notes: '',
    isVIP: false,
  });
  const [loading, setLoading] = useState(false);

  // Populate form when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        creditLimit: customer.creditLimit || 0,
        memberLevel: customer.memberLevel || 'bronze',
        notes: customer.notes || '',
        isVIP: customer.isVIP || false,
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      toast.error('Phone number must be 10 digits');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Invalid email address');
      return;
    }

    if (formData.creditLimit < 0) {
      toast.error('Credit limit cannot be negative');
      return;
    }

    // Check if credit limit is being reduced below current credit
    if (formData.creditLimit < customer.currentCredit) {
      toast.error(
        `Credit limit cannot be less than current credit balance (Rs. ${customer.currentCredit.toFixed(2)})`
      );
      return;
    }

    setLoading(true);

    try {
      const result = await window.api.updateCustomer(customer.id, formData);

      if (result.success) {
        toast.success('Customer updated successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to update customer');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Customer" size="lg">
      <form onSubmit={handleSubmit} className="p-6">
        {/* Customer ID Display */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Customer ID</p>
              <p className="text-sm font-semibold text-gray-900">{customer.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Current Credit</p>
              <p className="text-sm font-semibold text-orange-600">
                Rs. {customer.currentCredit?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Loyalty Points</p>
              <p className="text-sm font-semibold text-blue-600">{customer.loyaltyPoints || 0} pts</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name - Required */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter customer name"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0771234567"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@example.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter customer address"
                rows={2}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>

          {/* Credit Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credit Limit (Rs.)
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                step="0.01"
                min={customer.currentCredit || 0}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            {customer.currentCredit > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                Minimum limit: Rs. {customer.currentCredit.toFixed(2)} (current credit balance)
              </p>
            )}
          </div>

          {/* Member Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Level
            </label>
            <select
              value={formData.memberLevel}
              onChange={(e) => setFormData({ ...formData, memberLevel: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes (e.g., VIP, frequent buyer, special requirements)"
                rows={2}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>

          {/* VIP Checkbox */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVIP}
                onChange={(e) => setFormData({ ...formData, isVIP: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Star size={18} className={formData.isVIP ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
              <span className="text-sm font-medium text-gray-700">Mark as VIP Customer</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCustomerModal;
