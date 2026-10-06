import React, { useState } from 'react';
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
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';

export const SuperAdminInvoicesPage = () => {
  const { invoices, tenants, markInvoicePaid, generateInvoice, showToast } = useSuperAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const filteredInvoices = invoices.filter((inv) => {
    return (
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.paymentMethod && inv.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handlePrintReceipt = (inv) => {
    setSelectedInvoice(inv);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-600" />
            B2B Billing Ledger & Invoices
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Track subscription packaging billing, tax collection (GST 18%), and client payment settlements.
          </p>
        </div>

        <button
          onClick={() => {
            if (tenants.length > 0) {
              generateInvoice(tenants[0]);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Bill Next Cycle</span>
        </button>
      </div>

      {/* Search Bar - Light White & Light Yellow */}
      <div className="bg-white border border-amber-100 p-4 rounded-xl shadow-xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-amber-700 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Invoice #, restaurant name, or method..."
            className="w-full h-10 pl-9 pr-4 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Invoices Table - Light White & Light Yellow */}
      <div className="bg-white border border-amber-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/40 border-b border-amber-100 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Restaurant Client</th>
                <th className="px-5 py-3.5">Packaging Plan & Cycle</th>
                <th className="px-5 py-3.5">Base + 18% GST</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Payment Method</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/60 text-slate-700">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                    {inv.id}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900">{inv.restaurantName}</p>
                    <p className="text-[11px] text-slate-500">Due: {inv.dueDate}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800">{inv.planName}</p>
                    <p className="text-[11px] text-slate-500">{inv.cycle}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    ₹{inv.amount.toLocaleString()} + ₹{inv.tax.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    ₹{inv.total.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {inv.paymentMethod}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : inv.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => markInvoicePaid(inv.id)}
                          className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-[11px] font-bold text-slate-950 transition-colors shadow-2xs"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handlePrintReceipt(inv)}
                        title="View & Print Official Receipt"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-900 hover:bg-amber-50 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice Modal - Light White & Yellow Accent */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-xl relative border border-amber-200">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                  OF
                </span>
                <span className="font-extrabold text-sm text-slate-900">Progix OrderFlow Technologies</span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500">BILLED TO:</p>
                  <p className="font-bold text-sm text-slate-900">{selectedInvoice.restaurantName}</p>
                  <p className="text-slate-500">Subscription Service Plan: {selectedInvoice.planName}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">INVOICE NUMBER:</p>
                  <p className="font-mono font-bold text-slate-900">{selectedInvoice.id}</p>
                  <p className="text-slate-500">Issued: {selectedInvoice.issuedDate}</p>
                </div>
              </div>

              <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/40 space-y-2">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Platform License Fee ({selectedInvoice.cycle})</span>
                  <span>₹{selectedInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST @ 18%</span>
                  <span>₹{selectedInvoice.tax.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-amber-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Amount Paid</span>
                  <span>₹{selectedInvoice.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-600">
                  Payment Status: <strong className="text-emerald-700">{selectedInvoice.status}</strong>
                </span>
                <button
                  onClick={() => {
                    window.print();
                    showToast('Printing invoice...', 'info');
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
