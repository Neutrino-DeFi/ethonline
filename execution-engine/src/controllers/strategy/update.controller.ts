import { Response } from 'express';
import { Strategy } from '../../models/strategy.model';
import { UserAgentConfig } from '../../models/userAgentConfig.model';
import { Agent } from '../../models/agent.model';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/strategies/strategy/{strategyId}:
 *   put:
 *     summary: Update strategy metadata or its agent configs
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Strategy name
 *               description:
 *                 type: string
 *                 description: Strategy description
 *               risk:
 *                 type: string
 *                 enum: [High, Medium, Low]
 *                 description: Risk level of the strategy
 *               agents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - agentId
 *                     - votingPower
 *                   properties:
 *                     agentId:
 *                       type: string
 *                       description: Agent ID
 *                     votingPower:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *                       description: Voting power for this agent
 *                     customPrompt:
 *                       type: string
 *                       description: Custom prompt override
 *                     code:
 *                       type: object
 *                       description: Optional JSON code configuration
 *     responses:
 *       200:
 *         description: Strategy updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Strategy updated successfully"
 *                 strategy:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     agentConfigs:
 *                       type: array
 *                       items:
 *                         type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot update other user strategies
 *       404:
 *         description: Strategy not found
 */
export const updateStrategy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { strategyId } = req.params;
    const { name, description, agents, risk } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new ValidationError('User not authenticated');
    }

    const strategy = await Strategy.findById(strategyId);
    if (!strategy) {
      throw new NotFoundError('Strategy not found');
    }

    // Users can only update their own strategies
    if (strategy.userId.toString() !== currentUserId) {
      throw new ForbiddenError('Access denied: Cannot update other user strategies');
    }

    // Update basic fields
    if (name) strategy.name = name;
    if (description !== undefined) strategy.description = description;
    if (risk) {
      if (!['High', 'Medium', 'Low'].includes(risk)) {
        throw new ValidationError('Risk must be one of: High, Medium, Low');
      }
      strategy.risk = risk;
    }

    // Update agents if provided
    if (agents && Array.isArray(agents)) {
      // Validate agents array
      for (const agent of agents) {
        if (!agent.agentId || agent.votingPower === undefined) {
          throw new ValidationError('Each agent must have agentId and votingPower');
        }
        if (agent.votingPower < 0 || agent.votingPower > 1) {
          throw new ValidationError('Voting power must be between 0 and 1');
        }
      }

      // Verify all agents exist
      const agentIds = agents.map(a => a.agentId);
      const existingAgents = await Agent.find({ _id: { $in: agentIds } });
      if (existingAgents.length !== agentIds.length) {
        throw new ValidationError('One or more agents not found');
      }

      // Delete existing agent configs
      await UserAgentConfig.deleteMany({ strategyId: strategy._id });

      // Create new agent configs
      const agentConfigs = [];
      for (const agent of agents) {
        const userAgentConfig = new UserAgentConfig({
          userId: currentUserId,
          strategyId: strategy._id,
          agentId: agent.agentId,
          votingPower: agent.votingPower,
          customPrompt: agent.customPrompt || '',
          code: agent.code,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const savedConfig = await userAgentConfig.save();
        agentConfigs.push(savedConfig._id);
      }

      strategy.agentConfigs = agentConfigs;
    }

    strategy.updatedAt = new Date();
    const updatedStrategy = await strategy.save();

    logger.info('Strategy updated successfully', {
      strategyId,
      userId: currentUserId,
      name: updatedStrategy.name,
    });

    res.status(200).json({
      message: 'Strategy updated successfully',
      strategy: {
        _id: updatedStrategy._id,
        name: updatedStrategy.name,
        description: updatedStrategy.description,
        risk: updatedStrategy.risk,
        agentConfigs: updatedStrategy.agentConfigs,
        createdAt: updatedStrategy.createdAt,
        updatedAt: updatedStrategy.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error updating strategy', {
      error: error instanceof Error ? error.message : 'Unknown error',
      strategyId: req.params['strategyId'],
      userId: req.user?.id,
      body: req.body,
    });
    throw error;
  }
};
