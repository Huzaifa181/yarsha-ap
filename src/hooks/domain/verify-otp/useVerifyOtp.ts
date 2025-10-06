import {api} from '@/services';
import {TOtpResponse} from './schema';
import {QueryReturnValue, FetchBaseQueryError} from '@reduxjs/toolkit/query';
import {VerifyOtpRequest} from '@/pb/users';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {UserServiceClient} from '@/pb/users.client';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import DeviceInfo from 'react-native-device-info';

const OTPVerifyClient = new UserServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const verifyOtpApi = api.injectEndpoints({
  endpoints: builder => ({
    verifyOtp: builder.mutation<
      TOtpResponse,
      {
        phoneNumber: string;
        otp: string;
        fcmData:{
          token: string;
          deviceId: string;
          deviceModel: string;
        }
      }
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<QueryReturnValue<TOtpResponse, FetchBaseQueryError>> {
        console.log('data', data);
        try {
          const uniqueDeviceId = await DeviceInfo.getUniqueId();
          console.log('uniqueDeviceId', uniqueDeviceId);
          const requestHeader = await generateRequestHeader();
          const otpVerify = await OTPVerifyClient.verifyOtp(
            VerifyOtpRequest.create({
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
              body: {
                phoneNumber: data.phoneNumber,
                otp: data.otp,
                fcmData:{
                  token: data.fcmData.token,
                  deviceId: data.fcmData.deviceId,
                  model: data.fcmData.deviceModel,
                  uniqueDeviceId: uniqueDeviceId
                }
              },
            }),
          )

          const otpResponse = otpVerify.response

          const otpRequest = otpVerify.request
          console.log('otpRequest', otpRequest);

          console.log('otpResponse', otpResponse);
          const transformedResponse: TOtpResponse = {
            ResponseHeader: {
              Status: otpResponse.responseHeader?.status || '',
              StatusCode: otpResponse.responseHeader?.statusCode || '',
              Timestamp: otpResponse.responseHeader?.timeStamp || '',
              RequestId: otpResponse.responseHeader?.requestId || '',
              ResponseTitle: otpResponse.responseHeader?.responseTitle || '',
              ResponseDescription:
                otpResponse.responseHeader?.responseDescription || '',
            },
            Response: {
              Token: otpResponse.response?.token || '',
              PrivateKey: otpResponse.response?.privateKey || "",
              User: {
                Id: otpResponse.response?.user?.id || '',
                PhoneNumber: otpResponse.response?.user?.phoneNumber || '',
                FullName: otpResponse.response?.user?.fullName || '',
                CountryCode: otpResponse.response?.user?.countryCode || '',
                Number: otpResponse.response?.user?.phoneNumber || '',
                DialCode: otpResponse.response?.user?.dialCode || '',
                Address: otpResponse.response?.user?.address || '',
                Status: otpResponse.response?.user?.status || '',
                ProfilePicture:
                  otpResponse.response?.user?.profilePicture || '',
                UserBio: '',
                Username: otpResponse.response?.user?.username || '',
                BackgroundColor:
                  otpResponse.response?.user?.backgroundColor || '',
                LastActive: otpResponse.response?.user?.lastActive || '',
                CreatedAt: otpResponse.response?.user?.createdAt || '',
                UpdatedAt: otpResponse.response?.user?.updatedAt || '',
              },
            },
          };

          return {data: transformedResponse};
        } catch (error: unknown) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to send OTP',
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

export const {useVerifyOtpMutation} = verifyOtpApi;
