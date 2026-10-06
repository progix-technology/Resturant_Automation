import { Router } from 'express';
import { menuController } from '../controllers/menuController.js';

const router = Router();

router.get('/', menuController.getMenu);

// Categories management
router.get('/categories', menuController.getCategories);
router.post('/categories', menuController.addCategory);
router.delete('/categories/:id', menuController.deleteCategory);

// Toggle availability
router.patch('/items/:id/toggle', menuController.toggleAvailability);
router.patch('/:id/toggle', menuController.toggleAvailability);

// Create / Add item
router.post('/items', menuController.saveMenuItem);
router.post('/', menuController.saveMenuItem);

// Update item
router.put('/items/:id', menuController.saveMenuItem);
router.put('/:id', menuController.saveMenuItem);

// Delete item & remove Cloudinary image
router.delete('/items/:id', menuController.deleteMenuItem);
router.delete('/:id', menuController.deleteMenuItem);

export default router;
