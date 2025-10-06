import {getRealmInstance} from '@/services';
import Realm from 'realm';
import {UserModel} from '../models/User.model';

class UserRepository {
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
      console.log('✅ UserRepository initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize UserRepository:', error);
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
   * **Create a New User**
   */
  async createUser(user: Partial<UserModel>) {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        realm.create('UserModel', user);
      });
      console.log(`✅ User created successfully: ${user.id}`);
    } catch (error) {
      console.error(`❌ Error creating user:`, error);
    }
  }

  /**
   * **Update User**
   */
  async updateUser(user: Partial<UserModel>) {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        realm.create('UserModel', user, Realm.UpdateMode.Modified);
      });
      console.log(`✅ User updated successfully: ${user.id}`);
    } catch (error) {
      console.error(`❌ Error updating user:`, error);
    }
  }

  /**
   * **Get a User by ID**
   */
  async getUserById(userId: string): Promise<UserModel | null> {
    const realm = await this.ensureRealm();
    try {
      const user = realm.objectForPrimaryKey<UserModel>('UserModel', userId);
      if (user) {
        console.log(`📂 User found: ${userId}`);
      } else {
        console.warn(`⚠️ User not found: ${userId}`);
      }
      return user;
    } catch (error) {
      console.error(`❌ Error fetching user by ID:`, error);
      return null;
    }
  }

  /**
   * **Get All Users**
   */
  async getAllUsers(): Promise<UserModel[]> {
    const realm = await this.ensureRealm();
    try {
      const users = Array.from(realm.objects<UserModel>('UserModel'));
      console.log(`📂 Retrieved ${users.length} users from the database.`);
      return users;
    } catch (error) {
      console.error(`❌ Error fetching all users:`, error);
      return [];
    }
  }

  /**
   * **Delete All Users**
   */
  async clearAllUsers() {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const allUsers = realm.objects<UserModel>('UserModel');
        realm.delete(allUsers);
      });
      console.log(`🗑️ All users deleted from the database.`);
    } catch (error) {
      console.error(`❌ Error clearing all users:`, error);
    }
  }

  /**
   * **Delete User by ID**
   */
  async deleteUserById(userId: string) {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const user = realm.objectForPrimaryKey<UserModel>('UserModel', userId);
        if (user) {
          realm.delete(user);
          console.log(`🗑️ User with ID ${userId} deleted from the database.`);
        } else {
          console.warn(`⚠️ User with ID ${userId} not found in the database.`);
        }
      });
    } catch (error) {
      console.error(`❌ Error deleting user by ID:`, error);
    }
  }

  /**
   * **Fetch the Latest User**
   */
  async getLatestUser(): Promise<UserModel | null> {
    const realm = await this.ensureRealm();
    try {
      const users = Array.from(realm.objects<UserModel>('UserModel'));
      return users.length > 0 ? users[users.length - 1] : null;
    } catch (error) {
      console.error(`❌ Error fetching latest user:`, error);
      return null;
    }
  }

  /**
   * **Delete the Latest User**
   */
  async deleteLatestUser() {
    const realm = await this.ensureRealm();
    try {
      const users = Array.from(realm.objects<UserModel>('UserModel'));
      if (users.length > 0) {
        realm.write(() => {
          realm.delete(users[users.length - 1]);
        });
        console.log(`🗑️ Latest user deleted from the database.`);
      } else {
        console.warn(`⚠️ No users to delete.`);
      }
    } catch (error) {
      console.error(`❌ Error deleting latest user:`, error);
    }
  }

  /**
   * **Update Only the Private Key of a User**
   */
  async updateUserPrivateKey(
    userId: string,
    privateKey: string,
  ): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      console.log("privateKey while updating otp", privateKey)
      const user = realm.objectForPrimaryKey<UserModel>('UserModel', userId);
      if (!user) {
        console.warn(`⚠️ Cannot update privateKey. User not found: ${userId}`);
        return;
      }

      realm.write(() => {
        user.privateKey = privateKey;
      });

      console.log(`🔑 Private key updated for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Error updating private key for user ${userId}:`, error);
    }
  }
}

export default new UserRepository();
