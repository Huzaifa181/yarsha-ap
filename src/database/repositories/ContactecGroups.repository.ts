import { getRealmInstance } from '@/services';
import Realm from 'realm';
import { ContactedChatModel } from '../models';

/**
 * Repository for managing contacted groups using Realm.
 */
class ContactedGroupsRepository {
  private realm!: Realm;

  constructor() {
    this.init();
  }

  /**
   * Asynchronously initialize the Realm instance.
   */
  private async init() {
    try {
      const realmInstance = await getRealmInstance();
      if (!realmInstance) {
        throw new Error('Failed to initialize Realm instance');
      }
      this.realm = realmInstance;
      console.log('✅ Contacted Groups Repository initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize Contacted Groups Repository:', error);
    }
  }

  /**
   * Ensures Realm is initialized before executing any operation.
   * @returns The active Realm instance.
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
   * Inserts a new contacted group.
   * Will throw an error if a group with the same ChatId already exists.
   * @param group - Group data to insert.
   */
  async insertGroup(group: ContactedChatModel): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      const exists = realm.objectForPrimaryKey<ContactedChatModel>('ContactedChatModel', group.ChatId);
      if (exists) {
        throw new Error(`Group with ID ${group.ChatId} already exists`);
      }

      realm.write(() => {
        realm.create<ContactedChatModel>('ContactedChatModel', group);
      });
    } catch (error) {
      console.error('Error inserting group:', error);
    }
  }

  /**
   * Updates an existing contacted group.
   * Will throw an error if the group does not exist.
   * @param group - Group data to update.
   */
  async updateGroup(group: Partial<ContactedChatModel> & { ChatId: string }): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      const existing = realm.objectForPrimaryKey<ContactedChatModel>('ContactedChatModel', group.ChatId);
      if (!existing) {
        throw new Error(`Group with ID ${group.ChatId} does not exist`);
      }

      realm.write(() => {
        realm.create<ContactedChatModel>('ContactedChatModel', group, Realm.UpdateMode.Modified);
      });
    } catch (error) {
      console.error('Error updating group:', error);
    }
  }

  /**
   * Retrieves a contacted group by its ID.
   * @param groupId - The unique identifier of the group.
   * @returns The matching group object or undefined.
   */
  async getGroupById(groupId: string): Promise<ContactedChatModel | undefined> {
    const realm = await this.ensureRealm();
    return realm.objectForPrimaryKey<ContactedChatModel>('ContactedChatModel', groupId) ?? undefined;
  }

  /**
   * Retrieves all contacted groups.
   * @returns All stored ContactedChatModel records.
   */
  async getAllGroups(): Promise<Realm.Results<ContactedChatModel>> {
    const realm = await this.ensureRealm();
    return realm.objects<ContactedChatModel>('ContactedChatModel');
  }

  /**
   * Deletes a specific contacted group by ID.
   * @param groupId - The ID of the group to delete.
   */
  async deleteGroup(groupId: string): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      const group = realm.objectForPrimaryKey<ContactedChatModel>('ContactedChatModel', groupId);
      if (!group) return;
      realm.write(() => {
        realm.delete(group);
      });
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  }

  /**
   * Deletes all contacted groups.
   */
  async deleteAllGroups(): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      const allGroups = realm.objects<ContactedChatModel>('ContactedChatModel');
      realm.write(() => {
        realm.delete(allGroups);
      });
    } catch (error) {
      console.error('Error deleting all groups:', error);
    }
  }
}

export default new ContactedGroupsRepository();
