import { Router } from 'express';
import {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
} from '../../controllers/agent';
// import { auth, isAdmin } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: Agent management endpoints
 */

// POST /api/agents - Create a new base agent (admin only)
router.post('/', asyncHandler(createAgent));

// GET /api/agents - List all base agents
router.get('/', asyncHandler(getAllAgents));

// GET /api/agents/:id - Get agent by ID
router.get('/:id', asyncHandler(getAgentById));

// PUT /api/agents/:id - Update agent (admin only)
router.put('/:id', asyncHandler(updateAgent));

// DELETE /api/agents/:id - Delete agent (admin only)
router.delete('/:id', asyncHandler(deleteAgent));

export default router;
