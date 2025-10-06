import {SocketServiceClient} from '@/pb/stream.message.client';
import {SubscribeServiceClient} from '@/pb/subscribe.client';
import {SubscribeRequest} from '@/pb/subscribe';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import DeviceInfo from 'react-native-device-info';
import {store} from '@/store';
import {setLogoutType} from '@/store/slices';

class UserStatusStreamService {
  private static instance: UserStatusStreamService;
  private client: SocketServiceClient;
  private subClient: SubscribeServiceClient;
  private isStreaming = false;

  private constructor() {
    this.client = new SocketServiceClient(new RNGrpcTransport(UserGRPClient));
    this.subClient = new SubscribeServiceClient(
      new RNGrpcTransport(UserGRPClient),
    );
  }

  public static getInstance(): UserStatusStreamService {
    if (!UserStatusStreamService.instance) {
      UserStatusStreamService.instance = new UserStatusStreamService();
    }
    return UserStatusStreamService.instance;
  }

  public async startStream() {
    if (this.isStreaming) return;
    this.isStreaming = true;

    try {
      const token = store.getState().accessToken.authToken;
      const deviceId = await DeviceInfo.getUniqueId();

      const stream = this.client.connect(
        {uniqueDeviceId: deviceId},
        {meta: {Authorization: `Bearer ${token}`}},
      );

      stream.responses.onMessage(async response => {
        console.log('Stream received in the stream manager', response);

        if (response.type === 'groupCreated') {
          const requestHeader = await generateRequestHeader();
          const chatId =
            response.payload.oneofKind === 'groupCreated' &&
            response.payload.groupCreated.groupId;

          await this.subClient.subscribeToGroupChat(
            SubscribeRequest.create({
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
                action: 'subscribe',
                appVersion: '1.0.0',
                deviceType: 'mobile',
                channel: 'mobile',
                clientIp: '127.0.0.1',
                languageCode: 'en',
              },
              body: {chatId: chatId || ''},
            }),
            {
              meta: {Authorization: `Bearer ${token}`},
            },
          );
        }
      });

      stream.responses.onError(error => {
        console.error('Stream error:', error);
        this.startStream();

        if (error.message?.toLowerCase().includes('invalid token')) {
          store.dispatch(setLogoutType('logout'));
        }
      });

      stream.responses.onNext(() => {
        console.log('User status stream started successfully');
      });
    } catch (err) {
      console.error('Error starting user status stream:', err);
      this.isStreaming = false;
    }
  }

  public async stopStream() {
    if (!this.isStreaming) return;
    this.isStreaming = false;

    try {
      console.log('User status stream stopped');
    } catch (err) {
      console.error('Error stopping user status stream:', err);
    }
  }
}
export default UserStatusStreamService;
