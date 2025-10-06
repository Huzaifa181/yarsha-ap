import {ParticipantDetailsModel} from '@/database';
import {ChatsModel, SeenDetailsModel} from '@/database/models/Chats.model';
import ChatsRepository from '@/database/repositories/Chats.repository';
import GroupChatRepository from '@/database/repositories/GroupChat.repository';
import {
  GetGroupChatDetailsRequest,
  UpdateGroupChatRequest,
  UpdateGroupChatResponse,
} from '@/pb/groupchat';
import {GroupChatServiceClient} from '@/pb/groupchat.client';
import {api} from '@/services';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {store} from '@/store';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {FetchBaseQueryError, QueryReturnValue} from '@reduxjs/toolkit/query';
import {InteractionManager} from 'react-native';
import Realm from 'realm';
import {groupChatsApi} from '../db-chats/useDbChats';
import {
  TChatDetailsResponse,
  TChatRequestDetails,
  TGroupChatsRequest,
  TGroupChatsResponse,
} from './schema';
import { fetchGroupChatDetailApi } from '../fetch-chat-details/useFetchChatDetails';

const GroupChatClient = new GroupChatServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const fetchChatsApi = api.injectEndpoints({
  endpoints: builder => ({
    fetchChats: builder.mutation<TGroupChatsResponse, TGroupChatsRequest>({
      // @ts-ignore
      async queryFn(
        data,
        {dispatch},
      ): Promise<QueryReturnValue<TGroupChatsResponse, FetchBaseQueryError>> {
        try {
          const stream_response = GroupChatClient.streamGroupChats(
            {},
            {
              meta: {Authorization: `Bearer ${data.AccessToken}`},
            },
          );
          console.log("stream_response==>", stream_response)
          stream_response.responses.onNext(async response => {
            if (!response) return;
            console.log('(On Next): Streamed Group Chats Response: ', response);

            const transformedResponse: TGroupChatsResponse = {
              ResponseHeader: {
                Status: String(response.responseHeader?.status || ''),
                StatusCode: response.responseHeader?.statusCode || '',
                Timestamp: response.responseHeader?.timestamp || '',
                RequestId: response.responseHeader?.requestId || '',
                ResponseTitle: response.responseHeader?.responseTitle || '',
                ResponseDescription:
                  response.responseHeader?.responseDescription || '',
              },
              GroupChats: (response?.response?.groupChats ?? []).map(chat => ({
                GroupId: chat.groupId || '',
                GroupName: chat.groupName || '',
                Type: chat.type as 'individual' | 'group' | 'community',
                GroupIcon: chat.groupIcon || '',
                IsIndividualBotChat: chat.isIndividualBotChat || false,
                ParticipantsId: chat.participantsId
                  ? Array.from(chat.participantsId)
                  : [],
                isPinned: chat.isPinned || '',
                pinnedAt:
                  chat.isPinned === 'true'
                    ? new Date().toISOString()
                    : undefined,
                isMuted: chat.isMuted || '',
                BackgroundColor: chat.backgroundColor || '',
                SeenDetails: chat.seenDetails
                  ? chat.seenDetails.map(seen => ({
                      ParticipantId: seen.participantId || '',
                      SeenCount: Number(seen.seenCount) || 0,
                      TimeStamp: seen.timestamp || '',
                    }))
                  : [],
                LastMessage: chat.lastMessage
                  ? {
                      MessageId: chat.lastMessage.messageId || '',
                      SenderId: chat.lastMessage.senderId || '',
                      SenderName: chat.lastMessage.senderName || '',
                      Text: chat.lastMessage.text || '',
                      MessageType: chat.lastMessage.messageType as
                        | 'text'
                        | 'image'
                        | 'video'
                        | 'file',
                      Timestamp: chat.lastMessage.timestamp || '',
                      Multimedia: chat?.lastMessage?.multimedia || [],
                      Transaction: chat?.lastMessage?.transaction || null,
                    }
                  : {
                      MessageId: '',
                      SenderId: '',
                      SenderName: '',
                      Text: '',
                      MessageType: 'text',
                      Timestamp: '',
                      Multimedia: [],
                      Transaction: null,
                    },
                UpdatedAt: chat.updatedAt || '',
                MessageCount: chat.messageCount || '0',
              })),
              Pagination: {
                CurrentPage: Number(response.response?.currentPage) || 0,
                TotalPages: Number(response.response?.totalPages) || 0,
              },
            };
            console.log("transformedResponse===>", transformedResponse)
            setTimeout(async () => {
              InteractionManager.runAfterInteractions(async () => {
                const realmInstance = await ChatsRepository.getRealmInstance();

                const existingChats = new Map(
                  realmInstance
                    .objects<ChatsModel>('ChatsModel')
                    .map(chat => [chat.groupId, chat]),
                );

                const serverChatIds = new Set(
                  transformedResponse.GroupChats.map(chat => chat.GroupId),
                );

                realmInstance.write(() => {
                  existingChats.forEach((chat, chatId) => {
                    if (!serverChatIds.has(chatId)) {
                      console.log(`🗑️ Deleting outdated chat: ${chatId}`);
                      realmInstance.delete(chat);
                    }
                  });
                });

                const chatsToInsertOrUpdate =
                  transformedResponse.GroupChats.map(chat => {
                    const participantsArray = chat.ParticipantsId
                      ? Array.from(chat.ParticipantsId)
                      : [];
                    let lastMessageInstance;
                    if (chat.LastMessage) {
                      realmInstance.write(() => {
                        lastMessageInstance = realmInstance.create(
                          'LastMessageModel',
                          {
                            messageId: chat.LastMessage.MessageId,
                            senderId: chat.LastMessage.SenderId,
                            senderName: chat.LastMessage.SenderName,
                            text: chat.LastMessage.Text,
                            messageType: chat.LastMessage.MessageType,
                            timestamp: chat.LastMessage.Timestamp,
                            multimedia: chat?.LastMessage?.Multimedia || [],
                            transaction: chat?.LastMessage?.Transaction || null,
                          },
                          Realm.UpdateMode.Modified,
                        );
                      });

                      lastMessageInstance = JSON.parse(
                        JSON.stringify(lastMessageInstance),
                      );
                    }

                    let seenDetailsList: SeenDetailsModel[] = [];

                    realmInstance.write(() => {
                      for (const seen of chat.SeenDetails) {
                        const scopedId = `${chat.GroupId}_${seen.ParticipantId}`;

                        const existing = realmInstance.objectForPrimaryKey(
                          'SeenDetailsModel',
                          scopedId,
                        );
                        if (existing) {
                          realmInstance.delete(existing);
                        }

                        const detail = realmInstance.create(
                          'SeenDetailsModel',
                          {
                            participantId: scopedId,
                            seenCount: Number(seen.SeenCount),
                            timeStamp: seen.TimeStamp,
                          },
                          Realm.UpdateMode.Modified,
                        ) as SeenDetailsModel;

                        seenDetailsList.push(detail);
                      }
                    });

                    return {
                      groupId: chat.GroupId,
                      groupName: chat.GroupName,
                      groupIcon: chat.GroupIcon,
                      type: chat.Type,
                      isPinned: chat.isPinned,
                      pinnedAt:
                        chat.isPinned === 'true'
                          ? new Date().toISOString()
                          : undefined,
                      isMuted: chat.isMuted,
                      isIndividualBotChat: chat.IsIndividualBotChat,
                      participants: participantsArray,
                      seenDetails: seenDetailsList,
                      messageCount: Number(chat.MessageCount) || 0,
                      lastMessage: lastMessageInstance,
                      backgroundColor: chat.BackgroundColor,
                      existingChat: existingChats.get(chat.GroupId),
                    };
                  });

                realmInstance.write(() => {
                  chatsToInsertOrUpdate.forEach(chat => {
                    if (chat.existingChat) {
                      Object.assign(chat.existingChat, {
                        groupName: chat.groupName,
                        groupIcon: chat.groupIcon,
                        type: chat.type,
                        isPinned: chat.isPinned,
                        isIndividualBotChat: chat.isIndividualBotChat,
                        pinnedAt:
                          chat.isPinned === 'true'
                            ? new Date().toISOString()
                            : undefined,
                        isMuted: chat.isMuted,
                        participants: chat.participants,
                        seenDetails: chat.seenDetails,
                        lastMessage: chat.lastMessage,
                        backgroundColor: chat.backgroundColor,
                        messageCount: Number(chat.messageCount) || 0,
                      });
                      console.log(`🔄 Updated chat with ID: ${chat.groupId}`);
                    } else {
                      realmInstance.create('ChatsModel', chat);
                      console.log(
                        `✅ Created new chat with ID: ${chat.groupId}`,
                      );
                    }
                  });

                  const paginationEntry = realmInstance.objectForPrimaryKey(
                    'ChatMetaDataModel',
                    'pagination',
                  );
                  if (paginationEntry) {
                    paginationEntry.currentPage =
                      transformedResponse.Pagination.CurrentPage;
                    paginationEntry.totalPages =
                      transformedResponse.Pagination.TotalPages;
                  } else {
                    realmInstance.create('ChatMetaDataModel', {
                      id: 'pagination',
                      currentPage: transformedResponse.Pagination.CurrentPage,
                      totalPages: transformedResponse.Pagination.TotalPages,
                    });
                  }
                  console.log(
                    `📌 Stored pagination - Current Page: ${transformedResponse.Pagination.CurrentPage}, Total Pages: ${transformedResponse.Pagination.TotalPages}`,
                  );
                });
                dispatch(groupChatsApi.util.invalidateTags(['GroupChats']));
              });
            }, 500);
            console.log("transformedResponse==>", transformedResponse)
            return {data: transformedResponse};
          });

          stream_response.responses.onError(error => {
            if (error.stack?.includes('RST_STREAM')) {
              console.log('GRPC Stream closed by server');
            }
          });
          return {data: {} as TGroupChatsResponse};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch group chats',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
      invalidatesTags: ['GroupChats'],
    }),

    fetchChatDetails: builder.mutation<
      TChatDetailsResponse,
      TChatRequestDetails
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<QueryReturnValue<TChatDetailsResponse, FetchBaseQueryError>> {
        try {
          const response = await GroupChatClient.getGroupChatDetails(
            GetGroupChatDetailsRequest.create({
              chatId: data.ChatId,
            }),
            {
              meta: {Authorization: `Bearer ${data.AccessToken}`},
            },
          ).response;

          console.log('response of group chat details', response);

          const transformedResponse: TChatDetailsResponse = {
            ResponseHeader: {
              Status: String(response.responseHeader?.status || ''),
              StatusCode: response.responseHeader?.statusCode || '',
              Timestamp: response.responseHeader?.timestamp || '',
              RequestId: response.responseHeader?.requestId || '',
              ResponseTitle: response.responseHeader?.responseTitle || '',
              ResponseDescription:
                response.responseHeader?.responseDescription || '',
            },
            Chat: {
              ChatId: response.chat?.chatId || '',
              GroupName: response.chat?.groupName || '',
              Type: response.chat?.type as 'individual' | 'group' | 'community',
              GroupIcon: response.chat?.groupIcon || '',
              GroupDescription: response.chat?.groupDescription || '',
              ParticipantsId: response.chat?.participantsId
                ? Array.from(response.chat?.participantsId)
                : [],
              BackgroundColor: response.chat?.backgroundColor || '',
              IsMuted: response.chat?.isMuted || false,
              ParticipantDetails:
                response.chat?.participantDetails.map(participant => ({
                  Id: participant.id || '',
                  Username: participant.username || '',
                  FullName: participant.fullName || '',
                  ProfilePicture: participant.profilePicture || '',
                  Role: participant.role as 'member' | 'creator',
                  BackgroundColor: participant.backgroundColor || '',
                  LastActive: participant.lastActive || '',
                  Address: participant.address || '',
                  Status: participant.status as 'online' | 'offline',
                })) || [],
            },
          };

          const foundGroup = await GroupChatRepository.getGroupChatById(
            transformedResponse.Chat.ChatId,
          );
          if (!foundGroup) {
            await GroupChatRepository.saveGroupChat({
              ...transformedResponse.Chat,
              GroupDescription: transformedResponse.Chat.GroupDescription || '',
            });
          } else {
            const participantDetails: ParticipantDetailsModel[] =
              transformedResponse.Chat.ParticipantDetails.map(p => ({
                Id: p.Id,
                Username: p.Username,
                FullName: p.FullName,
                ProfilePicture: p.ProfilePicture,
                Role: p.Role,
                BackgroundColor: p.BackgroundColor,
                LastActive: p.LastActive,
                Address: p.Address,
                Status: p.Status,
                SchemaVersion: 1,
              })) as ParticipantDetailsModel[];

            await GroupChatRepository.updateGroupChat(
              transformedResponse.Chat.ChatId,
              transformedResponse.Chat,
              participantDetails,
            );
          }
          return {data: transformedResponse};
        } catch (error) {
          console.log('error while fetching chat details', error);
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
      invalidatesTags: ['GroupChats'],
    }),

    updateChat: builder.mutation<
      UpdateGroupChatResponse,
      {
        groupName: string;
        groupDescription: string;
        groupIcon: string;
        chatId: string;
      }
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<
        QueryReturnValue<UpdateGroupChatResponse, FetchBaseQueryError>
      > {
        try {
          const token = await store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();
          const response = await GroupChatClient.updateGroupChat(
            UpdateGroupChatRequest.create({
              body: {
                chatId: data.chatId,
                data: {
                  description: data.groupDescription,
                  groupIcon: data.groupIcon,
                  name: data.groupName,
                },
              },
              requestHeader: {
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                action: 'updateGroupChat',
                appVersion: '1.0.0',
                channel: 'mobile',
                clientIp: '127.0.0.1',
                deviceType: 'mobile',
                languageCode: 'en',
              },
            }),
            {
              meta: {Authorization: `Bearer ${token}`},
            },
          ).response;

          console.log('response of update group chat', response);

          const transformedResponse: UpdateGroupChatResponse = {
            response: {
              backgroundColor: response.response?.backgroundColor || '',
              chatId: response.response?.chatId || '',
              groupIcon: response.response?.groupIcon || '',
              description: response.response?.description || '',
              groupName: response.response?.groupName || '',
              type: response.response?.type as 'individual' | 'group' | 'community',
            },
            responseHeader: {
              status: Number(response.responseHeader?.status || 0),
              statusCode: response.responseHeader?.statusCode || '',
              timestamp: response.responseHeader?.timestamp || '',
              requestId: response.responseHeader?.requestId || '',
              responseTitle: response.responseHeader?.responseTitle || '',
              responseDescription:
                response.responseHeader?.responseDescription || '',
            },
          };

          await GroupChatRepository.updateGroupChat(
            transformedResponse.response?.chatId || '',
            {
              GroupName: transformedResponse.response?.groupName || undefined,
              GroupIcon: transformedResponse.response?.groupIcon || undefined,
              BackgroundColor:
                transformedResponse.response?.backgroundColor || undefined,
              GroupDescription:
                transformedResponse.response?.description || undefined,
            },
          );

          return {data: transformedResponse};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to update chat details',
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
  useFetchChatsMutation,
  useFetchChatDetailsMutation,
  useUpdateChatMutation,
} = fetchChatsApi;
