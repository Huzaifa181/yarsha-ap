import { Animated, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import React from 'react';
import { ErrorBoundary, Header } from '@/components/template';
import { SafeScreenProps, SafeScreenRouteProp } from '@/types';
import { useRoute } from '@react-navigation/native';

/**
 * @author Nitesh Raj Khanal
 * @function SafeScreen
 * @returns JSX.Element
 */

const SafeScreen = ({
  children,
  messageId,
  groupName,
  type,
  profilePicture,
  lastActive,
  scrollY,
  membersCount,
  screenName,
  backgroundColor,
  color,
  timeStamp,
  nextAction,
  canEditGroup,
  botId,
  onlineOffline
}: SafeScreenProps): React.JSX.Element => {
  const { layout, variant, navigationTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const route = useRoute<SafeScreenRouteProp>();

  return (
    <Animated.View
      style={[
        layout.flex_1,
        {
          backgroundColor: navigationTheme.colors.background,
          paddingTop: insets.top,
          paddingBottom: route.name === "MessageScreen" ? 0 : insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}>
      <StatusBar
        barStyle={variant === 'dark' ? 'dark-content' : 'dark-content'}
        backgroundColor={navigationTheme.colors.background}
      />
      {route.name !== 'StartUpScreen' &&
        route.name !== 'SetupProfileScreen' && (
          <Header
            messageId={messageId}
            groupName={groupName}
            type={type}
            profilePicture={profilePicture}
            lastActive={lastActive}
            scrollY={scrollY}
            membersCount={membersCount}
            screenName={screenName}
            backgroundColor={backgroundColor}
            color={color}
            timeStamp={timeStamp}
            nextAction={nextAction}
            canEditGroup={canEditGroup}
            botId={botId}
            onlineOffline={onlineOffline}
          />
        )}
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </Animated.View>
  );
};

export default React.memo(SafeScreen);
