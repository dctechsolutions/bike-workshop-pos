/**
 * Bike Workshop Manager - Bike Management Module
 */

import React, { useState } from 'react';
import {
  Bike as BikeIcon,
  Search,
  Plus,
  User,
  Phone,
  Edit,
  Trash2,
  X,
  Gauge,
  Wrench
} from 'lucide-react';
import { api } from '../lib/api';
import type { Bike, ShopSettings } from '../types';

interface BikeModuleProps {
  settings: ShopSettings;
}

export const BikeModule: React.FC<BikeModuleProps> = ({ settings }) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);

  const customers = api.getCustomers();
  const bikes = api.getBikes();

  // Form states
  const [customerId, setCustomerId] = useState<number>(customers[0]?.id || 0);
  const [regNumber, setRegNumber] = useState('');
  const [company, setCompany] = useState('Honda');
  const [model, setModel] = useState('CD 70');
  const [modelYear, setModelYear] = useState('2023');
  const [engineNum, setEngineNum] = useState('');
  const [chassisNum, setChassisNum] = useState('');
  const [mileage, setMileage] = useState<number>(10000);
  const [color, setColor] = useState('Red');
  const [notes, setNotes] = useState('');

  const filteredBikes = bikes.filter((b) =>
    b.regNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.model.toLowerCase().includes(search.toLowerCase()) ||
    b.company.toLowerCase().includes(search.toLowerCase()) ||
    (b.customerName && b.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setEditingBike(null);
    setCustomerId(customers[0]?.id || 0);
    setRegNumber('');
    setCompany('Honda');
    setModel('CD 70');
    setModelYear('2023');
    setEngineNum('');
    setChassisNum('');
    setMileage(10000);
    setColor('Red');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: Bike) => {
    setEditingBike(b);
    setCustomerId(b.customerId);
    setRegNumber(b.regNumber);
    setCompany(b.company);
    setModel(b.model);
    setModelYear(b.modelYear || '');
    setEngineNum(b.engineNum || '');
    setChassisNum(b.chassisNum || '');
    setMileage(b.mileage || 0);
    setColor(b.color || '');
    setNotes(b.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveBike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber || !company || !model || !customerId) {
      alert('Please fill required bike details');
      return;
    }

    if (editingBike) {
      api.updateBike({
        id: editingBike.id,
        regNumber,
        company,
        model,
        modelYear,
        engineNum,
        chassisNum,
        mileage,
        color,
        notes
      });
    } else {
      api.addBike({
        customerId,
        regNumber,
        company,
        model,
        modelYear,
        engineNum,
        chassisNum,
        mileage,
        color,
        notes
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteBike = (id: number) => {
    if (confirm('Are you sure you want to delete this bike?')) {
      api.deleteBike(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#423D39] flex items-center gap-2">
            <BikeIcon className="w-6 h-6 text-[#E67E22]" /> Bike Management
          </h2>
          <p className="text-xs text-[#8E8781]">Manage registered customer motorcycles, engine numbers & mileage</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Bike
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#8E8781] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reg #, model, owner name..."
          className="w-full bg-white border border-[#EBE3DC] rounded-xl pl-9 pr-4 py-2 text-sm text-[#423D39] placeholder-[#8E8781] focus:outline-none focus:border-[#E67E22] shadow-sm"
        />
      </div>

      {/* Bikes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBikes.map((b) => (
          <div key={b.id} className="bg-white border border-[#EBE3DC] hover:border-[#8E8781] rounded-2xl p-5 space-y-3 transition-all shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {b.regNumber}
                </span>
                <h3 className="font-extrabold text-[#423D39] text-lg mt-2">{b.company} {b.model}</h3>
                <div className="text-xs text-[#8E8781]">{b.modelYear && `Year ${b.modelYear}`} {b.color && `• Color ${b.color}`}</div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEditModal(b)}
                  className="p-1.5 text-[#8E8781] hover:text-[#E67E22] rounded-lg hover:bg-[#FAF7F5]"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteBike(b.id)}
                  className="p-1.5 text-[#8E8781] hover:text-rose-600 rounded-lg hover:bg-[#FAF7F5]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-[#F7F3F0] p-3 rounded-xl border border-[#EBE3DC] space-y-1 text-xs">
              <div className="flex items-center justify-between text-[#423D39]">
                <span className="flex items-center gap-1 text-[#8E8781]"><User className="w-3 h-3 text-[#E67E22]" /> Owner</span>
                <strong className="text-[#423D39]">{b.customerName}</strong>
              </div>
              <div className="flex items-center justify-between text-[#423D39]">
                <span className="flex items-center gap-1 text-[#8E8781]"><Phone className="w-3 h-3 text-[#E67E22]" /> Phone</span>
                <span className="font-mono text-[#423D39]">{b.customerPhone}</span>
              </div>
              <div className="flex items-center justify-between text-[#423D39] pt-1 border-t border-[#EBE3DC]">
                <span className="flex items-center gap-1 text-[#8E8781]"><Gauge className="w-3 h-3 text-blue-600" /> Mileage</span>
                <strong className="text-blue-600 font-mono">{b.mileage?.toLocaleString()} km</strong>
              </div>
            </div>

            {(b.engineNum || b.chassisNum) && (
              <div className="text-[11px] font-mono text-[#8E8781] space-y-0.5">
                {b.engineNum && <div>Eng #: {b.engineNum}</div>}
                {b.chassisNum && <div>Cha #: {b.chassisNum}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Bike Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE3DC] rounded-2xl w-full max-w-md p-6 shadow-2xl text-[#423D39]">
            <div className="flex items-center justify-between border-b border-[#EBE3DC] pb-3 mb-4">
              <h3 className="font-bold text-lg text-[#423D39]">
                {editingBike ? 'Edit Bike' : 'Register New Bike'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8E8781] hover:text-[#423D39]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBike} className="space-y-4">
              {!editingBike && (
                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Select Owner Customer *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(Number(e.target.value))}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Brand / Company *</label>
                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  >
                    <option value="Honda">Honda</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="United">United</option>
                    <option value="Road Prince">Road Prince</option>
                    <option value="Super Power">Super Power</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CD 70 / CG 125"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8781]">Reg Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LEC-2024-5678"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Year</label>
                  <input
                    type="text"
                    placeholder="2023"
                    value={modelYear}
                    onChange={(e) => setModelYear(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Color</label>
                  <input
                    type="text"
                    placeholder="Red"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Mileage (km)</label>
                  <input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Engine # (Optional)</label>
                  <input
                    type="text"
                    placeholder="E-701234"
                    value={engineNum}
                    onChange={(e) => setEngineNum(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Chassis # (Optional)</label>
                  <input
                    type="text"
                    placeholder="C-701234"
                    value={chassisNum}
                    onChange={(e) => setChassisNum(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>
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
                  Save Bike
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
