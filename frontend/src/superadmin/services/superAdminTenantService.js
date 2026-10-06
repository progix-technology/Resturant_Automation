import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { mockRestaurantTenants } from '../data/mockSuperAdminData';
import { simulateDelay } from '../../services/apiConfig';

export const superAdminTenantService = {
  async getTenants() {
    await simulateDelay(200);
    const tenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, mockRestaurantTenants) || [];
    const mockIdsToRemove = ['tenant-002', 'tenant-003', 'tenant-004', 'tenant-005', 'tenant-006', 'tenant-007'];
    const cleanTenants = tenants.filter((t) => !mockIdsToRemove.includes(t.id));

    // Ensure every tenant has ownerEmail, ownerPassword & default menu initialized
    const updatedTenants = cleanTenants.map((t) => {
      const slug = t.slug || 'spice-garden';
      let ownerEmail = t.ownerEmail;
      if (!ownerEmail || ownerEmail.startsWith('_')) {
        ownerEmail = `${slug}@restaurant.com`;
      }
      const ownerPassword = t.ownerPassword || 'Admin@123';

      // Auto-provision menu for this slug if not already present
      const existingMenu = storage.get(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, []);
      const hasMenu = existingMenu.some((m) => m.restaurantSlug === slug);
      if (!hasMenu) {
        const defaultMenu = [
          {
            id: `item-${slug}-101`,
            restaurantSlug: slug,
            name: 'Crispy Corn Chilli Pepper',
            category: 'Starters & Appetizers',
            price: 240,
            description: 'Golden sweet corn kernels tossed with crunchy bell peppers, spring onion, and crushed black pepper.',
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
            isVeg: true,
            isSpicy: true,
            isPopular: true,
            isAvailable: true,
            preparationTime: 15,
          },
          {
            id: `item-${slug}-102`,
            restaurantSlug: slug,
            name: 'Paneer Tikka Angara',
            category: 'Starters & Appetizers',
            price: 320,
            description: 'Smoky char-grilled cottage cheese cubes marinated in fiery red spices and hung curd.',
            image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=500&q=80',
            isVeg: true,
            isSpicy: true,
            isPopular: true,
            isAvailable: true,
            preparationTime: 20,
          },
          {
            id: `item-${slug}-201`,
            restaurantSlug: slug,
            name: 'Paneer Butter Masala',
            category: 'Main Course Specialties',
            price: 340,
            description: 'Succulent malai paneer simmered in a velvety, rich tomato cashew butter gravy.',
            image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80',
            isVeg: true,
            isSpicy: false,
            isPopular: true,
            isAvailable: true,
            preparationTime: 20,
          },
          {
            id: `item-${slug}-301`,
            restaurantSlug: slug,
            name: 'Butter Garlic Naan',
            category: 'Breads & Rice',
            price: 75,
            description: 'Tandoor-baked leavened flatbread topped with roasted garlic flakes and melted salted butter.',
            image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80',
            isVeg: true,
            isSpicy: false,
            isPopular: true,
            isAvailable: true,
            preparationTime: 10,
          },
          {
            id: `item-${slug}-401`,
            restaurantSlug: slug,
            name: 'Fresh Mint Lime Mojito',
            category: 'Beverages & Mocktails',
            price: 150,
            description: 'Refreshing sparkling cooler muddled with fresh garden mint sprigs, lime wedges, and cane syrup.',
            image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=500&q=80',
            isVeg: true,
            isSpicy: false,
            isPopular: true,
            isAvailable: true,
            preparationTime: 8,
          },
        ];
        storage.set(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, [...defaultMenu, ...existingMenu]);
      }

      return {
        ...t,
        ownerEmail,
        ownerPassword,
      };
    });

    storage.set(STORAGE_KEYS.SUPERADMIN_TENANTS, updatedTenants);
    return updatedTenants;
  },

  async addTenant(tenantData) {
    await simulateDelay(250);
    const tenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, mockRestaurantTenants);
    const slug = (tenantData.slug || `rest-${Date.now().toString().slice(-4)}`).toLowerCase().trim();

    const ownerEmail = (tenantData.ownerEmail && tenantData.ownerEmail.includes('@'))
      ? tenantData.ownerEmail.trim().toLowerCase()
      : `${slug}@restaurant.com`;
    const ownerPassword = tenantData.ownerPassword || 'Admin@123';

    const newTenant = {
      ...tenantData,
      id: `tenant-${Date.now().toString().slice(-4)}`,
      slug,
      ownerEmail,
      ownerPassword,
      registeredAt: new Date().toISOString().split('T')[0],
      monthlyOrders: 0,
      monthlyGMV: 0,
      activeTables: Number(tenantData.activeTables) || 10,
      status: tenantData.status || 'ACTIVE',
      isPaid: tenantData.status === 'ACTIVE',
    };

    // Auto-provision starter menu
    const existingMenu = storage.get(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, []);
    const defaultMenu = [
      {
        id: `item-${slug}-101`,
        restaurantSlug: slug,
        name: 'Crispy Corn Chilli Pepper',
        category: 'Starters & Appetizers',
        price: 240,
        description: 'Golden sweet corn kernels tossed with crunchy bell peppers, spring onion, and crushed black pepper.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
        isVeg: true,
        isSpicy: true,
        isPopular: true,
        isAvailable: true,
        preparationTime: 15,
      },
      {
        id: `item-${slug}-102`,
        restaurantSlug: slug,
        name: 'Paneer Tikka Angara',
        category: 'Starters & Appetizers',
        price: 320,
        description: 'Smoky char-grilled cottage cheese cubes marinated in fiery red spices and hung curd.',
        image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=500&q=80',
        isVeg: true,
        isSpicy: true,
        isPopular: true,
        isAvailable: true,
        preparationTime: 20,
      },
      {
        id: `item-${slug}-201`,
        restaurantSlug: slug,
        name: 'Paneer Butter Masala',
        category: 'Main Course Specialties',
        price: 340,
        description: 'Succulent malai paneer simmered in a velvety, rich tomato cashew butter gravy.',
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80',
        isVeg: true,
        isSpicy: false,
        isPopular: true,
        isAvailable: true,
        preparationTime: 20,
      },
      {
        id: `item-${slug}-301`,
        restaurantSlug: slug,
        name: 'Butter Garlic Naan',
        category: 'Breads & Rice',
        price: 75,
        description: 'Tandoor-baked leavened flatbread topped with roasted garlic flakes and melted salted butter.',
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80',
        isVeg: true,
        isSpicy: false,
        isPopular: true,
        isAvailable: true,
        preparationTime: 10,
      },
      {
        id: `item-${slug}-401`,
        restaurantSlug: slug,
        name: 'Fresh Mint Lime Mojito',
        category: 'Beverages & Mocktails',
        price: 150,
        description: 'Refreshing sparkling cooler muddled with fresh garden mint sprigs, lime wedges, and cane syrup.',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=500&q=80',
        isVeg: true,
        isSpicy: false,
        isPopular: true,
        isAvailable: true,
        preparationTime: 8,
      },
    ];
    storage.set(STORAGE_KEYS.ADMIN_MENU_OVERRIDE, [...defaultMenu, ...existingMenu]);

    const updated = [newTenant, ...tenants];
    storage.set(STORAGE_KEYS.SUPERADMIN_TENANTS, updated);
    return newTenant;
  },

  async updateTenant(id, updates) {
    await simulateDelay(200);
    const tenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, mockRestaurantTenants);
    let updatedItem = null;
    const nextTenants = tenants.map((t) => {
      if (t.id === id) {
        updatedItem = { ...t, ...updates };
        return updatedItem;
      }
      return t;
    });
    storage.set(STORAGE_KEYS.SUPERADMIN_TENANTS, nextTenants);
    return updatedItem;
  },

  async toggleTenantStatus(id, newStatus) {
    return this.updateTenant(id, { 
      status: newStatus,
      isPaid: newStatus === 'ACTIVE' 
    });
  },

  async deleteTenant(id) {
    await simulateDelay(200);
    const tenants = storage.get(STORAGE_KEYS.SUPERADMIN_TENANTS, mockRestaurantTenants);
    const filtered = tenants.filter((t) => t.id !== id);
    storage.set(STORAGE_KEYS.SUPERADMIN_TENANTS, filtered);
    return true;
  },
};
