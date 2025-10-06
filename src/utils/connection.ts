import {API_DEV_NET, API_MAIN_NET, APP_CLUSTER, RPC_URL} from '@/config';
import {Connection} from '@solana/web3.js';
import NetInfo from '@react-native-community/netinfo';
import { Cluster } from '@/types/cluster/cluster';

/**
 * Create a connection to Solana's Devnet.
 *
 * @returns {Connection} A connection object for interacting with Solana's Devnet.
 */
export const createDevnetConnection = async (): Promise<any> => {
  try{
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('Offline mode: Skipping connection to Devnet.');
      return null;
    }
    console.log('API_DEV_NET', API_DEV_NET);
    return new Connection(RPC_URL, 'confirmed');
  }
  catch(err: any){
    console.log("error while connecting ", err)
  }
};

/**
 * Create a connection to Solana's Devnet.
 *
 * @returns {Connection} A connection object for interacting with Solana's Devnet.
 */
export const createMainNetConnection = async ():  Promise<any> => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('Offline mode: Skipping connection to Mainet.');
    return null;
  }
  return new Connection(RPC_URL as string, 'confirmed');
};


/**
 * Create a connection to Solana based on the current cluster (Devnet or Mainnet).
 *
 * @returns {Promise<Connection | null>} A connection object for interacting with Solana's blockchain.
 */
export const createClusterConnection = async (): Promise<Connection | null> => {
  try {
    if (APP_CLUSTER === Cluster.Devnet) {
      console.log("Connecting to Devnet...");
      return await createDevnetConnection();
    } else if (APP_CLUSTER === Cluster.Mainnnet) {
      console.log("Connecting to Mainnet...");
      return await createMainNetConnection();
    } else {
      console.error("Invalid cluster specified.");
      return null;
    }
  } catch (err: any) {
    console.error("Error while creating connection:", err);
    return null;
  }
};
