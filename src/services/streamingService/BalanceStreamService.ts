import {PriceServiceClient} from '@/pb/price.client';
import {RNGrpcTransport} from '../grpcService/RPCTransport';
import {UserGRPClient} from '../grpcService/grpcClient';
import {store} from '@/store';

type PriceUpdate = {
  solToUsd: string;
  publishTime: string;
  percentageChange: string;
};

type PriceUpdateListener = (price: PriceUpdate) => void;

class BalanceStreamService {
  private static instance: BalanceStreamService;
  private client: PriceServiceClient;
  private listeners: PriceUpdateListener[] = [];
  private isStreaming = false;

  private constructor() {
    this.client = new PriceServiceClient(new RNGrpcTransport(UserGRPClient));
  }

  public static getInstance(): BalanceStreamService {
    if (!BalanceStreamService.instance) {
      BalanceStreamService.instance = new BalanceStreamService();
    }
    return BalanceStreamService.instance;
  }

  public async startStream() {
    if (this.isStreaming) return;
    this.isStreaming = true;

    try {
      const token = store.getState().accessToken.authToken;
      if (!token) throw new Error('No auth token found');

      const stream = this.client.priceUpdates(
        {},
        {meta: {Authorization: `Bearer ${token}`}},
      );

      stream.responses.onMessage((response: PriceUpdate) => {

        this.listeners.forEach(callback => {
          callback(response);
        });
      });

      stream.responses.onError((error: any) => {
        console.error('Balance stream error:', error);
        this.isStreaming = false;
      });
    } catch (error) {
      console.error('Error starting balance stream:', error);
      this.isStreaming = false;
    }
  }

  public addListener(callback: PriceUpdateListener) {
    this.listeners.push(callback);
  }

  public removeListener(callback: PriceUpdateListener) {
    this.listeners = this.listeners.filter(fn => fn !== callback);
  }

  public clearListeners() {
    this.listeners = [];
  }
}

export default BalanceStreamService;
