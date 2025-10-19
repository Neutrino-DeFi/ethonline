import { Router } from 'express';
import {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
} from '../../controllers/agent';
import { auth, isAdmin } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: Agent management endpoints
 */

// POST /api/agents - Create a new base agent (admin only)
router.post('/', auth, isAdmin, asyncHandler(createAgent));

// GET /api/agents - List all base agents
router.get('/', asyncHandler(getAllAgents));

// GET /api/agents/:id - Get agent by ID
router.get('/:id', asyncHandler(getAgentById));

// PUT /api/agents/:id - Update agent (admin only)
router.put('/:id', auth, isAdmin, asyncHandler(updateAgent));

// DELETE /api/agents/:id - Delete agent (admin only)
router.delete('/:id', auth, isAdmin, asyncHandler(deleteAgent));

export default router;
