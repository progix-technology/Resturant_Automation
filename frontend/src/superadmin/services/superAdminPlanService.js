import { apiRequest } from '../../services/apiConfig';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { mockPricingPlans } from '../data/mockSuperAdminData';

export const superAdminPlanService = {
  async getPlans() {
    try {
      const res = await apiRequest('/superadmin/plans');
      if (res && res.success && Array.isArray(res.data)) {
        storage.set(STORAGE_KEYS.SUPERADMIN_PLANS, res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend getPlans failed, falling back to local storage:', err.message);
    }
    return storage.get(STORAGE_KEYS.SUPERADMIN_PLANS, mockPricingPlans);
  },

  async updatePlan(id, updates) {
    try {
      const res = await apiRequest(`/superadmin/plans/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (res && res.success && res.data) {
        const plans = storage.get(STORAGE_KEYS.SUPERADMIN_PLANS, mockPricingPlans);
        const next = plans.map((p) => (p.id === id ? { ...p, ...res.data } : p));
        storage.set(STORAGE_KEYS.SUPERADMIN_PLANS, next);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend updatePlan failed, applying to local storage fallback:', err.message);
    }

    const plans = storage.get(STORAGE_KEYS.SUPERADMIN_PLANS, mockPricingPlans);
    let updatedPlan = null;
    const nextPlans = plans.map((p) => {
      if (p.id === id) {
        updatedPlan = { ...p, ...updates };
        return updatedPlan;
      }
      return p;
    });
    storage.set(STORAGE_KEYS.SUPERADMIN_PLANS, nextPlans);
    return updatedPlan;
  },

  async addPlan(planData) {
    try {
      const res = await apiRequest('/superadmin/plans', {
        method: 'POST',
        body: JSON.stringify(planData),
      });
      if (res && res.success && res.data) {
        const plans = storage.get(STORAGE_KEYS.SUPERADMIN_PLANS, mockPricingPlans);
        storage.set(STORAGE_KEYS.SUPERADMIN_PLANS, [...plans, res.data]);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend addPlan failed, saving to local storage fallback:', err.message);
    }

    const plans = storage.get(STORAGE_KEYS.SUPERADMIN_PLANS, mockPricingPlans);
    const newPlan = {
      ...planData,
      id: `plan-${Date.now().toString().slice(-4)}`,
      activeSubscribers: 0,
      monthlyPrice: Number(planData.monthlyPrice) || 999,
      annualPrice: Number(planData.annualPrice) || 9990,
      features: Array.isArray(planData.features) ? planData.features : (planData.features || '').split('\n').filter(Boolean),
    };
    const nextPlans = [...plans, newPlan];
    storage.set(STORAGE_KEYS.SUPERADMIN_PLANS, nextPlans);
    return newPlan;
  },
};
