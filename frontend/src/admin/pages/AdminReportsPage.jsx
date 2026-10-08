import React, { useState, useEffect, useMemo } from 'react';
import { useAdminData } from '../context/AdminDataContext';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { StatCard } from '../components/StatCard';
import {
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  Users,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Clock,
  UtensilsCrossed,
  RefreshCw,
  Sparkles,
  Lock,
  ShieldAlert,
  Crown,
} from 'lucide-react';
import { PlanUpgradeModal } from '../components/PlanUpgradeModal';
import { getPlanLimits } from '../utils/planLimits';

export const AdminReportsPage = () => {
  const { orders, loadOrders, loadMenuItems, showToast, isLoading, settings } = useAdminData();
  const [timeFilter, setTimeFilter] = useState('TODAY'); // Default to TODAY for parity with Dashboard
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const limits = useMemo(() => getPlanLimits(settings), [settings]);

  useEffect(() => {
    loadOrders();
    loadMenuItems();
  }, []);

  const getLocalDateStr = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ── 1. Time-filtered orders ─────────────────────────────────────────────
  const displayOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    if (timeFilter === 'ALL') return orders;

    const todayStr = getLocalDateStr(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterdayDate);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return orders.filter((o) => {
      const rawDate = o.createdAt || o.timestamp || o.date;
      if (!rawDate) return false;

      const dateStr = getLocalDateStr(rawDate);
      const orderDateObj = new Date(rawDate);

      if (timeFilter === 'TODAY') {
        return dateStr === todayStr;
      }
      if (timeFilter === 'YESTERDAY') {
        return dateStr === yesterdayStr;
      }
      if (timeFilter === '7DAYS') {
        return orderDateObj >= sevenDaysAgo;
      }
      if (timeFilter === '30DAYS') {
        return orderDateObj >= thirtyDaysAgo;
      }
      return true;
    });
  }, [orders, timeFilter]);

  // ── 2. Primary KPI Metrics ──────────────────────────────────────────────
  const metrics = useMemo(() => {
    const validOrders = displayOrders.filter(
      (o) => !['CANCELLED', 'REJECTED'].includes((o.orderStatus || o.status || '').toUpperCase())
    );

    // Settled/Completed orders revenue (matching Dashboard collection formula)
    const completedOrders = validOrders.filter(
      (o) => o.paymentStatus === 'COMPLETED' || o.orderStatus === 'COMPLETED' || o.orderStatus === 'SERVED'
    );

    // If no orders are marked completed yet, fallback to valid orders sum
    const totalRevenue = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || o.amount || 0), 0)
      : validOrders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || o.amount || 0), 0);

    const totalOrders = validOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const dinersServed = validOrders.reduce(
      (sum, o) => sum + Number(o.guestCount || o.diners || 2),
      0
    );

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      dinersServed,
    };
  }, [displayOrders]);

  // ── 3. Dynamic Category Breakdown ───────────────────────────────────────
  const categoryData = useMemo(() => {
    const cats = {};
    const palette = ['bg-amber-500', 'bg-orange-500', 'bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500'];
    let colorIdx = 0;

    displayOrders.forEach((o) => {
      if (['CANCELLED', 'REJECTED'].includes((o.orderStatus || o.status || '').toUpperCase())) return;
      (o.items || []).forEach((item) => {
        const cat = item.category || 'Main Course';
        if (!cats[cat]) {
          cats[cat] = { count: 0, revenue: 0, color: palette[colorIdx % palette.length] };
          colorIdx++;
        }
        cats[cat].count += item.quantity || 1;
        cats[cat].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    const maxRev = Math.max(...Object.values(cats).map((c) => c.revenue), 1);
    return { cats, maxRev };
  }, [displayOrders]);

  // ── 4. Dynamic Payment Breakdown ────────────────────────────────────────
  const paymentBreakdown = useMemo(() => {
    const validOrders = displayOrders.filter(
      (o) => !['CANCELLED', 'REJECTED'].includes((o.orderStatus || o.status || '').toUpperCase())
    );
    const totalCount = validOrders.length || 1;

    const upiOrders = validOrders.filter((o) => {
      const m = (o.paymentMethod || 'UPI').toUpperCase();
      return m.includes('UPI') || m.includes('QR') || m.includes('ONLINE') || m.includes('RAZORPAY');
    });
    const cashOrders = validOrders.filter((o) => (o.paymentMethod || '').toUpperCase().includes('CASH'));
    const cardOrders = validOrders.filter((o) => (o.paymentMethod || '').toUpperCase().includes('CARD'));

    const upiAmt = upiOrders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0);
    const cashAmt = cashOrders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0);
    const cardAmt = cardOrders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0);

    return [
      {
        method: 'UPI / Digital QR',
        percentage: Math.round((upiOrders.length / totalCount) * 100),
        color: 'bg-amber-500',
        amount: `₹${upiAmt.toLocaleString('en-IN')}`,
        count: upiOrders.length,
      },
      {
        method: 'Cash at Counter',
        percentage: Math.round((cashOrders.length / totalCount) * 100),
        color: 'bg-emerald-500',
        amount: `₹${cashAmt.toLocaleString('en-IN')}`,
        count: cashOrders.length,
      },
      {
        method: 'Credit / Debit Card',
        percentage: Math.round((cardOrders.length / totalCount) * 100),
        color: 'bg-indigo-500',
        amount: `₹${cardAmt.toLocaleString('en-IN')}`,
        count: cardOrders.length,
      },
    ];
  }, [displayOrders]);

  // ── 5. Top Selling Dishes ────────────────────────────────────────────────
  const topSelling = useMemo(() => {
    const itemMap = new Map();
    displayOrders.forEach((o) => {
      if (['CANCELLED', 'REJECTED'].includes((o.orderStatus || o.status || '').toUpperCase())) return;
      (o.items || []).forEach((item) => {
        const key = item.name;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            name: item.name,
            category: item.category || 'Specialties',
            orders: 0,
            revenueVal: 0,
          });
        }
        const record = itemMap.get(key);
        record.orders += item.quantity || 1;
        record.revenueVal += (item.price || 0) * (item.quantity || 1);
      });
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.revenueVal - a.revenueVal)
      .slice(0, 6)
      .map((i) => ({ ...i, revenue: `₹${i.revenueVal.toLocaleString('en-IN')}` }));
  }, [displayOrders]);

  // ── 6. Table Performance ─────────────────────────────────────────────────
  const tableStats = useMemo(() => {
    const tblMap = new Map();
    displayOrders.forEach((o) => {
      if (['CANCELLED', 'REJECTED'].includes((o.orderStatus || o.status || '').toUpperCase())) return;
      const tbl = o.tableNumber || o.tableNo || '01';
      if (!tblMap.has(tbl)) {
        tblMap.set(tbl, { table: `Table ${tbl}`, turns: 0, revenueVal: 0 });
      }
      const record = tblMap.get(tbl);
      record.turns += 1;
      record.revenueVal += Number(o.total || o.totalAmount || 0);
    });

    return Array.from(tblMap.values())
      .sort((a, b) => b.revenueVal - a.revenueVal)
      .slice(0, 6)
      .map((t) => ({ ...t, revenue: `₹${t.revenueVal.toLocaleString('en-IN')}`, avgTime: '22 mins' }));
  }, [displayOrders]);

  // ── 7. CSV Export ─────────────────────────────────────────────────────────
  // ── 7. CSV Export ─────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!limits.analyticsEnabled) {
      setIsUpgradeModalOpen(true);
      return;
    }

    const csvRows = [
      ['Spice Garden Restaurant - Business Analytics Report'],
      ['Timeframe', timeFilter],
      ['Generated At', new Date().toLocaleString()],
      [],
      ['Metric', 'Value'],
      ['Total Gross Revenue', `INR ${metrics.totalRevenue}`],
      ['Total Completed Orders', metrics.totalOrders],
      ['Average Order Value', `INR ${metrics.avgOrderValue}`],
      ['Total Diners Served', metrics.dinersServed],
      [],
      ['Top Revenue Items', 'Category', 'Quantity Sold', 'Total Sales'],
      ...topSelling.map((i) => [i.name, i.category, i.orders, i.revenue]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spice_garden_analytics_${timeFilter.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Analytics CSV exported successfully!', 'success');
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sales & Business Analytics"
        subtitle={`Real-time reporting & customer dining trends. Feature status: ${limits.analyticsEnabled ? 'Enabled (Enterprise Plan)' : 'Locked (Requires Enterprise Plan)'}.`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadOrders()}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
              title="Refresh Analytics Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
            </button>
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                limits.analyticsEnabled
                  ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {!limits.analyticsEnabled && <Lock className="w-3.5 h-3.5 text-slate-600" />}
              <Download className="w-4 h-4" />
              <span>Export CSV Report</span>
            </button>
          </div>
        }
      />

      {/* Locked Plan Banner if not Enterprise */}
      {!limits.analyticsEnabled && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-300 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-900">
                  Sales Analytics Dashboard Locked ({limits.planName})
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                  Enterprise Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Detailed sales reporting, revenue graphs, dining trends, and CSV exports are reserved exclusively for Enterprise Scale plan subscribers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shrink-0 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Upgrade to Enterprise</span>
          </button>
        </div>
      )}

      {/* Time Horizon Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Analytics Timeframe:</span>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
          {[
            { id: 'ALL', label: 'All Time' },
            { id: 'TODAY', label: 'Today' },
            { id: 'YESTERDAY', label: 'Yesterday' },
            { id: '7DAYS', label: 'Last 7 Days' },
            { id: '30DAYS', label: 'Last 30 Days' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${timeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Revenue"
          value={`₹${metrics.totalRevenue.toLocaleString('en-IN')}`}
          change={timeFilter === 'ALL' ? 'Live total' : `${timeFilter} period`}
          isPositive={true}
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Orders Processed"
          value={metrics.totalOrders}
          change={`${displayOrders.length} total recorded`}
          isPositive={true}
          icon={ShoppingBag}
          color="amber"
        />
        <StatCard
          title="Average Order Value"
          value={`₹${metrics.avgOrderValue.toLocaleString('en-IN')}`}
          change="Per table ticket"
          isPositive={true}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Diners Served"
          value={metrics.dinersServed}
          change="Estimated guests"
          icon={Users}
          color="indigo"
        />
      </div>

      {displayOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Sales Data for Selected Period</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try selecting <span className="font-bold text-amber-800">"All Time"</span> timeframe tab above or place customer test orders to view real-time revenue graphs.
          </p>
          <button
            onClick={() => setTimeFilter('ALL')}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-amber-600 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            View All Time Data
          </button>
        </div>
      ) : (
        <>
          {/* Performance Charts & Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales by Category */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Category Revenue
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">By sales volume</span>
              </div>

              {Object.keys(categoryData.cats).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No item category data</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {Object.entries(categoryData.cats).map(([cat, val]) => {
                    const pct = Math.round((val.revenue / categoryData.maxRev) * 100);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800">{cat}</span>
                          <span className="font-bold text-slate-900">
                            ₹{val.revenue.toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">({val.count} items)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${val.color} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.max(6, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Methods Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-blue-600" />
                  Payment Settlements
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Live Channels</span>
              </div>

              <div className="space-y-3 pt-2">
                {paymentBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.method}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.count} orders ({item.percentage}%)
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">{item.amount}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
                UPI QR payments account for primary guest transactions
              </div>
            </div>

            {/* Table Utilization */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Table Turnover & Revenue
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Top tables</span>
              </div>

              {tableStats.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No table utilization records</p>
              ) : (
                <div className="space-y-2 pt-1">
                  {tableStats.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 hover:bg-amber-50/40 rounded-xl transition-colors border border-slate-100"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{t.table}</p>
                        <p className="text-[10px] text-slate-500">
                          {t.turns} {t.turns === 1 ? 'order turn' : 'order turns'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-emerald-700">{t.revenue}</p>
                        <span className="text-[10px] text-slate-400 font-medium">gross sales</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Revenue Dishes Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Highest Revenue Dishes
                </h3>
                <p className="text-xs text-slate-500">
                  Most requested kitchen items during the selected period
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">Dish Name</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3 text-right">Quantity Sold</th>
                    <th className="px-5 py-3 text-right">Gross Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {topSelling.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-slate-400 font-medium">
                        No dish sales recorded yet
                      </td>
                    </tr>
                  ) : (
                    topSelling.map((dish, i) => (
                      <tr key={i} className="hover:bg-amber-50/40 transition-colors">
                        <td className="px-5 py-3.5 font-black text-amber-600">#{i + 1}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{dish.name}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                            {dish.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-800">
                          {dish.orders}
                        </td>
                        <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                          {dish.revenue}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Plan Upgrade Modal Alert */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Analytics Dashboard Locked"
        featureName="Sales & Business Analytics"
        currentPlan={limits.planName}
        limitText="Sales and Business Analytics reporting is exclusive to Enterprise Scale Plan."
        message="Please purchase this plan to perform this action."
      />
    </div>
  );
};
