// Role-based permissions configuration
export const PERMISSIONS = {
  // Discount permissions
  APPLY_DISCOUNT: ['admin', 'manager'],
  APPLY_LARGE_DISCOUNT: ['admin'], // discounts > 20%

  // Product permissions
  DELETE_PRODUCT: ['admin', 'manager'],
  EDIT_PRODUCT: ['admin', 'manager'],
  ADJUST_STOCK: ['admin', 'manager'],
  VIEW_COST_PRICE: ['admin', 'manager'],

  // Report permissions
  VIEW_REPORTS: ['admin', 'manager'],
  EXPORT_REPORTS: ['admin', 'manager'],
  VIEW_PROFIT: ['admin', 'manager'],

  // Settings permissions
  CHANGE_SETTINGS: ['admin'],
  MANAGE_USERS: ['admin'],
  VIEW_ACTIVITY_LOG: ['admin', 'manager'],

  // Transaction permissions
  DELETE_TRANSACTION: ['admin'],
  VOID_BILL: ['admin', 'manager'],

  // Customer permissions
  DELETE_CUSTOMER: ['admin', 'manager'],
  VIEW_CREDIT: ['admin', 'manager', 'cashier'],

  // General
  ACCESS_POS: ['admin', 'manager', 'cashier'],
};

export function hasPermission(userRole: string, permission: keyof typeof PERMISSIONS): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}

export function checkMultiplePermissions(userRole: string, permissions: (keyof typeof PERMISSIONS)[]): boolean {
  return permissions.every(perm => hasPermission(userRole, perm));
}
