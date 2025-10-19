import { Router } from 'express';
import { getUserByWalletId, registerUser } from '../../controllers/user';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// POST /api/v1/user/register
router.post('/register', asyncHandler(registerUser));

// GET /api/v1/user/:uniqueWalletId
router.get('/:uniqueWalletId', asyncHandler(getUserByWalletId));

export default router;
