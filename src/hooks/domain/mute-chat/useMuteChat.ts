import { ChatsModel } from '@/database/models/Chats.model';
import ChatsRepository from '@/database/repositories/Chats.repository';
import {
  ToggleMuteGroupChatRequest,
  ToggleMuteGroupChatRequestWrapper,
} from '@/pb/groupchat';
import { GroupChatServiceClient } from '@/pb/groupchat.client';
import { api } from '@/services';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { TToggleMuteChatRequest, TToggleMuteChatResponse } from './schema';

const GroupChatClient = new GroupChatServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const muteChatApi = api.injectEndpoints({
  endpoints: builder => ({
    toggleMuteChat: builder.mutation<
      TToggleMuteChatResponse,
      TToggleMuteChatRequest
    >({
      // @ts-ignore
      async queryFn(data, {dispatch}): Promise<any> {
        try {
          const request = ToggleMuteGroupChatRequestWrapper.create({
            requestHeader: {
              requestId: `req-${Date.now()}`,
              timestamp: new Date().toISOString(),
            },
            body: ToggleMuteGroupChatRequest.create({
              chatId: data['Body']['ChatId'],
            }),
          });

          const response = await GroupChatClient.toggleMuteGroupChat(request, {
            meta: {Authorization: `Bearer ${data['AccessToken']}`},
          });
          const muteStatus = response.response.response?.muteStatus;
          if (muteStatus !== undefined) {
            const realm = await ChatsRepository.getRealmInstance();
            const chat = realm.objectForPrimaryKey<ChatsModel>(
              'ChatsModel',
              data['Body']['ChatId'],
            );
            if (chat) {
              realm.write(() => {
                chat.isMuted = muteStatus ? 'true' : 'false';
              });
              console.log(`🔕 Updated mute status: ${muteStatus}`);
            }
          }

          console.log('✅ Mute/Unmute Response:', response.response);

          return {data: response.response.response};
        } catch (error) {
          console.error('❌ Error in toggleMuteChat:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to mute/unmute group chat',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
      invalidatesTags: ['GroupChats'],
    }),
  }),
  overrideExisting: true,
});

export const {useToggleMuteChatMutation} = muteChatApi;
