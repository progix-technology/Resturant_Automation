import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ExternalLink,
  ShoppingBag,
  ArrowRight,
  Clock,
  Armchair,
  BellRing,
  CheckCircle2,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { StatusBadge } from './StatusBadge';
import { formatCurrency } from '../../utils/currency';

export const AdminTopbar = ({ onOpenMobileMenu }) => {
  const { currentAdmin, logout } = useAdminAuth();
  const { orders, stats, waiterCalls = [], resolveWaiterCall, whatsappStatus } = useAdminData();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [activeOrdersOpen, setActiveOrdersOpen] = useState(false);
  const [waiterOpen, setWaiterOpen] = useState(false);

  const dropdownRef = useRef(null);
  const activeOrdersRef = useRef(null);
  const waiterCallsRef = useRef(null);

  const activeOrdersList = useMemo(() => {
    return (orders || []).filter((o) =>
      ['RECEIVED', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.orderStatus)
    );
  }, [orders]);

  const activeCount = stats?.activeOrdersCount ?? activeOrdersList.length;

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (activeOrdersRef.current && !activeOrdersRef.current.contains(e.target)) {
        setActiveOrdersOpen(false);
      }
      if (waiterCallsRef.current && !waiterCallsRef.current.contains(e.target)) {
        setWaiterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-amber-100 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs">
      {/* Left: Mobile hamburger & WhatsApp Live Status Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-amber-950 hover:bg-amber-50 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* WhatsApp Alert Status Toggle Button */}
        <button
          type="button"
          onClick={() => navigate('/admin/settings?tab=NOTIFICATIONS')}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
            whatsappStatus?.isConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 animate-pulse'
          }`}
          title={
            whatsappStatus?.isConnected
              ? 'WhatsApp Connected! Click to manage WhatsApp alerts'
              : 'WhatsApp Disconnected! Click to connect WhatsApp'
          }
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              whatsappStatus?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-ping'
            }`}
          />
          <span className="font-extrabold">
            {whatsappStatus?.isConnected ? 'WhatsApp ON' : 'WhatsApp OFF'}
          </span>
          <span className="text-[10px] font-semibold opacity-75 hidden md:inline">
            ({whatsappStatus?.isConnected ? 'Connected' : 'Click to Pair'})
          </span>
        </button>
      </div>


      {/* Right Action Icons & Admin Profile */}
      <div className="flex items-center gap-2.5">
        {/* Waiter Calls Assistance Dropdown */}
        <div className="relative" ref={waiterCallsRef}>
          <button
            type="button"
            onClick={() => {
              setWaiterOpen(!waiterOpen);
              setActiveOrdersOpen(false);
              setProfileOpen(false);
            }}
            className={`relative px-2.5 py-1.5 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              waiterCalls && waiterCalls.length > 0
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Customer Waiter Help Requests"
          >
            <BellRing className={`w-4 h-4 ${waiterCalls?.length > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">
              {waiterCalls?.length > 0 ? `Need Help (${waiterCalls.length})` : 'Waiter Calls'}
            </span>
            {waiterCalls?.length > 0 && (
              <span className="sm:hidden min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                {waiterCalls.length}
              </span>
            )}
          </button>

          {waiterOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in z-50">
              <div className="px-4 py-3 bg-rose-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Waiter Assistance Requests
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {waiterCalls.length} Active
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {waiterCalls.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">All Tables Attended!</p>
                    <p className="text-[11px] text-slate-400">No active waiter help requests right now.</p>
                  </div>
                ) : (
                  waiterCalls.map((call) => (
                    <div key={call.id} className="p-3 bg-rose-50/50 hover:bg-rose-50 transition-colors flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[11px]">
                            Table {call.tableNumber || '01'}
                          </span>
                          <span>Needs Help!</span>
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Guest: <strong>{call.customerName || 'Diner'}</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => resolveWaiterCall(call.id, call.tableNumber)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs shrink-0 cursor-pointer"
                      >
                        Mark Assisted
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Customer QR View quick link */}
        <a
          href={`/menu/${currentAdmin?.restaurantSlug || 'spice-garden'}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200/80 bg-amber-50/40 text-xs font-semibold text-amber-900 hover:bg-amber-100/70 transition-colors shadow-2xs"
          title="Open Customer QR Menu in new tab"
        >
          <span>Customer Menu</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Live Active Orders Quick Badge & Dropdown */}
        <div className="relative" ref={activeOrdersRef}>
          <button
            type="button"
            onClick={() => {
              setActiveOrdersOpen((prev) => !prev);
              setProfileOpen(false);
              setWaiterOpen(false);
            }}
            className="relative p-2 rounded-xl text-slate-600 hover:text-amber-900 hover:bg-amber-50 transition-colors cursor-pointer"
            title={`${activeCount} Active Kitchen Orders`}
          >
            <ShoppingBag className="w-5 h-5" />
            {activeCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center border-2 border-white shadow-2xs animate-pulse">
                {activeCount}
              </span>
            )}
          </button>

          {activeOrdersOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in z-50">
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Active Kitchen Orders
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                  {activeOrdersList.length} Active
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {activeOrdersList.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 space-y-1">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Kitchen is Caught Up!</p>
                    <p className="text-[11px] text-slate-400">No active kitchen orders in queue right now.</p>
                  </div>
                ) : (
                  activeOrdersList.map((order) => (
                    <div
                      key={order.orderId || order.id}
                      onClick={() => {
                        setActiveOrdersOpen(false);
                        navigate('/admin/orders');
                      }}
                      className="p-3 hover:bg-amber-50/50 transition-colors cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-black border border-slate-200">
                            T-{order.tableNumber || '01'}
                          </span>
                          #{order.orderId || order.id}
                        </span>
                        <StatusBadge status={order.orderStatus} size="xs" />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold truncate max-w-[170px]">
                          {order.customerName || 'Guest Diner'}
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(order.total)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate">
                        {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveOrdersOpen(false);
                    navigate('/admin/orders');
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Manage All Orders in KDS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setActiveOrdersOpen(false);
            }}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-expanded={profileOpen}
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentAdmin?.name || 'Admin'}
              </p>
              <p className="text-[10px] font-bold text-amber-800 tracking-wide uppercase">
                {currentAdmin?.role === 'SUPER_ADMIN' ? 'ADMIN' : (currentAdmin?.role || 'ADMIN')}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shadow-2xs">
              <User className="w-4 h-4 text-amber-800" />
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 animate-fade-in z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0">
                    <User className="w-4 h-4 text-amber-800" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentAdmin?.name || 'Restaurant Admin'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentAdmin?.email || 'resturant1@gmail.com'}
                    </p>
                  </div>
                </div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  Role: {currentAdmin?.role === 'SUPER_ADMIN' ? 'ADMIN' : (currentAdmin?.role || 'ADMIN')}
                </span>
              </div>

              <div className="py-1 text-xs font-medium text-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/admin/settings');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Restaurant Settings</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

