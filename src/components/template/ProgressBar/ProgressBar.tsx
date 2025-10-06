import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/theme';

interface ProgressBarProps {
    progress: number;
    backgroundColor: string;
    fillColor: string[];
}

/**
 * @author Nitesh Raj Khanal
 * @function ProgressBar
 * @returns JSX.Element
 */

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, backgroundColor, fillColor }): JSX.Element => {
    const { layout, borders } = useTheme();

    const animatedProgress = useSharedValue(0);

    useEffect(() => {
        animatedProgress.value = withTiming(progress, { duration: 500 });
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${(animatedProgress.value / 4) * 100}%`,
        };
    });

    return (
        <View style={[layout.height6, layout.overflowHidden, borders.rounded_2, { backgroundColor }]}>
            <Animated.View style={[layout.fullHeight, borders.rounded_2, animatedStyle]}>
                <LinearGradient
                    colors={fillColor}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[layout.fullHeight, borders.rounded_2]}
                />
            </Animated.View>
        </View>
    );
};

export default React.memo(ProgressBar);
