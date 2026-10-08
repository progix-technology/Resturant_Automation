import { apiRequest } from '../../services/apiConfig';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';

const defaultTables = [
  { id: 'tbl-01', number: '01', capacity: 2, status: 'AVAILABLE', section: 'Main Dining', currentOrderId: null, customerName: null, amount: 0, occupiedSince: null },
  { id: 'tbl-02', number: '02', capacity: 4, status: 'AVAILABLE', section: 'Main Dining', currentOrderId: null, customerName: null, amount: 0, occupiedSince: null },
  { id: 'tbl-03', number: '03', capacity: 4, status: 'AVAILABLE', section: 'Main Dining', currentOrderId: null, customerName: null, amount: 0, occupiedSince: null },
  { id: 'tbl-04', number: '04', capacity: 6, status: 'AVAILABLE', section: 'Family Corner', currentOrderId: null, customerName: null, amount: 0, occupiedSince: null },
  { id: 'tbl-05', number: '05', capacity: 4, status: 'AVAILABLE', section: 'Terrace', currentOrderId: null, customerName: null, amount: 0, occupiedSince: null },
  { id: 'tbl-06', number: '06', capacity: 8, status: 'AVAILABLE', section: 'Family Corner', currentOrderId: null, customerName: null, amount: 0, occupiedSince: null },
];

const getCurrentSlug = () => {
  const session = storage.get(STORAGE_KEYS.ADMIN_SESSION, null);
  return (session?.restaurantSlug || 'spice-garden').toLowerCase().trim();
};

export const adminTableService = {
  /**
   * Fetch all tables for the logged-in restaurant with local storage fallback
   */
  async getTables() {
    const currentSlug = getCurrentSlug();
    const key = `${STORAGE_KEYS.ADMIN_TABLES}_${currentSlug}`;
    try {
      const res = await apiRequest(`/tables?slug=${currentSlug}`);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        // Standardize schema
        const normalized = res.data.map((t) => ({
          id: t.tableId || t.id,
          number: t.number,
          capacity: t.capacity || 4,
          status: t.status || 'AVAILABLE',
          section: t.section || 'Main Dining',
          currentOrderId: t.currentOrderId || null,
          customerName: t.customerName || null,
          amount: t.amount || 0,
          occupiedSince: t.occupiedSince || null,
        }));
        storage.set(key, normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('Backend tables fetch failed, falling back to storage:', err.message);
    }

    const stored = storage.get(key, defaultTables);
    return stored;
  },

  /**
   * Update table status (e.g. AVAILABLE, OCCUPIED, RESERVED, CLEANING)
   */
  async updateTableStatus(tableId, status, customerName = null) {
    const currentSlug = getCurrentSlug();
    const key = `${STORAGE_KEYS.ADMIN_TABLES}_${currentSlug}`;
    const tables = storage.get(key, defaultTables);
    const updated = tables.map((t) =>
      t.id === tableId || t.number === tableId
        ? {
            ...t,
            status,
            customerName: status === 'AVAILABLE' ? null : (customerName || t.customerName),
            currentOrderId: status === 'AVAILABLE' ? null : t.currentOrderId,
            amount: status === 'AVAILABLE' ? 0 : t.amount,
          }
        : t
    );
    storage.set(key, updated);

    try {
      await apiRequest(`/tables/${tableId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, customerName, restaurantSlug: currentSlug }),
      });
    } catch (err) {
      console.warn('Backend table status update fallback:', err.message);
    }

    return updated;
  },

  /**
   * Add a new table
   */
  async addTable(tableData) {
    const currentSlug = getCurrentSlug();
    const key = `${STORAGE_KEYS.ADMIN_TABLES}_${currentSlug}`;
    let backendCreated = null;

    try {
      const res = await apiRequest('/tables', {
        method: 'POST',
        body: JSON.stringify({ ...tableData, restaurantSlug: currentSlug }),
      });
      if (res && res.data) {
        backendCreated = res.data;
      }
    } catch (err) {
      console.error('[TABLE SERVICE ERROR] Add table failed:', err.message);
      throw err;
    }

    const tables = storage.get(key, defaultTables);
    const newTbl = backendCreated || {
      ...tableData,
      id: `tbl-${Date.now().toString().slice(-4)}`,
      amount: 0,
      occupiedSince: null,
      currentOrderId: null,
    };
    const updated = [...tables, newTbl];
    storage.set(key, updated);
    return newTbl;
  },
};
