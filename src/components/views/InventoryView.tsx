import React, { useState, useEffect } from 'react';
import {
  Layers,
  AlertTriangle,
  History,
  Plus,
  Minus,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  X,
  PackageCheck,
  CheckCircle2
} from 'lucide-react';
import { Product, InventoryMovement } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const InventoryView: React.FC = () => {
  const { business, hasPerm } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'STOCK' | 'MOVEMENTS'>('STOCK');

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'ADJUSTMENT' | 'DAMAGE' | 'RETURN'>('ADJUSTMENT');
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('Physical stock audit count discrepancy');

  const currency = business?.currency || '₹';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, movs] = await Promise.all([
        api.getProducts(),
        api.getInventoryMovements(),
      ]);
      setProducts(prods);
      setMovements(movs);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const handleOpenAdjust = (product: Product) => {
    setSelectedProduct(product);
    setAdjustDelta(1);
    setAdjustType('ADJUSTMENT');
    setAdjustReason('Periodic physical count audit discrepancy');
    setShowAdjustModal(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await api.adjustStock(
        selectedProduct.id,
        adjustType === 'DAMAGE' ? -Math.abs(adjustDelta) : adjustDelta,
        adjustType,
        adjustReason
      );
      setShowAdjustModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  // Calculations
  const totalCostValuation = products.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + (p.currentStock * p.sellingPrice), 0);
  const lowStockItems = products.filter(p => p.currentStock <= p.minStock);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.includes(searchQuery)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Inventory & Stock Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock valuation, reorder thresholds, and movement ledger
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'STOCK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Current Stock ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'MOVEMENTS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Movement Audit Timeline
          </button>
        </div>
      </div>

      {/* Valuation Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Inventory Valuation (Cost Basis)</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {currency}{totalCostValuation.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">Total working capital tied in stock</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Potential Retail Realization</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {currency}{totalRetailValuation.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            Projected Margin: {totalRetailValuation > 0 ? (((totalRetailValuation - totalCostValuation) / totalRetailValuation) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Low & Out-of-Stock Items</span>
          <p className={`text-2xl font-bold mt-1 ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {lowStockItems.length} Products
          </p>
          <span className="text-[11px] text-slate-400">Items below minimum safety threshold</span>
        </div>
      </div>

      {activeTab === 'STOCK' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={loadData}
              className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              title="Refresh stock"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">SKU / Barcode</th>
                    <th className="py-3 px-4 text-center">Safety Min</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Stock Valuation</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => {
                    const isLow = p.currentStock <= p.minStock && p.currentStock > 0;
                    const isOut = p.currentStock <= 0;
                    const val = p.currentStock * p.purchasePrice;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-[11px] text-slate-500">{p.categoryName}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">
                          {p.minStock} {p.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                            {p.currentStock} {p.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">
                          {currency}{p.purchasePrice}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {currency}{val.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isOut ? (
                            <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              Optimal
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {hasPerm('MANAGE_INVENTORY') && (
                            <button
                              onClick={() => handleOpenAdjust(p)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md border border-slate-300 transition-colors"
                            >
                              Adjust
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Movement Audit Timeline */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Inventory Movement Timeline</h3>
            <p className="text-xs text-slate-500">
              Audit trail of every stock modification from sales, purchase intake, and physical count adjustments
            </p>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Qty Change</th>
                  <th className="py-3 px-4 text-center">Prev → New</th>
                  <th className="py-3 px-4">Reason / Reference</th>
                  <th className="py-3 px-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map(m => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {m.productName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[11px] text-slate-700">
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {m.previousStock} → <span className="font-semibold text-slate-900">{m.newStock}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {m.reason} {m.referenceId ? `(#${m.referenceId})` : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {m.createdBy}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Stock Adjustment */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stock Adjustment</h3>
                <p className="text-[11px] text-slate-500">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <span>Current Recorded Stock:</span>
                <span className="font-bold text-base text-slate-900">
                  {selectedProduct.currentStock} {selectedProduct.unit}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Adjustment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADJUSTMENT')}
                    className={`p-2 rounded-lg border font-semibold text-center ${
                      adjustType === 'ADJUSTMENT' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Count Audit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DAMAGE')}
                    className={`p-2 rounded-lg border font-semibold text-center ${
                      adjustType === 'DAMAGE' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Damage / Spoil
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('RETURN')}
                    className={`p-2 rounded-lg border font-semibold text-center ${
                      adjustType === 'RETURN' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Return In
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {adjustType === 'DAMAGE' ? 'Quantity Damaged / Deducted' : 'Quantity to Add / Adjust'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustDelta}
                  onChange={e => setAdjustDelta(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason / Note for Audit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken packaging discovered during shelf check"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
