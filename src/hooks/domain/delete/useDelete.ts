import {
  DeleteAccountRequest,
  DeleteAccountRequestBody,
  DeleteAccountResponse,
} from '@/pb/users';
import {UserServiceClient} from '@/pb/users.client';
import {api} from '@/services';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {store} from '@/store';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {FetchBaseQueryError, QueryReturnValue} from '@reduxjs/toolkit/query';

const UserDeleteClient = new UserServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const deleteUserApi = api.injectEndpoints({
  endpoints: builder => ({
    deleteUser: builder.mutation<
      DeleteAccountResponse,
      DeleteAccountRequestBody
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<QueryReturnValue<DeleteAccountResponse, FetchBaseQueryError>> {
        try {
          const requestHeader = await generateRequestHeader();
          const accessToken = await store.getState().accessToken.authToken;
          const request = DeleteAccountRequest.create({
            requestHeader: {
              deviceId: requestHeader.DeviceId,
              requestId: requestHeader.RequestId,
              deviceModel: requestHeader.DeviceModel,
              timestamp: requestHeader.Timestamp,
            },
            body: {
              reason: data.reason,
            },
          });

          const response = await UserDeleteClient.deleteAccount(request, {
            meta: {Authorization: `Bearer ${accessToken}`},
          }).response;

          console.log('✅ User account deleted successfully:', response);

          return {
            data: response,
          };
        } catch (error) {
          console.error('❌ Error deleting user account:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to delete user account',
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

export const {useDeleteUserMutation} = deleteUserApi;
