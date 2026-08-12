/**
 * Bike Workshop Manager - Expense Tracking Module
 */

import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Trash2,
  X,
  Calendar,
  DollarSign
} from 'lucide-react';
import { api } from '../lib/api';
import type { Expense, ShopSettings } from '../types';

interface ExpenseModuleProps {
  settings: ShopSettings;
}

export const ExpenseModule: React.FC<ExpenseModuleProps> = ({ settings }) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState('Utilities');
  const [amount, setAmount] = useState<number>(500);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const expenses = api.getExpenses();

  const filteredExpenses = expenses.filter((e) =>
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.note && e.note.toLowerCase().includes(search.toLowerCase()))
  );

  const totalExpenseSum = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    api.addExpense({
      category,
      amount,
      date,
      note
    });

    setIsModalOpen(false);
    setAmount(500);
    setNote('');
  };

  const handleDeleteExpense = (id: number) => {
    if (confirm('Delete this expense record?')) {
      api.deleteExpense(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#423D39] flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#E67E22]" /> Shop Expenses
          </h2>
          <p className="text-xs text-[#8E8781]">Track workshop rent, electricity bills, tea, tools & mechanic wages</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#E67E22] hover:bg-[#d5701a] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary Card & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EBE3DC] p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-[#8E8781]">Total Recorded Expenses</div>
            <div className="text-2xl font-extrabold text-[#E67E22] mt-1">
              {settings.currency} {totalExpenseSum.toLocaleString()}
            </div>
          </div>
          <Wallet className="w-10 h-10 text-[#E67E22]/30" />
        </div>

        <div className="md:col-span-2 bg-white border border-[#EBE3DC] p-4 rounded-2xl flex items-center shadow-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#8E8781] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category or note..."
              className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl pl-9 pr-4 py-2 text-xs text-[#423D39] focus:outline-none focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-[#EBE3DC] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-[#423D39]">
          <thead className="bg-[#F7F3F0] text-[#8E8781] font-bold uppercase border-b border-[#EBE3DC]">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-3 py-3">Expense Category</th>
              <th className="px-3 py-3">Description / Note</th>
              <th className="px-3 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F1EE]">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#8E8781]">
                  No expense records found.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((ex) => (
                <tr key={ex.id} className="hover:bg-[#FAF7F5]">
                  <td className="px-4 py-3 font-mono text-[#8E8781]">{ex.date}</td>
                  <td className="px-3 py-3">
                    <span className="bg-[#FAF7F5] text-[#E67E22] border border-[#EBE3DC] px-2.5 py-0.5 rounded font-bold">
                      {ex.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[#423D39]">{ex.note || 'N/A'}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-rose-600 text-sm">
                    {settings.currency} {ex.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeleteExpense(ex.id)}
                      className="p-1 text-[#8E8781] hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2D2722]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE3DC] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-[#423D39]">
            <div className="flex items-center justify-between border-b border-[#EBE3DC] pb-3">
              <h3 className="font-bold text-lg text-[#423D39]">Record Shop Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8E8781] hover:text-[#423D39]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8E8781]">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                >
                  <option value="Shop Rent">Shop Rent</option>
                  <option value="Utilities">Electricity / Utilities</option>
                  <option value="Mechanic Salaries">Mechanic Salaries / Wages</option>
                  <option value="Tea & Refreshments">Tea & Refreshments</option>
                  <option value="Tools & Equipment">Tools & Equipment</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8781]">Amount ({settings.currency}) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-rose-600 font-bold focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8781]">Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#F7F3F0] border border-[#EBE3DC] rounded-xl px-3 py-2 text-sm text-[#423D39] focus:outline-none focus:bg-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8781]">Note / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly electricity bill paid"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
