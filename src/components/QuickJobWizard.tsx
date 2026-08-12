/**
 * Bike Workshop Manager - Express Job & Invoice Wizard
 * Fast 1-page wizard for non-technical shop mechanics
 */

import React, { useState } from 'react';
import {
  Wrench,
  X,
  User,
  Bike as BikeIcon,
  Package,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import type { Customer, Bike, SparePart, ShopSettings, Invoice } from '../types';

interface QuickJobWizardProps {
  settings: ShopSettings;
  onClose: () => void;
  onJobCreated: () => void;
  onPrintInvoice: (inv: Invoice) => void;
}

export const QuickJobWizard: React.FC<QuickJobWizardProps> = ({
  settings,
  onClose,
  onJobCreated,
  onPrintInvoice
}) => {
  const customers = api.getCustomers();
  const allParts = api.getSpareParts();

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(customers[0]?.id || null);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);

  // Bikes for selected customer
  const customerBikes = selectedCustomerId ? api.getBikes(selectedCustomerId) : [];
  const [selectedBikeId, setSelectedBikeId] = useState<number | null>(customerBikes[0]?.id || null);
  const [newRegNum, setNewRegNum] = useState('');
  const [newCompany, setNewCompany] = useState('Honda');
  const [newModel, setNewModel] = useState('CD 70');
  const [isAddingNewBike, setIsAddingNewBike] = useState(false);

  // Job details
  const [complaint, setComplaint] = useState('General Tuning & Oil Change');
  const [mechanic, setMechanic] = useState('Master Mechanic');
  const [labourDescription, setLabourDescription] = useState('Tuning & Service Labour');
  const [labourCost, setLabourCost] = useState<number>(500);

  // Selected Parts
  const [selectedParts, setSelectedParts] = useState<Array<{ partId: number; qty: number; unitPrice: number }>>([]);
  const [partToAdd, setPartToAdd] = useState<number>(allParts[0]?.id || 0);
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);

  // Discount & Payment
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Other'>('Cash');

  // Handle adding part
  const handleAddPart = () => {
    if (!partToAdd) return;
    const partObj = allParts.find((p) => p.id === partToAdd);
    if (!partObj) return;

    if (partObj.currentQty < qtyToAdd && !settings.allowNegativeStock) {
      alert(`Insufficient stock! ${partObj.name} only has ${partObj.currentQty} in stock.`);
      return;
    }

    const existingIndex = selectedParts.findIndex((p) => p.partId === partToAdd);
    if (existingIndex >= 0) {
      const updated = [...selectedParts];
      updated[existingIndex].qty += qtyToAdd;
      setSelectedParts(updated);
    } else {
      setSelectedParts([
        ...selectedParts,
        { partId: partToAdd, qty: qtyToAdd, unitPrice: partObj.sellingPrice }
      ]);
    }
  };

  const handleRemovePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  // Calculations
  const partsSubtotal = selectedParts.reduce((acc, p) => acc + p.qty * p.unitPrice, 0);
  const totalAmount = Math.max(0, partsSubtotal + labourCost - discount);

  // Auto update paid amount when total changes if user hasn't typed custom paid
  const handleCreateAndDeliver = (printImmediately = false) => {
    let finalCustId = selectedCustomerId;

    // Create new customer if toggled
    if (isAddingNewCustomer) {
      if (!newCustName || !newCustPhone) {
        alert('Please enter Customer Name and Phone Number');
        return;
      }
      const newCust = api.addCustomer({ name: newCustName, phone: newCustPhone });
      finalCustId = newCust.id;
    }

    if (!finalCustId) {
      alert('Please select or add a Customer');
      return;
    }

    let finalBikeId = selectedBikeId;
    if (isAddingNewBike || !finalBikeId) {
      if (!newRegNum) {
        alert('Please enter Bike Registration Number');
        return;
      }
      const newBike = api.addBike({
        customerId: finalCustId,
        regNumber: newRegNum,
        company: newCompany,
        model: newModel
      });
      finalBikeId = newBike.id;
    }

    try {
      // 1. Create Repair Job
      const job = api.createRepairJob({
        customerId: finalCustId,
        bikeId: finalBikeId,
        date: new Date().toISOString().split('T')[0],
        complaint,
        mechanicAssigned: mechanic,
        labourCost,
        labourDescription,
        parts: selectedParts
      });

      // 2. Prepare Invoice items
      const invoiceItems: any[] = [];
      for (const p of selectedParts) {
        const partObj = allParts.find((pt) => pt.id === p.partId);
        invoiceItems.push({
          partId: p.partId,
          itemType: 'Part',
          description: partObj ? `${partObj.name} (${partObj.brand})` : 'Spare Part',
          qty: p.qty,
          unitPrice: p.unitPrice
        });
      }

      if (labourCost > 0) {
        invoiceItems.push({
          itemType: 'Labour',
          description: labourDescription || 'Repair Labour Charges',
          qty: 1,
          unitPrice: labourCost
        });
      }

      // 3. Create Invoice
      const actualPaid = paidAmount > 0 ? paidAmount : totalAmount;
      const inv = api.createInvoice({
        jobId: job.id,
        customerId: finalCustId,
        bikeId: finalBikeId,
        date: new Date().toISOString().split('T')[0],
        items: invoiceItems,
        labourAmount: labourCost,
        discount,
        paidAmount: actualPaid,
        paymentMethod
      });

      onJobCreated();

      if (printImmediately) {
        onPrintInvoice(inv);
      } else {
        alert(`Repair Job ${job.jobNumber} & Invoice ${inv.invoiceNumber} created successfully! Stock updated.`);
        onClose();
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#EBE3DC] text-[#423D39] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#EBE3DC] flex items-center justify-between bg-[#F7F3F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF5ED] border border-[#E67E22]/30 flex items-center justify-center text-[#E67E22]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#423D39]">Express Repair & Billing Wizard</h3>
              <p className="text-xs text-[#8E8781]">Create repair job card, deduct parts stock, and print invoice in 1 step</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#8E8781] hover:text-[#423D39] rounded-lg hover:bg-[#EBE3DC]/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Step 1: Customer & Bike Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Box */}
            <div className="bg-[#FAF7F5] border border-[#EBE3DC] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#E67E22] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4" /> 1. Select Customer
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                  className="text-xs text-[#E67E22] font-semibold hover:underline"
                >
                  {isAddingNewCustomer ? 'Select Existing' : '+ New Customer'}
                </button>
              </div>

              {!isAddingNewCustomer ? (
                <select
                  value={selectedCustomerId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedCustomerId(id);
                    const bks = api.getBikes(id);
                    setSelectedBikeId(bks[0]?.id || null);
                  }}
                  className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:ring-1 focus:ring-[#E67E22] focus:border-[#E67E22]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Customer Name (e.g. Muhammad Ali)"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:ring-1 focus:ring-[#E67E22]"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number (e.g. 0300-1234567)"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:ring-1 focus:ring-[#E67E22]"
                  />
                </div>
              )}
            </div>

            {/* Bike Box */}
            <div className="bg-[#FAF7F5] border border-[#EBE3DC] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <BikeIcon className="w-4 h-4" /> 2. Select Bike
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewBike(!isAddingNewBike)}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  {isAddingNewBike ? 'Select Existing' : '+ New Bike'}
                </button>
              </div>

              {!isAddingNewBike && customerBikes.length > 0 ? (
                <select
                  value={selectedBikeId || ''}
                  onChange={(e) => setSelectedBikeId(Number(e.target.value))}
                  className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {customerBikes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.company} {b.model} ({b.regNumber})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      className="bg-white border border-[#EBE3DC] rounded-xl px-2.5 py-2 text-xs text-[#423D39] focus:outline-none"
                    >
                      <option value="Honda">Honda</option>
                      <option value="Yamaha">Yamaha</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="United">United</option>
                      <option value="Road Prince">Road Prince</option>
                      <option value="Super Power">Super Power</option>
                      <option value="Custom">Custom</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Model (e.g. CD 70)"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="bg-white border border-[#EBE3DC] rounded-xl px-2.5 py-2 text-xs text-[#423D39] focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Reg # (e.g. LEC-2024-1234)"
                    value={newRegNum}
                    onChange={(e) => setNewRegNum(e.target.value)}
                    className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

          </div>

          {/* Step 2: Complaint & Mechanic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FAF7F5] border border-[#EBE3DC] p-4 rounded-xl">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-[#8E8781]">Customer Complaint / Work Description</label>
              <input
                type="text"
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="e.g. Engine noise, oil change, brake loose"
                className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:ring-1 focus:ring-[#E67E22]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#8E8781]">Assigned Mechanic</label>
              <input
                type="text"
                value={mechanic}
                onChange={(e) => setMechanic(e.target.value)}
                placeholder="Mechanic name"
                className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:ring-1 focus:ring-[#E67E22]"
              />
            </div>
          </div>

          {/* Step 3: Spare Parts Pick & Auto Stock Deduction */}
          <div className="bg-[#FAF7F5] border border-[#EBE3DC] p-4 rounded-xl space-y-3">
            <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4" /> 3. Spare Parts Used
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={partToAdd}
                onChange={(e) => setPartToAdd(Number(e.target.value))}
                className="flex-1 bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {allParts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.brand}) - Stock: {p.currentQty} - {settings.currency} {p.sellingPrice}
                  </option>
                ))}
              </select>

              <div className="w-24">
                <input
                  type="number"
                  min="1"
                  value={qtyToAdd}
                  onChange={(e) => setQtyToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] text-center focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddPart}
                className="bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Part
              </button>
            </div>

            {/* Added Parts Table */}
            {selectedParts.length > 0 && (
              <div className="border border-[#EBE3DC] rounded-xl overflow-hidden mt-3 bg-white">
                <table className="w-full text-left text-xs text-[#423D39]">
                  <thead className="bg-[#F7F3F0] text-[#8E8781] font-bold uppercase border-b border-[#EBE3DC]">
                    <tr>
                      <th className="px-3 py-2">Spare Part</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F1EE]">
                    {selectedParts.map((p, idx) => {
                      const pt = allParts.find((item) => item.id === p.partId);
                      return (
                        <tr key={idx} className="hover:bg-[#FAF7F5]">
                          <td className="px-3 py-2 font-medium text-[#423D39]">{pt?.name || 'Part'} ({pt?.brand})</td>
                          <td className="px-3 py-2 text-center font-bold text-[#E67E22]">{p.qty}</td>
                          <td className="px-3 py-2 text-right">{settings.currency} {p.unitPrice}</td>
                          <td className="px-3 py-2 text-right font-bold text-[#423D39]">{settings.currency} {p.qty * p.unitPrice}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleRemovePart(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
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
          </div>

          {/* Step 4: Labour, Discount & Total Calculation */}
          <div className="bg-[#FAF7F5] border border-[#EBE3DC] p-4 rounded-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8E8781]">Labour Description</label>
                <input
                  type="text"
                  value={labourDescription}
                  onChange={(e) => setLabourDescription(e.target.value)}
                  placeholder="e.g. Tuning & Engine Overhaul Labour"
                  className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#E67E22]">Labour Amount ({settings.currency})</label>
                <input
                  type="number"
                  min="0"
                  value={labourCost}
                  onChange={(e) => setLabourCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#E67E22] font-bold focus:outline-none"
                />
              </div>

            </div>

            {/* Bill Summary Footer */}
            <div className="border-t border-[#EBE3DC] pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl text-sm border">
              <div>
                <div className="text-xs text-[#8E8781]">Parts Total</div>
                <div className="font-bold text-[#423D39]">{settings.currency} {partsSubtotal.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-[#8E8781]">Labour Total</div>
                <div className="font-bold text-[#E67E22]">{settings.currency} {labourCost.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-[#8E8781]">Discount ({settings.currency})</div>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded px-2 py-0.5 text-xs text-[#423D39] font-bold focus:outline-none"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-700">Grand Total</div>
                <div className="font-extrabold text-lg text-emerald-700">{settings.currency} {totalAmount.toLocaleString()}</div>
              </div>
            </div>

            {/* Payment Received */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#8E8781]">Amount Paid ({settings.currency})</label>
                <input
                  type="number"
                  min="0"
                  placeholder={`Default: ${totalAmount}`}
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#8E8781]">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-white border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-[#EBE3DC] bg-[#F7F3F0] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#EBE3DC] text-[#8E8781] hover:text-[#423D39] text-sm font-medium"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCreateAndDeliver(false)}
              className="bg-white hover:bg-[#FAF7F5] text-[#423D39] font-semibold px-4 py-2 rounded-xl text-sm transition-all border border-[#EBE3DC]"
            >
              Save Job & Invoice
            </button>
            <button
              type="button"
              onClick={() => handleCreateAndDeliver(true)}
              className="bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-5 py-2 rounded-xl text-sm transition-all shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Save & Print Invoice
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
