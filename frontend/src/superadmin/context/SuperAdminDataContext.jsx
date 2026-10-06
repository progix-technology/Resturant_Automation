import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { superAdminTenantService } from '../services/superAdminTenantService';
import { superAdminPlanService } from '../services/superAdminPlanService';
import { superAdminBillingService } from '../services/superAdminBillingService';
import { mockPlatformSettings } from '../data/mockSuperAdminData';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';

const SuperAdminDataContext = createContext(null);

export const SuperAdminDataProvider = ({ children }) => {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [settings, setSettings] = useState(() => {
    return storage.get(STORAGE_KEYS.SUPERADMIN_SETTINGS, mockPlatformSettings);
  });
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, id: Date.now() });
    if (duration) {
      setTimeout(() => {
        setToast((curr) => (curr && curr.message === message ? null : curr));
      }, duration);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tList, pList, iList] = await Promise.all([
        superAdminTenantService.getTenants(),
        superAdminPlanService.getPlans(),
        superAdminBillingService.getInvoices(),
      ]);
      setTenants(tList);
      setPlans(pList);
      setInvoices(iList);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync settings
  useEffect(() => {
    storage.set(STORAGE_KEYS.SUPERADMIN_SETTINGS, settings);
  }, [settings]);

  // Tenant Operations
  const addTenant = async (tenantData) => {
    try {
      const created = await superAdminTenantService.addTenant(tenantData);
      setTenants((prev) => [created, ...prev]);
      showToast(`Restaurant "${created.name}" onboarded on ${created.planName}`, 'success');
      return created;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const updateTenant = async (id, updates) => {
    try {
      const updated = await superAdminTenantService.updateTenant(id, updates);
      setTenants((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast(`Tenant "${updated.name}" updated`, 'success');
      return updated;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const toggleTenantStatus = async (id, newStatus) => {
    try {
      const updated = await superAdminTenantService.toggleTenantStatus(id, newStatus);
      setTenants((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast(`Tenant status set to ${newStatus}`, newStatus === 'ACTIVE' ? 'success' : 'warning');
      return updated;
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteTenant = async (id) => {
    try {
      await superAdminTenantService.deleteTenant(id);
      setTenants((prev) => prev.filter((t) => t.id !== id));
      showToast('Tenant removed from platform', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Plan Operations
  const addPlan = async (planData) => {
    try {
      const created = await superAdminPlanService.addPlan(planData);
      setPlans((prev) => [...prev, created]);
      showToast(`New packaging tier "${created.name}" created`, 'success');
      return created;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const updatePlan = async (id, updates) => {
    try {
      const updated = await superAdminPlanService.updatePlan(id, updates);
      setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(`Plan "${updated.name}" updated`, 'success');
      return updated;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  // Billing Operations
  const markInvoicePaid = async (invoiceId) => {
    try {
      const updated = await superAdminBillingService.markInvoicePaid(invoiceId);
      setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? updated : inv)));
      showToast(`Invoice #${invoiceId} marked as settled`, 'success');
      return updated;
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const generateInvoice = async (tenant) => {
    try {
      const newInv = await superAdminBillingService.generateInvoice(tenant);
      setInvoices((prev) => [newInv, ...prev]);
      showToast(`Invoice #${newInv.id} generated for ${tenant.name}`, 'success');
      return newInv;
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updatePlatformSettings = (newSettings) => {
    setSettings(newSettings);
    showToast('Platform settings saved successfully', 'success');
  };

  // Platform Metrics
  const metrics = useMemo(() => {
    const active = tenants.filter((t) => t.status === 'ACTIVE');
    const trial = tenants.filter((t) => t.status === 'TRIAL');
    const overdue = tenants.filter((t) => t.status === 'OVERDUE');

    // Monthly Recurring Revenue calculation
    const mrr = active.reduce((acc, t) => {
      if (t.billingCycle === 'ANNUAL') {
        return acc + Math.round((t.planAmount || 0) / 12);
      }
      return acc + (t.planAmount || 0);
    }, 0);

    const arr = mrr * 12;

    const totalGMV = tenants.reduce((acc, t) => acc + (t.monthlyGMV || 0), 0);
    const totalOrders = tenants.reduce((acc, t) => acc + (t.monthlyOrders || 0), 0);
    const totalTables = tenants.reduce((acc, t) => acc + (t.activeTables || 0), 0);

    const pendingCollection = invoices
      .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
      .reduce((acc, i) => acc + (i.total || 0), 0);

    return {
      mrr,
      arr,
      activeTenantsCount: active.length,
      trialTenantsCount: trial.length,
      overdueTenantsCount: overdue.length,
      totalTenantsCount: tenants.length,
      totalGMV,
      totalOrders,
      totalTables,
      pendingCollection,
    };
  }, [tenants, invoices]);

  return (
    <SuperAdminDataContext.Provider
      value={{
        tenants,
        plans,
        invoices,
        settings,
        metrics,
        addTenant,
        updateTenant,
        toggleTenantStatus,
        deleteTenant,
        addPlan,
        updatePlan,
        markInvoicePaid,
        generateInvoice,
        updatePlatformSettings,
        toast,
        showToast,
        isLoading,
      }}
    >
      {children}
    </SuperAdminDataContext.Provider>
  );
};

export const useSuperAdminData = () => {
  const context = useContext(SuperAdminDataContext);
  if (!context) {
    throw new Error('useSuperAdminData must be used within a SuperAdminDataProvider');
  }
  return context;
};
