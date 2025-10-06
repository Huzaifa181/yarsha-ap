import {
  ChatsModel,
} from '@/database/models/Chats.model';
import Realm from 'realm';

export const migration = (oldRealm: Realm, newRealm: Realm) => {
  console.log(
    `🔄 Migrating from schemaVersion: ${oldRealm.schemaVersion} to 3`,
  );

  // **Migrate ChatsModel**
  if (oldRealm.schemaVersion < 2) {
    console.log('⚡ Applying ChatsModel migration (v2)...');
    const oldChats = oldRealm.objects<ChatsModel>('ChatsModel');
    const newChats = newRealm.objects<ChatsModel>('ChatsModel');

    for (let i = 0; i < oldChats.length; i++) {
      if (!newChats[i].createdAt) {
        newChats[i].createdAt = new Date();
      }
    }
  }

  if (oldRealm.schemaVersion < 3) {
    console.log('⚡ Applying ChatsModel migration (v3)...');
    const oldChats = oldRealm.objects<ChatsModel>('ChatsModel');
    const newChats = newRealm.objects<ChatsModel>('ChatsModel');

    for (let i = 0; i < oldChats.length; i++) {
      if (!newChats[i].isPinned) {
        newChats[i].isPinned = "false";
      }
    }
  }
  console.log('✅ Migration Complete!');
};
