import {Realm} from 'realm';

export class UserModel extends Realm.Object<UserModel> {
  id!: string;
  username!: string;
  fullName!: string;
  phoneNumber!: string;
  profilePicture!: string;
  userBio!: string;
  address!: string;
  status!: string;
  lastActive!: string;
  createdAt!: string;
  updatedAt!: string;
  backgroundColor!: string;
  privateKey?: string;
  schemaVersion!: number;

  static schema: Realm.ObjectSchema = {
    name: 'UserModel',
    primaryKey: 'id',
    properties: {
      id: 'string',
      username: 'string',
      fullName: 'string',
      phoneNumber: 'string',
      profilePicture: 'string',
      userBio: 'string',
      address: 'string',
      status: 'string',
      lastActive: 'string',
      createdAt: 'string',
      updatedAt: 'string',
      backgroundColor: 'string',
      privateKey: 'string?',
      schemaVersion: {type: 'int', default: 1},
    },
  };
}
