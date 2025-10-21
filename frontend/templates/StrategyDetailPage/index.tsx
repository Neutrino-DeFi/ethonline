"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import { Strategy, Position, AgenticDecision } from "@/types/strategy";
import PerformanceMetrics from "./PerformanceMetrics";
import AgenticDecisions from "./AgenticDecisions";
import PositionsList from "./PositionsList";

type StrategyDetailPageProps = {
    strategyId: string;
};

const StrategyDetailPage = ({ strategyId }: StrategyDetailPageProps) => {
    const router = useRouter();
    const [strategy, setStrategy] = useState<Strategy | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "positions" | "decisions">(
        "overview"
    );

    useEffect(() => {
        // Load strategy from localStorage
        const savedStrategies = localStorage.getItem("user_strategies");
        if (savedStrategies) {
            try {
                const strategies: Strategy[] = JSON.parse(savedStrategies);
                const found = strategies.find((s) => s.id === strategyId);
                if (found) {
                    setStrategy(found);
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

    const handleStatusToggle = () => {
        if (!strategy) return;

        const newStatus =
            strategy.status === "active"
                ? "paused"
                : strategy.status === "paused"
                ? "active"
                : "active";

        const updatedStrategy = { ...strategy, status: newStatus };
        setStrategy(updatedStrategy);

        // Update in localStorage
        const savedStrategies = localStorage.getItem("user_strategies");
        if (savedStrategies) {
            const strategies: Strategy[] = JSON.parse(savedStrategies);
            const index = strategies.findIndex((s) => s.id === strategyId);
            if (index !== -1) {
                strategies[index] = updatedStrategy;
                localStorage.setItem("user_strategies", JSON.stringify(strategies));
            }
        }
    };

    if (!strategy) {
        return (
            <Layout title="Loading...">
                <div className="flex items-center justify-center h-96">
                    <div className="text-theme-secondary">Loading strategy...</div>
                </div>
            </Layout>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "text-primary-2 bg-theme-green-100";
            case "paused":
                return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
            case "inactive":
                return "text-theme-tertiary bg-theme-on-surface-2";
            default:
                return "text-theme-tertiary bg-theme-on-surface-2";
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case "low":
                return "text-primary-2";
            case "medium":
                return "text-yellow-500";
            case "high":
                return "text-theme-red";
            default:
                return "text-theme-secondary";
        }
    };

    return (
        <Layout title="Strategy Details">
            <div className="space-y-6">
                {/* Header Card */}
                <Card>
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <button
                                    onClick={() => router.push("/strategies")}
                                    className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-theme-on-surface-2 transition-colors"
                                >
                                    <Icon
                                        className="w-5 h-5 fill-theme-secondary"
                                        name="arrow-prev"
                                    />
                                </button>
                                <h1 className="text-h4 text-theme-primary">
                                    {strategy.name}
                                </h1>
                                <span
                                    className={`px-3 py-1 rounded-lg text-caption-2 font-semibold uppercase ${getStatusColor(
                                        strategy.status
                                    )}`}
                                >
                                    {strategy.status}
                                </span>
                            </div>
                            <p className="text-base-2 text-theme-secondary mb-4">
                                {strategy.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-caption-1 text-theme-tertiary">
                                <span>
                                    Risk:{" "}
                                    <span
                                        className={`font-semibold ${getRiskColor(
                                            strategy.riskLevel
                                        )}`}
                                    >
                                        {strategy.riskLevel.toUpperCase()}
                                    </span>
                                </span>
                                <span>•</span>
                                <span>
                                    Initial Deposit: ${strategy.depositAmount.toLocaleString()}
                                </span>
                                <span>•</span>
                                <span>
                                    Created:{" "}
                                    {new Date(strategy.createdAt).toLocaleDateString()}
                                </span>
                                {strategy.visibility === "public" && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Icon
                                                className="w-3 h-3 fill-theme-tertiary"
                                                name="eye"
                                            />
                                            Public
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push(`/strategies/${strategyId}/configure`)}
                                className="px-6 py-3 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-xl transition-colors"
                            >
                                Configure
                            </button>
                            <button
                                onClick={handleStatusToggle}
                                className={`px-6 py-3 rounded-xl transition-colors ${
                                    strategy.status === "active"
                                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                        : "bg-primary-1 hover:bg-primary-2 text-white"
                                }`}
                            >
                                {strategy.status === "active" ? "Pause Strategy" : "Resume Strategy"}
                            </button>
                        </div>
                    </div>

                    {/* Performance Overview */}
                    <PerformanceMetrics strategy={strategy} />
                </Card>

                {/* AI Agents Overview */}
                <Card title="AI Agents Configuration">
                    <div className="space-y-6">
                        {/* Agents Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Supervisor Agent */}
                            <div className="p-4 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="w-5 h-5 fill-orange-500" name="settings" />
                                    <div className="text-base-2 text-theme-primary font-semibold">
                                        Supervisor
                                    </div>
                                </div>
                                <div className="text-caption-2 text-theme-secondary">
                                    Coordinates all agents
                                </div>
                                {strategy.agenticConfig.supervisor?.prompt && (
                                    <div className="mt-2 text-caption-2 text-theme-tertiary italic">
                                        Custom prompt configured
                                    </div>
                                )}
                            </div>

                            {/* Executor Agent */}
                            <div className="p-4 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="w-5 h-5 fill-indigo-500" name="trade" />
                                    <div className="text-base-2 text-theme-primary font-semibold">
                                        Executor
                                    </div>
                                </div>
                                <div className="text-caption-2 text-theme-secondary">
                                    Executes trading decisions
                                </div>
                                {strategy.agenticConfig.executor?.prompt && (
                                    <div className="mt-2 text-caption-2 text-theme-tertiary italic">
                                        Custom prompt configured
                                    </div>
                                )}
                            </div>

                            {/* Technical Agent */}
                            <div className="p-4 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="w-5 h-5 fill-blue-500" name="star" />
                                    <div className="text-base-2 text-theme-primary font-semibold">
                                        Technical
                                    </div>
                                </div>
                                <div className="text-caption-2 text-theme-secondary">
                                    Analyzes technical indicators
                                </div>
                                <div className="mt-2 text-title-2 text-blue-500 font-semibold">
                                    {strategy.agenticConfig.technical?.weightage || 0}%
                                </div>
                            </div>

                            {/* Sentiment Agent */}
                            <div className="p-4 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="w-5 h-5 fill-yellow-500" name="news" />
                                    <div className="text-base-2 text-theme-primary font-semibold">
                                        Sentiment
                                    </div>
                                </div>
                                <div className="text-caption-2 text-theme-secondary">
                                    Analyzes market sentiment
                                </div>
                                <div className="mt-2 text-title-2 text-yellow-500 font-semibold">
                                    {strategy.agenticConfig.sentiment?.weightage || 0}%
                                </div>
                            </div>

                            {/* Web Search Agent */}
                            <div className="p-4 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="w-5 h-5 fill-purple-500" name="search" />
                                    <div className="text-base-2 text-theme-primary font-semibold">
                                        Web Search
                                    </div>
                                </div>
                                <div className="text-caption-2 text-theme-secondary">
                                    Searches for market insights
                                </div>
                                <div className="mt-2 text-title-2 text-purple-500 font-semibold">
                                    {strategy.agenticConfig.webSearch?.weightage || 0}%
                                </div>
                            </div>

                            {/* Technical Strategies Count */}
                            <div className="p-4 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="w-5 h-5 fill-theme-primary" name="chart" />
                                    <div className="text-base-2 text-theme-primary font-semibold">
                                        Strategies
                                    </div>
                                </div>
                                <div className="text-caption-2 text-theme-secondary">
                                    Active technical strategies
                                </div>
                                <div className="mt-2 text-title-2 text-theme-primary font-semibold">
                                    {strategy.technicalStrategies.length}
                                </div>
                            </div>
                        </div>

                        {/* Technical Strategies List */}
                        {strategy.technicalStrategies.length > 0 && (
                            <div className="p-4 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                                <div className="text-base-2 text-theme-primary font-semibold mb-3">
                                    Active Technical Strategies
                                </div>
                                <div className="space-y-3">
                                    {strategy.technicalStrategies.map((tech) => (
                                        <div key={tech.id} className="flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                            <div className="flex-1">
                                                <div className="text-base-2 text-theme-primary mb-1">
                                                    {tech.name}
                                                </div>
                                                <div className="text-caption-2 text-theme-secondary">
                                                    {tech.isCustom
                                                        ? tech.customPrompt
                                                        : tech.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Tabs */}
                <Card>
                    <div className="flex border-b border-theme-stroke mb-6">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`px-6 py-3 text-base-2 transition-colors ${
                                activeTab === "overview"
                                    ? "text-primary-1 border-b-2 border-primary-1"
                                    : "text-theme-secondary hover:text-theme-primary"
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab("positions")}
                            className={`px-6 py-3 text-base-2 transition-colors ${
                                activeTab === "positions"
                                    ? "text-primary-1 border-b-2 border-primary-1"
                                    : "text-theme-secondary hover:text-theme-primary"
                            }`}
                        >
                            Positions ({strategy.openPositions.length} Open)
                        </button>
                        <button
                            onClick={() => setActiveTab("decisions")}
                            className={`px-6 py-3 text-base-2 transition-colors ${
                                activeTab === "decisions"
                                    ? "text-primary-1 border-b-2 border-primary-1"
                                    : "text-theme-secondary hover:text-theme-primary"
                            }`}
                        >
                            AI Decisions ({strategy.agenticDecisions.length})
                        </button>
                    </div>

                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
                                <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                    <div className="text-caption-2 text-theme-tertiary mb-2">
                                        Total Trades
                                    </div>
                                    <div className="text-h5 text-theme-primary mb-1">
                                        {strategy.totalTrades}
                                    </div>
                                    <div className="text-caption-2 text-theme-secondary">
                                        {strategy.winningTrades} wins / {strategy.losingTrades}{" "}
                                        losses
                                    </div>
                                </div>
                                <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                    <div className="text-caption-2 text-theme-tertiary mb-2">
                                        Open Positions
                                    </div>
                                    <div className="text-h5 text-theme-primary">
                                        {strategy.openPositions.length}
                                    </div>
                                </div>
                                <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                                    <div className="text-caption-2 text-theme-tertiary mb-2">
                                        Closed Positions
                                    </div>
                                    <div className="text-h5 text-theme-primary">
                                        {strategy.closedPositions.length}
                                    </div>
                                </div>
                            </div>

                            {strategy.openPositions.length > 0 && (
                                <div>
                                    <h3 className="text-title-1 text-theme-primary mb-4">
                                        Recent Open Positions
                                    </h3>
                                    <PositionsList
                                        positions={strategy.openPositions.slice(0, 5)}
                                    />
                                </div>
                            )}

                            {strategy.agenticDecisions.length > 0 && (
                                <div>
                                    <h3 className="text-title-1 text-theme-primary mb-4">
                                        Recent AI Decisions
                                    </h3>
                                    <AgenticDecisions
                                        decisions={strategy.agenticDecisions.slice(0, 5)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "positions" && (
                        <div>
                            {strategy.openPositions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-theme-secondary">
                                        No open positions
                                    </div>
                                </div>
                            ) : (
                                <PositionsList positions={strategy.openPositions} />
                            )}
                        </div>
                    )}

                    {activeTab === "decisions" && (
                        <div>
                            {strategy.agenticDecisions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-theme-secondary">
                                        No AI decisions recorded yet
                                    </div>
                                </div>
                            ) : (
                                <AgenticDecisions decisions={strategy.agenticDecisions} />
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </Layout>
    );
};

export default StrategyDetailPage;
