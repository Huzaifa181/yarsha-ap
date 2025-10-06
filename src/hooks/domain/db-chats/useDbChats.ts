import { api } from '@/services';
import { ChatsModel } from '@/database/models/Chats.model';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import ChatsRepository from '@/database/repositories/Chats.repository';

/**
 * RTK Query API for fetching paginated group chats from Realm
 */
export const groupChatsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    fetchGroupChats: builder.query<{ data: ChatsModel[]; currentPage: number }, { page: number; limit: number }>({
      async queryFn({ page, limit }) {
        try {
          const allChats = await ChatsRepository.getGroupChatsPaginated(page, limit);
          const filteredChats = allChats.filter(chat => chat.type === 'individual' || chat.type === 'group');
    
          return { data: { data: filteredChats, currentPage: page } };
        } catch (error) {
          console.error('❌ Error fetching group chats:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch group chats',
              error: 'Database Error',
              data: { message: 'Unable to retrieve group chats from Realm.' },
            } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['GroupChats'],
    }),    
    fetchCommunityChats: builder.query<{ data: ChatsModel[] }, void>({
      async queryFn() {
        try {
          const allChats = await ChatsRepository.getAllGroupChats();
          const communityChats = allChats.filter(chat => chat.type === 'community');
          return { data: { data: communityChats } };
        } catch (error) {
          console.error('❌ Error fetching community chats:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch community chats',
              error: 'Database Error',
              data: { message: 'Unable to retrieve community chats from Realm.' },
            } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['GroupChats'],
    }),    
    fetchAllChats: builder.query<{ data: ChatsModel[] }, void>({
      async queryFn() {
        try {
          const allChats = await ChatsRepository.getAllGroupChats();
          const filteredChats = allChats.filter(chat => chat.type === 'individual' || chat.type === 'group');
          return { data: { data: filteredChats } };
        } catch (error) {
          console.error('❌ Error fetching all group chats:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch all group chats',
              error: 'Database Error',
              data: { message: 'Unable to retrieve all group chats from Realm.' },
            } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['GroupChats'],
    }),
  }),
  overrideExisting: true,
});

export const { useFetchGroupChatsQuery, useFetchAllChatsQuery, useFetchCommunityChatsQuery } = groupChatsApi;
