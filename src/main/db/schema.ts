import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================
// USERS & AUTHENTICATION
// ============================================
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // hashed
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('cashier'), // admin, manager, cashier
  phone: text('phone'),
  email: text('email'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// PRODUCTS & INVENTORY
// ============================================
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  nameSi: text('name_si'), // Sinhala name
  description: text('description'),
  parentId: integer('parent_id'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const brands = sqliteTable('brands', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  barcode: text('barcode').unique(),
  name: text('name').notNull(),
  nameSi: text('name_si'), // Sinhala name
  description: text('description'),
  categoryId: integer('category_id').references(() => categories.id),
  brandId: integer('brand_id').references(() => brands.id),

  // Pricing
  costPrice: real('cost_price').notNull().default(0),
  sellingPrice: real('selling_price').notNull(),
  wholesalePrice: real('wholesale_price'),

  // Stock
  currentStock: real('current_stock').notNull().default(0),
  reorderLevel: real('reorder_level').notNull().default(10),
  unit: text('unit').notNull().default('pcs'), // pcs, kg, litre, etc.

  // Additional
  imageUrl: text('image_url'),
  expiryDate: text('expiry_date'),
  batchNumber: text('batch_number'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  taxRate: real('tax_rate').default(0),

  // Variants support
  hasVariants: integer('has_variants', { mode: 'boolean' }).default(false),
  parentProductId: integer('parent_product_id'),
  variantAttributes: text('variant_attributes'), // JSON: {color: "red", size: "L"}

  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const stockLogs = sqliteTable('stock_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  type: text('type').notNull(), // adjustment, sale, return, purchase, transfer
  quantity: real('quantity').notNull(),
  previousStock: real('previous_stock').notNull(),
  newStock: real('new_stock').notNull(),
  reason: text('reason'),
  userId: integer('user_id').references(() => users.id),
  referenceId: integer('reference_id'), // bill_id or purchase_id
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// CUSTOMERS
// ============================================
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone').unique(),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  notes: text('notes'),

  // Credit Management
  creditLimit: real('credit_limit').notNull().default(0),
  currentCredit: real('current_credit').notNull().default(0),

  // Loyalty
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  memberLevel: text('member_level').default('bronze'), // bronze, silver, gold
  birthday: text('birthday'),

  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// SALES & BILLING
// ============================================
export const bills = sqliteTable('bills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  billNumber: text('bill_number').notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id),
  userId: integer('user_id').notNull().references(() => users.id),

  // Amounts
  subtotal: real('subtotal').notNull(),
  discount: real('discount').notNull().default(0),
  discountType: text('discount_type').default('amount'), // amount or percentage
  tax: real('tax').notNull().default(0),
  total: real('total').notNull(),

  // Payment
  paymentMethod: text('payment_method').notNull(), // cash, card, credit, split
  paidAmount: real('paid_amount').notNull(),
  changeAmount: real('change_amount').notNull().default(0),
  creditAmount: real('credit_amount').default(0),

  // Status
  status: text('status').notNull().default('completed'), // completed, refunded, partial_refund
  isHeld: integer('is_held', { mode: 'boolean' }).default(false),

  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const billItems = sqliteTable('bill_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  billId: integer('bill_id').notNull().references(() => bills.id),
  productId: integer('product_id').notNull().references(() => products.id),
  productName: text('product_name').notNull(), // snapshot
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  discount: real('discount').default(0),
  subtotal: real('subtotal').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// CREDIT PAYMENTS
// ============================================
export const creditPayments = sqliteTable('credit_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  billId: integer('bill_id').references(() => bills.id),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method').notNull(), // cash, card
  notes: text('notes'),
  userId: integer('user_id').references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// SUPPLIERS & PURCHASES
// ============================================
export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  paymentTerms: text('payment_terms'),
  currentDue: real('current_due').notNull().default(0),
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const purchases = sqliteTable('purchases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  purchaseNumber: text('purchase_number').notNull().unique(),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id),
  userId: integer('user_id').notNull().references(() => users.id),
  totalAmount: real('total_amount').notNull(),
  paidAmount: real('paid_amount').notNull().default(0),
  dueAmount: real('due_amount').notNull().default(0),
  status: text('status').notNull().default('pending'), // pending, received, completed
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const purchaseItems = sqliteTable('purchase_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  purchaseId: integer('purchase_id').notNull().references(() => purchases.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: real('quantity').notNull(),
  costPrice: real('cost_price').notNull(),
  subtotal: real('subtotal').notNull(),
  batchNumber: text('batch_number'),
  expiryDate: text('expiry_date'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// EXPENSES
// ============================================
export const expenseCategories = sqliteTable('expense_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  nameSi: text('name_si'),
  description: text('description'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').references(() => expenseCategories.id),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  paymentMethod: text('payment_method').notNull(),
  userId: integer('user_id').references(() => users.id),
  receiptNumber: text('receipt_number'),
  date: text('date').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// PROMOTIONS
// ============================================
export const promotions = sqliteTable('promotions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  nameSi: text('name_si'),
  type: text('type').notNull(), // bogo, percentage, amount, category
  discountValue: real('discount_value').notNull(),

  // Conditions
  minPurchaseAmount: real('min_purchase_amount'),
  applicableProductIds: text('applicable_product_ids'), // JSON array
  applicableCategoryIds: text('applicable_category_ids'), // JSON array

  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// SETTINGS
// ============================================
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// ACTIVITY LOGS
// ============================================
export const activityLogs = sqliteTable('activity_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  module: text('module').notNull(),
  details: text('details'), // JSON
  ipAddress: text('ip_address'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
