import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Phone,
  Search,
  DollarSign,
  Send,
  X,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Customer } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const CustomersView: React.FC = () => {
  const { business, hasPerm } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDueOnly, setFilterDueOnly] = useState<boolean>(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    address: '',
    creditLimit: 5000,
  });

  const [payAmount, setPayAmount] = useState<string>('');
  const [payMode, setPayMode] = useState<string>('Cash');
  const [payNotes, setPayNotes] = useState<string>('');

  const currency = business?.currency || '₹';

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [business?.id]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(newCust);
      setShowAddModal(false);
      setNewCust({ name: '', phone: '', address: '', creditLimit: 5000 });
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Error creating customer');
    }
  };

  const handleOpenPay = (cust: Customer) => {
    setSelectedCust(cust);
    setPayAmount(cust.outstandingBalance.toString());
    setPayMode('Cash');
    setPayNotes('Khata clearance');
    setShowPayModal(true);
  };

  const handleRecordPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || !payAmount) return;

    try {
      await api.payCustomer(selectedCust.id, Number(payAmount), payMode, payNotes);
      setShowPayModal(false);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to record customer payment');
    }
  };

  const handleOpenReminder = (cust: Customer) => {
    setSelectedCust(cust);
    setShowReminderModal(true);
  };

  const totalOutstanding = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);

  const filtered = customers.filter(c => {
    const matchesQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    const matchesDue = !filterDueOnly || c.outstandingBalance > 0;
    return matchesQuery && matchesDue;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Khata Book & Customer Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer credit (Udhar), set credit limits, and record payment recoveries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-right">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Khata Receivables</span>
            <p className="text-sm font-bold text-amber-700">{currency}{totalOutstanding.toLocaleString()}</p>
          </div>

          {hasPerm('MANAGE_CUSTOMERS') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={() => setFilterDueOnly(!filterDueOnly)}
          className={`px-3 py-2 rounded-lg font-semibold border transition-colors whitespace-nowrap ${
            filterDueOnly
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
          }`}
        >
          {filterDueOnly ? 'Showing Debtors Only' : 'Show Outstanding Only'}
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone & Address</th>
                <th className="py-3 px-4 text-center">Credit Limit</th>
                <th className="py-3 px-4 text-right">Khata Balance Due</th>
                <th className="py-3 px-4 text-right">Lifetime Spent</th>
                <th className="py-3 px-4 text-center">Bills Count</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => {
                const hasDue = c.outstandingBalance > 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{c.name}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </p>
                      {c.address && <p className="text-[11px] text-slate-400 truncate max-w-xs">{c.address}</p>}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-500">
                      {currency}{c.creditLimit.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-bold ${hasDue ? 'text-amber-700' : 'text-slate-700'}`}>
                        {currency}{c.outstandingBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {currency}{c.totalSpent.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {c.ordersCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasDue && (
                          <button
                            onClick={() => handleOpenReminder(c)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Send WhatsApp payment reminder"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenPay(c)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition-colors"
                        >
                          Payment In
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add Customer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add Khata Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newCust.name}
                  onChange={e => setNewCust({ ...newCust, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newCust.phone}
                  onChange={e => setNewCust({ ...newCust, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Address / Apartment</label>
                <input
                  type="text"
                  placeholder="e.g. Flat G-12, Sector 15"
                  value={newCust.address}
                  onChange={e => setNewCust({ ...newCust, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Allowed Credit Limit ({currency})</label>
                <input
                  type="number"
                  value={newCust.creditLimit}
                  onChange={e => setNewCust({ ...newCust, creditLimit: parseInt(e.target.value) || 5000 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold focus:outline-hidden"
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Payment In */}
      {showPayModal && selectedCust && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Payment In (Deposit)</h3>
                <p className="text-[11px] text-slate-500">{selectedCust.name} ({selectedCust.phone})</p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPay} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <span>Current Outstanding Due:</span>
                <span className="font-bold text-base text-amber-700">
                  {currency}{selectedCust.outstandingBalance.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount Received ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={e => setPayMode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared monthly kirana dues"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
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

      {/* MODAL: Payment Reminder Simulation */}
      {showReminderModal && selectedCust && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="text-sm font-bold text-slate-900">Khata Due Reminder</h3>
              <button onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Send this customized WhatsApp/SMS reminder to <strong>{selectedCust.name}</strong> ({selectedCust.phone}):
              </p>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-slate-800 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
{`Namaste ${selectedCust.name} ji,\nThis is a friendly reminder from ${business?.name}. Your store khata balance is ${currency}${selectedCust.outstandingBalance.toLocaleString()}.\nKindly pay via UPI: ${business?.upiId || 'store@upi'} or visit our shop at your convenience. Thank you!`}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Namaste ${selectedCust.name} ji, this is a friendly reminder from ${business?.name}. Your khata balance is ${currency}${selectedCust.outstandingBalance.toLocaleString()}. UPI: ${business?.upiId}`);
                    alert('Reminder text copied to clipboard!');
                    setShowReminderModal(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <span>Copy Reminder Text</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
