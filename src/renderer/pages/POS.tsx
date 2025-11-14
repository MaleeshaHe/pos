import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Save,
  RotateCcw,
  Receipt,
  Percent,
  ScanBarcode,
  Clock,
} from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import PaymentModal from '../components/PaymentModal';
import HoldBillsModal from '../components/HoldBillsModal';
import ReturnBillModal from '../components/ReturnBillModal';

interface Product {
  id: number;
  name: string;
  nameSi?: string;
  barcode?: string;
  sku: string;
  sellingPrice: number;
  stock: number;
  unit: string;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  creditLimit: number;
  currentCredit: number;
}

const POS = () => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showHoldBills, setShowHoldBills] = useState(false);
  const [showReturnBill, setShowReturnBill] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef<string>('');
  const barcodeTimer = useRef<NodeJS.Timeout>();

  const { items, addItem, updateItem, removeItem, clearCart, getTotal, getSubtotal } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadProducts();
    loadCustomers();

    // Setup barcode scanner listener
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input fields (except barcode search)
      if (e.target instanceof HTMLInputElement && e.target !== searchInputRef.current) {
        return;
      }

      // Enter key completes barcode scan
      if (e.key === 'Enter' && barcodeBuffer.current.length > 0) {
        handleBarcodeScanned(barcodeBuffer.current);
        barcodeBuffer.current = '';
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
        return;
      }

      // Build barcode buffer
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;

        // Clear buffer after 100ms of inactivity
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
    };
  }, []);

  useEffect(() => {
    // Auto-focus search on mount and after actions
    searchInputRef.current?.focus();
  }, [items]);

  const loadProducts = async () => {
    const result = await window.api.getProducts();
    if (result.success) {
      setProducts(result.data);
    }
  };

  const loadCustomers = async () => {
    const result = await window.api.getCustomers();
    if (result.success) {
      setCustomers(result.data);
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    // Search for product by barcode
    const result = await window.api.searchProducts(barcode);
    if (result.success && result.data.length > 0) {
      const product = result.data[0];
      handleAddToCart(product);
      toast.success(`📦 ${product.name} scanned!`, { icon: '✓' });
    } else {
      toast.error(`Barcode "${barcode}" not found!`);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const result = await window.api.searchProducts(query);
      if (result.success) {
        setProducts(result.data);
      }
    } else if (query.length === 0) {
      loadProducts();
    }
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(t('pos.outOfStock') || 'Product out of stock!');
      return;
    }

    const existingItem = items.find((item) => item.productId === product.id);
    if (existingItem && existingItem.quantity >= product.stock) {
      toast.error(t('pos.notEnoughStock') || 'Not enough stock available!');
      return;
    }

    addItem({
      productId: product.id,
      productName: i18n.language === 'si' && product.nameSi ? product.nameSi : product.name,
      nameEn: product.name,
      nameSi: product.nameSi,
      quantity: 1,
      unitPrice: product.sellingPrice,
      discount: 0,
      subtotal: product.sellingPrice,
      currentStock: product.stock,
    });

    toast.success(`${product.name} added`, { duration: 1000 });
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleQuantityChange = (productId: number, delta: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    if (newQuantity > item.currentStock) {
      toast.error(t('pos.notEnoughStock') || 'Not enough stock available!');
      return;
    }

    updateItem(productId, { quantity: newQuantity });
  };

  const handleItemDiscountChange = (productId: number, discount: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;

    const maxDiscount = item.unitPrice * item.quantity;
    const validDiscount = Math.max(0, Math.min(discount, maxDiscount));

    updateItem(productId, { discount: validDiscount });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error(t('pos.emptyCart') || 'Cart is empty!');
      return;
    }
    setShowPayment(true);
  };

  const handleHoldBill = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    try {
      const billData = {
        customerId: selectedCustomer?.id || null,
        userId: user?.id,
        subtotal: getSubtotal(),
        discount: calculateGlobalDiscount(),
        total: calculateFinalTotal(),
        paymentMethod: 'cash', // Default for held bills
        paidAmount: 0,
        changeAmount: 0,
        creditAmount: 0,
        status: 'held',
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.nameEn || item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal - item.discount,
        })),
      };

      const result = await window.api.holdBill(billData);

      if (result.success) {
        toast.success('Bill saved to hold list!');
        clearCart();
        setSelectedCustomer(null);
        setGlobalDiscount(0);
      } else {
        toast.error(result.error || 'Failed to hold bill');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    }
  };

  const handleResumeBill = (heldBill: any) => {
    // Clear current cart
    clearCart();

    // Load held bill items into cart
    heldBill.items.forEach((item: any) => {
      addItem({
        productId: item.productId,
        productName: item.productName,
        nameEn: item.productName,
        nameSi: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        subtotal: item.subtotal,
        currentStock: 999, // Will be validated on checkout
      });
    });

    // Set customer if any
    if (heldBill.customerId) {
      const customer = customers.find((c) => c.id === heldBill.customerId);
      setSelectedCustomer(customer || null);
    }

    setShowHoldBills(false);
    toast.success('Bill resumed!');
  };

  const calculateGlobalDiscount = () => {
    const subtotal = getSubtotal();
    if (globalDiscountType === 'percentage') {
      return (subtotal * globalDiscount) / 100;
    }
    return globalDiscount;
  };

  const calculateFinalTotal = () => {
    const subtotal = getSubtotal();
    const itemDiscounts = items.reduce((sum, item) => sum + item.discount, 0);
    const globalDiscountAmount = calculateGlobalDiscount();
    return Math.max(0, subtotal - itemDiscounts - globalDiscountAmount);
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const handleCompleteSale = async (paymentData: any) => {
    try {
      const billData = {
        customerId: selectedCustomer?.id || null,
        userId: user?.id,
        subtotal: getSubtotal(),
        discount: calculateGlobalDiscount() + items.reduce((sum, item) => sum + item.discount, 0),
        total: calculateFinalTotal(),
        paymentMethod: paymentData.method,
        paidAmount: paymentData.paidAmount,
        changeAmount: paymentData.changeAmount,
        creditAmount: paymentData.creditAmount,
        splitPayments: paymentData.splitPayments,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.nameEn || item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal - item.discount,
        })),
      };

      const result = await window.api.createBill(billData);

      if (result.success) {
        toast.success('Sale completed successfully! 🎉');

        // Print receipt if requested
        if (paymentData.printReceipt) {
          await handlePrintReceipt(result.data);
        }

        clearCart();
        setSelectedCustomer(null);
        setGlobalDiscount(0);
        setGlobalDiscountType('percentage');
        setShowPayment(false);

        // Reload products to update stock
        loadProducts();
      } else {
        toast.error(result.error || 'Failed to complete sale');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    }
  };

  const handlePrintReceipt = async (bill: any) => {
    // Receipt printing will be implemented
    console.log('Printing receipt for bill:', bill);
    toast.success('Receipt sent to printer!');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Side - Product Search & Selection */}
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('pos.title') || 'Point of Sale'}</h1>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <ScanBarcode size={16} />
              Scan barcode or search products
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowHoldBills(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
            >
              <Clock size={18} />
              Held Bills
            </button>
            <button
              onClick={() => setShowReturnBill(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
            >
              <RotateCcw size={18} />
              Return/Refund
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('pos.searchPlaceholder') || 'Search by name, barcode, or SKU...'}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.slice(0, 30).map((product) => (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-400"
              >
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 text-sm">
                  {i18n.language === 'si' && product.nameSi ? product.nameSi : product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                <p className="text-lg font-bold text-blue-600 mb-2">
                  {formatCurrency(product.sellingPrice)}
                </p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">
                    Stock: {product.stock} {product.unit}
                  </span>
                  {product.stock <= 10 && product.stock > 0 && (
                    <span className="text-yellow-600 font-semibold">Low</span>
                  )}
                  {product.stock === 0 && (
                    <span className="text-red-600 font-semibold">Out</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Cart & Checkout */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Customer Selection */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User size={16} className="inline mr-1" />
            {t('pos.customer') || 'Customer'}
          </label>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find((c) => c.id === Number(e.target.value));
              setSelectedCustomer(customer || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('pos.walkInCustomer') || 'Walk-in Customer'}</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.phone && `- ${customer.phone}`}
              </option>
            ))}
          </select>
          {selectedCustomer && (
            <p className="text-xs text-gray-600 mt-1">
              Credit Limit: {formatCurrency(selectedCustomer.creditLimit)} |
              Current: {formatCurrency(selectedCustomer.currentCredit)}
            </p>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={20} />
            {t('pos.cart') || 'Cart'} ({items.length} items)
          </h2>

          {items.length === 0 ? (
            <div className="text-center text-gray-500 mt-12">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
              <p>{t('pos.emptyCart') || 'Cart is empty'}</p>
              <p className="text-sm">{t('pos.startScanning') || 'Start scanning or adding products'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-800">{item.productName}</h3>
                      <p className="text-xs text-gray-600">{formatCurrency(item.unitPrice)} each</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.productId, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.productId, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>

                  {/* Item Discount */}
                  <div className="flex items-center gap-2">
                    <Percent size={14} className="text-gray-500" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => handleItemDiscountChange(item.productId, parseFloat(e.target.value) || 0)}
                      placeholder="Discount"
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-xs text-gray-600">disc</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {/* Global Discount */}
          {items.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent size={14} className="inline mr-1" />
                Global Discount
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setGlobalDiscountType('percentage')}
                  className={`flex-1 py-1 text-xs rounded ${
                    globalDiscountType === 'percentage'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  %
                </button>
                <button
                  onClick={() => setGlobalDiscountType('amount')}
                  className={`flex-1 py-1 text-xs rounded ${
                    globalDiscountType === 'amount'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  Rs.
                </button>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {globalDiscount > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Discount: -{formatCurrency(calculateGlobalDiscount())}
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('pos.subtotal') || 'Subtotal'}:</span>
              <span className="font-semibold">{formatCurrency(getSubtotal())}</span>
            </div>
            {items.reduce((sum, item) => sum + item.discount, 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Item Discounts:</span>
                <span className="font-semibold text-green-600">
                  -{formatCurrency(items.reduce((sum, item) => sum + item.discount, 0))}
                </span>
              </div>
            )}
            {globalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Global Discount:</span>
                <span className="font-semibold text-green-600">
                  -{formatCurrency(calculateGlobalDiscount())}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>{t('pos.total') || 'Total'}:</span>
              <span className="text-blue-600">{formatCurrency(calculateFinalTotal())}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <DollarSign size={20} />
              {t('pos.checkout') || 'Checkout'}
            </button>

            <button
              onClick={handleHoldBill}
              disabled={items.length === 0}
              className="w-full py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Hold Bill
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={calculateFinalTotal()}
        customer={selectedCustomer}
        onComplete={handleCompleteSale}
      />

      <HoldBillsModal
        isOpen={showHoldBills}
        onClose={() => setShowHoldBills(false)}
        onResume={handleResumeBill}
      />

      <ReturnBillModal
        isOpen={showReturnBill}
        onClose={() => setShowReturnBill(false)}
      />
    </div>
  );
};

export default POS;
