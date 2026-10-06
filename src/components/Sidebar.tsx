import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  ShoppingBag,
  Truck,
  Users,
  CreditCard,
  UserCheck,
  BarChart3,
  Sparkles,
  History,
  Settings,
  Store,
  ChevronDown,
  LogOut,
  Building2,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useShop } from '../context/ShopContext.tsx';

export const Sidebar: React.FC = () => {
  const { user, business, logout, switchDemoTenant, hasPerm } = useAuth();
  const { activeTab, setActiveTab, setIsAiDrawerOpen, unreadCount } = useShop();
  const [showTenantMenu, setShowTenantMenu] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'VIEW_DASHBOARD' },
    { id: 'pos', label: 'POS Billing (F2)', icon: ShoppingCart, perm: 'CREATE_SALE', highlight: true },
    { id: 'products', label: 'Products', icon: Package, perm: 'MANAGE_PRODUCTS' },
    { id: 'inventory', label: 'Inventory', icon: Layers, perm: 'MANAGE_INVENTORY' },
    { id: 'purchases', label: 'Purchases (PO)', icon: ShoppingBag, perm: 'MANAGE_PURCHASES' },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, perm: 'MANAGE_SUPPLIERS' },
    { id: 'customers', label: 'Khata / Customers', icon: Users, perm: 'MANAGE_CUSTOMERS' },
    { id: 'expenses', label: 'Expenses', icon: CreditCard, perm: 'MANAGE_EXPENSES' },
    { id: 'employees', label: 'Staff & Roles', icon: UserCheck, perm: 'MANAGE_EMPLOYEES' },
    { id: 'reports', label: 'Reports & P&L', icon: BarChart3, perm: 'VIEW_FINANCIAL_REPORTS' },
    { id: 'audit', label: 'Audit Log', icon: History, perm: 'VIEW_DASHBOARD' },
    { id: 'settings', label: 'Shop Settings', icon: Settings, perm: 'MANAGE_SETTINGS' },
  ];

  const filteredNav = navItems.filter(item => !item.perm || hasPerm(item.perm));

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header & Active Shop Switcher */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-lg shadow-sm">
            M
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-tight leading-none flex items-center gap-1.5">
              MyShoply
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                SaaS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Shop Business OS</p>
          </div>
        </div>

        {/* Tenant selector card */}
        <div className="relative">
          <button
            onClick={() => setShowTenantMenu(!showTenantMenu)}
            className="w-full flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-lg text-left transition-colors border border-slate-700/60"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Store className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{business?.name || 'Loading shop...'}</p>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <span>{user?.name}</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-medium">{user?.role}</span>
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {showTenantMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 text-xs">
              <div className="px-3 py-1.5 font-medium text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
                Switch Tenant Workspace
              </div>
              <button
                onClick={() => {
                  switchDemoTenant('sharma');
                  setShowTenantMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-700/60 flex items-center justify-between transition-colors"
              >
                <div>
                  <p className="font-medium text-white">Sharma General Store</p>
                  <p className="text-[10px] text-slate-400">Delhi · Grocery & Kirana</p>
                </div>
                {business?.id.includes('sharma') && user?.role === 'OWNER' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>

              <button
                onClick={() => {
                  switchDemoTenant('green');
                  setShowTenantMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-700/60 flex items-center justify-between transition-colors"
              >
                <div>
                  <p className="font-medium text-white">Green Basket Supermarket</p>
                  <p className="text-[10px] text-slate-400">Mumbai · Mini Supermarket</p>
                </div>
                {business?.id.includes('green') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>

              <div className="px-3 py-1.5 font-medium text-[10px] uppercase tracking-wider text-slate-400 border-t border-slate-700/50">
                Test Role-Based Access
              </div>
              <button
                onClick={() => {
                  switchDemoTenant('sharma-cashier');
                  setShowTenantMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700/60 flex items-center gap-2 text-slate-300"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Cashier Mode (Vikram Singh)</span>
              </button>
              <button
                onClick={() => {
                  switchDemoTenant('sharma-manager');
                  setShowTenantMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-700/60 flex items-center gap-2 text-slate-300"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Store Manager (Anita Sharma)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Business Copilot Quick Action */}
      <div className="px-3 pt-3">
        <button
          onClick={() => setActiveTab('ai-copilot')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
            activeTab === 'ai-copilot'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-950/40'
              : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
          <div className="flex-1 text-left">
            <div className="leading-tight">MyShoply AI Copilot</div>
            <div className="text-[10px] font-normal text-emerald-400/80">Business intelligence</div>
          </div>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {filteredNav.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              } ${item.highlight && !isActive ? 'text-emerald-400 font-semibold' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.highlight && (
                <span className="text-[9px] uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                  POS
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs">
          <div className="truncate mr-2">
            <p className="font-semibold text-slate-300 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
