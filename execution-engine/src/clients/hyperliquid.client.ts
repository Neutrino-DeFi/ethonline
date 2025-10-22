import * as hl from "@nktkas/hyperliquid";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { arbitrum } from 'viem/chains';

// Set up transport (HTTP or WS) — use testnet flag if needed
const transport = new hl.HttpTransport({ isTestnet: true });

// Info client for read-only data (balance etc.)
const infoClient = new hl.InfoClient({ transport });

export class HyperliquidClient {
    /**
     * Fetch clearingHouse info for a given address.
     * @param address The agent or account address to fetch state for.
     */
    static async clearingHouse(address: string) {
        const state = await infoClient.clearinghouseState({ user: address });
        return state;
    }

    /**
     * Place an order using the agent’s wallet.
     * @param agentPrivateKey The private key of the agent wallet.
     * @param orders An array of order objects as per Hyperliquid order spec.
     */
    /**
     * 📈 Place a limit order for a given asset
     * Mirrors your placeTestTrade example
     */
    static async placeOrder(
        privateKey: string,
        coin: string,
        size: string,
        side: "buy" | "sell" = "buy"
    ) {
        try {
            // 1️⃣ Get L2 order book for coin
            const l2Book = await infoClient.l2Book({ coin });
            const bestBid = l2Book.levels[0][0]?.px;
            const bestAsk = l2Book.levels[1][0]?.px;
            console.log(`📊 Market depth — Bid: ${bestBid}, Ask: ${bestAsk}`);

            //   if (!bestAsk) throw new Error(`Could not get ${coin} market data`);

            // 2️⃣ Compute limit price
            const limitPrice = (
                parseFloat(bestAsk) * (side === "buy" ? 0.9 : 1.1)
            ).toFixed(2);

            console.log(`📊 ${coin} best ask: ${bestAsk}`);
            console.log(`🎯 Limit price: ${limitPrice}`);
            console.log(`📦 Order size: ${size}`);

            // 3️⃣ Initialize ExchangeClient with agent wallet
            // const wallet = new ethers.Wallet(privateKey);
    //         const agentPrivateKey = generatePrivateKey();
    // const agentAccount = privateKeyToAccount(agentPrivateKey);
    // console.log(`🔐 Generated agent private key: ${agentPrivateKey}`);
    
    // // Create wallet client for the agent (for later use)
    // const agentWalletClient = createWalletClient({
    //   account: agentAccount,
    //   chain: arbitrum,
    //   transport: http()
    // });
    //         const agentExchClient = new hl.ExchangeClient({
    //             wallet: agentWalletClient,
    //             transport: transport,
    //           });
              

    //         // 4️⃣ Place limit order
    //         const orderResult = await agentExchClient.order({
    //             orders: [
    //                 {
    //                     a: 0, // asset index (0 for BTC, adjust for SOL/ETH as needed)
    //                     b: side === "buy", // buy = true, sell = false
    //                     p: side === "buy" ? bestAsk : bestBid, // reference price
    //                     s: size,
    //                     r: false, // reduce-only = false
    //                     t: { limit: { tif: "FrontendMarket" } }, // market order
    //                 },
    //             ],
    //             grouping: "na",
    //         });

            // console.log("📝 Order response:", orderResult);
            return "";
        } catch (error) {
            console.error("❌ Failed to place order:", error);
            throw error;
        }
    }
}
