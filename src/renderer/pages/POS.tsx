import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Search, Plus, Minus, Trash2, User, DollarSign, CreditCard, ShoppingCart, Save } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';

interface Product {
  id: number;
  name: string;
  nameSi?: string;
  barcode?: string;
  sellingPrice: number;
  currentStock: number;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { items, addItem, updateItem, removeItem, clearCart, getTotal, getSubtotal } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadProducts();
    loadCustomers();
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
    if (product.currentStock <= 0) {
      toast.error('Product out of stock!');
      return;
    }

    const existingItem = items.find((item) => item.productId === product.id);
    if (existingItem && existingItem.quantity >= product.currentStock) {
      toast.error('Not enough stock available!');
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      nameSi: product.nameSi,
      quantity: 1,
      unitPrice: product.sellingPrice,
      discount: 0,
      subtotal: product.sellingPrice,
      currentStock: product.currentStock,
    });

    toast.success(`${product.name} added to cart`);
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
      toast.error('Not enough stock available!');
      return;
    }

    updateItem(productId, { quantity: newQuantity });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Cart is empty!');
      return;
    }
    setShowPayment(true);
  };

  const handleCompleteSale = async () => {
    if (items.length === 0) return;

    const total = getTotal();
    const paid = parseFloat(paidAmount) || 0;

    if (paymentMethod !== 'credit' && paid < total) {
      toast.error('Paid amount is less than total!');
      return;
    }

    if (paymentMethod === 'credit' && !selectedCustomer) {
      toast.error('Please select a customer for credit payment!');
      return;
    }

    try {
      const billData = {
        customerId: selectedCustomer?.id || null,
        userId: user?.id,
        subtotal: getSubtotal(),
        discount: 0,
        total,
        paymentMethod,
        paidAmount: paymentMethod === 'credit' ? 0 : paid,
        changeAmount: paymentMethod === 'credit' ? 0 : Math.max(0, paid - total),
        creditAmount: paymentMethod === 'credit' ? total : 0,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal,
        })),
      };

      const result = await window.api.createBill(billData);

      if (result.success) {
        toast.success('Sale completed successfully!');
        clearCart();
        setSelectedCustomer(null);
        setPaidAmount('');
        setShowPayment(false);
        setPaymentMethod('cash');
      } else {
        toast.error(result.error || 'Failed to complete sale');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Side - Product Search & Selection */}
      <div className="flex-1 flex flex-col p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Point of Sale</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search products by name, barcode, or SKU..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 20).map((product) => (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
              >
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                {product.nameSi && <p className="text-xs text-gray-500 mb-2">{product.nameSi}</p>}
                <p className="text-lg font-bold text-blue-600 mb-2">
                  {formatCurrency(product.sellingPrice)}
                </p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Stock: {product.currentStock} {product.unit}</span>
                  {product.currentStock <= 10 && (
                    <span className="text-red-600 font-semibold">Low</span>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find((c) => c.id === Number(e.target.value));
              setSelectedCustomer(customer || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.phone && `- ${customer.phone}`}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={20} />
            Cart ({items.length} items)
          </h2>

          {items.length === 0 ? (
            <div className="text-center text-gray-500 mt-12">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
              <p>Cart is empty</p>
              <p className="text-sm">Start scanning or adding products</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-800">{item.productName}</h3>
                      <p className="text-xs text-gray-600">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Section */}
        {showPayment ? (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-800 mb-3">Payment</h3>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    paymentMethod === 'cash'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    paymentMethod === 'card'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  Card
                </button>
                <button
                  onClick={() => setPaymentMethod('credit')}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    paymentMethod === 'credit'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  Credit
                </button>
              </div>
            </div>

            {paymentMethod !== 'credit' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Paid Amount</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                  autoFocus
                />
                {paidAmount && (
                  <p className="text-sm text-gray-600 mt-1">
                    Change: {formatCurrency(Math.max(0, parseFloat(paidAmount) - getTotal()))}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={handleCompleteSale}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Complete
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(getSubtotal())}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(getTotal())}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <DollarSign size={20} />
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;
