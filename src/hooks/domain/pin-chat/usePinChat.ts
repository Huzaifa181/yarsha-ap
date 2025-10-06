import { api } from '@/services';
import {
  TTogglePinChatResponse,
  TTogglePinChatRequest,
} from './schema';
import ChatsRepository from '@/database/repositories/Chats.repository';
import { GroupChatServiceClient } from '@/pb/groupchat.client';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { TogglePinGroupChatRequest, TogglePinGroupChatRequestWrapper } from '@/pb/groupchat';
import { ChatsModel } from '@/database/models/Chats.model';

const GroupChatClient = new GroupChatServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const pinChatApi = api.injectEndpoints({
  endpoints: builder => ({
    togglePinChat: builder.mutation<
      TTogglePinChatResponse,
      TTogglePinChatRequest
    >({
      async queryFn(
        data,
        { dispatch }
      ): Promise<any> {
        try {
          const request = TogglePinGroupChatRequestWrapper.create({
            requestHeader: {
              requestId: `req-${Date.now()}`,
              timestamp: new Date().toISOString(),
            },
            body: TogglePinGroupChatRequest.create({ chatId: data["Body"]["ChatId"] }),
          });

          const response = await GroupChatClient.togglePinGroupChat(request, {
            meta: { Authorization: `Bearer ${data["AccessToken"]}` },
          });
          const pinStatus = response.response?.response?.pinStatus === 'true';
          if (pinStatus !== undefined) {
            const realm = await ChatsRepository.getRealmInstance();
            const chat = realm.objectForPrimaryKey<ChatsModel>(
              'ChatsModel',
              data["Body"]["ChatId"],
            );
    
            if (chat) {
              realm.write(() => {
                chat.isPinned = pinStatus ? "true" : "false";
                if (pinStatus) {
                  chat.pinnedAt = new Date();
                } else {
                  chat.pinnedAt = undefined;
                }
              });
              console.log(`📌 Updated pin status: ${pinStatus}`);
            }
          }
          console.log('✅ Pin/Unpin Response:', response.response);

          return { data: response.response.response };
        } catch (error) {
          console.error('❌ Error in togglePinChat:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to pin/unpin group chat',
              error: 'RPC Error',
              data: { message: 'Unable to connect to RPC Server' },
            } as FetchBaseQueryError,
          };
        }
      },
      invalidatesTags: ['GroupChats'],
    }),    
  }),
  overrideExisting: true,
});

export const { useTogglePinChatMutation } = pinChatApi;
