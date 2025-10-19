import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { updateUserAgentConfig, getUserAgentConfigById, deleteUserAgentConfig } from '../../controllers/userAgentConfig';

const router = Router();

// PATCH /api/user-agent-config/:configId
router.patch('/:configId', auth, asyncHandler(updateUserAgentConfig));

// GET /api/user-agent-config/:configId
router.get('/:configId', auth, asyncHandler(getUserAgentConfigById));

// DELETE /api/user-agent-config/:configId
router.delete('/:configId', auth, asyncHandler(deleteUserAgentConfig));

export default router;


