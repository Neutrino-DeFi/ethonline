import { Response, Request } from 'express';
import { UserAgentConfig } from '../../models/userAgentConfig.model';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/user-agent-config/{configId}:
 *   get:
 *     summary: Get a user agent config by ID
 *     tags: [User Agent Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *         description: User agent config ID
 *     responses:
 *       200:
 *         description: User agent config
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
export const getUserAgentConfigById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { configId } = req.params;
    // const currentUserId = req.user?.id;

    // if (!currentUserId) throw new ValidationError('User not authenticated');

    const cfg = await UserAgentConfig.findById(configId)
      .populate('agentId', 'name type weightage prompt')
      .populate('strategyId', 'name userId');

    if (!cfg) throw new NotFoundError('User agent config not found');

    const strategy = cfg.strategyId as any;
    // if (strategy.userId.toString() !== currentUserId) throw new ForbiddenError('Access denied');

    res.status(200).json({
      _id: cfg._id,
      votingPower: cfg.votingPower,
      customPrompt: cfg.customPrompt,
      code: cfg.code,
      agentId: {
        _id: (cfg.agentId as any)._id,
        name: (cfg.agentId as any).name,
        type: (cfg.agentId as any).type,
        weightage: (cfg.agentId as any).weightage,
        prompt: (cfg.agentId as any).prompt,
      },
      strategyId: {
        _id: strategy._id,
        name: strategy.name,
      },
      userId: cfg.userId,
      createdAt: cfg.createdAt,
      updatedAt: cfg.updatedAt,
    });
  } catch (error) {
    logger.error('Error retrieving user agent config', {
      error: error instanceof Error ? error.message : 'Unknown error',
      configId: req.params['configId'],
    });
    throw error;
  }
};


