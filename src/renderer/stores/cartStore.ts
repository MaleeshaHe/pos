import { create } from 'zustand';

interface CartItem {
  productId: number;
  productName: string;
  nameEn?: string;
  nameSi?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  currentStock: number;
}

interface CartState {
  items: CartItem[];
  customerId: number | null;
  discount: number;
  discountType: 'amount' | 'percentage';
  notes: string;
  addItem: (item: CartItem) => void;
  updateItem: (productId: number, updates: Partial<CartItem>) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  setCustomer: (customerId: number | null) => void;
  setDiscount: (discount: number, type: 'amount' | 'percentage') => void;
  setNotes: (notes: string) => void;
  getTotal: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  discount: 0,
  discountType: 'amount',
  notes: '',

  addItem: (item) => {
    const { items } = get();
    const existingItem = items.find((i) => i.productId === item.productId);

    if (existingItem) {
      set({
        items: items.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                subtotal: (i.quantity + item.quantity) * i.unitPrice - i.discount,
              }
            : i
        ),
      });
    } else {
      set({ items: [...items, item] });
    }
  },

  updateItem: (productId, updates) => {
    set({
      items: get().items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              ...updates,
              subtotal: (updates.quantity ?? item.quantity) * (updates.unitPrice ?? item.unitPrice) - (updates.discount ?? item.discount),
            }
          : item
      ),
    });
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.productId !== productId) });
  },

  clearCart: () => {
    set({
      items: [],
      customerId: null,
      discount: 0,
      discountType: 'amount',
      notes: '',
    });
  },

  setCustomer: (customerId) => set({ customerId }),

  setDiscount: (discount, type) => set({ discount, discountType: type }),

  setNotes: (notes) => set({ notes }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const { discount, discountType } = get();

    let totalDiscount = discount;
    if (discountType === 'percentage') {
      totalDiscount = (subtotal * discount) / 100;
    }

    return Math.max(0, subtotal - totalDiscount);
  },
}));
