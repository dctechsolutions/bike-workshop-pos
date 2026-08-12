/**
 * Bike Workshop Manager - Header Component
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  Search,
  Database,
  Download,
  Calendar,
  Clock,
  PlusCircle,
  AlertCircle,
  User,
  Bike as BikeIcon,
  Package,
  FileText,
  X,
  CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api';
import type { SearchResult, ShopSettings } from '../types';

interface HeaderProps {
  settings: ShopSettings;
  onOpenQuickWizard: () => void;
  onNavigate: (module: string) => void;
  onSelectCustomerDetail?: (id: number) => void;
  onSelectJobDetail?: (id: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenQuickWizard,
  onNavigate,
  onSelectCustomerDetail,
  onSelectJobDetail
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      const res = api.globalSearch(val);
      setSearchResults(res);
      setIsSearching(false);
      setShowDropdown(true);
    } else {
      setSearchResults(null);
      setShowDropdown(false);
    }
  };

  const handleQuickBackup = () => {
    try {
      const binary = api.exportDatabaseBinary();
      const blob = new Blob([binary.buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bike_workshop_backup_${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      api.recordBackupLog(`bike_workshop_backup_${new Date().toISOString().split('T')[0]}.db`, binary.length, 'Manual');
      alert('Local SQLite database backup saved successfully!');
    } catch (err: any) {
      alert('Backup failed: ' + err.message);
    }
  };

  const hasResults = searchResults && (
    searchResults.customers.length > 0 ||
    searchResults.bikes.length > 0 ||
    searchResults.jobs.length > 0 ||
    searchResults.parts.length > 0 ||
    searchResults.invoices.length > 0
  );

  return (
    <header className="bg-white border-b border-[#EBE3DC] text-[#423D39] sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-[#E67E22] flex items-center justify-center text-white shadow-md">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-[#423D39] font-sans">{settings.shopName}</h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Database className="w-3 h-3 text-emerald-600" /> Offline Local DB
              </span>
            </div>
            <p className="text-xs text-[#8E8781] hidden sm:block truncate max-w-xs">{settings.subtitle}</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-lg relative" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-[#8E8781] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              onFocus={() => query.length >= 2 && setShowDropdown(true)}
              placeholder="Search Customer, Phone, Reg #, Job #, Part #..."
              className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl pl-9 pr-8 py-1.5 text-sm text-[#423D39] placeholder-[#8E8781] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E67E22] focus:border-[#E67E22] transition-all"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setShowDropdown(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8781] hover:text-[#423D39]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#EBE3DC] rounded-2xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto divide-y divide-[#F5F1EE]">
              {!hasResults && !isSearching && (
                <div className="p-4 text-center text-sm text-[#8E8781]">
                  No matching customer, bike, job, or part found for "{query}".
                </div>
              )}

              {/* Customers */}
              {searchResults?.customers && searchResults.customers.length > 0 && (
                <div className="p-2">
                  <div className="text-[11px] font-semibold text-[#E67E22] uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Customers
                  </div>
                  {searchResults.customers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setShowDropdown(false);
                        onNavigate('customers');
                        if (onSelectCustomerDetail) onSelectCustomerDetail(c.id);
                      }}
                      className="px-3 py-2 hover:bg-[#FAF7F5] rounded-xl cursor-pointer flex justify-between items-center text-sm"
                    >
                      <div>
                        <div className="font-medium text-[#423D39]">{c.name}</div>
                        <div className="text-xs text-[#8E8781]">{c.phone} {c.address && `• ${c.address}`}</div>
                      </div>
                      <span className="text-xs font-semibold text-[#E67E22] bg-[#FEF5ED] px-2 py-0.5 rounded-lg border border-[#E67E22]/20">View History</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bikes */}
              {searchResults?.bikes && searchResults.bikes.length > 0 && (
                <div className="p-2">
                  <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                    <BikeIcon className="w-3 h-3" /> Bikes
                  </div>
                  {searchResults.bikes.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setShowDropdown(false);
                        onNavigate('bikes');
                      }}
                      className="px-3 py-2 hover:bg-[#FAF7F5] rounded-xl cursor-pointer flex justify-between items-center text-sm"
                    >
                      <div>
                        <div className="font-medium text-[#423D39]">{b.company} {b.model} ({b.regNumber})</div>
                        <div className="text-xs text-[#8E8781]">Owner: {b.customerName || 'Customer'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Jobs */}
              {searchResults?.jobs && searchResults.jobs.length > 0 && (
                <div className="p-2">
                  <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> Repair Jobs
                  </div>
                  {searchResults.jobs.map((j) => (
                    <div
                      key={j.id}
                      onClick={() => {
                        setShowDropdown(false);
                        onNavigate('jobs');
                        if (onSelectJobDetail) onSelectJobDetail(j.id);
                      }}
                      className="px-3 py-2 hover:bg-[#FAF7F5] rounded-xl cursor-pointer flex justify-between items-center text-sm"
                    >
                      <div>
                        <div className="font-medium text-[#423D39]">{j.jobNumber} • {j.bikeRegNumber}</div>
                        <div className="text-xs text-[#8E8781]">{j.complaint} ({j.status})</div>
                      </div>
                      <span className="text-xs bg-[#F7F3F0] text-[#423D39] px-2 py-0.5 rounded-lg border border-[#EBE3DC]">{j.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Spare Parts */}
              {searchResults?.parts && searchResults.parts.length > 0 && (
                <div className="p-2">
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                    <Package className="w-3 h-3" /> Spare Parts
                  </div>
                  {searchResults.parts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setShowDropdown(false);
                        onNavigate('inventory');
                      }}
                      className="px-3 py-2 hover:bg-[#FAF7F5] rounded-xl cursor-pointer flex justify-between items-center text-sm"
                    >
                      <div>
                        <div className="font-medium text-[#423D39]">{p.name} ({p.brand})</div>
                        <div className="text-xs text-[#8E8781]">Stock: {p.currentQty} • Location: {p.rackLocation || 'N/A'}</div>
                      </div>
                      <span className="font-bold text-[#E67E22]">{settings.currency} {p.sellingPrice}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions & Date/Time */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Express Job Wizard Trigger Button */}
          <button
            onClick={onOpenQuickWizard}
            className="flex items-center gap-1.5 bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm active:scale-95 transition-all"
            title="Create express repair job card in 1 minute"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Repair Job</span>
          </button>

          {/* Quick Backup Trigger */}
          <button
            onClick={handleQuickBackup}
            className="flex items-center gap-1.5 bg-[#F7F3F0] hover:bg-[#EBE3DC] text-[#423D39] border border-[#EBE3DC] px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            title="Download database backup file immediately"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Backup DB</span>
          </button>

          {/* Clock */}
          <div className="hidden lg:flex flex-col text-right text-xs text-[#8E8781] border-l border-[#EBE3DC] pl-3">
            <span className="flex items-center justify-end gap-1 font-mono text-[#423D39] font-medium">
              <Clock className="w-3 h-3 text-[#E67E22]" />
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[10px] text-[#8E8781]">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
