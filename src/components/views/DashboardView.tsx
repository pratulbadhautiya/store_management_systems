import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Users,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  Plus,
  Clock,
  ExternalLink,
  ChevronRight,
  Layers
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { BusinessInsight } from '../../types/index.ts';

export const DashboardView: React.FC = () => {
  const { business } = useAuth();
  const { setActiveTab } = useShop();
  const [timeRange, setTimeRange] = useState<string>('today');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboard = async (range: string) => {
    setIsLoading(true);
    try {
      const res = await api.getDashboard(range);
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(timeRange);
  }, [timeRange, business?.id]);

  const currency = business?.currency || '₹';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Greeting, Time Range Filters, Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {business?.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business performance & inventory intelligence
          </p>
        </div>

        {/* Time Filter Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'this_month', label: 'This Month' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeRange === t.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => fetchDashboard(timeRange)}
            title="Refresh metrics"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded transition-colors ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Sales Revenue</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {currency}{data?.totalSalesRevenue ? data.totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{data?.transactionCount || 0} Bills Generated</span>
            <span>Avg {currency}{data?.avgOrderValue ? Math.round(data.avgOrderValue) : 0}</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Gross Profit</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-700 tracking-tight">
              {currency}{data?.totalGrossProfit ? data.totalGrossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
            {data?.totalSalesRevenue > 0 && (
              <span className="text-xs font-semibold text-emerald-600">
                {((data.totalGrossProfit / data.totalSalesRevenue) * 100).toFixed(1)}% margin
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Net Profit: {currency}{data?.netProfit ? data.netProfit.toFixed(0) : '0'}</span>
            <span>Expenses: {currency}{data?.totalExpensesAmount || 0}</span>
          </div>
        </div>

        {/* Inventory Value & Stock Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Inventory Value</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {currency}{data?.totalInventoryValueCost ? data.totalInventoryValueCost.toLocaleString() : '0'}
            </span>
            <span className="text-xs text-slate-500">at cost</span>
          </div>
          <div className="mt-2 text-[11px] flex items-center justify-between">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`font-semibold hover:underline flex items-center gap-1 ${
                data?.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-500'
              }`}
            >
              {data?.lowStockCount > 0 ? (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  <span>{data.lowStockCount} Low Stock</span>
                </>
              ) : (
                <span>Stock levels normal</span>
              )}
            </button>
            <span className="text-slate-400">Retail: {currency}{data?.totalInventoryValueRetail ? data.totalInventoryValueRetail.toLocaleString() : '0'}</span>
          </div>
        </div>

        {/* Khata Receivables & Supplier Payables */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Khata & Payables</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Customer Udhar</p>
              <p className="text-lg font-bold text-slate-900">
                {currency}{data?.totalCustomerReceivables ? data.totalCustomerReceivables.toLocaleString() : '0'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Supplier Debt</p>
              <p className="text-lg font-bold text-slate-900">
                {currency}{data?.totalSupplierPayables ? data.totalSupplierPayables.toLocaleString() : '0'}
              </p>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <button onClick={() => setActiveTab('customers')} className="text-indigo-600 hover:underline">
              View Khata
            </button>
            <button onClick={() => setActiveTab('suppliers')} className="text-indigo-600 hover:underline">
              View Suppliers
            </button>
          </div>
        </div>
      </div>

      {/* AI-POWERED SMART BUSINESS INSIGHTS */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl p-5 border border-emerald-800/40 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">MyShoply AI Business Intelligence</h3>
              <p className="text-[11px] text-emerald-300/80">
                Automated recommendations derived from your live store sales and stock numbers
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('ai-copilot')}
            className="text-xs font-semibold text-emerald-300 hover:text-white flex items-center gap-1 bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-700/50 transition-colors"
          >
            <span>Open AI Chat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Insight Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data?.insights && data.insights.length > 0 ? (
            data.insights.map((ins: BusinessInsight) => (
              <div
                key={ins.id}
                className="bg-slate-800/80 backdrop-blur-xs border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-emerald-500/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white truncate">{ins.title}</span>
                    {ins.urgency === 'HIGH' && (
                      <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">
                        Action Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    {ins.description}
                  </p>
                </div>

                {ins.actionLabel && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{ins.metric}</span>
                    <button
                      onClick={() => ins.actionTab && setActiveTab(ins.actionTab)}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <span>{ins.actionLabel}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-xs text-slate-400">
              Analyzing store trends... insights will appear as transactions accumulate.
            </div>
          )}
        </div>
      </div>

      {/* Velocity Grid: Top Selling Products vs Slow Moving Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-Selling Products */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top-Selling Products</h3>
              <p className="text-xs text-slate-500">Highest velocity items driving your daily revenue</p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              Full Sales Report
            </button>
          </div>

          <div className="space-y-3">
            {data?.topSelling && data.topSelling.length > 0 ? (
              data.topSelling.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-xs font-bold text-slate-400 text-center">#{idx + 1}</span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-900">{currency}{item.revenue.toFixed(2)}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">{item.unitsSold} units sold</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No sales recorded for this period yet.</p>
            )}
          </div>
        </div>

        {/* Slow-Moving / Dead Stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Slow-Moving Inventory Alert</h3>
              <p className="text-xs text-slate-500">Stock tied up with minimal sales in the last 30 days</p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              Manage Stock
            </button>
          </div>

          <div className="space-y-3">
            {data?.slowMoving && data.slowMoving.length > 0 ? (
              data.slowMoving.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/40 border border-amber-100/60"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.currentStock} units remaining · Zero recent movement
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-amber-900">
                      {currency}{item.stockValue.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-amber-700 font-medium">Tied Capital</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No dead stock identified.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Dock */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-700">Quick Store Operations:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open POS Billing (F2)</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Product</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stock Adjustment</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Record Store Expense</span>
          </button>
        </div>
      </div>
    </div>
  );
};
