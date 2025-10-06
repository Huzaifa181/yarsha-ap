import { useEffect, useMemo, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import {  API_MAIN_NET } from "@/config";
import NetInfo from '@react-native-community/netinfo';
import { useDispatch } from "./reduxHooks";
import { setSolanaBalance } from "@/store/slices";


const LAMPORTS_PER_SOL = 1_000_000_000;
export const reCheckBalance = async (publicKey: string): Promise<number> => {
    try {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            console.log("❌ No internet connection");
            return 0;
        }

        const connection = new Connection(API_MAIN_NET);
        const publicKeyInfo = new PublicKey(publicKey);

        const balance = await connection.getBalance(publicKeyInfo);
        console.log(`✅ Balance fetched: ${balance / LAMPORTS_PER_SOL} SOL`);

        return balance / LAMPORTS_PER_SOL;
    } catch (error) {
        console.error("❌ Error fetching balance:", error);
        return 0;
    }
};

const useSolanaBalance = (publicKey: string | null) => {
    const [balance, setBalance] = useState<number | null>(null);
    const dispatch = useDispatch();

    const connection = useMemo(() => new Connection(API_MAIN_NET), [API_MAIN_NET]);

    useEffect(() => {
        if (!publicKey) {
            setBalance(null);
            dispatch(setSolanaBalance(null)); 
            return;
        }

        let subscriptionId: number | undefined;

        const fetchBalance = async () => {
            try {
                const netInfo = await NetInfo.fetch();
                if (!netInfo.isConnected) {
                    console.log("❌ No internet connection");
                    setBalance(null);
                    dispatch(setSolanaBalance(null)); 
                    return;
                }

                const publicKeyInfo = new PublicKey(publicKey);
                const balanceLamports = await connection.getBalance(publicKeyInfo);
                const balanceSol = balanceLamports / LAMPORTS_PER_SOL;

                setBalance(balanceSol);
                console.log("sol balance ", balanceSol)
                dispatch(setSolanaBalance(balanceSol)); 

                console.log(`✅ Initial balance: ${balanceSol} SOL`);
            } catch (error) {
                console.error("❌ Error fetching balance:", error);
            }
        };

        const subscribeToBalanceChanges = () => {
            try {
                const publicKeyInfo = new PublicKey(publicKey);
                subscriptionId = connection.onAccountChange(publicKeyInfo, async (accountInfo) => {
                    const newBalanceSol = accountInfo.lamports / LAMPORTS_PER_SOL;
                    setBalance(newBalanceSol);
                    console.log("new balance ", newBalanceSol)
                    dispatch(setSolanaBalance(newBalanceSol))

                    console.log(`🔄 Balance updated: ${newBalanceSol} SOL`);
                });
            } catch (error) {
                console.error("❌ Error subscribing to balance changes:", error);
            }
        };

        fetchBalance();
        subscribeToBalanceChanges();

        return () => {
            if (subscriptionId !== undefined) {
                connection.removeAccountChangeListener(subscriptionId);
                console.log("🛑 Unsubscribed from balance updates");
            }
        };
    }, [publicKey, API_MAIN_NET, dispatch]);

    return balance;
};

export default useSolanaBalance;
