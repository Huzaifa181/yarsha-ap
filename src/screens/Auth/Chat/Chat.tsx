import { SafeScreen } from '@/components/template';
import { CHAT_PAGINATION_LIMIT } from '@/constants';
import { useDispatch, useInternetConnection } from '@/hooks';
import { useFetchAllChatsQuery, useFetchCommunityChatsQuery } from '@/hooks/domain/db-chats/useDbChats';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { useFetchContactedGroupsQuery, useFetchContactedUsersQuery, useFetchLocalFriendsQuery, useFetchLocalUsersQuery } from '@/hooks/domain/recent-user/useRecentUser';
import { useUserStatusApiMutation } from '@/hooks/domain/userStatus/useUserStatus';
import { reduxStorage, RootState } from '@/store';
import { useTheme } from '@/theme';
import { getFallbackLabel } from '@/utils/getFallBackLabel';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { FC, Suspense, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {  Dimensions, InteractionManager, Platform, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import AddButton from './components/AddButton';
import ChatList from './components/ChatList';
import ConnectionStatus from './components/ConnectionStatus';
import ToastNotification from './components/ToastNotification';
import { useLogoutMutation } from '@/hooks/domain';
import { useNavigation } from '@react-navigation/native';
import { SafeScreenNavigationProp } from '@/types';
import { APP_SECRETS } from '@/secrets';
import { clearAuthToken, clearLogoutType, clearSolanaBalance } from '@/store/slices';
import UserRepository from '@/database/repositories/User.repository';
import ChatsRepository from '@/database/repositories/Chats.repository';
import GroupChatRepository from '@/database/repositories/GroupChat.repository';
import MessageRepository from '@/database/repositories/Message.repository';
import FriendsRepository from '@/database/repositories/Friends.repository';
import YarshaContactsRepository from '@/database/repositories/YarshaContacts.Repository';
import UserStatusStreamService from '@/services/streamingService/UserStatus';
import ChatStreamService from '@/services/streamingService/ChatStreamService';

const LoadingPlaceholder = () => <View style={{ flex: 1, backgroundColor: 'transparent' }} />;

interface IProps { }

const ADD_BUTTON_SIZE = 50;
const HEADER_HEIGHT = 100;
const PAGE_SIZE = 20;

type ToastType = 'chatDeleted' | 'chatMuted' | 'chatUnmuted' | 'chatPinned' | 'chatUnPinned' | null;

interface ToastState {
  visible: boolean;
  type: ToastType;
}

const initialToastState: ToastState = { visible: false, type: null };

function toastReducer(state: ToastState, action: { type: ToastType }) {
  if (action.type === null) return initialToastState;
  return { visible: true, type: action.type };
}

const Chat: FC<IProps> = (): React.JSX.Element => {
  const { t } = useTranslation(['translations']);
  const { layout, gutters, backgrounds } = useTheme();
  const { height } = Dimensions.get('window');
  const screenHeight = height;
  const baseOffset = screenHeight * (Platform.OS === 'android' ? 0.035 : 0.05);

  const { data: allChats } = useFetchAllChatsQuery(
    undefined,
    { refetchOnFocus: true, refetchOnMountOrArgChange: true }
  );
  const { data: allCommunities } = useFetchCommunityChatsQuery(
    undefined,
    { refetchOnFocus: true, refetchOnMountOrArgChange: true }
  );
  const authToken = useSelector((state: RootState) => state.accessToken.authToken);
  const tabBarHeight = useBottomTabBarHeight();

  const [activeTab, setActiveTab] = useState('chats');
  const [isRefreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const scrollY = useSharedValue(0);

  const [toastState, dispatchToast] = useReducer(toastReducer, initialToastState);

  const {
    isConnected,
    snackbarVisible,
    snackbarMessage,
    setSnackbarVisible,
    snackbarTimeoutRef,
  } = useInternetConnection();

  const [userStatusApi] = useUserStatusApiMutation();

  useFetchLatestUserQuery();
  useFetchLocalUsersQuery();
  useFetchContactedUsersQuery();
  useFetchContactedGroupsQuery();
  useFetchLocalFriendsQuery();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    InteractionManager.runAfterInteractions(async () => {
      try {
        const requestHeader = await generateRequestHeader();
        const groupChatRequestPayload = {
          RequestHeader: requestHeader,
          AccessToken: authToken,
          Body: { page: '1', limit: CHAT_PAGINATION_LIMIT },
        };
        const streamService = ChatStreamService.getInstance();
        streamService.startStream();
      } catch (error) {
        console.error('❌ Error refreshing chats:', error);
      } finally {
        setRefreshing(false);
        setPage(1);
      }
    });
  }, [authToken]);

  useEffect(() => {
    const streamService = UserStatusStreamService.getInstance();
    streamService.startStream();
  }, []);

  const filteredChats = useMemo(() => {
    if (!allChats) return [];
    switch (activeTab) {
      case 'chats':
        return allChats.data.filter((chat: any) => chat);
      case 'communities':
        return allCommunities?.data ?? [];
      case 'apps':
        return allChats.data.filter((chat: any) => chat.isIndividualBotChat);
      default:
        return allChats.data;
    }
  }, [allChats, activeTab]);

  const filteredDuplicatedChats = useMemo(() => {
    const uniqueIds = new Set();
    return filteredChats.filter(chat => {
      if (uniqueIds.has(chat.groupId)) return false;
      uniqueIds.add(chat.groupId);
      return true;
    });
  }, [filteredChats]);

  const paginatedChats = useMemo(() => {
    return filteredDuplicatedChats.slice(0, page * PAGE_SIZE);
  }, [filteredDuplicatedChats, page]);

  const onLoadEarlier = useCallback(() => {
    if (page * PAGE_SIZE < filteredDuplicatedChats.length) {
      setPage(prev => prev + 1);
    }
  }, [page, filteredDuplicatedChats.length]);

  const addButtonStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT / 2],
      [0, ADD_BUTTON_SIZE],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT / 4, HEADER_HEIGHT / 2],
      [1, 0.7, 0],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY }],
      opacity,
      bottom: Platform.OS === 'android' ? height * 0.11 : height * 0.08,
    };
  });

  useEffect(() => {
    if (snackbarVisible && isConnected) {
      if (snackbarTimeoutRef.current) clearTimeout(snackbarTimeoutRef.current);
      snackbarTimeoutRef.current = setTimeout(() => {
        setSnackbarVisible(false);
      }, 3000);
    }
    return () => {
      if (snackbarTimeoutRef.current) clearTimeout(snackbarTimeoutRef.current);
    };
  }, [snackbarVisible, isConnected, setSnackbarVisible]);

  useEffect(() => {
    if (toastState.visible) {
      const timer = setTimeout(() => {
        dispatchToast({ type: null });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [toastState.visible]);

  console.log("toastState:", toastState)

  const dispatch = useDispatch();

  const logoutType = useSelector((state: RootState) => state.logout.logoutType)

  const [logout] = useLogoutMutation();

  const navigation = useNavigation<SafeScreenNavigationProp>();

  const logoutAction = useCallback(async () => {
    let fcmToken = '';
    try {
      fcmToken = (await reduxStorage.getItem(APP_SECRETS.REGISTERED_FCM_TOKEN)) || '';
    } catch (error) {
      console.log('error while gettingcm token from storage', error);
    }

    const logoutResponse = await logout({ fcmToken }).unwrap();

    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });

    setTimeout(async () => {
      dispatch(clearAuthToken());
      dispatch(clearSolanaBalance());
      await UserRepository.clearAllUsers();
      await ChatsRepository.deleteAllGroupChats();
      await GroupChatRepository.deleteAllGroupChats();
      await MessageRepository.deleteAllMessages();
      await FriendsRepository.deleteAllFriends();
      await YarshaContactsRepository.deleteAllContacts();
    }, 0);

    dispatch(clearLogoutType());
  }, [dispatch]);

  useEffect(() => {
    if (logoutType === 'logout') {
      logoutAction();
    }
  }, [logoutType, logoutAction]);

  return (
    <>
      <Animated.View style={[layout.flex_1]}>
        <SafeScreen>
          <Suspense fallback={<LoadingPlaceholder />}>
            <ConnectionStatus
              visible={snackbarVisible}
              message={snackbarMessage}
              isConnected={isConnected ?? false}
            />
            <View style={[gutters.paddingHorizontal_14, layout.flex_1]}>
              <View style={{ flex: 1, paddingBottom: ADD_BUTTON_SIZE }}>
                <ChatList
                  filteredChats={paginatedChats}
                  isRefreshing={isRefreshing}
                  onRefresh={onRefresh}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  handleChatDeleted={() => dispatchToast({ type: 'chatDeleted' })}
                  handleChatMuted={() => dispatchToast({ type: 'chatMuted' })}
                  handleChatUnmuted={() => dispatchToast({ type: 'chatUnmuted' })}
                  handleChatPinned={() => dispatchToast({ type: 'chatPinned' })}
                  handleChatUnPinned={() => dispatchToast({ type: 'chatUnPinned' })}
                  onLoadEarlier={onLoadEarlier}
                />
              </View>
              {activeTab == "chats" && <AddButton animatedStyle={addButtonStyle} />}
            </View>
          </Suspense>
        </SafeScreen>
      </Animated.View>

      <Suspense fallback={null}>
        <ToastNotification
          visible={toastState.visible}
          message={toastState.type && t(toastState.type) !== toastState.type
            ? t(toastState.type)
            : getFallbackLabel(toastState.type || '')}

          backgroundStyle={
            ['chatUnmuted', 'chatUnPinned'].includes(toastState.type || '')
              ? backgrounds.connectionStored
              : backgrounds.primary
          }
          tabBarHeight={tabBarHeight}
          baseOffset={baseOffset}
        />
      </Suspense>
    </>
  );
};

export default React.memo(Chat);
