import Realm from 'realm';

export class MessageModel extends Realm.Object<MessageModel> {
  _id!: string;
  chatId!: string;
  senderId!: string;
  content!: string;
  automated!: boolean;
  messageId!: string;
  status!: 'pending' | 'sent' | 'syncing' | 'uploading' | 'failed';
  createdAt!: Date;
  updatedAt!: Date;
  schemaVersion!: number;
  type?: string; // 'text' | 'image' | 'video' | 'file' | ...
  multimedia?: Realm.Types.Mixed; // metadata like { mimeType, height, width, etc. }
  transaction?: Realm.Types.Mixed; // metadata like { mimeType, height, width, etc. }
  replyTo?: Realm.Types.Mixed;
  serverId?: string;
  reactions: Realm.Types.Mixed;
  isPinned?: boolean;
  preparedTransaction!: string;

  static schema: Realm.ObjectSchema = {
    name: 'MessageModel',
    primaryKey: '_id',
    properties: {
      _id: {
        type: 'string',
        default: () => new Realm.BSON.ObjectId().toHexString(),
      },
      chatId: {type: 'string', indexed: true},
      senderId: 'string',
      content: 'string',
      messageId: {type: 'string', optional: true},
      serverId: {type: 'string', optional: true},
      automated: {type: 'bool', default: false},
      status: {type: 'string', default: 'pending'},
      createdAt: {type: 'date', default: () => new Date()},
      updatedAt: {type: 'date', default: () => new Date()},
      schemaVersion: {type: 'int', default: 2},
      type: {type: 'string', optional: true},
      multimedia: {type: 'mixed', optional: true},
      transaction: {type: 'mixed', optional: true},
      replyTo: {type: 'mixed', optional: true},
      reactions: { type: 'mixed', optional: true },
      isPinned: {type: 'bool', optional: true},
      preparedTransaction: 'string',
    },
  };
}
