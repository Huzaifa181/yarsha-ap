import { useEffect, useState, useRef } from 'react';
import BalanceStreamService from '@/services/streamingService/BalanceStreamService';

interface PriceData {
    solToUsd: string;
    publishTime: string;
    percentageChange: string;
}

const useBalanceStream = () => {
    console.log('useBalanceStream called');
    const [price, setPrice] = useState<PriceData | null>(null);
    const [difference, setDifference] = useState<number | null>(null);
    const lastSnapshotRef = useRef<{ price: PriceData; timestamp: number } | null>(null);

    useEffect(() => {
        const service = BalanceStreamService.getInstance();
        service.startStream();

        const handlePriceUpdate = (data: PriceData) => {
            const now = Date.now();
            const currentPrice = parseFloat(data.solToUsd);

            if (lastSnapshotRef.current) {
                const prevPrice = parseFloat(lastSnapshotRef.current.price.solToUsd);
                const timeDiff = now - lastSnapshotRef.current.timestamp;

                if (timeDiff >= 10000 && currentPrice !== prevPrice) {
                    setPrice(data);
                    setDifference(currentPrice - prevPrice);
                    lastSnapshotRef.current = { price: data, timestamp: now };
                }
            } else {
                setPrice(data);
                setDifference(0);
                lastSnapshotRef.current = { price: data, timestamp: now };
            }
        };

        service.addListener(handlePriceUpdate);

        return () => {
            service.removeListener(handlePriceUpdate);
        };
    }, []);

    return { price, difference };
};

export default useBalanceStream;
