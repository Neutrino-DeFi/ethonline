import { Response } from "express";
import { UserAgentConfig } from "../../models/userAgentConfig.model";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../utils/errors";
import { AuthenticatedRequest } from "../../middleware/auth";
import logger from "../../utils/logger";

/**
 * @swagger
 * /api/user-agent-config/{configId}:
 *   delete:
 *     summary: Delete a user agent config by ID
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
 *         description: Agent config deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
export const deleteUserAgentConfig = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { configId } = req.params;
    // const currentUserId = req.user?.id;

    // if (!currentUserId) throw new ValidationError('User not authenticated');

    const cfg = await UserAgentConfig.findById(configId).populate(
      "strategyId",
      "userId"
    );
    if (!cfg) throw new NotFoundError("User agent config not found");

    const strategy = cfg.strategyId as any;
    // if (strategy.userId.toString() !== currentUserId) throw new ForbiddenError('Access denied');

    await UserAgentConfig.findByIdAndDelete(configId);

    // logger.info('User agent config deleted', { configId, userId: currentUserId });
    logger.info("User agent config deleted", { configId });
    res.status(200).json({ message: "Agent config deleted successfully" });
  } catch (error) {
    logger.error("Error deleting user agent config", {
      error: error instanceof Error ? error.message : "Unknown error",
      configId: req.params["configId"],
    });
    throw error;
  }
};
