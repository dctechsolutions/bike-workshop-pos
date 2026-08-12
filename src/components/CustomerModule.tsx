/**
 * Bike Workshop Manager - Customer Management Module
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MapPin,
  FileText,
  Bike as BikeIcon,
  Wrench,
  Receipt,
  Edit,
  Trash2,
  X,
  Plus,
  Clock,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { api } from '../lib/api';
import type { Customer, Bike, RepairJob, Invoice, ShopSettings } from '../types';

interface CustomerModuleProps {
  settings: ShopSettings;
  initialSelectedId?: number | null;
  onNavigateToJob?: (jobId: number) => void;
  onNavigateToBike?: (bikeId: number) => void;
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({
  settings,
  initialSelectedId,
  onNavigateToJob,
  onNavigateToBike
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(initialSelectedId || null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const customers = api.getCustomers(search);
  const selectedCustomer = selectedCustomerId ? api.getCustomerById(selectedCustomerId) : null;
  const customerBikes = selectedCustomerId ? api.getBikes(selectedCustomerId) : [];
  const customerJobs = selectedCustomerId
    ? api.getRepairJobs().filter((j) => j.customerId === selectedCustomerId)
    : [];
  const customerInvoices = selectedCustomerId
    ? api.getInvoices().filter((i) => i.customerId === selectedCustomerId)
    : [];

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Name and Phone number are required.');
      return;
    }

    if (editingCustomer) {
      api.updateCustomer({ id: editingCustomer.id, name, phone, address, notes });
    } else {
      const created = api.addCustomer({ name, phone, address, notes });
      setSelectedCustomerId(created.id);
    }

    setIsModalOpen(false);
  };

  const handleDeleteCustomer = (id: number) => {
    if (confirm('Are you sure you want to delete this customer? Historical records will remain preserved.')) {
      api.deleteCustomer(id);
      if (selectedCustomerId === id) setSelectedCustomerId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#423D39] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#E67E22]" /> Customer Management
          </h2>
          <p className="text-xs text-[#8E8781]">View customer profiles, bikes owned, and complete repair job histories</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Main Grid: Customer List & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customers List */}
        <div className={`space-y-4 ${selectedCustomer ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8E8781] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name or phone..."
              className="w-full bg-white border border-[#EBE3DC] rounded-xl pl-9 pr-4 py-2 text-sm text-[#423D39] placeholder-[#8E8781] focus:outline-none focus:border-[#E67E22] shadow-sm"
            />
          </div>

          {/* Customers Cards */}
          <div className="space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
            {customers.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#EBE3DC] rounded-xl text-sm text-[#8E8781]">
                No customers found matching search.
              </div>
            ) : (
              customers.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF7F5] border-[#E67E22] shadow-sm'
                        : 'bg-white border-[#EBE3DC] hover:border-[#8E8781]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-[#423D39] text-base">{c.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-[#8E8781] mt-1">
                          <Phone className="w-3.5 h-3.5 text-[#E67E22]" />
                          <span className="font-mono text-[#423D39]">{c.phone}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-[#E67E22]">
                          {settings.currency} {(c.totalSpent || 0).toLocaleString()}
                        </span>
                        <div className="text-[10px] text-[#8E8781]">Total Spent</div>
                      </div>
                    </div>

                    {c.address && (
                      <div className="text-xs text-[#8E8781] flex items-center gap-1 mt-2">
                        <MapPin className="w-3 h-3 shrink-0 text-[#8E8781]" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs border-t border-[#F5F1EE] pt-2.5 mt-3">
                      <span className="text-[#8E8781]">
                        Bikes: <strong className="text-blue-600">{c.bikeCount || 0}</strong> • Jobs: <strong className="text-[#E67E22]">{c.jobCount || 0}</strong>
                      </span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1 text-[#8E8781] hover:text-[#E67E22]"
                          title="Edit Customer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id)}
                          className="p-1 text-[#8E8781] hover:text-rose-600"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Customer Detailed Profile & Repair History Timeline */}
        {selectedCustomer && (
          <div className="lg:col-span-7 bg-white border border-[#EBE3DC] rounded-2xl p-6 space-y-6 shadow-sm">
            
            {/* Top Profile Header */}
            <div className="flex items-start justify-between border-b border-[#EBE3DC] pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF7F5] border border-[#EBE3DC] flex items-center justify-center font-black text-[#E67E22] text-xl">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#423D39]">{selectedCustomer.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-[#8E8781] mt-0.5">
                      <span className="flex items-center gap-1 text-[#E67E22] font-mono"><Phone className="w-3 h-3" /> {selectedCustomer.phone}</span>
                      {selectedCustomer.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedCustomer.address}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right bg-[#F7F3F0] p-3 rounded-xl border border-[#EBE3DC]">
                <div className="text-xs text-[#8E8781]">Total Spent</div>
                <div className="text-lg font-extrabold text-emerald-700">
                  {settings.currency} {(selectedCustomer.totalSpent || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Customer's Bikes Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-1.5">
                <BikeIcon className="w-4 h-4" /> Customer Bikes ({customerBikes.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {customerBikes.map((b) => (
                  <div key={b.id} className="bg-[#F7F3F0] p-3 rounded-xl border border-[#EBE3DC] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#423D39] text-sm">{b.company} {b.model}</div>
                      <div className="text-xs font-mono text-blue-600 font-semibold">{b.regNumber}</div>
                    </div>
                    <div className="text-right text-xs text-[#8E8781]">
                      {b.mileage} km
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COMPLETE REPAIR HISTORY TIMELINE (SECTION 17) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#E67E22] mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Complete Repair & Service History
              </h4>

              {customerJobs.length === 0 ? (
                <div className="p-4 text-center bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl text-xs text-[#8E8781]">
                  No repair jobs recorded yet for this customer.
                </div>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                  {customerJobs.map((j) => (
                    <div key={j.id} className="bg-[#F7F3F0] p-4 rounded-xl border border-[#EBE3DC] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#E67E22] text-sm">{j.jobNumber}</span>
                          <span className="text-xs text-[#8E8781] font-mono">({j.date})</span>
                          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-mono font-semibold">
                            {j.bikeRegNumber}
                          </span>
                        </div>
                        <span className="text-xs font-bold bg-white border border-[#EBE3DC] text-[#423D39] px-2.5 py-0.5 rounded-full">
                          {j.status}
                        </span>
                      </div>

                      <div className="text-xs text-[#423D39]">
                        <strong>Complaint:</strong> {j.complaint}
                      </div>

                      {j.workDone && (
                        <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                          <strong>Work Done:</strong> {j.workDone}
                        </div>
                      )}

                      {/* Parts list used in job */}
                      {j.parts && j.parts.length > 0 && (
                        <div className="text-xs text-[#8E8781]">
                          <strong>Parts Used:</strong> {j.parts.map((p) => `${p.partName} x${p.qty}`).join(', ')}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs border-t border-[#EBE3DC] pt-2 text-[#8E8781]">
                        <span>Labour: {settings.currency} {j.labourCost}</span>
                        <span className="font-bold text-emerald-700">
                          Total: {settings.currency} {j.parts.reduce((a, b) => a + b.subtotal, 0) + j.labourCost}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE3DC] rounded-2xl w-full max-w-md p-6 shadow-2xl text-[#423D39]">
            <div className="flex items-center justify-between border-b border-[#EBE3DC] pb-3 mb-4">
              <h3 className="font-bold text-lg text-[#423D39]">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8E8781] hover:text-[#423D39]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8E8781]">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ali Raza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8781]">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0300-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8781]">Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Model Town, Lahore"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8781]">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prefers genuine parts"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBE3DC]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#EBE3DC] text-[#8E8781] text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold text-sm shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
