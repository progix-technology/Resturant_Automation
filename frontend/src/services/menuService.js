import { mockCategories } from '../data/mockCategories';
import { mockMenuItems } from '../data/mockMenuItems';
import { apiRequest } from './apiConfig';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

export const menuService = {
  /**
   * Fetches categories
   */
  async getCategories() {
    try {
      const res = await apiRequest('/menu/categories');
      if (res && res.categories && Array.isArray(res.categories) && res.categories.length > 0) {
        return [{ id: 'all', name: 'All', icon: 'Sparkles' }, ...res.categories];
      }
    } catch (err) {
      // Fallback
    }

    const stored = storage.get(STORAGE_KEYS.ADMIN_MENU_CATEGORIES);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return [{ id: 'all', name: 'All', icon: 'Sparkles' }, ...stored];
    }

    return [...mockCategories];
  },

  /**
   * Fetches menu items directly from backend MongoDB Atlas or local store with slug filtering
   */
  async getMenuItems({ restaurantSlug = 'spice-garden', categoryId = 'all', searchQuery = '' } = {}) {
    let items = [];
    const cleanSlug = (restaurantSlug || 'spice-garden').toLowerCase().trim();

    try {
      const res = await apiRequest(`/menu?slug=${cleanSlug}`);
      if (res && res.items && Array.isArray(res.items) && res.items.length > 0) {
        items = res.items.map((i) => ({
          ...i,
          id: i.itemId || i.id,
          categoryId: i.categoryId || i.category,
        }));
      }
    } catch (err) {
      console.warn('Customer menu fetch fallback:', err.message);
    }

    if (items.length === 0) {
      const stored = storage.get(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, []);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        // Filter menu items for this specific restaurant slug
        const matchingStored = stored.filter(
          (item) => (item.restaurantSlug || '').toLowerCase() === cleanSlug
        );
        items = matchingStored.length > 0 ? matchingStored : stored;
      } else {
        items = mockMenuItems.map((item) => ({ ...item, restaurantSlug: cleanSlug }));
      }
    }

    if (categoryId && categoryId !== 'all') {
      items = items.filter((item) => item.categoryId === categoryId);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((item) => 
        (item.name || '').toLowerCase().includes(q) || 
        (item.description || '').toLowerCase().includes(q)
      );
    }

    return items;
  },

  /**
   * Fetches recommended items for a restaurant slug
   */
  async getRecommendedItems(restaurantSlug) {
    const items = await this.getMenuItems({ restaurantSlug });
    return items.filter((item) => (item.isRecommended || item.isPopular) && item.isAvailable);
  },

  /**
   * Fetches a single food item by ID and restaurant slug
   */
  async getItemById(itemId, restaurantSlug) {
    const items = await this.getMenuItems({ restaurantSlug });
    const item = items.find((i) => i.id === itemId || i.itemId === itemId);
    if (!item) {
      const error = new Error(`Item "${itemId}" not found`);
      error.code = 'ITEM_NOT_FOUND';
      throw error;
    }
    return { ...item };
  },
};
