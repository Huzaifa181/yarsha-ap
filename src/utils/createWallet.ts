import { APP_CLUSTER, RPC_URL, SOLANA_DERIVATION_PATH } from "@/config";
import {
  Connection,
  Keypair,
  PublicKey,
  RpcResponseAndContext,
  SendTransactionError,
  SimulatedTransactionResponse,
  SystemProgram,
  Transaction,
  VersionedTransaction,
  Signer,
  Commitment,
} from "@solana/web3.js";
import { TokenListProvider, TokenInfo, ENV } from '@solana/spl-token-registry';
import { PythHttpClient, getPythClusterApiUrl, getPythProgramKeyForCluster, PythCluster } from '@pythnetwork/client'
import * as bip39 from "bip39";
import nacl from "tweetnacl";
import { Base64 } from "js-base64";
import log from "./logger";
import { createClusterConnection } from "./connection";

/**
 * Generates a new BIP-39 mnemonic phrase.
 *
 * @returns {Promise<string>} A promise that resolves to a string representing the mnemonic phrase.
 */
export const generateMnemonic = async (): Promise<string> => {
  const mnemonic = bip39.generateMnemonic();
  return mnemonic;
};


/**
 * Fetches the balance of a given Solana `PublicKey`.
 *
 * @param {PublicKey} publicKey - The public key of the Solana account.
 * @returns {Promise<number>} A promise that resolves to a number representing the balance in lamports.
 */
export const getBalance = async (publicKey: PublicKey): Promise<number> => {
  const connection = new Connection(RPC_URL as string);
  const balance = await connection.getBalance(publicKey);
  return balance;
};

/**
 * Signs a given nonce with the provided Solana `Keypair`.
 *
 * This function creates a signature for a given nonce (message) using the secret key
 * of the provided `Keypair`. The signature is returned in base58 format.
 *
 * @param {Keypair} keypair - The Solana keypair used to sign the nonce. The secret key should be a `Uint8Array`.
 * @param {string} nonce - The nonce (message) that needs to be signed. It should be a string.
 * @returns {string} The signature in base58 format.
 *
 * @example
 * const keypair = Keypair.generate(); // Or load from a secret key
 * const nonce = "your-nonce-string";
 * const signature = signNonce(keypair, nonce);
 * console.log("Signature:", signature);
 */
export const signNonce = (keypair: Keypair, nonce: string): string => {
  // Encode the nonce to a UTF-8 byte array
  const message = new TextEncoder().encode(nonce);

  // Sign the message using the keypair's secret key
  const signature = nacl.sign.detached(message, keypair.secretKey);

  // Verify the signature (optional, for debugging)
  const isVerified = nacl.sign.detached.verify(
    message,
    signature,
    keypair.publicKey.toBytes()
  );
  console.log("Signature verified:", isVerified);

  // Return the signature encoded in Base64 format using js-base64
  return Base64.fromUint8Array(signature);
};

// /**
//  * Sends SOL from one Solana account to another.
//  *
//  * @param {Keypair} senderKeypair - The sender's keypair.
//  * @param {string} recipientAddress - The recipient's public key (as a string).
//  * @param {number} solAmount - The amount of SOL to send.
//  * @returns {Promise<string>} A promise that resolves to the transaction signature.
//  */
// export const sendSol = async ({
//   recipientAddress,
//   solAmount,
//   senderAmount
// }: {
//   recipientAddress: string;
//   solAmount: number;
//   senderAmount: number;
// }): Promise<string> => {
//   try {

//     const senderBalance = senderAmount;
//     console.log("Sender's balance:", senderBalance, "SOL");

//     if (senderBalance < solAmount) {
//       throw new Error(
//         `Insufficient balance: You have ${senderBalance} SOL but you are trying to send ${solAmount} SOL.`
//       );
//     }
//     const sendSolPayload = {
//       recipientAddress: recipientAddress,
//       amount: solAmount,
//       clusterString: APP_CLUSTER
//     }
//     const sendSolResponse = await callCloudFunction<any, any>("sendSolAction", sendSolPayload)
//     console.log("sendSolResponse", sendSolResponse)

//     return sendSolResponse?.transactionHash;
//   } catch (error: any) {
//     if (error instanceof SendTransactionError) {
//       console.log("error==>", error);
//     }
//     console.error("Error sending SOL:", error);
//     console.error("Error sending SOLs:", error?.message);
//     throw error.message;
//   }
// };

// export const sendSplToken = async ({
//   recipientAddress,
//   solAmount,
//   senderAmount,
//   mintAddress,
//   decimal
// }: {
//   recipientAddress: string;
//   solAmount: number;
//   senderAmount: number;
//   mintAddress: string;
//   decimal: number;
// }): Promise<string> => {
//   try {

//     const senderBalance = senderAmount;
//     console.log("Sender's balance:", senderBalance, "SOL");

//     if (senderBalance < solAmount) {
//       throw new Error(
//         `Insufficient balance: You have ${senderBalance} SOL but you are trying to send ${solAmount} SOL.`
//       );
//     }
//     const sendSplPayload = {
//       recipientWalletAddress: recipientAddress,
//       amount: (solAmount * Math.pow(10, decimal))?.toString(),
//       mintAddress,
//       clusterString: APP_CLUSTER
//     }
//     console.log("sendSplPayload", sendSplPayload)
//     const sendSplResponse = await callCloudFunction<any, any>("sendSolanaTokensAction", sendSplPayload)
//     console.log("sendSplResponse", sendSplResponse)

//     return sendSplResponse?.signature;
//   } catch (error: any) {
//     if (error instanceof SendTransactionError) {
//       console.log("error==>", error);
//     }
//     console.error("Error sending SOL:", error);
//     console.error("Error sending SOLs:", error?.message);
//     throw error.message;
//   }
// };

const TOKEN_LIST_URL =
  "https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json";

const fetchTokens = async (network: "mainnet" | "devnet") => {
  let tokenMap: Map<string, TokenInfo> = new Map();

  try {
    const tokens = await new TokenListProvider().resolve();
    const tokenList = tokens.filterByChainId(ENV.MainnetBeta).getList();

    tokenMap = tokenList.reduce((map, item) => {
      map.set(item.address, item);
      return map;
    }, new Map());

    return tokenMap;
  } catch (error) {
    console.error('Error fetching token list:', error);
    return null;
  }
};

export const getTokenBalancesWithDetails = async (
  walletAddress: string,
  network: "mainnet" | "devnet"
) => {
  try {
    console.log("getTokenBalancesWithDetails")
    const connection = new Connection(RPC_URL, "confirmed");

    const publicKey = new PublicKey(walletAddress);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    });


    const tokenMap = await fetchTokens(network);
    const balances = tokenAccounts.value.map((account) => {
      const tokenInfo = account.account.data.parsed.info;
      const mintAddress = tokenInfo.mint;
      const tokenMetadata = tokenMap?.get(mintAddress);

      return {
        mint: mintAddress,
        balance: tokenInfo.tokenAmount.uiAmount,
        decimals: tokenInfo.tokenAmount.decimals,
        symbol: tokenMetadata?.symbol || "Unknown",
        name: tokenMetadata?.name || "Unknown Token",
        logo: tokenMetadata?.logoURI,
      };
    });

    let tokenPrices: Record<string, number> = {};
    try {
      tokenPrices = await fetchTokenPrices(balances.map((b) => b.symbol));

    } catch (priceError) {
      console.warn("Failed to fetch token prices, proceeding with 0 prices.", priceError);
    }
    const balancesWithPrices = balances.map((balance) => ({
      ...balance,
      usdValue: balance.balance * (tokenPrices[balance.symbol?.toLowerCase()] || 0),
    }));

    return balancesWithPrices;
  } catch (error) {
    console.error("Error fetching token balances:", error);
    return [];
  }
};

export const fetchTokenPrices = async (symbols: string[]): Promise<Record<string, number>> => {
  try {
    const PYTHNET_CLUSTER_NAME: PythCluster = 'devnet';
    const connection = new Connection(getPythClusterApiUrl(PYTHNET_CLUSTER_NAME));
    const pythPublicKey = getPythProgramKeyForCluster(PYTHNET_CLUSTER_NAME);
    const pythClient = new PythHttpClient(connection, pythPublicKey);
    const data = await pythClient.getData();
    const normalizedSymbols = symbols.map((sym) => `Crypto.${sym.toUpperCase()}/USD`);

    const prices: Record<string, number> = {};

    for (const symbol of normalizedSymbols) {
      const price = data.productPrice.get(symbol);

      if (price && price?.aggregate && price?.aggregate?.price !== undefined) {
        const originalSymbol = symbol.split('.')[1]?.split('/')[0]?.toLowerCase();
        if (originalSymbol) {
          prices[originalSymbol] = price.aggregate.price;
        }
      } else {
        console.warn(`${symbol}: Price currently unavailable or invalid.`);
      }
    }

    return prices;
  } catch (error) {
    console.error("Error fetching token prices:", error);
    return {};
  }
};



/**
 * Check the balance of a given public key on Solana's devnet.
 *
 * @param {PublicKey} publicKey - The public key of the account.
 * @returns {Promise<number>} - The balance in lamports.
 */
export const checkBalance = async (publicKey: PublicKey): Promise<number> => {
  const connection = await createClusterConnection();
  if (!connection) throw new Error("No blockchain connection available");
  const balance = await connection.getBalance(publicKey);
  return balance / 1e9;
};

export const getNetworkFee = async (publicKey: PublicKey): Promise<number | undefined> => {
  try {
    const connection = await createClusterConnection();
    if (!connection) throw new Error("No blockchain connection available");

    const { blockhash } = await connection.getLatestBlockhash();

    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    const feeCalculator = await connection.getFeeForMessage(transaction.compileMessage());

    const feeInLamports = feeCalculator.value;

    if (feeInLamports) {
      const feeInSOL = feeInLamports / 1e9;
      return feeInSOL;
    } else {
      return undefined;
    }
  }
  catch (error) {
    console.log("error", error);
    throw error;
  }
};

export const simulateSendSol = async ({
  senderKeypair,
  recipientAddress,
  solAmount,
}: {
  senderKeypair: Keypair;
  recipientAddress: string;
  solAmount: number;
}): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> => {
  try {
    const connection = await createClusterConnection();
    if (!connection) throw new Error("No blockchain connection available");
    // Check sender balance before sending
    const senderBalance = await connection.getBalance(senderKeypair.publicKey);

    if (senderBalance < solAmount * 1e9) {
      throw new Error(
        `Insufficient balance: You have ${senderBalance / 1e9} SOL but you are trying to send ${solAmount} SOL.`
      );
    }
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports: solAmount * 1e9,
      })
    );
    const simulationResult = await connection.simulateTransaction(transaction, [senderKeypair]);

    console.log("Transaction simulated:", simulationResult);
    return simulationResult;
  } catch (error: any) {
    if (error instanceof SendTransactionError) {
      console.log("error==>", error);
      // const logs = await error.getLogs();
      // console.error("Transaction failed logs:", logs);
    }
    console.error("Error sending SOL:", error);
    console.error("Error sending SOLs:", error?.message);
    throw error.message;
  }
};


/**
 * Recheck the balance of a given Solana `wallet address`.
 *
 * @param {PublicKey} string - The public key of the Solana account.
 * @returns {Promise<number>} A promise that resolves to a number representing the balance in lamports.
 */
export const reCheckBalance = async (publicKey: string): Promise<number> => {
  const connection = new Connection(RPC_URL as string);
  const publicKeyInfo = new PublicKey(publicKey)
  const balance = await connection.getBalance(publicKeyInfo);
  return balance;
};


/**
 * Sign, send and confirm a VersionedTransaction encoded in Base64.
 *
 * @param transactionBase64 - The Base64 string of a serialized VersionedTransaction
 * @param payer - A Signer (e.g. Keypair) that will pay for and sign the transaction
 * @param connection - An existing Solana Connection
 * @param commitment - Optional commitment level (defaults to "finalized")
 * @returns The transaction signature string
 * @throws If the transaction fails, throws an Error with the RPC error plus a Solscan link
 */
export async function processTransaction(
  transactionBase64: string,
  payer: Signer,
  connection: Connection,
  commitment: Commitment = "finalized"
): Promise<string> {
  console.log("transactionBase64", transactionBase64);
  // Deserialize from Base64
  const tx = VersionedTransaction.deserialize(
    Buffer.from(transactionBase64, "base64")
  );

  console.log("tx", tx);

  const response = await getNetworkFee(payer.publicKey);
  console.log("response", response);
  // Sign it

  console.log("signing tx", payer);

  tx.sign([payer]);

  // Serialize to wire format
  const wireTransaction = tx.serialize();

  console.log("wireTransaction", wireTransaction);

  // Send it
  const signature = await connection.sendRawTransaction(wireTransaction, {
    maxRetries: 2,
    skipPreflight: true,
  });

  console.log("signature", signature);

  // Confirm it
  const confirmation = await connection.confirmTransaction(
    signature,
    commitment
  );

  console.log("confirmation", confirmation);

  // Check for errors
  if (confirmation.value.err) {
    throw new Error(
      `Transaction failed: ${JSON.stringify(
        confirmation.value.err
      )}\nhttps://solscan.io/tx/${signature}/`
    );
  }

  console.log(`Transaction successful: https://solscan.io/tx/${signature}/`);
  return signature;
}