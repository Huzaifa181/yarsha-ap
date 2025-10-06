import FriendsRepository from '@/database/repositories/Friends.repository';
import {IFriend} from '@/hooks/domain/recent-user/schema';

/**
 * Synchronizes the local Realm friend list with the friend list from the server.
 * @param serverFriends Array of friends received from the server.
 */
export async function syncFriends(serverFriends: IFriend[]): Promise<void> {
  const localFriends = await FriendsRepository.getAllFriends();

  const serverFriendIds = new Set(serverFriends.map(friend => friend.friendId));

  for (const localFriend of localFriends) {
    if (!serverFriendIds.has(localFriend.friendId)) {
      await FriendsRepository.deleteFriend(localFriend.friendId);
      console.log(`Deleted local friend: ${localFriend.friendId}`);
    }
  }

  for (const friend of serverFriends) {
    const exists = localFriends.find(
      local => local.friendId === friend.friendId,
    );
    if (exists) {
      await FriendsRepository.addOrUpdateFriend(friend);
      console.log(`Updated local friend: ${friend.friendId}`);
    } else {
      await FriendsRepository.createFriend(friend);
      console.log(`Created local friend: ${friend.friendId}`);
    }
  }
}
