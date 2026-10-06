export type UserRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'INVENTORY_MANAGER' | 'ACCOUNTANT';

export interface Business {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  gstin?: string;
  currency: string;
  upiId?: string;
  createdAt: string;
  onboardingCompleted: boolean;
}

export interface User {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: User;
  business: Business;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  itemCount?: number;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  unit: string; // 'pcs' | 'kg' | 'packet' | 'liter' | 'g'
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  taxRate: number; // percentage (e.g. 5, 12, 18)
  discount: number; // percentage or fixed
  currentStock: number;
  minStock: number;
  maxStock: number;
  supplierId?: string;
  supplierName?: string;
  imageUrl?: string;
  expiryDate?: string;
  batchNumber?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';

export interface InventoryMovement {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number; // can be negative or positive
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId?: string; // invoice # or PO #
  createdBy: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number; // for COGS calculations
  mrp: number;
  discount: number;
  taxRate: number;
  total: number;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'SPLIT' | 'CREDIT';

export interface Sale {
  id: string;
  businessId: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  profitAmount: number; // calculated revenue - COGS
  paymentMethod: PaymentMethod;
  splitDetails?: {
    cash?: number;
    upi?: number;
    card?: number;
  };
  cashierId: string;
  cashierName: string;
  notes?: string;
  status: 'COMPLETED' | 'REFUNDED';
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  businessId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'DRAFT' | 'ORDERED' | 'PARTIAL' | 'RECEIVED';
  notes?: string;
  expectedDeliveryDate?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  address: string;
  gstin?: string;
  outstandingBalance: number;
  productsSuppliedCount?: number;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  businessId: string;
  supplierId: string;
  amount: number;
  paymentMode: string;
  reference?: string;
  date: string;
  notes?: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  address?: string;
  creditLimit: number;
  outstandingBalance: number; // Khata balance owed by customer
  totalSpent: number;
  ordersCount: number;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  businessId: string;
  customerId: string;
  amount: number;
  paymentMode: string;
  date: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'RENT'
  | 'ELECTRICITY'
  | 'SALARY'
  | 'TRANSPORT'
  | 'PACKAGING'
  | 'MAINTENANCE'
  | 'INTERNET'
  | 'MARKETING'
  | 'OTHER';

export interface Expense {
  id: string;
  businessId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMode: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  businessId: string;
  title: string;
  message: string;
  type: 'LOW_STOCK' | 'EXPIRY' | 'PAYMENT_DUE' | 'SALES_MILESTONE' | 'SYSTEM';
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  category: 'SALES' | 'INVENTORY' | 'PROFIT' | 'EXPENSE' | 'CUSTOMER';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  metric?: string;
  actionLabel?: string;
  actionTab?: string;
}

export interface AiProposedAction {
  id: string;
  type: 'CREATE_PURCHASE_ORDER' | 'STOCK_ADJUSTMENT' | 'SEND_PAYMENT_REMINDER';
  summary: string;
  payload: any;
  status: 'PENDING' | 'EXECUTED' | 'REJECTED';
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolsUsed?: string[];
  proposedAction?: AiProposedAction;
  createdAt: string;
}
