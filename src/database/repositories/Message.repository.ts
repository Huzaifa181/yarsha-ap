import Realm from 'realm';
import {getRealmInstance} from '@/services';
import {MessageModel} from '../models';
import { ReactionPayload } from '@/pb/stream.message';

class MessageRepository {
  private realm!: Realm;

  constructor() {
    this.init();
  }

  /**
   * **Asynchronously Initialize Realm**
   */
  private async init() {
    try {
      const realmInstance = await getRealmInstance();
      if (!realmInstance) {
        throw new Error('Failed to initialize Realm instance');
      }
      this.realm = realmInstance;
      console.log('✅ Message Repository initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize Message Repository:', error);
    }
  }

  /**
   * **Ensure Realm is Ready Before Any Operation**
   */
  private async ensureRealm(): Promise<Realm> {
    if (!this.realm) {
      const realmInstance = await getRealmInstance();
      if (!realmInstance) {
        throw new Error('Failed to initialize Realm instance');
      }
      this.realm = realmInstance;
    }
    return this.realm;
  }

  /**
   * 📩 Add a new message to Realm Database
   * @param messageData - The message object to store
   * @returns The created message object
   */
  async addMessage(
    messageData: Partial<MessageModel>,
  ): Promise<MessageModel | null> {
    const realm = await this.ensureRealm();
    try {
      let savedMessage: MessageModel | null = null;
      console.log('messageData===>', messageData);
      realm.write(() => {
        const safeMessageData = {
          _id: messageData._id ?? new Realm.BSON.ObjectId().toHexString(),
          chatId: messageData.chatId ?? '',
          senderId: messageData.senderId ?? '',
          serverId: messageData.serverId ?? '',
          content: messageData.content ?? '',
          messageId: messageData.messageId ?? '',
          automated: messageData.automated ?? false,
          status: messageData.status ?? 'pending',
          type: messageData.type ?? 'text',
          isPinned: !!messageData.isPinned,
          multimedia: messageData.multimedia ?? null,
          transaction: messageData.transaction ?? null,
          replyTo: messageData.replyTo ?? null,
          reactions: messageData.reactions ?? null,
          preparedTransaction: messageData.preparedTransaction ?? '',
        };

        let existingMessage = realm.objectForPrimaryKey(
          'MessageModel',
          safeMessageData._id,
        );

        if (existingMessage) {
          console.log('🔄 Updating existing message:', safeMessageData._id);
          console.log(
            '🔄 Updating existing message safeMessageData:',
            safeMessageData,
          );

          existingMessage.chatId = safeMessageData.chatId;
          existingMessage.senderId = safeMessageData.senderId;
          existingMessage.content = safeMessageData.content;
          existingMessage.messageId = safeMessageData.messageId;
          existingMessage.serverId = safeMessageData.serverId;
          existingMessage.automated = safeMessageData.automated;
          existingMessage.status = safeMessageData.status;
          existingMessage.updatedAt = messageData.updatedAt ?? new Date();
          existingMessage.createdAt = messageData.createdAt ?? new Date();
          existingMessage.type = safeMessageData.type;
          existingMessage.isPinned = !!safeMessageData.isPinned;
          existingMessage.multimedia = safeMessageData.multimedia;
          existingMessage.transaction = safeMessageData.transaction;
          existingMessage.replyTo = safeMessageData.replyTo;
          existingMessage.reactions = safeMessageData.reactions;
          existingMessage.preparedTransaction =
            safeMessageData.preparedTransaction;

          savedMessage = JSON.parse(JSON.stringify(existingMessage));
        } else {
          const message = realm.create('MessageModel', {
            ...safeMessageData,
            createdAt: messageData.createdAt ?? new Date(),
            updatedAt: messageData.updatedAt ?? new Date(),
          });

          savedMessage = JSON.parse(JSON.stringify(message));
        }
      });

      console.log('✅ Message saved successfully:', savedMessage);
      return savedMessage;
    } catch (error) {
      console.error('❌ Error adding/updating message:', error);
      return null;
    }
  }

  async updateServerIdByMessageId(
    messageId: string,
    serverId: string,
  ): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const message = realm
          .objects<MessageModel>('MessageModel')
          .filtered('messageId == $0', messageId)[0];

        if (message) {
          message.serverId = serverId;
          message.updatedAt = new Date();
          console.log(`✅ serverId updated for messageId ${messageId}`);
        } else {
          console.warn(`⚠️ No message found with messageId ${messageId}`);
        }
      });
    } catch (error) {
      console.error(
        `❌ Error updating serverId for messageId ${messageId}:`,
        error,
      );
    }
  }

  /**
   * 📜 Get all messages for a specific chatId
   * @param chatId - ID of the chat to fetch messages for
   * @returns List of messages
   */
  async getMessagesByChatId(chatId: string): Promise<MessageModel[]> {
    const realm = await this.ensureRealm();
    try {
      const messages = realm
        .objects<MessageModel>('MessageModel')
        .filtered('chatId == $0', chatId);

      const formattedMessages = messages.map(msg =>
        JSON.parse(JSON.stringify(msg)),
      );
      console.log('formattedMessages===>', formattedMessages);
      formattedMessages.sort((a, b) => {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      return formattedMessages;
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      return [];
    }
  }

  /**
   * 📝 Update a message content
   * @param messageId - ID of the message to update
   * @param newContent - The new message content
   */
  async updateMessage(messageId: string, newContent: string): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const message = realm.objectForPrimaryKey<MessageModel>(
          'MessageModel',
          messageId,
        );
        if (message) {
          message.messageId = messageId;
          message.content = newContent;
          message.updatedAt = new Date();
          console.log('✅ Message updated:', message);
        } else {
          console.warn('⚠️ Message not found for update');
        }
      });
    } catch (error) {
      console.error('❌ Error updating message:', error);
    }
  }

  /**
   * 🔍 Check if a message exists by its ID
   * @param messageId - The ID of the message to check
   * @returns Boolean indicating whether the message exists
   */
  async messageExists(messageId: string): Promise<boolean> {
    const realm = await this.ensureRealm();
    try {
      const message = realm
        .objects<MessageModel>('MessageModel')
        .filtered('messageId == $0', messageId)[0];
      return !!message;
    } catch (error) {
      console.error('❌ Error checking message existence:', error);
      return false;
    }
  }

  async messageExistsById(id: string): Promise<boolean> {
    const realm = await this.ensureRealm();
    try {
      const message = realm.objectForPrimaryKey<MessageModel>(
        'MessageModel',
        id,
      );
      console.log('message _id existence check result:', message);
      return !!message;
    } catch (error) {
      console.error('❌ Error checking _id existence:', error);
      return false;
    }
  }

  /**
   * 🗑️ Delete a message
   * @param messageId - The ID of the message to delete
   */
  async deleteMessage(messageId: string): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const message = realm.objectForPrimaryKey<MessageModel>(
          'MessageModel',
          messageId,
        );
        if (message) {
          realm.delete(message);
          console.log(`✅ Message with ID ${messageId} deleted`);
        } else {
          console.warn('⚠️ Message not found for deletion');
        }
      });
    } catch (error) {
      console.error('❌ Error deleting message:', error);
    }
  }

  /**
   * 🗑️ Delete all messages in a chat
   * @param chatId - ID of the chat whose messages should be deleted
   */
  async deleteAllMessagesInChat(chatId: string): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const messages = realm
          .objects<MessageModel>('MessageModel')
          .filtered('chatId == $0', chatId);
        realm.delete(messages);
        console.log(`✅ All messages in chat ${chatId} deleted`);
      });
    } catch (error) {
      console.error('❌ Error deleting all messages:', error);
    }
  }

  async updateMessageId(
    oldMessageId: string,
    newMessageId: string,
  ): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const message = realm.objectForPrimaryKey<MessageModel>(
          'MessageModel',
          oldMessageId,
        );
        if (message) {
          message.messageId = newMessageId;
          message.updatedAt = new Date();
          console.log(
            `✅ Message ID updated: ${oldMessageId} → ${newMessageId}`,
          );
        } else {
          console.warn('⚠️ Message not found for ID update');
        }
      });
    } catch (error) {
      console.error('❌ Error updating message ID:', error);
    }
  }

  /**
   * 🚀 Get the latest message in a chat
   * @param chatId - Chat ID to fetch the latest message
   * @returns The latest message
   */
  async getLatestMessage(chatId: string): Promise<MessageModel | null> {
    const realm = await this.ensureRealm();
    try {
      const messages = realm
        .objects<MessageModel>('MessageModel')
        .filtered('chatId == $0', chatId)
        .sorted('createdAt', true);
      return messages.length > 0 ? messages[0] : null;
    } catch (error) {
      console.error('❌ Error fetching latest message:', error);
      return null;
    }
  }

  /**
   * ⏳ Get the earliest (oldest) message in a chat
   * @param chatId - Chat ID to fetch the earliest message
   * @returns The earliest message
   */
  async getEarliestMessage(chatId: string): Promise<MessageModel | null> {
    console.log("getEarliestMessage===>", chatId)
    const realm = await this.ensureRealm();
    try {
      const messages = realm
        .objects<MessageModel>('MessageModel')
        .filtered('chatId == $0', chatId)
        .sorted('createdAt', false);
        return messages.length > 0 ? JSON.parse(JSON.stringify(messages[0])) : null;
      } catch (error) {
      console.error('❌ Error fetching earliest message:', error);
      return null;
    }
  }

  /**
   * 🔄 Update message by _id with new content, status, and data
   * @param id - The internal _id of the message (Realm primary key)
   * @param updates - Object containing fields to update
   */
  async updateMessageById(
    id: string,
    updates: Partial<
      Pick<
        MessageModel,
        | 'content'
        | 'status'
        | 'multimedia'
        | 'transaction'
        | 'preparedTransaction'
      >
    >,
  ): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const message = realm.objectForPrimaryKey<MessageModel>(
          'MessageModel',
          id,
        );
        console.log('message', message);
        if (message) {
          if (updates.content !== undefined) message.content = updates.content;
          if (updates.status !== undefined) message.status = updates.status;
          if (updates.multimedia !== undefined)
            message.multimedia = updates.multimedia;
          if (updates.transaction !== undefined)
            message.transaction = updates.transaction;
          if (updates.preparedTransaction !== undefined)
            message.preparedTransaction = updates.preparedTransaction;
          message.updatedAt = new Date();
          console.log(`✅ Message ${id} updated with:`, updates);
        } else {
          console.warn(`⚠️ No message found for ID: ${id}`);
        }
      });
    } catch (error) {
      console.error(`❌ Error updating message ${id}:`, error);
    }
  }

  /**
   * 🔍 Get a message by content and chatId to check for duplicates
   * @param chatId - The chat where the message was sent
   * @param content - The exact message content
   * @returns The existing message or null
   */
  async getMessageByContent(
    chatId: string,
    content: string,
  ): Promise<MessageModel | null> {
    const realm = await this.ensureRealm();
    try {
      const existingMessages = realm
        .objects<MessageModel>('MessageModel')
        .filtered('chatId == $0 && messageId == $1', chatId, content);

      return existingMessages.length > 0 ? existingMessages[0] : null;
    } catch (error) {
      console.error('❌ Error fetching message by content:', error);
      return null;
    }
  }

  /**
   * 🔄 Update the status of a message (pending, syncing, sent)
   * @param messageId - ID of the message to update
   * @param newStatus - New status ('pending', 'syncing', 'sent')
   */
  async updateMessageStatus(
    messageId: string,
    newStatus: 'pending' | 'syncing' | 'sent' | 'failed',
  ): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const message = realm.objectForPrimaryKey<MessageModel>(
          'MessageModel',
          messageId,
        );
        if (message) {
          message.status = newStatus;
          message.updatedAt = new Date();
          console.log(
            `✅ Message ${messageId} status updated to: ${newStatus}`,
          );
        } else {
          console.warn('⚠️ Message not found for status update');
        }
      });
    } catch (error) {
      console.error('❌ Error updating message status:', error);
    }
  }

  async updateMessageType(
    messageId: string,
    newType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'blink' | 'failed' | 'gif',
  ): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const message = realm.objectForPrimaryKey<MessageModel>(
          'MessageModel',
          messageId,
        );
        if (message) {
          message.type = newType;
          message.updatedAt = new Date();
          console.log(`✅ Message ${messageId} type updated to: ${newType}`);
        } else {
          console.warn('⚠️ Message not found for type update');
        }
      });
    } catch (error) {
      console.error('❌ Error updating message type:', error);
    }
  }

  /**
   * 🔍 Get a message by its status
   * @param chatId - The chat where the message was sent
   * @param status - The status of the message (pending, syncing, sent)
   * @returns The existing message or null
   */
  async getMessageByStatus(
    chatId: string,
    status: string,
  ): Promise<MessageModel | null> {
    const realm = await this.ensureRealm();
    try {
      const existingMessages = realm
        .objects<MessageModel>('MessageModel')
        .filtered('chatId == $0 && status == $1', chatId, status);

      return existingMessages.length > 0 ? existingMessages[0] : null;
    } catch (error) {
      console.error('❌ Error fetching message by status:', error);
      return null;
    }
  }

  /**
   * 🛑 Close the Realm instance
   */
  async close(): Promise<void> {
    const realm = await this.ensureRealm();
    if (!realm.isClosed) {
      realm.close();
      console.log('🛑 Realm database closed');
    }
  }

  /**
   * 📌 Update the isPinned status of a message
   * @param messageId - ID of the message to update
   * @param isPinned - Boolean indicating pin state
   */
  async updateIsPinnedByMessageId(
    messageId: string,
    isPinned: boolean,
  ): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const message = realm
          .objects<MessageModel>('MessageModel')
          .filtered('messageId == $0', messageId)[0];

        if (message) {
          message.isPinned = isPinned;
          message.updatedAt = new Date();
          console.log(
            `✅ isPinned updated to ${isPinned} for messageId ${messageId}`,
          );
        } else {
          console.warn(
            `⚠️ No message found with messageId ${messageId} for isPinned update`,
          );
        }
      });
    } catch (error) {
      console.error(
        `❌ Error updating isPinned for messageId ${messageId}:`,
        error,
      );
    }
  }

  async pushReactionToMessage(messageId: string, reaction: ReactionPayload): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const message = realm.objectForPrimaryKey<MessageModel>('MessageModel', messageId);
        if (message) {
          const existingReactions = (message.reactions || []) as ReactionPayload[];
          message.reactions = [...existingReactions, reaction];
          message.updatedAt = new Date();
          console.log(`✅ Reaction pushed for message ${messageId}`);
        } else {
          console.warn(`⚠️ No message found for pushing reaction with ID: ${messageId}`);
        }
      });
    } catch (error) {
      console.error(`❌ Error pushing reaction to message ${messageId}:`, error);
    }
  }  

  /**
   * 🗑️ Delete all messages in the database
   */
  async deleteAllMessages(): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const messages = realm.objects<MessageModel>('MessageModel');
        realm.delete(messages);
        console.log('✅ All messages deleted from the database');
      });
    } catch (error) {
      console.error('❌ Error deleting all messages:', error);
    }
  }
}

export default new MessageRepository();
