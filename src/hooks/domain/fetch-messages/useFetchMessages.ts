import MessageRepository from '@/database/repositories/Message.repository';
import { GetChatMessagesRequest } from '@/pb/message';
import { MessageServiceClient } from '@/pb/message.client';
import { SocketServiceClient } from '@/pb/stream.message.client';
import { api } from '@/services';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { FetchBaseQueryError, QueryReturnValue } from '@reduxjs/toolkit/query';
import { InteractionManager } from 'react-native';
import { TMessageRequest, TMessageResponse } from './schema';

const MessageFetchClient = new MessageServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

const MessageStreamClient = new SocketServiceClient(
  new RNGrpcTransport(UserGRPClient),
);
const isGiphyGif = (url: string) =>
  typeof url === 'string' &&
  (url.includes('giphy.com/media/') || url.includes('media.giphy.com/media/'));
export const fetchMessagesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    fetchMessages: builder.mutation<TMessageResponse, TMessageRequest>({
      // @ts-ignore
      async queryFn(data, { dispatch }): Promise<QueryReturnValue<TMessageResponse, FetchBaseQueryError>> {
        try {
          const { chatId, direction, limit } = data.Body;
          const lastSaved = direction === 'before'
            ? await MessageRepository.getEarliestMessage(chatId)
            : await MessageRepository.getLatestMessage(chatId);

          const timestamp = lastSaved?.createdAt
            ? new Date(lastSaved.createdAt).getTime().toString()
            : undefined;

          const stream_response = MessageStreamClient.subscribeChat(
            { chatId },
            { meta: { Authorization: `Bearer ${data.AccessToken}` } },
          );

          stream_response.responses.onNext(async response => {
            InteractionManager.runAfterInteractions(async () => {
              console.log("event response===>", response);
              const message = response?.message;
              const pinnedMessage = response?.pinnedMessage;
              const unPinnedMessage = response?.unpinnedMessage;
              const reaction = response?.reaction;
              // if (!message || !message.content) return;
              if (message) {

                const messageId = message.messageId || '';
                const messageIdAutomated = message.Id || '';

                const existing = await MessageRepository.messageExists(messageId);
                const existingAuto = await MessageRepository.messageExistsById(messageIdAutomated);
                console.log("isGiphyGif(message.content)==>", isGiphyGif(message.content))

                const shouldStore = !existing && !(existingAuto && message.automated);
                if (shouldStore) {
                  const isMultimedia = !!message?.multimedia?.length;

                  let type: 'text' | 'image' | 'video' | 'file' | 'gif' = 'text';
                  
                  if (isMultimedia) {
                    const mimeTypes = message.multimedia.map(m => m.mimeType);
                    if (mimeTypes.some(m => m.startsWith('image/'))) {
                      type = 'image';
                    } else if (mimeTypes.some(m => m.startsWith('video/'))) {
                      type = 'video';
                    } else {
                      type = 'file';
                    }
                  }
                  if (isGiphyGif(message.content)) {
                    type = 'gif';
                  }
                  const multimedia = isMultimedia
                    ? message.multimedia.map(media => ({
                      ...media,
                      isLoading: false,
                    }))
                    : null;

                  await MessageRepository.addMessage({
                    _id: messageIdAutomated,
                    serverId: message.Id,
                    chatId: message.chatId || '',
                    senderId: message.senderId || '',
                    messageId,
                    content: message.content,
                    createdAt: message.createdAt ? new Date(+message.createdAt) : new Date(),
                    updatedAt: message.updatedAt ? new Date(+message.updatedAt) : new Date(),
                    automated: message.automated || false,
                    status: 'sent',
                    replyTo: {
                      ...message.replyTo,
                      replyToContent: message.replyTo?.replyTocontent
                    },
                    type,
                    multimedia,
                    transaction: message.transaction,
                    preparedTransaction: message.preparedTransaction,
                  });

                } else {
                  await MessageRepository.updateServerIdByMessageId(message.messageId, message.Id);
                }
              }
              try {
                if (pinnedMessage) {
                  const isPinned = !!pinnedMessage?.isPinned;

                  await MessageRepository.updateIsPinnedByMessageId(pinnedMessage.messageId, isPinned);
                }
                if (reaction) {
                  await MessageRepository.pushReactionToMessage(reaction.messageId, reaction);
                }
                if (unPinnedMessage) {
                  const isPinned = !!unPinnedMessage?.isPinned;

                  await MessageRepository.updateIsPinnedByMessageId(unPinnedMessage.messageId, isPinned);
                }
              } catch (err) {
                console.error("Failed to update pin status:", err);
              }

              await dispatch(fetchMessagesApi.util.invalidateTags(['Messages']));
            });
          });


          const grpcRequest = GetChatMessagesRequest.create({
            requestHeader: {
              requestId: data.RequestHeader.RequestId,
              deviceId: data.RequestHeader.DeviceId,
              deviceModel: data.RequestHeader.DeviceModel,
              timestamp: data.RequestHeader.Timestamp,
            },
            body: {
              chatId,
              ...(timestamp ? { timestamp } : {}),
              ...(limit ? { limit } : {}),
              direction: direction || 'after',
            },
          });
          console.log("grpcRequest==>",grpcRequest)
          const grpcResponse = await MessageFetchClient.getChatMessages(
            grpcRequest,
            { meta: { Authorization: `Bearer ${data.AccessToken}` } }
          ).response;
          console.log("grpcResponse===>", grpcResponse)
          const messages = grpcResponse.groupMessages.map((msg) => {
            const isMultimedia = !!msg?.multimedia?.length;
            let type: 'text' | 'image' | 'video' | 'file' | 'gif' = 'text';
            console.log("isGiphyGif(message.content)==>", isGiphyGif(msg.content))

            if (isMultimedia) {
              const mimeTypes = msg.multimedia.map((m) => m.mimeType);
              if (mimeTypes.some((m) => m.startsWith('image/'))) type = 'image';
              else if (mimeTypes.some((m) => m.startsWith('video/'))) type = 'video';
              
              else type = 'file';
            }
             if (isGiphyGif(msg.content)) type = 'gif';

            const multimedia = isMultimedia
              ? msg.multimedia.map((media) => ({ ...media, isLoading: false }))
              : null;

            return {
              _id: msg.Id,
              chatId: msg.chatId,
              senderId: msg.senderId,
              messageId: msg.messageId,
              content: msg.content,
              createdAt: new Date(Number(msg.createdAt)),
              updatedAt: new Date(Number(msg.updatedAt)),
              automated: msg.automated,
              type,
              multimedia,
              serverId: msg.Id,
              isPinned: msg.isPinned,
              transaction: msg.transaction,
              replyTo: msg.replyTo,
              reactions: msg.reactions,
              status: 'sent' as const,
            };
          });
          const localMessages = await MessageRepository.getMessagesByChatId(chatId);
          const localMessageIds = localMessages.map(m => m.messageId || m._id);
          const newMessages = messages.filter(msg => {
            const id = msg.automated ? msg._id : msg.messageId;
            return !localMessageIds.includes(id);
          });

          const pinnedMessages = grpcResponse.pinnedMessages?.map((msg) => {
            const isMultimedia = !!msg?.multimedia?.length;
            let type: 'text' | 'image' | 'video' | 'file' | 'gif' = 'text';

            if (isMultimedia) {
              const mimeTypes = msg.multimedia.map((m) => m.mimeType);
              if (mimeTypes.some((m) => m.startsWith('image/'))) type = 'image';
              else if (mimeTypes.some((m) => m.startsWith('video/'))) type = 'video';
              else type = 'file';
            }
            if (isGiphyGif(msg.content)) type = 'gif';

            const multimedia = isMultimedia
              ? msg.multimedia.map((media) => ({ ...media, isLoading: false }))
              : null;

            return {
              _id: msg.Id,
              chatId: msg.chatId,
              senderId: msg.pinnedBy,
              messageId: msg.messageId,
              content: msg.content,
              createdAt: new Date(Number(msg.pinnedAt)),
              updatedAt: new Date(Number(msg.pinnedAt)),
              automated: false,
              type,
              isPinned: true,
              multimedia,
              serverId: msg.Id,
              replyTo: null,
              reactions: null,
              transaction: null,
              status: 'sent' as const,
            };
          }) ?? [];
          const localPinMessages = await MessageRepository.getMessagesByChatId(chatId);
          const localPinMessageIds = localPinMessages.map(m => m.messageId || m._id);
          const newPinMessages = pinnedMessages.filter(msg => {
            const id = msg.automated ? msg._id : msg.messageId;
            return !localPinMessageIds.includes(id);
          });
          await Promise.all([
            newMessages.map((msg) => MessageRepository.addMessage(msg)),
            newPinMessages.map((pin) => MessageRepository.addMessage(pin)),
          ]);

          dispatch(fetchMessagesApi.util.invalidateTags(['Messages']));

          const transformedResponse: TMessageResponse = {
            ResponseHeader: {
              RequestId: grpcResponse.responseHeader?.requestId || '',
              ResponseDescription: grpcResponse.responseHeader?.responseDescription || '',
              ResponseTitle: grpcResponse.responseHeader?.responseTitle || '',
              StatusCode: grpcResponse.responseHeader?.statusCode || '',
              Status: grpcResponse.responseHeader?.status || '',
              Timestamp: grpcResponse.responseHeader?.timeStamp || '',
            },
            messages: newMessages.map((msg) => ({
              ...msg,
              createdAt: msg.createdAt.toISOString(),
              updatedAt: msg.updatedAt.toISOString(),
            })),
            pinnedMessages: newPinMessages.map((msg) => ({
              ...msg,
              createdAt: msg.createdAt.toISOString(),
              updatedAt: msg.updatedAt.toISOString(),
            })),
          };

          return { data: transformedResponse };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch chat messages',
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

export const { useFetchMessagesMutation } = fetchMessagesApi;