import React, { useState, useMemo } from 'react';
import {
  Armchair,
  Plus,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  Brush,
  Calendar,
  X,
  IndianRupee,
  BellRing,
} from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../../utils/currency';

export const AdminTablesPage = () => {
  const { tables, updateTableStatus, addTable, orders, waiterCalls = [], resolveWaiterCall } = useAdminData();

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New table form state
  const [newTable, setNewTable] = useState({
    number: '',
    capacity: 4,
    section: 'Indoor Ground',
    status: 'AVAILABLE',
  });

  const sections = ['ALL', 'Indoor Ground', 'Garden Terrace', 'Family Lounge'];

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (activeFilter !== 'ALL' && t.status !== activeFilter) return false;
      if (sectionFilter !== 'ALL' && t.section !== sectionFilter) return false;
      return true;
    });
  }, [tables, activeFilter, sectionFilter]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTable.number.trim()) return;
    addTable({
      number: newTable.number.trim(),
      capacity: Number(newTable.capacity),
      section: newTable.section,
      status: newTable.status,
    });
    setNewTable({ number: '', capacity: 4, section: 'Indoor Ground', status: 'AVAILABLE' });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminPageHeader
        title="Dining Table Management"
        subtitle="Live floor layout, occupancy tracking, and table turnover statuses."
        actions={
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Table</span>
          </button>
        }
      />

      {/* Filter and Section Selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { key: 'ALL', label: 'All Tables', count: tables.length },
            { key: 'AVAILABLE', label: 'Available (Unreserved)', count: tables.filter((t) => t.status === 'AVAILABLE').length },
            { key: 'RESERVED', label: 'Reserved', count: tables.filter((t) => t.status === 'RESERVED').length },
            { key: 'OCCUPIED', label: 'Occupied', count: tables.filter((t) => t.status === 'OCCUPIED').length },
            { key: 'CLEANING', label: 'Cleaning', count: tables.filter((t) => t.status === 'CLEANING').length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeFilter === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Section Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Section:</span>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none"
          >
            {sections.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Sections' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((tbl) => (
          <div
            key={tbl.id}
            className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-2xs hover:shadow-md ${tbl.status === 'OCCUPIED'
              ? 'border-amber-200 bg-amber-50/20'
              : tbl.status === 'CLEANING'
                ? 'border-blue-200 bg-blue-50/20'
                : 'border-slate-200'
              }`}
          >
            {/* Top row */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {tbl.section}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <Armchair className="w-5 h-5 text-slate-700" />
                    <span>{String(tbl.number || '').toLowerCase().startsWith('table') ? tbl.number : `Table ${tbl.number}`}</span>
                  </h3>
                </div>
                <StatusBadge status={tbl.status} size="xs" />
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Seats {tbl.capacity} Guests</span>
              </div>

              {/* Active Waiter Help Request Badge */}
              {(() => {
                const cleanTbl = String(tbl.number || '').replace(/^Table\s*/i, '').trim();
                const helpCall = (waiterCalls || []).find(
                  (c) => String(c.tableNumber).replace(/^Table\s*/i, '').trim() === cleanTbl
                );
                if (!helpCall) return null;
                return (
                  <div className="mt-2.5 p-2 rounded-xl bg-rose-600 text-white flex items-center justify-between shadow-md animate-pulse">
                    <span className="text-[11px] font-black flex items-center gap-1">
                      <BellRing className="w-3.5 h-3.5 text-white" />
                      <span>Help Needed!</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => resolveWaiterCall(helpCall.id, tbl.number)}
                      className="px-2.5 py-0.5 rounded-lg bg-white text-rose-950 font-black text-[10px] hover:bg-rose-100 cursor-pointer shadow-2xs"
                    >
                      Mark Assisted
                    </button>
                  </div>
                );
              })()}

              {/* Occupied / Details information (100% Dynamic from live orders) */}
              {tbl.status === 'OCCUPIED' && (() => {
                const activeOrder = (orders || []).find(
                  (o) =>
                    (String(o.tableNumber) === String(tbl.number) ||
                      String(o.tableNumber) === String(tbl.number).replace(/^0+/, '') ||
                      o.orderId === tbl.currentOrderId) &&
                    !['CANCELLED', 'REJECTED'].includes(o.orderStatus)
                );

                const customerName = activeOrder?.customerName || tbl.customerName;
                const orderAmount = activeOrder ? activeOrder.total : (tbl.amount || 0);
                const orderId = activeOrder?.orderId || tbl.currentOrderId;
                const orderStatus = activeOrder?.orderStatus;

                let timeText = 'Just now';
                if (tbl.occupiedSince) {
                  const occupiedTime = new Date(tbl.occupiedSince).getTime();
                  if (!isNaN(occupiedTime)) {
                    const diffMins = Math.floor((Date.now() - occupiedTime) / 60000);
                    timeText = diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
                  } else {
                    timeText = tbl.occupiedSince;
                  }
                }

                return (
                  <div className="mt-3 p-3 rounded-xl bg-white border border-amber-100 space-y-1.5 text-xs shadow-2xs">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span className="truncate max-w-[130px]">
                        {customerName ? customerName : 'Walk-in Guest'}
                      </span>
                      <span className="text-emerald-700 shrink-0 font-extrabold text-xs">
                        {orderAmount > 0 ? formatCurrency(orderAmount) : '₹0'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px] pt-0.5">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{timeText}</span>
                      </div>
                      {orderId && (
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                          #{orderId}
                        </span>
                      )}
                    </div>

                    {orderStatus && (
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">Kitchen:</span>
                        <span className="font-bold text-amber-700 uppercase">{orderStatus}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {tbl.status === 'RESERVED' && (
                <div className="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>{tbl.customerName ? `Reserved: ${tbl.customerName}` : 'Manually Reserved'}</span>
                    </div>
                    <span className="text-[10px] bg-purple-200/80 text-purple-900 font-extrabold px-1.5 py-0.5 rounded">
                      Admin Hold
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateTableStatus(tbl.id, 'AVAILABLE')}
                    className="w-full mt-1 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 text-[11px] font-bold transition-all active:scale-95"
                  >
                    Unreserve Table (Mark Available)
                  </button>
                </div>
              )}

              {/* Quick Reserve action for Available tables */}
              {tbl.status === 'AVAILABLE' && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const name = window.prompt(`Enter guest name or note for Table ${tbl.number} reservation (optional):`, 'Reserved Guest');
                      if (name !== null) {
                        updateTableStatus(tbl.id, 'RESERVED', name.trim() || 'Reserved Guest');
                      }
                    }}
                    className="w-full py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>Reserve This Table (Manual)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom State Switcher Action Buttons (100% Manual Admin Control) */}
            <div className="pt-3 border-t border-slate-100 mt-4 grid grid-cols-4 gap-1 text-xs">
              <button
                type="button"
                onClick={() => updateTableStatus(tbl.id, 'AVAILABLE')}
                className={`py-1.5 rounded-lg font-bold text-[11px] text-center transition-all active:scale-90 cursor-pointer ${tbl.status === 'AVAILABLE'
                  ? 'bg-emerald-100 text-emerald-800 shadow-2xs font-extrabold ring-1 ring-emerald-400'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
                title="Mark Available / Unreserved"
              >
                Available
              </button>

              <button
                type="button"
                onClick={() => {
                  const name = tbl.customerName || window.prompt(`Enter guest name for Table ${tbl.number} reservation (optional):`, 'Reserved Guest');
                  if (name !== null) {
                    updateTableStatus(tbl.id, 'RESERVED', name.trim() || 'Reserved Guest');
                  }
                }}
                className={`py-1.5 rounded-lg font-bold text-[11px] text-center transition-all active:scale-90 cursor-pointer ${tbl.status === 'RESERVED'
                  ? 'bg-purple-100 text-purple-900 shadow-2xs font-extrabold ring-1 ring-purple-400'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
                title="Mark Reserved"
              >
                Reserved
              </button>

              <button
                type="button"
                onClick={() => updateTableStatus(tbl.id, 'OCCUPIED')}
                className={`py-1.5 rounded-lg font-bold text-[11px] text-center transition-all active:scale-90 cursor-pointer ${tbl.status === 'OCCUPIED'
                  ? 'bg-amber-100 text-amber-800 shadow-2xs font-extrabold ring-1 ring-amber-400'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
                title="Mark Occupied"
              >
                Occupied
              </button>

              <button
                type="button"
                onClick={() => updateTableStatus(tbl.id, 'CLEANING')}
                className={`py-1.5 rounded-lg font-bold text-[11px] text-center transition-all active:scale-90 cursor-pointer ${tbl.status === 'CLEANING'
                  ? 'bg-blue-100 text-blue-800 shadow-2xs font-extrabold ring-1 ring-blue-400'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
                title="Mark Cleaning"
              >
                Cleaning
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Dining Table</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15"
                  value={newTable.number}
                  onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Seating Capacity
                </label>
                <select
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none"
                >
                  <option value={2}>2 Guests</option>
                  <option value={4}>4 Guests</option>
                  <option value={6}>6 Guests</option>
                  <option value={8}>8 Guests</option>
                  <option value={10}>10+ Large Party</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Floor Section
                </label>
                <select
                  value={newTable.section}
                  onChange={(e) => setNewTable({ ...newTable, section: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none"
                >
                  <option value="Indoor Ground">Indoor Ground</option>
                  <option value="Garden Terrace">Garden Terrace</option>
                  <option value="Family Lounge">Family Lounge</option>
                  <option value="Rooftop Deck">Rooftop Deck</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold shadow-xs hover:bg-slate-800"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
