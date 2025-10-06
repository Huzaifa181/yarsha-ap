import { Realm } from 'realm';

/**
 * **LastMessageModel Schema**
 */
export class LastMessageModel extends Realm.Object<LastMessageModel> {
  messageId!: string;
  senderId!: string;
  senderName!: string;
  text!: string;
  messageType!: string;
  timestamp!: string;
  schemaVersion!: number; 
  multimedia?: any;
  transaction?: any;

  static schema: Realm.ObjectSchema = {
    name: 'LastMessageModel',
    properties: {
      messageId: 'string',
      senderId: 'string',
      senderName: 'string',
      text: 'string',
      messageType: 'string',
      timestamp: 'string',
      schemaVersion: { type: 'int', default: 1 },
      multimedia: { type: 'mixed', optional: true },
      transaction: { type: 'mixed', optional: true },
    },
  };
}


export class SeenDetailsModel extends Realm.Object<SeenDetailsModel> {
  participantId!: string;
  seenCount!: number;
  timeStamp!: string;

  static schema: Realm.ObjectSchema = {
    name: 'SeenDetailsModel',
    primaryKey: 'participantId',
    properties: {
      participantId: 'string',
      seenCount: {type: 'int', default: 0},
      timeStamp: 'string',
    },
  };
}

/**
 * **ChatsModel Schema**
 */
export class ChatsModel extends Realm.Object<ChatsModel> {
  groupId!: string;
  groupName!: string;
  type!: string;
  groupIcon?: string;
  participants!: Realm.List<string>;
  seenDetails!: Realm.List<SeenDetailsModel>;
  lastMessage!: LastMessageModel;
  messageCount!: number;
  backgroundColor!: string;
  schemaVersion!: number;
  isPinned?: string;
  isMuted?: string;
  createdAt?: Date;
  pinnedAt?: Date;
  isIndividualBotChat?: boolean;

  static schema: Realm.ObjectSchema = {
    name: 'ChatsModel',
    primaryKey: 'groupId',
    properties: {
      groupId: 'string',
      groupName: 'string',
      type: 'string',
      groupIcon: 'string?',
      participants: 'string[]',
      lastMessage: 'LastMessageModel',
      messageCount: { type: 'int', default: 0 },
      seenDetails: {
        type: 'list',
        objectType: 'SeenDetailsModel',
      },
      backgroundColor: 'string',
      schemaVersion: { type: 'int', default: 1 }, 
      createdAt: { type: 'date', optional: true },
      isPinned: "string",
      pinnedAt: { type: 'date', optional: true },
      isMuted: "string",
      isIndividualBotChat: { type: 'bool', default: false },
    },
  };
}

/**
 * **ChatMetaDataModel Schema**
 */
export class ChatMetaDataModel extends Realm.Object<ChatMetaDataModel> {
  id!: string;
  currentPage!: number;
  totalPages!: number;
  schemaVersion!: number; 

  static schema: Realm.ObjectSchema = {
    name: 'ChatMetaDataModel',
    primaryKey: 'id',
    properties: {
      id: 'string',
      currentPage: 'int',
      totalPages: 'int',
      schemaVersion: { type: 'int', default: 1 },
    },
  };
}