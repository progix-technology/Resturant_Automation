import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Receipt,
  Trash2,
  Edit2,
  X,
  Store,
  Key,
  LogIn,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { ROLE_PERMISSIONS } from '../../admin/data/mockAdminData';

export const SuperAdminRestaurantsPage = () => {
  const { tenants, plans, addTenant, updateTenant, toggleTenantStatus, deleteTenant, generateInvoice, showToast } = useSuperAdminData();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [credentialsTenant, setCredentialsTenant] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '🍽️',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    city: 'Bengaluru',
    address: '',
    planId: 'plan-growth',
    billingCycle: 'MONTHLY',
    activeTables: 20,
    status: 'ACTIVE',
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      handleOpenCreate();
    }
  }, [location.search]);

  const handleLoginAsAdmin = (tenant) => {
    const slug = tenant.slug || 'spice-garden';
    const ownerEmail = (tenant.ownerEmail && tenant.ownerEmail.includes('@'))
      ? tenant.ownerEmail
      : `${slug}@restaurant.com`;

    const safeSession = {
      id: `adm-${tenant.id}`,
      name: tenant.ownerName || tenant.name,
      email: ownerEmail,
      role: 'ADMIN',
      title: 'Restaurant Owner & Admin',
      avatar: tenant.logo || '',
      restaurantId: tenant.id,
      restaurantSlug: slug,
      permissions: ['dashboard', 'orders', 'tables', 'menu', 'customers', 'notifications', 'staff', 'payments', 'reports', 'settings'],
      loginTime: new Date().toISOString(),
    };

    storage.set(STORAGE_KEYS.ADMIN_SESSION, safeSession);
    if (showToast) {
      showToast(`Logged into Admin Dashboard for ${tenant.name}!`, 'success');
    }
    window.open('/admin', '_blank');
  };

  const handleOpenCreate = () => {
    setEditingTenant(null);
    setFormData({
      name: '',
      slug: '',
      logo: '🍽️',
      ownerName: '',
      ownerEmail: '',
      ownerPassword: 'Admin@123',
      ownerPhone: '',
      city: 'Bengaluru',
      address: '',
      planId: 'plan-growth',
      billingCycle: 'MONTHLY',
      activeTables: 20,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      logo: tenant.logo || '🍽️',
      ownerName: tenant.ownerName,
      ownerEmail: tenant.ownerEmail || `${tenant.slug}@restaurant.com`,
      ownerPassword: tenant.ownerPassword || 'Admin@123',
      ownerPhone: tenant.ownerPhone || '',
      city: tenant.city || 'Bengaluru',
      address: tenant.address || '',
      planId: tenant.planId || 'plan-growth',
      billingCycle: tenant.billingCycle || 'MONTHLY',
      activeTables: tenant.activeTables || 20,
      status: tenant.status || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const selectedPlan = plans.find((p) => p.id === formData.planId) || plans[0];
    const planAmount = formData.billingCycle === 'ANNUAL' ? selectedPlan.annualPrice : selectedPlan.monthlyPrice;

    if (editingTenant) {
      await updateTenant(editingTenant.id, {
        ...formData,
        planName: selectedPlan.name,
        planAmount,
      });
    } else {
      await addTenant({
        ...formData,
        planName: selectedPlan.name,
        planAmount,
        renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });
    }
    setIsModalOpen(false);
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPlan = planFilter === 'ALL' || t.planId === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [tenants, searchTerm, statusFilter, planFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            Restaurant Client Accounts
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage multi-tenant restaurant profiles, packaging plans, subscription billing, and operational access.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Restaurant</span>
        </button>
      </div>

      {/* Filter and Search Bar - Light White & Light Yellow */}
      <div className="bg-white border border-amber-100 p-4 rounded-xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-amber-700 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by restaurant name, slug, owner, or city..."
            className="w-full h-10 pl-9 pr-4 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-amber-50/30 border border-amber-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="OVERDUE">Overdue</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="text-xs bg-amber-50/30 border border-amber-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="ALL">All Packaging Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tenants Table - Clean Light White & Light Yellow */}
      <div className="bg-white border border-amber-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/40 border-b border-amber-100 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Restaurant & Slug</th>
                <th className="px-5 py-3.5">Owner & Contact</th>
                <th className="px-5 py-3.5">Packaging Plan</th>
                <th className="px-5 py-3.5">Tables & GMV</th>
                <th className="px-5 py-3.5">Subscription Status</th>
                <th className="px-5 py-3.5">Renewal Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/60 text-slate-700">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No restaurant client accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-amber-50/40 transition-colors">
                    {/* Restaurant */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl p-2 rounded-xl bg-amber-50 border border-amber-100">{tenant.logo}</span>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{tenant.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            /{tenant.slug} • {tenant.city}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{tenant.ownerName}</p>
                      <p className="text-[11px] text-slate-500">{tenant.ownerPhone}</p>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[11px] bg-amber-50 border border-amber-200 font-semibold text-amber-900">
                          {tenant.planName}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1">
                          ₹{tenant.planAmount.toLocaleString()} / {tenant.billingCycle.toLowerCase()}
                        </p>
                      </div>
                    </td>

                    {/* Tables & Volume */}
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{tenant.activeTables} Tables</p>
                      <p className="text-[11px] text-amber-800 font-medium">
                        ₹{(tenant.monthlyGMV || 0).toLocaleString()} GMV
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <select
                        value={tenant.status}
                        onChange={(e) => toggleTenantStatus(tenant.id, e.target.value)}
                        className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                          tenant.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : tenant.status === 'TRIAL'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : tenant.status === 'OVERDUE'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="TRIAL">TRIAL</option>
                        <option value="OVERDUE">OVERDUE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </td>

                    {/* Renewal */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-slate-600">
                        {tenant.renewalDate}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setCredentialsTenant(tenant)}
                          title="View Admin Credentials & Access"
                          className="p-1.5 rounded-lg text-amber-800 bg-amber-100/70 hover:bg-amber-200 hover:text-amber-950 border border-amber-300/80 transition-colors cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => generateInvoice(tenant)}
                          title="Generate Monthly Invoice"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-900 hover:bg-amber-100/60 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(tenant)}
                          title="Edit Account"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-amber-100/60 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/menu/${tenant.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Customer QR Menu"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-100/60 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${tenant.name} from the platform?`)) {
                              deleteTenant(tenant.id);
                            }
                          }}
                          title="Remove Client"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Onboard / Edit Tenant Modal - Light White & Light Yellow */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-amber-200 rounded-2xl w-full max-w-xl p-6 shadow-xl relative text-left text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-amber-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-600" />
                {editingTenant ? 'Edit Restaurant Account' : 'Onboard New Restaurant Client'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Restaurant Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setFormData((prev) => ({ ...prev, name, slug: editingTenant ? prev.slug : slug }));
                    }}
                    placeholder="e.g. Amber Gourmet Bistro"
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Custom URL Slug *</label>
                  <div className="flex items-center bg-amber-50/20 border border-amber-200 rounded-lg px-2 text-xs">
                    <span className="text-amber-700 font-medium">/menu/</span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="amber-bistro"
                      className="w-full h-9 bg-transparent text-xs text-slate-900 focus:outline-none pl-1 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Admin Credentials Manual Entry */}
                <div className="sm:col-span-2 p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <Key className="w-3.5 h-3.5 text-amber-700" />
                    <span>Admin Credentials (Manual Custom Entry)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Admin Login Email / Username *</label>
                      <input
                        type="email"
                        required
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        placeholder="owner@restaurant.com"
                        className="w-full h-9 px-3 bg-white border border-amber-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Admin Password *</span>
                        <button
                          type="button"
                          onClick={() => {
                            const randPass = 'Pass@' + Math.floor(1000 + Math.random() * 9000);
                            setFormData((prev) => ({ ...prev, ownerPassword: randPass }));
                          }}
                          className="text-[10px] text-amber-700 hover:text-amber-900 underline font-normal cursor-pointer"
                        >
                          Auto-Generate
                        </button>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.ownerPassword || ''}
                        onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                        placeholder="e.g. Admin@123"
                        className="w-full h-9 px-3 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-950 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Bengaluru"
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select SaaS Plan *</label>
                  <select
                    value={formData.planId}
                    onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.monthlyPrice}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Cycle</label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="MONTHLY">Monthly Billing</option>
                    <option value="ANNUAL">Annual Billing (Save 15%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Table Count</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={formData.activeTables}
                    onChange={(e) => setFormData({ ...formData, activeTables: e.target.value })}
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account State</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="ACTIVE">ACTIVE (Paid)</option>
                    <option value="TRIAL">TRIAL (14 Days Free)</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-amber-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-amber-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 rounded-lg text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {editingTenant ? 'Save Changes' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Credentials & One-Click Access Modal */}
      {credentialsTenant && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-amber-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-left text-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900">
                  <Key className="w-4 h-4 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{credentialsTenant.name}</h3>
                  <p className="text-[11px] text-amber-800 font-semibold">
                    Admin Access & Login Credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCredentialsTenant(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-amber-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Restaurant Admin Portal</span>
                <p className="font-mono text-slate-900 font-bold mt-0.5 select-all">http://localhost:5173/admin/login</p>
              </div>

              <div className="pt-2 border-t border-amber-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Owner Login Email / Username</span>
                <p className="font-mono text-slate-900 font-extrabold text-sm mt-0.5 select-all">
                  {credentialsTenant.ownerEmail || `${credentialsTenant.slug}@restaurant.com`}
                </p>
              </div>

              <div className="pt-2 border-t border-amber-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Admin Password</span>
                <p className="font-mono text-amber-950 font-extrabold text-sm mt-0.5 select-all">
                  {credentialsTenant.ownerPassword || 'Admin@123'}
                </p>
              </div>

              <div className="pt-2 border-t border-amber-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Customer Digital QR Menu</span>
                <p className="font-mono text-emerald-800 font-bold mt-0.5 select-all">
                  http://localhost:5173/menu/{credentialsTenant.slug}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text = `Restaurant: ${credentialsTenant.name}\nAdmin Login: http://localhost:5173/admin/login\nEmail: ${credentialsTenant.ownerEmail || credentialsTenant.slug + '@restaurant.com'}\nPassword: ${credentialsTenant.ownerPassword || 'Admin@123'}\nQR Menu: http://localhost:5173/menu/${credentialsTenant.slug}`;
                    navigator.clipboard.writeText(text);
                    if (showToast) showToast('Credentials copied to clipboard!', 'success');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Details</span>
                </button>

                <button
                  onClick={() => {
                    handleLoginAsAdmin(credentialsTenant);
                    setCredentialsTenant(null);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-extrabold text-xs shadow-sm transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Open Admin Page</span>
                </button>
              </div>

              <div className="flex items-center gap-2 border-t border-amber-100 pt-2">
                <button
                  onClick={() => {
                    const tenantToEdit = credentialsTenant;
                    setCredentialsTenant(null);
                    handleOpenEdit(tenantToEdit);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Edit Details & Password</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${credentialsTenant.name}?`)) {
                      deleteTenant(credentialsTenant.id);
                      setCredentialsTenant(null);
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
