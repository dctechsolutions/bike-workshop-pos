/**
 * Bike Workshop Manager - Spare Parts Inventory & Stock Movement Audit Log
 */

import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  PackageX,
  History,
  Layers,
  Edit,
  Trash2,
  X,
  ArrowUpDown,
  Tag,
  MapPin,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../lib/api';
import type { SparePart, StockMovement, ShopSettings } from '../types';

interface InventoryModuleProps {
  settings: ShopSettings;
  initialFilter?: 'all' | 'low_stock' | 'out_of_stock';
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({ settings, initialFilter = 'all' }) => {
  const [activeTab, setActiveTab] = useState<'parts' | 'movements'>('parts');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>(
    initialFilter === 'low_stock' ? 'low' : initialFilter === 'out_of_stock' ? 'out' : 'all'
  );

  // Modal states
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [brand, setBrand] = useState('Atlas Honda');
  const [partNumber, setPartNumber] = useState('');
  const [compatibleCompany, setCompatibleCompany] = useState('Honda');
  const [compatibleModel, setCompatibleModel] = useState('CD 70');
  const [purchasePrice, setPurchasePrice] = useState<number>(100);
  const [sellingPrice, setSellingPrice] = useState<number>(150);
  const [currentQty, setCurrentQty] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [rackLocation, setRackLocation] = useState('A-01');
  const [description, setDescription] = useState('');

  // Manual Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustPartId, setAdjustPartId] = useState<number | null>(null);
  const [adjustQtyChange, setAdjustQtyChange] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('Physical audit recount');

  const suppliers = api.getSuppliers();
  const parts = api.getSpareParts({
    category: categoryFilter || undefined,
    company: companyFilter || undefined,
    lowStockOnly: stockStatusFilter === 'low',
    outOfStockOnly: stockStatusFilter === 'out',
    search
  });

  const movements = api.getStockMovements(adjustPartId || undefined);

  const handleOpenAddModal = () => {
    setEditingPart(null);
    setName('');
    setCategory('Electrical');
    setBrand('Atlas Honda');
    setPartNumber('');
    setCompatibleCompany('Honda');
    setCompatibleModel('CD 70');
    setPurchasePrice(100);
    setSellingPrice(150);
    setCurrentQty(10);
    setMinStock(5);
    setRackLocation('A-01');
    setDescription('');
    setIsPartModalOpen(true);
  };

  const handleOpenEditModal = (p: SparePart) => {
    setEditingPart(p);
    setName(p.name);
    setCategory(p.category);
    setBrand(p.brand);
    setPartNumber(p.partNumber || '');
    setCompatibleCompany(p.compatibleCompany || '');
    setCompatibleModel(p.compatibleModel || '');
    setPurchasePrice(p.purchasePrice);
    setSellingPrice(p.sellingPrice);
    setCurrentQty(p.currentQty);
    setMinStock(p.minStock);
    setRackLocation(p.rackLocation || '');
    setDescription(p.description || '');
    setIsPartModalOpen(true);
  };

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !brand) {
      alert('Please fill Part Name, Category, and Brand.');
      return;
    }

    if (editingPart) {
      api.updateSparePart({
        id: editingPart.id,
        name,
        category,
        brand,
        partNumber,
        compatibleCompany,
        compatibleModel,
        purchasePrice,
        sellingPrice,
        minStock,
        rackLocation,
        description
      });
    } else {
      api.addSparePart({
        name,
        category,
        brand,
        partNumber,
        compatibleCompany,
        compatibleModel,
        purchasePrice,
        sellingPrice,
        currentQty,
        minStock,
        rackLocation,
        description
      });
    }

    setIsPartModalOpen(false);
  };

  const handleDeletePart = (id: number) => {
    if (confirm('Are you sure you want to delete this spare part from catalog?')) {
      api.deleteSparePart(id);
    }
  };

  const handleManualAdjustment = () => {
    if (!adjustPartId || adjustQtyChange === 0) return;
    try {
      api.adjustStock(adjustPartId, adjustQtyChange, adjustReason, 'Manual Adjustment');
      setIsAdjustModalOpen(false);
      alert('Stock adjustment recorded successfully.');
    } catch (err: any) {
      alert('Adjustment error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#423D39] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#E67E22]" /> Spare Parts Inventory
          </h2>
          <p className="text-xs text-[#8E8781]">Real-time stock counts, rack locations, low stock alerts, and audit trail</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'parts' ? 'movements' : 'parts')}
            className="flex items-center gap-1.5 bg-white hover:bg-[#F7F3F0] text-[#423D39] border border-[#EBE3DC] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <History className="w-4 h-4 text-[#E67E22]" />
            {activeTab === 'parts' ? 'Stock History Trail' : 'Back to Inventory'}
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Part
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: PARTS CATALOG */}
      {activeTab === 'parts' ? (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EBE3DC] shadow-sm">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-[#8E8781] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search part name, code, brand..."
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#423D39] placeholder-[#8E8781] focus:outline-none focus:bg-white focus:border-[#E67E22]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-1.5 text-xs text-[#423D39] focus:outline-none focus:bg-white"
              >
                <option value="">All Categories</option>
                <option value="Electrical">Electrical</option>
                <option value="Brakes">Brakes</option>
                <option value="Lubricants">Lubricants</option>
                <option value="Engine & Drive">Engine & Drive</option>
                <option value="Cables">Cables</option>
              </select>

              {/* Company Filter */}
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-1.5 text-xs text-[#423D39] focus:outline-none focus:bg-white"
              >
                <option value="">All Companies</option>
                <option value="Honda">Honda</option>
                <option value="Yamaha">Yamaha</option>
                <option value="Suzuki">Suzuki</option>
                <option value="Universal">Universal</option>
              </select>

              {/* Stock Alert Filter Buttons */}
              <div className="flex items-center gap-1 bg-[#F7F3F0] p-1 rounded-xl border border-[#EBE3DC] text-xs font-bold">
                <button
                  onClick={() => setStockStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${stockStatusFilter === 'all' ? 'bg-[#423D39] text-white shadow-xs' : 'text-[#8E8781]'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setStockStatusFilter('low')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                    stockStatusFilter === 'low' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'text-[#8E8781]'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock
                </button>
                <button
                  onClick={() => setStockStatusFilter('out')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                    stockStatusFilter === 'out' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'text-[#8E8781]'
                  }`}
                >
                  <PackageX className="w-3 h-3 text-rose-600" /> Out of Stock
                </button>
              </div>
            </div>
          </div>

          {/* Parts Table */}
          <div className="bg-white border border-[#EBE3DC] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#423D39]">
                <thead className="bg-[#F7F3F0] text-[#8E8781] font-bold uppercase border-b border-[#EBE3DC]">
                  <tr>
                    <th className="px-4 py-3">Part Name & Brand</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Compatible Model</th>
                    <th className="px-3 py-3 text-center">Rack</th>
                    <th className="px-3 py-3 text-right">Cost Price</th>
                    <th className="px-3 py-3 text-right">Selling Price</th>
                    <th className="px-3 py-3 text-center">Stock Quantity</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F1EE]">
                  {parts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-[#8E8781]">
                        No spare parts found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    parts.map((p) => {
                      const isLow = p.currentQty > 0 && p.currentQty <= p.minStock;
                      const isOut = p.currentQty <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-[#FAF7F5] transition-colors">
                          <td className="px-4 py-3 font-medium text-[#423D39]">
                            <div className="font-bold text-sm text-[#423D39]">{p.name}</div>
                            <div className="text-[11px] text-[#8E8781]">
                              Brand: <strong className="text-[#423D39]">{p.brand}</strong> {p.partNumber && `• Part #: ${p.partNumber}`}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <span className="bg-[#F7F3F0] border border-[#EBE3DC] px-2 py-0.5 rounded text-[11px] text-[#423D39]">
                              {p.category}
                            </span>
                          </td>

                          <td className="px-3 py-3 font-mono text-blue-600 font-semibold">
                            {p.compatibleCompany} {p.compatibleModel}
                          </td>

                          <td className="px-3 py-3 text-center font-mono font-bold text-[#8E8781]">
                            {p.rackLocation || 'N/A'}
                          </td>

                          <td className="px-3 py-3 text-right font-mono text-[#8E8781]">
                            {settings.currency} {p.purchasePrice}
                          </td>

                          <td className="px-3 py-3 text-right font-mono font-bold text-[#E67E22] text-sm">
                            {settings.currency} {p.sellingPrice}
                          </td>

                          <td className="px-3 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <span
                                className={`font-mono text-sm font-extrabold px-2.5 py-0.5 rounded-full border ${
                                  isOut
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : isLow
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {p.currentQty} Pcs
                              </span>
                              {isLow && <span className="text-[10px] text-amber-700 font-bold mt-0.5">Low Stock</span>}
                              {isOut && <span className="text-[10px] text-rose-700 font-bold mt-0.5">Out of Stock</span>}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setAdjustPartId(p.id);
                                  setAdjustQtyChange(1);
                                  setIsAdjustModalOpen(true);
                                }}
                                className="px-2 py-1 bg-[#FAF7F5] hover:bg-[#F7F3F0] text-[#E67E22] text-[11px] font-bold rounded border border-[#EBE3DC]"
                                title="Manual Stock Adjustment"
                              >
                                Adjust
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1 text-[#8E8781] hover:text-[#423D39]"
                                title="Edit Part"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePart(p.id)}
                                className="p-1 text-[#8E8781] hover:text-rose-600"
                                title="Delete Part"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW TAB 2: STOCK MOVEMENT AUDIT LOG (SECTION 10) */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#EBE3DC] flex items-center justify-between shadow-sm">
            <div>
              <h3 className="font-bold text-[#423D39] text-base flex items-center gap-2">
                <History className="w-5 h-5 text-[#E67E22]" /> Stock Movement Audit Trail
              </h3>
              <p className="text-xs text-[#8E8781]">Complete log of all inventory increases & decreases</p>
            </div>
          </div>

          <div className="bg-white border border-[#EBE3DC] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-[#423D39]">
              <thead className="bg-[#F7F3F0] text-[#8E8781] font-bold uppercase border-b border-[#EBE3DC]">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-3 py-3">Spare Part</th>
                  <th className="px-3 py-3 text-center">Movement Type</th>
                  <th className="px-3 py-3 text-center">Qty Change</th>
                  <th className="px-3 py-3">Reason / Reference</th>
                  <th className="px-3 py-3">Trigger Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F1EE]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#8E8781]">
                      No stock movements recorded.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isIncrease = m.qty > 0;
                    return (
                      <tr key={m.id} className="hover:bg-[#FAF7F5]">
                        <td className="px-4 py-3 font-mono text-[#8E8781]">{m.createdAt}</td>
                        <td className="px-3 py-3 font-bold text-[#423D39]">{m.partName}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="bg-[#F7F3F0] text-[#423D39] px-2 py-0.5 rounded text-[11px] border border-[#EBE3DC]">
                            {m.type}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                              isIncrease ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                            }`}
                          >
                            {isIncrease ? `+${m.qty}` : m.qty}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[#423D39]">{m.reason}</td>
                        <td className="px-3 py-3 text-[#8E8781] font-mono">{m.userAction}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Spare Part Modal */}
      {isPartModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE3DC] rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar text-[#423D39]">
            <div className="flex items-center justify-between border-b border-[#EBE3DC] pb-3 mb-4">
              <h3 className="font-bold text-lg text-[#423D39]">
                {editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}
              </h3>
              <button onClick={() => setIsPartModalOpen(false)} className="text-[#8E8781] hover:text-[#423D39]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePart} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8E8781]">Part Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spark Plug C7HSA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white focus:border-[#E67E22] mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="Brakes">Brakes</option>
                    <option value="Lubricants">Lubricants</option>
                    <option value="Engine & Drive">Engine & Drive</option>
                    <option value="Cables">Cables</option>
                    <option value="General Spares">General Spares</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NGK / Atlas Honda"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Part Code / Number</label>
                  <input
                    type="text"
                    placeholder="e.g. C7HSA-70"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Rack / Shelf Location</label>
                  <input
                    type="text"
                    placeholder="e.g. A-02"
                    value={rackLocation}
                    onChange={(e) => setRackLocation(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Compatible Company</label>
                  <select
                    value={compatibleCompany}
                    onChange={(e) => setCompatibleCompany(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  >
                    <option value="Honda">Honda</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="United">United</option>
                    <option value="Universal">Universal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Compatible Model</label>
                  <input
                    type="text"
                    placeholder="e.g. CD 70 / CG 125"
                    value={compatibleModel}
                    onChange={(e) => setCompatibleModel(e.target.value)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Purchase Price ({settings.currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#E67E22]">Selling Price ({settings.currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm font-bold text-[#E67E22] focus:outline-none focus:bg-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!editingPart && (
                  <div>
                    <label className="text-xs font-bold text-[#8E8781]">Initial Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={currentQty}
                      onChange={(e) => setCurrentQty(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#8E8781]">Minimum Stock Level</label>
                  <input
                    type="number"
                    min="1"
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 5)}
                    className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8781]">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPartModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#EBE3DC] text-[#8E8781] text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold text-sm shadow-sm"
                >
                  Save Spare Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {isAdjustModalOpen && adjustPartId && (
        <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE3DC] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-[#423D39]">
            <div className="flex items-center justify-between border-b border-[#EBE3DC] pb-3">
              <h3 className="font-bold text-lg text-[#423D39]">Manual Stock Recount Adjustment</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-[#8E8781] hover:text-[#423D39]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E8781]">Quantity Adjustment (+ for add, - for decrease)</label>
              <input
                type="number"
                value={adjustQtyChange}
                onChange={(e) => setAdjustQtyChange(parseInt(e.target.value) || 0)}
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm font-bold text-[#E67E22] focus:outline-none focus:bg-white mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E8781]">Reason for Adjustment</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Physical inventory count correction"
                className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#EBE3DC] text-[#8E8781] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAdjustment}
                className="px-5 py-2 rounded-xl bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold text-sm shadow-sm"
              >
                Record Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
