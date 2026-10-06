import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  ShoppingCart,
  Store,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useShop } from '../context/ShopContext.tsx';

export const Header: React.FC = () => {
  const { user, business } = useAuth();
  const {
    activeTab,
    setActiveTab,
    notifications,
    unreadCount,
    markNotificationRead,
    setShowOnboardingModal,
  } = useShop();
  const [showNotifications, setShowNotifications] = useState(false);

  // Keyboard shortcut listener: F2 for POS Billing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pos');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Shop Executive Dashboard';
      case 'pos': return 'Point of Sale (POS) Billing';
      case 'products': return 'Product Catalog & Inventory';
      case 'inventory': return 'Stock Movements & Reorder Tracking';
      case 'purchases': return 'Purchase Orders & Inward Receiving';
      case 'suppliers': return 'Distributors & Supplier Payables';
      case 'customers': return 'Khata Book & Customer Receivables';
      case 'expenses': return 'Store Operating Expenses';
      case 'employees': return 'Staff Management & Role Permissions';
      case 'reports': return 'Financial Reports & Profit Analytics';
      case 'audit': return 'Operational Audit Log';
      case 'settings': return 'Shop Workspace Settings';
      case 'ai-copilot': return 'MyShoply AI Business Copilot';
      default: return 'MyShoply';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
      {/* Title & Tenant Isolation Badge */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
            {getTabTitle()}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="font-medium text-slate-700">{business?.name}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500">{business?.address?.split(',')[0] || 'Store Workspace'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">Tenant ID: {business?.id}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: POS Shortcut, AI Assistant, Notification Bell */}
      <div className="flex items-center gap-3">
        {/* Quick Fast Billing CTA */}
        {activeTab !== 'pos' && (
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Press F2 anywhere to open POS"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Fast Billing</span>
            <kbd className="bg-emerald-700 text-emerald-100 text-[10px] px-1 py-0.5 rounded font-mono font-normal">F2</kbd>
          </button>
        )}

        {/* AI Copilot Button */}
        {activeTab !== 'ai-copilot' && (
          <button
            onClick={() => setActiveTab('ai-copilot')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors border border-slate-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ask MyShoply AI</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-800">Shop Notifications</span>
                <span className="text-[11px] text-slate-500">{notifications.length} alerts</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No active notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 transition-colors ${n.read ? 'bg-white opacity-70' : 'bg-emerald-50/40'}`}
                      onClick={() => markNotificationRead(n.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-900">{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1"></span>}
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">{n.message}</p>
                      {n.actionLabel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationRead(n.id);
                            if (n.actionUrl) {
                              const tabName = n.actionUrl.replace('/', '');
                              setActiveTab(tabName);
                            }
                            setShowNotifications(false);
                          }}
                          className="mt-2 text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] inline-flex items-center gap-1"
                        >
                          <span>{n.actionLabel}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Guided Setup helper button */}
        <button
          onClick={() => setShowOnboardingModal(true)}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded"
          title="Open guided shop checklist"
        >
          Setup Guide
        </button>
      </div>
    </header>
  );
};
