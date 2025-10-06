import {useEffect, useRef, useState} from 'react';
import io, {Socket} from 'socket.io-client';
import {SOCKET_COLLECTIONS} from '@/config';
import {store} from '@/store';
import {fetchChatsApi} from '../domain/fetch-chats/useFetchChats';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {useDispatch} from '../reduxHooks';
import {useFetchLatestUserQuery} from '../domain/db-user/useDbUser';
import {useAddMessageMutation, useUpdateMessageIdMutation} from '../domain';
import ChatsRepository from '@/database/repositories/Chats.repository';
import { groupChatsApi } from '../domain/db-chats/useDbChats';

/**
 * Custom React hook to manage WebSocket connections using Socket.IO.
 * This version automatically handles authentication and server URL.
 *
 * @returns {{ setIsMessageListenConnected: boolean }}
 *          An object containing connection status.
 */
type UseSocketReturn = {
  isMessageListenConnected: boolean;
};

const useMessageListenSocket = (): UseSocketReturn => {
  const [isMessageListenConnected, setIsMessageListenConnected] =
    useState<boolean>(false);

  const dispatch = useDispatch();

  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    let isMounted = true;

    const getToken = async () => {
      try {
        const token = await store.getState().accessToken.authToken;
        return token;
      } catch (error) {
        console.error('Error getting token:', error);
        return null;
      }
    };

    const initializeSocket = async () => {
      const authToken = await getToken();
      if (!isMounted) return;

      socketRef.current = io(SOCKET_COLLECTIONS.GROUP_CHAT_SUBSCRIBE, {
        transportOptions: {
          polling: {
            extraHeaders: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        },
      });

      socketRef.current.on('connect', () => {
        if (isMounted) {
          setIsMessageListenConnected(true);
          console.log('Socket.IO connected at:', new Date().toISOString());
        }
      });

      socketRef.current.on('error', (error: unknown) => {
        console.error('Socket.IO error:', error);
      });

      // socketRef.current.on('receiveMessage', async (message: any) => {
      //   console.log('message received===>', message);
      //   if (latestUser?.id !== message?.senderId) {
      //     await addMessage({
      //       chatId: message?.chatId,
      //       senderId: message?.senderId,
      //       content: message?.content,
      //     });
      //   } else {
      //     await await updateMessageId({
      //       oldMessageId: message?.messageId,
      //       newMessageId: message?.messageId,
      //     });
      //   }
      // });

      socketRef.current.on('groupCreated', async (groupInfo: any) => {
        if (socketRef.current && groupInfo.GroupId) {
          socketRef.current.emit(
            'joinRoom',
            JSON.stringify({chatId: groupInfo.GroupId}),
          );
          console.log('joined room at the listener socket', groupInfo.GroupId);
          dispatch(
            fetchChatsApi.endpoints.fetchChats.initiate({
              RequestHeader: await generateRequestHeader(),
              AccessToken: (await getToken()) || '',
              Body: {
                page: '1',
                limit: '20',
              },
            }),
          );
        }
      });

      socketRef.current.on('participantJoined', async (participantInfo) => {
        console.log('participantJoined', participantInfo);
      
        if (!participantInfo?.GroupId) return;
      
        const realmInstance = ChatsRepository.getRealmInstance();
      
        try {
          realmInstance.write(() => {
            let existingChat = realmInstance.objectForPrimaryKey('ChatsModel', participantInfo.GroupId);
            // const timestamp=new Date().toISOString();
            // const formattedTimestamp = new Date(timestamp).toString();
            // let lastMessage = realmInstance.create(
            //   'LastMessageModel',
            //   {
            //     messageId: `${Date.now()}`,
            //     senderId: participantInfo.AutomatedMessage?.senderId,
            //     senderName: participantInfo.AutomatedMessage.senderName,
            //     text: participantInfo.AutomatedMessage.content,
            //     messageType: 'text',
            //     timestamp: formattedTimestamp,
            //   },
            //   Realm.UpdateMode.Modified
            // );
      
            if (existingChat) {
              // Convert Realm.List<string> to an array safely
              // let updatedParticipants = existingChat.participants ? existingChat.participants.map(p => p) : [];
      
              // // Add new participant(s) only if they are not already in the list
              // participantInfo.AddedParticipants.forEach((newParticipant) => {
              //   if (!updatedParticipants.includes(newParticipant)) {
              //     updatedParticipants.push(newParticipant);
              //   }
              // });
      
              // Object.assign(existingChat, {
              //   participants: updatedParticipants,
              //   lastMessage: lastMessage,
              // });
      
              // console.log(`✅ Updated existing chat: ${participantInfo.GroupId}`);
            } else {
              // If the chat does not exist, create a new chat entry
              // realmInstance.create('ChatsModel', {
              //   groupId: participantInfo.GroupId,
              //   groupName: 'New Group Chat',
              //   type: 'group',
              //   groupIcon: '',
              //   participants: participantInfo.AddedParticipants || [],
              //   lastMessage: lastMessage,
              //   backgroundColor: '#FFFFFF',
              // });
      
              // console.log(`✅ Created new chat: ${participantInfo.GroupId}`);
            }
          });
      
          // Ensure the updated or new chat appears at the top of paginated chats
          dispatch(groupChatsApi.util.invalidateTags(['GroupChats']));
        } catch (error) {
          console.error('❌ Error handling participantJoined event:', error);
        }
      });
      
      
      

      socketRef.current.on('disconnect', () => {
        if (isMounted) {
          setIsMessageListenConnected(false);
          console.log('Socket.IO disconnected at:', new Date().toISOString());
        }
      });
    };

    initializeSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {isMessageListenConnected};
};

export default useMessageListenSocket;
