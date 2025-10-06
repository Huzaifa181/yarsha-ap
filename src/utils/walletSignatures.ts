import {
    Connection,
    PublicKey,
    VersionedTransactionResponse,
    clusterApiUrl,
    type SignaturesForAddressOptions
} from '@solana/web3.js';


const CUSTOM_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=6004030a-3415-45b4-8511-113586ac0800';

const connection = new Connection(CUSTOM_RPC_URL, 'confirmed');

/**
 * Fetch recent transaction signatures for a given public key and limit.
 *
 * @param address - The public key to fetch signatures for.
 * @param limit - Maximum number of signatures to retrieve.
 * @returns A list of signature info objects.
 */
export const getSignatures = async (address: PublicKey, limit: number = 1) => {
  const signaturesOptions: SignaturesForAddressOptions = {
    limit,
  };

  try {
    const signatures = await connection.getSignaturesForAddress(
      address,
      signaturesOptions,
    );
    return signatures;
  } catch (error) {
    console.error('Error fetching signatures:', error);
    return [];
  }
};

/**
 * Fetch full transaction detail for a signature.
 * @param signature - Transaction signature
 */
export const getTransactionDetails = async (signature: string) => {
  try {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    return tx;
  } catch (error) {
    console.error(`Failed to fetch transaction for ${signature}:`, error);
    return null;
  }
};

const getTransactionType = (balanceChange: number) => {
  if (balanceChange > 0) return 'Received';
  if (balanceChange < 0) return 'Sent';
  return 'Unknown';
};

type DetailedTransaction = {
  signature: string;
  details: VersionedTransactionResponse | null;
};

export type TransformedTransaction = {
  signature: string;
  type: 'Sent' | 'Received';
  token: string;
  amount: number;
  symbol: string;
  displayAmount: string;
  direction: 'in' | 'out';
  status: 'success' | 'failed';
  counterparty: string;
  timestamp: string;
  icon: string;
};

export const transformTransactionData = (
  tx: DetailedTransaction,
  userAddress: string,
): TransformedTransaction | null => {
  const { details, signature } = tx;

  if (!details || !details.meta || !details.transaction || !details.blockTime) {
    return null;
  }

  const { transaction, meta, blockTime } = details;

  const accountKeys = transaction.message
    .getAccountKeys()
    .staticAccountKeys.map((key: PublicKey) => key.toBase58());

  const userIndex = accountKeys.findIndex((key) => key === userAddress);

  if (userIndex === -1) {
    console.warn(`User address ${userAddress} not found in account keys`);
    return null;
  }

  const balanceChange = meta.postBalances[userIndex] - meta.preBalances[userIndex];
  const amount = Math.abs(balanceChange / 1e9); 

  const type = balanceChange > 0 ? 'Received' : 'Sent';
  const direction = balanceChange > 0 ? 'in' : 'out';

  const counterparty =
    accountKeys.find((key, idx) => idx !== userIndex && key !== userAddress) || 'Unknown';

  return {
    signature,
    type,
    token: 'SOL',
    amount,
    symbol: 'SOL',
    displayAmount: `${balanceChange > 0 ? '+' : '-'}${amount.toFixed(6)} SOL`,
    direction,
    status: meta.err ? 'failed' : 'success',
    counterparty,
    timestamp: new Date(blockTime * 1000).toISOString(),
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  };
};
