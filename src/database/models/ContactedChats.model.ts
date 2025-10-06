import Realm from 'realm';

/**
 * ContactedChatModel Schema for Realm Database
 */

export class ContactedChatModel extends Realm.Object<ContactedChatModel> {
  ChatId!: string;
  GroupName!: string;
  GroupIcon?: string;
  Type!: string;
  Description?: string;
  BackgroundColor!: string;

  static schema: Realm.ObjectSchema = {
    name: 'ContactedChatModel',
    primaryKey: 'ChatId',
    properties: {
      ChatId: 'string',
      GroupName: 'string',
      GroupIcon: 'string?',
      Type: 'string',
      Description: 'string?',
      BackgroundColor: 'string',
    },
  };
}
