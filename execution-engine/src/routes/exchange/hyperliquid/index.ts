import { Router } from 'express';
import { getAvailableBalance, placeOrder } from '../../../controllers/exchange/hyperliquid';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Hyperliquid
 *   description: Hyperliquid endpoints
 */

/**
 * @route GET /api/hyperliquid/balance/:address
 * @desc Get withdrawable balance of a user from Hyperliquid clearinghouse
 */
router.get('/balance/:address', getAvailableBalance);

/**
 * @route POST /api/hyperliquid/order
 * @desc Place a market order on Hyperliquid
 */
router.post('/order', placeOrder);

export default router;
