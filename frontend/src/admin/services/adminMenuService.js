import { apiRequest } from '../../services/apiConfig';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { mockMenuItems } from '../../data/mockMenuItems';
import { mockCategories } from '../../data/mockCategories';

const getCurrentSlug = () => {
  const session = storage.get(STORAGE_KEYS.ADMIN_SESSION, null);
  return (session?.restaurantSlug || 'spice-garden').toLowerCase().trim();
};

export const adminMenuService = {
  /**
   * Fetch menu items for the logged-in restaurant admin
   */
  async getMenuItems() {
    const currentSlug = getCurrentSlug();
    try {
      const res = await apiRequest(`/menu?slug=${currentSlug}`);
      if (res && res.items && Array.isArray(res.items) && res.items.length > 0) {
        const normalized = res.items.map((i) => ({
          id: i.itemId || i.id,
          itemId: i.itemId || i.id,
          restaurantSlug: currentSlug,
          name: i.name,
          category: i.category,
          categoryId: i.categoryId || (i.category || '').toLowerCase().replace(/[^a-z0-9]/g, '-') || 'starters',
          price: i.price,
          description: i.description || '',
          image: i.image || '',
          isVeg: i.isVeg ?? true,
          isSpicy: i.isSpicy ?? false,
          isRecommended: i.isRecommended ?? i.isPopular ?? false,
          isAddon: i.isAddon ?? false,
          isAvailable: i.isAvailable ?? true,
          preparationTime: i.preparationTime || '15 mins',
          addons: i.addons || [],
          variants: i.variants || [],
          rating: i.rating || 4.8,
        }));

        // Save into override array preserving other restaurants' items
        const allStored = storage.get(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, []);
        const otherItems = Array.isArray(allStored)
          ? allStored.filter((i) => (i.restaurantSlug || '').toLowerCase() !== currentSlug)
          : [];
        storage.set(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, [...normalized, ...otherItems]);

        return normalized;
      }
    } catch (err) {
      console.warn('Backend menu fetch fallback:', err.message);
    }

    const allStored = storage.get(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, []);
    const matchingStored = Array.isArray(allStored)
      ? allStored.filter((i) => (i.restaurantSlug || '').toLowerCase() === currentSlug)
      : [];

    if (matchingStored.length > 0) {
      return matchingStored;
    }

    const defaultItems = mockMenuItems.map((i) => ({ ...i, restaurantSlug: currentSlug }));
    storage.set(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, [...defaultItems, ...(Array.isArray(allStored) ? allStored : [])]);
    return defaultItems;
  },

  async getCategories() {
    const currentSlug = getCurrentSlug();
    const key = `${STORAGE_KEYS.ADMIN_MENU_CATEGORIES}_${currentSlug}`;
    try {
      const res = await apiRequest('/menu/categories');
      if (res && res.categories && Array.isArray(res.categories) && res.categories.length > 0) {
        storage.set(key, res.categories);
        return res.categories;
      }
    } catch (err) {
      // Fallback
    }

    const stored = storage.get(key);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }

    const initial = mockCategories.filter((c) => c.id !== 'all');
    storage.set(key, initial);
    return initial;
  },

  async addCategory(categoryData) {
    const currentSlug = getCurrentSlug();
    const key = `${STORAGE_KEYS.ADMIN_MENU_CATEGORIES}_${currentSlug}`;
    try {
      const res = await apiRequest('/menu/categories', {
        method: 'POST',
        body: JSON.stringify({ ...categoryData, restaurantSlug: currentSlug }),
      });
      if (res && res.categories) {
        storage.set(key, res.categories);
        return res.categories;
      }
    } catch (err) {
      console.warn('Backend add category fallback:', err.message);
    }

    const categories = await this.getCategories();
    const id = (categoryData.id || categoryData.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const exists = categories.find((c) => c.id === id);
    if (!exists) {
      const newCat = {
        id,
        name: categoryData.name.trim(),
        icon: categoryData.icon || 'Utensils',
        sortOrder: categories.length + 1,
      };
      const updated = [...categories, newCat];
      storage.set(key, updated);
      return updated;
    }
    return categories;
  },

  async deleteCategory(categoryId) {
    const currentSlug = getCurrentSlug();
    const key = `${STORAGE_KEYS.ADMIN_MENU_CATEGORIES}_${currentSlug}`;
    try {
      const res = await apiRequest(`/menu/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (res && res.categories) {
        storage.set(key, res.categories);
        return res.categories;
      }
    } catch (err) {
      console.warn('Backend delete category fallback:', err.message);
    }

    const categories = await this.getCategories();
    const updated = categories.filter((c) => c.id !== categoryId);
    storage.set(key, updated);
    return updated;
  },

  async toggleAvailability(id) {
    const currentSlug = getCurrentSlug();
    const allItems = storage.get(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, []);
    const index = allItems.findIndex((i) => (i.id === id || i.itemId === id) && (i.restaurantSlug || currentSlug) === currentSlug);
    let toggledItem = null;

    if (index > -1) {
      allItems[index] = { ...allItems[index], isAvailable: !allItems[index].isAvailable };
      toggledItem = allItems[index];
      storage.set(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, allItems);
    }

    try {
      const res = await apiRequest(`/menu/items/${id}/toggle`, {
        method: 'PATCH',
      });
      if (res && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend toggle availability fallback:', err.message);
    }

    return toggledItem;
  },

  async addItem(itemData) {
    const currentSlug = getCurrentSlug();
    const newItem = {
      ...itemData,
      id: `item-${Date.now().toString().slice(-4)}`,
      restaurantSlug: currentSlug,
      price: Number(itemData.price),
      isAvailable: itemData.isAvailable ?? true,
      rating: 4.8,
      addons: itemData.addons || [],
    };

    try {
      await apiRequest('/menu/items', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
    } catch (err) {
      console.warn('Backend add item fallback:', err.message);
    }

    const allItems = storage.get(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, []);
    storage.set(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, [newItem, ...allItems]);
    return newItem;
  },

  async updateItem(id, itemData) {
    const currentSlug = getCurrentSlug();
    try {
      await apiRequest(`/menu/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...itemData, restaurantSlug: currentSlug }),
      });
    } catch (err) {
      console.warn('Backend update item fallback:', err.message);
    }

    const allItems = storage.get(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, []);
    const index = allItems.findIndex((i) => i.id === id || i.itemId === id);
    if (index === -1) throw new Error('Menu item not found');

    const updatedItem = {
      ...allItems[index],
      ...itemData,
      restaurantSlug: currentSlug,
      price: Number(itemData.price ?? allItems[index].price),
    };
    allItems[index] = updatedItem;
    storage.set(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, allItems);
    return updatedItem;
  },

  async deleteItem(id) {
    try {
      await apiRequest(`/menu/items/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Backend delete item fallback:', err.message);
    }

    const allItems = storage.get(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, []);
    const filtered = allItems.filter((i) => i.id !== id && i.itemId !== id);
    storage.set(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, filtered);
    return true;
  },
};
