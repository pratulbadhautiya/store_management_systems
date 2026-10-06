import React, { useState } from 'react';
import {
  Settings,
  Store,
  Save,
  CheckCircle,
  Building2,
  Shield,
  QrCode,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { api } from '../../services/api.ts';

export const SettingsView: React.FC = () => {
  const { business, updateBusinessState, hasPerm } = useAuth();
  const { setShowOnboardingModal } = useShop();

  const [formData, setFormData] = useState({
    name: business?.name || '',
    ownerName: business?.ownerName || '',
    phone: business?.phone || '',
    address: business?.address || '',
    gstin: business?.gstin || '',
    upiId: business?.upiId || '',
    currency: business?.currency || '₹',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const updated = await api.updateShopSettings(formData);
      updateBusinessState(updated);
      setSuccessMsg('Shop settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Shop Workspace Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure store identity, printed receipt header, GST credentials, and UPI payments
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tenant Isolation Info Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 text-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Tenant Workspace</span>
          <p className="font-mono text-sm font-bold text-white mt-0.5">{business?.id}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Data isolation guarantee: All sales, inventory, and AI interactions are strictly bounded to this tenant.
          </p>
        </div>
        <button
          onClick={() => setShowOnboardingModal(true)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
        >
          Re-open Setup Guide
        </button>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Store / Business Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Primary Owner Name *</label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Store Contact Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Store GSTIN Number</label>
              <input
                type="text"
                placeholder="07AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono text-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Shop Address (Printed on Receipts)</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">UPI ID for POS QR Payments</label>
              <input
                type="text"
                placeholder="storename@okhdfcbank"
                value={formData.upiId}
                onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Generates instantaneous QR codes on POS billing screen.</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Currency Symbol</label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !hasPerm('MANAGE_SETTINGS')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Store Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
