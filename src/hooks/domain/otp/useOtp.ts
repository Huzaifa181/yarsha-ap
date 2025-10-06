import {api} from '@/services';
import {UserServiceClient} from '@/pb/users.client';
import {SendOtpRequest, SendOtpResponse} from '@/pb/users';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {QueryReturnValue, FetchBaseQueryError} from '@reduxjs/toolkit/query';

const OtpSendClient = new UserServiceClient(new RNGrpcTransport(UserGRPClient));

export const otpApi = api.injectEndpoints({
  endpoints: builder => ({
    sendOtp: builder.mutation<SendOtpResponse, {phoneNumber: string}>({
      //@ts-ignore
      async queryFn(
        data,
      ): Promise<QueryReturnValue<SendOtpResponse, FetchBaseQueryError>> {
        console.log('data', data);
        try {
          const requestHeader = await generateRequestHeader();
          console.log("sendOtp")
          const otpResponse = await OtpSendClient.sendOtp(
            SendOtpRequest.create({
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
              body: {
                phoneNumber: data.phoneNumber,
              },
            }),
          ).response;
          console.log("otpResponse===>", otpResponse)
          return {data: otpResponse};
        } catch (error: unknown) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to send OTP',
              error: 'RPC Error',
              data: { message: 'Unable to connect to RPC Server' },
            } as FetchBaseQueryError,
          };
        }
      },
    }),
  }),
  overrideExisting: true,
});

export const {useSendOtpMutation} = otpApi;
