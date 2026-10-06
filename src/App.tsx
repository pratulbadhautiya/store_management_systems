import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ShopProvider, useShop } from './context/ShopContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/views/DashboardView.tsx';
import { PosView } from './components/views/PosView.tsx';
import { ProductsView } from './components/views/ProductsView.tsx';
import { InventoryView } from './components/views/InventoryView.tsx';
import { PurchasesView } from './components/views/PurchasesView.tsx';
import { SuppliersView } from './components/views/SuppliersView.tsx';
import { CustomersView } from './components/views/CustomersView.tsx';
import { ExpensesView } from './components/views/ExpensesView.tsx';
import { EmployeesView } from './components/views/EmployeesView.tsx';
import { ReportsView } from './components/views/ReportsView.tsx';
import { AuditLogView } from './components/views/AuditLogView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';
import { AiCopilotView } from './components/views/AiCopilotView.tsx';
import { ReceiptModal } from './components/modals/ReceiptModal.tsx';
import { OnboardingModal } from './components/modals/OnboardingModal.tsx';
import { AuthScreen } from './components/modals/AuthScreen.tsx';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeTab } = useShop();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-300">Loading MyShoply Store Workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'pos': return <PosView />;
      case 'products': return <ProductsView />;
      case 'inventory': return <InventoryView />;
      case 'purchases': return <PurchasesView />;
      case 'suppliers': return <SuppliersView />;
      case 'customers': return <CustomersView />;
      case 'expenses': return <ExpensesView />;
      case 'employees': return <EmployeesView />;
      case 'reports': return <ReportsView />;
      case 'audit': return <AuditLogView />;
      case 'settings': return <SettingsView />;
      case 'ai-copilot': return <AiCopilotView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <ReceiptModal />
      <OnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <AppContent />
      </ShopProvider>
    </AuthProvider>
  );
}
