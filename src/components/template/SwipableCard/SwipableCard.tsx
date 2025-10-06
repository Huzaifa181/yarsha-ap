import React, { ReactNode } from 'react';
import {
    View,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';
import {
    GestureHandlerRootView,
    GestureDetector,
    Gesture,
} from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolation,
    useDerivedValue,
    SharedValue,
} from 'react-native-reanimated';

// Types for swipe action items
interface SwipeActionItem {
    key: string;
    backgroundColor: string;
    triggerPoint: number; // when it should animate
    width: number;
    content: ReactNode;
}

// Component props
interface SwipeableRowProps {
    item?: any;
    children: ReactNode;
    rightActions?: ReactNode;
    leftActions?: ReactNode;
    rowHeight?: number;
    style?: StyleProp<ViewStyle>;
    rowStyle?: StyleProp<ViewStyle>;
    buttonStyle?: StyleProp<ViewStyle>;
}

// Utility to animate child content with reverse support
const useContentStyle = (
    triggerPoint: number,
    translateX: SharedValue<number>
): StyleProp<ViewStyle> => {
    const opacity = useDerivedValue(() =>
        interpolate(translateX.value, [triggerPoint, 0], [1, 0], Extrapolation.CLAMP)
    );
    const offsetX = useDerivedValue(() =>
        interpolate(translateX.value, [triggerPoint, 0], [0, 20], Extrapolation.CLAMP)
    );

    return useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: offsetX.value }],
    }));
};

const SwipeableRow: React.FC<SwipeableRowProps> = ({
    item,
    children,
    rightActions,
    leftActions,
    rowHeight = 70,
    style,
    rowStyle,
    buttonStyle,
}) => {
    const translateX = useSharedValue(0);
    const rightWidth = 240;
    const leftWidth = 240;
    const MAX_TRANSLATE_LEFT = -rightWidth;
    const MAX_TRANSLATE_RIGHT = leftWidth;

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = Math.min(
                Math.max(event.translationX, MAX_TRANSLATE_LEFT),
                MAX_TRANSLATE_RIGHT
            );
        })
        .onEnd(() => {
            if (translateX.value < 0) {
                translateX.value =
                    translateX.value < MAX_TRANSLATE_LEFT / 2
                        ? withSpring(MAX_TRANSLATE_LEFT)
                        : withSpring(0);
            } else {
                translateX.value =
                    translateX.value > MAX_TRANSLATE_RIGHT / 2
                        ? withSpring(MAX_TRANSLATE_RIGHT)
                        : withSpring(0);
            }
        });

    const rowAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <GestureHandlerRootView style={[{ height: rowHeight }, style]}>
            <View style={[styles.rowContainer, { height: rowHeight }]}>
                {leftActions && (
                    <View
                        style={[styles.actionsContainer, { justifyContent: 'flex-start' }]}
                    >
                        {leftActions}
                    </View>
                )}

                {rightActions && (
                    <View
                        style={[styles.actionsContainer, { justifyContent: 'flex-end' }]}
                    >
                        {rightActions}
                    </View>
                )}

                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[styles.rowFront, rowAnimatedStyle, rowStyle]}>
                        {children}
                    </Animated.View>
                </GestureDetector>
            </View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    rowContainer: {
        width: '100%',
        overflow: 'hidden',
    },
    actionsContainer: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        height: '100%',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    actionContent: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowFront: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        justifyContent: 'center',
        borderBottomColor: '#eee',
        height: '100%',
    },
});

export default SwipeableRow;
