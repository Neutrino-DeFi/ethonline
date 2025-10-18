"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Icon from "@/components/Icon";
import {
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Box,
    Text,
} from "@chakra-ui/react";
import { Strategy, RiskLevel, VisibilityType, TECHNICAL_STRATEGIES, TechnicalStrategy } from "@/types/strategy";
import TechnicalStrategySelector from "./TechnicalStrategySelector";

const CreateStrategyPage = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        agenticWeightage: 50,
        agenticPrompt: "",
        selectedTechnicalStrategies: [] as TechnicalStrategy[],
        customTechnicalStrategy: "",
        riskLevel: "medium" as RiskLevel,
        visibility: "private" as VisibilityType,
        depositAmount: "",
    });

    const [showDepositModal, setShowDepositModal] = useState(false);

    const handleInputChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleTechnicalStrategyToggle = (strategy: TechnicalStrategy) => {
        const isSelected = formData.selectedTechnicalStrategies.some(
            (s) => s.id === strategy.id
        );
        if (isSelected) {
            setFormData({
                ...formData,
                selectedTechnicalStrategies:
                    formData.selectedTechnicalStrategies.filter(
                        (s) => s.id !== strategy.id
                    ),
            });
        } else {
            setFormData({
                ...formData,
                selectedTechnicalStrategies: [
                    ...formData.selectedTechnicalStrategies,
                    strategy,
                ],
            });
        }
    };

    const handleAddCustomStrategy = () => {
        if (formData.customTechnicalStrategy.trim()) {
            const customStrategy: TechnicalStrategy = {
                id: `custom-${Date.now()}`,
                name: "Custom Strategy",
                description: formData.customTechnicalStrategy,
                isCustom: true,
                customPrompt: formData.customTechnicalStrategy,
            };
            setFormData({
                ...formData,
                selectedTechnicalStrategies: [
                    ...formData.selectedTechnicalStrategies,
                    customStrategy,
                ],
                customTechnicalStrategy: "",
            });
        }
    };

    const handleNext = () => {
        if (step === 1 && formData.name && formData.description) {
            setStep(2);
        } else if (step === 2) {
            setShowDepositModal(true);
        }
    };

    const handleDeposit = async () => {
        // TODO: Implement wallet integration
        // For now, just create the strategy
        const newStrategy: Strategy = {
            id: `strategy-${Date.now()}`,
            name: formData.name,
            description: formData.description,
            agenticConfig: {
                weightage: formData.agenticWeightage,
                prompt: formData.agenticPrompt,
            },
            technicalStrategies: formData.selectedTechnicalStrategies,
            riskLevel: formData.riskLevel,
            visibility: formData.visibility,
            depositAmount: parseFloat(formData.depositAmount),
            status: "active",
            createdAt: new Date(),
            totalPnl: 0,
            totalPnlPercentage: 0,
            accuracy: 0,
            winRate: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            openPositions: [],
            closedPositions: [],
            agenticDecisions: [],
        };

        // Save to localStorage
        const savedStrategies = localStorage.getItem("user_strategies");
        const strategies = savedStrategies ? JSON.parse(savedStrategies) : [];
        strategies.push(newStrategy);
        localStorage.setItem("user_strategies", JSON.stringify(strategies));

        // Redirect to strategies page
        router.push("/strategies");
    };

    const isStep1Valid = formData.name.trim() && formData.description.trim();
    const isStep2Valid = formData.depositAmount && parseFloat(formData.depositAmount) > 0;

    return (
        <Layout title="Create Strategy">
            <div className="max-w-4xl mx-auto">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div
                            className={`flex items-center flex-1 ${
                                step >= 1 ? "text-primary-1" : "text-theme-tertiary"
                            }`}
                        >
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                    step >= 1
                                        ? "bg-primary-1 text-white"
                                        : "bg-theme-on-surface-2 text-theme-tertiary"
                                }`}
                            >
                                {step > 1 ? (
                                    <Icon className="w-5 h-5 fill-white" name="check" />
                                ) : (
                                    "1"
                                )}
                            </div>
                            <span className="ml-3 text-base-2 font-semibold">
                                Strategy Details
                            </span>
                        </div>
                        <div className="h-0.5 flex-1 bg-theme-stroke mx-4"></div>
                        <div
                            className={`flex items-center flex-1 ${
                                step >= 2 ? "text-primary-1" : "text-theme-tertiary"
                            }`}
                        >
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                    step >= 2
                                        ? "bg-primary-1 text-white"
                                        : "bg-theme-on-surface-2 text-theme-tertiary"
                                }`}
                            >
                                2
                            </div>
                            <span className="ml-3 text-base-2 font-semibold">
                                Configuration & Deposit
                            </span>
                        </div>
                    </div>
                </div>

                {/* Step 1: Strategy Details */}
                {step === 1 && (
                    <Card>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-h6 text-theme-primary mb-4">
                                    Basic Information
                                </h3>
                                <Field
                                    label="Strategy Name"
                                    placeholder="e.g., Bitcoin Scalping Strategy"
                                    value={formData.name}
                                    onChange={(e) =>
                                        handleInputChange("name", e.target.value)
                                    }
                                    note="Give your strategy a descriptive name"
                                />
                            </div>

                            <Field
                                label="Description"
                                placeholder="Describe your trading strategy and objectives..."
                                textarea
                                value={formData.description}
                                onChange={(e) =>
                                    handleInputChange("description", e.target.value)
                                }
                                note="Explain what this strategy aims to achieve"
                            />

                            <div>
                                <h3 className="text-h6 text-theme-primary mb-4 mt-8">
                                    Sentiment Analysis
                                </h3>
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <Text className="text-base-2 text-theme-secondary">
                                            Agentic Weightage
                                        </Text>
                                        <Text className="text-title-2 text-theme-primary font-semibold">
                                            {formData.agenticWeightage}%
                                        </Text>
                                    </div>
                                    <Box px={2}>
                                        <Slider
                                            value={formData.agenticWeightage}
                                            onChange={(value) =>
                                                handleInputChange("agenticWeightage", value)
                                            }
                                            min={0}
                                            max={100}
                                            step={1}
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
                                    <div className="flex justify-between text-caption-2 text-theme-tertiary mt-2">
                                        <span>0%</span>
                                        <span>50%</span>
                                        <span>100%</span>
                                    </div>
                                    <div className="mt-3 text-caption-2 text-theme-tertiary">
                                        Higher weightage means the AI has more influence on trading decisions
                                    </div>
                                </div>

                                <Field
                                    label="Agentic Prompt (Optional)"
                                    placeholder="Enter specific instructions for the AI agent..."
                                    textarea
                                    value={formData.agenticPrompt}
                                    onChange={(e) =>
                                        handleInputChange("agenticPrompt", e.target.value)
                                    }
                                    note="Customize how the AI should analyze market conditions and make decisions"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={() => router.back()}
                                    className="px-6 py-3 text-base-2 text-theme-secondary border border-theme-stroke rounded-xl hover:bg-theme-on-surface-2 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!isStep1Valid}
                                    className={`px-6 py-3 text-base-2 text-white rounded-xl transition-colors ${
                                        isStep1Valid
                                            ? "bg-primary-1 hover:bg-primary-2"
                                            : "bg-theme-on-surface-2 text-theme-tertiary cursor-not-allowed"
                                    }`}
                                >
                                    Next Step
                                </button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Step 2: Configuration */}
                {step === 2 && (
                    <div className="space-y-6">
                        <Card title="Technical Strategies">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-base-2 text-theme-secondary mb-4">
                                        Select one or more technical analysis strategies to combine with AI insights
                                    </p>
                                    <TechnicalStrategySelector
                                        strategies={TECHNICAL_STRATEGIES}
                                        selectedStrategies={formData.selectedTechnicalStrategies}
                                        onToggle={handleTechnicalStrategyToggle}
                                    />
                                </div>

                                <div>
                                    <div className="text-base-2 text-theme-primary mb-2">
                                        Or Add Custom Strategy
                                    </div>
                                    <div className="flex gap-3">
                                        <Field
                                            className="flex-1"
                                            placeholder="Describe your custom technical strategy..."
                                            textarea
                                            value={formData.customTechnicalStrategy}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "customTechnicalStrategy",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <button
                                            onClick={handleAddCustomStrategy}
                                            disabled={!formData.customTechnicalStrategy.trim()}
                                            className={`self-start px-4 py-3 rounded-xl transition-colors ${
                                                formData.customTechnicalStrategy.trim()
                                                    ? "bg-primary-1 hover:bg-primary-2 text-white"
                                                    : "bg-theme-on-surface-2 text-theme-tertiary cursor-not-allowed"
                                            }`}
                                        >
                                            <Icon className="w-5 h-5 fill-current" name="plus" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Risk & Visibility">
                            <div className="space-y-6">
                                <div>
                                    <div className="text-base-2 text-theme-primary mb-3">
                                        Risk Level
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {(["low", "medium", "high"] as RiskLevel[]).map(
                                            (risk) => (
                                                <button
                                                    key={risk}
                                                    onClick={() =>
                                                        handleInputChange("riskLevel", risk)
                                                    }
                                                    className={`p-4 rounded-xl border-2 transition-all ${
                                                        formData.riskLevel === risk
                                                            ? "border-primary-1 bg-primary-1/10"
                                                            : "border-theme-stroke hover:border-theme-secondary"
                                                    }`}
                                                >
                                                    <div className="text-title-2 text-theme-primary mb-1 capitalize">
                                                        {risk}
                                                    </div>
                                                    <div className="text-caption-2 text-theme-tertiary">
                                                        {risk === "low" &&
                                                            "Conservative approach"}
                                                        {risk === "medium" &&
                                                            "Balanced risk-reward"}
                                                        {risk === "high" &&
                                                            "Aggressive trading"}
                                                    </div>
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-base-2 text-theme-primary mb-3">
                                        Visibility
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(["private", "public"] as VisibilityType[]).map(
                                            (visibility) => (
                                                <button
                                                    key={visibility}
                                                    onClick={() =>
                                                        handleInputChange(
                                                            "visibility",
                                                            visibility
                                                        )
                                                    }
                                                    className={`p-4 rounded-xl border-2 transition-all ${
                                                        formData.visibility === visibility
                                                            ? "border-primary-1 bg-primary-1/10"
                                                            : "border-theme-stroke hover:border-theme-secondary"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icon
                                                            className="w-4 h-4 fill-theme-primary"
                                                            name={
                                                                visibility === "public"
                                                                    ? "eye"
                                                                    : "lock"
                                                            }
                                                        />
                                                        <div className="text-title-2 text-theme-primary capitalize">
                                                            {visibility}
                                                        </div>
                                                    </div>
                                                    <div className="text-caption-2 text-theme-tertiary text-left">
                                                        {visibility === "private" &&
                                                            "Only visible to you"}
                                                        {visibility === "public" &&
                                                            "Share with community"}
                                                    </div>
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Deposit Amount">
                            <div className="space-y-4">
                                <Field
                                    label="Initial Deposit (USD)"
                                    type="number"
                                    placeholder="1000"
                                    value={formData.depositAmount}
                                    onChange={(e) =>
                                        handleInputChange("depositAmount", e.target.value)
                                    }
                                    note="Minimum deposit: $100"
                                />
                                {parseFloat(formData.depositAmount) > 0 && (
                                    <div className="p-4 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                                        <div className="text-caption-2 text-theme-tertiary mb-2">
                                            Estimated Position Sizes
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <div className="text-caption-2 text-theme-tertiary">
                                                    Low Risk
                                                </div>
                                                <div className="text-base-2 text-theme-primary">
                                                    $
                                                    {(
                                                        parseFloat(formData.depositAmount) *
                                                        0.02
                                                    ).toFixed(2)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-caption-2 text-theme-tertiary">
                                                    Medium Risk
                                                </div>
                                                <div className="text-base-2 text-theme-primary">
                                                    $
                                                    {(
                                                        parseFloat(formData.depositAmount) *
                                                        0.05
                                                    ).toFixed(2)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-caption-2 text-theme-tertiary">
                                                    High Risk
                                                </div>
                                                <div className="text-base-2 text-theme-primary">
                                                    $
                                                    {(
                                                        parseFloat(formData.depositAmount) *
                                                        0.1
                                                    ).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <div className="flex justify-between pt-4">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-3 text-base-2 text-theme-secondary border border-theme-stroke rounded-xl hover:bg-theme-on-surface-2 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!isStep2Valid}
                                className={`px-6 py-3 text-base-2 text-white rounded-xl transition-colors ${
                                    isStep2Valid
                                        ? "bg-primary-1 hover:bg-primary-2"
                                        : "bg-theme-on-surface-2 text-theme-tertiary cursor-not-allowed"
                                }`}
                            >
                                Review & Deposit
                            </button>
                        </div>
                    </div>
                )}

                {/* Deposit Modal */}
                {showDepositModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-theme-on-surface-1 rounded-2xl p-8 max-w-md w-full mx-4">
                            <h3 className="text-h5 text-theme-primary mb-4">
                                Confirm Deposit
                            </h3>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-base-2 text-theme-secondary">
                                        Strategy
                                    </span>
                                    <span className="text-base-2 text-theme-primary font-semibold">
                                        {formData.name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-2 text-theme-secondary">
                                        Deposit Amount
                                    </span>
                                    <span className="text-title-1 text-theme-primary font-semibold">
                                        ${parseFloat(formData.depositAmount).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <p className="text-caption-2 text-theme-tertiary mb-6">
                                Connect your wallet to deposit funds and activate your
                                strategy. The strategy will start trading automatically once
                                the deposit is confirmed.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDepositModal(false)}
                                    className="flex-1 px-6 py-3 text-base-2 text-theme-secondary border border-theme-stroke rounded-xl hover:bg-theme-on-surface-2 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeposit}
                                    className="flex-1 px-6 py-3 text-base-2 text-white bg-primary-1 rounded-xl hover:bg-primary-2 transition-colors"
                                >
                                    Connect Wallet & Deposit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CreateStrategyPage;
