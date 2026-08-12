/**
 * Bike Workshop Manager - Repair Job Cards Module
 */

import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Clock,
  User,
  Bike as BikeIcon,
  CheckCircle2,
  AlertCircle,
  Package,
  Printer,
  Trash2,
  Edit,
  X,
  FileText,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { api } from '../lib/api';
import type { RepairJob, ShopSettings, JobStatus, Invoice } from '../types';

interface JobCardModuleProps {
  settings: ShopSettings;
  onPrintInvoice: (inv: Invoice) => void;
  initialJobId?: number | null;
}

export const JobCardModule: React.FC<JobCardModuleProps> = ({ settings, onPrintInvoice, initialJobId }) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(initialJobId || null);

  const jobs = api.getRepairJobs(filterStatus);
  const allParts = api.getSpareParts();
  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) : jobs[0] || null;

  // Add Part to Job Modal states
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<number>(allParts[0]?.id || 0);
  const [partQty, setPartQty] = useState<number>(1);

  // Status update modal states
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<JobStatus>('In Progress');
  const [workDoneText, setWorkDoneText] = useState('');
  const [labourAmount, setLabourAmount] = useState<number>(500);

  const filteredJobs = jobs.filter((j) =>
    j.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
    (j.customerName && j.customerName.toLowerCase().includes(search.toLowerCase())) ||
    (j.bikeRegNumber && j.bikeRegNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddPartToJob = () => {
    if (!selectedJob || !selectedPartId) return;
    const pt = allParts.find((p) => p.id === selectedPartId);
    if (!pt) return;

    if (pt.currentQty < partQty && !settings.allowNegativeStock) {
      alert(`Insufficient stock! ${pt.name} only has ${pt.currentQty} in stock.`);
      return;
    }

    try {
      api.addPartToRepairJob(selectedJob.id, selectedPartId, partQty, pt.sellingPrice);
      setIsAddPartOpen(false);
      alert(`Added ${partQty}x ${pt.name} to Job #${selectedJob.jobNumber}. Inventory updated.`);
    } catch (err: any) {
      alert('Error adding part: ' + err.message);
    }
  };

  const handleSaveStatusUpdate = () => {
    if (!selectedJob) return;
    api.updateRepairJobStatus(selectedJob.id, newStatus, workDoneText, labourAmount);
    setIsStatusModalOpen(false);

    // If marked Delivered, ask if wants to generate & print invoice
    if (newStatus === 'Delivered' && !selectedJob.invoiceId) {
      if (confirm('Job marked as Delivered! Would you like to generate the Invoice now?')) {
        handleConvertToInvoice(selectedJob);
      }
    }
  };

  const handleConvertToInvoice = (job: RepairJob) => {
    try {
      const invoiceItems: any[] = [];
      for (const p of job.parts) {
        invoiceItems.push({
          partId: p.partId,
          itemType: 'Part',
          description: p.partName,
          qty: p.qty,
          unitPrice: p.unitPrice
        });
      }

      if (job.labourCost > 0) {
        invoiceItems.push({
          itemType: 'Labour',
          description: job.labourDescription || 'Repair Labour Charges',
          qty: 1,
          unitPrice: job.labourCost
        });
      }

      const totalParts = job.parts.reduce((a, b) => a + b.subtotal, 0);
      const totalAmount = totalParts + job.labourCost;

      const inv = api.createInvoice({
        jobId: job.id,
        customerId: job.customerId,
        bikeId: job.bikeId,
        date: new Date().toISOString().split('T')[0],
        items: invoiceItems,
        labourAmount: job.labourCost,
        discount: 0,
        paidAmount: totalAmount,
        paymentMethod: 'Cash'
      });

      onPrintInvoice(inv);
    } catch (err: any) {
      alert('Invoice error: ' + err.message);
    }
  };

  const statusColors: Record<string, string> = {
    'Received': 'bg-blue-50 text-blue-700 border-blue-200',
    'Inspection': 'bg-purple-50 text-purple-700 border-purple-200',
    'In Progress': 'bg-[#FEF5ED] text-[#E67E22] border-[#E67E22]/30',
    'Waiting for Parts': 'bg-amber-50 text-amber-700 border-amber-200',
    'Ready': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Delivered': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Cancelled': 'bg-gray-100 text-gray-500 border-gray-200'
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#423D39] flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#E67E22]" /> Repair Job Cards
          </h2>
          <p className="text-xs text-[#8E8781]">Track bike repair statuses, mechanic work, and spare parts stock usage</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-[#EBE3DC] shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          {['All', 'Received', 'In Progress', 'Waiting for Parts', 'Ready', 'Delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                filterStatus === st
                  ? 'bg-[#E67E22] text-white shadow-sm'
                  : 'text-[#8E8781] hover:text-[#423D39] hover:bg-[#F7F3F0]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[#8E8781] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job #, reg #, customer..."
            className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#423D39] placeholder-[#8E8781] focus:outline-none focus:bg-white focus:border-[#E67E22]"
          />
        </div>
      </div>

      {/* Main Split View: Jobs List & Job Card Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Job Cards List */}
        <div className="lg:col-span-5 space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar pr-1">
          {filteredJobs.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#EBE3DC] rounded-2xl text-xs text-[#8E8781] shadow-sm">
              No repair jobs match current filter.
            </div>
          ) : (
            filteredJobs.map((j) => {
              const isSelected = selectedJob?.id === j.id;
              return (
                <div
                  key={j.id}
                  onClick={() => setSelectedJobId(j.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-[#FEF5ED] border-[#E67E22]'
                      : 'bg-white border-[#EBE3DC] hover:border-[#E67E22]/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#E67E22] text-sm">{j.jobNumber}</span>
                        {j.priority === 'Urgent' && (
                          <span className="text-[10px] font-bold bg-rose-50 text-red-600 border border-rose-200 px-2 py-0.2 rounded">
                            URGENT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#423D39] font-medium mt-1">
                        {j.customerName} • <span className="text-blue-600 font-mono">{j.bikeRegNumber}</span>
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[j.status]}`}>
                      {j.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#8E8781] mt-2 line-clamp-1">{j.complaint}</p>

                  <div className="flex items-center justify-between text-[11px] text-[#8E8781] border-t border-[#F5F1EE] pt-2 mt-3">
                    <span>Date: {j.date}</span>
                    <span>Mechanic: <strong className="text-[#423D39]">{j.mechanicAssigned}</strong></span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Repair Job Card Full Detail */}
        {selectedJob ? (
          <div className="lg:col-span-7 bg-white border border-[#EBE3DC] rounded-2xl p-6 space-y-6 shadow-sm">
            
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE3DC] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-[#423D39]">{selectedJob.jobNumber}</h3>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusColors[selectedJob.status]}`}>
                    {selectedJob.status}
                  </span>
                </div>
                <div className="text-xs text-[#8E8781] mt-0.5">
                  Assigned to <strong className="text-[#E67E22]">{selectedJob.mechanicAssigned}</strong> • Received: {selectedJob.date}
                </div>
              </div>

              {/* Status Update Trigger Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNewStatus(selectedJob.status);
                    setWorkDoneText(selectedJob.workDone || '');
                    setLabourAmount(selectedJob.labourCost || 500);
                    setIsStatusModalOpen(true);
                  }}
                  className="bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-sm"
                >
                  Update Status & Labour
                </button>

                <button
                  onClick={() => handleConvertToInvoice(selectedJob)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
              </div>
            </div>

            {/* Customer & Bike Summary Card */}
            <div className="grid grid-cols-2 gap-4 bg-[#FAF7F5] p-4 rounded-xl border border-[#EBE3DC] text-xs">
              <div>
                <div className="text-[#8E8781] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#E67E22]" /> Customer
                </div>
                <div className="font-bold text-[#423D39] text-sm">{selectedJob.customerName}</div>
                <div className="text-[#8E8781] font-mono mt-0.5">{selectedJob.customerPhone}</div>
              </div>

              <div>
                <div className="text-[#8E8781] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <BikeIcon className="w-3.5 h-3.5 text-blue-600" /> Motorcycle
                </div>
                <div className="font-bold text-[#423D39] text-sm">{selectedJob.bikeCompany} {selectedJob.bikeModel}</div>
                <div className="text-blue-600 font-mono font-bold mt-0.5">{selectedJob.bikeRegNumber}</div>
              </div>
            </div>

            {/* Complaint & Work Description */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8E8781] mb-1">Customer Complaint</h4>
                <div className="bg-[#FAF7F5] p-3 rounded-xl border border-[#EBE3DC] text-xs text-[#423D39]">
                  {selectedJob.complaint}
                </div>
              </div>

              {selectedJob.workDone && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Work Done by Mechanic</h4>
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800">
                    {selectedJob.workDone}
                  </div>
                </div>
              )}
            </div>

            {/* Spare Parts Used (Section 8) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> Spare Parts Installed
                </h4>
                <button
                  onClick={() => setIsAddPartOpen(true)}
                  className="text-xs text-[#E67E22] font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Install Part
                </button>
              </div>

              {selectedJob.parts.length === 0 ? (
                <div className="p-3 text-center bg-[#FAF7F5] border border-[#EBE3DC] rounded-xl text-xs text-[#8E8781]">
                  No spare parts added to this job card yet.
                </div>
              ) : (
                <div className="border border-[#EBE3DC] rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs text-[#423D39]">
                    <thead className="bg-[#F7F3F0] text-[#8E8781] font-bold uppercase border-b border-[#EBE3DC]">
                      <tr>
                        <th className="px-3 py-2">Part Name</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Unit Price</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F1EE]">
                      {selectedJob.parts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF7F5]">
                          <td className="px-3 py-2 font-medium text-[#423D39]">{p.partName}</td>
                          <td className="px-3 py-2 text-center font-bold text-[#E67E22]">{p.qty}</td>
                          <td className="px-3 py-2 text-right">{settings.currency} {p.unitPrice}</td>
                          <td className="px-3 py-2 text-right font-bold text-[#423D39]">{settings.currency} {p.subtotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Labour & Billing Summary */}
            <div className="bg-[#FAF7F5] p-4 rounded-xl border border-[#EBE3DC] flex items-center justify-between text-xs">
              <div>
                <div className="text-[#8E8781]">Labour Description</div>
                <div className="font-bold text-[#423D39]">{selectedJob.labourDescription || 'Tuning & Servicing Labour'}</div>
              </div>
              <div className="text-right">
                <div className="text-[#8E8781]">Labour Cost: <span className="text-[#E67E22] font-bold">{settings.currency} {selectedJob.labourCost}</span></div>
                <div className="text-sm font-extrabold text-emerald-700 mt-0.5">
                  Total Job Cost: {settings.currency} {selectedJob.parts.reduce((a, b) => a + b.subtotal, 0) + selectedJob.labourCost}
                </div>
              </div>
            </div>

          </div>
        ) : null}

      </div>

      {/* Add Part to Job Modal */}
      {isAddPartOpen && selectedJob && (
        <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE3DC] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-[#423D39]">
            <div className="flex items-center justify-between border-b border-[#EBE3DC] pb-3">
              <h3 className="font-bold text-lg text-[#423D39]">Add Spare Part to #{selectedJob.jobNumber}</h3>
              <button onClick={() => setIsAddPartOpen(false)} className="text-[#8E8781] hover:text-[#423D39]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E8781]">Select Part *</label>
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(Number(e.target.value))}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none mt-1"
              >
                {allParts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.brand}) - Stock: {p.currentQty} - {settings.currency} {p.sellingPrice}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E8781]">Quantity *</label>
              <input
                type="number"
                min="1"
                value={partQty}
                onChange={(e) => setPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none mt-1"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddPartOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#EBE3DC] text-[#8E8781] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPartToJob}
                className="px-5 py-2 rounded-xl bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold text-sm shadow-sm"
              >
                Add & Deduct Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status & Work Done Update Modal */}
      {isStatusModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE3DC] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-[#423D39]">
            <div className="flex items-center justify-between border-b border-[#EBE3DC] pb-3">
              <h3 className="font-bold text-lg text-[#423D39]">Update Status for #{selectedJob.jobNumber}</h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-[#8E8781] hover:text-[#423D39]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E8781]">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none mt-1"
              >
                <option value="Received">Received</option>
                <option value="Inspection">Inspection</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting for Parts">Waiting for Parts</option>
                <option value="Ready">Ready</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E8781]">Work Done Summary</label>
              <textarea
                rows={2}
                placeholder="Describe work completed by mechanic"
                value={workDoneText}
                onChange={(e) => setWorkDoneText(e.target.value)}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#E67E22]">Labour Charge ({settings.currency})</label>
              <input
                type="number"
                min="0"
                value={labourAmount}
                onChange={(e) => setLabourAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm font-bold text-[#E67E22] focus:outline-none mt-1"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#EBE3DC] text-[#8E8781] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatusUpdate}
                className="px-5 py-2 rounded-xl bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold text-sm shadow-sm"
              >
                Save Update
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
