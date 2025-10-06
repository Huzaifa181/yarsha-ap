import {AppBot} from '@/database';
import BotsRepository from '@/database/repositories/Bots.repository';
import {
  GetBotCommandsRequest,
  GetBotCommandsRequestBody,
  GetBotCommandsResponse,
  GetBotRequest,
  GetBotRequestBody,
  GetBotResponse,
  GetBotsRequest,
  GetBotsRequestBody,
  GetBotsResponse,
  SubmitCompletedTransactionRequest,
  SubmitCompletedTransactionRequestBody,
  SubmitCompletedTransactionResponse,
} from '@/pb/bot';
import {BotServiceClient} from '@/pb/bot.client';
import {api} from '@/services';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {store} from '@/store';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {QueryReturnValue, FetchBaseQueryError} from '@reduxjs/toolkit/query';

const FetchBotClient = new BotServiceClient(new RNGrpcTransport(UserGRPClient));

export const botApi = api.injectEndpoints({
  endpoints: builder => ({
    getSwapMessage: builder.mutation<
      SubmitCompletedTransactionResponse,
      SubmitCompletedTransactionRequestBody
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<
        QueryReturnValue<
          SubmitCompletedTransactionResponse,
          FetchBaseQueryError
        >
      > {
        try {
          const token = await store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();
          const swapResponse = await FetchBotClient.submitCompletedTransaction(
            SubmitCompletedTransactionRequest.create({
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
              body: {
                botId: data.botId,
                chatId: data.chatId,
                isSuccess: data.isSuccess,
                transactionHash: data.transactionHash,
                userId: data.userId,
              },
            }),
            {
              meta: {
                Authorization: `Bearer ${token}`,
              },
            },
          ).response;

          console.log('swapResponse', swapResponse);

          return {data: swapResponse};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch swap message',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),

    fetchBots: builder.mutation<GetBotsResponse, GetBotsRequestBody>({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<QueryReturnValue<GetBotsResponse, FetchBaseQueryError>> {
        try {
          const token = await store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();
          const botResponse = await FetchBotClient.getBots(
            GetBotsRequest.create({
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
              body: {
                limit: data.limit,
                page: data.page,
                searchQuery: data.searchQuery,
              },
            }),
            {
              meta: {
                Authorization: `Bearer ${token}`,
              },
            },
          ).response;

          console.log('botResponse', botResponse);

          const botsList = botResponse.response?.bots ?? [];
          const transformedBots: AppBot[] = botsList.map(bot => ({
            botId: bot.id,
            botName: bot.name,
            botIcon: bot.profilePicture ?? '',
            botDescription: bot.botBio ?? '',
            category: bot.category ?? '',
            username: bot.username ?? '',
            descriptions: bot.descriptions ?? [],
          }));

          await BotsRepository.saveBots(transformedBots);

          return {data: botResponse};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch bots',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),

    searchBots: builder.mutation<GetBotsResponse, GetBotsRequestBody>({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<QueryReturnValue<GetBotsResponse, FetchBaseQueryError>> {
        try {
          const token = await store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();
          const botResponse = await FetchBotClient.getBots(
            GetBotsRequest.create({
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
              body: {
                limit: data.limit,
                page: data.page,
                searchQuery: data.searchQuery,
              },
            }),
            {
              meta: {
                Authorization: `Bearer ${token}`,
              },
            },
          ).response;

          console.log('botResponse', botResponse);

          const botsList = botResponse.response?.bots ?? [];
          const transformedBots: AppBot[] = botsList.map(bot => ({
            botId: bot.id,
            botName: bot.name,
            botIcon: bot.profilePicture ?? '',
            botDescription: bot.botBio ?? '',
            category: bot.category ?? '',
            username: bot.username ?? '',
          }));

          await BotsRepository.saveBots(transformedBots);

          return {data: botResponse};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to search bots',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),

    getBotCommands: builder.mutation<
      GetBotCommandsResponse,
      GetBotCommandsRequestBody
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<
        QueryReturnValue<GetBotCommandsResponse, FetchBaseQueryError>
      > {
        try {
          const token = await store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();
          const botResponse = await FetchBotClient.getBotCommands(
            GetBotCommandsRequest.create({
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
              body: {
                botId: data.botId,
              },
            }),
            {
              meta: {
                Authorization: `Bearer ${token}`,
              },
            },
          ).response;
          console.log('botResponse', botResponse);
          const commandsList = botResponse.response?.botCommands ?? [];
          console.log('commandsList for bots', commandsList);
          return {data: botResponse};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to search bots',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),

    botDetails: builder.mutation<GetBotResponse, GetBotRequestBody>({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<QueryReturnValue<GetBotResponse, FetchBaseQueryError>> {
        try {
          const token = await store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();

          const botResponse = await FetchBotClient.getBot(
            GetBotRequest.create({
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
              body: {
                botId: data.botId,
              },
            }),
            {
              meta: {
                Authorization: `Bearer ${token}`,
              },
            },
          ).response;

          console.log(
            'Bot with the given id created/updated untransformed',
            botResponse,
          );

          if (botResponse.response?.bot) {
            const transformedBot = {
              botId: botResponse.response.bot.id,
              botName: botResponse.response.bot.name,
              botIcon: botResponse.response.bot.profilePicture ?? '',
              botDescription: botResponse.response.bot.botBio ?? '',
              category: botResponse.response.bot.category ?? '',
              username: botResponse.response.bot.username ?? '',
              descriptions: botResponse.response.bot.descriptions ?? [],
              botBio: botResponse.response.bot.botBio ?? '',
            };

            console.log(
              'Bot with the given id created/updated transformed',
              transformedBot,
            );

            await BotsRepository.saveBotDescription(transformedBot);
          }

          return {data: botResponse};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch bot details',
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

export const {
  useGetSwapMessageMutation,
  useFetchBotsMutation,
  useSearchBotsMutation,
  useGetBotCommandsMutation,
  useBotDetailsMutation,
} = botApi;
