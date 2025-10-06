import YarshaContactsRepository from '@/database/repositories/YarshaContacts.Repository';
import {User} from '@/pb/users';

export const syncUsersWithDatabase = async (serverUsers: User[]) => {
  console.log('Syncing users with database...', serverUsers);

  try {
    const localUsers = await YarshaContactsRepository.getAllContacts();
    const serverUserIds = new Set(serverUsers.map(user => user.id));

    for (const serverUser of serverUsers) {
      if (!serverUser.id) {
        console.warn('⚠️ Skipping user with missing ID:', serverUser);
        continue;
      }

      const existingUser = await YarshaContactsRepository.getContactById(
        serverUser.id,
      );

      const contactData = {
        id: serverUser.id,
        phoneNumber: serverUser.phoneNumber ?? '',
        fullName: serverUser.fullName ?? '',
        address: serverUser.address ?? '',
        status:
          serverUser.status === 'online'
            ? 'online'
            : serverUser.status === 'offline'
              ? 'offline'
              : ('offline' as 'online' | 'offline'),
        lastActive: serverUser.lastActive ?? '',
        profilePicture: serverUser.profilePicture ?? '',
        userBio: serverUser.userBio ?? '',
        username: serverUser.username ?? '',
        backgroundColor: serverUser.backgroundColor ?? '#FFFFFF',
        createdAt: serverUser.createdAt
          ? new Date(serverUser.createdAt)
          : new Date(),
        updatedAt: serverUser.updatedAt
          ? new Date(serverUser.updatedAt)
          : new Date(),
      };

      if (existingUser) {
        await YarshaContactsRepository.updateContact(
          serverUser.id,
          contactData,
        );
      } else {
        await YarshaContactsRepository.addContact(contactData);
      }
    }

    for (const localUser of localUsers) {
      if (!serverUserIds.has(localUser.id)) {
        await YarshaContactsRepository.deleteContact(localUser.id);
        console.log(`🗑️ Removed extra user from Realm: ${localUser.id}`);
      }
    }

    console.log('✅ Local database synced with server data.');
  } catch (error) {
    console.error('❌ Error syncing users with database:', error);
  }
};
