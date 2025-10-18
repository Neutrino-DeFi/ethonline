"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import {
    Strategy,
    TECHNICAL_STRATEGIES,
    TechnicalStrategy,
    RiskLevel,
    CodeLanguage,
    BacktestResult,
} from "@/types/strategy";

type AIConfigurationPageProps = {
    strategyId: string;
};

const POPULAR_PAIRS = [
    "BTC/USDC",
    "ETH/USDC",
    "SOL/USDC",
    "AVAX/USDC",
    "MATIC/USDC",
    "LINK/USDC",
];

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

const AIConfigurationPage = ({ strategyId }: AIConfigurationPageProps) => {
    const router = useRouter();
    const [strategy, setStrategy] = useState<Strategy | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [agenticPrompt, setAgenticPrompt] = useState("");
    const [agenticWeightage, setAgenticWeightage] = useState(50);
    const [riskLevel, setRiskLevel] = useState<RiskLevel>("medium");
    const [selectedTechnicalStrategies, setSelectedTechnicalStrategies] = useState<
        TechnicalStrategy[]
    >([]);
    const [visibility, setVisibility] = useState<"public" | "private">("private");
    const [depositAmount, setDepositAmount] = useState("");
    const [showDepositModal, setShowDepositModal] = useState(false);

    // Custom strategy state
    const [showCustomStrategyModal, setShowCustomStrategyModal] = useState(false);
    const [customStrategyName, setCustomStrategyName] = useState("");
    const [customStrategyDescription, setCustomStrategyDescription] = useState("");
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [generatedPineScript, setGeneratedPineScript] = useState("");
    const [generatedPython, setGeneratedPython] = useState("");
    const [selectedCodeLanguage, setSelectedCodeLanguage] = useState<CodeLanguage>("pinescript");
    const [isEditingCode, setIsEditingCode] = useState(false);

    // Edit existing strategy state
    const [showEditStrategyModal, setShowEditStrategyModal] = useState(false);
    const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);

    // Backtesting state
    const [showBacktestModal, setShowBacktestModal] = useState(false);
    const [backtestStrategyId, setBacktestStrategyId] = useState<string | null>(null);
    const [backtestTokenPair, setBacktestTokenPair] = useState("BTC/USDC");
    const [backtestTimeframe, setBacktestTimeframe] = useState("1h");
    const [backtestStartDate, setBacktestStartDate] = useState("2024-01-01");
    const [backtestEndDate, setBacktestEndDate] = useState("2024-12-31");
    const [isBacktesting, setIsBacktesting] = useState(false);
    const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);

    useEffect(() => {
        // Load strategy from localStorage
        const savedStrategies = localStorage.getItem("user_strategies");
        if (savedStrategies) {
            try {
                const strategies: Strategy[] = JSON.parse(savedStrategies);
                const found = strategies.find((s) => s.id === strategyId);
                if (found) {
                    setStrategy(found);
                    setAgenticPrompt(found.agenticConfig.prompt);
                    setAgenticWeightage(found.agenticConfig.weightage);
                    setRiskLevel(found.riskLevel);
                    setSelectedTechnicalStrategies(found.technicalStrategies);
                    setVisibility(found.visibility);
                } else {
                    router.push("/strategies");
                }
            } catch (error) {
                console.error("Failed to parse strategies:", error);
                router.push("/strategies");
            }
        } else {
            router.push("/strategies");
        }
    }, [strategyId, router]);

    const handleSave = () => {
        if (!strategy) return;
        setIsSaving(true);

        const updatedStrategy: Strategy = {
            ...strategy,
            agenticConfig: {
                weightage: agenticWeightage,
                prompt: agenticPrompt,
            },
            technicalStrategies: selectedTechnicalStrategies,
            riskLevel,
            visibility,
        };

        const savedStrategies = localStorage.getItem("user_strategies");
        if (savedStrategies) {
            const strategies: Strategy[] = JSON.parse(savedStrategies);
            const index = strategies.findIndex((s) => s.id === strategyId);
            if (index !== -1) {
                strategies[index] = updatedStrategy;
                localStorage.setItem("user_strategies", JSON.stringify(strategies));
                setStrategy(updatedStrategy);
            }
        }

        setTimeout(() => {
            setIsSaving(false);
            setIsEditing(false);
        }, 500);
    };

    const handleCancel = () => {
        if (!strategy) return;
        setAgenticPrompt(strategy.agenticConfig.prompt);
        setAgenticWeightage(strategy.agenticConfig.weightage);
        setRiskLevel(strategy.riskLevel);
        setSelectedTechnicalStrategies(strategy.technicalStrategies);
        setVisibility(strategy.visibility);
        setIsEditing(false);
    };

    const handleToggleTechnicalStrategy = (tech: TechnicalStrategy) => {
        setSelectedTechnicalStrategies((prev) => {
            const exists = prev.find((t) => t.id === tech.id);
            if (exists) {
                return prev.filter((t) => t.id !== tech.id);
            } else {
                return [...prev, tech];
            }
        });
    };

    const handleGenerateCode = async () => {
        setIsGeneratingCode(true);

        // Simulate code generation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const pineScript = `// ${customStrategyName}
// ${customStrategyDescription}

//@version=5
strategy("${customStrategyName}", overlay=true)

// Strategy parameters
fastLength = input.int(12, "Fast EMA Length")
slowLength = input.int(26, "Slow EMA Length")

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
    strategy.entry("Short", strategy.short)

// Plot indicators
plot(fastEMA, color=color.blue, title="Fast EMA")
plot(slowEMA, color=color.red, title="Slow EMA")`;

        const pythonCode = `# ${customStrategyName}
# ${customStrategyDescription}

import pandas as pd
import numpy as np
from backtesting import Strategy, Backtest

class ${customStrategyName.replace(/\s+/g, "")}(Strategy):
    fast_period = 12
    slow_period = 26

    def init(self):
        close = self.data.Close
        self.fast_ema = self.I(lambda x: pd.Series(x).ewm(span=self.fast_period).mean(), close)
        self.slow_ema = self.I(lambda x: pd.Series(x).ewm(span=self.slow_period).mean(), close)

    def next(self):
        if self.fast_ema[-1] > self.slow_ema[-1] and self.fast_ema[-2] <= self.slow_ema[-2]:
            if not self.position:
                self.buy()
        elif self.fast_ema[-1] < self.slow_ema[-1] and self.fast_ema[-2] >= self.slow_ema[-2]:
            if self.position:
                self.position.close()`;

        setGeneratedPineScript(pineScript);
        setGeneratedPython(pythonCode);
        setIsGeneratingCode(false);
    };

    const handleAddCustomStrategy = () => {
        if (!customStrategyName || !customStrategyDescription) return;

        const newStrategy: TechnicalStrategy = {
            id: `custom-${Date.now()}`,
            name: customStrategyName,
            description: customStrategyDescription,
            isCustom: true,
            customPrompt: customStrategyDescription,
            generatedCode: {
                pinescript: generatedPineScript,
                python: generatedPython,
            },
        };

        setSelectedTechnicalStrategies((prev) => [...prev, newStrategy]);
        setCustomStrategyName("");
        setCustomStrategyDescription("");
        setGeneratedPineScript("");
        setGeneratedPython("");
        setShowCustomStrategyModal(false);
    };

    const handleRunBacktest = async () => {
        setIsBacktesting(true);

        // Simulate backtesting
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Generate mock backtest results
        const mockResults: BacktestResult = {
            totalReturn: 15234.56,
            totalReturnPercentage: 15.23,
            sharpeRatio: 1.85,
            maxDrawdown: -8.5,
            winRate: 62.5,
            totalTrades: 248,
            avgWin: 125.5,
            avgLoss: -87.3,
            profitFactor: 1.92,
            equityCurve: Array.from({ length: 30 }, (_, i) => ({
                timestamp: `2024-${String(i + 1).padStart(2, "0")}-01`,
                value: 100000 + Math.random() * 20000 - 5000 + i * 500,
            })),
        };

        setBacktestResults(mockResults);

        // Update the strategy with backtest results
        if (backtestStrategyId) {
            setSelectedTechnicalStrategies((prev) =>
                prev.map((tech) =>
                    tech.id === backtestStrategyId
                        ? {
                              ...tech,
                              backtestConfig: {
                                  tokenPair: backtestTokenPair,
                                  timeframe: backtestTimeframe,
                                  startDate: backtestStartDate,
                                  endDate: backtestEndDate,
                              },
                              backtestResults: mockResults,
                          }
                        : tech
                )
            );
        }

        setIsBacktesting(false);
    };

    const handleDepositFunds = () => {
        if (!strategy || !depositAmount || parseFloat(depositAmount) <= 0) return;

        const additionalDeposit = parseFloat(depositAmount);
        const updatedStrategy: Strategy = {
            ...strategy,
            depositAmount: strategy.depositAmount + additionalDeposit,
        };

        const savedStrategies = localStorage.getItem("user_strategies");
        if (savedStrategies) {
            const strategies: Strategy[] = JSON.parse(savedStrategies);
            const index = strategies.findIndex((s) => s.id === strategyId);
            if (index !== -1) {
                strategies[index] = updatedStrategy;
                localStorage.setItem("user_strategies", JSON.stringify(strategies));
                setStrategy(updatedStrategy);
            }
        }

        setDepositAmount("");
        setShowDepositModal(false);
    };

    const handlePublishToggle = () => {
        if (!strategy) return;

        const newVisibility = visibility === "public" ? "private" : "public";
        setVisibility(newVisibility);

        const updatedStrategy: Strategy = {
            ...strategy,
            visibility: newVisibility,
        };

        const savedStrategies = localStorage.getItem("user_strategies");
        if (savedStrategies) {
            const strategies: Strategy[] = JSON.parse(savedStrategies);
            const index = strategies.findIndex((s) => s.id === strategyId);
            if (index !== -1) {
                strategies[index] = updatedStrategy;
                localStorage.setItem("user_strategies", JSON.stringify(strategies));
                setStrategy(updatedStrategy);
            }
        }
    };

    const openBacktestModal = (techId: string) => {
        setBacktestStrategyId(techId);
        const tech = selectedTechnicalStrategies.find((t) => t.id === techId);
        if (tech?.backtestConfig) {
            setBacktestTokenPair(tech.backtestConfig.tokenPair);
            setBacktestTimeframe(tech.backtestConfig.timeframe);
            setBacktestStartDate(tech.backtestConfig.startDate);
            setBacktestEndDate(tech.backtestConfig.endDate);
        }
        if (tech?.backtestResults) {
            setBacktestResults(tech.backtestResults);
        } else {
            setBacktestResults(null);
        }
        setShowBacktestModal(true);
    };

    const handleRemoveStrategy = (techId: string) => {
        setSelectedTechnicalStrategies((prev) => prev.filter((t) => t.id !== techId));
    };

    const openEditStrategyModal = (techId: string) => {
        const tech = selectedTechnicalStrategies.find((t) => t.id === techId);
        if (tech) {
            setEditingStrategyId(techId);
            setCustomStrategyName(tech.name);
            setCustomStrategyDescription(tech.description);
            setGeneratedPineScript(tech.generatedCode?.pinescript || "");
            setGeneratedPython(tech.generatedCode?.python || "");
            setIsEditingCode(false);
            setShowEditStrategyModal(true);
        }
    };

    const handleUpdateStrategy = () => {
        if (!editingStrategyId || !customStrategyName || !customStrategyDescription) return;

        setSelectedTechnicalStrategies((prev) =>
            prev.map((tech) =>
                tech.id === editingStrategyId
                    ? {
                          ...tech,
                          name: customStrategyName,
                          description: customStrategyDescription,
                          generatedCode: {
                              pinescript: generatedPineScript,
                              python: generatedPython,
                          },
                      }
                    : tech
            )
        );

        setCustomStrategyName("");
        setCustomStrategyDescription("");
        setGeneratedPineScript("");
        setGeneratedPython("");
        setEditingStrategyId(null);
        setShowEditStrategyModal(false);
    };

    if (!strategy) {
        return (
            <Layout title="Loading...">
                <div className="flex items-center justify-center h-96">
                    <div className="text-theme-secondary">Loading configuration...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="AI Configuration">
            <div className="space-y-6">
                {/* Header */}
                <Card>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <button
                                    onClick={() => router.push(`/strategies/${strategyId}`)}
                                    className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-theme-on-surface-2 transition-colors"
                                >
                                    <Icon
                                        className="w-5 h-5 fill-theme-secondary"
                                        name="arrow-prev"
                                    />
                                </button>
                                <div>
                                    <h1 className="text-h4 text-theme-primary">
                                        Configure AI Agent
                                    </h1>
                                    <p className="text-base-2 text-theme-secondary">
                                        {strategy.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors"
                                >
                                    Edit Configuration
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        className="px-6 py-3 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                {/* AI Prompt Configuration */}
                <Card title="Sentiment Agent Prompt">
                    <div className="space-y-4">
                        <p className="text-base-2 text-theme-secondary">
                            Customize the AI agent's decision-making instructions and market analysis
                            behavior.
                        </p>
                        {isEditing ? (
                            <textarea
                                value={agenticPrompt}
                                onChange={(e) => setAgenticPrompt(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                placeholder="Enter custom instructions for the AI agent..."
                            />
                        ) : (
                            <div className="p-4 bg-theme-on-surface-1 border border-theme-stroke rounded-xl">
                                <p className="text-base-2 text-theme-primary whitespace-pre-wrap">
                                    {agenticPrompt || "No custom prompt configured"}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Weightage Configuration */}
                <Card title="Strategy Weightage Distribution">
                    <div className="space-y-4">
                        <p className="text-base-2 text-theme-secondary">
                            Adjust the influence balance between AI agent decisions and technical
                            indicator signals.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-base-2 text-theme-primary">
                                    Sentiment: {agenticWeightage}%
                                </span>
                                <span className="text-base-2 text-theme-primary">
                                    Technical: {100 - agenticWeightage}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={agenticWeightage}
                                onChange={(e) => setAgenticWeightage(parseInt(e.target.value))}
                                disabled={!isEditing}
                                className="w-full h-2 bg-theme-on-surface-1 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                                style={{
                                    background: isEditing
                                        ? `linear-gradient(to right, #6C5DD3 0%, #6C5DD3 ${agenticWeightage}%, #E6E8EC ${agenticWeightage}%, #E6E8EC 100%)`
                                        : undefined,
                                }}
                            />
                            <div className="flex items-center justify-between text-caption-2 text-theme-tertiary">
                                <span>More Technical</span>
                                <span>More AI-Driven</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Risk Level */}
                <Card title="Risk Management">
                    <div className="space-y-4">
                        <p className="text-base-2 text-theme-secondary">
                            Define risk tolerance and position sizing parameters for this strategy.
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            {(["low", "medium", "high"] as RiskLevel[]).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => isEditing && setRiskLevel(level)}
                                    disabled={!isEditing}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        riskLevel === level
                                            ? "border-primary-1 bg-primary-1/10"
                                            : "border-theme-stroke hover:border-theme-stroke-hover"
                                    } ${!isEditing ? "cursor-not-allowed opacity-70" : ""}`}
                                >
                                    <div className="text-h6 text-theme-primary capitalize mb-1">
                                        {level}
                                    </div>
                                    <div className="text-caption-2 text-theme-secondary">
                                        {level === "low" &&
                                            "Conservative: 1-2% per trade"}
                                        {level === "medium" && "Balanced: 2-5% per trade"}
                                        {level === "high" &&
                                            "Aggressive: 5-10% per trade"}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Technical Strategies */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-h6 text-theme-primary mb-1">
                                Technical Strategies
                            </h3>
                            <p className="text-caption-1 text-theme-secondary">
                                Select predefined strategies or create custom ones
                            </p>
                        </div>
                        {isEditing && (
                            <button
                                onClick={() => setShowCustomStrategyModal(true)}
                                className="px-4 py-2 bg-primary-1 hover:bg-primary-2 text-white rounded-lg transition-colors text-caption-1 flex items-center gap-2"
                            >
                                <Icon className="w-4 h-4 fill-white" name="plus" />
                                Create Custom
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Predefined Strategies */}
                        <div>
                            <h4 className="text-base-2s text-theme-primary mb-3">
                                Predefined Strategies
                            </h4>
                            <div className="space-y-3">
                                {TECHNICAL_STRATEGIES.map((tech) => {
                                    const isSelected = selectedTechnicalStrategies.some(
                                        (t) => t.id === tech.id
                                    );
                                    const selectedStrategy = selectedTechnicalStrategies.find(
                                        (t) => t.id === tech.id
                                    );
                                    return (
                                        <div
                                            key={tech.id}
                                            className={`p-4 rounded-xl border transition-colors ${
                                                isSelected
                                                    ? "border-primary-1 bg-primary-1/5"
                                                    : "border-theme-stroke"
                                            } ${!isEditing ? "opacity-70" : ""}`}
                                        >
                                            <label className="flex items-start gap-3 cursor-pointer mb-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() =>
                                                        isEditing &&
                                                        handleToggleTechnicalStrategy(tech)
                                                    }
                                                    disabled={!isEditing}
                                                    className="mt-1 w-5 h-5 accent-primary-1 rounded"
                                                />
                                                <div className="flex-1">
                                                    <div className="text-base-2s text-theme-primary mb-1">
                                                        {tech.name}
                                                    </div>
                                                    <div className="text-caption-2 text-theme-secondary">
                                                        {tech.description}
                                                    </div>
                                                </div>
                                            </label>

                                            {isSelected && selectedStrategy && (
                                                <div className="ml-8 space-y-3 border-t border-theme-stroke pt-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-caption-2 text-theme-tertiary">
                                                            Generated Code
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                openEditStrategyModal(tech.id)
                                                            }
                                                            className="text-caption-2 text-primary-1 hover:text-primary-2 flex items-center gap-1"
                                                        >
                                                            <Icon
                                                                className="w-3 h-3 fill-primary-1"
                                                                name="edit"
                                                            />
                                                            View/Edit Code
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {selectedStrategy.generatedCode?.pinescript && (
                                                            <span className="px-2 py-1 bg-theme-on-surface-1 rounded text-caption-2 text-theme-primary">
                                                                Pine Script
                                                            </span>
                                                        )}
                                                        {selectedStrategy.generatedCode?.python && (
                                                            <span className="px-2 py-1 bg-theme-on-surface-1 rounded text-caption-2 text-theme-primary">
                                                                Python
                                                            </span>
                                                        )}
                                                    </div>

                                                    {selectedStrategy.backtestResults && (
                                                        <div className="mb-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-caption-2 text-theme-tertiary">
                                                                    Latest Backtest Results
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        openBacktestModal(tech.id)
                                                                    }
                                                                    className="text-caption-2 text-primary-1 hover:text-primary-2"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="p-2 bg-theme-on-surface-1 rounded-lg">
                                                                    <div className="text-caption-2 text-theme-tertiary mb-1">
                                                                        Return
                                                                    </div>
                                                                    <div
                                                                        className={`text-caption-1 font-semibold ${
                                                                            selectedStrategy
                                                                                .backtestResults
                                                                                .totalReturnPercentage >
                                                                            0
                                                                                ? "text-primary-2"
                                                                                : "text-theme-red"
                                                                        }`}
                                                                    >
                                                                        {selectedStrategy.backtestResults.totalReturnPercentage.toFixed(
                                                                            2
                                                                        )}
                                                                        %
                                                                    </div>
                                                                </div>
                                                                <div className="p-2 bg-theme-on-surface-1 rounded-lg">
                                                                    <div className="text-caption-2 text-theme-tertiary mb-1">
                                                                        Win Rate
                                                                    </div>
                                                                    <div className="text-caption-1 font-semibold text-theme-primary">
                                                                        {selectedStrategy.backtestResults.winRate.toFixed(
                                                                            1
                                                                        )}
                                                                        %
                                                                    </div>
                                                                </div>
                                                                <div className="p-2 bg-theme-on-surface-1 rounded-lg">
                                                                    <div className="text-caption-2 text-theme-tertiary mb-1">
                                                                        Sharpe
                                                                    </div>
                                                                    <div className="text-caption-1 font-semibold text-theme-primary">
                                                                        {selectedStrategy.backtestResults.sharpeRatio.toFixed(
                                                                            2
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => openBacktestModal(tech.id)}
                                                        className="w-full px-4 py-2 bg-primary-1 hover:bg-primary-2 text-white rounded-lg transition-colors text-caption-1"
                                                    >
                                                        {selectedStrategy.backtestResults ? "Run New Backtest" : "Run Backtest"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Strategies */}
                        {selectedTechnicalStrategies.filter((t) => t.isCustom).length > 0 && (
                            <div>
                                <h4 className="text-base-2s text-theme-primary mb-3">
                                    Custom Strategies
                                </h4>
                                <div className="space-y-3">
                                    {selectedTechnicalStrategies
                                        .filter((t) => t.isCustom)
                                        .map((tech) => (
                                            <div
                                                key={tech.id}
                                                className="p-4 rounded-xl border border-primary-1 bg-primary-1/5"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="text-base-2s text-theme-primary mb-1">
                                                            {tech.name}
                                                        </div>
                                                        <div className="text-caption-2 text-theme-secondary">
                                                            {tech.description}
                                                        </div>
                                                    </div>
                                                    {isEditing && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    openEditStrategyModal(tech.id)
                                                                }
                                                                className="p-2 hover:bg-theme-on-surface-2 rounded-lg transition-colors"
                                                                title="Edit strategy"
                                                            >
                                                                <Icon
                                                                    className="w-4 h-4 fill-primary-1"
                                                                    name="edit"
                                                                />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleRemoveStrategy(tech.id)
                                                                }
                                                                className="p-2 hover:bg-theme-on-surface-2 rounded-lg transition-colors"
                                                                title="Remove strategy"
                                                            >
                                                                <Icon
                                                                    className="w-4 h-4 fill-theme-red"
                                                                    name="close"
                                                                />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {tech.generatedCode && (
                                                    <div className="mb-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="text-caption-2 text-theme-tertiary">
                                                                Generated Code
                                                            </div>
                                                            <button
                                                                onClick={() => openEditStrategyModal(tech.id)}
                                                                className="text-caption-2 text-primary-1 hover:text-primary-2 flex items-center gap-1"
                                                            >
                                                                <Icon
                                                                    className="w-3 h-3 fill-primary-1"
                                                                    name="edit"
                                                                />
                                                                View/Edit Code
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {tech.generatedCode.pinescript && (
                                                                <span className="px-2 py-1 bg-theme-on-surface-1 rounded text-caption-2 text-theme-primary">
                                                                    Pine Script
                                                                </span>
                                                            )}
                                                            {tech.generatedCode.python && (
                                                                <span className="px-2 py-1 bg-theme-on-surface-1 rounded text-caption-2 text-theme-primary">
                                                                    Python
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {tech.backtestResults && (
                                                    <div className="space-y-3 mb-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-caption-2 text-theme-tertiary">
                                                                Latest Backtest Results
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    openBacktestModal(tech.id)
                                                                }
                                                                className="text-caption-2 text-primary-1 hover:text-primary-2"
                                                            >
                                                                View Details
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="p-3 bg-theme-on-surface-1 rounded-lg">
                                                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                                                    Return
                                                                </div>
                                                                <div
                                                                    className={`text-base-2s ${
                                                                        tech.backtestResults
                                                                            .totalReturnPercentage > 0
                                                                            ? "text-primary-2"
                                                                            : "text-theme-red"
                                                                    }`}
                                                                >
                                                                    {tech.backtestResults.totalReturnPercentage.toFixed(
                                                                        2
                                                                    )}
                                                                    %
                                                                </div>
                                                            </div>
                                                            <div className="p-3 bg-theme-on-surface-1 rounded-lg">
                                                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                                                    Win Rate
                                                                </div>
                                                                <div className="text-base-2s text-theme-primary">
                                                                    {tech.backtestResults.winRate.toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </div>
                                                            </div>
                                                            <div className="p-3 bg-theme-on-surface-1 rounded-lg">
                                                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                                                    Sharpe
                                                                </div>
                                                                <div className="text-base-2s text-theme-primary">
                                                                    {tech.backtestResults.sharpeRatio.toFixed(
                                                                        2
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => openBacktestModal(tech.id)}
                                                    className="w-full px-4 py-2 bg-primary-1 hover:bg-primary-2 text-white rounded-lg transition-colors text-caption-1"
                                                >
                                                    {tech.backtestResults ? "Run New Backtest" : "Run Backtest"}
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Funding */}
                <Card title="Strategy Funding">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-theme-on-surface-1 rounded-xl">
                            <div>
                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                    Current Deposit
                                </div>
                                <div className="text-h5 text-theme-primary">
                                    ${strategy.depositAmount.toLocaleString()}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDepositModal(true)}
                                className="px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors"
                            >
                                Add Funds
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Visibility */}
                <Card title="Strategy Visibility">
                    <div className="space-y-4">
                        <p className="text-base-2 text-theme-secondary">
                            Share your strategy with the community and let others follow your
                            performance.
                        </p>
                        <div className="flex items-center justify-between p-4 bg-theme-on-surface-1 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Icon
                                    className={`w-5 h-5 ${
                                        visibility === "public"
                                            ? "fill-primary-1"
                                            : "fill-theme-tertiary"
                                    }`}
                                    name={visibility === "public" ? "eye" : "lock"}
                                />
                                <div>
                                    <div className="text-base-2s text-theme-primary">
                                        {visibility === "public"
                                            ? "Public Strategy"
                                            : "Private Strategy"}
                                    </div>
                                    <div className="text-caption-2 text-theme-secondary">
                                        {visibility === "public"
                                            ? "Visible to all users"
                                            : "Only visible to you"}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handlePublishToggle}
                                className={`px-6 py-3 rounded-xl transition-colors ${
                                    visibility === "public"
                                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                        : "bg-primary-1 hover:bg-primary-2 text-white"
                                }`}
                            >
                                {visibility === "public" ? "Make Private" : "Publish to Public"}
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Custom Strategy Modal */}
                {showCustomStrategyModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-h5 text-theme-primary">
                                        Create Custom Strategy
                                    </h2>
                                    <button
                                        onClick={() => setShowCustomStrategyModal(false)}
                                        className="p-2 hover:bg-theme-on-surface-2 rounded-lg transition-colors"
                                    >
                                        <Icon
                                            className="w-5 h-5 fill-theme-secondary"
                                            name="close"
                                        />
                                    </button>
                                </div>

                                <div>
                                    <label className="text-base-2 text-theme-secondary mb-2 block">
                                        Strategy Name
                                    </label>
                                    <input
                                        type="text"
                                        value={customStrategyName}
                                        onChange={(e) => setCustomStrategyName(e.target.value)}
                                        placeholder="e.g., My Custom EMA Strategy"
                                        className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-base-2 text-theme-secondary mb-2 block">
                                        Strategy Description
                                    </label>
                                    <textarea
                                        value={customStrategyDescription}
                                        onChange={(e) =>
                                            setCustomStrategyDescription(e.target.value)
                                        }
                                        rows={4}
                                        placeholder="Describe your strategy in detail. Example: Use 12 and 26 period EMAs for crossover signals. Buy when fast crosses above slow, sell when opposite..."
                                        className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                    />
                                </div>

                                {customStrategyDescription && (
                                    <button
                                        onClick={handleGenerateCode}
                                        disabled={isGeneratingCode}
                                        className="w-full px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {isGeneratingCode
                                            ? "Generating Code..."
                                            : "Generate Code with AI"}
                                    </button>
                                )}

                                {(generatedPineScript || generatedPython) && (
                                    <div className="space-y-3">
                                        <div className="flex gap-2 border-b border-theme-stroke">
                                            <button
                                                onClick={() =>
                                                    setSelectedCodeLanguage("pinescript")
                                                }
                                                className={`px-4 py-2 text-base-2 transition-colors ${
                                                    selectedCodeLanguage === "pinescript"
                                                        ? "text-primary-1 border-b-2 border-primary-1"
                                                        : "text-theme-secondary hover:text-theme-primary"
                                                }`}
                                            >
                                                Pine Script
                                            </button>
                                            <button
                                                onClick={() => setSelectedCodeLanguage("python")}
                                                className={`px-4 py-2 text-base-2 transition-colors ${
                                                    selectedCodeLanguage === "python"
                                                        ? "text-primary-1 border-b-2 border-primary-1"
                                                        : "text-theme-secondary hover:text-theme-primary"
                                                }`}
                                            >
                                                Python
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute top-2 right-2 flex gap-2 z-10">
                                                <button
                                                    onClick={() => setIsEditingCode(!isEditingCode)}
                                                    className="p-2 bg-theme-on-surface-2 hover:bg-theme-stroke rounded-lg transition-colors"
                                                    title={isEditingCode ? "View code" : "Edit code"}
                                                >
                                                    <Icon
                                                        className="w-4 h-4 fill-theme-secondary"
                                                        name={isEditingCode ? "eye" : "edit"}
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            selectedCodeLanguage === "pinescript"
                                                                ? generatedPineScript
                                                                : generatedPython
                                                        );
                                                    }}
                                                    className="p-2 bg-theme-on-surface-2 hover:bg-theme-stroke rounded-lg transition-colors"
                                                    title="Copy code"
                                                >
                                                    <Icon
                                                        className="w-4 h-4 fill-theme-secondary"
                                                        name="copy"
                                                    />
                                                </button>
                                            </div>
                                            {isEditingCode ? (
                                                <textarea
                                                    value={
                                                        selectedCodeLanguage === "pinescript"
                                                            ? generatedPineScript
                                                            : generatedPython
                                                    }
                                                    onChange={(e) => {
                                                        if (selectedCodeLanguage === "pinescript") {
                                                            setGeneratedPineScript(e.target.value);
                                                        } else {
                                                            setGeneratedPython(e.target.value);
                                                        }
                                                    }}
                                                    rows={20}
                                                    className="w-full p-4 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-caption-1 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors font-mono resize-none"
                                                    spellCheck={false}
                                                />
                                            ) : (
                                                <pre className="p-4 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-caption-1 text-theme-primary overflow-x-auto max-h-96 overflow-y-auto">
                                                    <code>
                                                        {selectedCodeLanguage === "pinescript"
                                                            ? generatedPineScript
                                                            : generatedPython}
                                                    </code>
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCustomStrategyModal(false)}
                                        className="flex-1 px-6 py-3 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddCustomStrategy}
                                        disabled={
                                            !customStrategyName ||
                                            !customStrategyDescription ||
                                            (!generatedPineScript && !generatedPython)
                                        }
                                        className="flex-1 px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Add Strategy
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Backtest Modal */}
                {showBacktestModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-h5 text-theme-primary">
                                        Backtest Configuration
                                    </h2>
                                    <button
                                        onClick={() => setShowBacktestModal(false)}
                                        className="p-2 hover:bg-theme-on-surface-2 rounded-lg transition-colors"
                                    >
                                        <Icon
                                            className="w-5 h-5 fill-theme-secondary"
                                            name="close"
                                        />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-base-2 text-theme-secondary mb-2 block">
                                            Token Pair
                                        </label>
                                        <select
                                            value={backtestTokenPair}
                                            onChange={(e) => setBacktestTokenPair(e.target.value)}
                                            className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                        >
                                            {POPULAR_PAIRS.map((pair) => (
                                                <option key={pair} value={pair}>
                                                    {pair}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-base-2 text-theme-secondary mb-2 block">
                                            Timeframe
                                        </label>
                                        <select
                                            value={backtestTimeframe}
                                            onChange={(e) => setBacktestTimeframe(e.target.value)}
                                            className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                        >
                                            {TIMEFRAMES.map((tf) => (
                                                <option key={tf} value={tf}>
                                                    {tf}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-base-2 text-theme-secondary mb-2 block">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={backtestStartDate}
                                            onChange={(e) => setBacktestStartDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-base-2 text-theme-secondary mb-2 block">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={backtestEndDate}
                                            onChange={(e) => setBacktestEndDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                        />
                                    </div>
                                </div>

                                {!backtestResults && (
                                    <button
                                        onClick={handleRunBacktest}
                                        disabled={isBacktesting}
                                        className="w-full px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {isBacktesting ? "Running Backtest..." : "Run Backtest"}
                                    </button>
                                )}

                                {backtestResults && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-h6 text-theme-primary">
                                                Backtest Results
                                            </h3>
                                            <button
                                                onClick={handleRunBacktest}
                                                disabled={isBacktesting}
                                                className="px-4 py-2 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-lg transition-colors text-caption-1"
                                            >
                                                Re-run
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                                    Total Return
                                                </div>
                                                <div
                                                    className={`text-h6 ${
                                                        backtestResults.totalReturnPercentage > 0
                                                            ? "text-primary-2"
                                                            : "text-theme-red"
                                                    }`}
                                                >
                                                    {backtestResults.totalReturnPercentage.toFixed(
                                                        2
                                                    )}
                                                    %
                                                </div>
                                                <div className="text-caption-2 text-theme-secondary">
                                                    ${backtestResults.totalReturn.toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                                    Win Rate
                                                </div>
                                                <div className="text-h6 text-theme-primary">
                                                    {backtestResults.winRate.toFixed(1)}%
                                                </div>
                                                <div className="text-caption-2 text-theme-secondary">
                                                    {backtestResults.totalTrades} trades
                                                </div>
                                            </div>

                                            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                                    Sharpe Ratio
                                                </div>
                                                <div className="text-h6 text-theme-primary">
                                                    {backtestResults.sharpeRatio.toFixed(2)}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                                    Max Drawdown
                                                </div>
                                                <div className="text-h6 text-theme-red">
                                                    {backtestResults.maxDrawdown.toFixed(2)}%
                                                </div>
                                            </div>

                                            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                                    Avg Win
                                                </div>
                                                <div className="text-base-2 text-primary-2">
                                                    ${backtestResults.avgWin.toFixed(2)}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                                    Avg Loss
                                                </div>
                                                <div className="text-base-2 text-theme-red">
                                                    ${backtestResults.avgLoss.toFixed(2)}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                                    Profit Factor
                                                </div>
                                                <div className="text-base-2 text-theme-primary">
                                                    {backtestResults.profitFactor.toFixed(2)}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                                <div className="text-caption-2 text-theme-tertiary mb-1">
                                                    Total Trades
                                                </div>
                                                <div className="text-base-2 text-theme-primary">
                                                    {backtestResults.totalTrades}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                            <div className="text-caption-2 text-theme-tertiary mb-3">
                                                Equity Curve
                                            </div>
                                            <div className="h-48 flex items-end gap-1">
                                                {backtestResults.equityCurve.map((point, idx) => {
                                                    const minValue = Math.min(
                                                        ...backtestResults.equityCurve.map(
                                                            (p) => p.value
                                                        )
                                                    );
                                                    const maxValue = Math.max(
                                                        ...backtestResults.equityCurve.map(
                                                            (p) => p.value
                                                        )
                                                    );
                                                    const height =
                                                        ((point.value - minValue) /
                                                            (maxValue - minValue)) *
                                                        100;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="flex-1 bg-primary-1 rounded-t"
                                                            style={{ height: `${height}%` }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowBacktestModal(false)}
                                    className="w-full px-6 py-3 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Edit Strategy Modal */}
                {showEditStrategyModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-h5 text-theme-primary">
                                        Edit Custom Strategy
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowEditStrategyModal(false);
                                            setEditingStrategyId(null);
                                            setCustomStrategyName("");
                                            setCustomStrategyDescription("");
                                            setGeneratedPineScript("");
                                            setGeneratedPython("");
                                            setIsEditingCode(false);
                                        }}
                                        className="p-2 hover:bg-theme-on-surface-2 rounded-lg transition-colors"
                                    >
                                        <Icon
                                            className="w-5 h-5 fill-theme-secondary"
                                            name="close"
                                        />
                                    </button>
                                </div>

                                <div>
                                    <label className="text-base-2 text-theme-secondary mb-2 block">
                                        Strategy Name
                                    </label>
                                    <input
                                        type="text"
                                        value={customStrategyName}
                                        onChange={(e) => setCustomStrategyName(e.target.value)}
                                        placeholder="e.g., My Custom EMA Strategy"
                                        className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-base-2 text-theme-secondary mb-2 block">
                                        Strategy Description
                                    </label>
                                    <textarea
                                        value={customStrategyDescription}
                                        onChange={(e) =>
                                            setCustomStrategyDescription(e.target.value)
                                        }
                                        rows={4}
                                        placeholder="Describe your strategy in detail..."
                                        className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                    />
                                </div>

                                {(generatedPineScript || generatedPython) && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-theme-stroke pb-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        setSelectedCodeLanguage("pinescript")
                                                    }
                                                    className={`px-4 py-2 text-base-2 transition-colors ${
                                                        selectedCodeLanguage === "pinescript"
                                                            ? "text-primary-1 border-b-2 border-primary-1"
                                                            : "text-theme-secondary hover:text-theme-primary"
                                                    }`}
                                                >
                                                    Pine Script
                                                </button>
                                                <button
                                                    onClick={() => setSelectedCodeLanguage("python")}
                                                    className={`px-4 py-2 text-base-2 transition-colors ${
                                                        selectedCodeLanguage === "python"
                                                            ? "text-primary-1 border-b-2 border-primary-1"
                                                            : "text-theme-secondary hover:text-theme-primary"
                                                    }`}
                                                >
                                                    Python
                                                </button>
                                            </div>
                                            <span className="text-caption-2 text-theme-tertiary">
                                                {isEditingCode ? "Editing mode" : "View mode"}
                                            </span>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute top-2 right-2 flex gap-2 z-10">
                                                <button
                                                    onClick={() => setIsEditingCode(!isEditingCode)}
                                                    className="p-2 bg-theme-on-surface-2 hover:bg-theme-stroke rounded-lg transition-colors"
                                                    title={isEditingCode ? "View code" : "Edit code"}
                                                >
                                                    <Icon
                                                        className="w-4 h-4 fill-theme-secondary"
                                                        name={isEditingCode ? "eye" : "edit"}
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            selectedCodeLanguage === "pinescript"
                                                                ? generatedPineScript
                                                                : generatedPython
                                                        );
                                                    }}
                                                    className="p-2 bg-theme-on-surface-2 hover:bg-theme-stroke rounded-lg transition-colors"
                                                    title="Copy code"
                                                >
                                                    <Icon
                                                        className="w-4 h-4 fill-theme-secondary"
                                                        name="copy"
                                                    />
                                                </button>
                                            </div>
                                            {isEditingCode ? (
                                                <textarea
                                                    value={
                                                        selectedCodeLanguage === "pinescript"
                                                            ? generatedPineScript
                                                            : generatedPython
                                                    }
                                                    onChange={(e) => {
                                                        if (selectedCodeLanguage === "pinescript") {
                                                            setGeneratedPineScript(e.target.value);
                                                        } else {
                                                            setGeneratedPython(e.target.value);
                                                        }
                                                    }}
                                                    rows={20}
                                                    className="w-full p-4 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-caption-1 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors font-mono resize-none"
                                                    spellCheck={false}
                                                />
                                            ) : (
                                                <pre className="p-4 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-caption-1 text-theme-primary overflow-x-auto max-h-96 overflow-y-auto">
                                                    <code>
                                                        {selectedCodeLanguage === "pinescript"
                                                            ? generatedPineScript
                                                            : generatedPython}
                                                    </code>
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowEditStrategyModal(false);
                                            setEditingStrategyId(null);
                                            setCustomStrategyName("");
                                            setCustomStrategyDescription("");
                                            setGeneratedPineScript("");
                                            setGeneratedPython("");
                                            setIsEditingCode(false);
                                        }}
                                        className="flex-1 px-6 py-3 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateStrategy}
                                        disabled={
                                            !customStrategyName ||
                                            !customStrategyDescription ||
                                            (!generatedPineScript && !generatedPython)
                                        }
                                        className="flex-1 px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Update Strategy
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Deposit Modal */}
                {showDepositModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-h5 text-theme-primary">
                                        Deposit Additional Funds
                                    </h2>
                                    <button
                                        onClick={() => setShowDepositModal(false)}
                                        className="p-2 hover:bg-theme-on-surface-2 rounded-lg transition-colors"
                                    >
                                        <Icon
                                            className="w-5 h-5 fill-theme-secondary"
                                            name="close"
                                        />
                                    </button>
                                </div>
                                <div>
                                    <label className="text-base-2 text-theme-secondary mb-2 block">
                                        Amount (USD)
                                    </label>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="p-3 bg-theme-on-surface-1 rounded-xl">
                                    <div className="flex items-center justify-between text-caption-1 mb-2">
                                        <span className="text-theme-tertiary">Current Deposit</span>
                                        <span className="text-theme-primary">
                                            ${strategy.depositAmount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-caption-1 mb-2">
                                        <span className="text-theme-tertiary">
                                            Additional Deposit
                                        </span>
                                        <span className="text-theme-primary">
                                            ${parseFloat(depositAmount || "0").toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="h-px bg-theme-stroke my-2"></div>
                                    <div className="flex items-center justify-between text-base-2s">
                                        <span className="text-theme-primary">New Total</span>
                                        <span className="text-theme-primary font-semibold">
                                            $
                                            {(
                                                strategy.depositAmount +
                                                parseFloat(depositAmount || "0")
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDepositModal(false)}
                                        className="flex-1 px-6 py-3 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDepositFunds}
                                        disabled={
                                            !depositAmount || parseFloat(depositAmount) <= 0
                                        }
                                        className="flex-1 px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Deposit Funds
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AIConfigurationPage;
