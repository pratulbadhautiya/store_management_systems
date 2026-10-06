import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Check,
  ChevronDown,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Product, Category, Supplier } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const ProductsView: React.FC = () => {
  const { business, hasPerm } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Modal State
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brand: '',
    unit: 'packet',
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    taxRate: 0,
    currentStock: 0,
    minStock: 10,
    maxStock: 100,
    supplierId: '',
    expiryDate: '',
  });

  const currency = business?.currency || '₹';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats, sups] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getSuppliers(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSuppliers(sups);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      categoryId: categories[0]?.id || '',
      brand: '',
      unit: 'packet',
      purchasePrice: 0,
      sellingPrice: 0,
      mrp: 0,
      taxRate: 0,
      currentStock: 10,
      minStock: 10,
      maxStock: 100,
      supplierId: suppliers[0]?.id || '',
      expiryDate: '',
    });
    setShowProductModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: product.categoryId,
      brand: product.brand,
      unit: product.unit,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      mrp: product.mrp,
      taxRate: product.taxRate,
      currentStock: product.currentStock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      supplierId: product.supplierId || '',
      expiryDate: product.expiryDate || '',
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === formData.categoryId);
    const sup = suppliers.find(s => s.id === formData.supplierId);

    const payload = {
      ...formData,
      categoryName: cat ? cat.name : 'General',
      supplierName: sup ? sup.name : undefined,
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setShowProductModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error deleting product');
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['Name,SKU,Barcode,Category,Unit,Cost,Price,MRP,Stock,MinStock'];
    const rows = products.map(p =>
      `"${p.name}","${p.sku}","${p.barcode}","${p.categoryName}","${p.unit}",${p.purchasePrice},${p.sellingPrice},${p.mrp},${p.currentStock},${p.minStock}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${business?.name.replace(/\s+/g, '_')}_products.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter products
  const filtered = products.filter(p => {
    const matchCat = selectedCat === 'ALL' || p.categoryId === selectedCat;
    const matchQuery =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());

    let matchStock = true;
    if (stockFilter === 'LOW') matchStock = p.currentStock <= p.minStock && p.currentStock > 0;
    if (stockFilter === 'OUT') matchStock = p.currentStock <= 0;

    return matchCat && matchQuery && matchStock;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Products Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your store's inventory items, pricing, margins, and barcodes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {hasPerm('MANAGE_PRODUCTS') && (
            <button
              onClick={openCreateModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, brand, or barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-hidden"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Stock Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                stockFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('LOW')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                stockFilter === 'LOW' ? 'bg-amber-500 text-white shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('OUT')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                stockFilter === 'OUT' ? 'bg-rose-600 text-white shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">MRP</th>
                <th className="py-3 px-4 text-right">Margin</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const marginPercent = p.sellingPrice > 0
                    ? (((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100).toFixed(1)
                    : '0';
                  const isLow = p.currentStock <= p.minStock && p.currentStock > 0;
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                            <span>SKU: {p.sku}</span>
                            <span>·</span>
                            <span>Barcode: {p.barcode}</span>
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-600">{p.categoryName}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        {currency}{p.purchasePrice}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {currency}{p.sellingPrice}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {currency}{p.mrp}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${Number(marginPercent) >= 15 ? 'text-emerald-700' : 'text-slate-600'}`}>
                          {marginPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                            {p.currentStock} {p.unit}
                          </span>
                          {isLow && <span className="text-[10px] text-amber-600">Min: {p.minStock}</span>}
                          {isOut && <span className="text-[10px] text-rose-600">Restock!</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasPerm('MANAGE_PRODUCTS') && (
                            <>
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                                title="Edit product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Archive product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add / Edit Product */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingProduct ? 'Edit Product Details' : 'Add New Store Product'}
                </h3>
                <p className="text-[11px] text-slate-500">All pricing and barcode fields are shop-isolated</p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aashirvaad Chakki Atta 10kg"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Barcode (EAN-13 / UPC)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                  >
                    <option value="packet">Packet / Pouch</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="bottle">Bottle</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="box">Box / Carton</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Purchase / Wholesale Cost ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchasePrice}
                    onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Selling Price ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-emerald-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">MRP ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mrp}
                    onChange={e => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">GST Tax Rate (%)</label>
                  <select
                    value={formData.taxRate}
                    onChange={e => setFormData({ ...formData, taxRate: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Current Stock ({formData.unit})</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={e => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Reorder Alert Threshold</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Primary Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                  >
                    <option value="">No Supplier Assigned</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.company})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
