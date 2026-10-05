import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import { listUsers, getUser, createUser, updateUser, resetPassword } from '../controllers/userController.js';

const router = Router();

router.use(requirePermission('users.manage'));

router.get('/', listUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.post('/:id/reset-password', resetPassword);

export default router;
