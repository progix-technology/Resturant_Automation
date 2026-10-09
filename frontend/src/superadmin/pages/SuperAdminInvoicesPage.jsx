import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Search,
  ExternalLink,
  Printer,
  X,
  Zap,
  DollarSign,
  Landmark,
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';

export const SuperAdminInvoicesPage = () => {
  const { invoices, tenants, plans, markInvoicePaid, generateInvoice, showToast } = useSuperAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // ── Derived Billing Stats ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === 'PAID');
    const pendingInvoices = invoices.filter((i) => i.status === 'PENDING');
    const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');

    const totalPaid = paidInvoices.reduce((acc, i) => acc + (i.total || 0), 0);
    const totalPending = pendingInvoices.reduce((acc, i) => acc + (i.total || 0), 0);
    const totalTax = paidInvoices.reduce((acc, i) => acc + (i.tax || 0), 0);

    return {
      count: invoices.length,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length,
      totalPaid,
      totalPending,
      totalTax,
    };
  }, [invoices]);

  // ── Filtered Invoices List ─────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        (inv.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.restaurantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.utrNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.paymentMethod || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    const tenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];
    const plan = plans.find((p) => p.id === selectedPlanId) || plans[0];

    if (!tenant) {
      showToast('Please select a restaurant client', 'error');
      return;
    }

    try {
      await generateInvoice(
        {
          id: tenant.id,
          name: tenant.name,
          planName: plan?.name || tenant.planName,
          planAmount: plan?.monthlyPrice || tenant.planAmount,
          billingCycle: 'MONTHLY',
        },
        plan
      );
      setShowGenerateModal(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wide mb-2">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>Platform Revenue Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            B2B Billing Ledger & Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Real-time tracking of SaaS subscription payments, 18% GST tax collection, UTR transaction approvals, and printable receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (tenants.length > 0) {
              setSelectedTenantId(tenants[0]?.id || '');
              setSelectedPlanId(plans[0]?.id || '');
            }
            setShowGenerateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* ── 4 Real-time Revenue Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Settled Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">₹{stats.totalPaid.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{stats.paidCount} Invoices Settled</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Recharge</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-800">₹{stats.totalPending.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{stats.pendingCount} Pending Approvals</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">GST Collected (18%)</span>
            <Landmark className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">₹{stats.totalTax.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Compliant Tax Pool</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Invoices</span>
            <Receipt className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.count}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across all client accounts</p>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Invoice ID, restaurant name, UTR number, or payment method..."
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 font-bold"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="OVERDUE">OVERDUE</option>
          </select>
        </div>
      </div>

      {/* ── Real Invoices Table ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">Invoice Ref</th>
                <th className="px-5 py-4">Restaurant Client</th>
                <th className="px-5 py-4">Requested Plan & Cycle</th>
                <th className="px-5 py-4">Base + 18% GST</th>
                <th className="px-5 py-4">Total Amount</th>
                <th className="px-5 py-4">Payment UTR / Method</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-400 font-medium">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No Invoices Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">No invoices match your search or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-extrabold text-slate-900">
                      {inv.id}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-extrabold text-slate-900">{inv.restaurantName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Issued: {inv.issuedDate}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-950 font-bold text-[11px]">
                        {inv.requestedPlanName || inv.planName}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{inv.cycle}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono">
                      ₹{inv.amount?.toLocaleString()} + ₹{inv.tax?.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-black text-slate-900 text-sm">
                      ₹{inv.total?.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-mono text-[11px]">
                      {inv.utrNumber ? (
                        <div>
                          <strong className="text-slate-900 font-bold">UTR: {inv.utrNumber}</strong>
                          <p className="text-[10px] text-slate-400">{inv.paymentMethod || 'UPI'}</p>
                        </div>
                      ) : (
                        inv.paymentMethod || 'UPI / NetBanking'
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : inv.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => markInvoicePaid(inv.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Approve Plan</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          title="View & Print Official Receipt"
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Generate Manual Invoice ──────────────────────────────── */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-left text-slate-800 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>Generate Billing Invoice</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Client Restaurant
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city}) — Current: {t.planName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select SaaS Packaging Plan
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.monthlyPrice?.toLocaleString()}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
                >
                  Create & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Printable Invoice Receipt Modal ──────────────────────────────── */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  OF
                </span>
                <div>
                  <h4 className="font-black text-sm text-slate-900">Progix Technology Pvt Ltd</h4>
                  <p className="text-[10px] text-slate-500">Official Platform B2B Tax Invoice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 font-semibold text-[10px]">BILLED TO CLIENT:</p>
                  <p className="font-extrabold text-sm text-slate-900">{selectedInvoice.restaurantName}</p>
                  <p className="text-slate-500">Subscription Tier: {selectedInvoice.requestedPlanName || selectedInvoice.planName}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-semibold text-[10px]">INVOICE REF #</p>
                  <p className="font-mono font-extrabold text-slate-900">{selectedInvoice.id}</p>
                  <p className="text-slate-500">Issued: {selectedInvoice.issuedDate}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2.5">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Platform License Fee ({selectedInvoice.cycle})</span>
                  <span>₹{selectedInvoice.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST (IGST) @ 18%</span>
                  <span>₹{selectedInvoice.tax?.toLocaleString()}</span>
                </div>
                {selectedInvoice.utrNumber && (
                  <div className="flex justify-between text-amber-900 font-mono text-[11px] pt-1 border-t border-slate-200">
                    <span>Transaction UTR Ref:</span>
                    <strong>{selectedInvoice.utrNumber}</strong>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                  <span>Total Amount Settled</span>
                  <span>₹{selectedInvoice.total?.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-600">
                  Status: <strong className="text-emerald-700 uppercase">{selectedInvoice.status}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    showToast('Printing invoice receipt...', 'info');
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Official Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
