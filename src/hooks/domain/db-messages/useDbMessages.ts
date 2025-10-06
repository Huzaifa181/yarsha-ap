import { api } from '@/services';
import { MessageModel } from '@/database/models/Message.model';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import MessageRepository from '@/database/repositories/Message.repository';

export const fetchMessagesFromDbApi = api.injectEndpoints({
  endpoints: (builder) => ({
    fetchLatestMessage: builder.query<{ data: MessageModel | null }, { chatId: string }>({
      async queryFn({ chatId }) {
        try {
          const latestMessage = await MessageRepository.getLatestMessage(chatId);
          console.log('📨 Fetched latest message:', latestMessage);
          return { data: { data: latestMessage } };
        } catch (error) {
          console.error('❌ Error fetching latest message:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch latest message',
              error: 'Database Error',
              data: { message: 'Unable to retrieve latest message from Realm.' },
            } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['Messages'],
    }),
    fetchPinnedMessages: builder.query<{ data: MessageModel[] }, { chatId: string }>({
      async queryFn({ chatId }) {
        try {
          const allPinnedMessages = await MessageRepository.getMessagesByChatId(chatId);
          console.log("allPinnedMessages==>", allPinnedMessages)
          const pinned = allPinnedMessages.filter(msg => msg.isPinned);
          console.log('📌 Fetched pinned messages:', pinned);
          return { data: { data: pinned } };
        } catch (error) {
          console.error('❌ Error fetching pinned messages:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch pinned messages',
              error: 'Database Error',
              data: { message: 'Unable to retrieve pinned messages from Realm.' },
            } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['Messages'],
    }),
    
    fetchAllMessages: builder.query<{ data: MessageModel[] }, { chatId: string }>({
      async queryFn({ chatId }) {
        try {
          const messages = await MessageRepository.getMessagesByChatId(chatId);
          console.log('📨 Fetched all messages:', messages);
          return { data: { data: messages ?? [] } };
        } catch (error) {
          console.error('❌ Error fetching all messages:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch all messages',
              error: 'Database Error',
              data: { message: 'Unable to retrieve all messages from Realm.' },
            } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['Messages'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useFetchLatestMessageQuery,
  useFetchAllMessagesQuery,
  useFetchPinnedMessagesQuery,
} = fetchMessagesFromDbApi;