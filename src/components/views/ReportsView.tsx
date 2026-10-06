import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Printer,
  Calendar,
  CreditCard,
  PieChart,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Sale, Expense } from '../../types/index.ts';

export const ReportsView: React.FC = () => {
  const { business } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeRange, setTimeRange] = useState<string>('this_month');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const currency = business?.currency || '₹';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [salesData, expData] = await Promise.all([
        api.getSales(),
        api.getExpenses(),
      ]);
      setSales(salesData);
      setExpenses(expData);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  // Calculations
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalGrossProfit = sales.reduce((acc, s) => acc + s.profitAmount, 0);
  const totalCogs = Math.max(0, totalRevenue - totalGrossProfit);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalGrossProfit - totalExpenses;
  const grossMargin = totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100).toFixed(1) : '0';
  const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Payment Breakdown
  const paymentTotals: Record<string, number> = {};
  sales.forEach(s => {
    paymentTotals[s.paymentMethod] = (paymentTotals[s.paymentMethod] || 0) + s.totalAmount;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Reports & Profit Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Store Profit & Loss statement, revenue breakdowns, and operating margins
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* P&L Financial Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Profit & Loss Statement (P&L)</h3>
            <p className="text-xs text-slate-500">Consolidated financial overview for {business?.name}</p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Realized Net Margin: {netMargin}%
          </span>
        </div>

        <div className="space-y-4 text-xs">
          {/* Revenue */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 font-semibold text-slate-800">
            <span className="text-sm">Total Gross Revenue (Sales)</span>
            <span className="text-sm font-bold text-slate-900">{currency}{totalRevenue.toFixed(2)}</span>
          </div>

          {/* COGS */}
          <div className="flex items-center justify-between px-3 text-slate-600">
            <span>Less: Cost of Goods Sold (Wholesale Purchase Cost)</span>
            <span className="font-semibold text-slate-700">- {currency}{totalCogs.toFixed(2)}</span>
          </div>

          {/* Gross Profit */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50/70 border border-teal-100 font-bold text-teal-950">
            <div className="flex items-center gap-2">
              <span className="text-sm">Gross Profit</span>
              <span className="text-xs font-semibold text-teal-700 font-mono">({grossMargin}% Gross Margin)</span>
            </div>
            <span className="text-base text-teal-800">{currency}{totalGrossProfit.toFixed(2)}</span>
          </div>

          {/* Operating Expenses */}
          <div className="flex items-center justify-between px-3 text-slate-600">
            <span>Less: Store Operating Expenses (Rent, Power, Salaries)</span>
            <span className="font-semibold text-rose-700">- {currency}{totalExpenses.toFixed(2)}</span>
          </div>

          {/* Net Profit */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white font-bold">
            <div>
              <span className="text-sm block">Net Shop Profit (Take-Home)</span>
              <span className="text-[11px] font-normal text-slate-400">Actual earnings after inventory and store overheads</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-400">{currency}{netProfit.toFixed(2)}</span>
              <span className="text-[11px] block font-semibold text-slate-400">{netMargin}% net profit margin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Channel Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Sales by Payment Mode</h3>
          <p className="text-xs text-slate-500 mb-4">Cash flow channels across all completed transactions</p>

          <div className="space-y-3 text-xs">
            {Object.entries(paymentTotals).map(([mode, amt]) => {
              const pct = totalRevenue > 0 ? ((amt / totalRevenue) * 100).toFixed(1) : '0';
              return (
                <div key={mode} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">{mode}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{currency}{amt.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block">{pct}% of revenue</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operating Overhead Ratio */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Store Expense Health</h3>
          <p className="text-xs text-slate-500 mb-4">Overhead ratio vs revenue generation</p>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600">Total Recorded Overheads</span>
              <span className="font-bold text-slate-900">{currency}{totalExpenses.toFixed(2)}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600">Expense-to-Revenue Ratio</span>
              <span className="font-bold text-slate-900">
                {totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0}%
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-slate-700 text-[11px] leading-relaxed">
              <strong>Shopkeeper Tip:</strong> Keeping overheads below 15-18% of gross revenue maintains strong cash flow in Kirana and grocery retail.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
