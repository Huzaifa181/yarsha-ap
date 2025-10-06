import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface FadeWrapperProps {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}

const FadeWrapper: React.FC<FadeWrapperProps> = ({ children, duration = 300, style }) => {
  const opacity = useSharedValue(0);

  useFocusEffect(
    React.useCallback(() => {
      opacity.value = withTiming(1, { duration });

      return () => {
        opacity.value = withTiming(0, { duration });
      };
    }, [duration])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    flex: 1,
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
};

export default React.memo(FadeWrapper);
