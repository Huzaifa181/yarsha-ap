import {getRealmInstance} from '@/services';
import Realm from 'realm';
import {RecentUserModel} from '../models';

class RecentUserRepository {
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
      console.log('✅ Recent User Repository initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize Recent User Repository:', error);
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
   * 🔹 Add or Update a Recent User (Ensures serializability)
   */
  async addOrUpdateUser(userData: Partial<RecentUserModel>): Promise<RecentUserModel | null> {
    const realm = await this.ensureRealm();

    try {
      let user: RecentUserModel | null = null;
      realm.write(() => {
        user = realm.create(
          'RecentUserModel',
          {
            id: userData.id,
            address: userData.address || '',
            lastActive: userData.lastActive
              ? String(userData.lastActive)
              : null,
            profilePicture: userData.profilePicture,
            status: userData.status || 'offline',
            username: userData.username,
            fullName: userData.fullName,
            backgroundColor: userData.backgroundColor,
          },
          Realm.UpdateMode.Modified,
        ) as unknown as RecentUserModel;
      });

      console.log(`✅ User ${userData.username} added/updated successfully!`);

      return user ? JSON.parse(JSON.stringify(user)) : null;
    } catch (error) {
      console.error('❌ Error adding/updating user:', error);
      return null;
    }
  }

  /**
   * 📜 Get all recent users (Returns Plain JSON)
   */
  async getAllUsers(): Promise<RecentUserModel[]> {
    const realm = await this.ensureRealm();

    try {
      const users = realm
        .objects<RecentUserModel>('RecentUserModel')
        .sorted('lastActive', true);

      return JSON.parse(JSON.stringify(users));
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      return [];
    }
  }

  /**
   * 🔍 Find user by ID (Returns Plain JSON)
   */
  async getUserById(userId: string): Promise<RecentUserModel | null> {
    const realm = await this.ensureRealm();
    try {
      const user = realm.objectForPrimaryKey<RecentUserModel>(
        'RecentUserModel',
        userId,
      );

      return user ? JSON.parse(JSON.stringify(user)) : null;
    } catch (error) {
      console.error('❌ Error fetching user by ID:', error);
      return null;
    }
  }

  /**
   * 📝 Update a user's status
   */
  async updateUserStatus(userId: string, status: string): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const user = realm.objectForPrimaryKey<RecentUserModel>(
          'RecentUserModel',
          userId,
        );
        if (user) {
          user.status = status;
          console.log(`✅ Updated user ${user.username}'s status to ${status}`);
        } else {
          console.warn('⚠️ User not found for status update');
        }
      });
    } catch (error) {
      console.error('❌ Error updating user status:', error);
    }
  }

  /**
   * 🗑️ Delete a user
   */
  async deleteUser(userId: string): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const user = realm.objectForPrimaryKey<RecentUserModel>(
          'RecentUserModel',
          userId,
        );
        if (user) {
          realm.delete(user);
          console.log(`✅ User with ID ${userId} deleted`);
        } else {
          console.warn('⚠️ User not found for deletion');
        }
      });
    } catch (error) {
      console.error('❌ Error deleting user:', error);
    }
  }

  /**
   * 🗑️ Delete all users from the database
   */
  async deleteAllUsers(): Promise<void> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const users = realm.objects('RecentUserModel');
        realm.delete(users);
        console.log('✅ All users deleted from the database');
      });
    } catch (error) {
      console.error('❌ Error deleting all users:', error);
    }
  }

  /**
   * 🚀 Get the most recent active user (Returns Plain JSON)
   */
  async getMostRecentActiveUser(): Promise<RecentUserModel | null> {
    const realm = await this.ensureRealm();
    try {
      const users = realm
        .objects<RecentUserModel>('RecentUserModel')
        .sorted('lastActive', true);

      return users.length > 0 ? JSON.parse(JSON.stringify(users[0])) : null;
    } catch (error) {
      console.error('❌ Error fetching most recent active user:', error);
      return null;
    }
  }

  /**
   * 🛑 Close the Realm instance
   */
  async close(): Promise<void> {
    const realm = await this.ensureRealm();
    if (!realm.isClosed) {
      this.realm.close();
      console.log('🛑 Realm database closed');
    }
  }

  public getRealmInstance(): Realm {
    return this.realm;
  }
}

export default new RecentUserRepository();
