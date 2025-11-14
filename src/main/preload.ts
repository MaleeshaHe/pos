import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Products
  getProducts: () => ipcRenderer.invoke('products:getAll'),
  getProduct: (id: number) => ipcRenderer.invoke('products:getById', id),
  searchProducts: (query: string) => ipcRenderer.invoke('products:search', query),
  createProduct: (data: any) => ipcRenderer.invoke('products:create', data),
  updateProduct: (id: number, data: any) => ipcRenderer.invoke('products:update', id, data),
  deleteProduct: (id: number) => ipcRenderer.invoke('products:delete', id),
  getLowStockProducts: () => ipcRenderer.invoke('products:getLowStock'),

  // Categories
  getCategories: () => ipcRenderer.invoke('categories:getAll'),
  createCategory: (data: any) => ipcRenderer.invoke('categories:create', data),

  // Brands
  getBrands: () => ipcRenderer.invoke('brands:getAll'),
  createBrand: (data: any) => ipcRenderer.invoke('brands:create', data),

  // Customers
  getCustomers: () => ipcRenderer.invoke('customers:getAll'),
  getCustomer: (id: number) => ipcRenderer.invoke('customers:getById', id),
  searchCustomers: (query: string) => ipcRenderer.invoke('customers:search', query),
  createCustomer: (data: any) => ipcRenderer.invoke('customers:create', data),
  updateCustomer: (id: number, data: any) => ipcRenderer.invoke('customers:update', id, data),
  getCustomerCredit: (id: number) => ipcRenderer.invoke('customers:getCredit', id),

  // Bills
  createBill: (data: any) => ipcRenderer.invoke('bills:create', data),
  getBills: (filters?: any) => ipcRenderer.invoke('bills:getAll', filters),
  getBill: (id: number) => ipcRenderer.invoke('bills:getById', id),
  getBillById: (id: number) => ipcRenderer.invoke('bills:getById', id),
  getBillItems: (billId: number) => ipcRenderer.invoke('bills:getItems', billId),
  getBillByNumber: (billNumber: string) => ipcRenderer.invoke('bills:getByNumber', billNumber),
  getHeldBills: () => ipcRenderer.invoke('bills:getHeld'),
  holdBill: (data: any) => ipcRenderer.invoke('bills:hold', data),
  resumeBill: (id: number) => ipcRenderer.invoke('bills:resume', id),

  // Credit Payments
  createCreditPayment: (data: any) => ipcRenderer.invoke('creditPayments:create', data),
  getCreditPayments: (customerId: number) => ipcRenderer.invoke('creditPayments:getByCustomer', customerId),

  // Users
  login: (username: string, password: string) => ipcRenderer.invoke('users:login', username, password),
  getCurrentUser: () => ipcRenderer.invoke('users:getCurrent'),
  getUsers: () => ipcRenderer.invoke('users:getAll'),
  createUser: (data: any) => ipcRenderer.invoke('users:create', data),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  updateSetting: (key: string, value: string) => ipcRenderer.invoke('settings:update', key, value),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),
  getSalesChart: (period: string) => ipcRenderer.invoke('dashboard:getSalesChart', period),

  // Reports
  generateSalesReport: (filters: any) => ipcRenderer.invoke('reports:sales', filters),
  generateInventoryReport: () => ipcRenderer.invoke('reports:inventory'),
  generateCreditReport: () => ipcRenderer.invoke('reports:credit'),

  // Suppliers
  getSuppliers: () => ipcRenderer.invoke('suppliers:getAll'),
  createSupplier: (data: any) => ipcRenderer.invoke('suppliers:create', data),

  // Purchases
  getPurchases: () => ipcRenderer.invoke('purchases:getAll'),
  getPurchase: (id: number) => ipcRenderer.invoke('purchases:getById', id),
  createPurchase: (data: any) => ipcRenderer.invoke('purchases:create', data),
  updatePurchase: (id: number, data: any) => ipcRenderer.invoke('purchases:update', id, data),
  getPurchaseItems: (purchaseId: number) => ipcRenderer.invoke('purchases:getItems', purchaseId),

  // Stock Logs
  createStockLog: (data: any) => ipcRenderer.invoke('stockLogs:create', data),

  // Expenses
  getExpenses: (filters?: any) => ipcRenderer.invoke('expenses:getAll', filters),
  createExpense: (data: any) => ipcRenderer.invoke('expenses:create', data),
  getExpenseCategories: () => ipcRenderer.invoke('expenseCategories:getAll'),

  // Activity Logs
  logActivity: (action: string, module: string, details?: any) =>
    ipcRenderer.invoke('activityLogs:create', action, module, details),
});

export type API = typeof api;

declare global {
  interface Window {
    api: API;
  }
}
