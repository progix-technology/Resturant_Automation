import { Router } from 'express';
import { superAdminController } from '../controllers/superAdminController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Multi-tenant clients (Protected - SuperAdmin only)
router.get('/tenants', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.getTenants);
router.post('/tenants', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.addTenant);
router.patch('/tenants/:id', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.updateTenant);
router.delete('/tenants/:id', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.deleteTenant);

// Packaging plans (Protected - Plans management)
router.get('/plans', authenticateToken, superAdminController.getPlans);
router.post('/plans', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.addPlan);
router.patch('/plans/:id', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.updatePlan);

// Billing & Invoices (Protected - SuperAdmin only)
router.get('/invoices', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.getInvoices);
router.post('/invoices', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.addInvoice);
router.patch('/invoices/:id/pay', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.markInvoicePaid);

// Platform Settings & Payment receiving config (Bank & UPI QR - Protected)
router.get('/settings', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.getSettings);
router.patch('/settings', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.updateSettings);

// Protected Platform Admins
router.get('/admins', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.getSuperAdmins);
router.delete('/admins', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.deleteSuperAdmin);

export default router;
