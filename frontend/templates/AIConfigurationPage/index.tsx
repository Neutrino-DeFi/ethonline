"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import {
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Box,
    Text,
} from "@chakra-ui/react";
import {
    Strategy,
    TECHNICAL_STRATEGIES,
    TechnicalStrategy,
    RiskLevel,
    CodeLanguage,
    BacktestResult,
    AgentConfig,
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

    // Form state - 5 agents
    const [supervisor, setSupervisor] = useState<AgentConfig>({ prompt: "" });
    const [executor, setExecutor] = useState<AgentConfig>({ prompt: "" });
    const [technical, setTechnical] = useState<AgentConfig>({ prompt: "", weightage: 33 });
    const [sentiment, setSentiment] = useState<AgentConfig>({ prompt: "", weightage: 33 });
    const [webSearch, setWebSearch] = useState<AgentConfig>({ prompt: "", weightage: 34 });

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

                    // Load agent configs
                    if (found.agenticConfig.supervisor) {
                        setSupervisor(found.agenticConfig.supervisor);
                    }
                    if (found.agenticConfig.executor) {
                        setExecutor(found.agenticConfig.executor);
                    }
                    if (found.agenticConfig.technical) {
                        setTechnical(found.agenticConfig.technical);
                    }
                    if (found.agenticConfig.sentiment) {
                        setSentiment(found.agenticConfig.sentiment);
                    }
                    if (found.agenticConfig.webSearch) {
                        setWebSearch(found.agenticConfig.webSearch);
                    }

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
                supervisor,
                executor,
                technical,
                sentiment,
                webSearch,
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

        setSupervisor(strategy.agenticConfig.supervisor);
        setExecutor(strategy.agenticConfig.executor);
        setTechnical(strategy.agenticConfig.technical);
        setSentiment(strategy.agenticConfig.sentiment);
        setWebSearch(strategy.agenticConfig.webSearch);
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

    // Weightage validation
    const weightageSum = (technical.weightage || 0) + (sentiment.weightage || 0) + (webSearch.weightage || 0);
    const isWeightageValid = weightageSum === 100;

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
                                        Configure AI Agents
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
                                        disabled={isSaving || !isWeightageValid}
                                        className="px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                {/* AI Agents Configuration */}
                <Card title="AI Agents Configuration">
                    <div className="space-y-8">
                        {/* Weightage Summary */}
                        <div className={`p-4 rounded-xl border-2 ${
                            isWeightageValid
                                ? "border-green-500 bg-green-500/10"
                                : weightageSum > 100
                                    ? "border-red-500 bg-red-500/10"
                                    : "border-yellow-500 bg-yellow-500/10"
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon
                                        className={`w-5 h-5 ${
                                            isWeightageValid
                                                ? "fill-green-500"
                                                : "fill-yellow-500"
                                        }`}
                                        name={isWeightageValid ? "check" : "alert"}
                                    />
                                    <span className="text-base-2 text-theme-primary font-semibold">
                                        Total Weightage: {weightageSum}%
                                    </span>
                                </div>
                                <span className={`text-caption-2 ${
                                    isWeightageValid
                                        ? "text-green-600"
                                        : weightageSum > 100
                                            ? "text-red-600"
                                            : "text-yellow-600"
                                }`}>
                                    {isWeightageValid
                                        ? "Perfect! Ready to save"
                                        : weightageSum > 100
                                            ? `Reduce by ${weightageSum - 100}%`
                                            : `Add ${100 - weightageSum}% more`
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Supervisor Agent */}
                        <div className="p-6 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <Icon className="w-5 h-5 fill-orange-500" name="settings" />
                                </div>
                                <div>
                                    <h4 className="text-title-2 text-theme-primary font-semibold">
                                        Supervisor Agent
                                    </h4>
                                    <p className="text-caption-2 text-theme-tertiary">
                                        Oversees and coordinates other agents
                                    </p>
                                </div>
                            </div>
                            {isEditing ? (
                                <textarea
                                    value={supervisor.prompt}
                                    onChange={(e) => setSupervisor({ ...supervisor, prompt: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                    placeholder="Enter custom instructions for the supervisor agent..."
                                />
                            ) : (
                                <div className="p-4 bg-theme-on-surface-2 border border-theme-stroke rounded-xl">
                                    <p className="text-base-2 text-theme-primary whitespace-pre-wrap">
                                        {supervisor.prompt || "No custom prompt configured"}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Executor Agent */}
                        <div className="p-6 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <Icon className="w-5 h-5 fill-indigo-500" name="trade" />
                                </div>
                                <div>
                                    <h4 className="text-title-2 text-theme-primary font-semibold">
                                        Executor Agent
                                    </h4>
                                    <p className="text-caption-2 text-theme-tertiary">
                                        Executes trading decisions
                                    </p>
                                </div>
                            </div>
                            {isEditing ? (
                                <textarea
                                    value={executor.prompt}
                                    onChange={(e) => setExecutor({ ...executor, prompt: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                    placeholder="Enter custom instructions for the executor agent..."
                                />
                            ) : (
                                <div className="p-4 bg-theme-on-surface-2 border border-theme-stroke rounded-xl">
                                    <p className="text-base-2 text-theme-primary whitespace-pre-wrap">
                                        {executor.prompt || "No custom prompt configured"}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Technical Agent */}
                        <div className="p-6 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Icon className="w-5 h-5 fill-blue-500" name="star" />
                                    </div>
                                    <div>
                                        <h4 className="text-title-2 text-theme-primary font-semibold">
                                            Technical Agent
                                        </h4>
                                        <p className="text-caption-2 text-theme-tertiary">
                                            Analyzes technical indicators and strategies
                                        </p>
                                    </div>
                                </div>
                                <Text className="text-title-2 text-theme-primary font-semibold">
                                    {technical.weightage}%
                                </Text>
                            </div>

                            <div className="mb-6">
                                <Box px={2}>
                                    <Slider
                                        value={technical.weightage}
                                        onChange={(value) => setTechnical({ ...technical, weightage: value })}
                                        min={0}
                                        max={100}
                                        step={1}
                                        isDisabled={!isEditing}
                                    >
                                        <SliderTrack height="6px" borderRadius="3px">
                                            <SliderFilledTrack bg="blue.500" />
                                        </SliderTrack>
                                        <SliderThumb
                                            width="20px"
                                            height="20px"
                                            bg="blue.500"
                                            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                                        />
                                    </Slider>
                                </Box>
                            </div>

                            {/* Pre-built Technical Strategies */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-base-2 text-theme-primary font-semibold">
                                        Pre-built Technical Strategies
                                    </div>
                                </div>
                                <p className="text-caption-2 text-theme-secondary mb-4">
                                    Select one or more technical analysis strategies
                                </p>
                                <div className="space-y-3">
                                    {TECHNICAL_STRATEGIES.map((tech) => {
                                        const isSelected = selectedTechnicalStrategies.some(
                                            (t) => t.id === tech.id
                                        );
                                        return (
                                            <div
                                                key={tech.id}
                                                className={`p-4 rounded-xl border transition-colors ${
                                                    isSelected
                                                        ? "border-blue-500 bg-blue-500/5"
                                                        : "border-theme-stroke"
                                                } ${!isEditing ? "opacity-70" : ""}`}
                                            >
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() =>
                                                            isEditing &&
                                                            handleToggleTechnicalStrategy(tech)
                                                        }
                                                        disabled={!isEditing}
                                                        className="mt-1 w-5 h-5 accent-blue-500 rounded"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-base-2 text-theme-primary mb-1 font-semibold">
                                                            {tech.name}
                                                        </div>
                                                        <div className="text-caption-2 text-theme-secondary">
                                                            {tech.description}
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Technical Strategies */}
                            <div className="mb-6">
                                <div className="text-base-2 text-theme-primary font-semibold mb-3">
                                    Custom Technical Strategies
                                </div>
                                {selectedTechnicalStrategies.filter((t) => t.isCustom).length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedTechnicalStrategies
                                            .filter((t) => t.isCustom)
                                            .map((tech) => (
                                                <div
                                                    key={tech.id}
                                                    className="p-4 rounded-xl border border-blue-500 bg-blue-500/5"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <div className="text-base-2 text-theme-primary mb-1 font-semibold">
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
                                                                        className="w-4 h-4 fill-blue-500"
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
                                                                        className="w-4 h-4 fill-red-500"
                                                                        name="close"
                                                                    />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {tech.generatedCode && (
                                                        <div className="mt-3 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-caption-2 text-theme-tertiary">
                                                                    Generated Code
                                                                </div>
                                                                <button
                                                                    onClick={() => openEditStrategyModal(tech.id)}
                                                                    className="text-caption-2 text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                                                >
                                                                    <Icon
                                                                        className="w-3 h-3 fill-blue-500"
                                                                        name="code"
                                                                    />
                                                                    View Code
                                                                </button>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {tech.generatedCode.pinescript && (
                                                                    <span className="px-2 py-1 bg-theme-on-surface-2 rounded text-caption-2 text-theme-primary">
                                                                        Pine Script
                                                                    </span>
                                                                )}
                                                                {tech.generatedCode.python && (
                                                                    <span className="px-2 py-1 bg-theme-on-surface-2 rounded text-caption-2 text-theme-primary">
                                                                        Python
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {tech.backtestResults && (
                                                        <div className="mt-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-caption-2 text-theme-tertiary">
                                                                    Backtest Results
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        openBacktestModal(tech.id)
                                                                    }
                                                                    className="text-caption-2 text-blue-500 hover:text-blue-600"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="p-2 bg-theme-on-surface-2 rounded-lg">
                                                                    <div className="text-caption-2 text-theme-tertiary mb-1">
                                                                        Return
                                                                    </div>
                                                                    <div
                                                                        className={`text-caption-1 font-semibold ${
                                                                            tech.backtestResults
                                                                                .totalReturnPercentage > 0
                                                                                ? "text-green-500"
                                                                                : "text-red-500"
                                                                        }`}
                                                                    >
                                                                        {tech.backtestResults.totalReturnPercentage.toFixed(
                                                                            2
                                                                        )}
                                                                        %
                                                                    </div>
                                                                </div>
                                                                <div className="p-2 bg-theme-on-surface-2 rounded-lg">
                                                                    <div className="text-caption-2 text-theme-tertiary mb-1">
                                                                        Win Rate
                                                                    </div>
                                                                    <div className="text-caption-1 font-semibold text-theme-primary">
                                                                        {tech.backtestResults.winRate.toFixed(
                                                                            1
                                                                        )}
                                                                        %
                                                                    </div>
                                                                </div>
                                                                <div className="p-2 bg-theme-on-surface-2 rounded-lg">
                                                                    <div className="text-caption-2 text-theme-tertiary mb-1">
                                                                        Sharpe
                                                                    </div>
                                                                    <div className="text-caption-1 font-semibold text-theme-primary">
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
                                                        className="mt-3 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-caption-1"
                                                    >
                                                        {tech.backtestResults ? "Re-run Backtest" : "Run Backtest"}
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-theme-on-surface-2 rounded-xl border border-dashed border-theme-stroke text-center">
                                        <p className="text-caption-2 text-theme-tertiary">
                                            No custom strategies yet. {isEditing && "Click 'Create New' to add one."}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Custom Prompt */}
                            <div>
                                <div className="text-base-2 text-theme-primary font-semibold mb-2">
                                    Custom Prompt (Optional)
                                </div>
                                {isEditing ? (
                                    <>
                                        <textarea
                                            value={technical.prompt}
                                            onChange={(e) => setTechnical({ ...technical, prompt: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                            placeholder="Enter custom prompt to generate technical strategy code..."
                                        />
                                        {technical.prompt.trim() && (
                                            <button
                                                onClick={() => {
                                                    setCustomStrategyDescription(technical.prompt);
                                                    setCustomStrategyName("Custom Strategy");
                                                    handleGenerateCode();
                                                    setShowCustomStrategyModal(true);
                                                }}
                                                className="mt-3 w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Icon className="w-5 h-5 fill-white" name="code" />
                                                Generate Code & Backtest
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-4 bg-theme-on-surface-2 border border-theme-stroke rounded-xl">
                                        <p className="text-base-2 text-theme-primary whitespace-pre-wrap">
                                            {technical.prompt || "No custom prompt configured"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sentiment Agent */}
                        <div className="p-6 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                        <Icon className="w-5 h-5 fill-yellow-500" name="news" />
                                    </div>
                                    <div>
                                        <h4 className="text-title-2 text-theme-primary font-semibold">
                                            Sentiment Agent
                                        </h4>
                                        <p className="text-caption-2 text-theme-tertiary">
                                            Analyzes market sentiment
                                        </p>
                                    </div>
                                </div>
                                <Text className="text-title-2 text-theme-primary font-semibold">
                                    {sentiment.weightage}%
                                </Text>
                            </div>

                            <div className="mb-4">
                                <Box px={2}>
                                    <Slider
                                        value={sentiment.weightage}
                                        onChange={(value) => setSentiment({ ...sentiment, weightage: value })}
                                        min={0}
                                        max={100}
                                        step={1}
                                        isDisabled={!isEditing}
                                    >
                                        <SliderTrack height="6px" borderRadius="3px">
                                            <SliderFilledTrack bg="yellow.500" />
                                        </SliderTrack>
                                        <SliderThumb
                                            width="20px"
                                            height="20px"
                                            bg="yellow.500"
                                            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                                        />
                                    </Slider>
                                </Box>
                            </div>

                            {isEditing ? (
                                <textarea
                                    value={sentiment.prompt}
                                    onChange={(e) => setSentiment({ ...sentiment, prompt: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                    placeholder="Enter custom instructions for sentiment analysis..."
                                />
                            ) : (
                                <div className="p-4 bg-theme-on-surface-2 border border-theme-stroke rounded-xl">
                                    <p className="text-base-2 text-theme-primary whitespace-pre-wrap">
                                        {sentiment.prompt || "No custom prompt configured"}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Web Search Agent */}
                        <div className="p-6 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <Icon className="w-5 h-5 fill-purple-500" name="search" />
                                    </div>
                                    <div>
                                        <h4 className="text-title-2 text-theme-primary font-semibold">
                                            Web Search Agent
                                        </h4>
                                        <p className="text-caption-2 text-theme-tertiary">
                                            Searches web for market insights
                                        </p>
                                    </div>
                                </div>
                                <Text className="text-title-2 text-theme-primary font-semibold">
                                    {webSearch.weightage}%
                                </Text>
                            </div>

                            <div className="mb-4">
                                <Box px={2}>
                                    <Slider
                                        value={webSearch.weightage}
                                        onChange={(value) => setWebSearch({ ...webSearch, weightage: value })}
                                        min={0}
                                        max={100}
                                        step={1}
                                        isDisabled={!isEditing}
                                    >
                                        <SliderTrack height="6px" borderRadius="3px">
                                            <SliderFilledTrack bg="purple.500" />
                                        </SliderTrack>
                                        <SliderThumb
                                            width="20px"
                                            height="20px"
                                            bg="purple.500"
                                            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                                        />
                                    </Slider>
                                </Box>
                            </div>

                            {isEditing ? (
                                <textarea
                                    value={webSearch.prompt}
                                    onChange={(e) => setWebSearch({ ...webSearch, prompt: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                    placeholder="Enter custom instructions for web search..."
                                />
                            ) : (
                                <div className="p-4 bg-theme-on-surface-2 border border-theme-stroke rounded-xl">
                                    <p className="text-base-2 text-theme-primary whitespace-pre-wrap">
                                        {webSearch.prompt || "No custom prompt configured"}
                                    </p>
                                </div>
                            )}
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

                {/* Create Custom Strategy Modal */}
                {showCustomStrategyModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-theme-on-surface-1 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-h5 text-theme-primary">
                                    Create Custom Strategy
                                </h3>
                                <button
                                    onClick={() => setShowCustomStrategyModal(false)}
                                    className="text-theme-tertiary hover:text-theme-primary"
                                >
                                    <Icon className="w-6 h-6 fill-current" name="close" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-base-2 text-theme-primary mb-2 block">
                                        Strategy Name
                                    </label>
                                    <input
                                        type="text"
                                        value={customStrategyName}
                                        onChange={(e) => setCustomStrategyName(e.target.value)}
                                        placeholder="e.g., My EMA Crossover"
                                        className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-base-2 text-theme-primary mb-2 block">
                                        Strategy Description
                                    </label>
                                    <textarea
                                        value={customStrategyDescription}
                                        onChange={(e) => setCustomStrategyDescription(e.target.value)}
                                        placeholder="Describe your trading strategy..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleGenerateCode}
                                    disabled={isGeneratingCode || !customStrategyName || !customStrategyDescription}
                                    className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isGeneratingCode ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Generating Code...
                                        </>
                                    ) : (
                                        <>
                                            <Icon className="w-5 h-5 fill-white" name="code" />
                                            Generate Code
                                        </>
                                    )}
                                </button>

                                {(generatedPineScript || generatedPython) && (
                                    <div className="space-y-4 border-t border-theme-stroke pt-4">
                                        <h4 className="text-title-2 text-theme-primary font-semibold">
                                            Generated Code
                                        </h4>

                                        {generatedPython && (
                                            <div>
                                                <label className="text-caption-1 text-theme-secondary mb-2 block">
                                                    Python Code
                                                </label>
                                                <textarea
                                                    value={generatedPython}
                                                    onChange={(e) => setGeneratedPython(e.target.value)}
                                                    rows={10}
                                                    className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-caption-1 font-mono text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                                />
                                            </div>
                                        )}

                                        {generatedPineScript && (
                                            <div>
                                                <label className="text-caption-1 text-theme-secondary mb-2 block">
                                                    PineScript Code
                                                </label>
                                                <textarea
                                                    value={generatedPineScript}
                                                    onChange={(e) => setGeneratedPineScript(e.target.value)}
                                                    rows={10}
                                                    className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-caption-1 font-mono text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowCustomStrategyModal(false)}
                                        className="flex-1 px-6 py-3 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddCustomStrategy}
                                        disabled={!customStrategyName || !customStrategyDescription}
                                        className="flex-1 px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Add Strategy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Strategy Modal */}
                {showEditStrategyModal && editingStrategyId && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-theme-on-surface-1 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-h5 text-theme-primary">
                                    Edit Strategy
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowEditStrategyModal(false);
                                        setEditingStrategyId(null);
                                    }}
                                    className="text-theme-tertiary hover:text-theme-primary"
                                >
                                    <Icon className="w-6 h-6 fill-current" name="close" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-base-2 text-theme-primary mb-2 block">
                                        Strategy Name
                                    </label>
                                    <input
                                        type="text"
                                        value={customStrategyName}
                                        onChange={(e) => setCustomStrategyName(e.target.value)}
                                        placeholder="e.g., My EMA Crossover"
                                        className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-base-2 text-theme-primary mb-2 block">
                                        Strategy Description
                                    </label>
                                    <textarea
                                        value={customStrategyDescription}
                                        onChange={(e) => setCustomStrategyDescription(e.target.value)}
                                        placeholder="Describe your trading strategy..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                    />
                                </div>

                                {(generatedPineScript || generatedPython) && (
                                    <div className="space-y-4 border-t border-theme-stroke pt-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-title-2 text-theme-primary font-semibold">
                                                Generated Code
                                            </h4>
                                            <button
                                                onClick={() => setIsEditingCode(!isEditingCode)}
                                                className="px-3 py-1.5 text-caption-1 text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                            >
                                                <Icon className="w-4 h-4 fill-blue-500" name={isEditingCode ? "check" : "edit"} />
                                                {isEditingCode ? "Done Editing" : "Edit Code"}
                                            </button>
                                        </div>

                                        {generatedPython && (
                                            <div>
                                                <label className="text-caption-1 text-theme-secondary mb-2 block">
                                                    Python Code
                                                </label>
                                                {isEditingCode ? (
                                                    <textarea
                                                        value={generatedPython}
                                                        onChange={(e) => setGeneratedPython(e.target.value)}
                                                        rows={10}
                                                        className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-caption-1 font-mono text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                                    />
                                                ) : (
                                                    <pre className="w-full p-4 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-caption-1 font-mono text-theme-primary overflow-x-auto max-h-64 overflow-y-auto">
                                                        <code>{generatedPython}</code>
                                                    </pre>
                                                )}
                                            </div>
                                        )}

                                        {generatedPineScript && (
                                            <div>
                                                <label className="text-caption-1 text-theme-secondary mb-2 block">
                                                    PineScript Code
                                                </label>
                                                {isEditingCode ? (
                                                    <textarea
                                                        value={generatedPineScript}
                                                        onChange={(e) => setGeneratedPineScript(e.target.value)}
                                                        rows={10}
                                                        className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-caption-1 font-mono text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                                    />
                                                ) : (
                                                    <pre className="w-full p-4 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-caption-1 font-mono text-theme-primary overflow-x-auto max-h-64 overflow-y-auto">
                                                        <code>{generatedPineScript}</code>
                                                    </pre>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setShowEditStrategyModal(false);
                                            setEditingStrategyId(null);
                                        }}
                                        className="flex-1 px-6 py-3 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateStrategy}
                                        disabled={!customStrategyName || !customStrategyDescription}
                                        className="flex-1 px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Update Strategy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Backtest Modal */}
                {showBacktestModal && backtestStrategyId && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-theme-on-surface-1 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-h5 text-theme-primary">
                                    Backtest Configuration
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowBacktestModal(false);
                                        setBacktestStrategyId(null);
                                        setBacktestResults(null);
                                    }}
                                    className="text-theme-tertiary hover:text-theme-primary"
                                >
                                    <Icon className="w-6 h-6 fill-current" name="close" />
                                </button>
                            </div>

                            {!isBacktesting && !backtestResults && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-base-2 text-theme-primary mb-2 block">
                                                Token Pair
                                            </label>
                                            <select
                                                value={backtestTokenPair}
                                                onChange={(e) => setBacktestTokenPair(e.target.value)}
                                                className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                            >
                                                {["BTC/USDC", "ETH/USDC", "SOL/USDC", "AVAX/USDC", "MATIC/USDC", "LINK/USDC"].map((pair) => (
                                                    <option key={pair} value={pair}>
                                                        {pair}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-base-2 text-theme-primary mb-2 block">
                                                Timeframe
                                            </label>
                                            <select
                                                value={backtestTimeframe}
                                                onChange={(e) => setBacktestTimeframe(e.target.value)}
                                                className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                            >
                                                {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
                                                    <option key={tf} value={tf}>
                                                        {tf}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-base-2 text-theme-primary mb-2 block">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={backtestStartDate}
                                                onChange={(e) => setBacktestStartDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-base-2 text-theme-primary mb-2 block">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={backtestEndDate}
                                                onChange={(e) => setBacktestEndDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => {
                                                setShowBacktestModal(false);
                                                setBacktestStrategyId(null);
                                            }}
                                            className="flex-1 px-6 py-3 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleRunBacktest}
                                            className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
                                        >
                                            Run Backtest
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isBacktesting && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-base-2 text-theme-secondary">
                                        Running backtest...
                                    </p>
                                </div>
                            )}

                            {backtestResults && !isBacktesting && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                                Total Return
                                            </div>
                                            <div className="text-title-1 text-green-500 font-semibold">
                                                ${backtestResults.totalReturn.toFixed(2)}
                                            </div>
                                            <div className="text-caption-2 text-green-500">
                                                {backtestResults.totalReturnPercentage.toFixed(2)}%
                                            </div>
                                        </div>
                                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                                Sharpe Ratio
                                            </div>
                                            <div className="text-title-1 text-theme-primary font-semibold">
                                                {backtestResults.sharpeRatio.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                                Max Drawdown
                                            </div>
                                            <div className="text-title-1 text-red-500 font-semibold">
                                                {backtestResults.maxDrawdown.toFixed(2)}%
                                            </div>
                                        </div>
                                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                                Win Rate
                                            </div>
                                            <div className="text-title-1 text-theme-primary font-semibold">
                                                {backtestResults.winRate.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                                Total Trades
                                            </div>
                                            <div className="text-title-1 text-theme-primary font-semibold">
                                                {backtestResults.totalTrades}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                                Profit Factor
                                            </div>
                                            <div className="text-title-1 text-theme-primary font-semibold">
                                                {backtestResults.profitFactor.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => {
                                                setShowBacktestModal(false);
                                                setBacktestStrategyId(null);
                                                setBacktestResults(null);
                                            }}
                                            className="px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AIConfigurationPage;
