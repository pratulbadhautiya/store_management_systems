import {
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
  AiChatMessage,
  AiProposedAction
} from '../types/index.ts';

// In-Memory Multi-Tenant Database Store with strict tenant partitioning
class DatabaseStore {
  businesses: Map<string, Business> = new Map();
  users: Map<string, User> = new Map();
  // Passwords mapped by email for simple auth
  userCredentials: Map<string, { passwordHash: string; userId: string }> = new Map();
  
  categories: Map<string, Category> = new Map();
  products: Map<string, Product> = new Map();
  inventoryMovements: Map<string, InventoryMovement> = new Map();
  sales: Map<string, Sale> = new Map();
  purchaseOrders: Map<string, PurchaseOrder> = new Map();
  suppliers: Map<string, Supplier> = new Map();
  supplierPayments: Map<string, SupplierPayment> = new Map();
  customers: Map<string, Customer> = new Map();
  customerPayments: Map<string, CustomerPayment> = new Map();
  expenses: Map<string, Expense> = new Map();
  notifications: Map<string, Notification> = new Map();
  auditLogs: Map<string, AuditLog> = new Map();
  aiMessages: Map<string, AiChatMessage & { businessId: string }> = new Map();

  constructor() {
    this.seedInitialData();
  }

  // --- SEED DATA ---
  private seedInitialData() {
    // 1. Tenant: Sharma General Store
    const t1Id = 'tenant-sharma-101';
    const b1: Business = {
      id: t1Id,
      name: 'Sharma General Store',
      ownerName: 'Rahul Sharma',
      phone: '+91 98101 23456',
      email: 'rahul@sharmastore.in',
      address: 'Shop No. 14, Main Market, Sector 15, New Delhi',
      gstin: '07AAAAA0000A1Z5',
      currency: '₹',
      upiId: 'sharmastore@okhdfcbank',
      createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
      onboardingCompleted: true,
    };
    this.businesses.set(t1Id, b1);

    // Users for Tenant 1
    const u1Owner: User = {
      id: 'usr-sharma-owner',
      businessId: t1Id,
      name: 'Rahul Sharma',
      email: 'rahul@sharmastore.in',
      phone: '+91 98101 23456',
      role: 'OWNER',
      active: true,
      createdAt: new Date().toISOString(),
    };
    const u1Cashier: User = {
      id: 'usr-sharma-cashier',
      businessId: t1Id,
      name: 'Vikram Singh',
      email: 'vikram@sharmastore.in',
      phone: '+91 98101 88776',
      role: 'CASHIER',
      active: true,
      createdAt: new Date().toISOString(),
    };
    const u1Manager: User = {
      id: 'usr-sharma-manager',
      businessId: t1Id,
      name: 'Anita Sharma',
      email: 'anita@sharmastore.in',
      phone: '+91 98101 33221',
      role: 'MANAGER',
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set(u1Owner.id, u1Owner);
    this.users.set(u1Cashier.id, u1Cashier);
    this.users.set(u1Manager.id, u1Manager);

    this.userCredentials.set(u1Owner.email.toLowerCase(), { passwordHash: 'password123', userId: u1Owner.id });
    this.userCredentials.set(u1Cashier.email.toLowerCase(), { passwordHash: 'password123', userId: u1Cashier.id });
    this.userCredentials.set(u1Manager.email.toLowerCase(), { passwordHash: 'password123', userId: u1Manager.id });

    // Categories for Tenant 1
    const catStaples: Category = { id: 'cat-1-staples', businessId: t1Id, name: 'Atta, Rice & Grains', description: 'Daily flour, rice, pulses' };
    const catOils: Category = { id: 'cat-1-oils', businessId: t1Id, name: 'Cooking Oils & Ghee', description: 'Edible cooking oils and pure desi ghee' };
    const catSnacks: Category = { id: 'cat-1-snacks', businessId: t1Id, name: 'Snacks & Biscuits', description: 'Packaged chips, namkeen and cookies' };
    const catDairy: Category = { id: 'cat-1-dairy', businessId: t1Id, name: 'Dairy & Bakery', description: 'Milk, bread, butter, cheese' };
    const catHousehold: Category = { id: 'cat-1-household', businessId: t1Id, name: 'Cleaning & Household', description: 'Detergents, soaps, sanitizers' };
    const catSpices: Category = { id: 'cat-1-spices', businessId: t1Id, name: 'Spices & Masalas', description: 'Packaged whole and powdered spices' };
    [catStaples, catOils, catSnacks, catDairy, catHousehold, catSpices].forEach(c => this.categories.set(c.id, c));

    // Suppliers for Tenant 1
    const supDelhiWholesale: Supplier = {
      id: 'sup-1-delhi',
      businessId: t1Id,
      name: 'Delhi FMCG Distributors',
      company: 'Delhi FMCG Pvt Ltd',
      phone: '+91 98765 43210',
      email: 'orders@delhifmcg.com',
      address: 'Plot 45, Okhla Industrial Area Phase III, Delhi',
      gstin: '07AAACD1234M1Z2',
      outstandingBalance: 14500,
      createdAt: new Date().toISOString(),
    };
    const supGrainMandi: Supplier = {
      id: 'sup-1-grain',
      businessId: t1Id,
      name: 'Narela Grain Traders',
      company: 'Narela Mandi Association',
      phone: '+91 98111 55443',
      address: 'Shop 12, Anaj Mandi, Narela, Delhi',
      gstin: '07BBBCD5678N1Z8',
      outstandingBalance: 28000,
      createdAt: new Date().toISOString(),
    };
    [supDelhiWholesale, supGrainMandi].forEach(s => this.suppliers.set(s.id, s));

    // Customers for Tenant 1 (Khata)
    const custRamesh: Customer = {
      id: 'cust-1-ramesh',
      businessId: t1Id,
      name: 'Ramesh Kumar (G-12)',
      phone: '+91 98991 12345',
      address: 'House No 12, Block G, Sector 15',
      creditLimit: 10000,
      outstandingBalance: 3450, // Udhar
      totalSpent: 42100,
      ordersCount: 28,
      createdAt: new Date().toISOString(),
    };
    const custSunita: Customer = {
      id: 'cust-1-sunita',
      businessId: t1Id,
      name: 'Sunita Verma (B-404)',
      phone: '+91 98711 98765',
      address: 'Flat 404, Pearl Heights',
      creditLimit: 5000,
      outstandingBalance: 1200,
      totalSpent: 18450,
      ordersCount: 14,
      createdAt: new Date().toISOString(),
    };
    const custMohit: Customer = {
      id: 'cust-1-mohit',
      businessId: t1Id,
      name: 'Mohit Chawla',
      phone: '+91 98188 54321',
      address: 'Shop 3, Market Lane',
      creditLimit: 15000,
      outstandingBalance: 0,
      totalSpent: 65200,
      ordersCount: 42,
      createdAt: new Date().toISOString(),
    };
    [custRamesh, custSunita, custMohit].forEach(c => this.customers.set(c.id, c));

    // Products for Tenant 1
    const p1: Product = {
      id: 'prod-1-atta',
      businessId: t1Id,
      name: 'Aashirvaad Shudh Chakki Atta 10kg',
      sku: 'SKU-ATT-10K',
      barcode: '8901030010012',
      categoryId: catStaples.id,
      categoryName: catStaples.name,
      brand: 'Aashirvaad',
      unit: 'packet',
      purchasePrice: 380,
      sellingPrice: 435,
      mrp: 460,
      taxRate: 0,
      discount: 0,
      currentStock: 18,
      minStock: 25, // LOW STOCK!
      maxStock: 100,
      supplierId: supGrainMandi.id,
      supplierName: supGrainMandi.name,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const p2: Product = {
      id: 'prod-1-rice',
      businessId: t1Id,
      name: 'Daawat Rozana Basmati Rice 5kg',
      sku: 'SKU-RICE-05K',
      barcode: '8901537001423',
      categoryId: catStaples.id,
      categoryName: catStaples.name,
      brand: 'Daawat',
      unit: 'packet',
      purchasePrice: 340,
      sellingPrice: 395,
      mrp: 420,
      taxRate: 0,
      discount: 5,
      currentStock: 32,
      minStock: 15,
      maxStock: 80,
      supplierId: supGrainMandi.id,
      supplierName: supGrainMandi.name,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const p3: Product = {
      id: 'prod-1-salt',
      businessId: t1Id,
      name: 'Tata Salt Vacuum Evaporated 1kg',
      sku: 'SKU-SALT-01K',
      barcode: '8901030383724',
      categoryId: catStaples.id,
      categoryName: catStaples.name,
      brand: 'Tata',
      unit: 'packet',
      purchasePrice: 22,
      sellingPrice: 28,
      mrp: 30,
      taxRate: 0,
      discount: 0,
      currentStock: 9, // LOW STOCK!
      minStock: 40,
      maxStock: 150,
      supplierId: supDelhiWholesale.id,
      supplierName: supDelhiWholesale.name,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const p4: Product = {
      id: 'prod-1-oil',
      businessId: t1Id,
      name: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch',
      sku: 'SKU-OIL-01L',
      barcode: '8906007280145',
      categoryId: catOils.id,
      categoryName: catOils.name,
      brand: 'Fortune',
      unit: 'packet',
      purchasePrice: 128,
      sellingPrice: 148,
      mrp: 160,
      taxRate: 5,
      discount: 0,
      currentStock: 45,
      minStock: 20,
      maxStock: 100,
      supplierId: supDelhiWholesale.id,
      supplierName: supDelhiWholesale.name,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const p5: Product = {
      id: 'prod-1-butter',
      businessId: t1Id,
      name: 'Amul Butter Pasteurised 500g',
      sku: 'SKU-BTR-500G',
      barcode: '8901262010051',
      categoryId: catDairy.id,
      categoryName: catDairy.name,
      brand: 'Amul',
      unit: 'packet',
      purchasePrice: 245,
      sellingPrice: 275,
      mrp: 285,
      taxRate: 5,
      discount: 0,
      currentStock: 14,
      minStock: 12,
      maxStock: 50,
      supplierId: supDelhiWholesale.id,
      supplierName: supDelhiWholesale.name,
      expiryDate: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const p6: Product = {
      id: 'prod-1-maggi',
      businessId: t1Id,
      name: 'Maggi 2-Minute Masala Noodles 280g (Pack of 4)',
      sku: 'SKU-MAG-04P',
      barcode: '8901058852441',
      categoryId: catSnacks.id,
      categoryName: catSnacks.name,
      brand: 'Nestle',
      unit: 'packet',
      purchasePrice: 48,
      sellingPrice: 56,
      mrp: 60,
      taxRate: 12,
      discount: 0,
      currentStock: 60,
      minStock: 25,
      maxStock: 120,
      supplierId: supDelhiWholesale.id,
      supplierName: supDelhiWholesale.name,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const p7: Product = {
      id: 'prod-1-surf',
      businessId: t1Id,
      name: 'Surf Excel Quick Wash Detergent Powder 2kg',
      sku: 'SKU-SURF-02K',
      barcode: '8901030704419',
      categoryId: catHousehold.id,
      categoryName: catHousehold.name,
      brand: 'Surf Excel',
      unit: 'packet',
      purchasePrice: 380,
      sellingPrice: 430,
      mrp: 460,
      taxRate: 18,
      discount: 10,
      currentStock: 22,
      minStock: 15,
      maxStock: 60,
      supplierId: supDelhiWholesale.id,
      supplierName: supDelhiWholesale.name,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const p8: Product = {
      id: 'prod-1-dettol',
      businessId: t1Id,
      name: 'Dettol Original Bathing Soap 125g (Pack of 4)',
      sku: 'SKU-DET-04P',
      barcode: '8901396001201',
      categoryId: catHousehold.id,
      categoryName: catHousehold.name,
      brand: 'Dettol',
      unit: 'packet',
      purchasePrice: 175,
      sellingPrice: 205,
      mrp: 220,
      taxRate: 18,
      discount: 0,
      currentStock: 4, // CRITICAL LOW STOCK
      minStock: 20,
      maxStock: 80,
      supplierId: supDelhiWholesale.id,
      supplierName: supDelhiWholesale.name,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const p9: Product = {
      id: 'prod-1-slow-jam',
      businessId: t1Id,
      name: 'Organic Wild Berry Exotic Jam 350g',
      sku: 'SKU-JAM-350G',
      barcode: '8904000100999',
      categoryId: catSnacks.id,
      categoryName: catSnacks.name,
      brand: 'Highland Orchard',
      unit: 'bottle',
      purchasePrice: 220,
      sellingPrice: 290,
      mrp: 320,
      taxRate: 12,
      discount: 0,
      currentStock: 24, // Slow moving / Dead stock!
      minStock: 5,
      maxStock: 30,
      supplierId: supDelhiWholesale.id,
      supplierName: supDelhiWholesale.name,
      expiryDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    [p1, p2, p3, p4, p5, p6, p7, p8, p9].forEach(p => this.products.set(p.id, p));

    // Seed recent sales for Tenant 1 (covering today and past few days)
    const now = new Date();
    const todayStr = now.toISOString();
    const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

    const sale1: Sale = {
      id: 'sale-1-001',
      businessId: t1Id,
      invoiceNumber: 'INV-2026-0891',
      customerId: custRamesh.id,
      customerName: custRamesh.name,
      customerPhone: custRamesh.phone,
      items: [
        {
          productId: p1.id,
          productName: p1.name,
          sku: p1.sku,
          unit: p1.unit,
          quantity: 1,
          unitPrice: 435,
          purchasePrice: 380,
          mrp: 460,
          discount: 0,
          taxRate: 0,
          total: 435,
        },
        {
          productId: p4.id,
          productName: p4.name,
          sku: p4.sku,
          unit: p4.unit,
          quantity: 2,
          unitPrice: 148,
          purchasePrice: 128,
          mrp: 160,
          discount: 0,
          taxRate: 5,
          total: 296,
        },
      ],
      subtotal: 731,
      discountAmount: 0,
      taxAmount: 14.8,
      totalAmount: 745.8,
      profitAmount: (435 - 380) + (296 - 256), // ₹95 profit
      paymentMethod: 'UPI',
      cashierId: u1Cashier.id,
      cashierName: u1Cashier.name,
      status: 'COMPLETED',
      createdAt: todayStr,
    };

    const sale2: Sale = {
      id: 'sale-1-002',
      businessId: t1Id,
      invoiceNumber: 'INV-2026-0892',
      customerName: 'Walk-in Customer',
      items: [
        {
          productId: p6.id,
          productName: p6.name,
          sku: p6.sku,
          unit: p6.unit,
          quantity: 3,
          unitPrice: 56,
          purchasePrice: 48,
          mrp: 60,
          discount: 0,
          taxRate: 12,
          total: 168,
        },
        {
          productId: p5.id,
          productName: p5.name,
          sku: p5.sku,
          unit: p5.unit,
          quantity: 1,
          unitPrice: 275,
          purchasePrice: 245,
          mrp: 285,
          discount: 0,
          taxRate: 5,
          total: 275,
        },
      ],
      subtotal: 443,
      discountAmount: 0,
      taxAmount: 33.9,
      totalAmount: 476.9,
      profitAmount: (168 - 144) + (275 - 245), // ₹54 profit
      paymentMethod: 'CASH',
      cashierId: u1Cashier.id,
      cashierName: u1Cashier.name,
      status: 'COMPLETED',
      createdAt: todayStr,
    };

    const sale3: Sale = {
      id: 'sale-1-003',
      businessId: t1Id,
      invoiceNumber: 'INV-2026-0890',
      customerId: custSunita.id,
      customerName: custSunita.name,
      items: [
        {
          productId: p7.id,
          productName: p7.name,
          sku: p7.sku,
          unit: p7.unit,
          quantity: 1,
          unitPrice: 420,
          purchasePrice: 380,
          mrp: 460,
          discount: 10,
          taxRate: 18,
          total: 420,
        },
      ],
      subtotal: 420,
      discountAmount: 10,
      taxAmount: 75.6,
      totalAmount: 495.6,
      profitAmount: 40,
      paymentMethod: 'CARD',
      cashierId: u1Owner.id,
      cashierName: u1Owner.name,
      status: 'COMPLETED',
      createdAt: yesterdayStr,
    };

    [sale1, sale2, sale3].forEach(s => this.sales.set(s.id, s));

    // Inventory Movements for Tenant 1
    const mov1: InventoryMovement = {
      id: 'mov-1-01',
      businessId: t1Id,
      productId: p1.id,
      productName: p1.name,
      type: 'PURCHASE',
      quantity: 20,
      previousStock: 0,
      newStock: 20,
      reason: 'Initial stock intake from Narela Grain Traders',
      createdBy: 'Rahul Sharma',
      createdAt: twoDaysAgo,
    };
    const mov2: InventoryMovement = {
      id: 'mov-1-02',
      businessId: t1Id,
      productId: p1.id,
      productName: p1.name,
      type: 'SALE',
      quantity: -1,
      previousStock: 20,
      newStock: 19,
      reason: 'POS Sale INV-2026-0891',
      referenceId: 'INV-2026-0891',
      createdBy: 'Vikram Singh',
      createdAt: todayStr,
    };
    [mov1, mov2].forEach(m => this.inventoryMovements.set(m.id, m));

    // Expenses for Tenant 1
    const exp1: Expense = {
      id: 'exp-1-01',
      businessId: t1Id,
      title: 'Shop Rent - Sector 15 Commercial Block',
      category: 'RENT',
      amount: 22000,
      paymentMode: 'Bank Transfer',
      date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
      notes: 'Paid to Landlord Mr. Gupta',
      createdAt: new Date().toISOString(),
    };
    const exp2: Expense = {
      id: 'exp-1-02',
      businessId: t1Id,
      title: 'Electricity Bill - BSES Rajdhani',
      category: 'ELECTRICITY',
      amount: 4850,
      paymentMode: 'UPI',
      date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    const exp3: Expense = {
      id: 'exp-1-03',
      businessId: t1Id,
      title: 'Cashier Staff Salary - Vikram Singh',
      category: 'SALARY',
      amount: 14000,
      paymentMode: 'Cash',
      date: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    [exp1, exp2, exp3].forEach(e => this.expenses.set(e.id, e));

    // Notifications for Tenant 1
    const notif1: Notification = {
      id: 'notif-1-01',
      businessId: t1Id,
      title: 'Low Stock Alert: 3 Products',
      message: 'Tata Salt, Aashirvaad Atta, and Dettol Soap are running critically below reorder thresholds.',
      type: 'LOW_STOCK',
      read: false,
      actionUrl: '/inventory',
      actionLabel: 'Restock Products',
      createdAt: new Date().toISOString(),
    };
    const notif2: Notification = {
      id: 'notif-1-02',
      businessId: t1Id,
      title: 'Khata Credit Due',
      message: 'Ramesh Kumar (G-12) has ₹3,450 outstanding credit due for 14 days.',
      type: 'PAYMENT_DUE',
      read: false,
      actionUrl: '/customers',
      actionLabel: 'View Khata',
      createdAt: new Date().toISOString(),
    };
    [notif1, notif2].forEach(n => this.notifications.set(n.id, n));

    // Audit logs for Tenant 1
    const audit1: AuditLog = {
      id: 'audit-1-01',
      businessId: t1Id,
      userId: u1Owner.id,
      userName: u1Owner.name,
      action: 'STOCK_INTAKE',
      entity: 'Product',
      entityId: p1.id,
      details: 'Added 20 units of Aashirvaad Shudh Chakki Atta',
      createdAt: twoDaysAgo,
    };
    this.auditLogs.set(audit1.id, audit1);

    // 2. Tenant: Green Basket Supermarket (Completely independent shop)
    const t2Id = 'tenant-green-202';
    const b2: Business = {
      id: t2Id,
      name: 'Green Basket Supermarket',
      ownerName: 'Priya Patel',
      phone: '+91 99200 45678',
      email: 'priya@greenbasket.co',
      address: 'Shop 4, Bandra West, Mumbai',
      gstin: '27AABCG9876P1Z3',
      currency: '₹',
      upiId: 'greenbasket@icici',
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      onboardingCompleted: true,
    };
    this.businesses.set(t2Id, b2);

    const u2Owner: User = {
      id: 'usr-green-owner',
      businessId: t2Id,
      name: 'Priya Patel',
      email: 'priya@greenbasket.co',
      phone: '+91 99200 45678',
      role: 'OWNER',
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set(u2Owner.id, u2Owner);
    this.userCredentials.set(u2Owner.email.toLowerCase(), { passwordHash: 'password123', userId: u2Owner.id });

    const catOrganic: Category = { id: 'cat-2-organic', businessId: t2Id, name: 'Organic & Superfoods', description: 'Certified organic products' };
    const catBeverages: Category = { id: 'cat-2-beverages', businessId: t2Id, name: 'Artisanal Beverages', description: 'Cold brew, kombucha, nut milks' };
    [catOrganic, catBeverages].forEach(c => this.categories.set(c.id, c));

    const pGreen1: Product = {
      id: 'prod-2-quinoa',
      businessId: t2Id,
      name: 'True Elements Royal White Quinoa 500g',
      sku: 'SKU-QUI-500G',
      barcode: '8906076110023',
      categoryId: catOrganic.id,
      categoryName: catOrganic.name,
      brand: 'True Elements',
      unit: 'packet',
      purchasePrice: 190,
      sellingPrice: 280,
      mrp: 320,
      taxRate: 5,
      discount: 0,
      currentStock: 40,
      minStock: 10,
      maxStock: 80,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.set(pGreen1.id, pGreen1);
  }

  // --- TENANT HELPER METHODS ---

  getBusiness(businessId: string): Business | undefined {
    return this.businesses.get(businessId);
  }

  createBusiness(business: Business): Business {
    this.businesses.set(business.id, business);
    return business;
  }

  updateBusiness(businessId: string, updates: Partial<Business>): Business | undefined {
    const existing = this.businesses.get(businessId);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.businesses.set(businessId, updated);
    return updated;
  }

  // --- USERS & AUTH ---

  getUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getUserByEmail(email: string): User | undefined {
    const cred = this.userCredentials.get(email.toLowerCase());
    if (!cred) return undefined;
    return this.users.get(cred.userId);
  }

  verifyPassword(email: string, passwordAttempt: string): boolean {
    const cred = this.userCredentials.get(email.toLowerCase());
    if (!cred) return false;
    return cred.passwordHash === passwordAttempt;
  }

  createUser(user: User, passwordRaw: string): User {
    this.users.set(user.id, user);
    this.userCredentials.set(user.email.toLowerCase(), { passwordHash: passwordRaw, userId: user.id });
    return user;
  }

  getUsersByBusiness(businessId: string): User[] {
    return Array.from(this.users.values()).filter(u => u.businessId === businessId);
  }

  updateUser(businessId: string, userId: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(userId);
    if (!user || user.businessId !== businessId) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(userId, updated);
    return updated;
  }

  // --- CATEGORIES ---

  getCategories(businessId: string): (Category & { itemCount: number })[] {
    const cats = Array.from(this.categories.values()).filter(c => c.businessId === businessId);
    return cats.map(cat => {
      const count = Array.from(this.products.values()).filter(p => p.businessId === businessId && p.categoryId === cat.id).length;
      return { ...cat, itemCount: count };
    });
  }

  createCategory(businessId: string, name: string, description?: string): Category {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const cat: Category = { id, businessId, name, description };
    this.categories.set(id, cat);
    return cat;
  }

  updateCategory(businessId: string, id: string, name: string, description?: string): Category | undefined {
    const cat = this.categories.get(id);
    if (!cat || cat.businessId !== businessId) return undefined;
    cat.name = name;
    if (description !== undefined) cat.description = description;
    return cat;
  }

  deleteCategory(businessId: string, id: string): boolean {
    const cat = this.categories.get(id);
    if (!cat || cat.businessId !== businessId) return false;
    this.categories.delete(id);
    return true;
  }

  // --- PRODUCTS ---

  getProducts(businessId: string): Product[] {
    return Array.from(this.products.values()).filter(p => p.businessId === businessId && p.status !== 'ARCHIVED');
  }

  getProductById(businessId: string, id: string): Product | undefined {
    const p = this.products.get(id);
    if (!p || p.businessId !== businessId) return undefined;
    return p;
  }

  createProduct(businessId: string, data: Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>, actorName: string): Product {
    const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const product: Product = {
      ...data,
      id,
      businessId,
      createdAt: now,
      updatedAt: now,
    };
    this.products.set(id, product);

    // Initial stock movement if opening stock > 0
    if (product.currentStock > 0) {
      this.recordInventoryMovement({
        businessId,
        productId: id,
        productName: product.name,
        type: 'ADJUSTMENT',
        quantity: product.currentStock,
        previousStock: 0,
        newStock: product.currentStock,
        reason: 'Initial opening stock upon product creation',
        createdBy: actorName,
      });
    }

    this.recordAuditLog(businessId, 'CREATE_PRODUCT', 'Product', id, `Created product "${product.name}" with stock ${product.currentStock}`, actorName);
    return product;
  }

  updateProduct(businessId: string, id: string, updates: Partial<Product>, actorName: string): Product | undefined {
    const product = this.products.get(id);
    if (!product || product.businessId !== businessId) return undefined;

    // Check if stock changed directly in edit form
    if (updates.currentStock !== undefined && updates.currentStock !== product.currentStock) {
      const delta = updates.currentStock - product.currentStock;
      this.recordInventoryMovement({
        businessId,
        productId: id,
        productName: product.name,
        type: 'ADJUSTMENT',
        quantity: delta,
        previousStock: product.currentStock,
        newStock: updates.currentStock,
        reason: 'Stock updated in product editor',
        createdBy: actorName,
      });
    }

    const updated = {
      ...product,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.products.set(id, updated);
    this.recordAuditLog(businessId, 'UPDATE_PRODUCT', 'Product', id, `Updated details for "${product.name}"`, actorName);
    return updated;
  }

  deleteProduct(businessId: string, id: string, actorName: string): boolean {
    const product = this.products.get(id);
    if (!product || product.businessId !== businessId) return false;
    product.status = 'ARCHIVED';
    this.recordAuditLog(businessId, 'DELETE_PRODUCT', 'Product', id, `Archived product "${product.name}"`, actorName);
    return true;
  }

  // --- INVENTORY MOVEMENTS & ADJUSTMENTS ---

  getInventoryMovements(businessId: string, productId?: string): InventoryMovement[] {
    let list = Array.from(this.inventoryMovements.values()).filter(m => m.businessId === businessId);
    if (productId) {
      list = list.filter(m => m.productId === productId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  recordInventoryMovement(data: Omit<InventoryMovement, 'id' | 'createdAt'>): InventoryMovement {
    const id = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const movement: InventoryMovement = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.inventoryMovements.set(id, movement);
    return movement;
  }

  adjustStock(
    businessId: string,
    productId: string,
    adjustmentDelta: number,
    type: 'ADJUSTMENT' | 'DAMAGE' | 'RETURN',
    reason: string,
    actorName: string
  ): Product | undefined {
    const product = this.products.get(productId);
    if (!product || product.businessId !== businessId) return undefined;

    const previousStock = product.currentStock;
    const newStock = Math.max(0, previousStock + adjustmentDelta);
    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();

    this.recordInventoryMovement({
      businessId,
      productId: product.id,
      productName: product.name,
      type,
      quantity: adjustmentDelta,
      previousStock,
      newStock,
      reason,
      createdBy: actorName,
    });

    this.recordAuditLog(
      businessId,
      'STOCK_ADJUSTMENT',
      'Inventory',
      productId,
      `Adjusted ${product.name} stock by ${adjustmentDelta > 0 ? '+' : ''}${adjustmentDelta} (Previous: ${previousStock}, New: ${newStock}). Reason: ${reason}`,
      actorName
    );

    // Auto notification if low stock
    if (newStock <= product.minStock) {
      this.createNotification(
        businessId,
        `Low Stock: ${product.name}`,
        `Current stock is now ${newStock} units (Minimum reorder level: ${product.minStock}).`,
        'LOW_STOCK',
        '/inventory',
        'Restock Item'
      );
    }

    return product;
  }

  // --- SALES & POS ---

  getSales(businessId: string): Sale[] {
    return Array.from(this.sales.values())
      .filter(s => s.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getSaleById(businessId: string, id: string): Sale | undefined {
    const sale = this.sales.get(id);
    if (!sale || sale.businessId !== businessId) return undefined;
    return sale;
  }

  createSale(
    businessId: string,
    saleData: {
      customerId?: string;
      customerName?: string;
      customerPhone?: string;
      items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
      }[];
      discountAmount?: number;
      taxAmount?: number;
      paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'SPLIT' | 'CREDIT';
      splitDetails?: { cash?: number; upi?: number; card?: number };
      notes?: string;
    },
    cashier: { id: string; name: string }
  ): Sale {
    const saleId = `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let subtotal = 0;
    let totalCogs = 0;
    const saleItems = saleData.items.map(item => {
      const prod = this.products.get(item.productId);
      const prodName = prod ? prod.name : 'Unknown Item';
      const sku = prod ? prod.sku : '';
      const unit = prod ? prod.unit : 'pcs';
      const mrp = prod ? prod.mrp : item.unitPrice;
      const purchasePrice = prod ? prod.purchasePrice : 0;
      const taxRate = prod ? prod.taxRate : 0;
      const itemDiscount = item.discount || 0;
      const itemTotal = (item.unitPrice * item.quantity) - itemDiscount;

      subtotal += itemTotal;
      totalCogs += purchasePrice * item.quantity;

      // Deduct inventory
      if (prod && prod.businessId === businessId) {
        const prev = prod.currentStock;
        prod.currentStock = Math.max(0, prod.currentStock - item.quantity);
        prod.updatedAt = new Date().toISOString();

        this.recordInventoryMovement({
          businessId,
          productId: prod.id,
          productName: prod.name,
          type: 'SALE',
          quantity: -item.quantity,
          previousStock: prev,
          newStock: prod.currentStock,
          reason: `Sale Invoice #${invoiceNumber}`,
          referenceId: invoiceNumber,
          createdBy: cashier.name,
        });

        // Trigger alert if hit min stock
        if (prod.currentStock <= prod.minStock) {
          this.createNotification(
            businessId,
            `Low Stock Warning: ${prod.name}`,
            `Remaining stock is only ${prod.currentStock} units. Time to reorder.`,
            'LOW_STOCK',
            '/inventory',
            'View Inventory'
          );
        }
      }

      return {
        productId: item.productId,
        productName: prodName,
        sku,
        unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        purchasePrice,
        mrp,
        discount: itemDiscount,
        taxRate,
        total: itemTotal,
      };
    });

    const discountAmount = saleData.discountAmount || 0;
    const taxAmount = saleData.taxAmount || 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);
    const profitAmount = totalAmount - totalCogs;

    const sale: Sale = {
      id: saleId,
      businessId,
      invoiceNumber,
      customerId: saleData.customerId,
      customerName: saleData.customerName || (saleData.customerId ? this.customers.get(saleData.customerId)?.name : 'Walk-in Customer'),
      customerPhone: saleData.customerPhone || (saleData.customerId ? this.customers.get(saleData.customerId)?.phone : undefined),
      items: saleItems,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      profitAmount,
      paymentMethod: saleData.paymentMethod,
      splitDetails: saleData.splitDetails,
      cashierId: cashier.id,
      cashierName: cashier.name,
      notes: saleData.notes,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    this.sales.set(saleId, sale);

    // If sale was made to a customer: update their total spent and visit count
    if (saleData.customerId) {
      const cust = this.customers.get(saleData.customerId);
      if (cust && cust.businessId === businessId) {
        cust.totalSpent += totalAmount;
        cust.ordersCount += 1;
        // If payment method was CREDIT (Khata / Udhar), add to outstanding balance!
        if (saleData.paymentMethod === 'CREDIT') {
          cust.outstandingBalance += totalAmount;
        }
      }
    }

    this.recordAuditLog(
      businessId,
      'CREATE_SALE',
      'Sale',
      saleId,
      `Completed sale #${invoiceNumber} total ₹${totalAmount.toFixed(2)} via ${saleData.paymentMethod}`,
      cashier.name
    );

    return sale;
  }

  // --- PURCHASES & SUPPLIERS ---

  getSuppliers(businessId: string): (Supplier & { productsSuppliedCount: number })[] {
    const list = Array.from(this.suppliers.values()).filter(s => s.businessId === businessId);
    return list.map(sup => {
      const count = Array.from(this.products.values()).filter(p => p.businessId === businessId && p.supplierId === sup.id).length;
      return { ...sup, productsSuppliedCount: count };
    });
  }

  createSupplier(businessId: string, data: Omit<Supplier, 'id' | 'businessId' | 'createdAt'>, actorName: string): Supplier {
    const id = `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const supplier: Supplier = {
      ...data,
      id,
      businessId,
      createdAt: new Date().toISOString(),
    };
    this.suppliers.set(id, supplier);
    this.recordAuditLog(businessId, 'CREATE_SUPPLIER', 'Supplier', id, `Added supplier "${supplier.name}" (${supplier.company})`, actorName);
    return supplier;
  }

  updateSupplier(businessId: string, id: string, updates: Partial<Supplier>, actorName: string): Supplier | undefined {
    const s = this.suppliers.get(id);
    if (!s || s.businessId !== businessId) return undefined;
    const updated = { ...s, ...updates };
    this.suppliers.set(id, updated);
    this.recordAuditLog(businessId, 'UPDATE_SUPPLIER', 'Supplier', id, `Updated supplier details "${s.name}"`, actorName);
    return updated;
  }

  recordSupplierPayment(businessId: string, supplierId: string, amount: number, paymentMode: string, notes: string | undefined, actorName: string): SupplierPayment | undefined {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier || supplier.businessId !== businessId) return undefined;

    const id = `spay-${Date.now()}`;
    const payment: SupplierPayment = {
      id,
      businessId,
      supplierId,
      amount,
      paymentMode,
      date: new Date().toISOString(),
      notes,
    };
    this.supplierPayments.set(id, payment);

    supplier.outstandingBalance = Math.max(0, supplier.outstandingBalance - amount);
    this.recordAuditLog(businessId, 'SUPPLIER_PAYMENT', 'Supplier', supplierId, `Paid ₹${amount} to ${supplier.name} via ${paymentMode}`, actorName);
    return payment;
  }

  getPurchaseOrders(businessId: string): PurchaseOrder[] {
    return Array.from(this.purchaseOrders.values())
      .filter(p => p.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createPurchaseOrder(businessId: string, poData: Omit<PurchaseOrder, 'id' | 'businessId' | 'createdAt' | 'status' | 'paidAmount'>, actorName: string): PurchaseOrder {
    const id = `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const po: PurchaseOrder = {
      ...poData,
      id,
      businessId,
      status: 'ORDERED',
      paidAmount: 0,
      createdAt: new Date().toISOString(),
    };
    this.purchaseOrders.set(id, po);

    // Increase supplier's outstanding balance
    const sup = this.suppliers.get(po.supplierId);
    if (sup && sup.businessId === businessId) {
      sup.outstandingBalance += po.totalAmount;
    }

    this.recordAuditLog(businessId, 'CREATE_PURCHASE_ORDER', 'PurchaseOrder', id, `Created PO #${po.poNumber} for ₹${po.totalAmount} from ${po.supplierName}`, actorName);
    return po;
  }

  receivePurchaseOrder(businessId: string, poId: string, actorName: string): PurchaseOrder | undefined {
    const po = this.purchaseOrders.get(poId);
    if (!po || po.businessId !== businessId) return undefined;
    if (po.status === 'RECEIVED') return po;

    // Automatically increase inventory for each item in PO
    po.items.forEach(item => {
      const prod = this.products.get(item.productId);
      if (prod && prod.businessId === businessId) {
        const prev = prod.currentStock;
        prod.currentStock += item.quantity;
        prod.updatedAt = new Date().toISOString();

        this.recordInventoryMovement({
          businessId,
          productId: prod.id,
          productName: prod.name,
          type: 'PURCHASE',
          quantity: item.quantity,
          previousStock: prev,
          newStock: prod.currentStock,
          reason: `Goods Received on PO #${po.poNumber}`,
          referenceId: po.poNumber,
          createdBy: actorName,
        });
      }
    });

    po.status = 'RECEIVED';
    this.recordAuditLog(businessId, 'RECEIVE_PURCHASE_ORDER', 'PurchaseOrder', poId, `Received items for PO #${po.poNumber}. Stock automatically updated.`, actorName);
    return po;
  }

  // --- CUSTOMERS (KHATA) ---

  getCustomers(businessId: string): Customer[] {
    return Array.from(this.customers.values())
      .filter(c => c.businessId === businessId)
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance);
  }

  getCustomerById(businessId: string, id: string): Customer | undefined {
    const c = this.customers.get(id);
    if (!c || c.businessId !== businessId) return undefined;
    return c;
  }

  createCustomer(businessId: string, data: Omit<Customer, 'id' | 'businessId' | 'createdAt' | 'totalSpent' | 'ordersCount' | 'outstandingBalance'>, actorName: string): Customer {
    const id = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const customer: Customer = {
      ...data,
      id,
      businessId,
      outstandingBalance: 0,
      totalSpent: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.customers.set(id, customer);
    this.recordAuditLog(businessId, 'CREATE_CUSTOMER', 'Customer', id, `Added customer "${customer.name}" (${customer.phone})`, actorName);
    return customer;
  }

  recordCustomerPayment(businessId: string, customerId: string, amount: number, paymentMode: string, notes: string | undefined, actorName: string): CustomerPayment | undefined {
    const cust = this.customers.get(customerId);
    if (!cust || cust.businessId !== businessId) return undefined;

    const id = `cpay-${Date.now()}`;
    const payment: CustomerPayment = {
      id,
      businessId,
      customerId,
      amount,
      paymentMode,
      date: new Date().toISOString(),
      notes,
    };
    this.customerPayments.set(id, payment);

    cust.outstandingBalance = Math.max(0, cust.outstandingBalance - amount);
    this.recordAuditLog(businessId, 'CUSTOMER_PAYMENT', 'Customer', customerId, `Recorded payment in of ₹${amount} from ${cust.name} via ${paymentMode}`, actorName);
    return payment;
  }

  // --- EXPENSES ---

  getExpenses(businessId: string): Expense[] {
    return Array.from(this.expenses.values())
      .filter(e => e.businessId === businessId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  createExpense(businessId: string, data: Omit<Expense, 'id' | 'businessId' | 'createdAt'>, actorName: string): Expense {
    const id = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const expense: Expense = {
      ...data,
      id,
      businessId,
      createdAt: new Date().toISOString(),
    };
    this.expenses.set(id, expense);
    this.recordAuditLog(businessId, 'CREATE_EXPENSE', 'Expense', id, `Recorded ${expense.category} expense: "${expense.title}" of ₹${expense.amount}`, actorName);
    return expense;
  }

  deleteExpense(businessId: string, id: string, actorName: string): boolean {
    const exp = this.expenses.get(id);
    if (!exp || exp.businessId !== businessId) return false;
    this.expenses.delete(id);
    this.recordAuditLog(businessId, 'DELETE_EXPENSE', 'Expense', id, `Deleted expense "${exp.title}"`, actorName);
    return true;
  }

  // --- NOTIFICATIONS ---

  getNotifications(businessId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createNotification(
    businessId: string,
    title: string,
    message: string,
    type: 'LOW_STOCK' | 'EXPIRY' | 'PAYMENT_DUE' | 'SALES_MILESTONE' | 'SYSTEM',
    actionUrl?: string,
    actionLabel?: string
  ): Notification {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const n: Notification = {
      id,
      businessId,
      title,
      message,
      type,
      read: false,
      actionUrl,
      actionLabel,
      createdAt: new Date().toISOString(),
    };
    this.notifications.set(id, n);
    return n;
  }

  markNotificationAsRead(businessId: string, id: string): boolean {
    const n = this.notifications.get(id);
    if (!n || n.businessId !== businessId) return false;
    n.read = true;
    return true;
  }

  // --- AUDIT LOGS ---

  getAuditLogs(businessId: string): AuditLog[] {
    return Array.from(this.auditLogs.values())
      .filter(a => a.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);
  }

  recordAuditLog(businessId: string, action: string, entity: string, entityId: string, details: string, userName: string, userId: string = 'system') {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const log: AuditLog = {
      id,
      businessId,
      userId,
      userName,
      action,
      entity,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.set(id, log);
  }

  // --- DASHBOARD AGGREGATIONS ---

  getDashboardSummary(businessId: string, timeRange: 'today' | 'yesterday' | '7days' | '30days' | 'this_month' = 'today') {
    const allSales = this.getSales(businessId);
    const allProducts = this.getProducts(businessId);
    const allSuppliers = this.getSuppliers(businessId);
    const allCustomers = this.getCustomers(businessId);
    const allExpenses = this.getExpenses(businessId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 3600 * 1000;
    const startOf7Days = startOfToday - 7 * 24 * 3600 * 1000;
    const startOf30Days = startOfToday - 30 * 24 * 3600 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let filterStart = startOfToday;
    let filterEnd = Date.now();

    if (timeRange === 'yesterday') {
      filterStart = startOfYesterday;
      filterEnd = startOfToday;
    } else if (timeRange === '7days') {
      filterStart = startOf7Days;
    } else if (timeRange === '30days') {
      filterStart = startOf30Days;
    } else if (timeRange === 'this_month') {
      filterStart = startOfMonth;
    }

    const filteredSales = allSales.filter(s => {
      const t = new Date(s.createdAt).getTime();
      return t >= filterStart && t <= filterEnd;
    });

    const totalSalesRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalGrossProfit = filteredSales.reduce((acc, s) => acc + s.profitAmount, 0);
    const transactionCount = filteredSales.length;
    const avgOrderValue = transactionCount > 0 ? totalSalesRevenue / transactionCount : 0;

    const filteredExpenses = allExpenses.filter(e => {
      const t = new Date(e.date).getTime();
      return t >= filterStart && t <= filterEnd;
    });
    const totalExpensesAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalGrossProfit - totalExpensesAmount;

    // Inventory status
    let totalInventoryValueCost = 0;
    let totalInventoryValueRetail = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    allProducts.forEach(p => {
      totalInventoryValueCost += p.currentStock * p.purchasePrice;
      totalInventoryValueRetail += p.currentStock * p.sellingPrice;
      if (p.currentStock === 0) outOfStockCount++;
      else if (p.currentStock <= p.minStock) lowStockCount++;
    });

    // Supplier & Customer Balances
    const totalSupplierPayables = allSuppliers.reduce((acc, s) => acc + s.outstandingBalance, 0);
    const totalCustomerReceivables = allCustomers.reduce((acc, c) => acc + c.outstandingBalance, 0);

    // Product velocity
    const productSalesMap = new Map<string, { product: Product; quantitySold: number; revenue: number }>();
    allSales.forEach(s => {
      s.items.forEach(item => {
        const existing = productSalesMap.get(item.productId);
        const prod = allProducts.find(p => p.id === item.productId);
        if (prod) {
          if (existing) {
            existing.quantitySold += item.quantity;
            existing.revenue += item.total;
          } else {
            productSalesMap.set(item.productId, { product: prod, quantitySold: item.quantity, revenue: item.total });
          }
        }
      });
    });

    const topSelling = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5)
      .map(item => ({
        id: item.product.id,
        name: item.product.name,
        category: item.product.categoryName,
        unitsSold: item.quantitySold,
        revenue: item.revenue,
      }));

    // Slow moving / zero sales
    const slowMoving = allProducts
      .filter(p => !productSalesMap.has(p.id) || (productSalesMap.get(p.id)!.quantitySold <= 1))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        currentStock: p.currentStock,
        stockValue: p.currentStock * p.purchasePrice,
        daysInStock: 30,
      }));

    return {
      timeRange,
      totalSalesRevenue,
      totalGrossProfit,
      transactionCount,
      avgOrderValue,
      totalExpensesAmount,
      netProfit,
      totalInventoryValueCost,
      totalInventoryValueRetail,
      lowStockCount,
      outOfStockCount,
      totalSupplierPayables,
      totalCustomerReceivables,
      topSelling,
      slowMoving,
    };
  }

  // --- AI CONVERSATION STORAGE ---

  getAiMessages(businessId: string): AiChatMessage[] {
    return Array.from(this.aiMessages.values())
      .filter(m => m.businessId === businessId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addAiMessage(businessId: string, message: Omit<AiChatMessage, 'id' | 'createdAt'>): AiChatMessage {
    const id = `aimsg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullMsg = {
      ...message,
      id,
      businessId,
      createdAt: new Date().toISOString(),
    };
    this.aiMessages.set(id, fullMsg);
    return fullMsg;
  }

  clearAiMessages(businessId: string) {
    for (const [id, msg] of this.aiMessages.entries()) {
      if (msg.businessId === businessId) {
        this.aiMessages.delete(id);
      }
    }
  }

  updateAiActionStatus(businessId: string, messageId: string, actionId: string, status: 'EXECUTED' | 'REJECTED') {
    const msg = this.aiMessages.get(messageId);
    if (msg && msg.businessId === businessId && msg.proposedAction && msg.proposedAction.id === actionId) {
      msg.proposedAction.status = status;
    }
  }
}

export const db = new DatabaseStore();
