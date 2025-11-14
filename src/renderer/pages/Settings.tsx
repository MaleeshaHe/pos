import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Save, Store, Globe, Receipt, DollarSign } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await window.api.getSettings();
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each setting
      for (const [key, value] of Object.entries(settings)) {
        await window.api.updateSetting(key, value);
      }
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600">Configure your POS system</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Store Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              <input
                type="text"
                value={settings.store_name || ''}
                onChange={(e) => updateSetting('store_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={settings.store_address || ''}
                onChange={(e) => updateSetting('store_address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={settings.store_phone || ''}
                onChange={(e) => updateSetting('store_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Language & Regional */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Language & Regional</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={settings.language || 'en'}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="en">English</option>
                <option value="si">Sinhala (සිංහල)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={settings.currency || 'LKR'}
                onChange={(e) => updateSetting('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="LKR">Sri Lankan Rupee (LKR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Receipt Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer</label>
              <textarea
                value={settings.receipt_footer || ''}
                onChange={(e) => updateSetting('receipt_footer', e.target.value)}
                rows={2}
                placeholder="Thank you for your business!"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Business Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                value={settings.tax_rate || '0'}
                onChange={(e) => updateSetting('tax_rate', e.target.value)}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Alert Level
              </label>
              <input
                type="number"
                value={settings.low_stock_alert || '10'}
                onChange={(e) => updateSetting('low_stock_alert', e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loyalty Points Rate (per 100 currency)
              </label>
              <input
                type="number"
                value={settings.loyalty_points_rate || '1'}
                onChange={(e) => updateSetting('loyalty_points_rate', e.target.value)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
