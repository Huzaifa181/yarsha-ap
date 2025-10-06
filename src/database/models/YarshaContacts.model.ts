import Realm from 'realm';

export class YarshaContactsModel extends Realm.Object<YarshaContactsModel> {
  id!: string;
  phoneNumber!: string;
  fullName!: string;
  address!: string;
  status!: 'online' | 'offline';
  lastActive!: string;
  profilePicture?: string;
  userBio?: string;
  username!: string;
  backgroundColor!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'YarshaContactsModel',
    primaryKey: 'id',
    properties: {
      id: 'string',
      phoneNumber: 'string',
      fullName: 'string',
      address: 'string',
      status: {type: 'string', indexed: true},
      lastActive: 'string',
      profilePicture: 'string?',
      userBio: 'string?',
      username: 'string',
      backgroundColor: 'string',
      createdAt: 'date',
      updatedAt: 'date',
    },
  };
}

