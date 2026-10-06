import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { mockPricingPlans } from '../data/mockSuperAdminData';
import { simulateDelay } from '../../services/apiConfig';

export const superAdminPlanService = {
  async getPlans() {
    await simulateDelay(150);
    return storage.get(STORAGE_KEYS.SUPERADMIN_PLANS, mockPricingPlans);
  },

  async updatePlan(id, updates) {
    await simulateDelay(200);
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
    await simulateDelay(200);
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
