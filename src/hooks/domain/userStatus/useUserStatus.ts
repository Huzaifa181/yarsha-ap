import {SocketServiceClient} from '@/pb/stream.message.client';
import {SubscribeRequest} from '@/pb/subscribe';
import {SubscribeServiceClient} from '@/pb/subscribe.client';
import {api} from '@/services';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {store} from '@/store';
import { setLogoutType } from '@/store/slices';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {FetchBaseQueryError} from '@reduxjs/toolkit/query';
import DeviceInfo from 'react-native-device-info';

const UserStatusClient = new SocketServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

const SubscribeToChannelClient = new SubscribeServiceClient(
  new RNGrpcTransport(UserGRPClient),
);


export const userStatusApi = api.injectEndpoints({
  endpoints: builder => ({
    userStatusApi: builder.mutation<any, any>({
      // @ts-ignore
      async queryFn(): Promise<any> {
        try {
          const token = await store.getState().accessToken.authToken;
          const uniqueDeviceId = await DeviceInfo.getUniqueId();
          const stream_response = UserStatusClient.connect(
            {
              uniqueDeviceId: uniqueDeviceId
            },
            {
              meta: {Authorization: `Bearer ${token}`},
            },
          );

          stream_response.responses.onMessage(async response => {
            console.log('group chat stream response', response);
            if (response.type === 'groupCreated') {
              const requestHeader = await generateRequestHeader();

              const chatId =
                response.payload.oneofKind === 'groupCreated' &&
                response.payload.groupCreated.groupId;

              const streamedResponse =
                await SubscribeToChannelClient.subscribeToGroupChat(
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
                    body: {
                      chatId: chatId || '',
                    },
                  }),
                  {
                    meta:{
                      Authorization: `Bearer ${token}`,
                    }
                  }
                );

            }
          });

          stream_response.responses.onError(error => {
            console.log('group chat stream response:Error in the user status stream', error);
            if (error.message.toLowerCase().includes("invalid token")) {
              console.log('Error in the user status stream: Invalid Token');
              store.dispatch(setLogoutType('logout'));
            }
          });

          stream_response.responses.onNext(() => {
            console.log('group chat stream response: User status stream started successfully');
          })

          return {
            data: {
              message: 'User status stream started successfully',
            },
          };
        } catch (error) {
          console.log('error in the message list', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch and update the user status',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),
  }),
});

export const {useUserStatusApiMutation} = userStatusApi;
