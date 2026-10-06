import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import {
  requireAuth,
  requirePermission,
  createSession,
  revokeSession,
  ROLE_PERMISSIONS
} from './auth.ts';
import { chatWithCopilot, generateProactiveInsights } from './aiEngine.ts';
import { User, Business } from '../types/index.ts';

export const apiRouter = Router();

// ==================== AUTHENTICATION & MULTI-TENANCY ====================

// Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user || !db.verifyPassword(email, password)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (!user.active) {
    res.status(403).json({ error: 'Account has been deactivated. Please contact your store administrator.' });
    return;
  }

  const business = db.getBusiness(user.businessId);
  if (!business) {
    res.status(404).json({ error: 'Shop profile not found for this user.' });
    return;
  }

  const token = createSession(user);
  res.json({
    token,
    user,
    business,
    permissions: ROLE_PERMISSIONS[user.role],
  });
});

// Register New Shop & Owner Account
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { shopName, ownerName, email, phone, address, password, gstin, upiId } = req.body;

  if (!shopName || !ownerName || !email || !password) {
    res.status(400).json({ error: 'Shop name, owner name, email, and password are required.' });
    return;
  }

  if (db.getUserByEmail(email)) {
    res.status(400).json({ error: 'An account with this email already exists.' });
    return;
  }

  const newBusinessId = `tenant-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const business: Business = {
    id: newBusinessId,
    name: shopName,
    ownerName,
    phone: phone || '',
    email,
    address: address || '',
    gstin: gstin || '',
    currency: '₹',
    upiId: upiId || '',
    createdAt: new Date().toISOString(),
    onboardingCompleted: false,
  };
  db.createBusiness(business);

  const newUser: User = {
    id: `usr-${Date.now()}`,
    businessId: newBusinessId,
    name: ownerName,
    email,
    phone: phone || '',
    role: 'OWNER',
    active: true,
    createdAt: new Date().toISOString(),
  };
  db.createUser(newUser, password);

  // Seed standard categories for new retail shop
  const defaultCats = [
    { name: 'Staples & Grains', desc: 'Flour, rice, pulses' },
    { name: 'Oils & Ghee', desc: 'Edible cooking oils' },
    { name: 'Snacks & Biscuits', desc: 'Packaged foods' },
    { name: 'Dairy & Beverages', desc: 'Milk, drinks' },
    { name: 'Personal Care & Household', desc: 'Cleaning, hygiene' },
  ];
  defaultCats.forEach(c => db.createCategory(newBusinessId, c.name, c.desc));

  // Welcome notification
  db.createNotification(
    newBusinessId,
    `Welcome to MyShoply, ${ownerName}!`,
    `Your shop "${shopName}" is now active. Follow the onboarding guide to add products or ask MyShoply AI for suggestions.`,
    'SYSTEM',
    '/products',
    'Add First Product'
  );

  const token = createSession(newUser);
  res.json({
    token,
    user: newUser,
    business,
    permissions: ROLE_PERMISSIONS[newUser.role],
  });
});

// Current User & Active Shop
apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    user: req.user,
    business: req.business,
    permissions: ROLE_PERMISSIONS[req.user!.role],
  });
});

// Logout
apiRouter.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  const token = req.headers.authorization?.substring(7);
  if (token) revokeSession(token);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Switch Demo Tenant (allows instant switching between the two isolated sample shops)
apiRouter.post('/auth/switch-demo-tenant', (req: Request, res: Response) => {
  const { tenantKey, role = 'OWNER' } = req.body;
  let targetEmail = 'rahul@sharmastore.in';

  if (tenantKey === 'green') {
    targetEmail = 'priya@greenbasket.co';
  } else if (tenantKey === 'sharma-cashier') {
    targetEmail = 'vikram@sharmastore.in';
  } else if (tenantKey === 'sharma-manager') {
    targetEmail = 'anita@sharmastore.in';
  }

  const user = db.getUserByEmail(targetEmail);
  if (!user) {
    res.status(404).json({ error: 'Demo shopkeeper not found' });
    return;
  }

  const business = db.getBusiness(user.businessId);
  const token = createSession(user);
  res.json({
    token,
    user,
    business,
    permissions: ROLE_PERMISSIONS[user.role],
  });
});

// ==================== DASHBOARD & INSIGHTS ====================

apiRouter.get('/dashboard', requireAuth, requirePermission('VIEW_DASHBOARD'), (req: Request, res: Response) => {
  const timeRange = (req.query.timeRange as any) || 'today';
  const summary = db.getDashboardSummary(req.tenantId!, timeRange);
  const insights = generateProactiveInsights(req.tenantId!);

  res.json({
    ...summary,
    insights,
    shopName: req.business?.name,
    currency: req.business?.currency,
  });
});

// ==================== PRODUCTS ====================

apiRouter.get('/products', requireAuth, (req: Request, res: Response) => {
  const products = db.getProducts(req.tenantId!);
  res.json(products);
});

apiRouter.post('/products', requireAuth, requirePermission('MANAGE_PRODUCTS'), (req: Request, res: Response) => {
  const {
    name,
    sku,
    barcode,
    categoryId,
    categoryName,
    brand,
    unit,
    purchasePrice,
    sellingPrice,
    mrp,
    taxRate,
    discount,
    currentStock,
    minStock,
    maxStock,
    supplierId,
    supplierName,
    imageUrl,
    expiryDate,
    batchNumber,
  } = req.body;

  if (!name || purchasePrice === undefined || sellingPrice === undefined) {
    res.status(400).json({ error: 'Product name, purchase price, and selling price are required.' });
    return;
  }

  // Duplicate SKU / Barcode check within tenant
  const existing = db.getProducts(req.tenantId!);
  if (sku && existing.some(p => p.sku === sku)) {
    res.status(400).json({ error: `A product with SKU "${sku}" already exists in your shop.` });
    return;
  }
  if (barcode && existing.some(p => p.barcode === barcode)) {
    res.status(400).json({ error: `A product with Barcode "${barcode}" already exists in your shop.` });
    return;
  }

  const product = db.createProduct(
    req.tenantId!,
    {
      name,
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: barcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      categoryId: categoryId || 'general',
      categoryName: categoryName || 'General',
      brand: brand || 'Store Brand',
      unit: unit || 'pcs',
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      mrp: mrp ? Number(mrp) : Number(sellingPrice),
      taxRate: taxRate ? Number(taxRate) : 0,
      discount: discount ? Number(discount) : 0,
      currentStock: currentStock ? Number(currentStock) : 0,
      minStock: minStock ? Number(minStock) : 10,
      maxStock: maxStock ? Number(maxStock) : 100,
      supplierId,
      supplierName,
      imageUrl,
      expiryDate,
      batchNumber,
      status: 'ACTIVE',
    },
    req.user!.name
  );

  res.status(201).json(product);
});

apiRouter.put('/products/:id', requireAuth, requirePermission('MANAGE_PRODUCTS'), (req: Request, res: Response) => {
  const updated = db.updateProduct(req.tenantId!, req.params.id, req.body, req.user!.name);
  if (!updated) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  res.json(updated);
});

apiRouter.delete('/products/:id', requireAuth, requirePermission('MANAGE_PRODUCTS'), (req: Request, res: Response) => {
  const success = db.deleteProduct(req.tenantId!, req.params.id, req.user!.name);
  if (!success) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  res.json({ success: true, message: 'Product archived successfully.' });
});

// Bulk import products
apiRouter.post('/products/bulk-import', requireAuth, requirePermission('MANAGE_PRODUCTS'), (req: Request, res: Response) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'Invalid payload: items must be an array.' });
    return;
  }

  const created: any[] = [];
  items.forEach(item => {
    if (item.name && item.sellingPrice) {
      const prod = db.createProduct(
        req.tenantId!,
        {
          name: item.name,
          sku: item.sku || `SKU-${Date.now().toString().slice(-6)}`,
          barcode: item.barcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
          categoryId: item.categoryId || 'general',
          categoryName: item.categoryName || 'General',
          brand: item.brand || 'Store Brand',
          unit: item.unit || 'pcs',
          purchasePrice: Number(item.purchasePrice || item.sellingPrice * 0.8),
          sellingPrice: Number(item.sellingPrice),
          mrp: Number(item.mrp || item.sellingPrice),
          taxRate: Number(item.taxRate || 0),
          discount: 0,
          currentStock: Number(item.currentStock || 0),
          minStock: Number(item.minStock || 10),
          maxStock: Number(item.maxStock || 100),
          status: 'ACTIVE',
        },
        req.user!.name
      );
      created.push(prod);
    }
  });

  res.json({ success: true, count: created.length, products: created });
});

// ==================== CATEGORIES ====================

apiRouter.get('/categories', requireAuth, (req: Request, res: Response) => {
  const cats = db.getCategories(req.tenantId!);
  res.json(cats);
});

apiRouter.post('/categories', requireAuth, requirePermission('MANAGE_PRODUCTS'), (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }
  const cat = db.createCategory(req.tenantId!, name, description);
  res.status(201).json(cat);
});

apiRouter.put('/categories/:id', requireAuth, requirePermission('MANAGE_PRODUCTS'), (req: Request, res: Response) => {
  const { name, description } = req.body;
  const updated = db.updateCategory(req.tenantId!, req.params.id, name, description);
  if (!updated) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  res.json(updated);
});

apiRouter.delete('/categories/:id', requireAuth, requirePermission('MANAGE_PRODUCTS'), (req: Request, res: Response) => {
  const success = db.deleteCategory(req.tenantId!, req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  res.json({ success: true });
});

// ==================== INVENTORY ====================

apiRouter.get('/inventory/movements', requireAuth, requirePermission('MANAGE_INVENTORY'), (req: Request, res: Response) => {
  const productId = req.query.productId as string | undefined;
  const movements = db.getInventoryMovements(req.tenantId!, productId);
  res.json(movements);
});

apiRouter.post('/inventory/adjust', requireAuth, requirePermission('MANAGE_INVENTORY'), (req: Request, res: Response) => {
  const { productId, delta, type, reason } = req.body;
  if (!productId || delta === undefined || !type || !reason) {
    res.status(400).json({ error: 'Product ID, delta, adjustment type, and reason are required.' });
    return;
  }

  const updatedProduct = db.adjustStock(
    req.tenantId!,
    productId,
    Number(delta),
    type,
    reason,
    req.user!.name
  );

  if (!updatedProduct) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  res.json({ success: true, product: updatedProduct });
});

// ==================== SALES / POS ====================

apiRouter.get('/sales', requireAuth, (req: Request, res: Response) => {
  const sales = db.getSales(req.tenantId!);
  res.json(sales);
});

apiRouter.get('/sales/:id', requireAuth, (req: Request, res: Response) => {
  const sale = db.getSaleById(req.tenantId!, req.params.id);
  if (!sale) {
    res.status(404).json({ error: 'Sale record not found.' });
    return;
  }
  res.json(sale);
});

apiRouter.post('/sales', requireAuth, requirePermission('CREATE_SALE'), (req: Request, res: Response) => {
  const { customerId, customerName, customerPhone, items, discountAmount, taxAmount, paymentMethod, splitDetails, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Cart must contain at least one product.' });
    return;
  }

  const sale = db.createSale(
    req.tenantId!,
    {
      customerId,
      customerName,
      customerPhone,
      items,
      discountAmount,
      taxAmount,
      paymentMethod: paymentMethod || 'CASH',
      splitDetails,
      notes,
    },
    { id: req.user!.id, name: req.user!.name }
  );

  res.status(201).json(sale);
});

// ==================== PURCHASES & SUPPLIERS ====================

apiRouter.get('/suppliers', requireAuth, (req: Request, res: Response) => {
  const suppliers = db.getSuppliers(req.tenantId!);
  res.json(suppliers);
});

apiRouter.post('/suppliers', requireAuth, requirePermission('MANAGE_SUPPLIERS'), (req: Request, res: Response) => {
  const { name, company, phone, email, address, gstin } = req.body;
  if (!name || !phone) {
    res.status(400).json({ error: 'Supplier name and phone are required.' });
    return;
  }

  const supplier = db.createSupplier(
    req.tenantId!,
    {
      name,
      company: company || name,
      phone,
      email,
      address: address || '',
      gstin,
      outstandingBalance: 0,
    },
    req.user!.name
  );

  res.status(201).json(supplier);
});

apiRouter.post('/suppliers/:id/pay', requireAuth, requirePermission('MANAGE_SUPPLIERS'), (req: Request, res: Response) => {
  const { amount, paymentMode, notes } = req.body;
  if (!amount || Number(amount) <= 0) {
    res.status(400).json({ error: 'Valid payment amount is required.' });
    return;
  }

  const payment = db.recordSupplierPayment(
    req.tenantId!,
    req.params.id,
    Number(amount),
    paymentMode || 'Cash',
    notes,
    req.user!.name
  );

  if (!payment) {
    res.status(404).json({ error: 'Supplier not found.' });
    return;
  }

  res.json({ success: true, payment });
});

apiRouter.get('/purchases', requireAuth, requirePermission('MANAGE_PURCHASES'), (req: Request, res: Response) => {
  const pos = db.getPurchaseOrders(req.tenantId!);
  res.json(pos);
});

apiRouter.post('/purchases', requireAuth, requirePermission('MANAGE_PURCHASES'), (req: Request, res: Response) => {
  const { supplierId, supplierName, items, totalAmount, notes, expectedDeliveryDate } = req.body;
  if (!supplierId || !items || items.length === 0) {
    res.status(400).json({ error: 'Supplier and purchase items are required.' });
    return;
  }

  const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const po = db.createPurchaseOrder(
    req.tenantId!,
    {
      poNumber,
      supplierId,
      supplierName: supplierName || 'Distributor',
      items,
      totalAmount: Number(totalAmount),
      notes,
      expectedDeliveryDate,
    },
    req.user!.name
  );

  res.status(201).json(po);
});

apiRouter.post('/purchases/:id/receive', requireAuth, requirePermission('MANAGE_PURCHASES'), (req: Request, res: Response) => {
  const po = db.receivePurchaseOrder(req.tenantId!, req.params.id, req.user!.name);
  if (!po) {
    res.status(404).json({ error: 'Purchase Order not found.' });
    return;
  }
  res.json({ success: true, po });
});

// ==================== CUSTOMERS (KHATA) ====================

apiRouter.get('/customers', requireAuth, (req: Request, res: Response) => {
  const customers = db.getCustomers(req.tenantId!);
  res.json(customers);
});

apiRouter.post('/customers', requireAuth, requirePermission('MANAGE_CUSTOMERS'), (req: Request, res: Response) => {
  const { name, phone, address, creditLimit } = req.body;
  if (!name || !phone) {
    res.status(400).json({ error: 'Customer name and phone number are required.' });
    return;
  }

  const customer = db.createCustomer(
    req.tenantId!,
    {
      name,
      phone,
      address,
      creditLimit: creditLimit ? Number(creditLimit) : 5000,
    },
    req.user!.name
  );

  res.status(201).json(customer);
});

apiRouter.post('/customers/:id/pay', requireAuth, requirePermission('MANAGE_CUSTOMERS'), (req: Request, res: Response) => {
  const { amount, paymentMode, notes } = req.body;
  if (!amount || Number(amount) <= 0) {
    res.status(400).json({ error: 'Valid payment amount is required.' });
    return;
  }

  const payment = db.recordCustomerPayment(
    req.tenantId!,
    req.params.id,
    Number(amount),
    paymentMode || 'Cash',
    notes,
    req.user!.name
  );

  if (!payment) {
    res.status(404).json({ error: 'Customer not found.' });
    return;
  }

  res.json({ success: true, payment });
});

// ==================== EXPENSES ====================

apiRouter.get('/expenses', requireAuth, requirePermission('MANAGE_EXPENSES'), (req: Request, res: Response) => {
  const expenses = db.getExpenses(req.tenantId!);
  res.json(expenses);
});

apiRouter.post('/expenses', requireAuth, requirePermission('MANAGE_EXPENSES'), (req: Request, res: Response) => {
  const { title, category, amount, paymentMode, date, notes } = req.body;
  if (!title || !category || !amount) {
    res.status(400).json({ error: 'Expense title, category, and amount are required.' });
    return;
  }

  const exp = db.createExpense(
    req.tenantId!,
    {
      title,
      category,
      amount: Number(amount),
      paymentMode: paymentMode || 'Cash',
      date: date || new Date().toISOString().split('T')[0],
      notes,
    },
    req.user!.name
  );

  res.status(201).json(exp);
});

apiRouter.delete('/expenses/:id', requireAuth, requirePermission('MANAGE_EXPENSES'), (req: Request, res: Response) => {
  const success = db.deleteExpense(req.tenantId!, req.params.id, req.user!.name);
  if (!success) {
    res.status(404).json({ error: 'Expense not found.' });
    return;
  }
  res.json({ success: true });
});

// ==================== EMPLOYEES & RBAC ====================

apiRouter.get('/employees', requireAuth, requirePermission('MANAGE_EMPLOYEES'), (req: Request, res: Response) => {
  const users = db.getUsersByBusiness(req.tenantId!);
  res.json(users);
});

apiRouter.post('/employees', requireAuth, requirePermission('MANAGE_EMPLOYEES'), (req: Request, res: Response) => {
  const { name, email, phone, role, password } = req.body;
  if (!name || !email || !role || !password) {
    res.status(400).json({ error: 'Name, email, role, and temporary password are required.' });
    return;
  }

  if (db.getUserByEmail(email)) {
    res.status(400).json({ error: 'A user with this email already exists.' });
    return;
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    businessId: req.tenantId!,
    name,
    email,
    phone: phone || '',
    role,
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.createUser(newUser, password);
  db.recordAuditLog(req.tenantId!, 'ADD_EMPLOYEE', 'Employee', newUser.id, `Created staff account for ${name} (${role})`, req.user!.name);
  res.status(201).json(newUser);
});

apiRouter.put('/employees/:id', requireAuth, requirePermission('MANAGE_EMPLOYEES'), (req: Request, res: Response) => {
  const { role, active } = req.body;
  const updated = db.updateUser(req.tenantId!, req.params.id, { role, active });
  if (!updated) {
    res.status(404).json({ error: 'Employee not found.' });
    return;
  }
  db.recordAuditLog(req.tenantId!, 'UPDATE_EMPLOYEE', 'Employee', req.params.id, `Updated staff settings for ${updated.name}`, req.user!.name);
  res.json(updated);
});

// ==================== NOTIFICATIONS ====================

apiRouter.get('/notifications', requireAuth, (req: Request, res: Response) => {
  const notifications = db.getNotifications(req.tenantId!);
  res.json(notifications);
});

apiRouter.post('/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  db.markNotificationAsRead(req.tenantId!, req.params.id);
  res.json({ success: true });
});

// ==================== AUDIT LOGS ====================

apiRouter.get('/audit-logs', requireAuth, requirePermission('VIEW_DASHBOARD'), (req: Request, res: Response) => {
  const logs = db.getAuditLogs(req.tenantId!);
  res.json(logs);
});

// ==================== SETTINGS & PROFILE ====================

apiRouter.put('/settings/shop', requireAuth, requirePermission('MANAGE_SETTINGS'), (req: Request, res: Response) => {
  const { name, ownerName, phone, address, gstin, upiId, onboardingCompleted } = req.body;
  const updated = db.updateBusiness(req.tenantId!, {
    name,
    ownerName,
    phone,
    address,
    gstin,
    upiId,
    onboardingCompleted,
  });
  if (!updated) {
    res.status(404).json({ error: 'Shop profile not found.' });
    return;
  }
  res.json(updated);
});

// ==================== AI BUSINESS COPILOT ====================

apiRouter.get('/ai/messages', requireAuth, requirePermission('USE_AI_COPILOT'), (req: Request, res: Response) => {
  const messages = db.getAiMessages(req.tenantId!);
  res.json(messages);
});

apiRouter.post('/ai/chat', requireAuth, requirePermission('USE_AI_COPILOT'), async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Message cannot be empty.' });
    return;
  }

  // Save user message
  db.addAiMessage(req.tenantId!, {
    role: 'user',
    content: message,
  });

  try {
    const aiResponse = await chatWithCopilot(req.tenantId!, message, req.user!.name);

    // Save assistant response
    const savedMsg = db.addAiMessage(req.tenantId!, {
      role: 'assistant',
      content: aiResponse.text,
      toolsUsed: aiResponse.toolsUsed,
      proposedAction: aiResponse.proposedAction,
    });

    res.json(savedMsg);
  } catch (err: any) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ error: 'Failed to process AI response: ' + err.message });
  }
});

// Execute AI Proposed Action (e.g. creating Purchase Order with explicit shopkeeper confirmation)
apiRouter.post('/ai/action/execute', requireAuth, requirePermission('MANAGE_PURCHASES'), (req: Request, res: Response) => {
  const { messageId, actionId, actionType, payload } = req.body;

  if (actionType === 'CREATE_PURCHASE_ORDER') {
    // Find target supplier
    const suppliers = db.getSuppliers(req.tenantId!);
    const supplier = suppliers.find(s => s.name.toLowerCase().includes((payload.supplierName || '').toLowerCase())) || suppliers[0];

    const lowStockProducts = db.getProducts(req.tenantId!).filter(p => p.currentStock <= p.minStock);
    const poItems = lowStockProducts.map(p => ({
      productId: p.id,
      productName: p.name,
      quantity: Math.max(5, p.minStock - p.currentStock),
      unitPrice: p.purchasePrice,
      total: Math.max(5, p.minStock - p.currentStock) * p.purchasePrice,
    }));

    const totalAmount = poItems.reduce((a, b) => a + b.total, 0) || payload.estimatedAmount || 1000;
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const po = db.createPurchaseOrder(
      req.tenantId!,
      {
        poNumber,
        supplierId: supplier ? supplier.id : 'sup-general',
        supplierName: supplier ? supplier.name : payload.supplierName,
        items: poItems,
        totalAmount,
        notes: `Created via MyShoply AI Copilot recommendation`,
      },
      req.user!.name
    );

    db.updateAiActionStatus(req.tenantId!, messageId, actionId, 'EXECUTED');

    db.createNotification(
      req.tenantId!,
      `Purchase Order Generated: #${poNumber}`,
      `MyShoply AI created purchase order for ₹${totalAmount.toLocaleString()} to ${po.supplierName}.`,
      'SYSTEM',
      '/purchases',
      'View PO'
    );

    res.json({
      success: true,
      message: `Purchase Order #${poNumber} successfully generated!`,
      po,
    });
    return;
  }

  res.status(400).json({ error: 'Unsupported action type.' });
});

apiRouter.post('/ai/clear', requireAuth, requirePermission('USE_AI_COPILOT'), (req: Request, res: Response) => {
  db.clearAiMessages(req.tenantId!);
  res.json({ success: true });
});
