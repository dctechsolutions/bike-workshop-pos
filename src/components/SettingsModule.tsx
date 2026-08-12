/**
 * Bike Workshop Manager - Shop Configuration & Offline SQLite Backup Module
 */

import React, { useState } from 'react';
import {
  Settings,
  Store,
  Printer,
  Database,
  Download,
  Upload,
  RefreshCw,
  Save,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { api } from '../lib/api';
import type { ShopSettings } from '../types';

interface SettingsModuleProps {
  settings: ShopSettings;
  onSettingsUpdated: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, onSettingsUpdated }) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [terms, setTerms] = useState(settings.terms);
  const [currency, setCurrency] = useState(settings.currency);
  const [defaultLabourCost, setDefaultLabourCost] = useState(settings.defaultLabourCost);
  const [invoicePrintFormat, setInvoicePrintFormat] = useState<'thermal_80mm' | 'a4_full'>(
    settings.invoicePrintFormat || 'thermal_80mm'
  );
  const [allowNegativeStock, setAllowNegativeStock] = useState(settings.allowNegativeStock);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    api.saveSettings({
      shopName,
      tagline,
      phone,
      address,
      terms,
      currency,
      defaultLabourCost,
      invoicePrintFormat,
      allowNegativeStock
    });

    onSettingsUpdated();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleBackup = () => {
    try {
      const dataStr = api.exportBackup();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bike_Workshop_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('Offline database backup exported successfully!');
    } catch (err: any) {
      alert('Backup failed: ' + err.message);
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        api.importBackup(content);
        alert('Database restored successfully! Reloading...');
        window.location.reload();
      } catch (err: any) {
        alert('Restore failed: Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('WARNING: Are you sure you want to reset database to initial sample data? All unsaved data will be overwritten.')) {
      api.resetDatabase();
      alert('Database reset to fresh state! Reloading...');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#423D39] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#E67E22]" /> Shop Settings & Database Backup
          </h2>
          <p className="text-xs text-[#8E8781]">Configure receipt headers, currencies, default labour charges, and offline data backups</p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4" /> Settings Saved!
          </span>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Shop Information Section */}
        <div className="bg-white border border-[#EBE3DC] rounded-2xl p-6 space-y-4 shadow-sm text-[#423D39]">
          <h3 className="font-extrabold text-[#423D39] text-base flex items-center gap-2 border-b border-[#EBE3DC] pb-3">
            <Store className="w-5 h-5 text-[#E67E22]" /> Workshop & Receipt Branding
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#8E8781]">Shop Name *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3.5 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E8781]">Tagline / Subtitle</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3.5 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E8781]">Contact Phone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3.5 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E8781]">Currency Symbol / Text</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3.5 py-2 text-sm font-bold text-[#E67E22] focus:outline-none focus:bg-white mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#8E8781]">Shop Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3.5 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#8E8781]">Invoice Terms & Conditions Footer</label>
            <textarea
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3.5 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
            />
          </div>
        </div>

        {/* Operational & Printing Preferences */}
        <div className="bg-white border border-[#EBE3DC] rounded-2xl p-6 space-y-4 shadow-sm text-[#423D39]">
          <h3 className="font-extrabold text-[#423D39] text-base flex items-center gap-2 border-b border-[#EBE3DC] pb-3">
            <Printer className="w-5 h-5 text-[#E67E22]" /> Operational & Thermal Printing Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#8E8781]">Default Tuning & Labour Cost ({currency})</label>
              <input
                type="number"
                min="0"
                value={defaultLabourCost}
                onChange={(e) => setDefaultLabourCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3.5 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E8781]">Invoice Layout Format</label>
              <select
                value={invoicePrintFormat}
                onChange={(e) => setInvoicePrintFormat(e.target.value as any)}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3.5 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
              >
                <option value="thermal_80mm">Thermal Receipt Printer (80mm)</option>
                <option value="a4_full">Standard Full Sheet (A4 / Letter)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#FAF7F5] p-3.5 rounded-xl border border-[#EBE3DC]">
            <input
              type="checkbox"
              id="negStock"
              checked={allowNegativeStock}
              onChange={(e) => setAllowNegativeStock(e.target.checked)}
              className="w-4 h-4 rounded bg-white border-[#EBE3DC] text-[#E67E22] focus:ring-0"
            />
            <label htmlFor="negStock" className="text-xs text-[#423D39] font-medium cursor-pointer">
              Allow selling spare parts even if stock quantity is zero (Allow negative stock count)
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#E67E22] hover:bg-[#d5701a] text-white font-extrabold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Shop Settings
            </button>
          </div>
        </div>

      </form>

      {/* OFFLINE DATABASE BACKUP & RESTORE SECTION (SECTION 20) */}
      <div className="bg-white border border-[#EBE3DC] rounded-2xl p-6 space-y-4 shadow-sm text-[#423D39]">
        <h3 className="font-extrabold text-[#423D39] text-base flex items-center gap-2 border-b border-[#EBE3DC] pb-3">
          <Database className="w-5 h-5 text-[#E67E22]" /> Local Database Backup & Disaster Recovery
        </h3>
        <p className="text-xs text-[#8E8781]">
          All data is stored locally in your offline SQLite database. Keep your business safe by regularly creating backups.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          
          {/* Backup Button */}
          <button
            onClick={handleBackup}
            className="flex flex-col items-center justify-center p-5 bg-[#FAF7F5] border border-[#EBE3DC] hover:border-[#E67E22]/50 rounded-xl space-y-2 transition-all group"
          >
            <Download className="w-6 h-6 text-[#E67E22] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[#423D39] text-sm">Backup Database</span>
            <span className="text-[10px] text-[#8E8781] text-center">Export offline file backup</span>
          </button>

          {/* Restore Button */}
          <label className="flex flex-col items-center justify-center p-5 bg-[#FAF7F5] border border-[#EBE3DC] hover:border-[#E67E22]/50 rounded-xl space-y-2 transition-all cursor-pointer group">
            <Upload className="w-6 h-6 text-[#E67E22] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[#423D39] text-sm">Restore Database</span>
            <span className="text-[10px] text-[#8E8781] text-center">Import from JSON file</span>
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>

          {/* Reset Database Button */}
          <button
            onClick={handleResetData}
            className="flex flex-col items-center justify-center p-5 bg-[#FAF7F5] border border-[#EBE3DC] hover:border-rose-300 rounded-xl space-y-2 transition-all group"
          >
            <RefreshCw className="w-6 h-6 text-rose-600 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-rose-600 text-sm">Reset Sample Data</span>
            <span className="text-[10px] text-[#8E8781] text-center">Re-seed clean demo records</span>
          </button>

        </div>
      </div>

    </div>
  );
};
