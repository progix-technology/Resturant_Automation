import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Armchair,
  ShoppingBag,
  IndianRupee,
  Clock,
  Calendar,
  X,
  ArrowRight,
} from 'lucide-react';
import { adminCustomerService } from '../services/adminCustomerService';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { DataTable } from '../components/DataTable';
import { SearchInput } from '../components/SearchInput';
import { formatCurrency } from '../../utils/currency';
import { StatusBadge } from '../components/StatusBadge';

export const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const data = await adminCustomerService.getCustomers();
        setCustomers(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.mobile || '').includes(q) ||
        `table ${c.lastTable}`.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const columns = [
    {
      header: 'Customer Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
            {row.name?.charAt(0) || 'G'}
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.name}</p>
            <p className="text-[11px] text-slate-400">Guest Diner</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Mobile Contact',
      accessor: 'mobile',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>+91 {row.mobile}</span>
        </span>
      ),
    },
    {
      header: 'Total Orders',
      accessor: 'ordersCount',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
          {row.ordersCount} {row.ordersCount === 1 ? 'order' : 'orders'}
        </span>
      ),
    },
    {
      header: 'Total Spend',
      accessor: 'totalSpent',
      render: (row) => (
        <span className="font-extrabold text-slate-900 text-sm">
          {formatCurrency(row.totalSpent)}
        </span>
      ),
    },
    {
      header: 'Last Visited Table',
      accessor: 'lastTable',
      render: (row) => (
        <span className="text-xs font-bold text-slate-700">
          Table {row.lastTable || '—'}
        </span>
      ),
    },
    {
      header: 'Last Visit Date',
      accessor: 'lastOrderDate',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.lastOrderDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedCustomer(row)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
        >
          View History
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminPageHeader
        title="Guest Diners & CRM"
        subtitle="Diner records captured from contactless QR table sessions and order transactions."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {customers.length} Guests Recorded
          </span>
        }
      />

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by diner name, mobile number..."
          />
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Guest profiles generated automatically upon QR table order placement
        </span>
      </div>

      {/* Customers Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        keyField="id"
        emptyMessage="No customer records found."
      />

      {/* Customer Details Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCustomer(null)}
          />

          <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-fade-in border-l border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-base font-bold text-slate-900">Diner Profile</h3>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Profile Card */}
              <div className="text-center p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center mx-auto mb-3">
                  {selectedCustomer.name?.charAt(0)}
                </div>
                <h4 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">+91 {selectedCustomer.mobile}</p>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-200/80 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Orders</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">{selectedCustomer.ordersCount}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Lifetime Spend</span>
                    <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                      {formatCurrency(selectedCustomer.totalSpent)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order History List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Order History ({selectedCustomer.orders?.length || 0})
                </h4>

                <div className="space-y-3">
                  {selectedCustomer.orders?.map((ord) => (
                    <div
                      key={ord.orderId}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900">#{ord.orderId}</span>
                        <span className="text-emerald-700 font-extrabold">
                          {formatCurrency(ord.total)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Table {ord.tableNumber}</span>
                        <span>{new Date(ord.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <StatusBadge status={ord.paymentStatus} size="xs" />
                        <StatusBadge status={ord.orderStatus} size="xs" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
