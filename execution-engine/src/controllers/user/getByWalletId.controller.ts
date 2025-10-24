import { Request, Response } from "express";
import { User } from "../../models/user.model";

/**
 * @swagger
 * /api/v1/user/{uniqueWalletId}:
 *   get:
 *     summary: Get user by unique wallet ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uniqueWalletId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique wallet ID (e.g., Privy DID)
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: Missing uniqueWalletId
 *       404:
 *         description: User not found
 */
export const getUserByWalletId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { uniqueWalletId } = req.params;

    if (!uniqueWalletId) {
      res.status(400).json({
        error: "uniqueWalletId parameter is required",
      });
    }

    const user = await User.findOne({ uniqueWalletId }).lean();;

    if (!user) {
      res.status(200).json({
        success: false,
        exists: false,
        message: "User not found",
      });
    }

    if (user.apiWallet?.privateKey) {
      const pk = user.apiWallet.privateKey;
      user.apiWallet.privateKey = "********";
    }

    res.status(200).json({
      success: true,
      exists: true,
      data: user,
    });
  } catch (err: any) {
    console.error("Error fetching user:", err);
    res.status(500).json({
      error: "Failed to fetch user",
      message: err.message,
    });
  }
};
