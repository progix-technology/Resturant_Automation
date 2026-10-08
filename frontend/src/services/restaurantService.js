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
    const rawSlug = (slug || 'spice-garden').toLowerCase().trim();
    const cleanSlug = rawSlug.replace(/_/g, '-');

    // Check SuperAdmin tenants first (for custom onboarded restaurants like 'a1')
    const superAdminTenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, []);
    const tenantMatch = superAdminTenants.find(
      (t) => (t.slug || '').toLowerCase().replace(/_/g, '-') === cleanSlug
    );

    const defaultMock = mockRestaurants.find((r) => r.slug.toLowerCase().replace(/_/g, '-') === cleanSlug) || mockRestaurants[0];

    const defaultRestaurant = tenantMatch
      ? {
          id: tenantMatch.id || `tenant-${cleanSlug}`,
          slug: cleanSlug,
          name: tenantMatch.name,
          tagline: tenantMatch.tagline || '',
          cuisine: tenantMatch.cuisine || 'North Indian • Multi-Cuisine',
          rating: 4.8,
          reviewCount: 150,
          address: tenantMatch.address || tenantMatch.city || 'Bengaluru',
          logo: tenantMatch.logo || '',
          banner: tenantMatch.banner || '',
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
          logo: '',
          banner: '',
          tagline: '',
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

    const perSlugSettings = storage.get(`${STORAGE_KEYS.ADMIN_SETTINGS}_${cleanSlug}`, {}) || storage.get(`${STORAGE_KEYS.ADMIN_SETTINGS}_${rawSlug}`, {}) || {};

    const adminSettings = {
      ...perSlugSettings,
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
      logo: adminSettings.logo !== undefined ? adminSettings.logo : defaultRestaurant.logo,
      banner: adminSettings.banner !== undefined ? adminSettings.banner : defaultRestaurant.banner,
      openTime: adminSettings.openTime || defaultRestaurant.openTime,
      closeTime: adminSettings.closeTime || defaultRestaurant.closeTime,
      isKitchenOpen: adminSettings.isKitchenOpen !== false,
      isOpen: adminSettings.isAcceptingOrders !== undefined ? adminSettings.isAcceptingOrders : defaultRestaurant.isOpen,
      upiId: adminSettings.upiId || defaultRestaurant.upiId,
      phone: adminSettings.phone || defaultRestaurant.phone,
      email: adminSettings.email || defaultRestaurant.email,
      bankName: adminSettings.bankName,
      accountHolderName: adminSettings.accountHolderName || adminSettings.accountHolder,
      accountNumber: adminSettings.accountNumber,
      ifscCode: adminSettings.ifscCode,
      accountType: adminSettings.accountType,
      branchName: adminSettings.branchName,
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
