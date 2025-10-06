import {
  AddAdminsRequestBody,
  AddAdminsRequestWrapper,
  AddAdminsResponseWrapper,
  RemoveAdminsRequestBody,
  RemoveAdminsRequestWrapper,
  RemoveAdminsResponseWrapper,
  RemoveParticipantsRequestBody,
  RemoveParticipantsRequestWrapper,
  RemoveParticipantsResponseWrapper,
} from '@/pb/admin';
import {AdminServiceClient} from '@/pb/admin.client';
import {api} from '@/services';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {store} from '@/store';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {FetchBaseQueryError, QueryReturnValue} from '@reduxjs/toolkit/query';

const AdminClient = new AdminServiceClient(new RNGrpcTransport(UserGRPClient));

export const adminApi = api.injectEndpoints({
  endpoints: builder => ({
    removeMember: builder.mutation<RemoveParticipantsResponseWrapper, RemoveParticipantsRequestBody>({
      // @ts-ignore
      async queryFn(data): Promise<QueryReturnValue<RemoveParticipantsResponseWrapper, FetchBaseQueryError>> {
        try {
          const token = await store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();

          const response = await AdminClient.removeParticipants(
            RemoveParticipantsRequestWrapper.create({
              body: {
                groupId: data.groupId,
                participantsId: data.participantsId,
              },
              requestHeader: {
                action: 'removeAdmins',
                appVersion: '1.0.0',
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                channel: 'mobile',
                clientIp: '127.0.0.1',
                deviceType: 'mobile',
                languageCode: 'en',
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
            }),
            {
              meta: {Authorization: `Bearer ${token}`},
            },
          ).response;
          console.log('Remove Member Response:', response);
          return {data: response};
        }
        catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to remove member from the group chat',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      }
    }),
    removeAdmin: builder.mutation<
      RemoveAdminsResponseWrapper,
      RemoveAdminsRequestBody
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<
        QueryReturnValue<RemoveAdminsResponseWrapper, FetchBaseQueryError>
      > {
        try {
          const token = await store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();

          const response = await AdminClient.removeAdmins(
            RemoveAdminsRequestWrapper.create({
              body: {
                groupId: data.groupId,
                adminIds: data.adminIds,
              },
              requestHeader: {
                action: 'removeAdmins',
                appVersion: '1.0.0',
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                channel: 'mobile',
                clientIp: '127.0.0.1',
                deviceType: 'mobile',
                languageCode: 'en',
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
            }),
            {
              meta: {Authorization: `Bearer ${token}`},
            },
          ).response;
          console.log('Remove Admin Response:', response);
          return {data: response};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to remove admin from the group chat',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),

    addAdmin: builder.mutation<AddAdminsResponseWrapper, AddAdminsRequestBody>({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<
        QueryReturnValue<AddAdminsResponseWrapper, FetchBaseQueryError>
      > {
        try {
          const token = await store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();

          const response = await AdminClient.addAdmins(
            AddAdminsRequestWrapper.create({
              body: {
                groupId: data.groupId,
                participantsId: data.participantsId,
              },
              requestHeader: {
                action: 'addAdmins',
                appVersion: '1.0.0',
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                channel: 'mobile',
                clientIp: '127.0.0.1',
                deviceType: 'mobile',
                languageCode: 'en',
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
            }),
            {
              meta: {Authorization: `Bearer ${token}`},
            },
          ).response;

          console.log('Add Admin Response:', response);

          return {data: response};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to add admin to the group chat',
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

export const {useRemoveMemberMutation,useRemoveAdminMutation, useAddAdminMutation} = adminApi;
