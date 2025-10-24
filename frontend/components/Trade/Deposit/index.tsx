import { useState, useEffect } from "react";
import CurrencyInput from "react-currency-input-field";
import { BridgeButton, useNexus } from "@avail-project/nexus-widgets";
import { useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom } from "viem";
import { arbitrumSepolia } from "viem/chains";

type DepositProps = {};

const VAULT_ADDRESS = "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89";

const Deposit = ({}: DepositProps) => {
    const [amount, setAmount] = useState<string>("");
    const [depositStep, setDepositStep] = useState<"bridge" | "transfer">("bridge");
    const [isTransferring, setIsTransferring] = useState(false);
    const [providerReady, setProviderReady] = useState(false);
    const { wallets } = useWallets();
    const { setProvider } = useNexus();

    // Ensure Nexus provider is connected when component mounts
    useEffect(() => {
        const connectProvider = async () => {
            if (wallets[0]) {
                try {
                    const provider = await wallets[0].getEthereumProvider();
                    setProvider(provider);
                    setProviderReady(true);
                } catch (error) {
                    console.error("Failed to connect Nexus provider:", error);
                }
            }
        };
        connectProvider();
    }, [wallets, setProvider]);

    const handleSecondaryTransfer = async () => {
        if (!amount || parseFloat(amount) <= 0) return;

        try {
            setIsTransferring(true);
            const wallet = wallets[0];
            if (!wallet) {
                alert("No wallet connected");
                return;
            }

            const provider = await wallet.getEthereumProvider();
            const walletClient = createWalletClient({
                account: wallet.address as `0x${string}`,
                chain: arbitrumSepolia,
                transport: custom(provider),
            });

            // USDC contract address on Arbitrum Sepolia
            const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

            // ERC20 Transfer ABI
            const transferAbi = [
                {
                    name: "transfer",
                    type: "function",
                    stateMutability: "nonpayable",
                    inputs: [
                        { name: "to", type: "address" },
                        { name: "amount", type: "uint256" },
                    ],
                    outputs: [{ type: "bool" }],
                },
            ] as const;

            // Convert amount to proper decimals (USDC has 6 decimals)
            const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

            const hash = await walletClient.writeContract({
                address: USDC_ADDRESS,
                abi: transferAbi,
                functionName: "transfer",
                args: [VAULT_ADDRESS, amountInWei],
            });

            console.log("Transfer transaction hash:", hash);
            alert(`Transfer successful! Tx: ${hash}`);
            setAmount("");
            setDepositStep("bridge");
        } catch (error) {
            console.error("Transfer failed:", error);
            alert("Transfer failed. Please try again.");
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <>
            <div className="mb-6 text-title-1s">
                Deposit{" "}
                <span className="text-theme-tertiary">USDC</span>
            </div>

            {depositStep === "bridge" && (
                <>
                    <div className="space-y-4">
                        <CurrencyInput
                            className="input-caret-color w-full h-[6.75rem] bg-transparent border-2 border-theme-stroke rounded-3xl text-center text-h2 outline-none transition-colors placeholder:text-theme-primary focus:border-theme-brand"
                            name="amount"
                            prefix="$"
                            placeholder="$0.00"
                            decimalsLimit={2}
                            decimalSeparator="."
                            groupSeparator=","
                            onValueChange={(value) => setAmount(value || "")}
                            data-autofocus
                        />
                        <div className="flex items-center min-h-[4rem] px-5 py-4 border border-theme-stroke rounded-[1.25rem] text-base-2">
                            <div className="flex items-center shrink-0 w-24 mr-6 text-theme-secondary md:mr-3">
                                <div className="shrink-0 w-3 h-3 mr-2 rounded bg-theme-green"></div>
                                Currency
                            </div>
                            <div className="text-theme-primary">
                                USD Coin <span className="text-theme-tertiary">USDC</span>
                            </div>
                        </div>
                        <div className="flex items-center min-h-[4rem] px-5 py-4 border border-theme-stroke rounded-[1.25rem] text-base-2">
                            <div className="flex items-center shrink-0 w-24 mr-6 text-theme-secondary md:mr-3">
                                <div className="shrink-0 w-3 h-3 mr-2 rounded bg-theme-blue"></div>
                                Network
                            </div>
                            <div className="text-theme-primary">
                                Arbitrum <span className="text-theme-tertiary">Sepolia</span>
                            </div>
                        </div>
                    </div>
                    {!providerReady ? (
                        <button
                            className="btn-primary w-full mt-6"
                            disabled
                        >
                            Connecting wallet...
                        </button>
                    ) : (
                        <BridgeButton
                            prefill={{
                                chainId: 421614, // Arbitrum Sepolia
                                token: "USDC",
                                amount: amount,
                            }}
                        >
                            {({ onClick, isLoading }) => (
                                <button
                                    className="btn-primary w-full mt-6"
                                    onClick={async () => {
                                        try {
                                            await onClick();
                                            // After successful bridge, move to transfer step
                                            // Note: User needs to manually proceed after bridge completes
                                            alert("Bridge transaction submitted! Once confirmed, proceed to transfer to vault.");
                                            setDepositStep("transfer");
                                        } catch (error) {
                                            console.error("Bridge failed:", error);
                                            alert("Bridge failed. Make sure you have USDC on a supported chain.");
                                        }
                                    }}
                                    disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                                >
                                    {isLoading ? "Bridging..." : "Bridge to Arbitrum Sepolia"}
                                </button>
                            )}
                        </BridgeButton>
                    )}
                </>
            )}

            {depositStep === "transfer" && (
                <>
                    <div className="space-y-4">
                        <div className="p-6 border border-theme-stroke rounded-2xl bg-theme-on-surface-2">
                            <div className="text-sm text-theme-secondary mb-2">Amount</div>
                            <div className="text-h3 text-theme-primary">${amount} USDC</div>
                        </div>
                        <div className="flex items-center min-h-[4rem] px-5 py-4 border border-theme-stroke rounded-[1.25rem] text-base-2">
                            <div className="flex items-center shrink-0 w-24 mr-6 text-theme-secondary md:mr-3">
                                <div className="shrink-0 w-3 h-3 mr-2 rounded bg-theme-purple"></div>
                                To Vault
                            </div>
                            <div className="text-theme-primary text-xs break-all">
                                {VAULT_ADDRESS}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3 mt-6">
                        <button
                            className="btn-primary w-full"
                            onClick={handleSecondaryTransfer}
                            disabled={isTransferring}
                        >
                            {isTransferring ? "Transferring..." : "Transfer to Vault"}
                        </button>
                        <button
                            className="btn-secondary w-full"
                            onClick={() => setDepositStep("bridge")}
                            disabled={isTransferring}
                        >
                            Back
                        </button>
                    </div>
                </>
            )}
        </>
    );
};

export default Deposit;