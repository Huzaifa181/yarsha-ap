import { TextVariant } from '@/components/atoms';
import { Brand } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import ChatsRepository from '@/database/repositories/Chats.repository';
import FriendsRepository from '@/database/repositories/Friends.repository';
import GroupChatRepository from '@/database/repositories/GroupChat.repository';
import MessageRepository from '@/database/repositories/Message.repository';
import UserRepository from '@/database/repositories/User.repository';
import YarshaContactsRepository from '@/database/repositories/YarshaContacts.Repository';
import { useDispatch } from '@/hooks';
import { useLogoutMutation } from '@/hooks/domain';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { APP_SECRETS, APP_SECRETS_BIOMETRICS_RESPONSE } from '@/secrets';
import { getSocket } from '@/services';
import ChatStreamService from '@/services/streamingService/ChatStreamService';
import { reduxStorage } from '@/store';
import {
  clearAuthToken,
  clearSolanaBalance,
  setAuthToken,
  setCountryCode,
} from '@/store/slices';
import { useTheme } from '@/theme';
import { ApplicationScreenProps } from '@/types';
import log from '@/utils/logger';
import { CommonActions } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, AppStateStatus, BackHandler, Platform, View } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import DeviceCountry, {
  TYPE_ANY,
} from 'react-native-device-country';
import DeviceInfo from 'react-native-device-info';
/**
 * @function Startup
 * @description The startup screen of the application that initializes the app and redirects to the appropriate screen
 * @param {ApplicationScreenProps} navigation - The navigation object provided by the navigator
 * @returns {JSX.Element} - The startup screen
 * @exports Startup
 * @author Nitesh Raj Khanal
 */
const Startup = ({ navigation }: ApplicationScreenProps): React.JSX.Element => {

  const { layout, components } = useTheme();
  const { t } = useTranslation(['translations']);
  const dispatch = useDispatch();

  const { data: latestUser, isLoading: isUserLoading } = useFetchLatestUserQuery();
  const [logout] = useLogoutMutation();

  const [state, setState] = useState({
    appState: AppState.currentState,
    isAppActive: AppState.currentState === 'active',
    versionNumber: '',
    authToken: '',
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      DeviceCountry.getCountryCode(TYPE_ANY)
        .then((countryCode) => {
          console.log('countryCode', countryCode);
          dispatch(setCountryCode(countryCode.code.toUpperCase()));
        })
        .catch((error) => log.error('Error getting country code', error));
    }
    else {
      DeviceCountry.getCountryCode()
        .then((countryCode) => dispatch(setCountryCode(countryCode.code)))
        .catch((error) => log.error('Error getting country code', error));
    }
  }, [dispatch]);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await reduxStorage.getItem(APP_SECRETS.ACCESS_TOKEN);
      if (token) {
        dispatch(setAuthToken(token));
        setState((prevState) => ({ ...prevState, authToken: token }));
      }
    };
    fetchToken();
  }, [dispatch]);

  useEffect(() => {
    const version = DeviceInfo.getVersion()
    setState((prevState) => ({ ...prevState, versionNumber: version }));
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setState((prevState) => ({
        ...prevState,
        appState: nextAppState,
        isAppActive: nextAppState === 'active',
      }));
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const logoutAction = useCallback(async () => {
    let fcmToken;
    await reduxStorage
      .getItem(APP_SECRETS.REGISTERED_FCM_TOKEN)
      .then((tokenFromStorage: string) => {
        fcmToken = tokenFromStorage || '';
      })
      .catch((error: unknown) => {
        console.log('error while getting fcm token from storage', error);
      });
    const logoutResponse = await logout({ fcmToken: fcmToken || "" }).unwrap();
    const socket = getSocket();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
    setTimeout(async () => {
      socket?.disconnect();
      dispatch(clearAuthToken());
      dispatch(clearSolanaBalance());
      await UserRepository.clearAllUsers();
      await ChatsRepository.deleteAllGroupChats();
      await GroupChatRepository.deleteAllGroupChats();
      await MessageRepository.deleteAllMessages();
      await FriendsRepository.deleteAllFriends();
      await YarshaContactsRepository.deleteAllContacts();
      await reduxStorage.removeItem(APP_SECRETS.BIO_VERIFIED);
      await reduxStorage.removeItem(APP_SECRETS.ACCESS_TOKEN);
      await reduxStorage.removeItem(APP_SECRETS.BIO_LOCKED);
    }, 0);
  }, []);

  const initializeApp = useCallback(async () => {
    if (!state.isAppActive || isUserLoading) {
      log.info('Waiting for latestUser or App to be active.');
      return;
    }

    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const storedStatus = await reduxStorage.getItem(APP_SECRETS.BIO_METRICS_ENABLED);

      const isLocked = await reduxStorage.getItem(APP_SECRETS.BIO_LOCKED);

      const { authToken } = state;

      if (authToken && latestUser) {
        const streamService = ChatStreamService.getInstance();
        streamService.startStream();
        if (
          storedStatus === APP_SECRETS_BIOMETRICS_RESPONSE.CAN_OPEN_SCANNER &&
          isLocked !== 'true'
        ) {
          try {
            const result = await rnBiometrics.simplePrompt({
              promptMessage: 'Confirm your fingerprint',
              fallbackPromptMessage: 'Use your device credentials',
            });

            if (!result.success) {
              await logoutAction();

              return BackHandler.exitApp();
            }
            await reduxStorage.removeItem(APP_SECRETS.BIO_LOCKED);
            await reduxStorage.setItem(APP_SECRETS.BIO_VERIFIED, 'true');

          } catch (bioError: any) {
            if (bioError?.message?.includes('Too many attempts')) {
              await reduxStorage.setItem(APP_SECRETS.BIO_LOCKED, 'true');
              await logoutAction();
              navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }));

              return;
            }
            await reduxStorage.removeItem(APP_SECRETS.BIO_VERIFIED);
            await reduxStorage.removeItem(APP_SECRETS.ACCESS_TOKEN);

            await logoutAction();

            return BackHandler.exitApp();
          }
        }

        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
      } else {
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }));
      }

    } catch (error: any) {
      log.error('Error during scanner initialization:', error);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: state.authToken && latestUser ? 'Auth' : 'Main' }],
        }),
      );
    }
  }, [state.isAppActive, state.authToken, latestUser, isUserLoading, dispatch, navigation]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return (
    <SafeScreen>
      <View style={[layout.flex_1, layout.col, layout.itemsCenter, layout.justifyCenter]}>
        <Brand isLoading={true} height={85} width={200} />
      </View>
      <TextVariant style={[components.urbanist12RegularBlack, components.textCenter]}>
        {t('version', { versionNumber: state.versionNumber })}
      </TextVariant>
    </SafeScreen>
  );
};

export default React.memo(Startup);
