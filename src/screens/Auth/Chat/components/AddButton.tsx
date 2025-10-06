import React from 'react';
import { ButtonVariant, ImageVariant } from '@/components/atoms';
import { useTheme } from '@/theme';
import { Images, ImagesDark } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import Animated, { AnimatedStyleProp } from 'react-native-reanimated';
import { SafeScreenNavigationProp } from '@/types';
import { ViewStyle } from 'react-native';

interface AddButtonProps {
  animatedStyle: AnimatedStyleProp<ViewStyle>;
}

const AddButton: React.FC<AddButtonProps> = ({ animatedStyle }) => {
  const { layout, backgrounds, borders, components } = useTheme();
  const navigation = useNavigation<SafeScreenNavigationProp>();

  return (
    <Animated.View
      style={[
        animatedStyle,
        backgrounds.primary,
        layout.absolute,
        layout.bottom160,
        layout.right20,
        borders.rounded_500,
        layout.height50px,
        layout.width50px,
        layout.justifyCenter,
        layout.itemsCenter,
        {
          zIndex: 1000,
          shadowColor: '#184BFF',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.3,
          shadowRadius: 7,
          elevation: 12,
        },
      ]}>
      <ButtonVariant
        hitSlop={{
          top: 20,
          bottom: 20,
          right: 20,
          left: 20,
        }}
        onPress={() => {
          navigation.navigate('CreateGroupScreen');
        }}>
        <ImageVariant
          style={[components.iconSize32]}
          source={Images.compose}
          sourceDark={ImagesDark.compose}
        />
      </ButtonVariant>
    </Animated.View>
  );
};

export default AddButton;