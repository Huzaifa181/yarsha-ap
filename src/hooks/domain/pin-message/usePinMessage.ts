import { createApi } from '@reduxjs/toolkit/query/react';
import { MessageServiceClient } from '@/pb/message.client';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { PinMessageResponse, UnpinMessageResponse } from '@/pb/message';
import { FetchBaseQueryError, QueryReturnValue } from '@reduxjs/toolkit/query';
import { TPinMessageRequest } from './schema';
import { fetchMessagesApi } from '../fetch-messages/useFetchMessages';
import { api } from '@/services';

export const pinMessageApi = api.injectEndpoints({
    endpoints: builder => ({
        pinMessage: builder.mutation<PinMessageResponse, TPinMessageRequest>({
            // @ts-ignore
            async queryFn(args, { dispatch }): Promise<QueryReturnValue<PinMessageResponse, FetchBaseQueryError>> {
                try {
                    const { chatId, messageId, token } = args;
                    const grpcClient = new MessageServiceClient(new RNGrpcTransport(UserGRPClient));
                    console.log("payload of pin message", { chatId, messageId })
                    const response = await grpcClient.pinMessage(
                        { chatId, messageId },
                        { meta: { Authorization: `Bearer ${token}` } }
                    ).response;

                    console.log("response of pin==>", response)
                    return { data: response };
                } catch (error) {
                    console.error('❌ Error in togglePinChat:', error);
                    return {
                        error: {
                            status: 'CUSTOM_ERROR',
                            statusText: 'Failed to pin/unpin group chat',
                            error: 'RPC Error',
                            data: { message: 'Unable to connect to RPC Server' },
                        } as FetchBaseQueryError,
                    };
                }
            },
        }),
        unPinMessage: builder.mutation<UnpinMessageResponse, TPinMessageRequest>({
            // @ts-ignore
            async queryFn(args, { dispatch }): Promise<QueryReturnValue<PinMessageResponse, FetchBaseQueryError>> {
                try {
                    const { chatId, messageId, token } = args;
                    const grpcClient = new MessageServiceClient(new RNGrpcTransport(UserGRPClient));

                    const response = await grpcClient.unpinMessage(
                        { chatId, messageId },
                        { meta: { Authorization: `Bearer ${token}` } }
                    ).response;
                    console.log("response of un pin==>", response)
                    return { data: response };
                } catch (error) {
                    console.error('❌ Error in togglePinChat:', error);
                    return {
                        error: {
                            status: 'CUSTOM_ERROR',
                            statusText: 'Failed to pin/unpin group chat',
                            error: 'RPC Error',
                            data: { message: 'Unable to connect to RPC Server' },
                        } as FetchBaseQueryError,
                    };
                }
            },
        }),
    }),
});

export const { usePinMessageMutation, useUnPinMessageMutation } = pinMessageApi;
