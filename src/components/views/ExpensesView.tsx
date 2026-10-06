import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  PieChart,
  Tag,
  X
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const ExpensesView: React.FC = () => {
  const { business, hasPerm } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'ELECTRICITY' as ExpenseCategory,
    amount: '',
    paymentMode: 'UPI',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const currency = business?.currency || '₹';

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [business?.id]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    try {
      await api.createExpense({
        title: formData.title,
        category: formData.category,
        amount: Number(formData.amount),
        paymentMode: formData.paymentMode,
        date: formData.date,
        notes: formData.notes,
      });

      setShowAddModal(false);
      setFormData({
        title: '',
        category: 'ELECTRICITY',
        amount: '',
        paymentMode: 'UPI',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Error recording expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(id);
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Store Operating Expenses</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track rent, utility bills, employee wages, transport, and operating overheads
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-right">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Expenses</span>
            <p className="text-sm font-bold text-slate-900">{currency}{totalExpense.toLocaleString()}</p>
          </div>

          {hasPerm('MANAGE_EXPENSES') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {Object.entries(categoryTotals).map(([cat, amt]) => (
          <div key={cat} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{cat}</span>
            <p className="text-base font-bold text-slate-900 mt-1">{currency}{amt.toLocaleString()}</p>
            <span className="text-[10px] text-slate-500">
              {totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(0) : 0}% of expenses
            </span>
          </div>
        ))}
      </div>

      {/* Expenses Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense records found. Click "Record Expense" to log overheads.
                  </td>
                </tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {e.title}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {e.category}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {currency}{e.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {e.paymentMode}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {e.date}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {e.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasPerm('MANAGE_EXPENSES') && (
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record Expense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Record Store Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop Rent for Oct or BSES Electricity"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                >
                  <option value="RENT">Rent</option>
                  <option value="ELECTRICITY">Electricity & Power</option>
                  <option value="SALARY">Staff Salaries</option>
                  <option value="TRANSPORT">Transportation & Freight</option>
                  <option value="PACKAGING">Packaging Materials</option>
                  <option value="MAINTENANCE">Shop Maintenance</option>
                  <option value="INTERNET">Internet & Software</option>
                  <option value="MARKETING">Marketing & Signage</option>
                  <option value="OTHER">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                <select
                  value={formData.paymentMode}
                  onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Expense Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Receipt number or payee details"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
