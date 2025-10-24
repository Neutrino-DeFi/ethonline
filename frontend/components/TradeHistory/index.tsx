import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Icon from "@/components/Icon";
import { getUserTradeHistory } from "../../services/hyperliquidPortfolio.service";

type TradeHistoryItem = {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken: string;
  twapId: null | number;
};

type TradeHistoryProps = {};

const TradeHistory = ({}: TradeHistoryProps) => {
  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { authenticated, user } = usePrivy();

  useEffect(() => {
    const fetchTradeHistory = async () => {
      if (authenticated && user) {
        try {
          setLoading(true);
          // Get wallet address from Privy user
          const wallet = user.linkedAccounts?.find(
            (account) => account.type === "wallet"
          );

          if (wallet && "address" in wallet) {
            const tradeHistory = await getUserTradeHistory(wallet.address);
            // Get the last 6 trades
            const recentTrades = tradeHistory.slice(-8).reverse();
            setTrades(recentTrades);
          }
        } catch (error) {
          console.error("Error fetching trade history:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTradeHistory();
  }, [authenticated, user]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const formatHash = (hash: string): string => {
    return `${hash.slice(0, 6)}...${hash.slice(-3)}`;
  };

  const handleHashClick = (hash: string) => {
    window.open(`https://app.hyperliquid.xyz/explorer/tx/${hash}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-base-1 text-theme-secondary">
          Loading trade history...
        </div>
      </div>
    );
  }

  if (!authenticated || trades.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-base-1 text-theme-secondary">
          {!authenticated
            ? "Please connect your wallet to view trade history"
            : "No trades found"}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 -mx-6 md:-mx-4">
      <table className="w-full">
        <thead>
          <tr>
            <th className="pl-6 py-3 text-left text-caption-2m text-theme-secondary md:pl-4">
              Coin
            </th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary md:hidden">
              Close Price
            </th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary">
              Size
            </th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary md:hidden">
              Direction
            </th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary">
              PnL
            </th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary md:hidden">
              Time
            </th>
            <th className="pl-4 py-3 pr-6 text-left text-caption-2m text-theme-secondary md:pr-4">
              Tx Hash
            </th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => {
            const pnlValue = parseFloat(trade.closedPnl);
            const isProfitable = pnlValue >= 0;

            return (
              <tr className="" key={`${trade.hash}-${index}`}>
                <td className="border-t border-theme-stroke pl-6 py-3 md:pl-4">
                  <div className="text-base-1s font-semibold">{trade.coin}</div>
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 text-base-1s md:hidden">
                  ${parseFloat(trade.px).toLocaleString()}
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 text-base-1s">
                  {trade.sz}
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 md:hidden">
                  <span
                    className={`inline-flex px-2 py-1 rounded text-caption-2m ${
                      trade.dir.includes("Long")
                        ? "bg-theme-green/10 text-theme-green"
                        : "bg-theme-red/10 text-theme-red"
                    }`}
                  >
                    {trade.dir}
                  </span>
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3">
                  <div
                    className={`text-base-1s font-semibold ${
                      isProfitable ? "text-theme-green" : "text-theme-red"
                    }`}
                  >
                    {isProfitable ? "+" : ""}
                    {trade.closedPnl}
                  </div>
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 text-caption-2 text-theme-secondary md:hidden">
                  {formatTime(trade.time)}
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 pr-6 md:pr-4">
                  <button
                    onClick={() => handleHashClick(trade.hash)}
                    className="inline-flex items-center space-x-1 text-caption-2m text-theme-primary hover:text-theme-accent transition-colors"
                  >
                    <span className="font-mono">{formatHash(trade.hash)}</span>
                    <Icon className="!w-3 !h-3" name="arrow-up-right-thin" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TradeHistory;
