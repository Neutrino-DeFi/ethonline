import { Response, Request } from 'express';
import { Strategy } from '../../models/strategy.model';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
// import { AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/strategies/strategy/{strategyId}:
 *   get:
 *     summary: Fetch single strategy with all agent configs populated
 *     tags: [Strategies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: strategyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Strategy ID
 *     responses:
 *       200:
 *         description: Strategy details with populated agent configs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 agentConfigs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       votingPower:
 *                         type: number
 *                       customPrompt:
 *                         type: string
 *                       agentId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           weightage:
 *                             type: number
 *                           prompt:
 *                             type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot access other user strategies
 *       404:
 *         description: Strategy not found
 */
export const getStrategyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { strategyId } = req.params;
    logger.info('Retrieved strategy', {
      strategyId,
      // userId: currentUserId,
    });

    // const currentUserId = req.user?.id;

    // if (!currentUserId) {
    //   throw new ValidationError('User not authenticated');
    // }

    const strategy = await Strategy.findById(strategyId)
      .populate({
        path: 'agentConfigs',
        populate: {
          path: 'agentId',
          model: 'Agent',
        },
      });

    if (!strategy) {
      throw new NotFoundError('Strategy not found');
    }

    // Users can only access their own strategies
    // if (strategy.userId.toString() !== currentUserId) {
    //   throw new ForbiddenError('Access denied: Cannot access other user strategies');
    // }

    const strategyResponse = {
      _id: strategy._id,
      name: strategy.name,
      description: strategy.description,
      agentConfigs: strategy.agentConfigs.map((config: any) => ({
        _id: config._id,
        votingPower: config.votingPower,
        customPrompt: config.customPrompt,
        agentId: {
          _id: config.agentId._id,
          name: config.agentId.name,
          type: config.agentId.type,
          weightage: config.agentId.weightage,
          prompt: config.agentId.prompt,
        },
      })),
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt,
    };

    logger.info('Retrieved strategy', {
      strategyId,
      // userId: currentUserId,
    });

    res.status(200).json(strategyResponse);
  } catch (error) {
    logger.error('Error retrieving strategy', {
      error: error instanceof Error ? error.message : 'Unknown error',
      strategyId: req.params['strategyId'],
    });
    throw error;
  }
};
