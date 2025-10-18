import { useState } from "react";
import CurrencyInput from "react-currency-input-field";

type DepositProps = {};

const Deposit = ({}: DepositProps) => {
    const [amount, setAmount] = useState<string>("");

    const handleDeposit = () => {
        if (amount && parseFloat(amount) > 0) {
            console.log("Depositing:", amount, "USDC");
            // Add your deposit logic here
        }
    };

    return (
        <>
            <div className="mb-6 text-title-1s">
                Deposit{" "}
                <span className="text-theme-tertiary">USDC</span>
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
            </div>
            <button
                className="btn-primary w-full mt-6"
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0}
            >
                Deposit
            </button>
        </>
    );
};

export default Deposit;