/**
 * Bike Workshop Manager - Sidebar Component
 * High-contrast, easy-to-read navigation drawer
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Bike as BikeIcon,
  Wrench,
  Package,
  ShoppingCart,
  Truck,
  Receipt,
  DollarSign,
  BarChart3,
  Database,
  Settings
} from 'lucide-react';
import type { DashboardSummary } from '../types';

interface SidebarProps {
  currentModule: string;
  summary: DashboardSummary | null;
  onNavigate: (module: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentModule, summary, onNavigate }) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'jobs',
      label: 'Repair Jobs',
      icon: Wrench,
      badge: summary?.pendingJobsCount ? `${summary.pendingJobsCount} Pending` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'bikes',
      label: 'Bikes',
      icon: BikeIcon,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'inventory',
      label: 'Spare Parts',
      icon: Package,
      badge: (summary?.lowStockCount || summary?.outOfStockCount)
        ? `${(summary?.lowStockCount || 0) + (summary?.outOfStockCount || 0)} Low`
        : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    },
    {
      id: 'billing',
      label: 'Billing & POS',
      icon: Receipt,
      badge: summary?.pendingPaymentsAmount ? `Unpaid` : null,
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    },
    {
      id: 'purchases',
      label: 'Purchases',
      icon: ShoppingCart,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Truck,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: DollarSign,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'backup',
      label: 'Backup & Restore',
      icon: Database,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
      badgeColor: ''
    }
  ];

  return (
    <aside className="w-64 bg-[#3D352E] border-r border-[#524941] text-white flex flex-col shrink-0 select-none shadow-2xl">
      <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                isActive
                  ? 'bg-[#E67E22] text-white font-bold shadow-md'
                  : 'text-[#D5CEC8] hover:bg-[#524941] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#A39A92]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    isActive ? 'bg-[#2D2722] text-[#E67E22] border-[#2D2722]' : 'bg-[#2D2722]/80 text-[#E67E22] border-[#524941]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Offline Status Footer */}
      <div className="p-4 border-t border-[#524941] bg-[#2D2722] text-xs text-[#A39A92]">
        <div className="flex items-center justify-between font-medium">
          <span className="text-[#D5CEC8]">SQLite System</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            100% Offline
          </span>
        </div>
        <div className="text-[10px] text-[#8E8781] mt-1">
          No internet required. Data saved locally.
        </div>
      </div>
    </aside>
  );
};
