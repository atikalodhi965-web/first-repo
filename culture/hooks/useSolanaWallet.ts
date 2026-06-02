"use client";

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
    LAMPORTS_PER_SOL, 
    Transaction, 
    VersionedTransaction, 
    PublicKey,
    TransactionSignature
} from '@solana/web3.js';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useSolanaWallet = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, signTransaction, signAllTransactions, connected, wallet, disconnect } = useWallet();
    const [balance, setBalance] = useState<number | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    const fetchBalance = useCallback(async () => {
        if (!publicKey) {
            setBalance(null);
            return;
        }

        setLoadingBalance(true);
        try {
            const bal = await connection.getBalance(publicKey);
            setBalance(bal / LAMPORTS_PER_SOL);
        } catch (error) {
            console.error('Error fetching balance:', error);
            setBalance(0);
        } finally {
            setLoadingBalance(false);
        }
    }, [connection, publicKey]);

    useEffect(() => {
        if (connected) {
            fetchBalance();
        } else {
            setBalance(null);
        }
    }, [connected, fetchBalance]);

    /**
     * Handle serialized transactions from backend
     * Supports both Legacy and Versioned transactions
     */
    const processSerializedTransaction = useCallback(async (serializedBase64: string): Promise<TransactionSignature | null> => {
        if (!publicKey || !sendTransaction) {
            toast.error("Wallet not connected");
            return null;
        }

        try {
            const buffer = Buffer.from(serializedBase64, 'base64');
            
            // Try to detect if it's a versioned transaction
            let transaction: Transaction | VersionedTransaction;
            try {
                transaction = VersionedTransaction.deserialize(buffer);
            } catch (e) {
                transaction = Transaction.from(buffer);
            }

            toast.info("Signing transaction...");
            
            const signature = await sendTransaction(transaction, connection);
            
            toast.info("Transaction sent. Confirming...");
            
            const latestBlockhash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                signature,
                ...latestBlockhash
            }, 'confirmed');

            toast.success("Transaction confirmed!");
            fetchBalance(); // Update balance after transaction
            
            return signature;
        } catch (error: any) {
            console.error('Transaction error:', error);
            toast.error(error.message || "Transaction failed");
            return null;
        }
    }, [publicKey, sendTransaction, connection, fetchBalance]);

    return {
        publicKey,
        connected,
        wallet,
        balance,
        loadingBalance,
        fetchBalance,
        processSerializedTransaction,
        sendTransaction,
        signTransaction,
        signAllTransactions,
        disconnect
    };
};
