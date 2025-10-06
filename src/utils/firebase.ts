import analytics from '@react-native-firebase/analytics';
import perf from '@react-native-firebase/perf';
import log from './logger';
import {FirebaseSpace} from '@/types';

export const logScreenView = async (
  params: FirebaseSpace.ScreenViewParams,
): Promise<void> => {
  try {
    await analytics().logScreenView(params);
    log.info(`Screen view logged: ${params.screen_name}`);
  } catch (error) {
    log.error(`Failed to log screen view: ${params.screen_name}`, error);
  }
};

export const logEvent = async <T extends FirebaseSpace.EventNames>(
  eventName: T,
  params: FirebaseSpace.AnalyticsEvent[T],
): Promise<void> => {
  try {
    await analytics().logEvent(eventName, params);
    log.info(`Event logged: ${eventName}`, params);
  } catch (error) {
    log.error(`Failed to log event: ${eventName}`, error);
  }
};

export const screenTrace = async (screenName: string) => {
  try {
    const trace = await perf().startScreenTrace(screenName);
    await trace.stop();
  } catch (e) {
    log.error('Failed to start/stop screen trace:', e);
  }
};
