// Shared types between main and renderer processes

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'admin' | 'manager' | 'cashier';
  email?: string;
  phone?: string;
}

export interface Product {
  id: number;
  sku: string;
  barcode?: string;
  name: string;
  nameSi?: string;
  description?: string;
  categoryId?: number;
  brandId?: number;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  imageUrl?: string;
  expiryDate?: string;
  batchNumber?: string;
  isActive: boolean;
  taxRate?: number;
  hasVariants?: boolean;
  parentProductId?: number;
  variantAttributes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  creditLimit: number;
  currentCredit: number;
  loyaltyPoints: number;
  memberLevel: 'bronze' | 'silver' | 'gold';
  birthday?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: number;
  billNumber: string;
  customerId?: number;
  userId: number;
  subtotal: number;
  discount: number;
  discountType: 'amount' | 'percentage';
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'credit' | 'split';
  paidAmount: number;
  changeAmount: number;
  creditAmount?: number;
  status: 'completed' | 'refunded' | 'partial_refund';
  isHeld?: boolean;
  notes?: string;
  createdAt: string;
}

export interface BillItem {
  id: number;
  billId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  createdAt: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
