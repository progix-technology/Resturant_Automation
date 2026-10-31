import { Router } from 'express';
import { menuController } from '../controllers/menuController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public: QR Menu browsing & category list
router.get('/', menuController.getMenu);
router.get('/categories', menuController.getCategories);

// Protected: Categories management (Requires Staff/Admin Login)
router.post('/categories', authenticateToken, menuController.addCategory);
router.delete('/categories/:id', authenticateToken, menuController.deleteCategory);

// Protected: Toggle dish availability
router.patch('/items/:id/toggle', authenticateToken, menuController.toggleAvailability);
router.patch('/:id/toggle', authenticateToken, menuController.toggleAvailability);

// Protected: Create / Add item
router.post('/items', authenticateToken, menuController.saveMenuItem);
router.post('/', authenticateToken, menuController.saveMenuItem);

// Protected: Update item
router.put('/items/:id', authenticateToken, menuController.saveMenuItem);
router.put('/:id', authenticateToken, menuController.saveMenuItem);

// Protected: Delete item & remove Cloudinary image
router.delete('/items/:id', authenticateToken, menuController.deleteMenuItem);
router.delete('/:id', authenticateToken, menuController.deleteMenuItem);

export default router;
