/**
 * @format
 */

import './shim';
import 'react-native-get-random-values';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-gesture-handler';
import notifee, {EventType} from '@notifee/react-native';
import { api } from '@/services';
import { store } from './src/store';

if (__DEV__) {
  import('@/reactotron.config');
}

const fetchChats = async (data) => {
  return store.dispatch(api.endpoints.fetchChats.initiate(data)).unwrap();
};

notifee.onBackgroundEvent(async ({type, detail}) => {
  switch (type) {
    case EventType.PRESS:
      break;
    case EventType.ACTION_PRESS:
      break;
    default:
      break;
  }

  try {
    const RequestHeader = await generateRequestHeader();

    const groupChatRequestPayload = {
      RequestHeader: RequestHeader,
    };
    const groupChatsResponse = await fetchChats(groupChatRequestPayload);

    console.log('groupChatsResponse==>', groupChatsResponse['GroupChats']);
    const groupChatsParsed = groupChatsResponse['GroupChats']?.map(
      groupChat => {
        return {
          chatId: groupChat?.GroupId,
          type: groupChat?.Type || 'group',
          name: groupChat?.GroupName,
          groupIcon: groupChat?.GroupIcon,
          lastMessage: {
            content: groupChat?.LastMessage?.Text,
            messageId: groupChat?.LastMessage?.MessageId,
            type: groupChat?.LastMessage?.MessageType,
            senderId: groupChat?.LastMessage?.SenderId,
            senderName: groupChat?.LastMessage?.SenderName,
            timestamp: groupChat?.LastMessage?.Timestamp
              ? Date.parse(groupChat?.LastMessage?.Timestamp)
              : 0,
          },
          participants: groupChat?.ParticipantsId,
        };
      },
    );
  } catch (error) {
    log.error('Error fetching group chats:', error);
  }
});

AppRegistry.registerComponent(appName, () => App);
