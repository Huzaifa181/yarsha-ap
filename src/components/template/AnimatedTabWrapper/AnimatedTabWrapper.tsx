import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface AnimatedTabContentProps {
  activeIndex: number;
  children: React.ReactNode[];
}

const AnimatedTabContent: React.FC<AnimatedTabContentProps> = ({
  activeIndex,
  children,
}) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Animate container to the active tab
    translateX.value = withTiming(-activeIndex * SCREEN_WIDTH, { duration: 300 });
  }, [activeIndex, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.animatedContainer, animatedStyle]}>
      {children.map((child, index) => (
        <View key={index} style={styles.page}>
          {child}
        </View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 4, // Change this multiplier to match the number of tabs
  },
  page: {
    width: SCREEN_WIDTH,
  },
});

export default AnimatedTabContent;
