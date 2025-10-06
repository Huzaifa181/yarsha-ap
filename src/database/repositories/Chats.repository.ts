import {getRealmInstance} from '@/services';
import Realm from 'realm';
import {
  ChatMetaDataModel,
  ChatsModel,
  SeenDetailsModel,
} from '../models/Chats.model';
import {CHAT_PAGINATION_LIMIT} from '@/constants';
import {SCHEMA_VERSION} from '@/services/realm/schemaVersions';

const ensureSchemaVersion = (model: ChatsModel) => {
  if (model.schemaVersion < SCHEMA_VERSION) {
    const realm = getRealmInstance();
    if (!realm) {
      throw new Error('Realm instance is not initialized.');
    }
    realm.write(() => {
      model.schemaVersion = SCHEMA_VERSION;
    });
  }
  return model;
};

class ChatsRepository {
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
      console.log('✅ Chats Repository initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize Chats Repository:', error);
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
   * Create or update a group chat.
   */
  async createOrUpdateGroupChat(chatData: Partial<ChatsModel>) {
    const realm = await this.ensureRealm();
    console.log('🔄 Starting group chat creation/update...', chatData);
    console.log(
      `⚡ Attempting to create/update group chat: ${chatData.groupId}`,
    );

    try {
      realm.write(() => {
        console.log('✅ Realm write transaction started.');

        const existingChat = this.getGroupChatById(chatData.groupId || '');
        if (existingChat) {
          console.log(`🗑️ Removing existing chat with ID: ${chatData.groupId}`);
          realm.delete(existingChat);
        }

        console.log('🔹 Creating lastMessage object in Realm...');
        const lastMessage = realm.create(
          'LastMessageModel',
          {
            messageId: chatData.lastMessage?.messageId || '',
            senderId: chatData.lastMessage?.senderId || '',
            senderName: chatData.lastMessage?.senderName || '',
            text: chatData.lastMessage?.text || '',
            messageType: chatData.lastMessage?.messageType || 'text',
            timestamp: chatData.lastMessage?.timestamp
              ? new Date(chatData.lastMessage.timestamp).toISOString()
              : new Date().toISOString(),
          },
          Realm.UpdateMode.Modified,
        );

        console.log('🔹 Creating seenDetails list in Realm...');
        const seenDetailsList: SeenDetailsModel[] = [];

        chatData.seenDetails?.forEach(sd => {
          const detail = realm.create(
            'SeenDetailsModel',
            {
              participantId: sd.participantId,
              seenCount: sd.seenCount,
              timeStamp: sd.timeStamp,
            },
            Realm.UpdateMode.Modified,
          ) as SeenDetailsModel;

          console.log('seen details pushed =>', detail);

          seenDetailsList.push(detail);
        });

        console.log('✅ Successfully created lastMessage and seenDetails.');

        console.log('🔹 Creating new chat entry in Realm...');
        realm.create('ChatsModel', {
          groupId: chatData.groupId || '',
          groupName: chatData.groupName || '',
          type: chatData.type || '',
          groupIcon: chatData.groupIcon || '',
          participants: chatData.participants || [],
          isPinned: chatData.isPinned,
          isMuted: chatData.isMuted,
          lastMessage,
          seenDetails: seenDetailsList,
          backgroundColor: chatData.backgroundColor || '#FFFFFF',
          createdAt: chatData.createdAt || new Date(),
          pinnedAt: chatData.pinnedAt,
          schemaVersion: chatData.schemaVersion ?? 1,
          messageCount: Number(chatData.messageCount) || 0,
          isIndividualBotChat: chatData.isIndividualBotChat || false,
        });

        console.log(
          `✅ Successfully saved group chat to Realm: ${chatData.groupId}`,
        );
      });

      console.log('🟢 Realm write transaction completed.');
    } catch (error) {
      console.error(`❌ Error during Realm transaction: ${error}`);
    }
  }

  /**
   * 🚀 Batch insert multiple group chats efficiently
   */
  async batchInsertGroupChats(chats: Partial<ChatsModel>[]) {
    const realm = await this.ensureRealm();
    if (!Array.isArray(chats) || chats.length === 0) {
      console.log('❌ No group chats to insert.');
      return;
    }

    console.log('chats chats chats chats', chats);

    try {
      realm.write(() => {
        console.log(`🔄 Processing ${chats.length} group chats.`);

        const incomingGroupIds = new Set(chats.map(chat => chat.groupId));

        const existingChats = realm.objects<ChatsModel>('ChatsModel');

        const existingGroupIds = new Set(
          existingChats.map(chat => chat.groupId),
        );

        console.log(
          `🔍 Found ${existingChats.length} existing group chats in Realm.`,
        );

        console.log(
          `🔍 Found ${existingGroupIds} existing group chats in Realm.`,
        );

        existingChats.forEach(chat => {
          if (!incomingGroupIds.has(chat.groupId)) {
            console.log(`🗑️ Deleting outdated group chat: ${chat.groupId}`);
            realm.delete(chat);
          }
        });

        chats.forEach(chatData => {
          if (!chatData.groupId) return;

          const participantsList = chatData.participants
            ? [...chatData.participants]
            : [];
          const lastMessage = chatData.lastMessage
            ? {
                messageId: chatData.lastMessage.messageId || '',
                senderId: chatData.lastMessage.senderId || '',
                senderName: chatData.lastMessage.senderName || '',
                text: chatData.lastMessage.text || '',
                messageType: chatData.lastMessage.messageType || 'text',
                timestamp: chatData.lastMessage.timestamp
                  ? new Date(chatData.lastMessage.timestamp).toISOString()
                  : new Date().toISOString(),
              }
            : undefined;

          const seenDetailsList: SeenDetailsModel[] = [];

          chatData.seenDetails?.forEach(sd => {
            const detail = realm.create(
              'SeenDetailsModel',
              {
                participantId: sd.participantId,
                seenCount: sd.seenCount,
                timeStamp: sd.timeStamp,
              },
              Realm.UpdateMode.Modified,
            ) as SeenDetailsModel;

            seenDetailsList.push(detail);
          });

          console.log('seeen details =>', seenDetailsList);

          if (existingGroupIds.has(chatData.groupId)) {
            const existingChat = realm.objectForPrimaryKey(
              'ChatsModel',
              chatData.groupId,
            );
            if (existingChat) {
              console.log(`🔄 Updating group chat: ${chatData.groupId}`);
              Object.assign(existingChat, {
                groupName: chatData.groupName || existingChat.groupName,
                type: chatData.type || existingChat.type,
                groupIcon: chatData.groupIcon || existingChat.groupIcon,
                participants: participantsList,
                lastMessage,
                seenDetails: seenDetailsList,
                backgroundColor:
                  chatData.backgroundColor || existingChat.backgroundColor,
              });
            }
          } else {
            console.log(`✅ Creating new group chat: ${chatData.groupId}`);
            realm.create('ChatsModel', {
              groupId: chatData.groupId,
              groupName: chatData.groupName || 'Unnamed Chat',
              type: chatData.type,
              groupIcon: chatData.groupIcon || '',
              participants: participantsList,
              lastMessage,
              backgroundColor: chatData.backgroundColor || '#FFFFFF',
            });
          }
        });
      });

      console.log(`✅ Successfully processed ${chats.length} group chats.`);
    } catch (error) {
      console.error('❌ Error inserting/updating group chats:', error);
    }
  }

  /**
   * Get a group chat by ID.
   */
  async getGroupChatById(groupId: string): Promise<ChatsModel | null> {
    const realm = await this.ensureRealm();
    const chat = realm.objectForPrimaryKey('ChatsModel', groupId);
    if (!chat) return null;
    return ensureSchemaVersion(chat as unknown as ChatsModel);
  }

  /**
   * Get all group chats.
   */
  async getAllGroupChats(): Promise<ChatsModel[]> {
    const realm = await this.ensureRealm();
    try {
      const realmChats = realm.objects<ChatsModel>('ChatsModel');

      // Separate pinned and unpinned
      const pinnedChats = realmChats
        .filtered('isPinned == "true"')
        .sorted('pinnedAt', true)
        .slice(0, 5); // Max 5 pinned

      const unpinnedChats = realmChats
        .filtered('isPinned != "true" OR isPinned == null')
        .sorted('lastMessage.timestamp', true);

      // Merge
      const finalChats = [...pinnedChats, ...unpinnedChats];

      // Convert to plain JS objects
      const plainChats = finalChats.map(chat =>
        JSON.parse(JSON.stringify(chat)),
      );

      console.log(
        `📂 Retrieved ${plainChats.length} group chats (5 pinned + unpinned).`,
      );

      return plainChats;
    } catch (error) {
      console.error(`❌ Error fetching all group chats:`, error);
      return [];
    }
  }

  /**
   * Delete a group chat by ID.
   */
  async deleteGroupChatById(groupId: string) {
    const realm = await this.ensureRealm();
    realm.write(() => {
      const chat = this.getGroupChatById(groupId);
      if (chat) {
        realm.delete(chat);
        console.log(`✅ Group chat ${groupId} deleted from Realm.`);
      }
    });
  }

  /**
   * Delete all group chats.
   */
  async deleteAllGroupChats() {
    const realm = await this.ensureRealm();
    realm.write(() => {
      realm.delete(realm.objects('ChatsModel'));
      console.log('✅ All group chats deleted from Realm.');
    });
  }

  /** Update a group chat */
  async updateGroupChat(chatData: Partial<ChatsModel>) {
    await this.createOrUpdateGroupChat(chatData);
  }

  /**
   * Get paginated group chats.
   * @param page - The page number (starts from 1).
   * @param limit - The number of chats per page.
   * @returns - A paginated list of group chats.
   */
  async getGroupChatsPaginated(
    page: number,
    limit: number,
  ): Promise<ChatsModel[]> {
    const realm = await this.ensureRealm();
    try {
      const offset = (page - 1) * limit;
      const realmChats = realm
        .objects<ChatsModel>('ChatsModel')
        .sorted('lastMessage.timestamp', true)
        .slice(offset, offset + limit);

      const plainChats = realmChats.map(chat =>
        JSON.parse(JSON.stringify(chat)),
      );

      console.log(
        `📂 Fetched ${plainChats.length} group chats for page ${page}.`,
      );
      return plainChats;
    } catch (error) {
      console.error(`❌ Error fetching paginated group chats:`, error);
      return [];
    }
  }

  /**
   * 🏷️ Get total pages from Realm
   */
  async getTotalPages(): Promise<number> {
    const realm = await this.ensureRealm();
    try {
      const totalChats = realm.objects<ChatsModel>('ChatsModel').length;
      const totalPages = Math.ceil(totalChats / +CHAT_PAGINATION_LIMIT);
      console.log(`📊 Total Pages Calculated: ${totalPages}`);
      return totalPages || 1;
    } catch (error) {
      console.error('❌ Error calculating total pages:', error);
      return 1;
    }
  }

  /**
   * 📥 Update total pages in Realm
   */
  async updateTotalPages(newTotalPages: number) {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        let metaData = realm.objectForPrimaryKey<ChatMetaDataModel>(
          'ChatMetaDataModel',
          'pagination',
        );

        if (metaData) {
          metaData.totalPages = newTotalPages;
        } else {
          realm.create('ChatMetaDataModel', {
            id: 'pagination',
            totalPages: newTotalPages,
          });
        }
      });
      console.log(`✅ Updated totalPages in Realm: ${newTotalPages}`);
    } catch (error) {
      console.error('❌ Error updating total pages:', error);
    }
  }

  async updateSeenDetails(
    groupId: string,
    participantId: string,
    seenCount: number,
    timeStamp: string,
  ) {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const chat = realm.objectForPrimaryKey<ChatsModel>(
          'ChatsModel',
          groupId,
        );
        if (chat) {
          const seenDetails = chat.seenDetails;
          const existingSeenDetail = seenDetails.find(
            sd => sd.participantId === participantId,
          );
          if (existingSeenDetail) {
            existingSeenDetail.seenCount = seenCount;
            existingSeenDetail.timeStamp = timeStamp;
          } else {
            const newSeenDetail = realm.create(
              'SeenDetailsModel',
              {
                participantId,
                seenCount,
                timeStamp,
              },
              Realm.UpdateMode.Modified,
            ) as SeenDetailsModel;
            seenDetails.push(newSeenDetail);
          }
        }
      });
      console.log(
        `✅ Updated seen details for participant ${participantId} in group ${groupId}.`,
      );
    } catch (error) {
      console.error(
        `❌ Error updating seen details for group ${groupId}:`,
        error,
      );
    }
  }

  /**
   * Get paginated group chats by offset.
   * Supports infinite scrolling.
   */
  async getGroupChatsByOffset(
    offset: number,
    limit: number,
  ): Promise<ChatsModel[]> {
    const realm = await this.ensureRealm();
    try {
      const realmChats = realm
        .objects<ChatsModel>('ChatsModel')
        .sorted('lastMessage.timestamp', true)
        .slice(offset, offset + limit);

      const plainChats = realmChats.map(chat =>
        JSON.parse(JSON.stringify(chat)),
      );

      console.log(
        `📂 Fetched ${plainChats.length} chats from offset ${offset}.`,
      );
      return plainChats;
    } catch (error) {
      console.error('❌ Error in getGroupChatsByOffset:', error);
      return [];
    }
  }

  public getRealmInstance(): Realm {
    return this.realm;
  }
}

export default new ChatsRepository();
