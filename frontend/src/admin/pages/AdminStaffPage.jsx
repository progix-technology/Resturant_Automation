import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  Shield,
  Clock,
  Edit2,
  X,
  UserX,
  Lock,
} from 'lucide-react';
import { ADMIN_ROLES } from '../data/mockAdminData';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { useAdminData } from '../context/AdminDataContext';
import { PlanUpgradeModal } from '../components/PlanUpgradeModal';
import { getPlanLimits } from '../utils/planLimits';

const initialStaff = [
  {
    id: 'staff-01',
    name: 'Restaurant Admin',
    email: 'resturant1@gmail.com',
    phone: '+91 98765 43210',
    role: ADMIN_ROLES.SUPER_ADMIN,
    status: 'ACTIVE',
    shift: 'General Shift',
    joinedDate: new Date().toISOString().split('T')[0],
  },
];

export const AdminStaffPage = () => {
  const { showToast, settings } = useAdminData();

  const limits = useMemo(() => getPlanLimits(settings), [settings]);

  const [staffList, setStaffList] = useState(() => {
    return storage.get(STORAGE_KEYS.ADMIN_STAFF, initialStaff);
  });

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeModalProps, setUpgradeModalProps] = useState({
    title: 'Plan Limit Exceeded',
    limitText: '',
    message: 'Please purchase this plan to perform this action.',
  });

  const activeStaffCount = staffList.filter((s) => s.status === 'ACTIVE').length;
  const isStaffLimitReached = limits.maxStaffAccounts === 0 || activeStaffCount >= limits.maxStaffAccounts;

  const adminAccountCount = staffList.filter(
    (s) => s.role === ADMIN_ROLES.SUPER_ADMIN || s.role === ADMIN_ROLES.ADMIN
  ).length;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ADMIN_ROLES.STAFF,
    shift: 'Evening Shift',
  });

  const saveStaffList = (updated) => {
    setStaffList(updated);
    storage.set(STORAGE_KEYS.ADMIN_STAFF, updated);
  };

  const triggerUpgradeModal = (title, limitText, message = 'Please purchase this plan to perform this action.') => {
    setUpgradeModalProps({ title, limitText, message });
    setIsUpgradeModalOpen(true);
  };

  const handleOpenAddModal = () => {
    if (limits.maxStaffAccounts === 0) {
      triggerUpgradeModal(
        'Staff Account Management Locked',
        `Staff creation is disabled on the Starter plan (0 staff accounts allowed).`
      );
      return;
    }

    if (activeStaffCount >= limits.maxStaffAccounts) {
      triggerUpgradeModal(
        'Staff Account Limit Reached',
        `Your current ${limits.planName} plan allows up to ${limits.maxStaffAccounts} staff account(s).`
      );
      return;
    }

    setEditingStaff(null);
    setFormData({ name: '', email: '', phone: '', role: ADMIN_ROLES.STAFF, shift: 'Evening Shift' });
    setIsAddModalOpen(true);
  };

  const handleToggleStatus = (staffId) => {
    const updated = staffList.map((s) => {
      if (s.id === staffId) {
        const nextStatus = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        if (nextStatus === 'ACTIVE') {
          if (limits.maxStaffAccounts === 0) {
            triggerUpgradeModal(
              'Staff Accounts Disabled',
              'Starter plan does not permit active staff members.'
            );
            return s;
          }
          if (activeStaffCount >= limits.maxStaffAccounts) {
            triggerUpgradeModal(
              'Staff Account Limit Reached',
              `Your current ${limits.planName} plan allows up to ${limits.maxStaffAccounts} active staff accounts.`
            );
            return s;
          }
        }
        showToast(`${s.name} is now ${nextStatus}`, 'info');
        return { ...s, status: nextStatus };
      }
      return s;
    });
    saveStaffList(updated);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    // Check Admin logins limit if role is Admin
    const isAddingAdminRole = formData.role === ADMIN_ROLES.SUPER_ADMIN || formData.role === ADMIN_ROLES.ADMIN;
    if (isAddingAdminRole && (!editingStaff || (editingStaff.role !== ADMIN_ROLES.SUPER_ADMIN && editingStaff.role !== ADMIN_ROLES.ADMIN))) {
      if (adminAccountCount >= limits.maxAdminLogins) {
        setIsAddModalOpen(false);
        triggerUpgradeModal(
          'Admin Login Account Limit Reached',
          `Your current ${limits.planName} plan allows up to ${limits.maxAdminLogins} admin login account(s).`
        );
        return;
      }
    }

    if (!editingStaff) {
      if (limits.maxStaffAccounts === 0) {
        setIsAddModalOpen(false);
        triggerUpgradeModal(
          'Staff Account Management Locked',
          `Starter plan allows 0 staff accounts.`
        );
        return;
      }
      if (activeStaffCount >= limits.maxStaffAccounts) {
        setIsAddModalOpen(false);
        triggerUpgradeModal(
          'Staff Account Limit Reached',
          `Your current ${limits.planName} plan allows up to ${limits.maxStaffAccounts} staff account(s).`
        );
        return;
      }
    }

    if (editingStaff) {
      const updated = staffList.map((s) =>
        s.id === editingStaff.id ? { ...s, ...formData } : s
      );
      saveStaffList(updated);
      showToast(`Updated details for ${formData.name}`, 'success');
    } else {
      const newStaff = {
        ...formData,
        id: `stf-${Date.now().toString().slice(-4)}`,
        status: 'ACTIVE',
        joinedDate: new Date().toLocaleDateString([], { month: 'short', year: 'numeric' }),
      };
      saveStaffList([newStaff, ...staffList]);
      showToast(`Staff member ${newStaff.name} added`, 'success');
    }

    setIsAddModalOpen(false);
    setEditingStaff(null);
  };

  const openEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      shift: staff.shift,
    });
    setIsAddModalOpen(true);
  };

  const columns = [
    {
      header: 'Staff Member',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (row) => <span className="font-mono text-xs text-slate-600">{row.phone}</span>,
    },
    {
      header: 'Access Role',
      accessor: 'role',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
          {row.role}
        </span>
      ),
    },
    {
      header: 'Shift',
      accessor: 'shift',
      render: (row) => <span className="text-xs text-slate-600">{row.shift}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
            title="Edit staff details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleStatus(row.id)}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
              row.status === 'ACTIVE'
                ? 'border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
            title={row.status === 'ACTIVE' ? 'Deactivate staff' : 'Activate staff'}
          >
            {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminPageHeader
        title="Restaurant Staff & Role Permissions"
        subtitle={`Manage staff access. Limits: Staff (${activeStaffCount}/${limits.maxStaffAccounts}), Admins (${adminAccountCount}/${limits.maxAdminLogins}) on ${limits.planName}.`}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                isStaffLimitReached
                  ? 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 cursor-pointer'
                  : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
              }`}
            >
              {isStaffLimitReached ? <Lock className="w-4 h-4 text-amber-700" /> : <Plus className="w-4 h-4" />}
              <span>Add Staff Member</span>
            </button>
          </div>
        }
      />

      {/* Staff Account Capacity Usage Card */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
        limits.maxStaffAccounts === 0
          ? 'bg-rose-50 border-rose-200 text-rose-950'
          : isStaffLimitReached
          ? 'bg-amber-50 border-amber-300 text-amber-950'
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            limits.maxStaffAccounts === 0
              ? 'bg-rose-100 border-rose-300 text-rose-800'
              : isStaffLimitReached
              ? 'bg-amber-100 border-amber-300 text-amber-900'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <UserCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-xs sm:text-sm block">
              {limits.maxStaffAccounts === 0
                ? 'Staff Management Locked on Starter Plan'
                : `Staff Accounts Usage: ${activeStaffCount} / ${limits.maxStaffAccounts} Logins Used (Admin Limit: ${adminAccountCount}/${limits.maxAdminLogins})`}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {limits.maxStaffAccounts === 0
                ? 'Staff accounts are disabled for Starter QR plan. Please upgrade to Growth Pro or Enterprise Scale to enable staff logins.'
                : isStaffLimitReached
                ? 'Account limit reached for your current subscription plan. Contact SuperAdmin to add more logins.'
                : `You can create ${limits.maxStaffAccounts - activeStaffCount} more staff accounts on your current plan.`}
            </span>
          </div>
        </div>
        {isStaffLimitReached && (
          <button
            type="button"
            onClick={() => triggerUpgradeModal(
              'Upgrade Subscription Plan',
              `Current plan: ${limits.planName} (Staff limit: ${limits.maxStaffAccounts}, Admin limit: ${limits.maxAdminLogins}).`
            )}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shrink-0 transition-colors shadow-xs"
          >
            Upgrade Plan
          </button>
        )}
      </div>

      {/* Staff Table */}
      <DataTable
        columns={columns}
        data={staffList}
        keyField="id"
        emptyMessage="No staff members configured."
      />

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
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
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pooja Nair"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="pooja@restaurant.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-10 px-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  >
                    <option value={ADMIN_ROLES.SUPER_ADMIN}>SUPER_ADMIN</option>
                    <option value={ADMIN_ROLES.ADMIN}>ADMIN</option>
                    <option value={ADMIN_ROLES.MANAGER}>MANAGER</option>
                    <option value={ADMIN_ROLES.STAFF}>STAFF</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Work Shift
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full h-10 px-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  >
                    <option value="Morning Shift">Morning</option>
                    <option value="Evening Shift">Evening</option>
                    <option value="Night Shift">Night</option>
                    <option value="All Shifts">All Shifts</option>
                  </select>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold shadow-xs hover:bg-slate-800"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Limit Upgrade Popup Alert */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title={upgradeModalProps.title}
        featureName="Staff / Admin Access"
        currentPlan={limits.planName}
        limitText={upgradeModalProps.limitText}
        message={upgradeModalProps.message}
      />
    </div>
  );
};
