import {
  Linking,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import {reduxStorage} from '@/store';
import {APP_ACTIVE_SCREEN, APP_SECRETS} from '@/secrets';
import {buildDeepLinkFromNotificationData} from './deepLinkBuilder';
import log from './logger';

let notificationListenerRegistered = false;

export const getAPNSToken = async (): Promise<string | undefined> => {
  if (Platform.OS === 'ios') {
    try {
      const apnsToken = await messaging().getAPNSToken();
      if (apnsToken) {
        log.info('Your APNs Token is:', apnsToken);
        return apnsToken;
      }
      log.error('Failed to get APNs Token');
    } catch (error) {
      log.error('Error retrieving APNs token:', error);
    }
  }
  return undefined;
};

export const requestUserPermission = async (): Promise<void> => {
  if (Platform.OS === 'ios') {
    try {
      const authStatus: FirebaseMessagingTypes.AuthorizationStatus =
        await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        await notifee.requestPermission({
          badge: true,
          sound: true,
          alert: true,
        });
        log.info('Notification permissions granted');
        getFcmToken();
      } else {
        log.warn('Notification permissions not granted');
      }
    } catch (error) {
      log.error('Error requesting permission in iOS:', error);
    }
  } else if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        log.info('Android notification permissions granted');
      } else {
        log.warn('Android notification permissions not granted');
      }
    } catch (error) {
      log.error('Error requesting permission in Android:', error);
    }
  }
};

export const registerAppWithFCM = async (): Promise<void> => {
  try {
    await messaging().registerDeviceForRemoteMessages();
  } catch (error) {
    log.error('Error registering app with FCM:', error);
  }
};

export const getFcmToken = async (): Promise<string | undefined> => {
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      reduxStorage.setItem(APP_SECRETS.REGISTERED_FCM_TOKEN, fcmToken);
      log.info('Your Firebase Token is:', fcmToken);
      const apnsToken = await getAPNSToken();
      if (apnsToken) {
        reduxStorage.setItem(APP_SECRETS.REGISTERED_APNS_TOKEN, apnsToken);
      }
      return fcmToken;
    }
    log.error('Failed', 'No token received');
  } catch (error) {
    log.error('Failed', error);
  }
};

export const onDisplayNotification = async (
  data: FirebaseMessagingTypes.RemoteMessage | any,
) => {
  if (Platform.OS === 'ios') {
    await notifee.requestPermission({criticalAlert: true});
  } else if (Platform.OS === 'android') {
    await requestUserPermission();
  }
  const users = [];

  if (users.length===0) {
    return;
  }

  const screenName = data.data?.screenName || '';
  log.info('Received Notification Data:', JSON.stringify(data));

  let notificationData = {...data};

  if (typeof notificationData.data.chatData === 'string') {
    try {
      notificationData.data.chatData = JSON.parse(
        notificationData.data.chatData,
      );
      console.log(
        'notificationData.data.chatData',
        notificationData.data.chatData,
      );
    } catch (error) {
      console.error('Failed to parse chatData:', error);
      return null;
    }
  }

  const activeScreenId = await reduxStorage.getItem(
    APP_ACTIVE_SCREEN.ACTIVE_SCREEN,
  );

  await notifee.createChannelGroup({
    id: 'default',
    name: 'Default',
  });

  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    groupId: 'default',
    sound: 'default',
    vibration: true,
    lights: true,
  });

  const imageUrl = data?.data?.fcm_options?.image;
  const iosAttachments = imageUrl
    ? [{url: imageUrl, id: 'image', thumbnailHidden: false}]
    : [];

  await notifee.setNotificationCategories([
    {
      id: 'message',
      summaryFormat: 'You have %u+ unread messages from %@.',
      actions: [{id: 'reply', title: 'Reply'}],
    },
  ]);

  await notifee.displayNotification({
    title: data.notification?.title,
    body: data.notification?.body,
    data: {
      ...data.data,
      screenName,
    },
    android: {
      channelId,
      color: "#184BFF",
      smallIcon: 'ic_stat_name',
    },
    ios: {
      attachments: iosAttachments,
      critical: true,
      criticalVolume: 1.0,
      sound: 'local.wav',
      interruptionLevel: 'timeSensitive',
      summaryArgument: 'Yarsha',
      summaryArgumentCount: 10,
    },
  });

};

// export const onNotificationOpenedApp = () => {
//   messaging().onNotificationOpenedApp(async (remoteMessage) => {
//     const { title, body, data } = remoteMessage.notification || {};
//     if (data) {
//       const { screenName } = data;
//       log.info("Additional data:", screenName);
//       const url = buildDeepLinkFromNotificationData(data);
//       if (url) {
//         Linking.openURL(url);
//       }
//     }
//   });
// };

export const getInitialNotification = async () => {
  try {
    const message = await messaging().getInitialNotification();
    if (message && message.data) {
      const url = buildDeepLinkFromNotificationData(message.data);
      if (url) {
        await Linking.openURL(url);
      }
    }
  } catch (error) {
    log.error('Error handling initial notification:', error);
  }
};

export const createNotificationListeners = () => {
  if (notificationListenerRegistered) {
    console.log('Notification listeners already registered.');
    return;
  }

  console.log('Registering notification listeners.');

  messaging().onMessage(onDisplayNotification);
  messaging().setBackgroundMessageHandler(onDisplayNotification);
  // onNotificationOpenedApp();
  getInitialNotification();

  notificationListenerRegistered = true;
};

export const listenForTokenRefresh = () => {
  messaging().onTokenRefresh(async newFcmToken => {
    if (newFcmToken) {
      reduxStorage.setItem(APP_SECRETS.REGISTERED_FCM_TOKEN, newFcmToken);
    }
  });
};

export const initializeAppWithFCM = async (): Promise<void> => {
  try {
    await requestUserPermission();
    await registerAppWithFCM();
    await getFcmToken();
    listenForTokenRefresh();
  } catch (error) {
    log.error('Error initializing app with FCM:', error);
  }
};
