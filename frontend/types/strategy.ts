export type RiskLevel = "low" | "medium" | "high";
export type VisibilityType = "public" | "private";
export type StrategyStatus = "active" | "inactive" | "paused";

export type CodeLanguage = "pinescript" | "python";

export type BacktestResult = {
    totalReturn: number;
    totalReturnPercentage: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    equityCurve: { timestamp: string; value: number }[];
};

export type TechnicalStrategy = {
    id: string;
    name: string;
    description: string;
    isCustom?: boolean;
    customPrompt?: string;
    generatedCode?: {
        pinescript?: string;
        python?: string;
    };
    backtestConfig?: {
        tokenPair: string;
        timeframe: string;
        startDate: string;
        endDate: string;
    };
    backtestResults?: BacktestResult;
};

export const TECHNICAL_STRATEGIES: TechnicalStrategy[] = [
    {
        id: "double-ema",
        name: "Double EMA Crossover",
        description: "Uses two exponential moving averages (fast and slow) to identify trend changes and generate buy/sell signals",
        generatedCode: {
            pinescript: `//@version=5
strategy("Double EMA Crossover", overlay=true)

// Input parameters
fastLength = input.int(12, "Fast EMA Length", minval=1)
slowLength = input.int(26, "Slow EMA Length", minval=1)

// Calculate EMAs
fastEMA = ta.ema(close, fastLength)
slowEMA = ta.ema(close, slowLength)

// Entry conditions
longCondition = ta.crossover(fastEMA, slowEMA)
shortCondition = ta.crossunder(fastEMA, slowEMA)

// Execute trades
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.close("Long")

// Plot indicators
plot(fastEMA, color=color.new(color.blue, 0), title="Fast EMA", linewidth=2)
plot(slowEMA, color=color.new(color.red, 0), title="Slow EMA", linewidth=2)

// Plot signals
plotshape(longCondition, title="Buy Signal", location=location.belowbar, color=color.green, style=shape.triangleup, size=size.small)
plotshape(shortCondition, title="Sell Signal", location=location.abovebar, color=color.red, style=shape.triangledown, size=size.small)`,
            python: `import pandas as pd
import numpy as np
from backtesting import Strategy, Backtest

class DoubleEMACrossover(Strategy):
    fast_period = 12
    slow_period = 26

    def init(self):
        close = self.data.Close
        self.fast_ema = self.I(lambda x: pd.Series(x).ewm(span=self.fast_period, adjust=False).mean(), close)
        self.slow_ema = self.I(lambda x: pd.Series(x).ewm(span=self.slow_period, adjust=False).mean(), close)

    def next(self):
        # Buy signal: Fast EMA crosses above Slow EMA
        if self.fast_ema[-1] > self.slow_ema[-1] and self.fast_ema[-2] <= self.slow_ema[-2]:
            if not self.position:
                self.buy()

        # Sell signal: Fast EMA crosses below Slow EMA
        elif self.fast_ema[-1] < self.slow_ema[-1] and self.fast_ema[-2] >= self.slow_ema[-2]:
            if self.position:
                self.position.close()

# Example usage:
# bt = Backtest(data, DoubleEMACrossover, cash=10000, commission=.002)
# stats = bt.run()
# print(stats)`,
        },
    },
    {
        id: "stochastic",
        name: "Stochastic Crossover",
        description: "Identifies overbought and oversold conditions using stochastic oscillator momentum indicators",
        generatedCode: {
            pinescript: `//@version=5
strategy("Stochastic Crossover", overlay=false)

// Input parameters
length = input.int(14, "Stochastic Length", minval=1)
smoothK = input.int(3, "Smooth K", minval=1)
smoothD = input.int(3, "Smooth D", minval=1)
overbought = input.int(80, "Overbought Level", minval=50, maxval=100)
oversold = input.int(20, "Oversold Level", minval=0, maxval=50)

// Calculate Stochastic
k = ta.sma(ta.stoch(close, high, low, length), smoothK)
d = ta.sma(k, smoothD)

// Entry conditions
longCondition = ta.crossover(k, d) and k < oversold
shortCondition = ta.crossunder(k, d) and k > overbought

// Execute trades
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.close("Long")

// Plot indicators
plot(k, color=color.blue, title="%K", linewidth=2)
plot(d, color=color.red, title="%D", linewidth=2)
hline(overbought, "Overbought", color=color.red, linestyle=hline.style_dashed)
hline(oversold, "Oversold", color=color.green, linestyle=hline.style_dashed)`,
            python: `import pandas as pd
import numpy as np
from backtesting import Strategy, Backtest

class StochasticCrossover(Strategy):
    stoch_length = 14
    smooth_k = 3
    smooth_d = 3
    overbought = 80
    oversold = 20

    def init(self):
        def stochastic(high, low, close, period, smooth_k, smooth_d):
            lowest_low = pd.Series(low).rolling(window=period).min()
            highest_high = pd.Series(high).rolling(window=period).max()
            k = 100 * (close - lowest_low) / (highest_high - lowest_low)
            k_smooth = k.rolling(window=smooth_k).mean()
            d_smooth = k_smooth.rolling(window=smooth_d).mean()
            return k_smooth, d_smooth

        self.k, self.d = self.I(
            stochastic,
            self.data.High,
            self.data.Low,
            self.data.Close,
            self.stoch_length,
            self.smooth_k,
            self.smooth_d
        )

    def next(self):
        # Buy: K crosses above D in oversold region
        if self.k[-1] > self.d[-1] and self.k[-2] <= self.d[-2] and self.k[-1] < self.oversold:
            if not self.position:
                self.buy()

        # Sell: K crosses below D in overbought region
        elif self.k[-1] < self.d[-1] and self.k[-2] >= self.d[-2] and self.k[-1] > self.overbought:
            if self.position:
                self.position.close()`,
        },
    },
    {
        id: "rsi-divergence",
        name: "RSI Divergence",
        description: "Detects potential reversals by analyzing divergences between price and RSI indicator",
        generatedCode: {
            pinescript: `//@version=5
strategy("RSI Divergence", overlay=true)

// Input parameters
rsiLength = input.int(14, "RSI Length", minval=1)
overbought = input.int(70, "Overbought Level", minval=50)
oversold = input.int(30, "Oversold Level", minval=0, maxval=50)
lookback = input.int(5, "Divergence Lookback", minval=3)

// Calculate RSI
rsi = ta.rsi(close, rsiLength)

// Detect divergence
var float lastLowPrice = na
var float lastLowRSI = na
var float lastHighPrice = na
var float lastHighRSI = na

// Bullish divergence: Price makes lower low, RSI makes higher low
bullishDiv = false
if ta.pivotlow(close, lookback, lookback)
    currLowPrice = ta.lowest(close, lookback)
    currLowRSI = ta.lowest(rsi, lookback)
    if not na(lastLowPrice) and currLowPrice < lastLowPrice and currLowRSI > lastLowRSI
        bullishDiv := true
    lastLowPrice := currLowPrice
    lastLowRSI := currLowRSI

// Bearish divergence: Price makes higher high, RSI makes lower high
bearishDiv = false
if ta.pivothigh(close, lookback, lookback)
    currHighPrice = ta.highest(close, lookback)
    currHighRSI = ta.highest(rsi, lookback)
    if not na(lastHighPrice) and currHighPrice > lastHighPrice and currHighRSI < lastHighRSI
        bearishDiv := true
    lastHighPrice := currHighPrice
    lastHighRSI := currHighRSI

// Execute trades
if (bullishDiv and rsi < oversold)
    strategy.entry("Long", strategy.long)
if (bearishDiv and rsi > overbought)
    strategy.close("Long")

// Plot signals
plotshape(bullishDiv, title="Bullish Divergence", location=location.belowbar, color=color.green, style=shape.triangleup, size=size.small)
plotshape(bearishDiv, title="Bearish Divergence", location=location.abovebar, color=color.red, style=shape.triangledown, size=size.small)`,
            python: `import pandas as pd
import numpy as np
from backtesting import Strategy, Backtest

class RSIDivergence(Strategy):
    rsi_period = 14
    overbought = 70
    oversold = 30
    lookback = 5

    def init(self):
        def rsi(close, period):
            delta = pd.Series(close).diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            rs = gain / loss
            return 100 - (100 / (1 + rs))

        self.rsi = self.I(rsi, self.data.Close, self.rsi_period)
        self.last_low_price = None
        self.last_low_rsi = None
        self.last_high_price = None
        self.last_high_rsi = None

    def next(self):
        if len(self.data) < self.lookback * 2:
            return

        close_slice = self.data.Close[-self.lookback*2:]
        rsi_slice = self.rsi[-self.lookback*2:]

        # Detect bullish divergence (price lower low, RSI higher low)
        curr_low_idx = np.argmin(close_slice)
        if curr_low_idx < self.lookback:
            curr_low_price = close_slice[curr_low_idx]
            curr_low_rsi = rsi_slice[curr_low_idx]

            if self.last_low_price and curr_low_price < self.last_low_price and curr_low_rsi > self.last_low_rsi:
                if self.rsi[-1] < self.oversold and not self.position:
                    self.buy()

            self.last_low_price = curr_low_price
            self.last_low_rsi = curr_low_rsi

        # Detect bearish divergence (price higher high, RSI lower high)
        curr_high_idx = np.argmax(close_slice)
        if curr_high_idx < self.lookback:
            curr_high_price = close_slice[curr_high_idx]
            curr_high_rsi = rsi_slice[curr_high_idx]

            if self.last_high_price and curr_high_price > self.last_high_price and curr_high_rsi < self.last_high_rsi:
                if self.rsi[-1] > self.overbought and self.position:
                    self.position.close()

            self.last_high_price = curr_high_price
            self.last_high_rsi = curr_high_rsi`,
        },
    },
    {
        id: "macd-signal",
        name: "MACD Signal",
        description: "Generates trading signals based on MACD line crossing over signal line",
        generatedCode: {
            pinescript: `//@version=5
strategy("MACD Signal", overlay=false)

// Input parameters
fastLength = input.int(12, "Fast EMA Length", minval=1)
slowLength = input.int(26, "Slow EMA Length", minval=1)
signalLength = input.int(9, "Signal Length", minval=1)

// Calculate MACD
[macdLine, signalLine, histLine] = ta.macd(close, fastLength, slowLength, signalLength)

// Entry conditions
longCondition = ta.crossover(macdLine, signalLine)
shortCondition = ta.crossunder(macdLine, signalLine)

// Execute trades
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.close("Long")

// Plot indicators
plot(macdLine, color=color.blue, title="MACD", linewidth=2)
plot(signalLine, color=color.red, title="Signal", linewidth=2)
plot(histLine, color=color.gray, title="Histogram", style=plot.style_histogram)
hline(0, "Zero Line", color=color.gray, linestyle=hline.style_dashed)`,
            python: `import pandas as pd
import numpy as np
from backtesting import Strategy, Backtest

class MACDSignal(Strategy):
    fast_period = 12
    slow_period = 26
    signal_period = 9

    def init(self):
        def macd(close, fast, slow, signal):
            fast_ema = pd.Series(close).ewm(span=fast, adjust=False).mean()
            slow_ema = pd.Series(close).ewm(span=slow, adjust=False).mean()
            macd_line = fast_ema - slow_ema
            signal_line = macd_line.ewm(span=signal, adjust=False).mean()
            histogram = macd_line - signal_line
            return macd_line, signal_line, histogram

        self.macd_line, self.signal_line, self.histogram = self.I(
            macd,
            self.data.Close,
            self.fast_period,
            self.slow_period,
            self.signal_period
        )

    def next(self):
        # Buy signal: MACD crosses above signal line
        if self.macd_line[-1] > self.signal_line[-1] and self.macd_line[-2] <= self.signal_line[-2]:
            if not self.position:
                self.buy()

        # Sell signal: MACD crosses below signal line
        elif self.macd_line[-1] < self.signal_line[-1] and self.macd_line[-2] >= self.signal_line[-2]:
            if self.position:
                self.position.close()`,
        },
    },
];

export type AgenticConfig = {
    weightage: number;
    prompt: string;
};

export type Position = {
    id: string;
    asset: string;
    type: "long" | "short";
    entryPrice: number;
    currentPrice: number;
    amount: number;
    pnl: number;
    pnlPercentage: number;
    openedAt: Date;
    closedAt?: Date;
};

export type AgenticDecision = {
    id: string;
    timestamp: Date;
    decision: string;
    reasoning: string;
    outcome: "positive" | "negative" | "neutral";
    impactPnl: number;
};

export type Strategy = {
    id: string;
    name: string;
    description: string;
    agenticConfig: AgenticConfig;
    technicalStrategies: TechnicalStrategy[];
    riskLevel: RiskLevel;
    visibility: VisibilityType;
    depositAmount: number;
    status: StrategyStatus;
    createdAt: Date;
    // Performance metrics
    totalPnl: number;
    totalPnlPercentage: number;
    accuracy: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    // Positions
    openPositions: Position[];
    closedPositions: Position[];
    // Agentic decisions
    agenticDecisions: AgenticDecision[];
};
