import React, { useState } from 'react';
import {
  CheckCircle2,
  Store,
  Layers,
  Package,
  ShoppingCart,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { api } from '../../services/api.ts';

export const OnboardingModal: React.FC = () => {
  const { business, updateBusinessState } = useAuth();
  const { showOnboardingModal, setShowOnboardingModal, setActiveTab } = useShop();
  const [currentStep, setCurrentStep] = useState<number>(1);

  if (!showOnboardingModal) return null;

  const handleComplete = async () => {
    try {
      if (business) {
        const updated = await api.updateShopSettings({ onboardingCompleted: true });
        updateBusinessState(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setShowOnboardingModal(false);
    }
  };

  const steps = [
    {
      title: 'Store Profile & Identity',
      desc: 'Verify your store business name, address, and GST details',
      icon: Store,
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Your shop workspace is configured as <strong>"{business?.name}"</strong>.
          </p>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <p><strong>Owner:</strong> {business?.ownerName}</p>
            <p><strong>Contact:</strong> {business?.phone || 'Not configured'}</p>
            <p><strong>Address:</strong> {business?.address || 'Main Market Store'}</p>
          </div>
          <p className="text-[11px] text-slate-500">
            This information is automatically imprinted on all generated customer invoices and purchase orders.
          </p>
        </div>
      ),
    },
    {
      title: 'Retail Categories & Catalog',
      desc: 'Organize your store shelves with standard kirana & grocery categories',
      icon: Layers,
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            MyShoply automatically created staple categories for your shop:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <span className="p-2 bg-slate-50 rounded border border-slate-200">Atta, Rice & Grains</span>
            <span className="p-2 bg-slate-50 rounded border border-slate-200">Cooking Oils & Ghee</span>
            <span className="p-2 bg-slate-50 rounded border border-slate-200">Snacks & Biscuits</span>
            <span className="p-2 bg-slate-50 rounded border border-slate-200">Dairy & Bakery</span>
            <span className="p-2 bg-slate-50 rounded border border-slate-200">Cleaning & Household</span>
            <span className="p-2 bg-slate-50 rounded border border-slate-200">Spices & Masalas</span>
          </div>
          <p className="text-[11px] text-slate-500">
            You can add custom categories anytime in the Products module.
          </p>
        </div>
      ),
    },
    {
      title: 'Inventory & Reorder Levels',
      desc: 'Set minimum stock buffers to prevent stockouts during peak retail hours',
      icon: Package,
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Every product in MyShoply tracks <strong>Current Stock</strong> vs <strong>Minimum Buffer Stock</strong>.
          </p>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            When stock falls below your minimum threshold, MyShoply automatically flags the item on your dashboard and prepares restock recommendations.
          </div>
          <p>
            Complete stock movement history is tracked whenever items are purchased, sold, or adjusted.
          </p>
        </div>
      ),
    },
    {
      title: 'Fast POS & Khata Book',
      desc: 'Speed up checkout with keyboard shortcuts and customer credit ledger',
      icon: ShoppingCart,
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            The POS billing module is optimized for keyboard efficiency:
          </p>
          <ul className="space-y-1 font-mono text-[11px]">
            <li>• <strong className="text-slate-900">F2</strong> : Start fresh bill</li>
            <li>• <strong className="text-slate-900">F4</strong> : Select Khata (Udhar) customer</li>
            <li>• <strong className="text-slate-900">F8</strong> : Checkout & Print receipt</li>
            <li>• <strong className="text-slate-900">Ctrl+K</strong> : Search product</li>
          </ul>
          <p className="text-[11px] text-slate-500">
            Supports Cash, dynamic UPI QR codes, Cards, and Khata (Credit) ledgers.
          </p>
        </div>
      ),
    },
    {
      title: 'Staff Roles & Isolation',
      desc: 'Create accounts for Cashiers and Store Managers with strict permission bounds',
      icon: Users,
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Enforce role boundaries across your staff:
          </p>
          <div className="space-y-1.5 text-[11px]">
            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <strong>Cashier:</strong> Can only generate sales and view products. Cannot see store profits or modify purchase prices.
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <strong>Store Manager:</strong> Handles inventory intake and purchase orders.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Meet MyShoply AI Copilot',
      desc: 'Your private store operational manager powered by live business intelligence',
      icon: Sparkles,
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 leading-relaxed">
            <p className="font-bold mb-1">MyShoply AI is ready to assist you!</p>
            <p className="text-[11px]">
              Ask: "What should I restock tomorrow?", "Who owes me money on Khata?", or "Show slow-moving products". It analyzes only your store's verified database.
            </p>
          </div>
          <p className="text-center font-bold text-slate-900 pt-2">
            Your shop is ready for business!
          </p>
        </div>
      ),
    },
  ];

  const current = steps[currentStep - 1];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Step Indicator Top Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
              {currentStep}
            </span>
            <span className="text-xs font-semibold text-slate-700">
              Step {currentStep} of {steps.length}
            </span>
          </div>
          <button onClick={() => setShowOnboardingModal(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{current.title}</h3>
              <p className="text-xs text-slate-500">{current.desc}</p>
            </div>
          </div>

          <div className="pt-2">
            {current.content}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Launch Store OS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
