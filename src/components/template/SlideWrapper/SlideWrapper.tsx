import React, { useEffect } from 'react';
import { ViewStyle, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface SlideWrapperProps {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}

const { width } = Dimensions.get('window');

const SlideWrapper: React.FC<SlideWrapperProps> = ({ children, duration = 100, style }) => {
  const translateX = useSharedValue(width); 

  useFocusEffect(
    React.useCallback(() => {
      translateX.value = withTiming(0, { duration });

      return () => {
        translateX.value = withTiming(-width, { duration });
      };
    }, [duration])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    flex: 1,
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
};

export default React.memo(SlideWrapper);
