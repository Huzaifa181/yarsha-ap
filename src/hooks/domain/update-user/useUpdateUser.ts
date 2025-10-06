import {api} from '@/services';
import {TOtpRequest, TOtpResponse} from './schema';
import UserRepository from '@/database/repositories/User.repository';
import { FetchBaseQueryError} from '@reduxjs/toolkit/query';
import {UserServiceClient} from '@/pb/users.client';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {UpdateUserRequest} from '@/pb/users';
import { userApi } from '../db-user/useDbUser';

const UpdateUser = new UserServiceClient(new RNGrpcTransport(UserGRPClient));

export const updateUserApi = api.injectEndpoints({
  endpoints: builder => ({
    updateUser: builder.mutation<TOtpResponse, TOtpRequest>({
            // @ts-ignore

      async queryFn(data, _api) {
        console.log('data in the update user', data);
        try {
          const userResponse = await UpdateUser.updateUserProfile(
            UpdateUserRequest.create({
              requestHeader: {
                deviceId: data.RequestHeader.DeviceId,
                deviceModel: data.RequestHeader.DeviceModel,
                requestId: data.RequestHeader.RequestId,
                timestamp: data.RequestHeader.Timestamp,
              },
              body: {
                fcmToken: {
                  deviceId: data.Body.FcmToken?.DeviceId,
                  model: data.Body.FcmToken?.Model,
                  token: data.Body.FcmToken?.Token,
                },
                user:{
                  fullName: data.Body.User?.FullName,
                  profilePicture: data.Body.User?.ProfilePicture,
                  userBio: data.Body.User?.UserBio,
                  username: data.Body.User?.UserName,
                  number: data.Body.User?.Number,
                  countryCode: data.Body.User?.CountryCode,
                }
              },
            }),
            {
              meta: {
                Authorization: `Bearer ${data.AccessToken}`,
              },
            },
          ).response;

          const response = {
            ResponseHeader: {
              Status: userResponse.responseHeader?.status || '',
              StatusCode: userResponse.responseHeader?.statusCode || '',
              Message: userResponse.responseHeader?.message || '',
              TimeStamp: userResponse.responseHeader?.timeStamp || '',
              RequestId: userResponse.responseHeader?.requestId || '',
              ResponseTitle: userResponse.responseHeader?.responseTitle || '',
              ResponseDescription:
                userResponse.responseHeader?.responseDescription || '',
            },
            Response: {
              Id: userResponse.response?.id || '',
              PhoneNumber: userResponse.response?.phoneNumber || '',
              BackgroundColor: userResponse.response?.backgroundColor || '',
              LastActive: userResponse.response?.lastActive || '',
              CreatedAt: userResponse.response?.createdAt || '',
              UpdatedAt: userResponse.response?.updatedAt || '',
              UserBio: userResponse.response?.userBio || '',
              FullName: userResponse.response?.fullName || '',
              Username: userResponse.response?.username || '',
              ProfilePicture: userResponse.response?.profilePicture || '',
              Address: userResponse.response?.address || '',
              Status: userResponse.response?.status || '',
              CountryCode: userResponse.response?.countryCode || '',
              Number: userResponse.response?.phoneNumber || '',
              DialCode: userResponse.response?.dialCode || '',
            },
          };

          console.log('response in the grpc call', response);

          if (response.ResponseHeader.StatusCode === '200') {
            const responsePayload = response.Response;

            const lastActiveRaw = responsePayload.LastActive;

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
              id: responsePayload.Id,
              username: responsePayload.Username,
              fullName: responsePayload.FullName,
              phoneNumber: responsePayload.PhoneNumber,
              profilePicture: responsePayload.ProfilePicture,
              userBio: responsePayload.UserBio || 'Blockchain Enthusiast',
              address: responsePayload.Address,
              status: responsePayload.Status,
              lastActive: lastActiveDate,
              createdAt: responsePayload.CreatedAt,
              updatedAt: responsePayload.UpdatedAt,
              backgroundColor: responsePayload.BackgroundColor,
            };

            await UserRepository.updateUser(userData);
            _api.dispatch(
              userApi.util.invalidateTags(['MatchedUsers'])
            );
          }

          return {data: response};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to update user',
              error: 'RPC Error',
              data: { message: 'Unable to connect to RPC Server' },
            } as FetchBaseQueryError,
          };
        }
      },
      invalidatesTags: ['MatchedUsers'],
    }),
  }),
  overrideExisting: false,
});


export const {useUpdateUserMutation} = updateUserApi;
