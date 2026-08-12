/**
 * Bike Workshop Manager - Billing & POS Direct Sale Module
 */

import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Printer,
  Search,
  X,
  User,
  Bike as BikeIcon,
  Package,
  Trash2,
  CheckCircle2,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import type { Invoice, ShopSettings } from '../types';

interface BillingModuleProps {
  settings: ShopSettings;
  onPrintInvoice: (inv: Invoice) => void;
  initialSubAction?: string;
}

export const BillingModule: React.FC<BillingModuleProps> = ({
  settings,
  onPrintInvoice,
  initialSubAction
}) => {
  const [search, setSearch] = useState('');
  const [isDirectSaleOpen, setIsDirectSaleOpen] = useState(initialSubAction === 'new_sale');

  const invoices = api.getInvoices();
  const customers = api.getCustomers();
  const allParts = api.getSpareParts();

  // Direct OTC Sale Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(customers[0]?.id || 0);
  const [selectedBikeReg, setSelectedBikeReg] = useState('');
  const [saleItems, setSaleItems] = useState<Array<{ partId: number; qty: number; unitPrice: number }>>([]);
  const [partToAdd, setPartToAdd] = useState<number>(allParts[0]?.id || 0);
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Other'>('Cash');

  const filteredInvoices = invoices.filter((i) =>
    i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    (i.customerName && i.customerName.toLowerCase().includes(search.toLowerCase())) ||
    (i.bikeRegNumber && i.bikeRegNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddPart = () => {
    if (!partToAdd) return;
    const pt = allParts.find((p) => p.id === partToAdd);
    if (!pt) return;

    if (pt.currentQty < qtyToAdd && !settings.allowNegativeStock) {
      alert(`Insufficient stock! ${pt.name} only has ${pt.currentQty} in stock.`);
      return;
    }

    const existingIndex = saleItems.findIndex((i) => i.partId === partToAdd);
    if (existingIndex >= 0) {
      const updated = [...saleItems];
      updated[existingIndex].qty += qtyToAdd;
      setSaleItems(updated);
    } else {
      setSaleItems([...saleItems, { partId: partToAdd, qty: qtyToAdd, unitPrice: pt.sellingPrice }]);
    }
  };

  const handleRemovePart = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const partsSubtotal = saleItems.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
  const totalAmount = Math.max(0, partsSubtotal - discount);

  const handleCreateDirectSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || saleItems.length === 0) {
      alert('Please select a customer and add at least 1 spare part.');
      return;
    }

    try {
      const invoiceItems: any[] = [];
      for (const item of saleItems) {
        const pt = allParts.find((p) => p.id === item.partId);
        invoiceItems.push({
          partId: item.partId,
          itemType: 'Part',
          description: pt ? `${pt.name} (${pt.brand})` : 'Spare Part',
          qty: item.qty,
          unitPrice: item.unitPrice
        });
      }

      const inv = api.createInvoice({
        customerId: selectedCustomerId,
        date: new Date().toISOString().split('T')[0],
        items: invoiceItems,
        labourAmount: 0,
        discount,
        paidAmount: paidAmount > 0 ? paidAmount : totalAmount,
        paymentMethod,
        isDirectSale: true
      });

      setIsDirectSaleOpen(false);
      setSaleItems([]);
      onPrintInvoice(inv);
    } catch (err: any) {
      alert('Sale error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#423D39] flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#E67E22]" /> Billing & POS Over-the-Counter Sales
          </h2>
          <p className="text-xs text-[#8E8781]">Generate repair invoices and direct OTC spare parts sales with instant stock reduction</p>
        </div>

        <button
          onClick={() => setIsDirectSaleOpen(true)}
          className="flex items-center gap-2 bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Direct OTC Spare Part Sale
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#8E8781] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoice #, customer, bike reg..."
          className="w-full bg-white border border-[#EBE3DC] rounded-xl pl-9 pr-4 py-2 text-xs text-[#423D39] focus:outline-none focus:border-[#E67E22] shadow-sm"
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-[#EBE3DC] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-[#423D39]">
          <thead className="bg-[#F7F3F0] text-[#8E8781] font-bold uppercase border-b border-[#EBE3DC]">
            <tr>
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Bike Reg</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3 text-right">Subtotal</th>
              <th className="px-3 py-3 text-right">Labour</th>
              <th className="px-3 py-3 text-right">Total Amount</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F1EE]">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[#8E8781]">
                  No invoices found.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#FAF7F5]">
                  <td className="px-4 py-3 font-bold text-[#E67E22] font-mono">{inv.invoiceNumber}</td>
                  <td className="px-3 py-3 font-medium text-[#423D39]">{inv.customerName}</td>
                  <td className="px-3 py-3 font-mono text-blue-600 font-semibold">{inv.bikeRegNumber || 'OTC Direct Sale'}</td>
                  <td className="px-3 py-3 text-[#8E8781]">{inv.date}</td>
                  <td className="px-3 py-3 text-right font-mono">{settings.currency} {inv.subtotal}</td>
                  <td className="px-3 py-3 text-right font-mono text-[#E67E22]">{settings.currency} {inv.labourAmount}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700 text-sm">
                    {settings.currency} {inv.totalAmount}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onPrintInvoice(inv)}
                      className="px-2.5 py-1 bg-[#FAF7F5] hover:bg-[#F7F3F0] text-[#E67E22] font-bold text-xs rounded border border-[#EBE3DC] inline-flex items-center gap-1 shadow-xs"
                    >
                      <Printer className="w-3 h-3" /> Print
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Direct OTC Sale Modal */}
      {isDirectSaleOpen && (
        <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE3DC] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar text-[#423D39]">
            <div className="flex items-center justify-between border-b border-[#EBE3DC] pb-3">
              <h3 className="font-bold text-lg text-[#423D39]">Direct Over-The-Counter Spare Part Sale</h3>
              <button onClick={() => setIsDirectSaleOpen(false)} className="text-[#8E8781] hover:text-[#423D39]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDirectSale} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8E8781]">Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Part to Cart Row */}
              <div className="bg-[#FAF7F5] p-3 rounded-xl border border-[#EBE3DC] space-y-2">
                <label className="text-xs font-bold text-[#E67E22] uppercase tracking-wider">Select Spare Parts</label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={partToAdd}
                    onChange={(e) => setPartToAdd(Number(e.target.value))}
                    className="flex-1 bg-white border border-[#EBE3DC] rounded-lg px-3 py-2 text-xs text-[#423D39]"
                  >
                    {allParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.brand}) - Stock: {p.currentQty} - {settings.currency} {p.sellingPrice}
                      </option>
                    ))}
                  </select>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={qtyToAdd}
                      onChange={(e) => setQtyToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-[#EBE3DC] rounded-lg px-2.5 py-2 text-xs text-[#423D39] text-center"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs"
                  >
                    + Add to Cart
                  </button>
                </div>
              </div>

              {/* Sale Items Table */}
              {saleItems.length > 0 && (
                <div className="border border-[#EBE3DC] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-[#423D39]">
                    <thead className="bg-[#F7F3F0] text-[#8E8781] font-bold uppercase">
                      <tr>
                        <th className="px-3 py-2">Part</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F1EE] bg-white">
                      {saleItems.map((item, idx) => {
                        const pt = allParts.find((p) => p.id === item.partId);
                        return (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-medium text-[#423D39]">{pt?.name || 'Part'}</td>
                            <td className="px-3 py-2 text-center font-bold text-[#E67E22]">{item.qty}</td>
                            <td className="px-3 py-2 text-right">{settings.currency} {item.unitPrice}</td>
                            <td className="px-3 py-2 text-right font-bold">{settings.currency} {item.qty * item.unitPrice}</td>
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => handleRemovePart(idx)} className="text-rose-600 p-1">
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
                  <label className="text-xs font-bold text-[#8E8781]">Discount ({settings.currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-700">Grand Total ({settings.currency})</label>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                    {settings.currency} {totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBE3DC]">
                <button
                  type="button"
                  onClick={() => setIsDirectSaleOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#EBE3DC] text-[#8E8781] text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold text-sm shadow-sm"
                >
                  Create & Print Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
