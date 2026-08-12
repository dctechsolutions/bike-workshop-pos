/**
 * Bike Workshop Manager - Dashboard Component
 */

import React from 'react';
import {
  Wrench,
  UserPlus,
  Bike as BikeIcon,
  PackagePlus,
  Receipt,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  PackageX,
  FileCheck
} from 'lucide-react';
import type { DashboardSummary, ShopSettings } from '../types';

interface DashboardProps {
  summary: DashboardSummary | null;
  settings: ShopSettings;
  onNavigate: (module: string, subAction?: string) => void;
  onOpenQuickWizard: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  settings,
  onNavigate,
  onOpenQuickWizard
}) => {
  if (!summary) return null;

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome & Quick Workflow Launch */}
      <div className="bg-[#3D352E] text-white border border-[#524941] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#E67E22]/20 text-[#E67E22] border border-[#E67E22]/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Clock className="w-3.5 h-3.5" /> Workshop Live Desk
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {settings.shopName}
            </h2>
            <p className="text-sm text-[#D5CEC8] mt-1 max-w-xl">
              Quickly manage incoming bikes, repair job cards, spare parts inventory, and printable POS bills without internet connection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenQuickWizard}
              className="flex items-center gap-2 bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-5 py-3 rounded-xl shadow-md active:scale-95 transition-all text-sm"
            >
              <Wrench className="w-5 h-5" />
              <span>Express Repair Wizard</span>
            </button>
            <button
              onClick={() => onNavigate('billing', 'new_sale')}
              className="flex items-center gap-2 bg-[#524941] hover:bg-[#635a51] text-white font-semibold px-4 py-3 rounded-xl text-sm transition-all"
            >
              <Receipt className="w-5 h-5 text-[#E67E22]" />
              <span>Direct Spare Part Sale</span>
            </button>
          </div>
        </div>
      </div>

      {/* TODAY'S SUMMARY CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-widest font-semibold text-[#8E8781] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#E67E22]" /> Today's Workshop Summary
          </h3>
          <span className="text-xs text-[#8E8781] font-mono">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-[#EBE3DC] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <BikeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#423D39]">{summary.bikesReceivedToday}</div>
              <div className="text-sm text-[#8E8781]">Bikes Received</div>
            </div>
          </div>

          <div className="bg-white border border-[#EBE3DC] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEF5ED] border border-[#E67E22]/20 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-[#E67E22]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#E67E22]">{summary.bikesInProgress}</div>
              <div className="text-sm text-[#8E8781]">Bikes In Progress</div>
            </div>
          </div>

          <div className="bg-white border border-[#EBE3DC] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
              <FileCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.bikesReady}</div>
              <div className="text-sm text-[#8E8781]">Bikes Ready</div>
            </div>
          </div>

          <div className="bg-white border border-[#EBE3DC] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#423D39]">{summary.bikesDeliveredToday}</div>
              <div className="text-sm text-[#8E8781]">Delivered Today</div>
            </div>
          </div>

          <div className="bg-white border border-[#EBE3DC] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEF5ED] border border-[#E67E22]/20 flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6 text-[#E67E22]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#E67E22]">{settings.currency} {summary.todaySales.toLocaleString()}</div>
              <div className="text-sm text-[#8E8781]">Today's Sales</div>
            </div>
          </div>

          <div className="bg-white border border-[#EBE3DC] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEF5ED] border border-[#E67E22]/20 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-[#E67E22]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#E67E22]">{settings.currency} {summary.todayLabourCharges.toLocaleString()}</div>
              <div className="text-sm text-[#8E8781]">Labour Income</div>
            </div>
          </div>

          <div className="bg-white border border-[#EBE3DC] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-red-500">{settings.currency} {summary.todayExpenses.toLocaleString()}</div>
              <div className="text-sm text-[#8E8781]">Expenses</div>
            </div>
          </div>

          <div className="bg-white border border-[#EBE3DC] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
              summary.todayNetAmount >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
            }`}>
              <TrendingUp className={`w-6 h-6 ${summary.todayNetAmount >= 0 ? 'text-emerald-600' : 'text-red-500'}`} />
            </div>
            <div>
              <div className={`text-xl font-bold ${summary.todayNetAmount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {settings.currency} {summary.todayNetAmount.toLocaleString()}
              </div>
              <div className="text-sm text-[#8E8781]">Net Profit</div>
            </div>
          </div>

        </div>
      </div>

      {/* QUICK ACTIONS BUTTONS */}
      <div>
        <h3 className="text-xs uppercase tracking-widest font-semibold text-[#8E8781] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          
          <button
            onClick={onOpenQuickWizard}
            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-transparent hover:border-[#E67E22] shadow-sm rounded-xl text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FEF5ED] flex items-center justify-center text-[#E67E22] mb-2 group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#423D39] group-hover:text-[#E67E22]">New Repair Job</span>
          </button>

          <button
            onClick={() => onNavigate('customers', 'add')}
            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-transparent hover:border-[#E67E22] shadow-sm rounded-xl text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FEF5ED] flex items-center justify-center text-[#E67E22] mb-2 group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#423D39] group-hover:text-[#E67E22]">Add Customer</span>
          </button>

          <button
            onClick={() => onNavigate('bikes', 'add')}
            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-transparent hover:border-[#E67E22] shadow-sm rounded-xl text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FEF5ED] flex items-center justify-center text-[#E67E22] mb-2 group-hover:scale-110 transition-transform">
              <BikeIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#423D39] group-hover:text-[#E67E22]">Add Bike</span>
          </button>

          <button
            onClick={() => onNavigate('inventory', 'add')}
            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-transparent hover:border-[#E67E22] shadow-sm rounded-xl text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FEF5ED] flex items-center justify-center text-[#E67E22] mb-2 group-hover:scale-110 transition-transform">
              <PackagePlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#423D39] group-hover:text-[#E67E22]">Add Spare Part</span>
          </button>

          <button
            onClick={() => onNavigate('billing', 'new_sale')}
            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-transparent hover:border-[#E67E22] shadow-sm rounded-xl text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FEF5ED] flex items-center justify-center text-[#E67E22] mb-2 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#423D39] group-hover:text-[#E67E22]">Create Bill</span>
          </button>

          <button
            onClick={() => onNavigate('purchases', 'add')}
            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-transparent hover:border-[#E67E22] shadow-sm rounded-xl text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FEF5ED] flex items-center justify-center text-[#E67E22] mb-2 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#423D39] group-hover:text-[#E67E22]">Add Purchase</span>
          </button>

          <button
            onClick={() => onNavigate('expenses', 'add')}
            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-transparent hover:border-[#E67E22] shadow-sm rounded-xl text-center transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FEF5ED] flex items-center justify-center text-[#E67E22] mb-2 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#423D39] group-hover:text-[#E67E22]">Add Expense</span>
          </button>

        </div>
      </div>

      {/* ALERTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Low Stock Alert */}
        <div
          onClick={() => onNavigate('inventory', 'low_stock')}
          className="bg-white border border-[#EBE3DC] hover:border-[#E67E22] rounded-2xl p-4 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-[#E67E22]">
              <AlertTriangle className="w-4 h-4" /> Low Stock Items
            </div>
            <span className="text-xs bg-[#FEF5ED] text-[#E67E22] border border-[#E67E22]/30 px-2 py-0.5 rounded-full font-bold">
              {summary.lowStockCount}
            </span>
          </div>
          <p className="text-xs text-[#8E8781] mt-2">
            {summary.lowStockCount > 0
              ? `${summary.lowStockCount} items below minimum stock threshold.`
              : 'All inventory items are well-stocked.'}
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-[#E67E22] group-hover:underline gap-1">
            View Low Stock Parts <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Out of Stock Alert */}
        <div
          onClick={() => onNavigate('inventory', 'out_of_stock')}
          className="bg-white border border-[#EBE3DC] hover:border-rose-400 rounded-2xl p-4 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-red-500">
              <PackageX className="w-4 h-4" /> Out of Stock
            </div>
            <span className="text-xs bg-rose-50 text-red-600 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
              {summary.outOfStockCount}
            </span>
          </div>
          <p className="text-xs text-[#8E8781] mt-2">
            {summary.outOfStockCount > 0
              ? `${summary.outOfStockCount} parts completely out of stock!`
              : 'No parts are currently out of stock.'}
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-red-500 group-hover:underline gap-1">
            Manage Inventory <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Pending Jobs */}
        <div
          onClick={() => onNavigate('jobs')}
          className="bg-white border border-[#EBE3DC] hover:border-blue-400 rounded-2xl p-4 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-blue-600">
              <Clock className="w-4 h-4" /> Pending Jobs
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
              {summary.pendingJobsCount}
            </span>
          </div>
          <p className="text-xs text-[#8E8781] mt-2">
            {summary.pendingJobsCount > 0
              ? `${summary.pendingJobsCount} repair jobs awaiting completion.`
              : 'All repair jobs have been delivered!'}
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-blue-600 group-hover:underline gap-1">
            Open Job Cards <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Pending Payments */}
        <div
          onClick={() => onNavigate('billing')}
          className="bg-white border border-[#EBE3DC] hover:border-[#E67E22] rounded-2xl p-4 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-[#E67E22]">
              <AlertCircle className="w-4 h-4" /> Pending Payments
            </div>
            <span className="text-xs bg-[#FEF5ED] text-[#E67E22] border border-[#E67E22]/30 px-2 py-0.5 rounded-full font-bold">
              {settings.currency} {summary.pendingPaymentsAmount.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-[#8E8781] mt-2">
            Uncollected balance from customer bills.
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-[#E67E22] group-hover:underline gap-1">
            View Pending Invoices <ArrowRight className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* GUIDED WORKFLOW GUIDE FOR NON-TECHNICAL WORKERS */}
      <div className="bg-white border border-[#EBE3DC] rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs uppercase tracking-widest font-semibold text-[#8E8781] mb-3 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[#E67E22]" /> Standard Workshop Flow
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs text-[#423D39]">
          <div className="p-3 bg-[#F7F3F0] rounded-xl border border-[#EBE3DC]">
            <div className="font-bold text-[#E67E22] mb-1">1. Customer Arrives</div>
            <div className="text-[11px] text-[#8E8781]">Search existing or add new</div>
          </div>
          <div className="p-3 bg-[#F7F3F0] rounded-xl border border-[#EBE3DC]">
            <div className="font-bold text-[#E67E22] mb-1">2. Select Bike</div>
            <div className="text-[11px] text-[#8E8781]">Reg # & mileage</div>
          </div>
          <div className="p-3 bg-[#F7F3F0] rounded-xl border border-[#EBE3DC]">
            <div className="font-bold text-[#E67E22] mb-1">3. Create Job Card</div>
            <div className="text-[11px] text-[#8E8781]">Record complaints</div>
          </div>
          <div className="p-3 bg-[#F7F3F0] rounded-xl border border-[#EBE3DC]">
            <div className="font-bold text-[#E67E22] mb-1">4. Add Parts & Labour</div>
            <div className="text-[11px] text-[#8E8781]">Auto stock deduction</div>
          </div>
          <div className="p-3 bg-[#F7F3F0] rounded-xl border border-[#EBE3DC]">
            <div className="font-bold text-[#E67E22] mb-1">5. Generate Bill</div>
            <div className="text-[11px] text-[#8E8781]">Apply discount & cash</div>
          </div>
          <div className="p-3 bg-[#FEF5ED] rounded-xl border border-[#E67E22]/30">
            <div className="font-bold text-emerald-600 mb-1">6. Deliver & Print</div>
            <div className="text-[11px] text-[#8E8781]">Save complete history</div>
          </div>
        </div>
      </div>

    </div>
  );
};
