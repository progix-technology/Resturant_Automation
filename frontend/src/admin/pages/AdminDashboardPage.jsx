import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  IndianRupee,
  Armchair,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  Plus,
  UtensilsCrossed,
  BellRing,
  Sparkles,
  ChefHat,
  Calendar,
  Filter,
} from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { StatCard } from '../components/StatCard';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../../utils/currency';

export const AdminDashboardPage = () => {
  const { orders, tables, menuItems, updateOrderStatus, waiterCalls = [], resolveWaiterCall } = useAdminData();
  const navigate = useNavigate();

  const getLocalDateStr = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Specific Date filter state (Defaults to today)
  const todayStr = useMemo(() => getLocalDateStr(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Filter orders strictly by the chosen specific date
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    if (!selectedDate) return orders;

    return orders.filter((o) => {
      if (!o.createdAt) return false;
      return getLocalDateStr(o.createdAt) === selectedDate;
    });
  }, [orders, selectedDate]);

  // Compute dynamic stats based on filtered date
  const dynamicStats = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;
    const completedOrders = filteredOrders.filter(
      (o) => o.paymentStatus === 'COMPLETED' || o.orderStatus === 'COMPLETED' || o.orderStatus === 'SERVED'
    );
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const activeOrdersCount = filteredOrders.filter((o) =>
      ['RECEIVED', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.orderStatus)
    ).length;

    const pendingPaymentsCount = filteredOrders.filter((o) => o.paymentStatus === 'PENDING').length;
    const pendingPaymentsAmount = filteredOrders
      .filter((o) => o.paymentStatus === 'PENDING')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED').length;
    const totalTables = tables.length || 1;
    const tableOccupancyPercent = Math.round((occupiedTables / totalTables) * 100);

    return {
      totalOrdersCount,
      todayOrdersCount: totalOrdersCount,
      completedOrdersCount: completedOrders.length,
      activeOrdersCount,
      totalRevenue,
      tableOccupancyPercent,
      occupiedTables,
      totalTables,
      occupiedTablesCount: occupiedTables,
      totalTablesCount: totalTables,
      pendingPaymentsCount,
      pendingPaymentsAmount,
    };
  }, [filteredOrders, tables]);

  const activeOrders = filteredOrders.filter((o) =>
    ['RECEIVED', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.orderStatus)
  ).slice(0, 5);

  const recentOrders = filteredOrders.slice(0, 6);

  // Dynamically compute Top Selling Dishes from actual filtered orders
  const topSellingDishes = useMemo(() => {
    const itemMap = {};
    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const id = item.id || item.name;
        if (!itemMap[id]) {
          itemMap[id] = {
            id,
            name: item.name,
            price: item.price || 0,
            orderCount: 0,
            revenue: 0,
          };
        }
        const qty = item.quantity || 1;
        itemMap[id].orderCount += qty;
        itemMap[id].revenue += (item.price || 0) * qty;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 4);
  }, [filteredOrders]);

  // Dynamically calculate table turnaround and kitchen prep pace from filtered orders
  const kitchenMetrics = useMemo(() => {
    const completedOrServed = filteredOrders.filter((o) =>
      ['SERVED', 'COMPLETED'].includes(o.orderStatus)
    );

    let avgTurnaroundText = 'No orders served yet';
    if (completedOrServed.length > 0) {
      const etas = completedOrServed
        .map((o) => Number(o.etaMinutes))
        .filter((n) => !isNaN(n) && n > 0);
      if (etas.length > 0) {
        const avg = Math.round(etas.reduce((a, b) => a + b, 0) / etas.length);
        avgTurnaroundText = `~${avg} mins`;
      } else {
        avgTurnaroundText = 'Normal (~30 mins)';
      }
    } else if (filteredOrders.length > 0) {
      avgTurnaroundText = 'Orders in progress';
    }

    const preparingCount = filteredOrders.filter((o) =>
      ['RECEIVED', 'CONFIRMED', 'PREPARING'].includes(o.orderStatus)
    ).length;

    let prepPaceText = 'Kitchen Idle (Ready)';
    let prepPaceColor = 'text-slate-600';

    if (preparingCount > 5) {
      prepPaceText = `High Load (${preparingCount} queued)`;
      prepPaceColor = 'text-rose-600 font-bold';
    } else if (preparingCount > 0) {
      prepPaceText = `Optimal (~${preparingCount * 5 + 10}m)`;
      prepPaceColor = 'text-emerald-700 font-bold';
    }

    return {
      turnaround: avgTurnaroundText,
      prepPace: prepPaceText,
      prepPaceColor,
    };
  }, [filteredOrders]);

  const dateLabel = useMemo(() => {
    if (!selectedDate) return 'Specific Date';
    if (selectedDate === todayStr) return "Today's";
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      }
    } catch {
      // fallback
    }
    return selectedDate;
  }, [selectedDate, todayStr]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <AdminPageHeader
        title="Restaurant Dashboard"
        subtitle="Real-time dining statistics, historical performance, and kitchen queues."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Specific Date Filter Only */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Manage All Orders</span>
            </button>
          </div>
        }
      />

      {/* Live Waiter Assistance Requests Banner */}
      {waiterCalls && waiterCalls.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 text-white border-2 border-rose-500 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg animate-bounce">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-wider text-rose-300 uppercase flex items-center gap-2">
                <span>🚨 Table Assistance Requested ({waiterCalls.length})</span>
              </h3>
              <p className="text-xs text-slate-200 mt-0.5">
                {waiterCalls.map((c) => `Table ${c.tableNumber} (${c.customerName || 'Diner'})`).join(' • ')} requested waiter help!
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {waiterCalls.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => resolveWaiterCall(c.id, c.tableNumber)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-md cursor-pointer transition-all"
              >
                Attend Table {c.tableNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`${dateLabel} Collection`}
          value={formatCurrency(dynamicStats.totalRevenue)}
          trend={dynamicStats.totalRevenue > 0 ? `${dynamicStats.completedOrdersCount} Settled` : '₹0'}
          trendPositive={dynamicStats.totalRevenue > 0}
          subtitle={
            dynamicStats.pendingPaymentsAmount > 0
              ? `₹${dynamicStats.pendingPaymentsAmount} pending collection`
              : dynamicStats.totalRevenue > 0
                ? 'All collections cleared'
                : 'No collections for this period'
          }
          icon={IndianRupee}
        />

        <StatCard
          title={`${dateLabel} Orders`}
          value={dynamicStats.todayOrdersCount}
          trend={dynamicStats.todayOrdersCount > 0 ? `${dynamicStats.activeOrdersCount} in queue` : '0 orders'}
          trendPositive={dynamicStats.todayOrdersCount > 0}
          subtitle={
            dynamicStats.todayOrdersCount > 0
              ? `${dynamicStats.completedOrdersCount} completed / served`
              : 'No orders recorded'
          }
          icon={ShoppingBag}
        />

        <StatCard
          title="Active in Kitchen"
          value={dynamicStats.activeOrdersCount}
          trend={
            dynamicStats.activeOrdersCount === 0
              ? 'Clear'
              : dynamicStats.activeOrdersCount > 5
                ? 'High Load'
                : 'Active'
          }
          trendPositive={dynamicStats.activeOrdersCount <= 5}
          subtitle={
            dynamicStats.activeOrdersCount > 0
              ? `${dynamicStats.activeOrdersCount} orders in preparation`
              : 'No pending kitchen tickets'
          }
          icon={ChefHat}
        />

        <StatCard
          title="Table Occupancy"
          value={`${dynamicStats.occupiedTablesCount} / ${dynamicStats.totalTablesCount}`}
          trend={`${dynamicStats.tableOccupancyPercent}%`}
          trendPositive={dynamicStats.tableOccupancyPercent > 0}
          subtitle={`${dynamicStats.totalTablesCount - dynamicStats.occupiedTablesCount} tables available`}
          icon={Armchair}
        />
      </div>

      {/* Quick Operations Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Quick Actions:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/admin/orders')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Live Kitchen Feed
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/tables')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Table Floor Plan
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/menu')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            + Add Menu Item
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/notifications')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Send WhatsApp Update
          </button>
        </div>
      </div>

      {/* Main Grid: Active Orders Queue & Revenue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Kitchen Feed (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Active Kitchen Orders Queue</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                  {dynamicStats.activeOrdersCount}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Orders requiring kitchen confirmation, prep, or table service
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {activeOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No pending orders right now. Kitchen is all caught up!
              </div>
            ) : (
              activeOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-sm text-slate-900">
                        #{order.orderId}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                        Table {order.tableNumber}
                      </span>
                      <StatusBadge status={order.orderStatus} />
                    </div>

                    <p className="text-xs text-slate-600 mt-1 truncate">
                      {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>Customer: {order.customerName}</span>
                      <span>•</span>
                      <span>Total: {formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  {/* Quick Action Button based on status */}
                  <div className="flex items-center gap-2 shrink-0">
                    {order.orderStatus === 'RECEIVED' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.orderId, 'CONFIRMED')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Accept Order
                      </button>
                    )}
                    {order.orderStatus === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.orderId, 'PREPARING')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Start Cooking
                      </button>
                    )}
                    {order.orderStatus === 'PREPARING' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.orderId, 'READY')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.orderStatus === 'READY' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.orderId, 'SERVED')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Mark Served
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Dishes & Kitchen Performance (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">
              Top Selling Dishes
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Highest ordered items derived from live table orders
            </p>

            <div className="space-y-3">
              {topSellingDishes.length === 0 ? (
                <div className="py-7 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl">
                  <UtensilsCrossed className="w-6 h-6 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-600">No dish sales recorded yet</p>
                  <p className="text-[11px] text-slate-400 px-3">
                    Top-selling dishes will dynamically rank here as diners place orders.
                  </p>
                </div>
              ) : (
                topSellingDishes.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatCurrency(item.price)} • {formatCurrency(item.revenue)} total
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {item.orderCount} ordered
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
              <span>Avg. Table Turnaround</span>
              <strong className="text-slate-900">{kitchenMetrics.turnaround}</strong>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Kitchen Prep Pace</span>
              <strong className={kitchenMetrics.prepPaceColor}>{kitchenMetrics.prepPace}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Recent Table Orders
            </h2>
            <p className="text-xs text-slate-500">
              Latest transactions placed across all tables
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/orders')}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            All Orders →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                <th className="py-2.5 px-3">Order</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Table</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No orders placed yet. Orders from diners will appear here in real-time.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => (
                  <tr key={ord.orderId || ord.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-bold text-slate-900">#{ord.orderId || ord.id}</td>
                    <td className="py-3 px-3 font-medium text-slate-700">{ord.customerName}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">Table {ord.tableNumber}</td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">{formatCurrency(ord.total || 0)}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ord.paymentStatus} size="xs" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ord.orderStatus} size="xs" />
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
