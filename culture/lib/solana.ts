import { Connection, PublicKey } from '@solana/web3.js';

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export const getSolanaConnection = () => {
    return new Connection(SOLANA_RPC_URL, 'confirmed');
};

export const isValidPublicKey = (key: string) => {
    try {
        new PublicKey(key);
        return true;
    } catch {
        return false;
    }
};

export const shortenAddress = (address: string, chars = 4) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};
