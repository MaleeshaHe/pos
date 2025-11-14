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
  FileText,
  AlertTriangle,
  UserPlus,
  Keyboard,
} from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import PaymentModal from '../components/PaymentModal';
import HoldBillsModal from '../components/HoldBillsModal';
import ReturnBillModal from '../components/ReturnBillModal';
import QuickAddCustomerModal from '../components/QuickAddCustomerModal';
import { audioFeedback } from '../utils/audioFeedback';

interface Product {
  id: number;
  name: string;
  nameSi?: string;
  barcode?: string;
  sku: string;
  sellingPrice: number;
  stock: number;
  unit: string;
  categoryId?: number;
  categoryName?: string;
  imageUrl?: string;
}

interface Category {
  id: number;
  name: string;
  nameSi?: string;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  creditLimit: number;
  currentCredit: number;
}

interface CustomerPurchase {
  billNumber: string;
  createdAt: string;
  total: number;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
  }>;
}

const POS = () => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Store all products for filtering
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerPurchases, setCustomerPurchases] = useState<CustomerPurchase[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showHoldBills, setShowHoldBills] = useState(false);
  const [showReturnBill, setShowReturnBill] = useState(false);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [showLowStockWarning, setShowLowStockWarning] = useState(false);
  const [lowStockProduct, setLowStockProduct] = useState<Product | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [billNotes, setBillNotes] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef<string>('');
  const barcodeTimer = useRef<NodeJS.Timeout>();

  const { items, addItem, updateItem, removeItem, clearCart, getTotal, getSubtotal } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadCategories();

    // Setup keyboard shortcuts and barcode scanner listener
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

    // Keyboard shortcuts (F1-F6)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields, textareas, or select elements (except for F-keys)
      const isFunctionKey = e.key.startsWith('F') && ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'].includes(e.key);
      if (!isFunctionKey && (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )) {
        return;
      }

      // Prevent default for function keys
      if (isFunctionKey) {
        e.preventDefault();
      }

      // F1 - Focus product search
      if (e.key === 'F1') {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        toast.success('Search activated', { icon: '🔍', duration: 1000 });
      }

      // F2 - New Bill (Clear cart)
      if (e.key === 'F2') {
        if (items.length > 0) {
          if (confirm('Clear current cart and start new bill?')) {
            handleNewBill();
            toast.success('New bill started', { icon: '🆕', duration: 1000 });
          }
        } else {
          handleNewBill();
          toast.success('New bill started', { icon: '🆕', duration: 1000 });
        }
      }

      // F3 - Print / Checkout
      if (e.key === 'F3') {
        if (items.length > 0) {
          handleCheckout();
          toast.success('Opening payment', { icon: '🖨️', duration: 1000 });
        } else {
          toast.error('Cart is empty!');
        }
      }

      // F4 - Quick Add Customer
      if (e.key === 'F4') {
        setShowQuickAddCustomer(true);
        toast.success('Add customer', { icon: '👤', duration: 1000 });
      }

      // F5 - Hold Bill
      if (e.key === 'F5') {
        if (items.length > 0) {
          handleHoldBill();
        } else {
          toast.error('Cart is empty!');
        }
      }

      // F6 - Resume Held Bills
      if (e.key === 'F6') {
        setShowHoldBills(true);
        toast.success('Held bills', { icon: '⏸️', duration: 1000 });
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('keydown', handleKeyDown);
      if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
    };
  }, [items]);

  useEffect(() => {
    // Auto-focus search on mount and after actions
    searchInputRef.current?.focus();
  }, [items]);

  const loadProducts = async () => {
    const result = await window.api.getProducts();
    if (result.success) {
      // Map stock field correctly
      const productsWithStock = result.data.map((p: any) => ({
        ...p,
        stock: p.currentStock || p.stock || 0,
      }));
      setAllProducts(productsWithStock);
      setProducts(productsWithStock);
    }
  };

  const loadCategories = async () => {
    const result = await window.api.getCategories();
    if (result.success) {
      setCategories(result.data);
    }
  };

  const loadCustomers = async () => {
    const result = await window.api.getCustomers();
    if (result.success) {
      setCustomers(result.data);
    }
  };

  const loadCustomerPurchases = async (customerId: number) => {
    try {
      const result = await window.api.getCustomerBills(customerId);
      if (result.success) {
        setCustomerPurchases(result.data.slice(0, 5)); // Last 5 purchases
      }
    } catch (error) {
      console.error('Failed to load customer purchases:', error);
    }
  };

  const filterByCategory = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    if (categoryId === null) {
      setProducts(allProducts);
    } else {
      const filtered = allProducts.filter((p) => p.categoryId === categoryId);
      setProducts(filtered);
    }
    setSearchQuery('');
  };

  const handleBarcodeScanned = async (barcode: string) => {
    // Search for product by barcode
    const result = await window.api.searchProducts(barcode);
    if (result.success && result.data.length > 0) {
      const product = result.data[0];
      handleAddToCart(product);
      audioFeedback.success(); // Success beep
      toast.success(`📦 ${product.name} scanned!`, { icon: '✓' });
    } else {
      audioFeedback.error(); // Error sound
      toast.error(`Barcode "${barcode}" not found!`);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const result = await window.api.searchProducts(query);
      if (result.success) {
        // Apply category filter if selected
        if (selectedCategory !== null) {
          const filtered = result.data.filter((p: Product) => p.categoryId === selectedCategory);
          setProducts(filtered);
        } else {
          setProducts(result.data);
        }
      }
    } else if (query.length === 0) {
      // Restore category filter if active
      if (selectedCategory !== null) {
        filterByCategory(selectedCategory);
      } else {
        setProducts(allProducts);
      }
    }
  };

  const handleNewBill = () => {
    clearCart();
    setSelectedCustomer(null);
    setGlobalDiscount(0);
    setGlobalDiscountType('percentage');
    setBillNotes('');
    searchInputRef.current?.focus();
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      audioFeedback.error(); // Error sound for out of stock
      toast.error(t('pos.outOfStock') || 'Product out of stock!');
      return;
    }

    const existingItem = items.find((item) => item.productId === product.id);
    const currentCartQty = existingItem ? existingItem.quantity : 0;

    if (existingItem && existingItem.quantity >= product.stock) {
      audioFeedback.error(); // Error sound for insufficient stock
      toast.error(t('pos.notEnoughStock') || 'Not enough stock available!');
      return;
    }

    // Low stock warning (only 1 or 2 pieces left after adding)
    const remainingStock = product.stock - currentCartQty - 1;
    if (remainingStock === 0) {
      // Last piece warning
      audioFeedback.warning(); // Warning sound for last piece
      setLowStockProduct(product);
      setShowLowStockWarning(true);
    } else if (remainingStock === 1) {
      // Only 1 piece will remain
      audioFeedback.warning(); // Warning sound
      toast.warning(`⚠️ Only 1 piece left after this!`, { duration: 2000 });
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

    audioFeedback.itemAdded(); // Sound for item added
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
        notes: billNotes || null,
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
        handleNewBill();
      } else {
        toast.error(result.error || 'Failed to hold bill');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    }
  };

  const handleResumeBill = async (heldBill: any) => {
    try {
      // Clear current cart
      clearCart();

      // Load held bill items into cart with proper stock validation
      let hasStockIssues = false;

      for (const item of heldBill.items) {
        // Find the current product to get latest stock
        const currentProduct = allProducts.find((p) => p.id === item.productId);

        if (!currentProduct) {
          toast.error(`Product "${item.productName}" not found in inventory`);
          hasStockIssues = true;
          continue;
        }

        if (currentProduct.stock < item.quantity) {
          toast.warning(
            `${item.productName}: Only ${currentProduct.stock} available (held: ${item.quantity})`
          );
          hasStockIssues = true;
        }

        addItem({
          productId: item.productId,
          productName: item.productName,
          nameEn: item.productName,
          nameSi: currentProduct.nameSi,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal,
          currentStock: currentProduct.stock,
        });
      }

      // Restore customer if any
      if (heldBill.customerId) {
        const customer = customers.find((c) => c.id === heldBill.customerId);
        setSelectedCustomer(customer || null);
        if (customer) {
          loadCustomerPurchases(customer.id);
        }
      }

      // Restore bill notes
      if (heldBill.notes) {
        setBillNotes(heldBill.notes);
      }

      // Delete the held bill from database
      await window.api.deleteHeldBill(heldBill.id);

      setShowHoldBills(false);

      if (hasStockIssues) {
        toast.success('Bill resumed! Please check stock warnings.');
      } else {
        toast.success('Bill resumed successfully!');
      }
    } catch (error) {
      console.error('Error resuming bill:', error);
      toast.error('Failed to resume bill');
    }
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
        notes: billNotes || null,
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
        audioFeedback.checkout(); // Checkout complete sound
        toast.success('Sale completed successfully! 🎉');

        // Print receipt if requested
        if (paymentData.printReceipt) {
          await handlePrintReceipt(result.data);
        }

        handleNewBill();
        setShowPayment(false);

        // Reload products to update stock
        loadProducts();
      } else {
        audioFeedback.error(); // Error sound
        toast.error(result.error || 'Failed to complete sale');
      }
    } catch (error) {
      audioFeedback.error(); // Error sound
      toast.error('An error occurred');
      console.error(error);
    }
  };

  const handlePrintReceipt = async (bill: any) => {
    try {
      // Dynamically import the receipt printer utility
      const { ReceiptPrinter, getReceiptSettings } = await import('../utils/receiptPrinter');

      // Get receipt settings from system settings
      const receiptSettings = await getReceiptSettings();

      // Add language from current i18n
      receiptSettings.language = i18n.language as 'en' | 'si';

      // Create receipt printer instance
      const printer = new ReceiptPrinter(receiptSettings);

      // Prepare bill data for receipt
      const billData = {
        billNumber: bill.billNumber,
        createdAt: bill.createdAt,
        cashierName: user?.fullName || 'Cashier',
        customerName: selectedCustomer?.name,
        items: bill.items || items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal,
        })),
        subtotal: bill.subtotal || getSubtotal(),
        discount: bill.discount || 0,
        total: bill.total || calculateFinalTotal(),
        paymentMethod: bill.paymentMethod,
        paidAmount: bill.paidAmount,
        changeAmount: bill.changeAmount,
        notes: bill.notes || billNotes,
      };

      // Print receipt
      printer.printReceipt(billData);
      toast.success('Receipt sent to printer! 🖨️');
    } catch (error) {
      console.error('Receipt printing error:', error);
      toast.error('Failed to print receipt');
    }
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
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              title="Keyboard Shortcuts (F1-F6)"
            >
              <Keyboard size={18} />
            </button>
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

        {/* Keyboard Shortcuts Help */}
        {showKeyboardHelp && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Keyboard size={18} />
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-xs">F1</kbd>
                <span className="text-gray-700">Product Search</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-xs">F2</kbd>
                <span className="text-gray-700">New Bill</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-xs">F3</kbd>
                <span className="text-gray-700">Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-xs">F4</kbd>
                <span className="text-gray-700">Add Customer</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-xs">F5</kbd>
                <span className="text-gray-700">Hold Bill</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-xs">F6</kbd>
                <span className="text-gray-700">Resume Bills</span>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4">
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

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => filterByCategory(null)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                }`}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => filterByCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {i18n.language === 'si' && category.nameSi ? category.nameSi : category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.slice(0, 30).map((product) => (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="bg-white rounded-lg shadow-md p-3 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-400 flex flex-col"
              >
                {/* Product Image */}
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-24 object-cover rounded-md mb-2"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md mb-2 flex items-center justify-center">
                    <ShoppingCart size={32} className="text-gray-400" />
                  </div>
                )}

                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 text-sm flex-1">
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
        {/* Running Total Display - Large and Prominent */}
        <div className={`p-6 text-center border-b-4 transition-colors ${
          items.length > 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-700' : 'bg-gray-100 border-gray-300'
        }`}>
          <p className={`text-sm font-medium mb-1 ${items.length > 0 ? 'text-blue-100' : 'text-gray-500'}`}>
            {items.length > 0 ? 'CURRENT BILL TOTAL' : 'NO ITEMS IN CART'}
          </p>
          <p className={`text-5xl font-bold tracking-tight ${items.length > 0 ? 'text-white' : 'text-gray-400'}`}>
            {formatCurrency(calculateFinalTotal())}
          </p>
          {items.length > 0 && (
            <p className="text-sm text-blue-100 mt-2">
              {items.length} item{items.length !== 1 ? 's' : ''} • Subtotal: {formatCurrency(getSubtotal())}
            </p>
          )}
        </div>

        {/* Customer Selection */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User size={16} className="inline mr-1" />
            {t('pos.customer') || 'Customer'}
          </label>
          <div className="flex gap-2 mb-2">
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customer = customers.find((c) => c.id === Number(e.target.value));
                setSelectedCustomer(customer || null);
                if (customer) {
                  loadCustomerPurchases(customer.id);
                } else {
                  setCustomerPurchases([]);
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">{t('pos.walkInCustomer') || 'Walk-in Customer'}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.phone && `- ${customer.phone}`}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowQuickAddCustomer(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              title="Quick Add Customer (F4)"
            >
              <UserPlus size={18} />
            </button>
          </div>
          {selectedCustomer && (
            <>
              <p className="text-xs text-gray-600 mt-1">
                Credit Limit: {formatCurrency(selectedCustomer.creditLimit)} |
                Current: {formatCurrency(selectedCustomer.currentCredit)}
              </p>
              {customerPurchases.length > 0 && (
                <button
                  onClick={() => setShowCustomerHistory(!showCustomerHistory)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showCustomerHistory ? 'Hide' : 'View'} Purchase History ({customerPurchases.length})
                </button>
              )}
            </>
          )}
        </div>

        {/* Customer Purchase History */}
        {selectedCustomer && showCustomerHistory && customerPurchases.length > 0 && (
          <div className="px-4 pb-4 border-b border-gray-200 max-h-48 overflow-y-auto bg-blue-50">
            <p className="text-xs font-semibold text-gray-700 mb-2">Last 5 Purchases:</p>
            <div className="space-y-2">
              {customerPurchases.map((purchase) => (
                <div key={purchase.billNumber} className="bg-white rounded p-2 text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-900">{purchase.billNumber}</span>
                    <span className="text-blue-600 font-bold">{formatCurrency(purchase.total)}</span>
                  </div>
                  <p className="text-gray-500 text-[10px]">
                    {new Date(purchase.createdAt).toLocaleDateString()} • {purchase.items?.length || 0} items
                  </p>
                  {purchase.items && purchase.items.length > 0 && (
                    <button
                      onClick={() => {
                        // Add "Buy Again" functionality
                        purchase.items.forEach((item) => {
                          const product = allProducts.find(p => p.id === item.productId);
                          if (product && product.stock > 0) {
                            handleAddToCart(product);
                          }
                        });
                        toast.success('Items added to cart!');
                      }}
                      className="mt-1 text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                    >
                      🔁 Buy Again
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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

          {/* Bill Notes */}
          {items.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={14} className="inline mr-1" />
                Bill Notes (Optional)
              </label>
              <textarea
                value={billNotes}
                onChange={(e) => setBillNotes(e.target.value)}
                placeholder="e.g., Delivery tomorrow, Repair included..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                rows={2}
              />
            </div>
          )}

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

      <QuickAddCustomerModal
        isOpen={showQuickAddCustomer}
        onClose={() => setShowQuickAddCustomer(false)}
        onSuccess={(newCustomer) => {
          loadCustomers();
          setSelectedCustomer(newCustomer);
          setShowQuickAddCustomer(false);
          toast.success(`Customer ${newCustomer.name} added successfully!`);
        }}
      />

      {/* Low Stock Warning Dialog */}
      {showLowStockWarning && lowStockProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-yellow-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Last Piece Warning!</h3>
                <p className="text-sm text-gray-600">Low stock alert</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-800 mb-2">
                <span className="font-semibold">{lowStockProduct.name}</span> is now at its last piece!
              </p>
              <p className="text-xs text-gray-600">
                SKU: {lowStockProduct.sku} | Remaining: <span className="font-bold text-red-600">0 after this sale</span>
              </p>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              This is the final unit in stock. Consider reordering soon to avoid stockouts.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLowStockWarning(false);
                  setLowStockProduct(null);
                }}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Got it
              </button>
              <button
                onClick={() => {
                  setShowLowStockWarning(false);
                  setLowStockProduct(null);
                  // Could navigate to reorder page in future
                }}
                className="flex-1 py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
              >
                Remind Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
