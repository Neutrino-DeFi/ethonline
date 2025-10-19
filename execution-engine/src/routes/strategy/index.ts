import { Router } from 'express';
import {
  createStrategy,
  getUserStrategies,
  getStrategyById,
  updateStrategy,
  deleteStrategy,
} from '../../controllers/strategy';
import { auth } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Strategies
 *   description: Strategy management endpoints
 */

// POST /api/strategies - Create a new strategy for a user (with agent configs)
router.post('/', auth, asyncHandler(createStrategy));

// GET /api/strategies/:userId - Fetch all strategies of a user with populated agent configs
router.get('/:userId', auth, asyncHandler(getUserStrategies));

// GET /api/strategy/:strategyId - Fetch single strategy with all agent configs populated
router.get('/strategy/:strategyId', auth, asyncHandler(getStrategyById));

// PUT /api/strategy/:strategyId - Update strategy metadata or its agent configs
router.put('/strategy/:strategyId', auth, asyncHandler(updateStrategy));

// DELETE /api/strategy/:strategyId - Delete a strategy and all its linked user agent configs
router.delete('/strategy/:strategyId', auth, asyncHandler(deleteStrategy));

export default router;
