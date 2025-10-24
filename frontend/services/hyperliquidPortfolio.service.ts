// 1. Import module
import * as hl from "@nktkas/hyperliquid";

// 2. Set up client with transport
const infoClient = new hl.InfoClient({
  transport: new hl.HttpTransport({ isTestnet: true }), // or `WebSocketTransport`
});

export const getOpenOrders = async (user: string) => {
  // 3. Query data
  const openOrders = await infoClient.openOrders({
    user: user,
  });

  return openOrders;
};

export const getUserPositions = async (
  user: string = "0x056f95A573Ec524F5d188c01E50a642BfaAF34F6"
) => {
  // 4. Positions
  const positions = await infoClient.clearinghouseState({
    type: "clearinghouseState",
    user: user,
    // user: "0x056f95A573Ec524F5d188c01E50a642BfaAF34F6",
  });

  return positions;
};

export const getUserTradeHistory = async (user: string) => {
  // 4. Positions
  const tradeHistory = await infoClient.userFills({
    type: "userFills",
    user: user,
    // user: "0x056f95A573Ec524F5d188c01E50a642BfaAF34F6",
  });

  return tradeHistory;
};

export const getUserPortfolio = async (user: string) => {
  // 4. Positions
  const portfolio = await infoClient.portfolio({
    type: "portfolio",
    user: user,
  });

  return portfolio;
};
