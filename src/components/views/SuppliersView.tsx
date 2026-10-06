import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  X,
  CreditCard,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Supplier } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const SuppliersView: React.FC = () => {
  const { business, hasPerm } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [newSup, setNewSup] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const currency = business?.currency || '₹';

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [business?.id]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier(newSup);
      setShowAddModal(false);
      setNewSup({ name: '', company: '', phone: '', email: '', address: '', gstin: '' });
      loadSuppliers();
    } catch (err: any) {
      alert(err.message || 'Error creating supplier');
    }
  };

  const handleOpenPay = (sup: Supplier) => {
    setSelectedSupplier(sup);
    setPaymentAmount(sup.outstandingBalance > 0 ? sup.outstandingBalance.toString() : '1000');
    setPaymentMode('Bank Transfer');
    setPaymentNotes('');
    setShowPayModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !paymentAmount) return;

    try {
      await api.paySupplier(selectedSupplier.id, Number(paymentAmount), paymentMode, paymentNotes);
      setShowPayModal(false);
      loadSuppliers();
    } catch (err: any) {
      alert(err.message || 'Failed to record supplier payment');
    }
  };

  const totalOutstanding = suppliers.reduce((acc, s) => acc + (s.outstandingBalance || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Suppliers & FMCG Distributors</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your distributor network, wholesale payables, and payment settlements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-right">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Payables</span>
            <p className="text-sm font-bold text-rose-700">{currency}{totalOutstanding.toLocaleString()}</p>
          </div>

          {hasPerm('MANAGE_SUPPLIERS') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                  <p className="text-xs font-semibold text-slate-500">{s.company}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance Due</span>
                  <span className={`text-sm font-bold ${s.outstandingBalance > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                    {currency}{s.outstandingBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.phone}</span>
                </p>
                {s.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.email}</span>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{s.address || 'Local wholesale market'}</span>
                </p>
                {s.gstin && (
                  <p className="text-[11px] font-mono text-slate-500">GST: {s.gstin}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                {s.productsSuppliedCount || 0} Products Cataloged
              </span>

              {hasPerm('MANAGE_SUPPLIERS') && (
                <button
                  onClick={() => handleOpenPay(s)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Add Supplier */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add Wholesale Supplier</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Aggarwal"
                  value={newSup.name}
                  onChange={e => setNewSup({ ...newSup, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company / Agency Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aggarwal FMCG Distributors"
                  value={newSup.company}
                  onChange={e => setNewSup({ ...newSup, company: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newSup.phone}
                  onChange={e => setNewSup({ ...newSup, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="orders@distributor.com"
                  value={newSup.email}
                  onChange={e => setNewSup({ ...newSup, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Wholesale Market, Phase II"
                  value={newSup.address}
                  onChange={e => setNewSup({ ...newSup, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">GSTIN Number (Optional)</label>
                <input
                  type="text"
                  placeholder="07AAAAA0000A1Z5"
                  value={newSup.gstin}
                  onChange={e => setNewSup({ ...newSup, gstin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Supplier Payment */}
      {showPayModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Supplier Payment</h3>
                <p className="text-[11px] text-slate-500">{selectedSupplier.name} ({selectedSupplier.company})</p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <span>Current Outstanding Debt:</span>
                <span className="font-bold text-base text-rose-700">
                  {currency}{selectedSupplier.outstandingBalance.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Amount ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transaction Ref / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. UTR # 492019482 or Cheque # 104"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
