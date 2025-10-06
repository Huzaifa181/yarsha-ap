import {api} from '@/services';
import UserRepository from '@/database/repositories/User.repository';
import {UserModel} from '@/database/models/User.model';
import {FetchBaseQueryError} from '@reduxjs/toolkit/query';

/**
 * RTK Query API for fetching the latest user from Realm
 */
export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    fetchLatestUser: builder.query<UserModel | null, void>({
      async queryFn() {
        try {
          const latestUser = await UserRepository.getLatestUser();

          if (!latestUser) {
            return { data: null };
          }

          const latestUserPlain = JSON.parse(JSON.stringify(latestUser));

          return { data: latestUserPlain };
        } catch (error) {
          console.error('❌ Error fetching latest user:', error);

          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch latest user',
              error: 'Database Error',
              data: { message: 'Unable to retrieve user from Realm.' },
            } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['MatchedUsers'],
      keepUnusedDataFor: 300, 
    }),
    updateUserPrivateKey: builder.mutation<void, { userId: string; privateKey: string }>({
      async queryFn({ userId, privateKey }) {
        try {
          await UserRepository.updateUserPrivateKey(userId, privateKey);
          return { data: undefined };
        } catch (error) {
          console.error('❌ Error updating private key:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to update private key',
              error: 'Custom Error',
              data: { message: 'Unable to update user private key in Realm.' },
            } as FetchBaseQueryError,
          };
        }
      },
      invalidatesTags: ['MatchedUsers'],
    }),
  }),
  overrideExisting: true,
});

export const { useFetchLatestUserQuery, useLazyFetchLatestUserQuery, useUpdateUserPrivateKeyMutation } = userApi;
