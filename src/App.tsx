/**
 * Bike Workshop & Spare Parts Management Desktop System
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { QuickJobWizard } from './components/QuickJobWizard';
import { CustomerModule } from './components/CustomerModule';
import { BikeModule } from './components/BikeModule';
import { JobCardModule } from './components/JobCardModule';
import { InventoryModule } from './components/InventoryModule';
import { PurchaseModule } from './components/PurchaseModule';
import { BillingModule } from './components/BillingModule';
import { ExpenseModule } from './components/ExpenseModule';
import { ReportsModule } from './components/ReportsModule';
import { SettingsModule } from './components/SettingsModule';
import { PrintableInvoice } from './components/PrintableInvoice';

import { api } from './lib/api';
import type { Invoice, ShopSettings } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [subAction, setSubAction] = useState<string | null>(null);

  // Modals & Overlay States
  const [isQuickWizardOpen, setIsQuickWizardOpen] = useState(false);
  const [activeInvoiceToPrint, setActiveInvoiceToPrint] = useState<Invoice | null>(null);

  // Database & Settings State
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    api.initDb()
      .then(() => {
        if (!isMounted) return;
        setSettings(api.getSettings());
        setSummary(api.getDashboardSummary());
        setIsDbReady(true);
      })
      .catch((err) => {
        console.error('Failed to initialize database:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefreshSettings = () => {
    setSettings(api.getSettings());
  };

  const handleNavigate = (tab: string, sub?: string) => {
    setActiveTab(tab);
    setSubAction(sub || null);
  };

  const handleQuickJobCreated = (invoice?: Invoice) => {
    setIsQuickWizardOpen(false);
    if (invoice) {
      setActiveInvoiceToPrint(invoice);
    } else {
      setActiveTab('jobs');
    }
  };

  useEffect(() => {
    if (!isDbReady) return;
    try {
      const data = api.getDashboardSummary();
      setSummary(data);
    } catch (e) {
      console.error(e);
    }
  }, [activeTab, isDbReady]);

  if (!isDbReady || !settings) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] text-[#423D39] flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="w-12 h-12 border-4 border-[#E67E22] border-t-transparent rounded-full animate-spin" />
          <h2 className="text-xl font-bold text-[#423D39]">Initializing Workshop Database</h2>
          <p className="text-xs text-[#8E8781]">Loading offline SQLite engine and workshop records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#423D39] flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Top Application Navigation Header */}
      <Header
        settings={settings}
        onOpenQuickWizard={() => setIsQuickWizardOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Main Body Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Interactive Sidebar */}
        <Sidebar
          currentModule={activeTab}
          summary={summary}
          onNavigate={(module) => handleNavigate(module)}
        />

        {/* Main Center Content Canvas */}
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            
            {activeTab === 'dashboard' && (
              <Dashboard
                settings={settings}
                onNavigate={handleNavigate}
                onOpenQuickWizard={() => setIsQuickWizardOpen(true)}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerModule
                settings={settings}
                onNavigateToJob={(jobId) => handleNavigate('jobs', `job_${jobId}`)}
                onNavigateToBike={(bikeId) => handleNavigate('bikes', `bike_${bikeId}`)}
              />
            )}

            {activeTab === 'bikes' && (
              <BikeModule settings={settings} />
            )}

            {activeTab === 'jobs' && (
              <JobCardModule
                settings={settings}
                onPrintInvoice={(inv) => setActiveInvoiceToPrint(inv)}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryModule
                settings={settings}
                initialFilter={subAction as any}
              />
            )}

            {activeTab === 'purchases' && (
              <PurchaseModule settings={settings} />
            )}

            {activeTab === 'billing' && (
              <BillingModule
                settings={settings}
                onPrintInvoice={(inv) => setActiveInvoiceToPrint(inv)}
                initialSubAction={subAction || undefined}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseModule settings={settings} />
            )}

            {activeTab === 'reports' && (
              <ReportsModule settings={settings} />
            )}

            {activeTab === 'settings' && (
              <SettingsModule
                settings={settings}
                onSettingsUpdated={handleRefreshSettings}
              />
            )}

          </div>
        </main>
      </div>

      {/* Express Quick Repair Wizard Modal */}
      {isQuickWizardOpen && (
        <QuickJobWizard
          settings={settings}
          onClose={() => setIsQuickWizardOpen(false)}
          onComplete={handleQuickJobCreated}
        />
      )}

      {/* Printable Invoice & Thermal Receipt Modal */}
      {activeInvoiceToPrint && (
        <PrintableInvoice
          invoice={activeInvoiceToPrint}
          settings={settings}
          onClose={() => setActiveInvoiceToPrint(null)}
        />
      )}

    </div>
  );
}
