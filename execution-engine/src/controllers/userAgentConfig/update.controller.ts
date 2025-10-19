import { Response } from 'express';
import { UserAgentConfig } from '../../models/userAgentConfig.model';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/user-agent-config/{configId}:
 *   patch:
 *     summary: Update voting power or custom prompt of a user agent config
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               votingPower:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               customPrompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent config updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
export const updateUserAgentConfig = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { configId } = req.params;
    const { votingPower, customPrompt } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new ValidationError('User not authenticated');
    }

    if (votingPower === undefined && customPrompt === undefined) {
      throw new ValidationError('Provide votingPower or customPrompt');
    }

    if (votingPower !== undefined && (votingPower < 0 || votingPower > 1)) {
      throw new ValidationError('votingPower must be between 0 and 1');
    }

    const config = await UserAgentConfig.findById(configId).populate('strategyId', 'userId');
    if (!config) throw new NotFoundError('User agent config not found');

    const strategy = config.strategyId as any;
    if (strategy.userId.toString() !== currentUserId) {
      throw new ForbiddenError('Access denied');
    }

    if (votingPower !== undefined) config.votingPower = votingPower;
    if (customPrompt !== undefined) config.customPrompt = customPrompt;
    config.updatedAt = new Date();

    const updated = await config.save();

    logger.info('User agent config updated', { configId, userId: currentUserId });

    res.status(200).json({
      message: 'Agent config updated successfully',
      userAgentConfig: {
        _id: updated._id,
        votingPower: updated.votingPower,
        customPrompt: updated.customPrompt,
        agentId: updated.agentId,
        strategyId: updated.strategyId,
        userId: updated.userId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error updating user agent config', {
      error: error instanceof Error ? error.message : 'Unknown error',
      configId: req.params['configId'],
    });
    throw error;
  }
};


