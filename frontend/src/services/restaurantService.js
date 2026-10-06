import { mockRestaurants } from '../data/mockRestaurants';
import { simulateDelay, API_BASE_URL } from './apiConfig';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

export const restaurantService = {
  /**
   * Fetches restaurant by URL slug and merges dynamic admin settings
   * @param {string} slug 
   */
  async getRestaurant(slug) {
    await simulateDelay(100);
    const cleanSlug = (slug || 'spice-garden').toLowerCase().trim();

    // Check SuperAdmin tenants first (for custom onboarded restaurants like 'a1')
    const superAdminTenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, []);
    const tenantMatch = superAdminTenants.find(
      (t) => (t.slug || '').toLowerCase() === cleanSlug
    );

    const defaultMock = mockRestaurants.find((r) => r.slug.toLowerCase() === cleanSlug) || mockRestaurants[0];

    const defaultRestaurant = tenantMatch
      ? {
          id: tenantMatch.id || `tenant-${cleanSlug}`,
          slug: tenantMatch.slug,
          name: tenantMatch.name,
          tagline: tenantMatch.tagline || `${tenantMatch.name} - Quality Food & Dining`,
          cuisine: tenantMatch.cuisine || 'North Indian • Multi-Cuisine',
          rating: 4.8,
          reviewCount: 150,
          address: tenantMatch.address || tenantMatch.city || 'Bengaluru',
          logo: tenantMatch.logo && tenantMatch.logo.startsWith('http') ? tenantMatch.logo : defaultMock.logo,
          banner: defaultMock.banner,
          openTime: '11:00 AM',
          closeTime: '11:00 PM',
          isOpen: tenantMatch.status === 'ACTIVE',
          currencySymbol: '₹',
          taxRatePercentage: 5,
          upiId: tenantMatch.upiId || 'restaurant@upi',
        }
      : {
          ...defaultMock,
          name: defaultMock.name,
          slug: cleanSlug,
        };

    let backendSettings = {};
    try {
      const res = await fetch(`${API_BASE_URL}/settings/${cleanSlug}`);
      const data = await res.json();
      if (res.ok && data.success && data.settings) {
        backendSettings = data.settings;
      }
    } catch (e) {
      // Fallback silently
    }

    const normalizedSlug = cleanSlug.replace(/_/g, '-');
    const perSlugSettings = storage.get(`${STORAGE_KEYS.ADMIN_SETTINGS}_${normalizedSlug}`, {}) || storage.get(`${STORAGE_KEYS.ADMIN_SETTINGS}_${cleanSlug}`, {});
    const globalAdminSettings = storage.get(STORAGE_KEYS.ADMIN_SETTINGS, {});

    const storedAdminSettings = (globalAdminSettings.restaurantSlug === normalizedSlug || globalAdminSettings.restaurantSlug === cleanSlug || !globalAdminSettings.restaurantSlug)
      ? { ...globalAdminSettings, ...perSlugSettings }
      : perSlugSettings;

    const adminSettings = {
      ...storedAdminSettings,
      ...backendSettings,
    };

    return {
      ...defaultRestaurant,
      name: adminSettings.restaurantName || adminSettings.name || defaultRestaurant.name,
      tagline: adminSettings.tagline !== undefined ? adminSettings.tagline : defaultRestaurant.tagline,
      cuisine: adminSettings.cuisine || defaultRestaurant.cuisine,
      rating: adminSettings.rating !== undefined ? adminSettings.rating : defaultRestaurant.rating,
      reviewCount: adminSettings.reviewCount !== undefined ? adminSettings.reviewCount : defaultRestaurant.reviewCount,
      address: adminSettings.address || defaultRestaurant.address,
      logo: adminSettings.logo || defaultRestaurant.logo,
      banner: adminSettings.banner || defaultRestaurant.banner,
      openTime: adminSettings.openTime || defaultRestaurant.openTime,
      closeTime: adminSettings.closeTime || defaultRestaurant.closeTime,
      isKitchenOpen: adminSettings.isKitchenOpen !== false,
      isOpen: adminSettings.isAcceptingOrders !== undefined ? adminSettings.isAcceptingOrders : defaultRestaurant.isOpen,
      upiId: adminSettings.upiId || defaultRestaurant.upiId,
      phone: adminSettings.phone || defaultRestaurant.phone,
      email: adminSettings.email || defaultRestaurant.email,
    };
  },

  /**
   * Validates if a table number is valid for a restaurant
   */
  async validateTable(restaurantId, tableNumber) {
    await simulateDelay(150);
    const cleanTable = String(tableNumber).trim();
    if (!cleanTable) return false;
    return true;
  },
};
