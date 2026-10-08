import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { adminOrderService } from '../services/adminOrderService';
import { adminMenuService } from '../services/adminMenuService';
import { adminTableService } from '../services/adminTableService';
import { mockTables, mockRestaurantSettings } from '../data/mockAdminData';
import { mockCategories } from '../../data/mockCategories';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { apiRequest } from '../../services/apiConfig';

const AdminDataContext = createContext(null);

export const AdminDataProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(() => {
    return storage.get(STORAGE_KEYS.ADMIN_MENU_CATEGORIES, mockCategories.filter((c) => c.id !== 'all'));
  });
  const [tables, setTables] = useState(() => {
    return storage.get(STORAGE_KEYS.ADMIN_TABLES, []);
  });
  const [settings, setSettings] = useState(() => {
    return storage.get(STORAGE_KEYS.ADMIN_SETTINGS, mockRestaurantSettings);
  });
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync tables to storage
  useEffect(() => {
    storage.set(STORAGE_KEYS.ADMIN_TABLES, tables);
  }, [tables]);

  // Sync settings to storage
  useEffect(() => {
    storage.set(STORAGE_KEYS.ADMIN_SETTINGS, settings);
  }, [settings]);

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, id: Date.now() });
    if (duration) {
      setTimeout(() => {
        setToast((curr) => (curr && curr.message === message ? null : curr));
      }, duration);
    }
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await adminOrderService.getOrders();
      setOrders(data);
      return data;
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const items = await adminMenuService.getMenuItems();
      setMenuItems(items);
      return items;
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await adminMenuService.getCategories();
      if (cats && Array.isArray(cats)) {
        setCategories(cats);
        return cats;
      }
    } catch (err) {
      console.warn('Load categories error:', err);
    }
  };

  const loadTables = async () => {
    try {
      const tbls = await adminTableService.getTables();
      setTables(tbls);
      return tbls;
    } catch (err) {
      console.warn('Load tables warning:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const session = storage.get(STORAGE_KEYS.ADMIN_SESSION, null);
      const rawSlug = (session?.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const currentSlug = rawSlug.replace(/_/g, '-');
      const data = await apiRequest(`/settings/${currentSlug}`);
      if (data && data.success && data.settings) {
        setSettings((prev) => ({
          ...prev,
          ...data.settings,
        }));
        storage.set(STORAGE_KEYS.ADMIN_SETTINGS, {
          ...storage.get(STORAGE_KEYS.ADMIN_SETTINGS, {}),
          ...data.settings,
        });
        storage.set(`${STORAGE_KEYS.ADMIN_SETTINGS}_${currentSlug}`, data.settings);
        storage.set(`${STORAGE_KEYS.ADMIN_SETTINGS}_${rawSlug}`, data.settings);
      }
    } catch (err) {
      console.warn('Load settings warning:', err);
    }
  };

  const [waiterCalls, setWaiterCalls] = useState([]);

  const loadWaiterCalls = async () => {
    try {
      const session = storage.get(STORAGE_KEYS.ADMIN_SESSION, null);
      const currentSlug = (session?.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const calls = await notificationService.getWaiterCalls(currentSlug);
      if (Array.isArray(calls)) setWaiterCalls(calls);
    } catch (e) {}
  };

  const resolveWaiterCall = async (id, tableNumber) => {
    const cleanTable = String(tableNumber || '').replace(/^Table\s*/i, '').trim();
    setWaiterCalls((prev) => prev.filter((c) => c.id !== id && c.tableNumber !== cleanTable));
    showToast(`Assistance for Table ${cleanTable || '01'} marked as attended`, 'success');
    try {
      const session = storage.get(STORAGE_KEYS.ADMIN_SESSION, null);
      const currentSlug = (session?.restaurantSlug || 'spice-garden').toLowerCase().trim();
      await notificationService.resolveWaiterCall(id, cleanTable, currentSlug);
    } catch (e) {}
  };

  // Initial load & 4-second live polling for new customer orders & waiter calls
  useEffect(() => {
    loadOrders();
    loadMenuItems();
    loadCategories();
    loadTables();
    loadSettings();
    loadWaiterCalls();

    const interval = setInterval(() => {
      const session = storage.get(STORAGE_KEYS.ADMIN_SESSION, null);
      const currentSlug = (session?.restaurantSlug || 'spice-garden').toLowerCase().trim();

      adminOrderService.getOrders().then((latest) => {
        if (latest && Array.isArray(latest)) {
          setOrders(latest);
        }
      });
      adminTableService.getTables().then((latestTbls) => {
        if (latestTbls && Array.isArray(latestTbls)) {
          setTables(latestTbls);
        }
      });
      notificationService.getWaiterCalls(currentSlug).then((calls) => {
        if (Array.isArray(calls)) {
          setWaiterCalls(calls);
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);


  const updateOrderStatus = async (orderId, nextStatus, metadata = {}) => {
    // 1. Instant optimistic UI update (0ms latency for admin)
    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId || o.id === orderId
          ? { ...o, orderStatus: nextStatus, status: nextStatus, ...metadata }
          : o
      )
    );

    // If order is completed or cancelled, optimistically release the table
    if (nextStatus === 'SERVED' || nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED' || nextStatus === 'REJECTED') {
      const order = orders.find((o) => o.orderId === orderId || o.id === orderId);
      if (order && order.tableNumber) {
        setTables((prev) =>
          prev.map((t) =>
            t.number === order.tableNumber || t.id === order.tableNumber
              ? {
                  ...t,
                  status: (nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED' || nextStatus === 'REJECTED') ? 'AVAILABLE' : 'CLEANING',
                  currentOrderId: null,
                  customerName: null,
                  amount: 0,
                  occupiedSince: null,
                }
              : t
          )
        );
      }
    }

    showToast(`Order #${orderId} marked as ${nextStatus}`, 'success');

    // 2. Background sync with backend API
    try {
      const updated = await adminOrderService.updateOrderStatus(orderId, nextStatus, metadata);
      loadTables(); // Refresh tables in background
      return updated;
    } catch (err) {
      console.warn('Background order status sync warning:', err);
    }
  };

  const markPaid = async (orderId, method = 'UPI', markServed = true) => {
    // 1. Instant optimistic UI update (0ms latency for admin)
    let orderTotal = 0;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.orderId === orderId || o.id === orderId) {
          orderTotal = o.total || 0;
          return {
            ...o,
            paymentStatus: 'COMPLETED',
            paymentMethod: method,
            paidAt: new Date().toISOString(),
            ...(markServed ? { orderStatus: 'SERVED' } : {}),
          };
        }
        return o;
      })
    );

    showToast(`Payment of ₹${orderTotal} confirmed! Order #${orderId} marked as SERVED.`, 'success');

    // 2. Background sync with backend API
    try {
      return await adminOrderService.markPaid(orderId, method, markServed);
    } catch (err) {
      console.warn('Background payment sync warning:', err);
    }
  };

  const setPreparationTime = async (orderId, minutes) => {
    // 1. Instant optimistic UI update
    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId || o.id === orderId
          ? { ...o, etaMinutes: minutes }
          : o
      )
    );

    showToast(`Kitchen ETA set to ${minutes} mins for Order #${orderId}`, 'success');

    // 2. Background sync with backend API
    try {
      return await adminOrderService.setPreparationTime(orderId, minutes);
    } catch (err) {
      console.warn('Background ETA sync warning:', err);
    }
  };

  const updateTableStatus = async (tableId, newStatus, customerName = null) => {
    // 1. Instant optimistic UI update (0ms latency for admin)
    setTables((prev) =>
      prev.map((t) => (t.id === tableId || t.number === tableId ? {
        ...t,
        status: newStatus,
        customerName: newStatus === 'AVAILABLE' ? null : (customerName !== null ? customerName : t.customerName),
        currentOrderId: newStatus === 'AVAILABLE' ? null : t.currentOrderId,
        amount: newStatus === 'AVAILABLE' ? 0 : t.amount,
      } : t))
    );

    showToast(`Table status manually set to ${newStatus}`, 'info');

    // 2. Background sync with backend
    try {
      await adminTableService.updateTableStatus(tableId, newStatus, customerName);
    } catch (err) {
      console.warn('Sync table status error:', err);
    }
  };

  const deleteOrder = async (orderId) => {
    const cleanId = String(orderId).replace('#', '').trim();
    setOrders((prev) => prev.filter((o) => (o.orderId || o.id) !== cleanId && (o.orderId || o.id) !== `#${cleanId}` && (o.orderId || o.id) !== orderId));
    showToast(`Order #${cleanId} deleted permanently`, 'info');
    try {
      await adminOrderService.deleteOrder(orderId);
    } catch (err) {
      console.warn('Delete order error:', err);
    }
  };

  const addTable = async (tableData) => {
    try {
      const created = await adminTableService.addTable(tableData);
      setTables((prev) => [...prev, created]);
      showToast(`Table #${created.number} added successfully`, 'success');
      return created;
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleMenuItemAvailability = async (id) => {
    // 1. Instant optimistic UI toggle (0ms latency)
    let targetName = 'Item';
    let newStatus = true;

    setMenuItems((prev) =>
      prev.map((i) => {
        if (i.id === id || i.itemId === id) {
          targetName = i.name;
          newStatus = !i.isAvailable;
          return { ...i, isAvailable: newStatus };
        }
        return i;
      })
    );

    showToast(
      `"${targetName}" is now ${newStatus ? 'Available' : 'Unavailable'}`,
      newStatus ? 'success' : 'warning'
    );

    // 2. Background sync with backend
    try {
      await adminMenuService.toggleAvailability(id);
    } catch (err) {
      console.warn('Background menu item availability sync warning:', err);
    }
  };

  const saveMenuItem = async (itemData) => {
    const tempId = itemData.id || `item-${Date.now().toString().slice(-6)}`;
    const optimisticItem = { ...itemData, id: tempId, itemId: tempId };

    if (itemData.id) {
      // Optimistic update
      setMenuItems((prev) => prev.map((i) => (i.id === itemData.id ? { ...i, ...itemData } : i)));
      showToast(`Menu item "${itemData.name}" updated`, 'success');
    } else {
      // Optimistic add
      setMenuItems((prev) => [optimisticItem, ...prev]);
      showToast(`New item "${itemData.name}" added to menu`, 'success');
    }

    try {
      if (itemData.id) {
        const updated = await adminMenuService.updateItem(itemData.id, itemData);
        if (updated) {
          setMenuItems((prev) => prev.map((i) => (i.id === itemData.id ? updated : i)));
        }
        return updated;
      } else {
        const created = await adminMenuService.addItem(itemData);
        if (created) {
          setMenuItems((prev) => prev.map((i) => (i.id === tempId ? created : i)));
        }
        return created;
      }
    } catch (err) {
      console.warn('Background save menu item sync warning:', err);
    }
  };

  const deleteMenuItem = async (id) => {
    // Instant optimistic deletion (0ms)
    setMenuItems((prev) => prev.filter((i) => i.id !== id && i.itemId !== id));
    showToast('Menu item removed', 'info');

    try {
      await adminMenuService.deleteItem(id);
    } catch (err) {
      console.warn('Background delete item sync warning:', err);
    }
  };

  const addCategory = async (categoryData) => {
    const id = (categoryData.id || categoryData.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const optimisticCat = {
      id,
      name: categoryData.name.trim(),
      icon: categoryData.icon || 'Utensils',
      sortOrder: categories.length + 1,
    };

    setCategories((prev) => {
      if (prev.some((c) => c.id === id)) return prev;
      return [...prev, optimisticCat];
    });

    showToast(`Category "${optimisticCat.name}" added successfully`, 'success');

    try {
      const updated = await adminMenuService.addCategory(categoryData);
      if (updated && Array.isArray(updated)) {
        setCategories(updated);
      }
      return optimisticCat;
    } catch (err) {
      console.warn('Background add category sync error:', err);
    }
  };

  const deleteCategory = async (categoryId) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    showToast('Category removed', 'info');

    try {
      const updated = await adminMenuService.deleteCategory(categoryId);
      if (updated && Array.isArray(updated)) {
        setCategories(updated);
      }
    } catch (err) {
      console.warn('Background delete category error:', err);
    }
  };

  const updateSettings = async (partialSettings) => {
    const session = storage.get(STORAGE_KEYS.ADMIN_SESSION, null);
    const rawSlug = (session?.restaurantSlug || 'spice-garden').toLowerCase().trim();
    const currentSlug = rawSlug.replace(/_/g, '-');

    const updated = {
      ...settings,
      ...partialSettings,
      restaurantSlug: currentSlug,
    };

    setSettings(updated);
    storage.set(STORAGE_KEYS.ADMIN_SETTINGS, updated);
    storage.set(`${STORAGE_KEYS.ADMIN_SETTINGS}_${currentSlug}`, updated);
    storage.set(`${STORAGE_KEYS.ADMIN_SETTINGS}_${rawSlug}`, updated);

    // Also persist to MongoDB backend for this specific restaurant slug
    try {
      await apiRequest(`/settings/${currentSlug}`, {
        method: 'PUT',
        body: JSON.stringify({ ...partialSettings, slug: currentSlug }),
      });
    } catch (err) {
      console.warn('Backend settings update warning:', err);
    }

    showToast('Restaurant configuration updated', 'success');
  };


  // Dynamic Payments derived from real orders
  const payments = useMemo(() => {
    return orders.map((o) => ({
      id: `PAY-${o.orderId?.replace('ORD-', '') || o.id}`,
      orderId: o.orderId || o.id,
      customerName: o.customerName || 'Guest Diner',
      customerPhone: o.mobile || '',
      tableNumber: o.tableNumber || '01',
      amount: o.total || 0,
      method: o.paymentMethod || 'UPI',
      status: o.paymentStatus === 'COMPLETED' ? 'SUCCESS' : o.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
      timestamp: o.paidAt || o.createdAt,
    }));
  }, [orders]);

  const requestPayment = (orderId) => {
    showToast(`Payment request generated for Order #${orderId}`, 'info');
  };

  const markPaymentSuccess = async (paymentId) => {
    const orderId = paymentId.startsWith('PAY-') ? paymentId.replace('PAY-', 'ORD-') : paymentId;
    await markPaid(orderId, 'UPI');
  };

  // Aggregated live statistics
  const stats = useMemo(() => {
    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter((o) => o.orderStatus === 'COMPLETED' || o.orderStatus === 'SERVED');
    const totalRevenue = orders.reduce((sum, o) => {
      if (o.paymentStatus === 'COMPLETED') return sum + (o.total || 0);
      return sum;
    }, 0);

    const activeOrdersCount = orders.filter((o) =>
      ['RECEIVED', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.orderStatus)
    ).length;

    const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED').length;
    const totalTables = tables.length || 1;
    const tableOccupancyPercent = Math.round((occupiedTables / totalTables) * 100);

    const pendingPaymentsCount = orders.filter((o) => o.paymentStatus === 'PENDING').length;
    const pendingPaymentsAmount = orders
      .filter((o) => o.paymentStatus === 'PENDING')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      totalOrdersCount,
      todayOrdersCount: totalOrdersCount,
      completedOrdersCount: completedOrders.length,
      activeOrdersCount,
      totalRevenue,
      tableOccupancyPercent,
      occupiedTables,
      totalTables,
      occupiedTablesCount: occupiedTables,
      totalTablesCount: totalTables,
      pendingPaymentsCount,
      pendingPaymentsAmount,
    };
  }, [orders, tables]);

  const resetAllData = async () => {
    setIsLoading(true);
    try {
      await adminOrderService.resetAllOrders();
      setOrders([]);
      await loadTables();
      showToast('All orders, revenue, sales, and customers reset to 0! Ready for fresh start.', 'success');
    } catch (err) {
      showToast('Failed to reset data: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    orders,
    menuItems,
    categories,
    tables,
    waiterCalls,
    resolveWaiterCall,
    settings,
    stats,
    payments,
    toast,
    isLoading,
    loadOrders,
    loadMenuItems,
    loadCategories,
    loadTables,
    updateOrderStatus,
    markPaid,
    deleteOrder,
    setPreparationTime,
    updateTableStatus,
    addTable,
    toggleMenuItemAvailability,
    saveMenuItem,
    deleteMenuItem,
    addCategory,
    deleteCategory,
    updateSettings,
    requestPayment,
    markPaymentSuccess,
    resetAllData,
    showToast,
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
      {/* Toast Notification Container */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold backdrop-blur-md border border-amber-200"
          style={{
            backgroundColor:
              toast.type === 'error'
                ? '#FEE2E2'
                : toast.type === 'warning'
                ? '#FEF3C7'
                : toast.type === 'info'
                ? '#EFF6FF'
                : '#FEF9C3',
            color:
              toast.type === 'error'
                ? '#991B1B'
                : toast.type === 'warning'
                ? '#92400E'
                : toast.type === 'info'
                ? '#1E40AF'
                : '#78350F',
          }}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
};
