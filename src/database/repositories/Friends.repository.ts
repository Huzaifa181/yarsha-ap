import {getRealmInstance} from '@/services';
import Realm from 'realm';
import {FriendsModel} from '../models';

class FriendsRepository {
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
      console.log('✅ Friend Repository initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize Friend Repository:', error);
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
   * **Get All Friends**
   * @returns Array of all friends
   */
  async getAllFriends(): Promise<FriendsModel[]> {
    const realm = await this.ensureRealm();
    try {
      const friends = realm.objects<FriendsModel>('FriendsModel');
      return Array.from(friends);
    } catch (error) {
      console.error('❌ Failed to fetch friends:', error);
      return [];
    }
  }

  /**
   * **Add or Update a Friend**
   * @param friendData - The friend object to store (only the model properties)
   * @returns The created or updated friend object
   */
  async addOrUpdateFriend(
    friendData: Partial<FriendsModel>,
  ): Promise<FriendsModel | null> {
    const realm = await this.ensureRealm();
    try {
      let savedFriend: FriendsModel | null = null;

      realm.write(() => {
        const safeFriendData: Partial<FriendsModel> = {
          friendId:
            friendData.friendId ?? new Realm.BSON.ObjectId().toHexString(),
          fullName: friendData.fullName ?? '',
          username: friendData.username ?? '',
          profilePicture: friendData.profilePicture ?? '',
          backgroundColor: friendData.backgroundColor ?? '#FFFFFF',
          lastActive: friendData.lastActive ?? '0',
          status: friendData.status ?? 'offline',
        };

        // Use update mode to add or update the record
        savedFriend = realm.create<FriendsModel>(
          'FriendsModel',
          safeFriendData,
          Realm.UpdateMode.Modified,
        );
      });

      return savedFriend;
    } catch (error) {
      console.error('❌ Failed to add or update friend:', error);
      return null;
    }
  }

  /**
   * **Create a Friend**
   * @param friendData - The friend object to create (only the model properties)
   * @returns The newly created friend object
   */
  async createFriend(
    friendData: Partial<FriendsModel>,
  ): Promise<FriendsModel | null> {
    const realm = await this.ensureRealm();
    try {
      let newFriend: FriendsModel | null = null;

      realm.write(() => {
        const safeFriendData: Partial<FriendsModel> = {
          friendId:
            friendData.friendId ?? new Realm.BSON.ObjectId().toHexString(),
          fullName: friendData.fullName ?? '',
          username: friendData.username ?? '',
          profilePicture: friendData.profilePicture ?? '',
          backgroundColor: friendData.backgroundColor ?? '#FFFFFF',
          lastActive: friendData.lastActive ?? '0',
          status: friendData.status ?? 'offline',
        };

        newFriend = realm.create<FriendsModel>('FriendsModel', safeFriendData);
      });

      return newFriend;
    } catch (error) {
      console.error('❌ Failed to create friend:', error);
      return null;
    }
  }

  /**
   * **Delete a Friend**
   * @param friendId - The ID of the friend to delete
   * @returns True if the friend was deleted, false otherwise
   */
  async deleteFriend(friendId: string): Promise<boolean> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const friendToDelete = realm.objectForPrimaryKey<FriendsModel>(
          'FriendsModel',
          friendId,
        );
        if (friendToDelete) {
          realm.delete(friendToDelete);
        }
      });
      return true;
    } catch (error) {
      console.error('❌ Failed to delete friend:', error);
      return false;
    }
  }

  /**
   * **Delete All Friends**
   * @returns True if all friends were deleted, false otherwise
   * */
  async deleteAllFriends(): Promise<boolean> {
    const realm = await this.ensureRealm();
    try {
      realm.write(() => {
        const allFriends = realm.objects<FriendsModel>('FriendsModel');
        realm.delete(allFriends);
      });
      return true;
    } catch (error) {
      console.error('❌ Failed to delete all friends:', error);
      return false;
    }
  }

  /**
   * **Get Friend by ID**
   * @param friendId - The ID of the friend to fetch
   * @returns The friend object if found, null otherwise
   * */
  async getFriendById(friendId: string): Promise<FriendsModel | null> {
    const realm = await this.ensureRealm();
    try {
      const friend = realm.objectForPrimaryKey<FriendsModel>(
        'FriendsModel',
        friendId,
      );
      return friend;
    } catch (error) {
      console.error('❌ Failed to fetch friend by ID:', error);
      return null;
    }
  }
}

export default new FriendsRepository();
