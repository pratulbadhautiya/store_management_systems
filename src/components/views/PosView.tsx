import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  QrCode,
  DollarSign,
  Printer,
  X,
  CheckCircle,
  AlertCircle,
  Receipt,
  Keyboard,
  UserPlus
} from 'lucide-react';
import { Product, Customer, Sale } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export const PosView: React.FC = () => {
  const { business } = useAuth();
  const { setActiveReceiptSale } = useShop();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT' | 'CREDIT'>('UPI');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState<string>('5000');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showUpiQrModal, setShowUpiQrModal] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const currency = business?.currency || '₹';

  // Load products and customers
  const loadData = async () => {
    try {
      const [prods, custs] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
      ]);
      setProducts(prods);
      setCustomers(custs);

      // unique categories
      const uniqueCats = Array.from(new Set(prods.map(p => p.categoryName || 'General')));
      setCategories(uniqueCats);
    } catch (err) {
      console.error('Failed to load POS data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  // Keyboard Shortcuts: F2 (New Sale), F4 (Customer), F8 (Checkout), Ctrl+K (Search), Esc (Close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        // Clear cart for new sale
        if (cart.length > 0 && confirm('Start a fresh sale? Current cart will be cleared.')) {
          resetSale();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        setShowCustomerModal(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0 && !isSubmitting) {
          handleCompleteSale();
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setShowCustomerModal(false);
        setShowNewCustomerModal(false);
        setShowUpiQrModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isSubmitting, selectedCustomer, paymentMethod, discountAmount]);

  // Barcode quick scanner simulator
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      p => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`No product found with Barcode/SKU: ${barcodeInput}`);
    }
  };

  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      if (!confirm(`Warning: "${product.name}" has 0 stock in system. Add to bill anyway?`)) {
        return;
      }
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.sellingPrice,
            discount: 0,
          },
        ];
      }
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const setManualQuantity = (index: number, qty: number) => {
    if (qty <= 0) return;
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity = qty;
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const totalTax = cart.reduce((acc, item) => {
    const itemSub = item.unitPrice * item.quantity;
    return acc + (itemSub * (item.product.taxRate || 0)) / 100;
  }, 0);
  const finalTotal = Math.max(0, subtotal - discountAmount + totalTax);

  const changeDue = Math.max(0, (Number(cashTendered) || 0) - finalTotal);

  const resetSale = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscountAmount(0);
    setPaymentMethod('UPI');
    setCashTendered('');
    setNotes('');
  };

  // Create new customer inline
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    try {
      const cust = await api.createCustomer({
        name: newCustName,
        phone: newCustPhone,
        creditLimit: Number(newCustCreditLimit) || 5000,
      });
      setCustomers(prev => [cust, ...prev]);
      setSelectedCustomer(cust);
      setShowNewCustomerModal(false);
      setShowCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  // Finalize Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Add products before completing sale.');
      return;
    }

    if (paymentMethod === 'CREDIT' && !selectedCustomer) {
      alert('Please select a Khata customer to record this sale on Credit (Udhar).');
      setShowCustomerModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        discountAmount,
        taxAmount: totalTax,
        paymentMethod,
        notes,
      };

      const sale = await api.createSale(payload);

      // Open print thermal receipt
      setActiveReceiptSale(sale);

      // Reset POS state
      resetSale();
      // Reload products to reflect updated stock
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by category & search
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryName === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-100">
      {/* LEFT: Product Catalog & Fast Lookup (60% width) */}
      <div className="flex-1 flex flex-col border-r border-slate-200 bg-white overflow-hidden">
        {/* Top Search & Barcode Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products by name, SKU, or brand (Ctrl+K)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Barcode scanner simulator */}
            <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan barcode..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold whitespace-nowrap"
              >
                Enter
              </button>
            </form>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12">
              <p className="font-semibold text-slate-600">No products found</p>
              <p className="mt-1">Try a different search query or barcode.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map(p => {
                const isLow = p.currentStock <= p.minStock && p.currentStock > 0;
                const isOut = p.currentStock <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="p-3 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-left transition-all hover:shadow-xs flex flex-col justify-between group active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] text-slate-400 font-mono truncate">{p.sku}</span>
                        <span className={`text-[10px] font-semibold ${
                          isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {isOut ? 'Out of Stock' : `${p.currentStock} ${p.unit}`}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-emerald-700">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-slate-900">{currency}{p.sellingPrice}</span>
                        {p.mrp > p.sellingPrice && (
                          <span className="text-[10px] text-slate-400 line-through">{currency}{p.mrp}</span>
                        )}
                      </div>
                      <span className="w-5 h-5 rounded bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white flex items-center justify-center text-xs font-bold transition-colors">
                        +
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard Hints Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span><kbd className="font-mono bg-white px-1.5 py-0.5 border border-slate-300 rounded text-[10px]">F2</kbd> New Sale</span>
            <span><kbd className="font-mono bg-white px-1.5 py-0.5 border border-slate-300 rounded text-[10px]">F4</kbd> Customer (Khata)</span>
            <span><kbd className="font-mono bg-white px-1.5 py-0.5 border border-slate-300 rounded text-[10px]">F8</kbd> Pay & Print</span>
            <span><kbd className="font-mono bg-white px-1.5 py-0.5 border border-slate-300 rounded text-[10px]">Ctrl+K</kbd> Search</span>
          </div>
          <span className="text-emerald-700 font-semibold">{filteredProducts.length} items available</span>
        </div>
      </div>

      {/* RIGHT: Active Bill & Checkout Panel (40% width) */}
      <div className="w-full lg:w-96 xl:w-[420px] flex flex-col bg-white border-l border-slate-200 h-full">
        {/* Customer Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-xs font-bold text-slate-800">
                {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
              </p>
              {selectedCustomer && (
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span>{selectedCustomer.phone}</span>
                  <span>·</span>
                  <span className={selectedCustomer.outstandingBalance > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700'}>
                    Khata Due: {currency}{selectedCustomer.outstandingBalance}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {selectedCustomer ? (
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-[11px] text-slate-500 hover:text-rose-600 px-2 py-1 rounded border border-slate-200 bg-white"
              >
                Change
              </button>
            ) : (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold px-2 py-1 rounded border border-emerald-300 bg-emerald-50 flex items-center gap-1"
              >
                <span>Select Khata (F4)</span>
              </button>
            )}
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Receipt className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                Click items on the left or scan barcodes to begin billing.
              </p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={item.product.id} className="py-2.5 px-2 flex items-center justify-between gap-2 hover:bg-slate-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item.product.name}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span>{currency}{item.unitPrice}</span>
                    <span>×</span>
                    <span>{item.quantity} {item.product.unit}</span>
                    {item.product.taxRate > 0 && (
                      <span className="text-slate-400">({item.product.taxRate}% GST)</span>
                    )}
                  </p>
                </div>

                {/* Qty +/- */}
                <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shrink-0">
                  <button
                    onClick={() => updateQuantity(index, -1)}
                    className="p-1 hover:bg-slate-100 text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => setManualQuantity(index, parseInt(e.target.value) || 1)}
                    className="w-8 text-center text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                  <button
                    onClick={() => updateQuantity(index, 1)}
                    className="p-1 hover:bg-slate-100 text-slate-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right shrink-0 min-w-[60px]">
                  <p className="text-xs font-bold text-slate-900">
                    {currency}{(item.unitPrice * item.quantity).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(index)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bill Breakdown & Payment Method */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 space-y-3">
          {/* Subtotal, Discount, Tax */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Total ({cart.reduce((a, b) => a + b.quantity, 0)} units)</span>
              <span>{currency}{subtotal.toFixed(2)}</span>
            </div>
            {totalTax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (GST)</span>
                <span>{currency}{totalTax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <span>Special Bill Discount</span>
              </span>
              <div className="flex items-center gap-1">
                <span>- {currency}</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ''}
                  onChange={e => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-16 px-1.5 py-0.5 text-right bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900 text-base">
              <span>Grand Total</span>
              <span className="text-lg text-emerald-700">{currency}{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-5 gap-1 text-[11px] font-medium">
              {[
                { id: 'UPI', label: 'UPI QR', icon: QrCode },
                { id: 'CASH', label: 'Cash', icon: DollarSign },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'CREDIT', label: 'Khata', icon: User },
                { id: 'SPLIT', label: 'Split', icon: Receipt },
              ].map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setPaymentMethod(m.id as any);
                      if (m.id === 'UPI') setShowUpiQrModal(true);
                    }}
                    className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentMethod === m.id
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tendered Calculator (if Cash chosen) */}
          {paymentMethod === 'CASH' && (
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-500">Cash Received</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-bold text-slate-700">{currency}</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={e => setCashTendered(e.target.value)}
                    placeholder={finalTotal.toFixed(0)}
                    className="w-20 px-1.5 py-0.5 font-bold text-slate-900 border border-slate-300 rounded focus:outline-hidden"
                  />
                </div>
              </div>
              {Number(cashTendered) > finalTotal && (
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-emerald-700">Change Due</span>
                  <p className="text-sm font-bold text-emerald-700">{currency}{changeDue.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* Khata Credit Warning (if Credit chosen) */}
          {paymentMethod === 'CREDIT' && (
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs text-amber-800">
              {selectedCustomer ? (
                <p>
                  Will add <strong>{currency}{finalTotal.toFixed(2)}</strong> to {selectedCustomer.name}'s Khata.
                  New balance: <strong>{currency}{(selectedCustomer.outstandingBalance + finalTotal).toFixed(2)}</strong> (Limit: {currency}{selectedCustomer.creditLimit}).
                </p>
              ) : (
                <p className="font-semibold text-rose-700">Select a Khata customer to record credit!</p>
              )}
            </div>
          )}

          {/* Complete Sale Button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={resetSale}
              disabled={cart.length === 0}
              className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold disabled:opacity-50"
            >
              Clear
            </button>

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || isSubmitting}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing Bill...' : `Complete & Print Bill (F8)`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Customer Selector (Khata) */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Select Khata Customer</h3>
                <p className="text-[11px] text-slate-500">Associate bill with customer or record on Udhar</p>
              </div>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Search customer by name or phone..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => setShowNewCustomerModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Customer</span>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                {customers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setShowCustomerModal(false);
                    }}
                    className="w-full py-2.5 px-3 text-left hover:bg-emerald-50/60 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{c.name}</p>
                      <p className="text-[11px] text-slate-500">{c.phone} {c.address ? `· ${c.address}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${c.outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                        {currency}{c.outstandingBalance.toLocaleString()} Due
                      </p>
                      <p className="text-[10px] text-slate-400">Limit: {currency}{c.creditLimit}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Customer */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add Customer to Khata</h3>
              <button onClick={() => setShowNewCustomerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Allowed Credit Limit ({currency})</label>
                <input
                  type="number"
                  value={newCustCreditLimit}
                  onChange={e => setNewCustCreditLimit(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPI Dynamic QR Code Simulator */}
      {showUpiQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 text-center shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Scan UPI to Pay</h3>
            <p className="text-xs text-slate-500 mt-0.5">{business?.name}</p>

            {/* Generated UPI simulation QR box */}
            <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block mx-auto">
              <div className="w-44 h-44 bg-white border-2 border-slate-800 p-2 flex flex-col items-center justify-center rounded-lg shadow-inner">
                {/* SVG QR Code Simulation */}
                <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M0,0 h30 v30 h-30 z M5,5 h20 v20 h-20 z M10,10 h10 v10 h-10 z" />
                  <path d="M70,0 h30 v30 h-30 z M75,5 h20 v20 h-20 z M80,10 h10 v10 h-10 z" />
                  <path d="M0,70 h30 v30 h-30 z M5,75 h20 v20 h-20 z M10,80 h10 v10 h-10 z" />
                  <rect x="40" y="10" width="10" height="20" />
                  <rect x="55" y="15" width="10" height="15" />
                  <rect x="15" y="40" width="20" height="10" />
                  <rect x="40" y="40" width="20" height="20" />
                  <rect x="65" y="45" width="25" height="10" />
                  <rect x="40" y="70" width="15" height="20" />
                  <rect x="70" y="65" width="20" height="25" />
                </svg>
              </div>
            </div>

            <p className="text-base font-bold text-emerald-700">{currency}{finalTotal.toFixed(2)}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{business?.upiId || 'store@upi'}</p>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setShowUpiQrModal(false)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Payment Received
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
