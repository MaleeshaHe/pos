import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Save,
  Store,
  Globe,
  Receipt,
  DollarSign,
  Printer,
  Palette,
  Download,
  Upload,
  Database,
  Image,
  TestTube,
  Sun,
  Moon,
  Type,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type TabType = 'store' | 'printer' | 'theme' | 'language' | 'backup';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [fontSize, setFontSize] = useState('medium');

  useEffect(() => {
    loadSettings();
    loadThemeSettings();
  }, []);

  useEffect(() => {
    if (settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);

  const loadSettings = async () => {
    try {
      const result = await window.api.getSettings();
      if (result.success) {
        const settingsObj: Record<string, string> = {};
        result.data.forEach((setting: any) => {
          settingsObj[setting.key] = setting.value;
        });
        setSettings(settingsObj);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadThemeSettings = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    const savedAccent = localStorage.getItem('accentColor') || '#3b82f6';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';

    setTheme(savedTheme);
    setAccentColor(savedAccent);
    setFontSize(savedFontSize);

    applyTheme(savedTheme, savedAccent, savedFontSize);
  };

  const applyTheme = (themeMode: string, accent: string, size: string) => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    document.documentElement.style.setProperty('--accent-color', accent);

    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px',
    };
    document.documentElement.style.setProperty(
      '--base-font-size',
      fontSizes[size as keyof typeof fontSizes] || '16px'
    );
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme, accentColor, fontSize);
    toast.success(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`);
  };

  const handleAccentChange = (color: string) => {
    setAccentColor(color);
    localStorage.setItem('accentColor', color);
    applyTheme(theme, color, fontSize);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    applyTheme(theme, accentColor, size);
    toast.success('Font size updated');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await window.api.updateSetting(key, value);
      }
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
    if (key === 'language') {
      i18n.changeLanguage(value);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const logoData = event.target?.result as string;
        updateSetting('store_logo', logoData);
        toast.success('Logo uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestPrint = () => {
    const testReceipt = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @media print {
            @page { size: ${settings.paper_size === '58mm' ? '58mm' : '80mm'} auto; margin: 0; }
            body { margin: 0; padding: 0; }
          }
          body {
            font-family: 'Courier New', monospace;
            width: ${settings.paper_size === '58mm' ? '58mm' : '80mm'};
            padding: 10px;
            font-size: 12px;
          }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
          .store-name { font-size: 18px; font-weight: bold; }
          .info { margin: 10px 0; }
          .footer { text-align: center; margin-top: 10px; border-top: 2px dashed #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">${settings.store_name || 'Premium POS'}</div>
          <div>${settings.store_address || ''}</div>
          <div>${settings.store_phone || ''}</div>
        </div>
        <div class="info">
          <p><strong>TEST PRINT</strong></p>
          <p>Paper Size: ${settings.paper_size || '80mm'}</p>
          <p>Date: ${new Date().toLocaleString()}</p>
          <p>This is a test receipt to verify printer configuration.</p>
        </div>
        <div class="footer">
          <div>${settings.receipt_footer || 'Thank you!'}</div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(testReceipt);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
      toast.success('Test print sent');
    } else {
      toast.error('Please allow popups for printing');
    }
  };

  const handleBackup = () => {
    const backupData = {
      settings,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    toast.success('Backup created successfully');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backupData = JSON.parse(event.target?.result as string);
          if (backupData.settings) {
            setSettings(backupData.settings);
            toast.success('Backup restored. Click Save to apply changes.');
          } else {
            toast.error('Invalid backup file');
          }
        } catch (error) {
          toast.error('Failed to restore backup');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'store' as TabType, name: 'Store & Branding', icon: Store },
    { id: 'printer' as TabType, name: 'Printer', icon: Printer },
    { id: 'theme' as TabType, name: 'Theme & UI', icon: Palette },
    { id: 'language' as TabType, name: 'Language', icon: Globe },
    { id: 'backup' as TabType, name: 'Backup & Restore', icon: Database },
  ];

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
          <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-600">Configure your POS system preferences</p>
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

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={20} />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'store' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Store & Branding Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  type="text"
                  value={settings.store_name || ''}
                  onChange={(e) => updateSetting('store_name', e.target.value)}
                  placeholder="Premium POS"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={settings.store_phone || ''}
                  onChange={(e) => updateSetting('store_phone', e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={settings.store_address || ''}
                  onChange={(e) => updateSetting('store_address', e.target.value)}
                  rows={3}
                  placeholder="123 Main Street, Colombo, Sri Lanka"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo (Receipt & Header)</label>
                <div className="flex items-center gap-4">
                  {settings.store_logo && (
                    <img
                      src={settings.store_logo}
                      alt="Store logo"
                      className="w-24 h-24 object-contain border border-gray-300 rounded"
                    />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                    <Image size={20} />
                    Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Recommended: 200x200px, PNG or JPG</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Receipt Message</label>
                <textarea
                  value={settings.receipt_footer || ''}
                  onChange={(e) => updateSetting('receipt_footer', e.target.value)}
                  rows={2}
                  placeholder="Thank you for your business! Please come again."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'printer' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Printer Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Printer</label>
                <select
                  value={settings.default_printer || 'system'}
                  onChange={(e) => updateSetting('default_printer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="system">System Default</option>
                  <option value="thermal">Thermal Printer</option>
                  <option value="laser">Laser Printer</option>
                  <option value="network">Network Printer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateSetting('paper_size', '58mm')}
                    className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                      settings.paper_size === '58mm'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    58mm
                  </button>
                  <button
                    onClick={() => updateSetting('paper_size', '80mm')}
                    className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                      settings.paper_size === '80mm'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    80mm
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto-print Receipt</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_print === 'true'}
                    onChange={(e) => updateSetting('auto_print', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Automatically print receipt after completing sale</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <button
                  onClick={handleTestPrint}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  <TestTube size={20} />
                  Test Print
                </button>
                <p className="text-xs text-gray-500 mt-2">Print a test receipt to verify printer configuration</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Theme & UI Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Display Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex items-center justify-center gap-3 px-6 py-4 border-2 rounded-lg font-medium transition-colors ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Sun size={24} />
                    Light Mode
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex items-center justify-center gap-3 px-6 py-4 border-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Moon size={24} />
                    Dark Mode
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Accent Color</label>
                <div className="grid grid-cols-6 gap-3">
                  {[
                    { color: '#3b82f6', name: 'Blue' },
                    { color: '#10b981', name: 'Green' },
                    { color: '#f59e0b', name: 'Orange' },
                    { color: '#ef4444', name: 'Red' },
                    { color: '#8b5cf6', name: 'Purple' },
                    { color: '#06b6d4', name: 'Cyan' },
                  ].map((item) => (
                    <button
                      key={item.color}
                      onClick={() => handleAccentChange(item.color)}
                      className={`h-16 rounded-lg border-4 transition-all ${
                        accentColor === item.color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: item.color }}
                      title={item.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Font Size (Cashier Friendly)
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: 'small', label: 'Small', size: '14px' },
                    { value: 'medium', label: 'Medium', size: '16px' },
                    { value: 'large', label: 'Large', size: '18px' },
                    { value: 'extra-large', label: 'Extra Large', size: '20px' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => handleFontSizeChange(item.value)}
                      className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                        fontSize === item.value
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ fontSize: item.size }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'language' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Language Settings</h2>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Language</label>
              <div className="space-y-3">
                <button
                  onClick={() => updateSetting('language', 'en')}
                  className={`w-full flex items-center justify-between px-6 py-4 border-2 rounded-lg font-medium transition-colors ${
                    (settings.language || 'en') === 'en'
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Globe size={24} />
                    English
                  </span>
                  {(settings.language || 'en') === 'en' && (
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs">Active</span>
                  )}
                </button>

                <button
                  onClick={() => updateSetting('language', 'si')}
                  className={`w-full flex items-center justify-between px-6 py-4 border-2 rounded-lg font-medium transition-colors ${
                    settings.language === 'si'
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Globe size={24} />
                    සිංහල (Sinhala)
                  </span>
                  {settings.language === 'si' && (
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs">Active</span>
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Language changes apply instantly across the entire application.
              </p>
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={settings.currency || 'LKR'}
                onChange={(e) => updateSetting('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="LKR">Sri Lankan Rupee (LKR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Backup & Restore</h2>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Auto Daily Backup</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Automatically backup your data every day at midnight to prevent data loss.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_backup === 'true'}
                    onChange={(e) => updateSetting('auto_backup', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-blue-900">Enable automatic daily backup</span>
                </label>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Manual Backup</h3>
                <button
                  onClick={handleBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <Download size={20} />
                  Create Backup Now
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Download a backup file of your current settings and data.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Restore from Backup</h3>
                <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium cursor-pointer w-fit">
                  <Upload size={20} />
                  Restore Backup
                  <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Upload a previously saved backup file to restore your settings.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Backup files contain your settings configuration</li>
                  <li>Database backups are stored separately in the data folder</li>
                  <li>Always keep recent backups in a safe location</li>
                  <li>Test restored backups to ensure data integrity</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
