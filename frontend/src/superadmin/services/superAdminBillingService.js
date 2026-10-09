import { apiRequest } from '../../services/apiConfig';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { mockTenantInvoices } from '../data/mockSuperAdminData';

export const superAdminBillingService = {
  async getInvoices() {
    try {
      const res = await apiRequest('/superadmin/invoices');
      if (res && res.success && Array.isArray(res.data)) {
        storage.set(STORAGE_KEYS.SUPERADMIN_INVOICES, res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend getInvoices failed, falling back to local storage:', err.message);
    }
    const invoices = storage.get(STORAGE_KEYS.SUPERADMIN_INVOICES, mockTenantInvoices) || [];
    const mockInvIdsToRemove = ['INV-2026-0084', 'INV-2026-0093', 'INV-2026-0095', 'INV-2026-0098'];
    const mockTenantIdsToRemove = ['tenant-002', 'tenant-003', 'tenant-004', 'tenant-005', 'tenant-006', 'tenant-007'];
    const cleanInvoices = invoices.filter((i) => !mockInvIdsToRemove.includes(i.id) && !mockTenantIdsToRemove.includes(i.tenantId));
    return cleanInvoices;
  },

  async markInvoicePaid(invoiceId) {
    try {
      const res = await apiRequest(`/superadmin/invoices/${invoiceId}/pay`, {
        method: 'PATCH',
      });
      if (res && res.success && res.data) {
        const invoices = storage.get(STORAGE_KEYS.SUPERADMIN_INVOICES, mockTenantInvoices);
        const nextInvoices = invoices.map((inv) => (inv.id === invoiceId ? { ...inv, ...res.data } : inv));
        storage.set(STORAGE_KEYS.SUPERADMIN_INVOICES, nextInvoices);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend markInvoicePaid failed, falling back to local storage:', err.message);
    }

    const invoices = storage.get(STORAGE_KEYS.SUPERADMIN_INVOICES, mockTenantInvoices);
    let updatedInv = null;
    const nextInvoices = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        updatedInv = {
          ...inv,
          status: 'PAID',
          paidAt: new Date().toISOString().split('T')[0],
        };
        return updatedInv;
      }
      return inv;
    });
    storage.set(STORAGE_KEYS.SUPERADMIN_INVOICES, nextInvoices);
    return updatedInv;
  },

  async generateInvoice(tenant, plan, extraDetails = {}) {
    const amount = Number(tenant.planAmount || plan?.rawPrice) || 2499;
    const tax = Math.round(amount * 0.18 * 100) / 100;
    const newInvoice = {
      id: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId: tenant.id,
      restaurantName: tenant.name,
      planName: plan?.name || tenant.planName,
      cycle: `${tenant.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'} Subscription (${new Date().toLocaleDateString('en-US', { month: 'short' })} Cycle)`,
      amount,
      tax,
      total: amount + tax,
      status: 'PENDING',
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      paidAt: null,
      paymentMethod: 'UPI / NetBanking',
      ...extraDetails,
    };

    try {
      const res = await apiRequest('/superadmin/invoices', {
        method: 'POST',
        body: JSON.stringify(newInvoice),
      });
      if (res && res.success && res.data) {
        const invoices = storage.get(STORAGE_KEYS.SUPERADMIN_INVOICES, mockTenantInvoices);
        const nextInvoices = [res.data, ...invoices];
        storage.set(STORAGE_KEYS.SUPERADMIN_INVOICES, nextInvoices);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend generateInvoice failed, falling back to local storage:', err.message);
    }

    const invoices = storage.get(STORAGE_KEYS.SUPERADMIN_INVOICES, mockTenantInvoices);
    const nextInvoices = [newInvoice, ...invoices];
    storage.set(STORAGE_KEYS.SUPERADMIN_INVOICES, nextInvoices);
    return newInvoice;
  },
};
