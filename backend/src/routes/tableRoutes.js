import { Router } from 'express';
import { tableController } from '../controllers/tableController.js';

const router = Router();

router.get('/', tableController.getTables);
router.patch('/:id/status', tableController.updateTableStatus);
router.post('/', tableController.addTable);

export default router;
