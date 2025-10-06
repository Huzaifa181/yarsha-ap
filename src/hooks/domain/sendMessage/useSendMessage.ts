import { MessageModel } from '@/database';
import MessageRepository from '@/database/repositories/Message.repository';
import { api } from '@/services';
import { FetchBaseQueryError, QueryReturnValue } from '@reduxjs/toolkit/query';

export const messageApi = api.injectEndpoints({
  endpoints: builder => ({
    addMessage: builder.mutation<MessageModel, Partial<MessageModel>>({
      // @ts-ignore
      queryFn: async (
        messageData,
      ): Promise<QueryReturnValue<MessageModel, FetchBaseQueryError>> => {
        try {
          const newMessage = await MessageRepository.addMessage(messageData);
          if (!newMessage) throw new Error('Failed to add message to Realm');
          return { data: newMessage };
        } catch (error) {
          console.log('error while sending message', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch group chats',
              error: 'RPC Error',
              data: { message: 'Unable to connect to RPC Server' },
            } as FetchBaseQueryError,
          };
        }
      },
      invalidatesTags: ['Messages'],
    }),
    updateMessage: builder.mutation<
      { success: boolean },
      {
        messageId: string;
        updates: Partial<Pick<MessageModel, 'content' | 'status' | 'multimedia' | 'transaction' >>;
      }
    >({
      // @ts-ignore
      queryFn: async ({
        messageId,
        updates,
      }): Promise<QueryReturnValue<{ success: boolean }, FetchBaseQueryError>> => {
        try {
          await MessageRepository.updateMessageById(messageId, updates);
          return { data: { success: true } };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to update message',
              error: 'Database Error',
              data: { message: 'Unable to update message' },
            } as FetchBaseQueryError,
          };
        }
      },
      invalidatesTags: ['Messages'],
    }),

    updateMessageId: builder.mutation<
      { success: boolean },
      { oldMessageId: string; newMessageId: string }
    >({
      // @ts-ignore
      queryFn: async ({
        oldMessageId,
        newMessageId,
      }): Promise<
        QueryReturnValue<{ success: boolean }, FetchBaseQueryError>
      > => {
        try {
          MessageRepository.updateMessageId(oldMessageId, newMessageId);
          return { data: { success: true } };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to update message ID',
              error: 'Database Error',
              data: { message: 'Unable to update message ID' },
            } as FetchBaseQueryError,
          };
        }
      },
      invalidatesTags: ['Messages'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useAddMessageMutation,
  useUpdateMessageMutation,
  useUpdateMessageIdMutation,
} = messageApi;
