import React, { useEffect, useRef } from 'react';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Startup } from '@/screens';
import { useTheme } from '@/theme';
import { ApplicationStackParamList } from '@/types';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator, UnAuthNavigator } from '@/navigators';
import BootSplash from 'react-native-bootsplash';
import {
  buildDeepLinkFromNotificationData,
  NotificationData,
  screenTrace,
} from '@/utils';
import crashlytics from '@react-native-firebase/crashlytics';
import { useMount } from '@/hooks';
import { Linking } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { utils } from '@react-native-firebase/app';
import * as Sentry from "@sentry/react-native";
import { initializeRealm } from '@/services';

const Stack = createNativeStackNavigator<ApplicationStackParamList>();

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
  routeChangeTimeoutMs: 1_000,
  ignoreEmptyBackNavigationTransactions: true,
});

const linking = {
  prefixes: ['yarshaapp://', 'https://yarsha.app'],
  config: {
    screens: {
      StartUpScreen: 'startup',
      Main: 'main',
      Auth: {
        path: 'auth',
        screens: {
          BottomTab: {
            path: 'bottomtab',
            screens: {
              ChatsScreen: 'chat',
              ContactsScreen: 'contacts',
              SettingsScreen: 'settings',
              HistoryScreen: 'history',
            },
          },
          ChatsScreen: 'chat',
          PrivateMessageScreen: {
            path: 'privatemessage/:messageId/:name/:type/:profilePicture/:chatId',
            parse: {
              messageId: (id: string) => id,
              senderFullName: (fullName: string) =>
                decodeURIComponent(fullName),
              type: (type: string) => type,
              profilePicture: (profilePicture: string) =>
                decodeURIComponent(profilePicture),
              chatId: (chatId: string) => chatId,
            },
            stringify: {
              senderFullName: (fullName: string) => encodeURIComponent(fullName),
              profilePicture: (profilePicture: string) => encodeURIComponent(profilePicture)
            }
          },
          MessageScreen: {
            path: 'message/:messageId/:name/:type/:groupIcon',
            parse: {
              messageId: (id: string) => id,
              name: (name: string) => decodeURIComponent(name),
              type: (type: string) => type,
              groupIcon: (icon: string) => decodeURIComponent(icon),
            },
            stringify: {
              name: (name: string) => encodeURIComponent(name),
              groupIcon: (icon: string) => encodeURIComponent(icon),
            },
          },
        },
      },
    },
  },
  async getInitialURL() {
    const { isAvailable } = utils().playServicesAvailability;
    const url = await Linking.getInitialURL();
    if (url) {
      return url;
    }
    const message = await messaging().getInitialNotification();
    const deeplinkURL = buildDeepLinkFromNotificationData(
      message?.data as NotificationData,
    );
    if (deeplinkURL) {
      return deeplinkURL;
    }
  },
  subscribe(listener: (url: string) => void) {
    const onReceiveURL = ({ url }: { url: string }) => listener(url);

    const linkingSubscription = Linking.addEventListener('url', onReceiveURL);

    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      const url = buildDeepLinkFromNotificationData(
        remoteMessage.data as NotificationData,
      );
      if (url) {
        listener(url);
      }
    });

    return () => {
      linkingSubscription.remove();
      unsubscribe();
    };
  },
};

const ApplicationNavigator: React.FC = (): React.JSX.Element => {
  const { variant } = useTheme();

  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef<string | undefined>(undefined);

  useMount(() => {
    const originalHandler =
      ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler();

    const globalErrorHandler = (error: Error, isFatal?: boolean) => {
      const fatal = isFatal ?? false;

      crashlytics().recordError(error);

      if (originalHandler) {
        originalHandler(error, fatal);
      }
    };

    ErrorUtils.setGlobalHandler(globalErrorHandler);

    return () => {
      if (originalHandler) {
        ErrorUtils.setGlobalHandler(originalHandler);
      }
    };
  });

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onStateChange={async () => {
          const previousRouteName = routeNameRef.current;
          const currentRoute = navigationRef.current?.getCurrentRoute();
          const currentRouteName = currentRoute?.name;

          if (
            currentRouteName !== undefined &&
            previousRouteName !== currentRouteName
          ) {
            screenTrace(currentRouteName);
          }
          routeNameRef.current =
            currentRouteName !== undefined ? currentRouteName : undefined;
        }}
        onReady={async () => {
          navigationIntegration.registerNavigationContainer(routeNameRef);
          initializeRealm();
          BootSplash.hide()
            .then(() => {
              console.log('Bootsplash successfully hidden');
            })
            .catch(() => {
              'Error while hiding bootsplash';
            });
          const currentRouteName =
            navigationRef.current?.getCurrentRoute()?.name;
          if (currentRouteName !== undefined) {
            screenTrace(currentRouteName);
            routeNameRef.current =
              currentRouteName !== undefined ? currentRouteName : undefined;
          }
        }}
        linking={linking}>
        <Stack.Navigator
          key={variant}
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            animation: 'fade',
            animationDuration: 100,
          }}>
          <Stack.Screen name="StartUpScreen" component={Startup} />
          <Stack.Screen name={'Main'} component={UnAuthNavigator} />
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default ApplicationNavigator;
