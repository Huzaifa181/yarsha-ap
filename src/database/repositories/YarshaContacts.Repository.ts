import {getRealmInstance} from '@/services';
import Realm from 'realm';
import {YarshaContactsModel} from '../models';

class YarshaContactsRepository {
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
      console.log('✅ Yarsha Contacts Repository initialized.');
    } catch (error) {
      console.error(
        '❌ Failed to initialize Yarsha Contacts Repository:',
        error,
      );
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
   * 📩 Add a new contact to Realm Database
   * @param contactData - The contact object to store
   * @returns The created contact object
   */
  async addContact(
    contactData: Partial<YarshaContactsModel>,
  ): Promise<YarshaContactsModel | null> {
    const realm = await this.ensureRealm();
    try {
      let contact: YarshaContactsModel | null = null;
      realm.write(() => {
        contact = realm.create(
          'YarshaContactsModel',
          contactData,
          Realm.UpdateMode.Modified,
        );
        console.log(
          `✅ Yarsha Contact [${contactData.id}] saved successfully.`,
        );
      });
      return contact;
    } catch (error) {
      console.error('❌ Failed to add Yarsha contact:', error);
      return null;
    }
  }

  /**
   * 🗑️ Delete a contact from Realm Database
   * @param id - The ID of the contact to delete
   */
  async deleteContact(id: string): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const contact = realm.objectForPrimaryKey<YarshaContactsModel>(
          'YarshaContactsModel',
          id,
        );
        if (contact) {
          realm.delete(contact);
          console.log(`✅ Yarsha Contact with ID ${id} deleted`);
        } else {
          console.warn('⚠️ Yarsha Contact not found for deletion');
        }
      });
    } catch (error) {
      console.error('❌ Failed to delete Yarsha contact:', error);
    }
  }

  /**
   * 📩 Fetch all contacts from Realm Database
   * @returns Array of contact objects
   * */
  async getAllContacts(): Promise<YarshaContactsModel[]> {
    const realm = await this.ensureRealm();
    try {
      const contacts = realm.objects<YarshaContactsModel>(
        'YarshaContactsModel',
      );
      return Array.from(contacts);
    } catch (error) {
      console.error('❌ Failed to fetch Yarsha contacts:', error);
      return [];
    }
  }

  /**
   * 📩 Fetch a contact by ID from Realm Database
   * @param id - The ID of the contact to fetch
   * @returns The contact object or null if not found
   */
  async getContactById(id: string): Promise<YarshaContactsModel | null> {
    const realm = await this.ensureRealm();
    try {
      const contact = realm.objectForPrimaryKey<YarshaContactsModel>(
        'YarshaContactsModel',
        id,
      );
      return contact;
    } catch (error) {
      console.error('❌ Failed to fetch Yarsha contact:', error);
      return null;
    }
  }

  /**
   * 📩 Update a contact in Realm Database
   * @param id - The ID of the contact to update
   * @param contactData - The updated contact object
   * @returns The updated contact object
   * */
  async updateContact(
    id: string,
    contactData: Partial<YarshaContactsModel>,
  ): Promise<YarshaContactsModel | null> {
    const realm = await this.ensureRealm();
    try {
      let contact: YarshaContactsModel | null = null;
      realm.write(() => {
        contact = realm.create(
          'YarshaContactsModel',
          {
            ...contactData,
            id: id,
          },
          Realm.UpdateMode.Modified,
        );
      });
      console.log(`✅ Yarsha Contact [${id}] updated successfully.`);
      return contact;
    } catch (error) {
      console.error('❌ Failed to update Yarsha contact:', error);
      return null;
    }
  }

  /**
   * delete all contacts
   */
  async deleteAllContacts(): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const allContacts = realm.objects<YarshaContactsModel>(
          'YarshaContactsModel',
        );
        realm.delete(allContacts);
        console.log('✅ All Yarsha Contacts deleted successfully.');
      });
    } catch (error) {
      console.error('❌ Failed to delete all Yarsha contacts:', error);
    }
  }
}

export default new YarshaContactsRepository();
