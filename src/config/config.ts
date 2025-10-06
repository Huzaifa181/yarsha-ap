import {Cluster} from '@/types/cluster/cluster';

export const APP_BASE_URL = process.env.API_URL;
export const APP_CLUSTER = Cluster.Mainnnet as Cluster;
export const SOLANA_DERIVATION_PATH = process.env.SOLANA_DERIVATION_PATH;
export const API_MAIN_NET =
  process.env.API_MAIN_NET ||
  'https://mainnet.helius-rpc.com/?api-key=6004030a-3415-45b4-8511-113586ac0800';
export const API_DEV_NET =
  process.env.API_DEV_NET || 'https://api.devnet.solana.com';
export const RPC_URL =
  APP_CLUSTER == Cluster.Devnet ? API_DEV_NET : API_MAIN_NET;
export const BUNDLE_IDENTIFIER = {
  IOS_BUNDLE_IDENTIFIER: process.env.IOS_BUNDLE_IDENTIFIER,
  ANDROID_BUNDLE_IDENTIFIER: process.env.ANDROID_BUNDLE_IDENTIFIER,
};
export const WAPAL_MEDIA_CACHE = process.env.WAPAL_MEDIA_CACHE;
export const SOCKET_URL = process.env.MESSAGE_SEND_SOCKET;
export const GROUP_CHAT_SUBSCRIBE = process.env.GROUP_CHAT_SUBSCRIBE;
export const SECURE_DATABASE_KEY = process.env.SECURE_DATABASE_KEY;