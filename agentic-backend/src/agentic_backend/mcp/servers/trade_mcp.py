from mcp.server.fastmcp import FastMCP
import json
from datetime import datetime

mcp = FastMCP("Crypto Trade MCP Server")

# In-memory trade execution log (in production, this would be a database)
trade_log = []

def validate_crypto_symbol(symbol: str) -> bool:
    """Validate if symbol is a valid cryptocurrency."""
    valid_symbols = ["BTC", "ETH", "SOL", "ADA", "XRP", "DOGE", "USDT", "USDC", "BNB", "XLM"]
    return symbol.upper() in valid_symbols


def get_portfolio_balance(user_id: str, symbol: str) -> float:
    """Get user's balance for a specific cryptocurrency (dummy implementation)."""
    # In production, this would fetch from a database or exchange API
    # For now, returning dummy data
    dummy_balances = {
        "1": {"BTC": 2.5, "ETH": 15.0, "USDT": 30000},
        "2": {"BTC": 1.0, "ETH": 5.0, "SOL": 100, "USDT": 20000},
        "3": {"BTC": 4.0, "ETH": 20.0, "ADA": 10000, "USDT": 50000}
    }
    return dummy_balances.get(str(user_id), {}).get(symbol.upper(), 0)


def get_market_price(symbol: str) -> float:
    """Get current market price for cryptocurrency (dummy implementation)."""
    # In production, this would fetch from a price API (CoinGecko, Binance, etc.)
    dummy_prices = {
        "BTC": 43500.00,
        "ETH": 2300.00,
        "SOL": 155.00,
        "ADA": 1.35,
        "XRP": 2.50,
        "DOGE": 0.38,
        "USDT": 1.00,
        "USDC": 1.00,
        "BNB": 620.00,
        "XLM": 0.28
    }
    return dummy_prices.get(symbol.upper(), 0)


# --- Tools ---

@mcp.tool()
def buy_crypto(
    symbol: str,
    quantity: float,
    user_id: str = "1",
    limit_price: float = None
) -> dict:
    """
    Execute a buy order for cryptocurrency.

    Args:
        symbol: Cryptocurrency symbol (e.g., 'BTC', 'ETH')
        quantity: Amount of crypto to buy
        user_id: User ID executing the trade
        limit_price: Optional limit price (if None, uses market price)

    Returns:
        Trade execution result with status and details
    """
    try:
        # Validate symbol
        if not validate_crypto_symbol(symbol):
            return {
                "status": "failed",
                "error": f"Invalid cryptocurrency symbol: {symbol}",
                "valid_symbols": ["BTC", "ETH", "SOL", "ADA", "XRP", "DOGE", "USDT", "USDC", "BNB", "XLM"]
            }

        if quantity <= 0:
            return {"status": "failed", "error": "Quantity must be positive"}

        # Get market price
        market_price = get_market_price(symbol)
        execution_price = limit_price if limit_price else market_price
        total_value = quantity * execution_price

        # Create trade record
        trade_record = {
            "trade_id": f"BUY_{symbol}_{int(datetime.utcnow().timestamp())}",
            "type": "BUY",
            "symbol": symbol.upper(),
            "quantity": quantity,
            "execution_price": execution_price,
            "total_value": total_value,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "executed",
            "market_price": market_price,
            "limit_price": limit_price
        }

        trade_log.append(trade_record)

        return {
            "status": "success",
            "message": f"Buy order executed: {quantity} {symbol} at ${execution_price:.2f}",
            "trade_id": trade_record["trade_id"],
            "symbol": symbol.upper(),
            "quantity": quantity,
            "execution_price": execution_price,
            "total_value": total_value,
            "timestamp": trade_record["timestamp"],
            "portfolio_impact": {
                "asset_added": f"{quantity} {symbol}",
                "cost": f"${total_value:.2f}"
            }
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": f"Error executing buy order: {str(e)}"
        }


@mcp.tool()
def sell_crypto(
    symbol: str,
    quantity: float,
    user_id: str = "1",
    limit_price: float = None
) -> dict:
    """
    Execute a sell order for cryptocurrency.

    Args:
        symbol: Cryptocurrency symbol (e.g., 'BTC', 'ETH')
        quantity: Amount of crypto to sell
        user_id: User ID executing the trade
        limit_price: Optional limit price (if None, uses market price)

    Returns:
        Trade execution result with status and details
    """
    try:
        # Validate symbol
        if not validate_crypto_symbol(symbol):
            return {
                "status": "failed",
                "error": f"Invalid cryptocurrency symbol: {symbol}",
                "valid_symbols": ["BTC", "ETH", "SOL", "ADA", "XRP", "DOGE", "USDT", "USDC", "BNB", "XLM"]
            }

        if quantity <= 0:
            return {"status": "failed", "error": "Quantity must be positive"}

        # Check user balance
        balance = get_portfolio_balance(user_id, symbol)
        if balance < quantity:
            return {
                "status": "failed",
                "error": f"Insufficient balance. You have {balance} {symbol} but trying to sell {quantity}",
                "current_balance": balance,
                "requested_quantity": quantity
            }

        # Get market price
        market_price = get_market_price(symbol)
        execution_price = limit_price if limit_price else market_price
        total_value = quantity * execution_price

        # Create trade record
        trade_record = {
            "trade_id": f"SELL_{symbol}_{int(datetime.utcnow().timestamp())}",
            "type": "SELL",
            "symbol": symbol.upper(),
            "quantity": quantity,
            "execution_price": execution_price,
            "total_value": total_value,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "executed",
            "market_price": market_price,
            "limit_price": limit_price
        }

        trade_log.append(trade_record)

        return {
            "status": "success",
            "message": f"Sell order executed: {quantity} {symbol} at ${execution_price:.2f}",
            "trade_id": trade_record["trade_id"],
            "symbol": symbol.upper(),
            "quantity": quantity,
            "execution_price": execution_price,
            "total_value": total_value,
            "timestamp": trade_record["timestamp"],
            "portfolio_impact": {
                "asset_removed": f"{quantity} {symbol}",
                "proceeds": f"${total_value:.2f}"
            }
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": f"Error executing sell order: {str(e)}"
        }


@mcp.tool()
def get_portfolio_info(user_id: str = "1") -> dict:
    """
    Get current portfolio information for a user (dummy implementation).

    Args:
        user_id: User ID

    Returns:
        Portfolio details with holdings and estimated values
    """
    try:
        portfolio_data = {
            "1": {
                "BTC": {"amount": 2.5, "avg_buy_price": 45000},
                "ETH": {"amount": 15.0, "avg_buy_price": 3000},
                "USDT": {"amount": 30000, "avg_buy_price": 1}
            },
            "2": {
                "BTC": {"amount": 1.0, "avg_buy_price": 40000},
                "ETH": {"amount": 5.0, "avg_buy_price": 2500},
                "SOL": {"amount": 100, "avg_buy_price": 150},
                "USDT": {"amount": 20000, "avg_buy_price": 1}
            },
            "3": {
                "BTC": {"amount": 4.0, "avg_buy_price": 42000},
                "ETH": {"amount": 20.0, "avg_buy_price": 2800},
                "ADA": {"amount": 10000, "avg_buy_price": 1.2},
                "USDT": {"amount": 50000, "avg_buy_price": 1}
            }
        }

        user_portfolio = portfolio_data.get(str(user_id), {})
        total_value = 0
        holdings = {}

        for symbol, data in user_portfolio.items():
            current_price = get_market_price(symbol)
            amount = data["amount"]
            current_value = amount * current_price
            avg_buy_price = data["avg_buy_price"]
            pnl = (current_price - avg_buy_price) * amount
            pnl_percentage = ((current_price - avg_buy_price) / avg_buy_price * 100) if avg_buy_price != 0 else 0

            holdings[symbol] = {
                "amount": amount,
                "avg_buy_price": avg_buy_price,
                "current_price": current_price,
                "current_value": current_value,
                "pnl": pnl,
                "pnl_percentage": round(pnl_percentage, 2)
            }
            total_value += current_value

        return {
            "status": "success",
            "user_id": user_id,
            "total_portfolio_value": round(total_value, 2),
            "holdings": holdings,
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": f"Error fetching portfolio: {str(e)}"
        }


@mcp.tool()
def get_trade_history(user_id: str = "1", limit: int = 10) -> dict:
    """
    Get recent trade history for a user.

    Args:
        user_id: User ID
        limit: Maximum number of recent trades to return

    Returns:
        List of recent trades
    """
    try:
        user_trades = [t for t in trade_log if t["user_id"] == user_id]
        recent_trades = sorted(user_trades, key=lambda x: x["timestamp"], reverse=True)[:limit]

        return {
            "status": "success",
            "user_id": user_id,
            "total_trades": len(user_trades),
            "recent_trades": recent_trades
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": f"Error fetching trade history: {str(e)}"
        }


# --- Run MCP Server ---
if __name__ == "__main__":
    import sys
    print("[SERVER] Starting Crypto Trade MCP...", file=sys.stderr, flush=True)
    mcp.run()
