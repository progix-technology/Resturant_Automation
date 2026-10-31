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

    // Strictly match known mock restaurants without defaulting to mockRestaurants[0]
    const defaultMock = mockRestaurants.find(
      (r) => r.slug.toLowerCase().replace(/_/g, '-') === cleanSlug
    );

    let backendSettings = null;
    let backend404 = false;
    try {
      const res = await fetch(`${API_BASE_URL}/settings/${cleanSlug}`);
      const data = await res.json();
      if (res.ok && data.success && data.settings) {
        backendSettings = data.settings;
      } else if (res.status === 404) {
        backend404 = true;
      }
    } catch (e) {
      // Backend offline or network failure, will check local stores below
    }

    // If backend explicitly returned 404 and no local tenant or mock exists, restaurant does not exist!
    if (backend404 && !tenantMatch && !defaultMock) {
      throw new Error(`Restaurant "${slug}" not found. Please verify the QR code scanned.`);
    }

    // If neither backend, nor tenants, nor mock found this restaurant
    if (!backendSettings && !tenantMatch && !defaultMock) {
      throw new Error(`Restaurant "${slug}" not found. Please verify the QR code scanned.`);
    }

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
      : defaultMock
      ? {
          ...defaultMock,
          name: defaultMock.name,
          slug: cleanSlug,
          logo: defaultMock.logo || '',
          banner: defaultMock.banner || '',
          tagline: defaultMock.tagline || '',
        }
      : {
          id: backendSettings?.id || `rest-${cleanSlug}`,
          slug: cleanSlug,
          name: backendSettings?.restaurantName || backendSettings?.name || cleanSlug,
          tagline: backendSettings?.tagline || '',
          cuisine: backendSettings?.cuisine || 'Multi-Cuisine',
          rating: backendSettings?.rating || 4.8,
          reviewCount: backendSettings?.reviewCount || 50,
          address: backendSettings?.address || '',
          logo: backendSettings?.logo || '',
          banner: backendSettings?.banner || '',
          openTime: backendSettings?.openTime || '11:00 AM',
          closeTime: backendSettings?.closeTime || '11:00 PM',
          isOpen: backendSettings?.isAcceptingOrders !== false,
          currencySymbol: '₹',
          taxRatePercentage: 5,
          upiId: backendSettings?.upiId || '',
        };

    const perSlugSettings = storage.get(`${STORAGE_KEYS.ADMIN_SETTINGS}_${cleanSlug}`, {}) || storage.get(`${STORAGE_KEYS.ADMIN_SETTINGS}_${rawSlug}`, {}) || {};

    const adminSettings = {
      ...perSlugSettings,
      ...(backendSettings || {}),
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
