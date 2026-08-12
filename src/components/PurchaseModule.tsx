/**
 * Bike Workshop Manager - Supplier Purchases & Stock Receiving Module
 */

import React, { useState } from 'react';
import {
  ShoppingCart,
  Truck,
  Plus,
  Trash2,
  X,
  Phone,
  Building,
  CheckCircle2,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { api } from '../lib/api';
import type { Supplier, Purchase, ShopSettings } from '../types';

interface PurchaseModuleProps {
  settings: ShopSettings;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');

  const suppliers = api.getSuppliers();
  const purchases = api.getPurchases();
  const allParts = api.getSpareParts();

  // New Purchase Modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(suppliers[0]?.id || 0);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Purchase items
  const [purchaseItems, setPurchaseItems] = useState<Array<{ partId: number; qty: number; unitPrice: number }>>([]);
  const [itemPartId, setItemPartId] = useState<number>(allParts[0]?.id || 0);
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemCost, setItemCost] = useState<number>(allParts[0]?.purchasePrice || 100);

  // New Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supCompany, setSupCompany] = useState('');
  const [supAddress, setSupAddress] = useState('');

  const handleAddItem = () => {
    if (!itemPartId || itemQty <= 0) return;
    const existingIdx = purchaseItems.findIndex((i) => i.partId === itemPartId);
    if (existingIdx >= 0) {
      const updated = [...purchaseItems];
      updated[existingIdx].qty += itemQty;
      setPurchaseItems(updated);
    } else {
      setPurchaseItems([...purchaseItems, { partId: itemPartId, qty: itemQty, unitPrice: itemCost }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const totalPurchaseCost = purchaseItems.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || purchaseItems.length === 0) {
      alert('Please select a supplier and add at least 1 spare part.');
      return;
    }

    try {
      api.createPurchase({
        supplierId: selectedSupplierId,
        date: purchaseDate,
        items: purchaseItems,
        paidAmount,
        notes
      });

      setIsPurchaseModalOpen(false);
      setPurchaseItems([]);
      alert('Stock purchase recorded! Inventory quantities automatically increased.');
    } catch (err: any) {
      alert('Purchase error: ' + err.message);
    }
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supPhone) {
      alert('Name and Phone number are required.');
      return;
    }

    api.addSupplier({
      name: supName,
      phone: supPhone,
      company: supCompany,
      address: supAddress
    });

    setIsSupplierModalOpen(false);
    setSupName('');
    setSupPhone('');
    setSupCompany('');
    setSupAddress('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#423D39] flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#E67E22]" /> Purchases & Supplier Ledger
          </h2>
          <p className="text-xs text-[#8E8781]">Receive stock from suppliers, update purchase costs, and increase inventory automatically</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F7F3F0] p-1 rounded-xl border border-[#EBE3DC] text-xs font-bold">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-3 py-1.5 rounded-lg ${activeTab === 'purchases' ? 'bg-[#E67E22] text-white font-bold' : 'text-[#8E8781]'}`}
            >
              Purchases
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 rounded-lg ${activeTab === 'suppliers' ? 'bg-[#E67E22] text-white font-bold' : 'text-[#8E8781]'}`}
            >
              Suppliers
            </button>
          </div>

          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="flex items-center gap-2 bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-sm"
          >
            <PackageCheck className="w-4 h-4" /> Receive Purchase
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: PURCHASES HISTORY */}
      {activeTab === 'purchases' ? (
        <div className="bg-white border border-[#EBE3DC] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-[#423D39]">
            <thead className="bg-[#F7F3F0] text-[#8E8781] font-bold uppercase border-b border-[#EBE3DC]">
              <tr>
                <th className="px-4 py-3">Purchase #</th>
                <th className="px-3 py-3">Supplier</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Items Purchased</th>
                <th className="px-3 py-3 text-right">Total Amount</th>
                <th className="px-3 py-3 text-right">Paid Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F1EE]">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#8E8781]">
                    No purchases recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF7F5]">
                    <td className="px-4 py-3 font-bold text-[#E67E22] font-mono">{p.purchaseNumber}</td>
                    <td className="px-3 py-3 font-medium text-[#423D39]">{p.supplierName}</td>
                    <td className="px-3 py-3 text-[#8E8781]">{p.date}</td>
                    <td className="px-3 py-3 text-[#423D39]">
                      {p.items.map((i) => `${i.partName} x${i.qty}`).join(', ')}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-[#423D39] font-mono">
                      {settings.currency} {p.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-700 font-mono font-bold">
                      {settings.currency} {p.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          p.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* VIEW TAB 2: SUPPLIERS LEDGER */
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#EBE3DC] shadow-sm">
            <div>
              <h3 className="font-bold text-[#423D39] text-base">Registered Wholesale Suppliers</h3>
              <p className="text-xs text-[#8E8781]">Manage supplier contacts and unpaid balances</p>
            </div>
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm"
            >
              + New Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div key={s.id} className="bg-white border border-[#EBE3DC] rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-[#423D39] text-lg">{s.name}</h4>
                    <div className="text-xs text-[#8E8781] flex items-center gap-1 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-[#E67E22]" /> {s.company || 'Wholesale Supplier'}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#E67E22] bg-[#FAF7F5] border border-[#EBE3DC] px-2 py-0.5 rounded">
                    <Phone className="w-3 h-3 inline mr-1 text-[#E67E22]" /> {s.phone}
                  </span>
                </div>

                <div className="bg-[#F7F3F0] p-3 rounded-xl border border-[#EBE3DC] text-xs flex justify-between items-center">
                  <span className="text-[#8E8781]">Outstanding Balance</span>
                  <span className="text-rose-600 font-bold text-sm">
                    {settings.currency} {s.outstandingBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE3DC] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar text-[#423D39]">
            <div className="flex items-center justify-between border-b border-[#EBE3DC] pb-3">
              <h3 className="font-bold text-lg text-[#423D39]">Record Stock Purchase from Supplier</h3>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-[#8E8781] hover:text-[#423D39]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#8E8781]">Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.company || 'Supplier'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8781]">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                />
              </div>
            </div>

            {/* Add Item Row */}
            <div className="bg-[#FAF7F5] p-3 rounded-xl border border-[#EBE3DC] space-y-2">
              <label className="text-xs font-bold text-[#E67E22] uppercase tracking-wider">Select Parts to Buy</label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <select
                    value={itemPartId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setItemPartId(id);
                      const p = allParts.find((pt) => pt.id === id);
                      if (p) setItemCost(p.purchasePrice);
                    }}
                    className="w-full bg-white border border-[#EBE3DC] rounded-lg px-2.5 py-1.5 text-xs text-[#423D39]"
                  >
                    {allParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.brand})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-[#EBE3DC] rounded-lg px-2.5 py-1.5 text-xs text-[#423D39] text-center"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs"
                >
                  + Add Item
                </button>
              </div>
            </div>

            {/* Purchased Items List Table */}
            {purchaseItems.length > 0 && (
              <div className="border border-[#EBE3DC] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-[#423D39]">
                  <thead className="bg-[#F7F3F0] text-[#8E8781] font-bold uppercase">
                    <tr>
                      <th className="px-3 py-2">Part</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Cost Price</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F1EE] bg-white">
                    {purchaseItems.map((item, idx) => {
                      const pt = allParts.find((p) => p.id === item.partId);
                      return (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium text-[#423D39]">{pt?.name || 'Part'}</td>
                          <td className="px-3 py-2 text-center font-bold text-[#E67E22]">+{item.qty}</td>
                          <td className="px-3 py-2 text-right">{settings.currency} {item.unitPrice}</td>
                          <td className="px-3 py-2 text-right font-bold">{settings.currency} {item.qty * item.unitPrice}</td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => handleRemoveItem(idx)} className="text-rose-600 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-[#8E8781]">Amount Paid ({settings.currency})</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-emerald-700 font-bold focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div className="text-right">
                <div className="text-xs text-[#8E8781]">Grand Total Purchase</div>
                <div className="text-xl font-extrabold text-[#E67E22] mt-1">
                  {settings.currency} {totalPurchaseCost.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBE3DC]">
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#EBE3DC] text-[#8E8781] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePurchase}
                className="px-5 py-2 rounded-xl bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold text-sm shadow-sm"
              >
                Save & Increase Inventory Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE3DC] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-[#423D39]">
            <div className="flex items-center justify-between border-b border-[#EBE3DC] pb-3">
              <h3 className="font-bold text-lg text-[#423D39]">Add New Supplier</h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-[#8E8781] hover:text-[#423D39]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#8E8781]">Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Auto Traders"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8781]">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0300-4411223"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8781]">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Parts Ltd"
                  value={supCompany}
                  onChange={(e) => setSupCompany(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBE3DC]">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#EBE3DC] text-[#8E8781] text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold text-sm shadow-sm"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
