import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { apiRequest } from '../../services/apiConfig';

export const superAdminAuthService = {
  /**
   * Platform SuperAdmin Login with bcrypt verification on backend
   */
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      // Connect to Node.js backend
      const res = await apiRequest('/auth/superadmin/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (res && res.token && res.user) {
        const session = {
          ...res.user,
          token: res.token,
          loginTime: new Date().toISOString(),
        };
        storage.set(STORAGE_KEYS.SUPERADMIN_SESSION, session);
        return session;
      }
    } catch (err) {
      // If error is invalid credentials, rethrow directly
      if (err.message && err.message.includes('Incorrect password')) {
        throw new Error('Incorrect SuperAdmin password. Please check your credentials.');
      }
      if (err.message && err.message.includes('Invalid SuperAdmin email')) {
        throw new Error('Unrecognized SuperAdmin email address.');
      }

      // Offline / fallback verification for progixtechnology@gmail.com
      if (cleanEmail === 'progixtechnology@gmail.com' && password === 'Progix@123') {
        const session = {
          id: 'sa-progix-01',
          name: 'Progix Technology',
          email: 'progixtechnology@gmail.com',
          role: 'PLATFORM_SUPERADMIN',
          title: 'Platform Founder & Owner',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          company: 'Progix Technology Pvt Ltd',
          loginTime: new Date().toISOString(),
        };
        storage.set(STORAGE_KEYS.SUPERADMIN_SESSION, session);
        return session;
      }

      throw err;
    }
  },

  logout() {
    storage.remove(STORAGE_KEYS.SUPERADMIN_SESSION);
  },

  getCurrentSession() {
    return storage.get(STORAGE_KEYS.SUPERADMIN_SESSION, null);
  },

  isAuthenticated() {
    const session = this.getCurrentSession();
    return Boolean(session && session.id && session.role === 'PLATFORM_SUPERADMIN');
  },

  getDemoCredentials() {
    return {
      name: 'Progix Technology (Owner)',
      email: 'progixtechnology@gmail.com',
      password: 'Progix@123',
      role: 'PLATFORM_SUPERADMIN',
      company: 'Progix Technology Pvt Ltd',
    };
  },
};
