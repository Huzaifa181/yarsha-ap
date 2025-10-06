import { useTheme } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface SwipeBackWrapperProps {
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 50;

const SwipeBackWrapper: React.FC<SwipeBackWrapperProps> = ({ children }) => {
  const { layout } = useTheme();
  const navigation = useNavigation();

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      'worklet';
      if (event.x > 30) {
        return;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(navigation.goBack)();
      }
    })
    .activeOffsetX(10);

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[layout.flex_1, layout.relative]}>
        {children}
      </View>
    </GestureDetector>
  );
};

export default SwipeBackWrapper;
