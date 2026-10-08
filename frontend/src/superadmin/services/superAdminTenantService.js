import { apiRequest } from '../../services/apiConfig';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { mockRestaurantTenants } from '../data/mockSuperAdminData';

export const superAdminTenantService = {
  async getTenants() {
    try {
      const res = await apiRequest('/superadmin/tenants');
      if (res && res.success && Array.isArray(res.data)) {
        storage.set(STORAGE_KEYS.SUPERADMIN_TENANTS, res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend getTenants failed, falling back to local storage:', err.message);
    }
    const tenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, mockRestaurantTenants) || [];
    const mockIdsToRemove = ['tenant-002', 'tenant-003', 'tenant-004', 'tenant-005', 'tenant-006', 'tenant-007'];
    const cleanTenants = tenants.filter((t) => !mockIdsToRemove.includes(t.id));
    return cleanTenants;
  },

  async addTenant(tenantData) {
    try {
      const res = await apiRequest('/superadmin/tenants', {
        method: 'POST',
        body: JSON.stringify(tenantData),
      });
      if (res && res.success && res.data) {
        const tenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, mockRestaurantTenants);
        const updated = [res.data, ...tenants];
        storage.set(STORAGE_KEYS.SUPERADMIN_TENANTS, updated);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend addTenant failed, falling back to local storage:', err.message);
    }

    const tenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, mockRestaurantTenants);
    const slug = (tenantData.slug || `rest-${Date.now().toString().slice(-4)}`).toLowerCase().trim();

    const ownerEmail = (tenantData.ownerEmail && tenantData.ownerEmail.includes('@'))
      ? tenantData.ownerEmail.trim().toLowerCase()
      : `${slug}@restaurant.com`;
    const ownerPassword = tenantData.ownerPassword || 'Admin@123';

    const newTenant = {
      ...tenantData,
      id: `tenant-${Date.now().toString().slice(-4)}`,
      slug,
      ownerEmail,
      ownerPassword,
      registeredAt: new Date().toISOString().split('T')[0],
      monthlyOrders: 0,
      monthlyGMV: 0,
      activeTables: Number(tenantData.activeTables) || 10,
      status: tenantData.status || 'ACTIVE',
      isPaid: tenantData.status === 'ACTIVE',
    };

    const updated = [newTenant, ...tenants];
    storage.set(STORAGE_KEYS.SUPERADMIN_TENANTS, updated);
    return newTenant;
  },

  async updateTenant(id, updates) {
    try {
      const res = await apiRequest(`/superadmin/tenants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (res && res.success && res.data) {
        const tenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, mockRestaurantTenants);
        const nextTenants = tenants.map((t) => (t.id === id || t.tenantId === id ? { ...t, ...res.data } : t));
        storage.set(STORAGE_KEYS.SUPERADMIN_TENANTS, nextTenants);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend updateTenant failed, falling back to local storage:', err.message);
    }

    const tenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, mockRestaurantTenants);
    let updatedItem = null;
    const nextTenants = tenants.map((t) => {
      if (t.id === id || t.tenantId === id) {
        updatedItem = { ...t, ...updates };
        return updatedItem;
      }
      return t;
    });
    storage.set(STORAGE_KEYS.SUPERADMIN_TENANTS, nextTenants);
    return updatedItem;
  },

  async toggleTenantStatus(id, newStatus) {
    return this.updateTenant(id, { 
      status: newStatus,
      isPaid: newStatus === 'ACTIVE' 
    });
  },

  async deleteTenant(id) {
    try {
      await apiRequest(`/superadmin/tenants/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Backend deleteTenant failed, applying local fallback:', err.message);
    }
    const tenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, mockRestaurantTenants);
    const filtered = tenants.filter((t) => t.id !== id && t.tenantId !== id);
    storage.set(STORAGE_KEYS.SUPERADMIN_TENANTS, filtered);
    return true;
  },
};
