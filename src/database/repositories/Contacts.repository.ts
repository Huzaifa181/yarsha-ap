import {getRealmInstance} from '@/services';
import Realm from 'realm';
import {ContactModel} from '../models';

class ContactsRepository {
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
      console.log('✅ Contacts Repository initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize Contacts Repository:', error);
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
    contactData: Partial<ContactModel>,
  ): Promise<ContactModel | null> {
    const realm = await this.ensureRealm();
    try {
      let contact: ContactModel | null = null;
      realm.write(() => {
        contact = realm.create(
          'ContactModel',
          contactData,
          Realm.UpdateMode.Modified,
        );
        console.log(`✅ Contact [${contactData.recordID}] saved successfully.`);
      });
      return contact;
    } catch (error) {
      console.error('❌ Error adding contact:', error);
      return null;
    }
  }

  /**
   * 📩 Fetch all contacts from Realm Database
   * @returns Array of contact objects
   */
  async getAllContacts(): Promise<ContactModel[]> {
    const realm = await this.ensureRealm();
    try {
      const contacts = realm.objects<ContactModel>('ContactModel');
      return Array.from(contacts);
    } catch (error) {
      console.error('❌ Error fetching contacts:', error);
      return [];
    }
  }

  /**
   * 📩 Delete a contact from Realm Database
   * @param contactId - The ID of the contact to delete
   * @returns Boolean indicating success or failure
   */
  async deleteContact(contactId: string): Promise<boolean> {
    const realm = await this.ensureRealm();
    try {
      let isDeleted = false;
      realm.write(() => {
        const contact = realm.objectForPrimaryKey<ContactModel>(
          'ContactModel',
          contactId,
        );
        if (contact) {
          realm.delete(contact);
          console.log(`✅ Contact with ID ${contactId} deleted`);
          isDeleted = true;
        } else {
          console.warn('⚠️ Contact not found for deletion');
          isDeleted = false;
        }
      });
      return isDeleted;
    } catch (error) {
      console.error('❌ Error deleting contact:', error);
      return false;
    }
  }

  /**
   * 📩 Update a contact in Realm Database
   *
   * @param contactId - The ID of the contact to update
   * @param contactData - The updated contact object
   * @returns The updated contact object
   * */
  async updateContact(
    contactId: string,
    contactData: Partial<ContactModel>,
  ): Promise<ContactModel | null> {
    const realm = await this.ensureRealm();
    try {
      let updatedContact: ContactModel | null = null;
      realm.write(() => {
        const contact = realm.objectForPrimaryKey<ContactModel>(
          'ContactModel',
          contactId,
        );
        if (contact) {
          updatedContact = realm.create(
            'ContactModel',
            {...contact, ...contactData},
            Realm.UpdateMode.Modified,
          );
          console.log(`✅ Contact [${contactId}] updated successfully.`);
        } else {
          console.warn('⚠️ Contact not found for update');
        }
      });
      return updatedContact;
    } catch (error) {
      console.error('❌ Error updating contact:', error);
      return null;
    }
  }
}

export default new ContactsRepository();
