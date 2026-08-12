/**
 * Bike Workshop Manager - Business Reports & Profitability Analytics
 */

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Wrench,
  Calendar,
  PieChart,
  ArrowUpRight,
  Receipt,
  Wallet
} from 'lucide-react';
import { api } from '../lib/api';
import type { ShopSettings } from '../types';

interface ReportsModuleProps {
  settings: ShopSettings;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ settings }) => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  const summary = api.getDashboardSummary();
  const invoices = api.getInvoices();
  const parts = api.getSpareParts();
  const expenses = api.getExpenses();

  // Calculate Net Profit
  const netProfit = summary.monthlyRevenue - summary.monthlyExpenses;

  // Most Sold Parts Calculation
  const partSalesMap: Record<string, { qty: number; revenue: number }> = {};
  for (const inv of invoices) {
    for (const item of inv.items) {
      if (item.itemType === 'Part') {
        if (!partSalesMap[item.description]) {
          partSalesMap[item.description] = { qty: 0, revenue: 0 };
        }
        partSalesMap[item.description].qty += item.qty;
        partSalesMap[item.description].revenue += item.subtotal;
      }
    }
  }

  const topSoldParts = Object.entries(partSalesMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#423D39] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#E67E22]" /> Business Reports & Profitability
          </h2>
          <p className="text-xs text-[#8E8781]">Financial statements, net profits, top selling spare parts, and inventory value</p>
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-1 bg-[#F7F3F0] p-1 rounded-xl border border-[#EBE3DC] text-xs font-bold">
          {(['today', 'week', 'month', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg capitalize ${
                dateRange === r ? 'bg-[#E67E22] text-white font-bold' : 'text-[#8E8781]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Statement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-[#EBE3DC] p-5 rounded-2xl shadow-sm">
          <div className="text-xs text-[#8E8781] flex items-center justify-between">
            <span>Total Sales Revenue</span>
            <Receipt className="w-4 h-4 text-[#E67E22]" />
          </div>
          <div className="text-2xl font-black text-[#423D39] mt-2">
            {settings.currency} {summary.monthlyRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> Invoices & OTC Sales
          </div>
        </div>

        <div className="bg-white border border-[#EBE3DC] p-5 rounded-2xl shadow-sm">
          <div className="text-xs text-[#8E8781] flex items-center justify-between">
            <span>Operating Expenses</span>
            <Wallet className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {settings.currency} {summary.monthlyExpenses.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#8E8781] mt-1">Shop rent, tea, salaries</div>
        </div>

        <div className="bg-white border border-[#EBE3DC] p-5 rounded-2xl shadow-sm">
          <div className="text-xs text-[#8E8781] flex items-center justify-between">
            <span>Estimated Net Profit</span>
            <TrendingUp className="w-4 h-4 text-[#E67E22]" />
          </div>
          <div className={`text-2xl font-black mt-2 ${netProfit >= 0 ? 'text-[#E67E22]' : 'text-rose-600'}`}>
            {settings.currency} {netProfit.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#E67E22] mt-1">Revenue minus Expenses</div>
        </div>

        <div className="bg-white border border-[#EBE3DC] p-5 rounded-2xl shadow-sm">
          <div className="text-xs text-[#8E8781] flex items-center justify-between">
            <span>Inventory Stock Valuation</span>
            <Package className="w-4 h-4 text-[#E67E22]" />
          </div>
          <div className="text-2xl font-black text-[#423D39] mt-2">
            {settings.currency} {summary.totalInventoryValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#8E8781] mt-1">Cost value of parts in stock</div>
        </div>

      </div>

      {/* Top Selling Parts & Services Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Most Sold Spare Parts */}
        <div className="bg-white border border-[#EBE3DC] p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-[#423D39] text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-[#E67E22]" /> Most Sold Spare Parts
          </h3>

          <div className="space-y-3">
            {topSoldParts.length === 0 ? (
              <div className="text-xs text-[#8E8781] text-center py-4">No parts sales data available yet.</div>
            ) : (
              topSoldParts.map((item, idx) => (
                <div key={idx} className="bg-[#FAF7F5] p-3 rounded-xl border border-[#EBE3DC] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#423D39] text-xs">{item.name}</div>
                    <div className="text-[10px] text-[#8E8781]">Sold: <strong className="text-[#E67E22]">{item.qty} units</strong></div>
                  </div>
                  <div className="text-right text-xs font-mono font-bold text-emerald-700">
                    {settings.currency} {item.revenue.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Repair Job Breakdown */}
        <div className="bg-white border border-[#EBE3DC] p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-[#423D39] text-base flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#E67E22]" /> Workshop Operational Metrics
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F7F3F0] p-4 rounded-xl border border-[#EBE3DC]">
              <div className="text-xs text-[#8E8781]">Total Jobs In Progress</div>
              <div className="text-2xl font-black text-[#E67E22] mt-1">{summary.jobsInProgress}</div>
            </div>

            <div className="bg-[#F7F3F0] p-4 rounded-xl border border-[#EBE3DC]">
              <div className="text-xs text-[#8E8781]">Low Stock Parts Alert</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{summary.lowStockCount}</div>
            </div>

            <div className="bg-[#F7F3F0] p-4 rounded-xl border border-[#EBE3DC]">
              <div className="text-xs text-[#8E8781]">Out of Stock Parts</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{summary.outOfStockCount}</div>
            </div>

            <div className="bg-[#F7F3F0] p-4 rounded-xl border border-[#EBE3DC]">
              <div className="text-xs text-[#8E8781]">Unpaid Supplier Dues</div>
              <div className="text-2xl font-black text-[#423D39] mt-1">
                {settings.currency} {summary.unpaidSupplierDues.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
