import ChatsRepository from '@/database/repositories/Chats.repository';
import {MarkAsSeenRequest, MarkAsSeenResponseWrapper} from '@/pb/groupchat';
import {GroupChatServiceClient} from '@/pb/groupchat.client';
import {api} from '@/services';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {store} from '@/store';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {QueryReturnValue, FetchBaseQueryError} from '@reduxjs/toolkit/query';

const GroupChatClient = new GroupChatServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const markAsSeen = api.injectEndpoints({
  endpoints: builder => ({
    markAsSeen: builder.mutation<MarkAsSeenResponseWrapper, MarkAsSeenRequest>({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<
        QueryReturnValue<MarkAsSeenResponseWrapper, FetchBaseQueryError>
      > {
        try {
          const requestHeader = await generateRequestHeader();
          const token = await store.getState().accessToken.authToken;
          const response = await GroupChatClient.markAsSeen(
            {
              body: data,
              requestHeader: {
                timestamp: requestHeader.Timestamp,
                action: 'markAsSeen',
                appVersion: '1.0.0',
                channel: 'mobile',
                clientIp: '127.0.0.1',
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                deviceType: 'mobile',
                languageCode: 'en',
                requestId: requestHeader.RequestId,
              },
            },
            {
              meta: {
                Authorization: `Bearer ${token}`,
              },
            },
          ).response;

          console.log("mark as read response ==>", response);

          return {data: response};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch group chats',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),
  }),
  overrideExisting: true,
});

export const {useMarkAsSeenMutation} = markAsSeen;
