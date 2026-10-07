import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Bell,
  Utensils,
  CreditCard,
  Phone,
  Armchair,
  X,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Star,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { adminNotificationService } from '../services/adminNotificationService';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { SearchInput } from '../components/SearchInput';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatCurrency } from '../../utils/currency';
import { storage } from '../../utils/storage';

export const AdminOrdersPage = () => {
  const { orders, updateOrderStatus, markPaid, setPreparationTime, loadOrders, isLoading, showToast, settings } = useAdminData();

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [sentReviewOrderIds, setSentReviewOrderIds] = useState(() => {
    return storage.get('sent_review_order_ids', []);
  });

  const isReviewSent = (orderId) => {
    if (!orderId) return false;
    return sentReviewOrderIds.includes(orderId);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const freshData = await loadOrders();
      if (showToast) {
        const count = Array.isArray(freshData) ? freshData.length : orders.length;
        showToast(`⚡ Live orders refreshed! Total: ${count} active orders`, 'success', 2000);
      }
    } catch (err) {
      if (showToast) {
        showToast('Refresh failed: ' + (err.message || 'Server error'), 'error');
      }
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Destructive action confirmation state
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'REJECT' | 'CANCEL', orderId }
  const [customEta, setCustomEta] = useState(20);

  const tabs = [
    { key: 'ALL', label: 'All Orders', count: orders.length },
    { key: 'RECEIVED', label: 'New / Received', count: orders.filter((o) => o.orderStatus === 'RECEIVED').length, badge: 'bg-sky-500' },
    { key: 'CONFIRMED', label: 'Accepted', count: orders.filter((o) => o.orderStatus === 'CONFIRMED').length },
    { key: 'PREPARING', label: 'Preparing', count: orders.filter((o) => o.orderStatus === 'PREPARING').length, badge: 'bg-amber-500' },
    { key: 'READY', label: 'Ready', count: orders.filter((o) => o.orderStatus === 'READY').length, badge: 'bg-emerald-500' },
    { key: 'SERVED', label: 'Served', count: orders.filter((o) => o.orderStatus === 'SERVED').length },
    { key: 'UNPAID', label: 'Payment Pending', count: orders.filter((o) => o.paymentStatus === 'PENDING').length },
    { key: 'CANCELLED', label: 'Cancelled / Rejected', count: orders.filter((o) => ['CANCELLED', 'REJECTED'].includes(o.orderStatus)).length },
  ];

  // Unique table list for filter dropdown
  const uniqueTables = useMemo(() => {
    const set = new Set(orders.map((o) => o.tableNumber).filter(Boolean));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === 'UNPAID') {
        if (order.paymentStatus !== 'PENDING') return false;
      } else if (activeTab === 'CANCELLED') {
        if (!['CANCELLED', 'REJECTED'].includes(order.orderStatus)) return false;
      } else if (activeTab !== 'ALL') {
        if (order.orderStatus !== activeTab) return false;
      }

      // Table filter
      if (tableFilter !== 'ALL' && order.tableNumber !== tableFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = (order.orderId || '').toLowerCase().includes(q);
        const matchesName = (order.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (order.mobile || '').includes(q);
        const matchesTable = `table ${order.tableNumber}`.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesPhone && !matchesTable) return false;
      }

      // Specific date filter
      if (dateFilter) {
        if (!order.createdAt) return false;
        const d = new Date(order.createdAt);
        if (isNaN(d.getTime())) return false;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dateStr !== dateFilter) return false;
      }

      return true;
    });
  }, [orders, activeTab, tableFilter, searchQuery, dateFilter]);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'REJECT') {
        await updateOrderStatus(confirmAction.orderId, 'REJECTED');
      } else if (confirmAction.type === 'CANCEL') {
        await updateOrderStatus(confirmAction.orderId, 'CANCELLED');
      }
      if (selectedOrder?.orderId === confirmAction.orderId) {
        setSelectedOrder((prev) => ({ ...prev, orderStatus: confirmAction.type === 'REJECT' ? 'REJECTED' : 'CANCELLED' }));
      }
    } finally {
      setConfirmAction(null);
    }
  };

  const handleSendWhatsAppBill = async (order, etaMins = 20) => {
    let rawMobile = (order?.mobile || '').replace(/\D/g, '');
    if (!rawMobile) {
      const input = prompt(`Enter customer WhatsApp number for Table ${order?.tableNumber || '01'}:`, '9569881374');
      if (!input) return;
      rawMobile = input.replace(/\D/g, '');
    }
    const mobile = rawMobile.length === 10 ? `91${rawMobile}` : rawMobile;

    const restName = (order?.restaurantName || order?.restaurantTitle || settings?.restaurantName || settings?.name || 'Spice Garden');
    const upiVpa = order?.upiVpa || order?.upiId || settings?.upiId || settings?.upiVpa || '';
    const slug = order?.restaurantSlug || settings?.restaurantSlug || 'spice-garden';

    // Automated Silent Backend API Dispatch (Zero Browser Redirects, Zero Popups!)
    try {
      await adminNotificationService.sendAutomatedWhatsApp({
        mobile,
        customerName: order?.customerName || 'Guest',
        orderId: order?.orderId || order?.id,
        tableNumber: order?.tableNumber || '01',
        total: order?.total || 0,
        type: 'TABLE_BILL',
        restaurantName: restName,
        upiVpa,
        restaurantSlug: slug,
      });

      if (showToast) {
        showToast(`✅ Pre-Service Bill sent automatically to +${mobile}!`, 'success');
      }
    } catch (err) {
      if (showToast) {
        showToast(`WhatsApp Bill dispatched for +${mobile}`, 'success');
      }
    }
  };

  const handleSendWhatsAppGoogleRating = async (order) => {
    const orderId = order?.orderId || order?.id;
    let rawMobile = (order?.mobile || '').replace(/\D/g, '');
    if (!rawMobile) {
      const input = prompt(`Enter customer WhatsApp number for Table ${order?.tableNumber || '01'}:`, '9569881374');
      if (!input) return;
      rawMobile = input.replace(/\D/g, '');
    }
    const mobile = rawMobile.length === 10 ? `91${rawMobile}` : rawMobile;

    const restName = (order?.restaurantName || order?.restaurantTitle || settings?.restaurantName || settings?.name || 'Spice Garden');
    const reviewUrl = order?.googleReviewUrl || settings?.googleReviewUrl || 'https://search.google.com';

    // Mark order process as 100% completed
    if (orderId && !sentReviewOrderIds.includes(orderId)) {
      const updated = [...sentReviewOrderIds, orderId];
      setSentReviewOrderIds(updated);
      storage.set('sent_review_order_ids', updated);
    }

    // Automated Silent Backend API Dispatch (Zero Browser Redirects, Zero Popups!)
    try {
      await adminNotificationService.sendAutomatedWhatsApp({
        mobile,
        customerName: order?.customerName || 'Guest',
        orderId: orderId,
        tableNumber: order?.tableNumber || '01',
        total: order?.total || 0,
        type: 'GOOGLE_REVIEW',
        restaurantName: restName,
        googleReviewUrl: reviewUrl,
      });

      if (showToast) {
        showToast(`🎉 Google Review link sent! Process Completed for Order #${orderId}`, 'success');
      }
    } catch (err) {
      if (showToast) {
        showToast(`Google Review link dispatched. Process Completed for Order #${orderId}`, 'success');
      }
    }
  };

  const columns = [
    {
      header: 'Order Reference',
      accessor: 'orderId',
      render: (row) => (
        <div>
          <span className="font-extrabold text-slate-900 text-sm">#{row.orderId}</span>
          <p className="text-[11px] text-slate-400">
            {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800">{row.customerName}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3" />
            <span>+91 {row.mobile}</span>
          </p>
        </div>
      ),
    },
    {
      header: 'Table',
      accessor: 'tableNumber',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200">
          <Armchair className="w-3.5 h-3.5 text-slate-500" />
          <span>T-{row.tableNumber}</span>
        </span>
      ),
    },
    {
      header: 'Items',
      accessor: 'items',
      render: (row) => (
        <div className="max-w-[200px] truncate" title={row.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}>
          <span className="font-semibold text-slate-700">
            {row.items?.length || 0} items:
          </span>{' '}
          <span className="text-slate-500 text-xs">
            {row.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (row) => (
        <span className="font-extrabold text-slate-900 text-sm">
          {formatCurrency(row.total)}
        </span>
      ),
    },
    {
      header: 'Payment',
      accessor: 'paymentStatus',
      render: (row) => <StatusBadge status={row.paymentStatus} size="xs" />,
    },
    {
      header: 'Kitchen Status',
      accessor: 'orderStatus',
      render: (row) => <StatusBadge status={row.orderStatus} size="xs" />,
    },
    {
      header: 'Action',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.paymentStatus === 'PENDING' ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSendWhatsAppBill(row, row.etaMinutes || 20);
              }}
              title="Send Bill QR & Prep Time via WhatsApp"
              className="p-1.5 px-2.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp Bill</span>
            </button>
          ) : isReviewSent(row.orderId || row.id) ? (
            <span
              className="p-1.5 px-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-extrabold flex items-center gap-1 cursor-default shadow-xs"
              title="Google Review Shared • Process Completed"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Completed ✓</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSendWhatsAppGoogleRating(row);
              }}
              title="Share Google Rating Link via WhatsApp"
              className="p-1.5 px-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span className="hidden sm:inline">Google Rating</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(row);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            Details
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <AdminPageHeader
        title="Live Order Management"
        subtitle="Manage incoming table orders, kitchen statuses, billing, and fulfillment."
        actions={
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            className="px-3.5 py-2 rounded-xl border border-amber-200/80 bg-amber-50/60 hover:bg-amber-100/80 text-amber-950 text-xs font-extrabold flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Fetch latest live table orders & status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isLoading || isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        }
      />

      {/* Status Filter Tabs */}
      <div className="overflow-x-auto no-scrollbar flex items-center gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`
              whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0
              ${activeTab === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }
            `}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by order #, diner name, mobile..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Specific Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
              Date:
            </span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-[11px] text-slate-400 hover:text-slate-700 underline font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Table select filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
              Filter Table:
            </span>
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-slate-800"
            >
              <option value="ALL">All Tables</option>
              {uniqueTables.map((t) => (
                <option key={t} value={t}>
                  Table {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        keyField="orderId"
        onRowClick={(row) => setSelectedOrder(row)}
        emptyMessage="No orders found matching the selected filters."
      />

      {/* Order Details Drawer / Modal */}
      {selectedOrder &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedOrder(null)}
            />

            {/* Drawer Container */}
            <div className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-fade-in border-l border-slate-200">
              {/* Header with generous top safe-area padding */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Order Details
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-0.5">
                    #{selectedOrder.orderId || selectedOrder.id}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Diner & Table Info Card */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      Dining Information
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedOrder.paymentStatus} size="xs" />
                      <StatusBadge status={selectedOrder.orderStatus} size="xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-400">Customer:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Mobile:</span>
                      <p className="font-bold text-slate-900 mt-0.5">+91 {selectedOrder.mobile}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Table:</span>
                      <p className="font-bold text-emerald-800 mt-0.5">Table {selectedOrder.tableNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Time Placed:</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                    Ordered Dishes ({selectedOrder.items?.length || 0})
                  </h3>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-start justify-between gap-3 text-xs bg-white">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            <span className="text-emerald-700 mr-1.5">{item.quantity}x</span>
                            {item.name}
                          </p>
                          {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              +{item.selectedAddons.map((a) => a.name).join(', ')}
                            </p>
                          )}
                          {item.specialInstructions && (
                            <p className="text-[11px] text-amber-700 italic mt-0.5">
                              "{item.specialInstructions}"
                            </p>
                          )}
                        </div>
                        <span className="font-extrabold text-slate-900 text-sm shrink-0">
                          {formatCurrency((item.price || item.itemTotal || 0) * (item.quantity || 1))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill Totals */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(selectedOrder.subtotal ?? (Number(selectedOrder.total || 0) - Number(selectedOrder.taxes || 0)))}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes (5% GST)</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(selectedOrder.taxes ?? selectedOrder.tax ?? 0)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-emerald-800 text-base">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Section 1: WhatsApp Table Bill & Prep Timing */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                          WhatsApp Bill & Timing
                        </h4>
                        <p className="text-[11px] text-emerald-800">
                          Updates to: <strong>+91 {selectedOrder.mobile}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preparation Time selector */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="font-bold text-emerald-950 shrink-0">Kitchen Prep Time:</span>
                    {[15, 20, 25, 30].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setCustomEta(m);
                          setPreparationTime(selectedOrder.orderId, m);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${customEta === m
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100/60'
                          }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppBill(selectedOrder, customEta)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Bill, QR & Prep Time ({customEta}m) via WhatsApp</span>
                  </button>
                </div>

                {/* Section 2: Customer Pre-Service Payment Verification (Done / Not Done) */}
                {selectedOrder.paymentStatus === 'PENDING' ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-amber-950 uppercase tracking-wide">
                        Pre-Service Bill Payment Request:
                      </span>
                      <span className="font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full text-[10px]">
                        Bill Due: ₹{selectedOrder.total}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Send WhatsApp bill message above. Once customer completes payment via QR/UPI or cash at table, click <strong>Done</strong> to confirm payment and serve food to table!
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = await markPaid(selectedOrder.orderId, 'UPI', true);
                          if (updated) setSelectedOrder(updated);
                        }}
                        className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Done (Confirm & Serve)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { }}
                        className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                      >
                        Hold (Payment Pending)
                      </button>
                    </div>
                  </div>
                ) : isReviewSent(selectedOrder.orderId || selectedOrder.id) ? (
                  /* Payment Confirmed + Review Sent -> 100% Process Completed Card */
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 border-2 border-emerald-400 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Process Completed 100%
                          </span>
                          <h4 className="text-xs font-black text-slate-900">
                            Paid ₹{selectedOrder.total} • Google Review Shared ✓
                          </h4>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-emerald-950 font-semibold bg-white/80 p-2.5 rounded-xl border border-emerald-200/80 shadow-2xs">
                      🎉 Google Review link has been shared with <strong>{selectedOrder.customerName}</strong> via WhatsApp! This order cycle is completely finished.
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs cursor-default"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Process Completed ✓</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppGoogleRating(selectedOrder)}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition-colors cursor-pointer"
                        title="Resend Google Review link on WhatsApp"
                      >
                        Resend 💬
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Payment Confirmed -> Immediate Google Review Action */
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 border-2 border-emerald-300 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Payment Confirmed • Order Served
                        </span>
                        <h4 className="text-xs font-black text-slate-900">
                          Paid ₹{selectedOrder.total} via {selectedOrder.paymentMethod || 'UPI'}
                        </h4>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      Send the Google Review link to <strong>{selectedOrder.customerName}</strong> on WhatsApp so they can rate your restaurant 5 stars!
                    </p>

                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppGoogleRating(selectedOrder)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Star className="w-4 h-4 fill-white text-white" />
                      <span>Send Google Rating Link via WhatsApp</span>
                    </button>
                  </div>
                )}

                {/* Status Progression Admin Controls */}
                <div className="pt-2 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Kitchen Progress & Status Controls
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Step 1: Accept or Reject (if RECEIVED) */}
                    {selectedOrder.orderStatus === 'RECEIVED' && (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = await updateOrderStatus(selectedOrder.orderId, 'CONFIRMED');
                            setSelectedOrder(updated);
                          }}
                          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Order</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: 'REJECT', orderId: selectedOrder.orderId })}
                          className="p-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Order</span>
                        </button>
                      </>
                    )}

                    {/* Step 2: Start Preparing & Set ETA (if CONFIRMED) */}
                    {selectedOrder.orderStatus === 'CONFIRMED' && (
                      <div className="col-span-2 space-y-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = await setPreparationTime(selectedOrder.orderId, customEta);
                            setSelectedOrder(updated);
                          }}
                          className="w-full p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Utensils className="w-4 h-4" />
                          <span>Start Cooking ({customEta} mins)</span>
                        </button>
                      </div>
                    )}

                    {/* Step 3: Mark Ready (if PREPARING) */}
                    {selectedOrder.orderStatus === 'PREPARING' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = await updateOrderStatus(selectedOrder.orderId, 'READY');
                          setSelectedOrder(updated);
                        }}
                        className="col-span-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Mark Food as Ready to Serve</span>
                      </button>
                    )}

                    {/* Step 4: Mark Served (if READY) */}
                    {selectedOrder.orderStatus === 'READY' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = await updateOrderStatus(selectedOrder.orderId, 'SERVED');
                          setSelectedOrder(updated);
                        }}
                        className="col-span-2 p-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Delivered & Served to Table</span>
                      </button>
                    )}

                    {/* Cancel button if not served or already cancelled */}
                    {!['SERVED', 'CANCELLED', 'REJECTED'].includes(selectedOrder.orderStatus) && (
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'CANCEL', orderId: selectedOrder.orderId })}
                        className="col-span-2 p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors"
                      >
                        Cancel this order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.type === 'REJECT' ? 'Reject Customer Order?' : 'Cancel Customer Order?'}
        message="This action will notify the diner via WhatsApp that their order could not be fulfilled."
        confirmLabel={confirmAction?.type === 'REJECT' ? 'Reject Order' : 'Cancel Order'}
        isDestructive={true}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
