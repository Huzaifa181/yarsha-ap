import {api} from '@/services';
import {TSearchUserResponse} from './schema';
import {UserServiceClient} from '@/pb/users.client';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {QueryReturnValue, FetchBaseQueryError} from '@reduxjs/toolkit/query';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {SearchUsersRequest} from '@/pb/users';

const UserSearchClient = new UserServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const searchUsersApi = api.injectEndpoints({
  endpoints: builder => ({
    searchUsers: builder.mutation<
      TSearchUserResponse,
      {Token: string; SearchQuery: string}
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<QueryReturnValue<TSearchUserResponse, FetchBaseQueryError>> {
        try {
          const requestHeader = await generateRequestHeader();

          const searchUsersResponse = await UserSearchClient.searchUsers(
            SearchUsersRequest.create({
              body: {
                searchQuery: data.SearchQuery,
              },
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
            }),
            {
              meta: {
                Authorization: `Bearer ${data.Token}`,
              },
            },
          ).response;

          const transformedResponse: TSearchUserResponse = {
            ResponseHeader: {
              Status: searchUsersResponse.responseHeader?.status || '',
              StatusCode: searchUsersResponse.responseHeader?.statusCode || '',
              Message: searchUsersResponse.responseHeader?.message || '',
              TimeStamp: searchUsersResponse.responseHeader?.timeStamp || '',
              RequestId: searchUsersResponse.responseHeader?.requestId || '',
              ResponseTitle: searchUsersResponse.responseHeader?.responseTitle || '',
              ResponseDescription: searchUsersResponse.responseHeader?.responseDescription || '',
            },
            Response: searchUsersResponse.response.map(user => ({
              Id: user.id || '',
              FullName: user.fullName || '',
              ProfilePicture: user.profilePicture || '',
              Username: user.username || '',
              BackgroundColor: user.backgroundColor || '',
              LastActive: user.lastActive || '',
              Status: user.status || 'offline',
              Address: user.address || '',
            })),
          };

          return {data: transformedResponse};
        } catch (error: unknown) {
          console.log('error', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to search users',
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

export const {useSearchUsersMutation} = searchUsersApi;
