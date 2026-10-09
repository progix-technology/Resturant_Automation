/**
 * Plan Limit Utility
 * Enforces exact tiered subscription boundaries for Restaurant Admin features:
 * - Starter QR: 10 Tables, 30 Dishes, 1 Admin Login, 0 Staff Accounts, Analytics Locked
 * - Growth Pro: 30 Tables, 60 Dishes, 4 Admin Logins, 4 Staff Accounts, Analytics Locked
 * - Enterprise Scale: 50 Tables, 100+ Dishes, 8 Admin Logins, 8 Staff Accounts, Analytics Enabled
 */
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { mockPricingPlans } from '../../superadmin/data/mockSuperAdminData';

export function getPlanLimits(settings = {}) {
  const activePlanId = storage.get(STORAGE_KEYS.RESTAURANT_ACTIVE_SAAS_PLAN, 'plan-starter');
  const availablePlans = storage.get(STORAGE_KEYS.SUPERADMIN_PLANS, mockPricingPlans) || mockPricingPlans;
  
  const targetPlanId = settings?.planId || activePlanId;
  const activePlanObj = availablePlans.find((p) => p.id === targetPlanId || p.name?.toLowerCase() === settings?.planName?.toLowerCase()) || availablePlans[0];

  const rawPlanId = String(settings?.planId || activePlanObj?.id || activePlanId || 'plan-starter').toLowerCase();
  const rawPlanName = String(settings?.planName || activePlanObj?.name || 'Starter QR').toLowerCase();

  const isStarter = rawPlanId.includes('starter') || rawPlanName.includes('starter') || rawPlanName.includes('basic');
  const isEnterprise = rawPlanId.includes('enterprise') || rawPlanName.includes('enterprise') || rawPlanName.includes('premium') || rawPlanName.includes('scale');
  const isPro = (rawPlanId.includes('growth') || rawPlanId.includes('pro') || rawPlanName.includes('growth') || rawPlanName.includes('pro')) && !isStarter && !isEnterprise;

  let defaultMaxTables = 10;
  let defaultMaxDishes = 30;
  let defaultMaxAdminLogins = 1;
  let defaultMaxStaffAccounts = 0;

  if (isEnterprise) {
    defaultMaxTables = activePlanObj?.maxTables ?? 50;
    defaultMaxDishes = activePlanObj?.maxDishes ?? 100;
    defaultMaxAdminLogins = activePlanObj?.maxAdminLogins ?? 8;
    defaultMaxStaffAccounts = activePlanObj?.maxStaffAccounts ?? activePlanObj?.staffAccounts ?? 8;
  } else if (isPro) {
    defaultMaxTables = activePlanObj?.maxTables ?? 30;
    defaultMaxDishes = activePlanObj?.maxDishes ?? 60;
    defaultMaxAdminLogins = activePlanObj?.maxAdminLogins ?? 4;
    defaultMaxStaffAccounts = activePlanObj?.maxStaffAccounts ?? activePlanObj?.staffAccounts ?? 4;
  } else {
    // Starter Plan
    defaultMaxTables = activePlanObj?.maxTables ?? 10;
    defaultMaxDishes = activePlanObj?.maxDishes ?? 30;
    defaultMaxAdminLogins = activePlanObj?.maxAdminLogins ?? 1;
    defaultMaxStaffAccounts = activePlanObj?.maxStaffAccounts ?? activePlanObj?.staffAccounts ?? 0;
  }

  const maxTables = settings?.maxTables !== undefined ? Number(settings.maxTables) : defaultMaxTables;
  const maxDishes = settings?.maxDishes !== undefined ? Number(settings.maxDishes) : defaultMaxDishes;
  const maxStaffAccounts = settings?.maxStaffAccounts !== undefined ? Number(settings.maxStaffAccounts) : defaultMaxStaffAccounts;
  const maxAdminLogins = settings?.maxAdminLogins !== undefined ? Number(settings.maxAdminLogins) : defaultMaxAdminLogins;
  
  // STRICT RULE: Analytics is ONLY enabled for Enterprise plan!
  const analyticsEnabled = isEnterprise;

  const currentPlanName = settings?.planName || activePlanObj?.name || (isEnterprise ? 'Enterprise Scale' : isPro ? 'Growth Pro' : 'Starter QR');

  return {
    planId: settings?.planId || activePlanObj?.id || (isEnterprise ? 'plan-enterprise' : isPro ? 'plan-growth' : 'plan-starter'),
    planName: currentPlanName,
    isStarter,
    isPro,
    isEnterprise,
    maxTables,
    maxDishes,
    maxStaffAccounts,
    maxAdminLogins,
    analyticsEnabled,
  };
}
