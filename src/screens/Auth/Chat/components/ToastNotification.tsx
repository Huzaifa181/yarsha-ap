import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ImageVariant, TextVariant } from '@/components/atoms';
import { useTheme } from '@/theme';
import { Images } from '@/theme';

interface ToastNotificationProps {
  visible: boolean;
  message: string;
  backgroundStyle: any;
  tabBarHeight: number;
  baseOffset?: number;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  visible,
  message,
  backgroundStyle,
  tabBarHeight,
  baseOffset = 0,
}) => {
  const { layout, gutters, components } = useTheme();

  console.log('ToastNotification:', visible, message);

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = visible
      ? withTiming(1, { duration: 300 })
      : withTiming(0, { duration: 200 });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: Platform.OS === 'android' ? tabBarHeight + baseOffset : tabBarHeight,
          width: '100%',
          zIndex: 9999,
        },
        animatedStyle,
      ]}
      pointerEvents="none" 
    >
      <View
        style={[
          backgroundStyle,
          layout.row,
          layout.itemsCenter,
          layout.justifyCenter,
          gutters.paddingVertical_10,
          {
            paddingHorizontal: 16,
            borderRadius: 0,
          },
        ]}
      >
        <ImageVariant
          source={Images.warning}
          sourceDark={Images.warning}
          style={[components.iconSize14, gutters.marginRight_6]}
        />
        <TextVariant
          style={[
            components.textCenter,
            components.urbanist14RegularWhite,
            { flex: 1, textAlign: 'center' },
          ]}
        >
          {message}
        </TextVariant>
      </View>
    </Animated.View>
  );
};

export default ToastNotification;
