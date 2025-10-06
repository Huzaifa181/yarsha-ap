import React from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { ButtonVariant, TextVariant } from '@/components/atoms';

type SegmentedControlProps = {
  options: string[];
  selectedOption: string;
  onOptionPress?: (option: string) => void;
};

const SegmentedControl: React.FC<SegmentedControlProps> = React.memo(
  ({ options, selectedOption, onOptionPress }) => {
    const { width: windowWidth } = useWindowDimensions();
    const { components, backgrounds, layout, borders } = useTheme();

    const segmentedControlWidth = Math.min(windowWidth * 0.94, 500);
    const internalPadding = segmentedControlWidth * 0.02;
    const itemWidth =
      (segmentedControlWidth - internalPadding) / options.length;

    const rStyle = useAnimatedStyle(() => ({
      left: withTiming(
        itemWidth * options.indexOf(selectedOption) + internalPadding / 2
      ),
    }));

    return (
      <View
        style={[
          backgrounds.segmented,
          layout.row,
          borders.rounded_12,
          {
            width: segmentedControlWidth,
            height: segmentedControlWidth * 0.12,
            paddingLeft: internalPadding / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            {
              width: itemWidth,
              height: '80%',
              top: '10%',
              borderRadius: 8,
            },
            rStyle,
            styles.activeBox,
            backgrounds.white,
          ]}
        />
        {options.map((option) => (
          <ButtonVariant
            key={option}
            onPress={() => {
              onOptionPress?.(option);
            }}
            style={[
              {
                width: itemWidth,
              },
              layout.justifyCenter,
              layout.itemsCenter,
            ]}
          >
            <TextVariant style={
              option === selectedOption
                ? components.urbanist16SemiBoldDark
                : components.urbanist16SemiBoldInactive
            }>{option}</TextVariant>
          </ButtonVariant>
        ))}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  activeBox: {
    position: 'absolute',
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    elevation: 3,
  },
});

export default React.memo(SegmentedControl);
