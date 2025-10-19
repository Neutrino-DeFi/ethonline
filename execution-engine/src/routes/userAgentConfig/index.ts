import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { updateUserAgentConfig, getUserAgentConfigById, deleteUserAgentConfig } from '../../controllers/userAgentConfig';

const router = Router();

// PATCH /api/user-agent-config/:configId
router.patch('/:configId', asyncHandler(updateUserAgentConfig));

// GET /api/user-agent-config/:configId
router.get('/:configId', asyncHandler(getUserAgentConfigById));

// DELETE /api/user-agent-config/:configId
router.delete('/:configId', asyncHandler(deleteUserAgentConfig));

export default router;


