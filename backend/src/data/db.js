import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from '../utils/passwordUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

// Generate initial seeded data with bcrypt-hashed passwords
const getInitialSeed = () => {
  return {
    superAdmins: [
      {
        id: 'sa-progix-01',
        name: 'Progix Technology',
        email: 'progixtechnology@gmail.com',
        // Hashed using bcryptjs with 10 salt rounds: Progix@123
        passwordHash: hashPassword('Progix@123'),
        role: 'PLATFORM_SUPERADMIN',
        title: 'Platform Founder & Owner',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        company: 'Progix Technology Pvt Ltd',
      },
      {
        id: 'sa-owner-02',
        name: 'Alexander Vance',
        email: 'owner@orderflow.io',
        passwordHash: hashPassword('SuperAdmin@123'),
        role: 'PLATFORM_SUPERADMIN',
        title: 'Platform Co-Founder',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
        company: 'OrderFlow HQ',
      },
    ],
    restaurantAdmins: [
      {
        id: 'adm-rest-01',
        name: 'Restaurant 1 Manager',
        email: 'resturant1@gmail.com',
        // Hashed using bcryptjs with 10 salt rounds: 123123
        passwordHash: hashPassword('123123'),
        role: 'ADMIN',
        title: 'Head of Operations',
        avatar: '',
        restaurantId: 'rest-001',
        restaurantSlug: 'spice-garden',
      },
      {
        id: 'adm-vikram-02',
        name: 'Vikram Malhotra',
        email: 'admin@restaurant.com',
        passwordHash: hashPassword('Admin@123'),
        role: 'SUPER_ADMIN',
        title: 'General Manager',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        restaurantId: 'rest-001',
        restaurantSlug: 'spice-garden',
      },
      {
        id: 'adm-staff-03',
        name: 'Rohan Verma',
        email: 'rohan@restaurant.com',
        passwordHash: hashPassword('Admin@123'),
        role: 'STAFF',
        title: 'Floor Lead',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        restaurantId: 'rest-001',
        restaurantSlug: 'spice-garden',
      },
    ],
    restaurants: [
      {
        id: 'rest-001',
        name: 'The Spice Garden',
        slug: 'spice-garden',
        logo: '🌿',
        tagline: 'Authentic Indian Flavours & Contemporary Tandoor',
        city: 'Bengaluru',
        address: 'Shop 14, High Street Avenue, Indiranagar, Bengaluru, 560038',
        phone: '+91 98765 43210',
        email: 'contact@spicegarden.com',
        gstNumber: '29ABCDE1234F1Z5',
        currency: 'INR',
        taxPercentage: 5,
        serviceChargePercentage: 0,
        isAcceptingOrders: true,
        defaultPrepTime: 25,
        upiId: 'spicegarden@okhdfcbank',
      },
      {
        id: 'rest-002',
        name: 'Royal Biryani Darbar',
        slug: 'royal-biryani',
        logo: '👑',
        tagline: 'Royal Awadhi Dum Biryanis & Mughlai Delicacies',
        city: 'New Delhi',
        address: 'Inner Circle, Connaught Place',
        phone: '+91 98111 22334',
        email: 'tariq@royalbiryani.in',
        currency: 'INR',
        taxPercentage: 5,
        isAcceptingOrders: true,
        defaultPrepTime: 30,
        upiId: 'royalbiryani@upi',
      },
    ],
    menuCategories: [
      { id: 'cat-starters', name: 'Starters & Appetizers', sortOrder: 1 },
      { id: 'cat-mains', name: 'Main Course Specialties', sortOrder: 2 },
      { id: 'cat-breads', name: 'Breads & Rice', sortOrder: 3 },
      { id: 'cat-beverages', name: 'Beverages & Mocktails', sortOrder: 4 },
      { id: 'cat-desserts', name: 'Desserts & Sweets', sortOrder: 5 },
    ],
    menuItems: [
      {
        id: 'item-101',
        restaurantSlug: 'spice-garden',
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
        id: 'item-102',
        restaurantSlug: 'spice-garden',
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
        id: 'item-201',
        restaurantSlug: 'spice-garden',
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
        id: 'item-202',
        restaurantSlug: 'spice-garden',
        name: 'Dal Makhani Bukhara',
        category: 'Main Course Specialties',
        price: 290,
        description: 'Slow-cooked black lentils simmered overnight with tomatoes, churned butter, and fresh cream.',
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=500&q=80',
        isVeg: true,
        isSpicy: false,
        isPopular: true,
        isAvailable: true,
        preparationTime: 15,
      },
      {
        id: 'item-301',
        restaurantSlug: 'spice-garden',
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
        id: 'item-401',
        restaurantSlug: 'spice-garden',
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
      {
        id: 'item-501',
        restaurantSlug: 'spice-garden',
        name: 'Gulab Jamun with Rabri',
        category: 'Desserts & Sweets',
        price: 180,
        description: 'Warm melt-in-the-mouth khoya dumplings served over chilled saffron-infused rabri.',
        image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=500&q=80',
        isVeg: true,
        isSpicy: false,
        isPopular: true,
        isAvailable: true,
        preparationTime: 10,
      },
    ],
    tables: [
      { id: 'tbl-01', number: '01', capacity: 2, status: 'OCCUPIED', section: 'Main Dining', currentOrderId: 'ORD-1041', customerName: 'Rohan Sharma', amount: 890, occupiedSince: '28 mins ago' },
      { id: 'tbl-02', number: '02', capacity: 4, status: 'AVAILABLE', section: 'Main Dining', currentOrderId: null, customerName: null, amount: 0, occupiedSince: null },
      { id: 'tbl-03', number: '03', capacity: 4, status: 'OCCUPIED', section: 'Main Dining', currentOrderId: 'ORD-1042', customerName: 'Priya Patel', amount: 1450, occupiedSince: '14 mins ago' },
      { id: 'tbl-04', number: '04', capacity: 6, status: 'RESERVED', section: 'Family Corner', currentOrderId: null, customerName: 'Kapoor Family', amount: 0, occupiedSince: null },
      { id: 'tbl-05', number: '05', capacity: 2, status: 'CLEANING', section: 'Terrace', currentOrderId: null, customerName: null, amount: 0, occupiedSince: null },
      { id: 'tbl-06', number: '06', capacity: 8, status: 'AVAILABLE', section: 'Family Corner', currentOrderId: null, customerName: null, amount: 0, occupiedSince: null },
    ],
    orders: [
      {
        orderId: 'ORD-1041',
        id: 'ORD-1041',
        restaurantSlug: 'spice-garden',
        customerName: 'Rohan Sharma',
        mobile: '9876543210',
        tableNumber: '01',
        items: [
          { id: 'item-101', name: 'Crispy Corn Chilli Pepper', price: 240, quantity: 1, isVeg: true },
          { id: 'item-201', name: 'Paneer Butter Masala', price: 340, quantity: 1, isVeg: true },
          { id: 'item-301', name: 'Butter Garlic Naan', price: 75, quantity: 2, isVeg: true },
          { id: 'item-401', name: 'Fresh Mint Lime Mojito', price: 150, quantity: 1, isVeg: true },
        ],
        subtotal: 880,
        taxes: 44,
        total: 924,
        orderStatus: 'PREPARING',
        paymentStatus: 'COMPLETED',
        paymentMethod: 'UPI',
        etaMinutes: 20,
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      },
      {
        orderId: 'ORD-1042',
        id: 'ORD-1042',
        restaurantSlug: 'spice-garden',
        customerName: 'Priya Patel',
        mobile: '9812345678',
        tableNumber: '03',
        items: [
          { id: 'item-102', name: 'Paneer Tikka Angara', price: 320, quantity: 1, isVeg: true },
          { id: 'item-201', name: 'Paneer Butter Masala', price: 340, quantity: 1, isVeg: true },
          { id: 'item-202', name: 'Dal Makhani Bukhara', price: 290, quantity: 1, isVeg: true },
          { id: 'item-301', name: 'Butter Garlic Naan', price: 75, quantity: 4, isVeg: true },
          { id: 'item-501', name: 'Gulab Jamun with Rabri', price: 180, quantity: 1, isVeg: true },
        ],
        subtotal: 1430,
        taxes: 71.5,
        total: 1501.5,
        orderStatus: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: 'CASH',
        etaMinutes: 25,
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      },
    ],
    pricingPlans: [
      {
        id: 'plan-starter',
        name: 'Starter QR',
        badge: 'Basic',
        tagline: 'Ideal for small cafes, food trucks & single-floor eateries',
        monthlyPrice: 999,
        annualPrice: 9990,
        maxTables: 15,
        maxOrdersPerMonth: 500,
        staffAccounts: 2,
        features: [
          'Up to 15 Table QR Codes',
          'Up to 500 Orders / Month (Zero Commission)',
          '2 Staff Logins (Owner + Kitchen)',
          'Interactive Digital QR Menu with Veg/Spicy Tags',
          'Direct Table Checkout & Cart System',
          'Live Kitchen Display System (KDS)',
          'Web-based Live Order Status Tracking',
          'Standard Email & In-App Ticket Support',
        ],
        popular: false,
      },
      {
        id: 'plan-growth',
        name: 'Growth Pro',
        badge: 'Most Popular',
        tagline: 'Best for bustling casual dining, bistros & fine dining restaurants',
        monthlyPrice: 2499,
        annualPrice: 24990,
        maxTables: 40,
        maxOrdersPerMonth: 'Unlimited',
        staffAccounts: 8,
        features: [
          'Up to 40 Table QR Codes',
          'Unlimited Monthly Orders (Zero Commission)',
          'Up to 8 Staff Logins (Manager/Chef/Waiter)',
          'Automated WhatsApp Alerts (Bill & Order Updates)',
          'Instant UPI Payment QR & Payment Link Generator',
          'Instant "Call Waiter / Need Help" Alerts',
          'Table Status & Turnover Tracker',
          'Daily Revenue, Tax & Sales Reports',
          'Priority WhatsApp & Call Support',
        ],
        popular: true,
      },
      {
        id: 'plan-enterprise',
        name: 'Enterprise Scale',
        badge: 'High Volume',
        tagline: 'For large multi-floor restaurants, breweries & franchise outlets',
        monthlyPrice: 4999,
        annualPrice: 49990,
        maxTables: 120,
        maxOrdersPerMonth: 'Unlimited',
        staffAccounts: 'Unlimited',
        features: [
          'Unlimited Tables & Multi-Floor Layouts',
          'Unlimited Orders & Zero Commission',
          'Unlimited Staff Logins with Role Permissions',
          'Full WhatsApp Automation + SMS Alerts',
          'Custom Logo, Banner & Color Accent Branding',
          'Customer CRM & Order Frequency Analytics',
          'Tally & POS Data Export Integration',
          'Dedicated 24/7 Priority Manager & Phone Support',
        ],
        popular: false,
      },
    ],
    platformTenants: [
      {
        id: 'tenant-001',
        name: 'The Spice Garden',
        slug: 'spice-garden',
        logo: '🌿',
        ownerName: 'Vikram Malhotra',
        ownerEmail: 'resturant1@gmail.com',
        ownerPhone: '+91 98765 43210',
        city: 'Bengaluru',
        planId: 'plan-growth',
        planName: 'Growth Pro',
        billingCycle: 'MONTHLY',
        planAmount: 2499,
        status: 'ACTIVE',
        renewalDate: '2026-11-08',
        activeTables: 24,
        monthlyOrders: 1420,
        monthlyGMV: 482500,
      },
      {
        id: 'tenant-002',
        name: 'Royal Biryani Darbar',
        slug: 'royal-biryani',
        logo: '👑',
        ownerName: 'Tariq Sheikh',
        ownerEmail: 'tariq@royalbiryani.in',
        ownerPhone: '+91 98111 22334',
        city: 'New Delhi',
        planId: 'plan-enterprise',
        planName: 'Enterprise Scale',
        billingCycle: 'ANNUAL',
        planAmount: 49990,
        status: 'ACTIVE',
        renewalDate: '2027-01-20',
        activeTables: 48,
        monthlyOrders: 2850,
        monthlyGMV: 920000,
      },
    ],
    invoices: [
      {
        id: 'INV-2026-0091',
        tenantId: 'tenant-001',
        restaurantName: 'The Spice Garden',
        planName: 'Growth Pro',
        cycle: 'Monthly (Sep 15 - Oct 14)',
        amount: 2499,
        tax: 449.82,
        total: 2948.82,
        status: 'PAID',
        issuedDate: '2026-09-15',
        dueDate: '2026-09-22',
        paymentMethod: 'Auto-Debit (UPI)',
      },
    ],
  };
};

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure requested credentials exist with bcrypt hashes
        this.ensureRequiredCredentials();
      } else {
        this.data = getInitialSeed();
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database, using seed:', err);
      this.data = getInitialSeed();
      this.save();
    }
  }

  ensureRequiredCredentials() {
    let changed = false;

    // 1. Ensure SuperAdmin progixtechnology@gmail.com / Progix@123 exists
    const hasProgix = (this.data.superAdmins || []).some(
      (sa) => sa.email.toLowerCase() === 'progixtechnology@gmail.com'
    );
    if (!hasProgix) {
      this.data.superAdmins = this.data.superAdmins || [];
      this.data.superAdmins.unshift({
        id: 'sa-progix-01',
        name: 'Progix Technology',
        email: 'progixtechnology@gmail.com',
        passwordHash: hashPassword('Progix@123'),
        role: 'PLATFORM_SUPERADMIN',
        title: 'Platform Founder & Owner',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        company: 'Progix Technology Pvt Ltd',
      });
      changed = true;
    }

    // 2. Ensure Restaurant Admin resturant1@gmail.com / 123123 exists
    const hasRest1 = (this.data.restaurantAdmins || []).some(
      (a) => a.email.toLowerCase() === 'resturant1@gmail.com'
    );
    if (!hasRest1) {
      this.data.restaurantAdmins = this.data.restaurantAdmins || [];
      this.data.restaurantAdmins.unshift({
        id: 'adm-rest-01',
        name: 'Restaurant 1 Manager',
        email: 'resturant1@gmail.com',
        passwordHash: hashPassword('123123'),
        role: 'SUPER_ADMIN',
        title: 'Head of Operations',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        restaurantId: 'rest-001',
        restaurantSlug: 'spice-garden',
      });
      changed = true;
    }

    // 3. Ensure all platformTenants have restaurantAdmin & starter menu items
    const tenants = this.data.platformTenants || [];
    this.data.restaurantAdmins = this.data.restaurantAdmins || [];
    this.data.menuItems = this.data.menuItems || [];

    tenants.forEach((t) => {
      const slug = t.slug || 'spice-garden';
      const ownerEmail = (t.ownerEmail && t.ownerEmail.includes('@')) 
        ? t.ownerEmail.trim().toLowerCase() 
        : `${slug}@restaurant.com`;
      const ownerPassword = t.ownerPassword || 'Admin@123';
      
      // Ensure Admin exists
      const hasAdmin = this.data.restaurantAdmins.some((a) => a.restaurantSlug === slug || a.email.toLowerCase() === ownerEmail);
      if (!hasAdmin) {
        this.data.restaurantAdmins.push({
          id: `adm-${slug}`,
          name: t.ownerName || t.name,
          email: ownerEmail,
          passwordHash: hashPassword(ownerPassword),
          passwordPlain: ownerPassword,
          role: 'ADMIN',
          title: 'Head of Operations',
          avatar: '',
          restaurantId: t.id,
          restaurantSlug: slug,
        });
        changed = true;
      }

      // Ensure starter menu items exist for this slug
      const hasMenuItems = this.data.menuItems.some((m) => m.restaurantSlug === slug);
      if (!hasMenuItems) {
        this.data.menuItems.push(
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
          }
        );
        changed = true;
      }
    });

    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');

      // Sync separate directory folders per tenant on disk
      const tenantsDir = path.join(__dirname, 'tenants');
      if (!fs.existsSync(tenantsDir)) {
        fs.mkdirSync(tenantsDir, { recursive: true });
      }

      const tenants = this.data.platformTenants || [];
      const allSlugs = new Set([
        'spice-garden',
        'a1',
        ...tenants.map((t) => (t.slug || '').toLowerCase().trim()).filter(Boolean),
        ...(this.data.menuItems || []).map((i) => (i.restaurantSlug || '').toLowerCase().trim()).filter(Boolean),
      ]);

      allSlugs.forEach((slug) => {
        if (!slug) return;
        const tenantFolder = path.join(tenantsDir, slug);
        if (!fs.existsSync(tenantFolder)) {
          fs.mkdirSync(tenantFolder, { recursive: true });
        }

        // 1. Write tenant's menuitems.json
        const tenantMenu = (this.data.menuItems || []).filter(
          (i) => (i.restaurantSlug || 'spice-garden').toLowerCase().trim() === slug
        );
        fs.writeFileSync(path.join(tenantFolder, 'menuitems.json'), JSON.stringify(tenantMenu, null, 2), 'utf-8');

        // 2. Write tenant's orders.json
        const tenantOrders = (this.data.orders || []).filter(
          (o) => (o.restaurantSlug || 'spice-garden').toLowerCase().trim() === slug
        );
        fs.writeFileSync(path.join(tenantFolder, 'orders.json'), JSON.stringify(tenantOrders, null, 2), 'utf-8');

        // 3. Write tenant's tables.json
        const tenantTables = (this.data.tables || []).filter(
          (t) => (t.restaurantSlug || 'spice-garden').toLowerCase().trim() === slug
        );
        fs.writeFileSync(path.join(tenantFolder, 'tables.json'), JSON.stringify(tenantTables, null, 2), 'utf-8');

        // 4. Write tenant's settings.json
        const tenantSettings = (this.data.restaurantSettings || []).filter(
          (s) => (s.slug || 'spice-garden').toLowerCase().trim() === slug
        );
        fs.writeFileSync(path.join(tenantFolder, 'settings.json'), JSON.stringify(tenantSettings, null, 2), 'utf-8');
      });
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  get(collection) {
    return this.data[collection] || [];
  }

  set(collection, items) {
    this.data[collection] = items;
    this.save();
    return items;
  }
}

export const db = new Database();
