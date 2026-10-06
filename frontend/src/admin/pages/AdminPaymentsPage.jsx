import React, { useState, useMemo } from 'react';
import { useAdminData } from '../context/AdminDataContext';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { SearchInput } from '../components/SearchInput';
import { 
  CreditCard, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  Send, 
  X,
  ExternalLink,
  Smartphone,
  Banknote,
  Receipt
} from 'lucide-react';

export const AdminPaymentsPage = () => {
  const { payments, orders, requestPayment, markPaymentSuccess, showToast } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Payment Request Modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestCustomer, setRequestCustomer] = useState('');
  const [requestTable, setRequestTable] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);

  // Compute payment stats
  const stats = useMemo(() => {
    const totalToday = payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingCount = payments.filter(p => p.status === 'PENDING').length;
    const successCount = payments.filter(p => p.status === 'SUCCESS').length;
    const failedCount = payments.filter(p => p.status === 'FAILED').length;

    return { totalToday, pendingCount, successCount, failedCount };
  }, [payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchSearch = 
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.customerPhone && p.customerPhone.includes(searchTerm));
      const matchMethod = methodFilter === 'ALL' || p.method === methodFilter;
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchMethod && matchStatus;
    });
  }, [payments, searchTerm, methodFilter, statusFilter]);

  // Open Request Modal with optional prefilled order
  const handleOpenRequestModal = (order = null) => {
    if (order) {
      setSelectedOrderId(order.id);
      setRequestAmount(order.totalAmount || order.amount || 0);
      setRequestCustomer(order.customerName || 'Guest');
      setRequestTable(order.tableNumber || '');
    } else {
      setSelectedOrderId('');
      setRequestAmount('');
      setRequestCustomer('');
      setRequestTable('');
    }
    setIsGenerated(false);
    setIsRequestModalOpen(true);
  };

  const handleSelectOrderChange = (e) => {
    const orderId = e.target.value;
    setSelectedOrderId(orderId);
    const found = orders.find(o => o.id === orderId);
    if (found) {
      setRequestAmount(found.totalAmount || found.amount || 0);
      setRequestCustomer(found.customerName || 'Guest');
      setRequestTable(found.tableNumber || '');
    }
  };

  const handleGeneratePaymentLink = (e) => {
    e.preventDefault();
    if (!selectedOrderId || !requestAmount) {
      showToast('Please select an order and amount', 'error');
      return;
    }
    requestPayment(selectedOrderId, Number(requestAmount));
    setIsGenerated(true);
  };

  const columns = [
    {
      key: 'id',
      label: 'Payment ID',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          {row.id}
        </span>
      )
    },
    {
      key: 'orderId',
      label: 'Order ID & Table',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-medium text-slate-700 block">
            {row.orderId}
          </span>
          <span className="text-xs text-slate-400">
            Table {row.tableNumber || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-slate-800">{row.customerName}</p>
          <p className="text-xs text-slate-400">{row.customerPhone || 'Walk-in'}</p>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className="text-sm font-bold text-slate-900">
          ₹{row.amount.toLocaleString()}
        </span>
      )
    },
    {
      key: 'method',
      label: 'Method',
      render: (row) => {
        const getIcon = () => {
          switch (row.method) {
            case 'UPI': return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
            case 'CARD': return <CreditCard className="w-3.5 h-3.5 text-purple-500" />;
            case 'CASH': return <Banknote className="w-3.5 h-3.5 text-emerald-500" />;
            default: return <Receipt className="w-3.5 h-3.5 text-slate-400" />;
          }
        };
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
            {getIcon()}
            <span>{row.method || 'MOCK'}</span>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'createdAt',
      label: 'Date & Time',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'PENDING' && (
            <button
              onClick={() => markPaymentSuccess(row.id)}
              className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Paid
            </button>
          )}
          {row.status === 'SUCCESS' && (
            <span className="text-xs text-slate-400 italic">Settled</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payment & Billing"
        description="Monitor real-time payments, send instant UPI/QR payment requests, and reconcile diner tabs."
        actions={
          <button
            onClick={() => handleOpenRequestModal()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Request Payment
          </button>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Collection"
          value={`₹${stats.totalToday.toLocaleString()}`}
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingCount}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Successful Transactions"
          value={stats.successCount}
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          title="Failed / Cancelled"
          value={stats.failedCount}
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by Payment ID, Order ID, Customer..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">All Methods</option>
            <option value="UPI">UPI / QR</option>
            <option value="CARD">Card</option>
            <option value="CASH">Cash</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredPayments}
          keyExtractor={(row) => row.id}
          emptyMessage="No payment records found matching your filters."
        />
      </div>

      {/* Request Payment Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Request Payment</h3>
                  <p className="text-xs text-slate-500">Generate UPI payment link and mock QR</p>
                </div>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {!isGenerated ? (
              <form onSubmit={handleGeneratePaymentLink} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Active Order *
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={handleSelectOrderChange}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Choose Order --</option>
                    {orders
                      .filter(o => !['CANCELLED', 'REJECTED'].includes(o.orderStatus || o.status))
                      .map(order => {
                        const oid = order.orderId || order.id;
                        const amt = order.total || order.totalAmount || 0;
                        return (
                          <option key={oid} value={oid}>
                            {oid} - Table {order.tableNumber || '01'} - {order.customerName} (₹{amt})
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Customer
                    </label>
                    <input
                      type="text"
                      value={requestCustomer}
                      readOnly
                      placeholder="Diner Name"
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Table
                    </label>
                    <input
                      type="text"
                      value={requestTable ? `Table ${requestTable}` : ''}
                      readOnly
                      placeholder="Table #"
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    Generate & Send Request
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Payment Request Dispatched!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Mock UPI request generated for Order <span className="font-semibold text-slate-700">{selectedOrderId}</span>
                  </p>
                </div>

                {/* Mock QR Placeholder */}
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center max-w-[200px] mx-auto">
                  <div className="w-32 h-32 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-inner">
                    <QrCode className="w-24 h-24 text-slate-800" />
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 mt-2">
                    UPI: spicegarden@okhdfcbank
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    ₹{Number(requestAmount).toLocaleString()}
                  </p>
                </div>

                {/* Mock Payment link */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-left text-xs text-amber-800">
                  <p className="font-semibold">Simulated Customer Link:</p>
                  <p className="text-[11px] font-mono text-amber-700 truncate mt-0.5">
                    https://spicegarden.menu/pay/{selectedOrderId}?amount={requestAmount}
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRequestModalOpen(false);
                      setIsGenerated(false);
                    }}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
