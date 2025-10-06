import {GroupChatServiceClient} from '@/pb/groupchat.client';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {store} from '@/store';
import ChatsRepository from '@/database/repositories/Chats.repository';
import {InteractionManager} from 'react-native';
import {TGroupChatsResponse} from '@/hooks/domain/fetch-chats/schema';
import {ChatsModel, SeenDetailsModel} from '@/database';
import {groupChatsApi} from '@/hooks/domain/db-chats/useDbChats';
import {setLogoutType} from '@/store/slices';

class ChatStreamService {
  private static instance: ChatStreamService;
  private client: GroupChatServiceClient;

  private constructor() {
    this.client = new GroupChatServiceClient(
      new RNGrpcTransport(UserGRPClient),
    );
  }

  public static getInstance(): ChatStreamService {
    if (!ChatStreamService.instance) {
      ChatStreamService.instance = new ChatStreamService();
    }
    return ChatStreamService.instance;
  }

  public async startStream() {

    const token = store.getState().accessToken.authToken;
    if (!token) {
      console.warn('[ChatStreamService] Auth token not available.');
      return;
    }

    try {
      const stream_response = this.client.streamGroupChats(
        {},
        {
          meta: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      stream_response.responses.onNext(async response => {
        if (!response) return;
        console.log('Stream received in the stream manager', response);

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
              chat.isPinned === 'true' ? new Date().toISOString() : undefined,
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
        console.log('Transformed Response:', transformedResponse);
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

            const chatsToInsertOrUpdate = transformedResponse.GroupChats.map(
              chat => {
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
              },
            );

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
                  console.log(`✅ Created new chat with ID: ${chat.groupId}`);
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
            store.dispatch(groupChatsApi.util.invalidateTags(['GroupChats']));
          });
      });

      console.log('[ChatStreamService] Chat stream started');

      stream_response.responses.onError(error => {
        console.error('Stream error:', error);

        this.startStream();

        if (error.message?.toLowerCase().includes('invalid token')) {
          store.dispatch(setLogoutType('logout'));
        }
      });

      stream_response.responses.onNext(() => {
        console.log('User status stream started successfully');
      });
    } catch (err) {
      console.error('[ChatStreamService] Failed to start chat stream:', err);
    }
  }
}

export default ChatStreamService;
