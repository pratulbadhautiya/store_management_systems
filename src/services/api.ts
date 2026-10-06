import {
  AuthSession,
  Business,
  User,
  Category,
  Product,
  InventoryMovement,
  Sale,
  PurchaseOrder,
  Supplier,
  SupplierPayment,
  Customer,
  CustomerPayment,
  Expense,
  Notification,
  AuditLog,
  AiChatMessage
} from '../types/index.ts';

const TOKEN_KEY = 'myshoply_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<AuthSession & { permissions: string[] }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    shopName: string;
    ownerName: string;
    email: string;
    phone?: string;
    address?: string;
    password: string;
    gstin?: string;
    upiId?: string;
  }) =>
    request<AuthSession & { permissions: string[] }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    request<{ user: User; business: Business; permissions: string[] }>('/auth/me'),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  switchDemoTenant: (tenantKey: 'sharma' | 'green' | 'sharma-cashier' | 'sharma-manager') =>
    request<AuthSession & { permissions: string[] }>('/auth/switch-demo-tenant', {
      method: 'POST',
      body: JSON.stringify({ tenantKey }),
    }),

  // Dashboard
  getDashboard: (timeRange: string = 'today') =>
    request<any>(`/dashboard?timeRange=${timeRange}`),

  // Products
  getProducts: () => request<Product[]>('/products'),
  createProduct: (data: Partial<Product>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),
  bulkImportProducts: (items: any[]) =>
    request<{ success: boolean; count: number }>('/products/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  // Categories
  getCategories: () => request<(Category & { itemCount: number })[]>('/categories'),
  createCategory: (name: string, description?: string) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify({ name, description }) }),
  updateCategory: (id: string, name: string, description?: string) =>
    request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name, description }) }),
  deleteCategory: (id: string) =>
    request<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' }),

  // Inventory
  getInventoryMovements: (productId?: string) =>
    request<InventoryMovement[]>(`/inventory/movements${productId ? `?productId=${productId}` : ''}`),
  adjustStock: (productId: string, delta: number, type: string, reason: string) =>
    request<{ success: boolean; product: Product }>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ productId, delta, type, reason }),
    }),

  // Sales / POS
  getSales: () => request<Sale[]>('/sales'),
  getSale: (id: string) => request<Sale>(`/sales/${id}`),
  createSale: (payload: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    items: { productId: string; quantity: number; unitPrice: number; discount?: number }[];
    discountAmount?: number;
    taxAmount?: number;
    paymentMethod: string;
    splitDetails?: any;
    notes?: string;
  }) =>
    request<Sale>('/sales', { method: 'POST', body: JSON.stringify(payload) }),

  // Purchases & Suppliers
  getSuppliers: () => request<(Supplier & { productsSuppliedCount: number })[]>('/suppliers'),
  createSupplier: (data: Partial<Supplier>) =>
    request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  paySupplier: (supplierId: string, amount: number, paymentMode: string, notes?: string) =>
    request<{ success: boolean; payment: SupplierPayment }>(`/suppliers/${supplierId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMode, notes }),
    }),

  getPurchases: () => request<PurchaseOrder[]>('/purchases'),
  createPurchase: (payload: any) =>
    request<PurchaseOrder>('/purchases', { method: 'POST', body: JSON.stringify(payload) }),
  receivePurchase: (poId: string) =>
    request<{ success: boolean; po: PurchaseOrder }>(`/purchases/${poId}/receive`, { method: 'POST' }),

  // Customers (Khata)
  getCustomers: () => request<Customer[]>('/customers'),
  createCustomer: (data: Partial<Customer>) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  payCustomer: (customerId: string, amount: number, paymentMode: string, notes?: string) =>
    request<{ success: boolean; payment: CustomerPayment }>(`/customers/${customerId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMode, notes }),
    }),

  // Expenses
  getExpenses: () => request<Expense[]>('/expenses'),
  createExpense: (data: Partial<Expense>) =>
    request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id: string) =>
    request<{ success: boolean }>(`/expenses/${id}`, { method: 'DELETE' }),

  // Employees & RBAC
  getEmployees: () => request<User[]>('/employees'),
  createEmployee: (data: any) =>
    request<User>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: any) =>
    request<User>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request<Notification[]>('/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'POST' }),

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),

  // Settings
  updateShopSettings: (settings: Partial<Business>) =>
    request<Business>('/settings/shop', { method: 'PUT', body: JSON.stringify(settings) }),

  // AI Copilot
  getAiMessages: () => request<AiChatMessage[]>('/ai/messages'),
  sendAiMessage: (message: string) =>
    request<AiChatMessage>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  executeAiAction: (payload: { messageId: string; actionId: string; actionType: string; payload: any }) =>
    request<{ success: boolean; message: string; po?: any }>('/ai/action/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  clearAiChat: () => request<{ success: boolean }>('/ai/clear', { method: 'POST' }),
};
