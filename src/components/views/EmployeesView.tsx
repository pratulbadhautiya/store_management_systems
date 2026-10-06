import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Check,
  X,
  Mail,
  Phone
} from 'lucide-react';
import { User as EmployeeUser, UserRole } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const EmployeesView: React.FC = () => {
  const { business, user: currentUser, hasPerm } = useAuth();
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CASHIER' as UserRole,
    password: 'password123',
  });

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [business?.id]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEmployee(newStaff);
      setShowAddModal(false);
      setNewStaff({ name: '', email: '', phone: '', role: 'CASHIER', password: 'password123' });
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Error creating employee account');
    }
  };

  const handleToggleActive = async (emp: EmployeeUser) => {
    if (emp.id === currentUser?.id) {
      alert('You cannot deactivate your own active session account.');
      return;
    }
    try {
      await api.updateEmployee(emp.id, { active: !emp.active });
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to update employee status');
    }
  };

  const permissionMatrix: { module: string; owner: boolean; manager: boolean; cashier: boolean; invManager: boolean; accountant: boolean }[] = [
    { module: 'View Dashboard & KPIs', owner: true, manager: true, cashier: false, invManager: true, accountant: true },
    { module: 'Create Sales / POS Billing', owner: true, manager: true, cashier: true, invManager: false, accountant: false },
    { module: 'Manage Products & Prices', owner: true, manager: true, cashier: false, invManager: true, accountant: false },
    { module: 'Manage Stock & Adjustments', owner: true, manager: true, cashier: false, invManager: true, accountant: false },
    { module: 'Create & Receive Purchases (PO)', owner: true, manager: true, cashier: false, invManager: true, accountant: false },
    { module: 'Suppliers & Payment Settlement', owner: true, manager: true, cashier: false, invManager: true, accountant: true },
    { module: 'Customer Khata Credit & Payments', owner: true, manager: true, cashier: true, invManager: false, accountant: true },
    { module: 'Store Expenses & Overheads', owner: true, manager: true, cashier: false, invManager: false, accountant: true },
    { module: 'Financial & Profit (P&L) Reports', owner: true, manager: true, cashier: false, invManager: false, accountant: true },
    { module: 'Use MyShoply AI Copilot', owner: true, manager: true, cashier: false, invManager: true, accountant: true },
    { module: 'Staff Accounts & RBAC Config', owner: true, manager: false, cashier: false, invManager: false, accountant: false },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Management & Role Permissions (RBAC)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Grant secure granular role-based access for store managers, cashiers, and inventory clerks
          </p>
        </div>

        {hasPerm('MANAGE_EMPLOYEES') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Staff Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{emp.name}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{emp.email}</span>
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                  emp.role === 'OWNER' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  emp.role === 'MANAGER' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  emp.role === 'CASHIER' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  'bg-slate-100 text-slate-800 border-slate-200'
                }`}>
                  {emp.role}
                </span>
              </div>

              {emp.phone && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{emp.phone}</span>
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className={`font-semibold ${emp.active ? 'text-emerald-700' : 'text-slate-400'}`}>
                {emp.active ? '● Active Access' : '○ Deactivated'}
              </span>

              {hasPerm('MANAGE_EMPLOYEES') && emp.role !== 'OWNER' && (
                <button
                  onClick={() => handleToggleActive(emp)}
                  className="text-slate-500 hover:text-slate-800 font-medium"
                >
                  {emp.active ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900">Security & Permission Matrix</h3>
          <p className="text-xs text-slate-500">
            Enforced server-side on every API request. A cashier or manager can never modify prices, financial reports, or access other shop workspaces.
          </p>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-2.5 px-4">Action / Feature Module</th>
                <th className="py-2.5 px-4 text-center">Owner</th>
                <th className="py-2.5 px-4 text-center">Store Manager</th>
                <th className="py-2.5 px-4 text-center">Cashier</th>
                <th className="py-2.5 px-4 text-center">Inventory Mgr</th>
                <th className="py-2.5 px-4 text-center">Accountant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-4 font-medium text-slate-800">{row.module}</td>
                  <td className="py-2 px-4 text-center">
                    {row.owner ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-2 px-4 text-center">
                    {row.manager ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-2 px-4 text-center">
                    {row.cashier ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-2 px-4 text-center">
                    {row.invManager ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-2 px-4 text-center">
                    {row.accountant ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add Staff Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add Staff Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Singh"
                  value={newStaff.name}
                  onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email / Username *</label>
                <input
                  type="email"
                  required
                  placeholder="vikram@sharma.in"
                  value={newStaff.email}
                  onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 98101 22334"
                  value={newStaff.phone}
                  onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assigned Role</label>
                <select
                  value={newStaff.role}
                  onChange={e => setNewStaff({ ...newStaff, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                >
                  <option value="CASHIER">Cashier (POS billing only)</option>
                  <option value="MANAGER">Store Manager (POS, Inventory, Purchases)</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager (Stock & POs)</option>
                  <option value="ACCOUNTANT">Accountant (Expenses, Khata, Reports)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={newStaff.password}
                  onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-hidden"
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
