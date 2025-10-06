import Realm from 'realm';

export class FriendsModel extends Realm.Object<FriendsModel> {
  friendId!: string;
  fullName!: string;
  username!: string;
  profilePicture!: string;
  backgroundColor!: string;
  lastActive!: string;
  status!: string;

  static schema: Realm.ObjectSchema = {
    name: 'FriendsModel',
    primaryKey: 'friendId',
    properties: {
      friendId: 'string',
      fullName: 'string',
      username: 'string',
      profilePicture: 'string',
      backgroundColor: 'string',
      lastActive: 'string',
      status: 'string',
    },
  };
}
