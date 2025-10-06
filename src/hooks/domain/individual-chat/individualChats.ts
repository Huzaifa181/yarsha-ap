import {
  CheckIndividualChatRequestWrapper,
  CheckIndividualChatResponseWrapper,
} from '@/pb/groupchat';
import {GroupChatServiceClient} from '@/pb/groupchat.client';
import {api} from '@/services';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {store} from '@/store';
import {QueryReturnValue, FetchBaseQueryError} from '@reduxjs/toolkit/query';

const IndividualChatClient = new GroupChatServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const individualChatsApi = api.injectEndpoints({
  endpoints: builder => ({
    generatePeerChat: builder.mutation<
      CheckIndividualChatResponseWrapper,
      CheckIndividualChatRequestWrapper
    >({
      // @ts-ignore
      async queryFn(
        data,
        {dispatch},
      ): Promise<
        QueryReturnValue<
          CheckIndividualChatResponseWrapper,
          FetchBaseQueryError
        >
      > {
        const token = await store.getState().accessToken.authToken;
        try {
          const response = await IndividualChatClient.checkIndividualChat(
            CheckIndividualChatRequestWrapper.create({
              body: data.body,
              requestHeader: data.requestHeader,
            }),
            {
              meta: {Authorization: `Bearer ${token}`},
            },
          ).response;

          return {data: response};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch chat details',
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

export const {useGeneratePeerChatMutation} = individualChatsApi;
