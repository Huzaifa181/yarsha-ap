import { createApi } from '@reduxjs/toolkit/query/react';
import { MessageServiceClient } from '@/pb/message.client';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { ReactToMessageResponse } from '@/pb/message';
import { FetchBaseQueryError, QueryReturnValue } from '@reduxjs/toolkit/query';
import { TReactToMessageRequest } from './schema';
import { api } from '@/services';

export const reactToMessageApi = api.injectEndpoints({
    endpoints: (builder) => ({
        reactToMessage: builder.mutation<ReactToMessageResponse, TReactToMessageRequest>({
            // @ts-ignore
            async queryFn(args, {dispatch}): Promise<QueryReturnValue<ReactToMessageResponse, FetchBaseQueryError>> {
                try {
                    const { chatId, messageId, reaction, token } = args;
                    const grpcClient = new MessageServiceClient(new RNGrpcTransport(UserGRPClient));
                    console.log("payload of react to message", { chatId, messageId, reaction })
                    const response = await grpcClient.reactToMessage(
                        { chatId, messageId, reaction },
                        { meta: { Authorization: `Bearer ${token}` } }
                    ).response;

                    console.log("response of reation==>", response)
                    return { data: response };
                } catch (error) {
                    console.error('❌ Error in reaction:', error);
                    return {
                        error: {
                            status: 'CUSTOM_ERROR',
                            statusText: 'Failed to reaction',
                            error: 'RPC Error',
                            data: { message: 'Unable to connect to RPC Server' },
                        } as FetchBaseQueryError,
                    };
                }
            },
        }),

    }),
});

export const { useReactToMessageMutation } = reactToMessageApi;
