import {
  BirthdayModel,
  BotDescriptionModel,
  BotsModel,
  ContactedChatModel,
  ContactModel,
  EmailAddressModel,
  FriendsModel,
  GroupChatModel,
  MessageModel,
  ParticipantDetailsModel,
  PhoneNumberModel,
  PostalAddressModel,
  RecentUserModel,
  SeenDetailsModel,
  UrlAddressModel,
  YarshaContactsModel,
} from '@/database';
import {
  ChatMetaDataModel,
  ChatsModel,
  LastMessageModel,
} from '@/database/models/Chats.model';
import {UserModel} from '@/database/models/User.model';
import Realm from 'realm';

let realm: Realm | null = null;

export const initializeRealm = () => {
  try {
    if (!realm) {
      console.log('Initializing Realm...');

      realm = new Realm({
        schema: [
          UserModel,
          RecentUserModel,
          ChatMetaDataModel,
          SeenDetailsModel,
          MessageModel,
          LastMessageModel,
          ChatsModel,
          ParticipantDetailsModel,
          GroupChatModel,
          BotDescriptionModel,
          YarshaContactsModel,
          PostalAddressModel,
          EmailAddressModel,
          PhoneNumberModel,
          UrlAddressModel,
          BirthdayModel,
          ContactModel,
          FriendsModel,
          ContactedChatModel,
          BotsModel,
        ],
      });

      console.log('✅ Realm Initialized Successfully!');
      console.log(
        '✅ GroupChat Schema Defined: ',
        realm.schema.find(s => s.name === 'GroupChatModel'),
      );
      console.log(
        '✅ ParticipantDetails Schema Defined: ',
        realm.schema.find(s => s.name === 'ParticipantDetailsModel'),
      );
      console.log(
        '✅ User Schema Defined: ',
        realm.schema.find(s => s.name === 'UserModel'),
      );
      console.log(
        '✅ Chats Schema Defined: ',
        realm.schema.find(s => s.name === 'ChatsModel'),
      );
      console.log(
        '✅ Message Schema Defined: ',
        realm.schema.find(s => s.name === 'MessageModel'),
      );
      console.log(
        '✅ LastMessage Schema Defined: ',
        realm.schema.find(s => s.name === 'LastMessageModel'),
      );
      console.log(
        '✅ ChatMetaData Schema Defined: ',
        realm.schema.find(s => s.name === 'ChatMetaDataModel'),
      );
      console.log(
        '✅ RecentUser Schema Defined: ',
        realm.schema.find(s => s.name === 'RecentUserModel'),
      );
      console.log(
        '✅ Contact Schema Defined: ',
        realm.schema.find(s => s.name === 'ContactModel'),
      );
      console.log(
        '✅ PostalAddress Schema Defined: ',
        realm.schema.find(s => s.name === 'PostalAddressModel'),
      );
      console.log(
        '✅ EmailAddress Schema Defined: ',
        realm.schema.find(s => s.name === 'EmailAddressModel'),
      );
      console.log(
        '✅ PhoneNumber Schema Defined: ',
        realm.schema.find(s => s.name === 'PhoneNumberModel'),
      );
      console.log(
        '✅ UrlAddress Schema Defined: ',
        realm.schema.find(s => s.name === 'UrlAddressModel'),
      );
      console.log(
        '✅ Birthday Schema Defined: ',
        realm.schema.find(s => s.name === 'BirthdayModel'),
      );
      console.log(
        '✅ Friends Schema Defined: ',
        realm.schema.find(s => s.name === 'FriendsModel'),
      );
      console.log(
        '✅ ContactedChat Schema Defined: ',
        realm.schema.find(s => s.name === 'ContactedChatModel'),
      );
      console.log(
        '✅ YarshaContacts Schema Defined: ',
        realm.schema.find(s => s.name === 'YarshaContactsModel'),
      );
      console.log(
        '✅ Bots Schema Defined: ',
        realm.schema.find(s => s.name === 'BotsModel'),
      );
      console.log(
        '✅ SeenDetails Schema Defined: ',
        realm.schema.find(s => s.name === 'SeenDetailsModel'),
      );
      console.log(
        '✅ BotsDetails Schema Defined: ',
        realm.schema.find(s => s.name === 'BotDescriptionModel'),
      );
      return realm;
    } else {
      console.log('⚠️ Realm is already initialized.');
    }
  } catch (error) {
    console.error('❌ Error Initializing Realm: ', error);
  }
  return realm;
};

export const getRealmInstance = () => {
  if (!realm) {
    console.log('⚠️ Realm instance is null. Reinitializing...');
    return initializeRealm();
  }
  return realm;
};
