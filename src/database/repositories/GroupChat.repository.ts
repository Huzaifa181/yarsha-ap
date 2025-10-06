import Realm from 'realm';
import {GroupChatModel, ParticipantDetailsModel} from '../models';
import {getRealmInstance} from '@/services';

class GroupChatRepository {
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
      console.log('✅ GroupChat Repository initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize GroupChat Repository:', error);
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
   * 🚀 Save or Update Group Chat along with Participants
   */
  async saveGroupChat(chatData: {
    ChatId: string;
    GroupName: string;
    GroupIcon?: string;
    BackgroundColor: string;
    GroupDescription: string;
    Type: 'individual' | 'group' | 'community';
    ParticipantsId: string[];
    ParticipantDetails: {
      Id: string;
      Username: string;
      FullName: string;
      ProfilePicture?: string;
      Role: 'member' | 'creator';
      BackgroundColor: string;
      LastActive: string;
      Status: 'online' | 'offline';
    }[];
  }) {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const participants = chatData.ParticipantDetails.map(p => {
          return realm.create(
            'ParticipantDetailsModel',
            p,
            Realm.UpdateMode.Modified,
          );
        });

        console.log("Chat Data =>", chatData);

        realm.create(
          'GroupChatModel',
          {
            ChatId: chatData.ChatId,
            GroupName: chatData.GroupName,
            GroupIcon: chatData.GroupIcon || '',
            GroupDescription: chatData.GroupDescription || '',
            BackgroundColor: chatData.BackgroundColor,
            Type: chatData.Type,
            ParticipantsId: chatData.ParticipantsId,
            Participants: participants,
          },
          Realm.UpdateMode.Modified,
        );

        console.log(`✅ Group chat [${chatData.ChatId}] saved successfully.`);
      });
    } catch (error) {
      console.error('❌ Error saving group chat:', error);
    }
  }

  /**
   * 🚀 Update Any Field(s) in Group Chat, including Participants
   */
  async updateGroupChat(
    chatId: string,
    updates: Partial<Omit<GroupChatModel, 'ChatId'>>,
    participantUpdates?: ParticipantDetailsModel[],
  ) {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const chat = realm.objectForPrimaryKey<GroupChatModel>(
          'GroupChatModel',
          chatId,
        );

        if (!chat) {
          console.error(`❌ Group chat [${chatId}] not found.`);
          return;
        }

        Object.keys(updates).forEach(key => {
          if (key !== 'ChatId' && (updates as any)[key] !== undefined) {
            (chat as any)[key] = (updates as Record<string, any>)[key];
          }
        });

        if (participantUpdates && participantUpdates.length > 0) {
          participantUpdates.forEach(participantData => {
            const existingParticipant =
              realm.objectForPrimaryKey<ParticipantDetailsModel>(
                'ParticipantDetailsModel',
                participantData.Id,
              );

            if (existingParticipant) {
              Object.keys(participantData).forEach(key => {
                if (
                  key !== 'Id' &&
                  (participantData as any)[key] !== undefined
                ) {
                  (existingParticipant as any)[key] = (
                    participantData as Record<string, any>
                  )[key];
                }
              });
            } else {
              const newParticipant = realm.create(
                'ParticipantDetailsModel',
                participantData,
                Realm.UpdateMode.Modified,
              );

              console.log("New Participant =>", newParticipant);

              chat.Participants.push(newParticipant);
            }
          });
        }

        console.log(`✅ Group chat [${chatId}] updated successfully.`);
      });
    } catch (error) {
      console.error(`❌ Error updating group chat [${chatId}]:`, error);
    }
  }

  /**
   * 🚀 Fetch Group Chat by ID
   */
  async getGroupChatById(chatId: string): Promise<GroupChatModel | null> {
    const realm = await this.ensureRealm();
    try {
      return (
        realm.objectForPrimaryKey<GroupChatModel>('GroupChatModel', chatId) ||
        null
      );
    } catch (error) {
      console.error('❌ Error fetching group chat by ID:', error);
      return null;
    }
  }

  /**
   * 🚀 Fetch All Group Chats
   */
  async getAllGroupChats(): Promise<GroupChatModel[]> {
    const realm = await this.ensureRealm();
    try {
      const chats = realm
        .objects<GroupChatModel>('GroupChatModel')
        .sorted('ChatId', true);
      return chats.map(chat => JSON.parse(JSON.stringify(chat)));
    } catch (error) {
      console.error('❌ Error fetching all group chats:', error);
      return [];
    }
  }

  /**
   * 🚀 Fetch Participants of a Group Chat
   */
  async getParticipantsByChatId(
    chatId: string,
  ): Promise<ParticipantDetailsModel[]> {
    try {
      const chat = await this.getGroupChatById(chatId);
      if (!chat) return [];
      return chat.Participants.map(participant =>
        JSON.parse(JSON.stringify(participant)),
      );
    } catch (error) {
      console.error(
        `❌ Error fetching participants for chat [${chatId}]:`,
        error,
      );
      return [];
    }
  }

  /**
   * 🚀 Delete Group Chat by ID
   */
  async deleteGroupChatById(chatId: string) {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const chat = realm.objectForPrimaryKey<GroupChatModel>(
          'GroupChatModel',
          chatId,
        );
        if (chat) {
          realm.delete(chat);
          console.log(`✅ Deleted group chat [${chatId}] from Realm.`);
        }
      });
    } catch (error) {
      console.error('❌ Error deleting group chat:', error);
    }
  }

  /**
   * 🚀 Delete All Group Chats
   */
  async deleteAllGroupChats() {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        realm.delete(realm.objects('GroupChatModel'));
        console.log('✅ All group chats deleted.');
      });
    } catch (error) {
      console.error('❌ Error deleting all group chats:', error);
    }
  }

  /**
   * 🚀 Fetch a Participant by Participant ID
   */
  async getParticipantById(
    participantId: string,
  ): Promise<ParticipantDetailsModel | null> {
    const realm = await this.ensureRealm();
    try {
      const participant = realm.objectForPrimaryKey<ParticipantDetailsModel>(
        'ParticipantDetailsModel',
        participantId,
      );

      return participant ? JSON.parse(JSON.stringify(participant)) : null;
    } catch (error) {
      console.error(
        `❌ Error fetching participant by ID [${participantId}]:`,
        error,
      );
      return null;
    }
  }

  /**
   * 🚀 Close the Realm Instance
   */
  async closeRealm() {
    const realm = await this.ensureRealm();
    if (!realm.isClosed) {
      realm.close();
      console.log('✅ Realm instance closed.');
    }
  }
}

export default new GroupChatRepository();
