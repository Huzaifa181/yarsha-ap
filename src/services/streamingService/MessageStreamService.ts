import {SocketServiceClient} from '@/pb/stream.message.client';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import MessageRepository from '@/database/repositories/Message.repository';
import {store} from '@/store';
import {InteractionManager} from 'react-native';
import {fetchMessagesApi} from '@/hooks/domain/fetch-messages/useFetchMessages';
import {GetChatMessagesRequest} from '@/pb/message';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import { MessageServiceClient } from '@/pb/message.client';

const isGiphyGif = (url: string) =>
  typeof url === 'string' &&
  (url.includes('giphy.com/media/') || url.includes('media.giphy.com/media/'));
class MessageStreamService {
  private static instance: MessageStreamService;
  private client: SocketServiceClient;
  private subClient: MessageServiceClient;
  private isStreaming: boolean = false;
  private streamMap: Record<string, any> = {};

  private constructor() {
    this.client = new SocketServiceClient(new RNGrpcTransport(UserGRPClient));
    this.subClient = new MessageServiceClient(new RNGrpcTransport(UserGRPClient));
  }

  public static getInstance(): MessageStreamService {
    if (!MessageStreamService.instance) {
      MessageStreamService.instance = new MessageStreamService();
    }
    return MessageStreamService.instance;
  }

  public async subscribeToChat(
    chatId: string,
    timeStamp?: string,
    limit?: number,
    direction?: string,
  ) {
    if (this.streamMap[chatId]) {
      console.log(
        `[MessageStreamService] Already streaming for chat: ${chatId}`,
      );
      return;
    }
    const token = store.getState().accessToken.authToken;
    if (!token) {
      console.warn('[MessageStreamService] Auth token not available.');
      return;
    }

    this.isStreaming = true;

    const stream = this.client.subscribeChat(
        { chatId },
        { meta: { Authorization: `Bearer ${token}` } }
      );

    this.streamMap[chatId] = stream;

    try {
      const lastSaved =
        direction === 'before'
          ? await MessageRepository.getEarliestMessage(chatId)
          : await MessageRepository.getLatestMessage(chatId);

      const timestamp = lastSaved?.createdAt
        ? new Date(lastSaved.createdAt).getTime().toString()
        : undefined;
      const stream_response = this.client.subscribeChat(
        {chatId},
        {meta: {Authorization: `Bearer ${token}`}},
      );

      console.log('stream_response===>', stream_response);

      stream_response.responses.onNext(async response => {
        InteractionManager.runAfterInteractions(async () => {
          console.log('event response===>', response);
          const message = response?.message;
          const pinnedMessage = response?.pinnedMessage;
          const unPinnedMessage = response?.unpinnedMessage;
          const reaction = response?.reaction;
          if (message) {
            const messageId = message.messageId || '';
            const messageIdAutomated = message.Id || '';

            const existing = await MessageRepository.messageExists(messageId);
            const existingAuto =
              await MessageRepository.messageExistsById(messageIdAutomated);
            console.log(
              'isGiphyGif(message.content)==>',
              isGiphyGif(message.content),
            );

            const shouldStore =
              !existing && !(existingAuto && message.automated);
             
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
                createdAt: message.createdAt
                  ? new Date(+message.createdAt)
                  : new Date(),
                updatedAt: message.updatedAt
                  ? new Date(+message.updatedAt)
                  : new Date(),
                automated: message.automated || false,
                status: 'sent',
                replyTo: {
                  ...message.replyTo,
                  replyToContent: message.replyTo?.replyTocontent,
                },
                type,
                multimedia,
                transaction: message.transaction,
                preparedTransaction: message.preparedTransaction,
              });
            } else {
              await MessageRepository.updateServerIdByMessageId(
                message.messageId,
                message.Id,
              );
            }
          }
          try {
            if (pinnedMessage) {
              const isPinned = !!pinnedMessage?.isPinned;

              await MessageRepository.updateIsPinnedByMessageId(
                pinnedMessage.messageId,
                isPinned,
              );
            }
            if (reaction) {
              await MessageRepository.pushReactionToMessage(
                reaction.messageId,
                reaction,
              );
            }
            if (unPinnedMessage) {
              const isPinned = !!unPinnedMessage?.isPinned;

              await MessageRepository.updateIsPinnedByMessageId(
                unPinnedMessage.messageId,
                isPinned,
              );
            }
          } catch (err) {
            console.error('Failed to update pin status:', err);
          }

          await store.dispatch(
            fetchMessagesApi.util.invalidateTags(['Messages']),
          );
        });
      });

        stream_response.responses.onError(error => {
            console.error('[MessageStreamService] Error in stream:', error);
            this.isStreaming = false;
        });

      const requestHeader = await generateRequestHeader();
      const grpcRequest = GetChatMessagesRequest.create({
        requestHeader: {
          requestId: requestHeader.RequestId,
          deviceId: requestHeader.DeviceId,
          deviceModel: requestHeader.DeviceModel,
          timestamp: requestHeader.Timestamp,
        },
        body: {
          chatId,
          ...(timestamp ? {timestamp} : {}),
          ...(limit ? {limit} : {}),
          direction: direction || 'after',
        },
      });
      const grpcResponse = await this.subClient.getChatMessages(grpcRequest, {
        meta: {Authorization: `Bearer ${token}`},
      }).response;
      console.log("grpcResponse", grpcResponse)
      const messages = grpcResponse.groupMessages.map(msg => {
        const isMultimedia = !!msg?.multimedia?.length;
        let type: 'text' | 'image' | 'video' | 'file' | 'gif' = 'text';
        console.log('isGiphyGif(message.content)==>', isGiphyGif(msg.content));

        if (isMultimedia) {
          const mimeTypes = msg.multimedia.map(m => m.mimeType);
          if (mimeTypes.some(m => m.startsWith('image/'))) type = 'image';
          else if (mimeTypes.some(m => m.startsWith('video/'))) type = 'video';
          else type = 'file';
        }
        if (isGiphyGif(msg.content)) type = 'gif';

        const multimedia = isMultimedia
          ? msg.multimedia.map(media => ({...media, isLoading: false}))
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

      const pinnedMessages =
        grpcResponse.pinnedMessages?.map(msg => {
          const isMultimedia = !!msg?.multimedia?.length;
          let type: 'text' | 'image' | 'video' | 'file' | 'gif' = 'text';

          if (isMultimedia) {
            const mimeTypes = msg.multimedia.map(m => m.mimeType);
            if (mimeTypes.some(m => m.startsWith('image/'))) type = 'image';
            else if (mimeTypes.some(m => m.startsWith('video/')))
              type = 'video';
            else type = 'file';
          }
          if (isGiphyGif(msg.content)) type = 'gif';

          const multimedia = isMultimedia
            ? msg.multimedia.map(media => ({...media, isLoading: false}))
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
      const localPinMessages =
        await MessageRepository.getMessagesByChatId(chatId);
      const localPinMessageIds = localPinMessages.map(
        m => m.messageId || m._id,
      );
      const newPinMessages = pinnedMessages.filter(msg => {
        const id = msg.automated ? msg._id : msg.messageId;
        return !localPinMessageIds.includes(id);
      });
      await Promise.all([
        newMessages.map(msg => MessageRepository.addMessage(msg)),
        newPinMessages.map(pin => MessageRepository.addMessage(pin)),
      ]);

      store.dispatch(fetchMessagesApi.util.invalidateTags(['Messages']));
    } catch (error) {
      console.error('[MessageStreamService] Error starting stream:', error);
      this.isStreaming = false;
    }
  }

  public unsubscribeFromChat(chatId: string) {
    if (this.streamMap[chatId]?.close) {
      this.streamMap[chatId].close();
      delete this.streamMap[chatId];
      console.log(`[MessageStreamService] Unsubscribed from chat: ${chatId}`);
    }
  }

  public unsubscribeAll() {
    Object.keys(this.streamMap).forEach(chatId => this.unsubscribeFromChat(chatId));
    console.log('[MessageStreamService] Unsubscribed from all chat streams');
  }

  private isGiphyGif(url: string): boolean {
    return typeof url === 'string' && (url.includes('giphy.com/media/') || url.includes('media.giphy.com/media/'));
  }
}

export default MessageStreamService;