import {api} from '@/services';
import RecentUsersRepository from '@/database/repositories/RecentUsers.repository';
import {QueryReturnValue, FetchBaseQueryError} from '@reduxjs/toolkit/query';
import {GroupChatServiceClient} from '@/pb/groupchat.client';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {store} from '@/store';
import {IChat, IFriend} from './schema';
import {InteractionManager} from 'react-native';
import FriendsRepository from '@/database/repositories/Friends.repository';
import {syncFriends} from '@/utils/syncFriends';

interface RecentUser {
  id: string;
  username: string;
  fullName: string;
  profilePicture: string;
  backgroundColor: string;
  address?: string;
  lastActive?: string;
  status?: string;
}

const ContactedUsersClient = new GroupChatServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const recentUsersApi = api.injectEndpoints({
  endpoints: builder => ({
    /**
     * 🛑 Fetch Local Users (Convert Realm objects to plain objects)
     */
    fetchLocalUsers: builder.query<RecentUser[], void>({
      // @ts-ignore
      queryFn: async (): Promise<
        QueryReturnValue<RecentUser[], FetchBaseQueryError>
      > => {
        try {
          const users = (await RecentUsersRepository.getAllUsers()).map(
            user => ({
              ...user,
              lastActive: user.lastActive ? String(user.lastActive) : undefined,
            }),
          );

          return {data: users};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch recent users',
              error: 'Database Error',
              data: {message: 'Unable to fetch from local DB'},
            } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['RecentUsers'],
    }),

    /**
     * 🛑 Add or Update a Recent User
     */
    addOrUpdateUser: builder.mutation<RecentUser, Partial<RecentUser>>({
      // @ts-ignore
      queryFn: async (
        userData,
      ): Promise<QueryReturnValue<RecentUser, FetchBaseQueryError>> => {
        try {
          const user = await RecentUsersRepository.addOrUpdateUser(userData);
          if (user) {
            return {
              data: {
                ...user,
                lastActive: user.lastActive
                  ? String(user.lastActive)
                  : undefined,
              },
            };
          } else {
            return {
              error: {
                status: 'CUSTOM_ERROR',
                statusText: 'User not found',
                error: 'User Error',
                data: {message: 'User not found'},
              } as FetchBaseQueryError,
            };
          }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Database Error',
              error: 'Failed to update user',
              data: {message: 'Error updating user'},
            } as FetchBaseQueryError,
          };
        }
      },
      invalidatesTags: ['RecentUsers'],
    }),

    /**
     * 🛑 Fetch Contacted Users
     */
    fetchContactedUsers: builder.query<IFriend[], void>({
      // @ts-ignore
      queryFn: async (): Promise<
        QueryReturnValue<IFriend[], FetchBaseQueryError>
      > => {
        try {
          const token = store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();
          const response = await ContactedUsersClient.getFriendList(
            {
              body: {
                page: '1',
                limit: '25',
              },
              requestHeader: {
                action: 'GetFriendList',
                appVersion: '1.0.0',
                deviceId: requestHeader.DeviceId,
                deviceType: 'mobile',
                channel: 'mobile',
                clientIp: '127.0.0.1',
                deviceModel: requestHeader.DeviceModel,
                languageCode: 'en',
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
            },
            {
              meta: {Authorization: `Bearer ${token}`},
            },
          ).response;

          console.log('Server Friend List:', response);

          const serverFriends = response.response?.friends;

          InteractionManager.runAfterInteractions(async () => {
            await syncFriends(serverFriends || []);
            console.log('Friend synchronization complete.');
          });

          return {data: serverFriends || []};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch contacted users',
              error: 'Network Error',
              data: {message: 'Unable to fetch from server'},
            } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['RecentUsers'],
    }),

    /**
     * 🛑 Fetch Contacted Groups
     */
    fetchContactedGroups: builder.query<IChat[], void>({
      // @ts-ignore
      queryFn: async (): Promise<QueryReturnValue<IChat[], FetchBaseQueryError>> => {
        try {
          const token = store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();
          const response = await ContactedUsersClient.getUserChats(
            {
              body: {
                page: '1',
                limit: '25',
              },
              requestHeader: {
                action: 'GetGroupList',
                appVersion: '1.0.0',
                deviceId: requestHeader.DeviceId,
                deviceType: 'mobile',
                channel: 'mobile',
                clientIp: '127.0.0.1',
                deviceModel: requestHeader.DeviceModel,
                languageCode: 'en',
                requestId: requestHeader.RequestId, 
                timestamp: requestHeader.Timestamp,
              },
            },
            {
              meta: {Authorization: `Bearer ${token}`},
            },
          ).response;
          console.log('Server Group List:', response);
          const serverGroups = response.response?.chats;
          InteractionManager.runAfterInteractions(async () => {
            // await RecentUsersRepository.addOrUpdateGroups(serverGroups || []);
            console.log('Group synchronization complete.');
          }
          );
          console.log('Server Groups:', serverGroups);
          const mappedGroups = (serverGroups || []).map(group => ({
            Description: group.description || '',
            ChatId: group.chatId || '',
            GroupName: group.groupName || '',
            GroupIcon: group.groupIcon || '',
            Type: 'group' as const,
            BackgroundColor: group.backgroundColor || ''
          }));
          return {data: mappedGroups};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch contacted groups',
              error: 'Network Error',
              data: {message: 'Unable to fetch from server'},
            } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['RecentChats'],
    }),



    fetchLocalFriends: builder.query<IFriend[], void>({
      // @ts-ignore
      queryFn: async (): Promise<
        QueryReturnValue<IFriend[], FetchBaseQueryError>
      > => {
        try {
          const friends = await FriendsRepository.getAllFriends();
          console.log('Local Friends:', friends);
          const plainFriends: IFriend[] = friends.map(friend => ({
            friendId: friend.friendId,
            fullName: friend.fullName,
            username: friend.username,
            profilePicture: friend.profilePicture,
            backgroundColor: friend.backgroundColor,
            lastActive: friend.lastActive,
            status: friend.status,
          }));
          return {data: plainFriends};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch local friends',
              error: 'Database Error',
              data: {message: 'Unable to fetch friends from local DB'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useFetchLocalUsersQuery,
  useAddOrUpdateUserMutation,
  useFetchContactedUsersQuery,
  useFetchLocalFriendsQuery,
  useFetchContactedGroupsQuery
} = recentUsersApi;
