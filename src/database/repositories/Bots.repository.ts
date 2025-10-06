import {getRealmInstance} from '@/services';
import Realm from 'realm';

export interface AppBot {
  botId: string;
  botName: string;
  botIcon?: string;
  botDescription: string;
  category?: string;
  username?: string;
  profilePicture?: string;
  descriptions?: string[];
  botBio?: string;
}

class BotsRepository {
  private realm!: Realm;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const realmInstance = await getRealmInstance();
      if (!realmInstance)
        throw new Error('Failed to initialize Realm instance');
      this.realm = realmInstance;
      console.log('✅ Bots Repository initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize Bots Repository:', error);
    }
  }

  private async ensureRealm(): Promise<Realm> {
    if (!this.realm) {
      const realmInstance = await getRealmInstance();
      if (!realmInstance)
        throw new Error('Failed to initialize Realm instance');
      this.realm = realmInstance;
    }
    return this.realm;
  }

  /**
   * 🚀 Save or Update Bots
   */
  async saveBots(botsData: AppBot[]): Promise<void> {
    try {
      const realm = await this.ensureRealm();
      realm.write(() => {
        botsData.forEach(bot => {
          realm.create(
            'BotsModel',
            {
              id: bot.botId,
              name: bot.botName,
              profilePicture: bot.botIcon ?? '',
              botBio: bot.botDescription,
              category: bot.category ?? '',
              username: bot.username ?? '',
            },
            Realm.UpdateMode.Modified,
          );
        });
      });
      console.log('✅ Bots saved/updated successfully.');
    } catch (error) {
      console.error('❌ Failed to save/update Bots:', error);
    }
  }

  /**
   * 🚀 Fetch All Bots
   */
  async fetchBots(): Promise<AppBot[]> {
    try {
      const realm = await this.ensureRealm();
      const bots = realm.objects<any>('BotsModel');
      return bots.map((bot: any) => ({
        botId: bot.id,
        botName: bot.name,
        botIcon: bot.profilePicture,
        botDescription: bot.botBio,
        category: bot.category,
        username: bot.username,
      }));
    } catch (error) {
      console.error('❌ Failed to fetch Bots:', error);
      return [];
    }
  }

  /**
   * 🔍 Fetch a Single Bot by ID
   */
  async fetchBotById(botId: string): Promise<AppBot | null> {
    try {
      const realm = await this.ensureRealm();
      const bot = realm.objectForPrimaryKey<any>('BotsModel', botId);
      if (!bot) return null;

      return {
        botId: bot.id,
        botName: bot.name,
        botIcon: bot.profilePicture,
        botDescription: bot.botBio,
        category: bot.category,
        username: bot.username,
      };
    } catch (error) {
      console.error(`❌ Failed to fetch Bot with id ${botId}:`, error);
      return null;
    }
  }

  /**
   * @name saveBotDescription
   * @description saves the bot description
   */
  async saveBotDescription(botData: AppBot): Promise<void> {
    const realm = await this.ensureRealm();

    console.log("Bot with the given id created/updated data", botData)

    try{
      realm.write(() => {
        realm.create(
          'BotDescriptionModel',
          {
            id: botData.botId,
            name: botData.botName,
            profilePicture: botData.botIcon,
            botBio: botData.botBio,
            category: botData.category,
            username: botData.username,
            descriptions: botData.descriptions,
          },
          Realm.UpdateMode.Modified,
        );
      });
  
      console.log("Bot with the given id created/updated")
    }
    catch(error){
      console.log("Bot with the given id created/updated failed", error)
    }
  }

  /**
   * @name botDescription
   * @description gets the bot description by id
   */
  async getBotDescription(botId: string): Promise<AppBot | null> {
    try {
      const realm = await this.ensureRealm();
      const bot = realm.objectForPrimaryKey<any>('BotDescriptionModel', botId);

      console.log("check the bot =>", bot)
      
      if (!bot) return null;

      return {
        botId: bot.id,
        botName: bot.name,
        botIcon: bot.profilePicture,
        botDescription: bot.botBio,
        category: bot.category,
        username: bot.username,
      };
    } catch (error) {
      console.error(`❌ Failed to fetch Bot with id ${botId}:`, error);
      return null;
    }
  }
}

export default new BotsRepository();
