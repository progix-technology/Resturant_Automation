import { Router } from 'express';
import { superAdminController } from '../controllers/superAdminController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Multi-tenant clients
router.get('/tenants', superAdminController.getTenants);
router.post('/tenants', superAdminController.addTenant);
router.patch('/tenants/:id', superAdminController.updateTenant);
router.delete('/tenants/:id', superAdminController.deleteTenant);

// Packaging plans
router.get('/plans', superAdminController.getPlans);
router.post('/plans', superAdminController.addPlan);
router.patch('/plans/:id', superAdminController.updatePlan);

// Billing & Invoices
router.get('/invoices', superAdminController.getInvoices);
router.post('/invoices', superAdminController.addInvoice);
router.patch('/invoices/:id/pay', superAdminController.markInvoicePaid);

// Protected Platform Admins
router.get('/admins', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.getSuperAdmins);
router.delete('/admins', authenticateToken, requireRole('PLATFORM_SUPERADMIN'), superAdminController.deleteSuperAdmin);

export default router;
