import Realm from 'realm';

/**
 * RecentUserModel Schema for Realm Database
 */
export class RecentUserModel extends Realm.Object<RecentUserModel> {
  address?: string;
  id!: string;
  lastActive?: string;
  profilePicture!: string;
  status?: string;
  username!: string;
  fullName!: string;
  backgroundColor!: string;
  schemaVersion!: number;

  static schema: Realm.ObjectSchema = {
    name: 'RecentUserModel',
    primaryKey: 'id',
    properties: {
      id: 'string',
      address: 'string?',
      lastActive: 'string?',
      profilePicture: 'string',
      status: 'string?',
      username: 'string',
      fullName: 'string',
      backgroundColor: 'string',
      schemaVersion: { type: 'int', default: 1 }, 
    },
  };
}

