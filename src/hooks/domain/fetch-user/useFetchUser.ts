import {api} from '@/services';
import {TOtpResponse} from './schema';
import UserRepository from '@/database/repositories/User.repository';
import {UserServiceClient} from '@/pb/users.client';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {QueryReturnValue, FetchBaseQueryError} from '@reduxjs/toolkit/query';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {GetUserInfoRequest} from '@/pb/users';

const FetchUserClient = new UserServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const fetchUserApi = api.injectEndpoints({
  endpoints: builder => ({
    fetchUser: builder.mutation<
      TOtpResponse,
      {userId: string; authToken: string}
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<QueryReturnValue<TOtpResponse, FetchBaseQueryError>> {
        try {
          const requestHeader = await generateRequestHeader();
          const userResponse = await FetchUserClient.getUserById(
            GetUserInfoRequest.create({
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
              body: {
                userId: data.userId,
              },
            }),
            {
              meta: {
                Authorization: `Bearer ${data.authToken}`,
              },
            },
          ).response;

          if (userResponse.responseHeader?.statusCode === '200') {
            const responsePayload = userResponse?.response;

            const lastActiveRaw = responsePayload?.lastActive;

            let lastActiveDate;

            if (lastActiveRaw) {
              const parsedDate = new Date(lastActiveRaw);

              if (!isNaN(parsedDate.getTime())) {
                lastActiveDate = parsedDate.toISOString();
              } else {
                lastActiveDate = new Date().toISOString();
              }
            } else {
              lastActiveDate = new Date().toISOString();
            }

            const userData = {
              id: responsePayload?.id,
              username: responsePayload?.username || '',
              fullName: responsePayload?.fullName || '',
              phoneNumber: responsePayload?.phoneNumber || '',
              profilePicture: responsePayload?.profilePicture || '',
              userBio: responsePayload?.userBio || 'Blockchain Enthusiast',
              address: responsePayload?.address || '',
              status: responsePayload?.status || '',
              lastActive: lastActiveDate || '',
              createdAt: responsePayload?.createdAt || '',
              updatedAt: responsePayload?.updatedAt || '',
              backgroundColor: responsePayload?.backgroundColor || '',
            };

            await UserRepository.deleteLatestUser();
            await UserRepository.createUser(userData);
          }

          const transformedResponse: TOtpResponse = {
            ResponseHeader: {
              Status: userResponse.responseHeader?.status || '',
              StatusCode: userResponse.responseHeader?.statusCode || '',
              Timestamp: userResponse.responseHeader?.timeStamp || '',
              RequestId: userResponse.responseHeader?.requestId || '',
              ResponseTitle: userResponse.responseHeader?.responseTitle || '',
              ResponseDescription:
                userResponse.responseHeader?.responseDescription || '',
            },
            Response: {
              Id: userResponse.response?.id || '',
              PhoneNumber: userResponse.response?.phoneNumber || '',
              FullName: userResponse.response?.fullName || '',
              CountryCode: userResponse.response?.countryCode || '',
              Number: userResponse.response?.phoneNumber || '',
              DialCode: userResponse.response?.dialCode || '',
              Address: userResponse.response?.address || '',
              Status: userResponse.response?.status || '',
              ProfilePicture: userResponse.response?.profilePicture || '',
              UserBio: userResponse.response?.userBio || '',
              Username: userResponse.response?.username || '',
              BackgroundColor: userResponse.response?.backgroundColor || '',
              LastActive: userResponse.response?.lastActive || '',
              CreatedAt: userResponse.response?.createdAt || '',
              UpdatedAt: userResponse.response?.updatedAt || '',
            },
          };
          return {data: transformedResponse};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch user',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),

    fetchOtherUser: builder.mutation<
      TOtpResponse,
      {userId: string; authToken: string}
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<QueryReturnValue<TOtpResponse, FetchBaseQueryError>> {
        try {
          const requestHeader = await generateRequestHeader();
          const userResponse = await FetchUserClient.getUserById(
            GetUserInfoRequest.create({
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
              body: {
                userId: data.userId,
              },
            }),
            {
              meta: {
                Authorization: `Bearer ${data.authToken}`,
              },
            },
          ).response;

          if (userResponse.responseHeader?.statusCode === '200') {
            const responsePayload = userResponse?.response;

            const lastActiveRaw = responsePayload?.lastActive;

            let lastActiveDate;

            if (lastActiveRaw) {
              const parsedDate = new Date(lastActiveRaw);

              if (!isNaN(parsedDate.getTime())) {
                lastActiveDate = parsedDate.toISOString();
              } else {
                lastActiveDate = new Date().toISOString();
              }
            } else {
              lastActiveDate = new Date().toISOString();
            }
          }

          const transformedResponse: TOtpResponse = {
            ResponseHeader: {
              Status: userResponse.responseHeader?.status || '',
              StatusCode: userResponse.responseHeader?.statusCode || '',
              Timestamp: userResponse.responseHeader?.timeStamp || '',
              RequestId: userResponse.responseHeader?.requestId || '',
              ResponseTitle: userResponse.responseHeader?.responseTitle || '',
              ResponseDescription:
                userResponse.responseHeader?.responseDescription || '',
            },
            Response: {
              Id: userResponse.response?.id || '',
              PhoneNumber: userResponse.response?.phoneNumber || '',
              FullName: userResponse.response?.fullName || '',
              CountryCode: userResponse.response?.countryCode || '',
              Number: userResponse.response?.phoneNumber || '',
              DialCode: userResponse.response?.dialCode || '',
              Address: userResponse.response?.address || '',
              Status: userResponse.response?.status || '',
              ProfilePicture: userResponse.response?.profilePicture || '',
              UserBio: userResponse.response?.userBio || '',
              Username: userResponse.response?.username || '',
              BackgroundColor: userResponse.response?.backgroundColor || '',
              LastActive: userResponse.response?.lastActive || '',
              CreatedAt: userResponse.response?.createdAt || '',
              UpdatedAt: userResponse.response?.updatedAt || '',
            },
          };
          return {data: transformedResponse};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch user',
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

export const {useFetchUserMutation, useFetchOtherUserMutation} = fetchUserApi;
