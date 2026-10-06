import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Truck,
  CheckCircle,
  Clock,
  PackageCheck,
  Search,
  X,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PurchaseOrder, Supplier, Product } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const PurchasesView: React.FC = () => {
  const { business, hasPerm } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [poNotes, setPoNotes] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');

  const currency = business?.currency || '₹';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pos, sups, prods] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts(),
      ]);
      setPurchases(pos);
      setSuppliers(sups);
      setProducts(prods);
      if (sups.length > 0) setSelectedSupplierId(sups[0].id);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const handleOpenCreate = () => {
    // default with one product line
    if (products.length > 0) {
      setPoItems([
        {
          productId: products[0].id,
          quantity: 20,
          unitPrice: products[0].purchasePrice,
        },
      ]);
    }
    setShowCreateModal(true);
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setPoItems(prev => [
      ...prev,
      {
        productId: products[0].id,
        quantity: 10,
        unitPrice: products[0].purchasePrice,
      },
    ]);
  };

  const handleUpdateItemRow = (index: number, field: string, val: any) => {
    setPoItems(prev => {
      const updated = [...prev];
      if (field === 'productId') {
        const prod = products.find(p => p.id === val);
        updated[index].productId = val;
        if (prod) updated[index].unitPrice = prod.purchasePrice;
      } else if (field === 'quantity') {
        updated[index].quantity = Math.max(1, parseInt(val) || 1);
      } else if (field === 'unitPrice') {
        updated[index].unitPrice = parseFloat(val) || 0;
      }
      return updated;
    });
  };

  const handleRemoveItemRow = (index: number) => {
    setPoItems(prev => prev.filter((_, i) => i !== index));
  };

  const poTotalAmount = poItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup || poItems.length === 0) return;

    try {
      const items = poItems.map(item => {
        const prod = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          productName: prod ? prod.name : 'Item',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        };
      });

      await api.createPurchase({
        supplierId: sup.id,
        supplierName: sup.name,
        items,
        totalAmount: poTotalAmount,
        notes: poNotes,
        expectedDeliveryDate: deliveryDate,
      });

      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create PO');
    }
  };

  const handleReceivePO = async (poId: string, poNumber: string) => {
    if (!confirm(`Confirm goods receipt for PO #${poNumber}? Store inventory will automatically be increased.`)) return;
    try {
      await api.receivePurchase(poId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to receive PO');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders & Inward Receiving</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Procure goods from distributors, manage PO lifecycles, and auto-update stock
          </p>
        </div>

        {hasPerm('MANAGE_PURCHASES') && (
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        )}
      </div>

      {/* PO List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-right">Order Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Date Created</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No purchase orders recorded yet. Click "Create Purchase Order" to restock.
                  </td>
                </tr>
              ) : (
                purchases.map(po => {
                  const isReceived = po.status === 'RECEIVED';
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {po.poNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {po.supplierName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {po.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {currency}{po.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isReceived ? (
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            Received
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Ordered (Pending)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isReceived && hasPerm('MANAGE_PURCHASES') && (
                          <button
                            onClick={() => handleReceivePO(po.id, po.poNumber)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1 ml-auto"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Receive Goods</span>
                          </button>
                        )}
                        {isReceived && (
                          <span className="text-slate-400 text-[11px] font-medium">Stock Updated</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create Purchase Order */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create Purchase Order</h3>
                <p className="text-[11px] text-slate-500">Generate purchase order for wholesale distributor</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.company})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">Order Items</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                  {poItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <select
                        value={item.productId}
                        onChange={e => handleUpdateItemRow(index, 'productId', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-hidden"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Cur: {p.currentStock})</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1 w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => handleUpdateItemRow(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-1 w-28">
                        <span className="text-slate-500">{currency}</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Cost"
                          value={item.unitPrice}
                          onChange={e => handleUpdateItemRow(index, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-semibold"
                        />
                      </div>

                      <span className="w-24 text-right font-bold text-slate-800">
                        {currency}{(item.quantity * item.unitPrice).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-right">
                  <span className="text-slate-500 mr-2">Total PO Amount:</span>
                  <span className="text-base font-bold text-slate-900">{currency}{poTotalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Order Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions for the distributor..."
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
