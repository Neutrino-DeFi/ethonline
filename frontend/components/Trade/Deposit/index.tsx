import { useState, useEffect } from "react";
import CurrencyInput from "react-currency-input-field";
import { BridgeAndExecuteButton, useNexus } from "@avail-project/nexus-widgets";
import { useWallets } from "@privy-io/react-auth";

type DepositProps = {};

const VAULT_ADDRESS =
  "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89" as `0x${string}`;
// USDC contract address on Arbitrum Sepolia
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

// ERC20 Transfer ABI for the vault deposit
const TRANSFER_ABI = [
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const Deposit = ({}: DepositProps) => {
  const [amount, setAmount] = useState<string>("");
  const [providerReady, setProviderReady] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
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

  // Reset completion state when amount changes
  useEffect(() => {
    if (isComplete) {
      setIsComplete(false);
    }
  }, [amount]);

  // Build function parameters for the Bridge and Execute feature
  // This callback is used by BridgeAndExecuteButton to construct the transfer parameters
  const buildFunctionParams = (
    token: string,
    amount: string,
    chainId: number,
    userAddress: string
  ) => {
    // Convert amount to proper decimals (USDC has 6 decimals)
    const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

    return {
      functionParams: [userAddress, VAULT_ADDRESS, amountInWei],
    };
  };

  return (
    <>
      <div className="mb-6 text-title-1s">
        Deposit <span className="text-theme-tertiary">USDC</span>
      </div>

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
          value={amount}
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

      {!providerReady ? (
        <button className="btn-primary w-full mt-6" disabled>
          Connecting wallet...
        </button>
      ) : (
        <BridgeAndExecuteButton
          contractAddress={USDC_ADDRESS as `0x${string}`}
          contractAbi={TRANSFER_ABI}
          functionName="transferFrom"
          buildFunctionParams={buildFunctionParams}
          prefill={{
            toChainId: 421614, // Arbitrum Sepolia
            token: "USDC",
            amount: amount,
          }}
        >
          {({ onClick, isLoading, disabled }) => (
            <button
              className="btn-primary w-full mt-6"
              onClick={async () => {
                try {
                  await onClick();
                  // Bridge and transfer completed successfully
                  setIsComplete(true);
                  setAmount("");
                } catch (error) {
                  console.error("Bridge and Execute failed:", error);
                }
              }}
              disabled={
                !amount || parseFloat(amount) <= 0 || isLoading || disabled
              }
            >
              {isLoading
                ? "Processing..."
                : isComplete
                ? "Completed ✓"
                : "Bridge & Deposit to Vault"}
            </button>
          )}
        </BridgeAndExecuteButton>
      )}
    </>
  );
};

export default Deposit;
