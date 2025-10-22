import { Request, Response } from "express";
import { HyperliquidClient } from "../../../clients/hyperliquid.client";
import logger from "../../../utils/logger";

/**
 * @swagger
 * /api/hyperliquid/order:
 *   post:
 *     summary: Place a limit order on Hyperliquid
 *     tags: [Hyperliquid]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - privateKey
 *               - coin
 *               - size
 *             properties:
 *               privateKey:
 *                 type: string
 *                 description: Private key of the agent wallet
 *               coin:
 *                 type: string
 *                 description: Symbol of the coin to trade (e.g., BTC)
 *               size:
 *                 type: string
 *                 description: Order size
 *               side:
 *                 type: string
 *                 enum: [buy, sell]
 *                 description: Order side (buy or sell)
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   type: object
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error
 */
export const placeOrder = async (req: Request, res: Response) => {
    try {
        const { privateKey, coin, size, side } = req.body;

        if (!privateKey || !coin || !size) {
            res.status(400).json({ error: "privateKey, coin and size are required" });
        }

        const orderResult = await HyperliquidClient.placeOrder(privateKey, coin, size, side || "buy");

        logger.info("Placed order successfully", { coin, size, side });

        res.status(201).json({
            success: true,
            order: orderResult,
        });
    } catch (error: any) {
        logger.error("Error placing order", {
            error: error.message,
            body: req.body,
        });
        res.status(500).json({ success: false, error: error.message });
    }
};
