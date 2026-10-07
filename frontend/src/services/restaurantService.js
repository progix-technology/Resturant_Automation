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

    const defaultMock = mockRestaurants.find((r) => r.slug.toLowerCase() === cleanSlug) || mockRestaurants[0] || {};

    const defaultRestaurant = tenantMatch
      ? {
          id: tenantMatch.id || `tenant-${cleanSlug}`,
          slug: tenantMatch.slug,
          name: tenantMatch.name,
          tagline: tenantMatch.tagline || '',
          cuisine: tenantMatch.cuisine || '',
          rating: 4.8,
          reviewCount: 0,
          address: tenantMatch.address || tenantMatch.city || '',
          logo: tenantMatch.logo && tenantMatch.logo.startsWith('http') ? tenantMatch.logo : '',
          banner: tenantMatch.banner && tenantMatch.banner.startsWith('http') ? tenantMatch.banner : '',
          openTime: '11:30 AM',
          closeTime: '11:00 PM',
          isOpen: tenantMatch.status === 'ACTIVE',
          currencySymbol: '₹',
          taxRatePercentage: 5,
          upiId: tenantMatch.upiId || '',
        }
      : {
          ...defaultMock,
          name: defaultMock.name || 'Restaurant',
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

    // Auto-scrub legacy dummy unsplash photos or Indiranagar address if present in backendSettings
    if (backendSettings.logo && (backendSettings.logo.includes('unsplash.com') || backendSettings.logo === '🌿')) {
      backendSettings.logo = '';
    }
    if (backendSettings.banner && backendSettings.banner.includes('unsplash.com')) {
      backendSettings.banner = '';
    }
    if (backendSettings.address && (backendSettings.address.includes('Indiranagar') || backendSettings.address.includes('High Street') || backendSettings.address.includes('Palm Grove'))) {
      backendSettings.address = '';
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
      tagline: adminSettings.tagline !== undefined ? adminSettings.tagline : (defaultRestaurant.tagline || ''),
      cuisine: adminSettings.cuisine !== undefined ? adminSettings.cuisine : (defaultRestaurant.cuisine || ''),
      rating: adminSettings.rating !== undefined ? adminSettings.rating : (defaultRestaurant.rating || 4.8),
      reviewCount: adminSettings.reviewCount !== undefined ? adminSettings.reviewCount : (defaultRestaurant.reviewCount || 0),
      address: adminSettings.address !== undefined ? adminSettings.address : (defaultRestaurant.address || ''),
      logo: adminSettings.logo !== undefined ? adminSettings.logo : (defaultRestaurant.logo || ''),
      banner: adminSettings.banner !== undefined ? adminSettings.banner : (defaultRestaurant.banner || ''),
      openTime: adminSettings.openTime || defaultRestaurant.openTime || '11:30 AM',
      closeTime: adminSettings.closeTime || defaultRestaurant.closeTime || '11:00 PM',
      isKitchenOpen: adminSettings.isKitchenOpen !== false,
      isOpen: adminSettings.isAcceptingOrders !== undefined ? adminSettings.isAcceptingOrders : defaultRestaurant.isOpen,
      upiId: adminSettings.upiId !== undefined ? adminSettings.upiId : (defaultRestaurant.upiId || ''),
      phone: adminSettings.phone !== undefined ? adminSettings.phone : (defaultRestaurant.phone || ''),
      email: adminSettings.email !== undefined ? adminSettings.email : (defaultRestaurant.email || ''),
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
