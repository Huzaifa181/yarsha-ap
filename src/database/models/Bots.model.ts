import {Realm} from 'realm';

export class BotsModel extends Realm.Object<BotsModel> {
  id!: string;
  name!: string;
  profilePicture!: string;
  botBio!: string;
  category!: string;
  username!: string;

  static schema: Realm.ObjectSchema = {
    name: 'BotsModel',
    properties: {
      id: 'string',
      name: 'string',
      profilePicture: 'string',
      botBio: 'string',
      category: 'string',
      username: 'string',
    },
    primaryKey: 'id',
  };
}

export class BotDescriptionModel extends Realm.Object<BotDescriptionModel> {
  id!: string;
  name!: string;
  profilePicture!: string;
  botBio!: string;
  category!: string;
  username!: string;
  descriptions!: string[];

  static schema: Realm.ObjectSchema = {
    name: 'BotDescriptionModel',
    primaryKey: 'id',
    properties: {
      id: 'string',
      name: 'string',
      profilePicture: 'string',
      botBio: 'string',
      category: 'string',
      username: 'string',
      descriptions: 'string[]',
    },
  };
}
