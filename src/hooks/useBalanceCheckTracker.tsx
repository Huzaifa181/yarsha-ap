import { useState, useEffect } from "react";

const useBalanceChangeTracker = (balanceUSD: number | null) => {
    const [balanceHistory, setBalanceHistory] = useState<{ timestamp: number; value: number }[]>([]);
    const [percentageChange, setPercentageChange] = useState<number | null>(null);
    const [changeType, setChangeType] = useState<"increase" | "decrease" | "no change" | null>(null);

    
    // console.log("🚀 ~ file: useBalanceChangeTracker.tsx ~ line 9 ~ balanceHistory", balanceHistory);
    // console.log("🚀 ~ file: useBalanceChangeTracker.tsx ~ line 10 ~ balanceUSD", balanceUSD);

    useEffect(() => {
        if (balanceUSD !== null) {
            const now = Date.now();

            setBalanceHistory((prev) => {
                const filteredHistory = [...prev, { timestamp: now, value: balanceUSD }]
                    .filter(entry => now - entry.timestamp <= 5000);

                const oldEntry = filteredHistory[0];

                if (oldEntry && oldEntry.value !== 0) {
                    const change = ((balanceUSD - oldEntry.value) / oldEntry.value) * 100;
                    setPercentageChange(change);

                    if (change > 0) {
                        setChangeType("increase");
                    } else if (change < 0) {
                        setChangeType("decrease");
                    } else {
                        setChangeType("no change");
                    }
                }

                return filteredHistory;
            });
        }
    }, [balanceUSD]);

    return { percentageChange, changeType };
};

export default useBalanceChangeTracker;
