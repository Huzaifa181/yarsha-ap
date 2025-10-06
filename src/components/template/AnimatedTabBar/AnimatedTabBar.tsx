import { ButtonVariant, TextVariant } from '@/components/atoms';
import { useTheme } from '@/theme';
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    ScrollView,
    Animated,
    LayoutChangeEvent,
} from 'react-native';

interface Tab {
    id: string;
    name: string;
}

interface AnimatedTabBarProps {
    searchOptions: Tab[];
    activeOption: string;
    setActiveOption: (id: string) => void;
}

const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
    searchOptions,
    activeOption,
    setActiveOption,
}) => {

    const {  gutters, layout, components } = useTheme();
    const [layouts, setLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});
    const indicatorLeft = useRef(new Animated.Value(0)).current;
    const indicatorWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (layouts[activeOption]) {
            Animated.parallel([
                Animated.timing(indicatorLeft, {
                    toValue: layouts[activeOption].x,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(indicatorWidth, {
                    toValue: layouts[activeOption].width,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [activeOption, layouts, indicatorLeft, indicatorWidth]);

    const onLayout = (id: string) => (event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        setLayouts((prev) => ({ ...prev, [id]: { x, width } }));
    };

    return (
        <View style={[layout.relative]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={false}>
                {searchOptions.map((option) => (
                    <ButtonVariant
                        key={option.id}
                        onPress={() => setActiveOption(option.id)}
                        onLayout={onLayout(option.id)}
                        style={[
                            gutters.marginRight_18,
                            gutters.paddingBottom_10,
                        ]}
                    >
                        <TextVariant style={[activeOption === option.id ? components.urbanist16BoldPrimary : components.urbanist16SemiBoldPlaceholder]}>
                            {option.name}
                        </TextVariant>
                    </ButtonVariant>
                ))}
            </ScrollView>
            <Animated.View style={[components.indicator, { left: indicatorLeft, width: indicatorWidth }]} />
        </View>
    );
};

export default AnimatedTabBar;
