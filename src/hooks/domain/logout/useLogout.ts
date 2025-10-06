import {LogoutRequest, LogoutResponse} from '@/pb/users';
import {UserServiceClient} from '@/pb/users.client';
import {APP_SECRETS} from '@/secrets';
import {api} from '@/services';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {reduxStorage, store} from '@/store';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {QueryReturnValue, FetchBaseQueryError} from '@reduxjs/toolkit/query';

const UserLogoutClient = new UserServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const logoutApi = api.injectEndpoints({
  endpoints: builder => ({
    logout: builder.mutation<LogoutResponse, {fcmToken: string}>({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<QueryReturnValue<LogoutResponse, FetchBaseQueryError>> {
        try {
          const token = await store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();
          console.log('I am in logout api', requestHeader);
          const logoutResponse = await UserLogoutClient.logout(
            LogoutRequest.create({
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
              fcmToken: data.fcmToken || '',
            }),
            {
              meta: {Authorization: `Bearer ${token}`},
            },
          ).response;
          console.log('I am in logout api: logoutResponse', logoutResponse);

          const transformedResponse: LogoutResponse = {
            responseHeader: {
              status: logoutResponse.responseHeader?.status || '',
              statusCode: logoutResponse.responseHeader?.statusCode || '',
              message: logoutResponse.responseHeader?.message || '',
              requestId: logoutResponse.responseHeader?.requestId || '',
              timeStamp: logoutResponse.responseHeader?.timeStamp || '',
              responseDescription:
                logoutResponse.responseHeader?.responseDescription || '',
              responseTitle: logoutResponse.responseHeader?.responseTitle || '',
            },
            response: {
              successMessage: logoutResponse.response?.successMessage || '',
            },
          };

          console.log('transformedResponse of logout', transformedResponse);

          return {data: transformedResponse};
        } catch (error: unknown) {
          console.log('error while logging out', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to logout',
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

export const {useLogoutMutation} = logoutApi;
