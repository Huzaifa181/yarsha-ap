import { api } from '@/services';
import ChatsRepository from '@/database/repositories/Chats.repository';
import { GroupChatServiceClient } from '@/pb/groupchat.client';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { DeleteGroupChatRequestWrapper } from '@/pb/groupchat';
import { ChatsModel } from '@/database/models/Chats.model';
import { TDeleteChatRequest, TDeleteChatResponse } from './schema';

const GroupChatClient = new GroupChatServiceClient(
  new RNGrpcTransport(UserGRPClient),  
);

export const deleteChatApi = api.injectEndpoints({
  endpoints: builder => ({
    deleteGroupChat: builder.mutation<TDeleteChatResponse, TDeleteChatRequest>({
      // @ts-ignore
      async queryFn(data): Promise<any> {
        try {
          const request = DeleteGroupChatRequestWrapper.create({
            requestHeader: {
              requestId: `req-${Date.now()}`,
              timestamp: new Date().toISOString(),
            },
            body: {
              chatId: data["Body"]["ChatId"],
            },
          });
    
          const response = await GroupChatClient.deleteGroupChat(request, {
            meta: { Authorization: `Bearer ${data.AccessToken}` },
          });
          const isDeleted = response.response?.response?.isDeleted;
          const deletedChatId = response.response?.response?.chatId;
    
          if (isDeleted && deletedChatId) {
            const realm = await ChatsRepository.getRealmInstance();
            const existingChat = realm.objectForPrimaryKey<ChatsModel>('ChatsModel', deletedChatId);
    
            if (existingChat) {
              realm.write(() => {
                realm.delete(existingChat);
              });
              console.log(`🗑️ Deleted chat with ID: ${deletedChatId}`);
            }
          }
    
          return { data: response.response.response };
        } catch (error) {
          console.error('❌ Error deleting group chat:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to delete group chat',
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

export const { useDeleteGroupChatMutation } =
  deleteChatApi;
