import Realm from 'realm';

export class ParticipantDetailsModel extends Realm.Object<ParticipantDetailsModel> {
  Id!: string;
  Username!: string;
  FullName!: string;
  ProfilePicture?: string;
  Role!: 'member' | 'creator';
  BackgroundColor!: string;
  LastActive!: string;
  Address!: string;
  Status!: 'online' | 'offline';
  SchemaVersion!: number;

  static schema: Realm.ObjectSchema = {
    name: 'ParticipantDetailsModel',
    primaryKey: 'Id',
    properties: {
      Id: 'string',
      Username: 'string',
      FullName: 'string',
      ProfilePicture: 'string?',
      Role: {type: 'string', indexed: true},
      BackgroundColor: 'string',
      LastActive: 'string',
      Address: 'string',
      Status: {type: 'string', indexed: true},
      SchemaVersion: {type: 'int', default: 1},
    },
  };
}

export class GroupChatModel extends Realm.Object<GroupChatModel> {
  ChatId!: string;
  GroupName!: string;
  GroupIcon?: string;
  BackgroundColor!: string;
  GroupDescription!: string;
  Type!: 'individual' | 'group' | 'community';
  IsMuted!: boolean;
  ParticipantsId!: string[];
  Participants!: Realm.List<ParticipantDetailsModel>;
  SchemaVersion!: number;

  static schema: Realm.ObjectSchema = {
    name: 'GroupChatModel',
    primaryKey: 'ChatId',
    properties: {
      ChatId: 'string',
      GroupName: 'string',
      GroupIcon: 'string?',
      BackgroundColor: 'string',
      GroupDescription: 'string',
      Type: {type: 'string', indexed: true},
      IsMuted: {type: 'bool', default: false},
      ParticipantsId: 'string[]',
      Participants: {
        type: 'list',
        objectType: 'ParticipantDetailsModel',
      },
      SchemaVersion: {type: 'int', default: 1},
    },
  };
}
