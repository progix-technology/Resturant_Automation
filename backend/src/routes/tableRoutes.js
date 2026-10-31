import { Router } from 'express';
import { tableController } from '../controllers/tableController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public: View floor tables
router.get('/', tableController.getTables);

// Protected: Update table status & Add table (Requires Staff/Admin Login)
router.patch('/:id/status', authenticateToken, tableController.updateTableStatus);
router.post('/', authenticateToken, tableController.addTable);

export default router;
