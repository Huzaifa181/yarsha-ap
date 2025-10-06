import React, { FC, useEffect } from 'react';
import Root from '@/Root';
import { reduxStorage, storage } from '@/store';
import { ThemeProvider } from '@/theme';
import { enableFreeze } from 'react-native-screens';
import {
  buildDeepLinkFromNotificationData,
  createNotificationListeners,
  initializeAppWithFCM,
  NotificationData,
} from '@/utils';
import 'react-native-url-polyfill/auto';
import notifee, { EventType } from '@notifee/react-native';
import { AppState, Linking } from 'react-native';
import { APP_ACTIVE_SCREEN } from '@/secrets';
import { configureReanimatedLogger } from 'react-native-reanimated';
import * as Sentry from '@sentry/react-native';
import { RNFBModule } from '@/types';

(globalThis as unknown as RNFBModule).RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

Sentry.init({
  dsn: 'https://5108c8371126d785b93914db3da74db7@mobiletraces.yarsha.app/2',
  spotlight: __DEV__,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  integrations: [
    Sentry.mobileReplayIntegration({
      maskAllText: true,
      maskAllImages: true,
      maskAllVectors: true,
    }),
    Sentry.reactNativeTracingIntegration(),
    Sentry.httpClientIntegration(),
  ],
  enableAutoSessionTracking: true,
  enableNativeCrashHandling: true,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 1.0,
  enableNative: true,
});

/**
 * @author Nitesh Raj Khanal
 * @function @Root
 **/

enableFreeze(true);

const App: FC = () => {
  useEffect(() => {
    initializeAppWithFCM();
    createNotificationListeners();
    configureReanimatedLogger({
      strict: false,
    });
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const url = buildDeepLinkFromNotificationData(
          detail.notification?.data as NotificationData,
        );

        if (url) {
          Linking.openURL(url);
        }
      } else if (type === EventType.ACTION_PRESS) {
      }
    });
    const appStateListener = AppState.addEventListener(
      'change',
      nextAppState => {
        if (nextAppState === 'active') {
        } else if (nextAppState === 'background') {
          const clearActiveScreen = async () => {
            try {
              await reduxStorage.setItem(APP_ACTIVE_SCREEN.ACTIVE_SCREEN, '');
            } catch (error) {
              console.error('Failed to clear active screen in storage:', error);
            }
          };
          clearActiveScreen();
        } else if (nextAppState === 'extension') {
        } else if (nextAppState === 'inactive') {
          const clearActiveScreen = async () => {
            try {
              await reduxStorage.setItem(APP_ACTIVE_SCREEN.ACTIVE_SCREEN, '');
            } catch (error) {
              console.error('Failed to clear active screen in storage:', error);
            }
          };
          clearActiveScreen();
        } else if (nextAppState === 'unknown') {
        }
      },
    );
    return () => {
      unsubscribe();
      appStateListener.remove();
    };
  }, []);
  return (
    <Sentry.TouchEventBoundary>
      <ThemeProvider storage={storage}>
        <Root />
      </ThemeProvider>
    </Sentry.TouchEventBoundary>
  );
};
const SentryApp = Sentry.wrap(App);
export default React.memo(SentryApp);
