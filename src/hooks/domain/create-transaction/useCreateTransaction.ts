import { api } from '@/services';
import { TransactionServiceClient } from '@/pb/transaction.client';
import { CreateTransactionRequestWrapper, CreateTransactionResponseWrapper } from '@/pb/transaction';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { TCreateTransactionRequest, TCreateTransactionResponse } from './schema';

const transactionClient = new TransactionServiceClient(
    new RNGrpcTransport(UserGRPClient)
);

export const transactionApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        createTransaction: builder.mutation<
            TCreateTransactionResponse,
            TCreateTransactionRequest
        >({
            // @ts-ignore
            async queryFn(data): Promise<any> {
                console.log('🔄 Sending gRPC request to create transaction:', data);
                try {
                    const { Body, AccessToken } = data;
                    
                    const request = CreateTransactionRequestWrapper.create({
                        requestHeader: {
                            requestId: `req-${Date.now()}`,
                            timestamp: new Date().toISOString(),
                        },
                        body: {
                            toWallet: Body.toWallet,
                            cluster: Body.cluster,
                            signature: Body.signature,
                        },
                    });

                    const response = await transactionClient.createTransaction(request, {
                        meta: { Authorization: `Bearer ${AccessToken}` },
                    });

                    const result = response.response.response;

                    console.log('✅ Transaction gRPC Response:', result);

                    return { data: result };
                } catch (error) {
                    console.error('❌ Error in createTransaction:', error);
                    return {
                        error: {
                            status: 'CUSTOM_ERROR',
                            error: 'CREATE_TRANSACTION_FAILED',
                            data: { message: 'Unable to send transaction to server' },
                        } as FetchBaseQueryError,
                    };
                }
            },
        }),
    }),
});

export const { useCreateTransactionMutation } = transactionApi;
