import React, { FC } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { TextVariant } from '@/components/atoms';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';

interface IProps {
    onTabChange: (tab: string) => void;
    activeTab: string;
}

const ChatHeader: FC<IProps> = ({ onTabChange, activeTab }) => {
    const { layout, components, gutters, colors } = useTheme();
    const { t } = useTranslation(["translations"]);

    const tabs = [
        { id: 'chats', label: t("chats") },
        { id: "communities", label: t("communities") },
        { id: 'apps', label: t("apps") },
    ];

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[layout.row]}>
                {tabs.map(tab => {
                    const animation = useSharedValue(activeTab === tab.id ? 1 : 0);

                    React.useEffect(() => {
                        animation.value = withTiming(activeTab === tab.id ? 1 : 0, { duration: 200 });
                    }, [activeTab]);

                    const animatedStyle = useAnimatedStyle(() => ({
                        borderColor: interpolateColor(animation.value, [0, 1], [colors.cream, colors.primary]),
                        backgroundColor: interpolateColor(animation.value, [0, 1], ["transparent", `${colors.primary}20`]),
                    }));

                    return (
                        <Pressable key={tab.id} onPress={() => onTabChange(tab.id)}>
                            <Animated.View style={[components.inactiveTabStyle, animatedStyle, gutters.marginRight_10]}>
                                <TextVariant style={activeTab === tab.id ? components.urbanist1BoldPrimary : components.urbanist14RegularPrimary}>
                                    {tab.label}
                                </TextVariant>
                            </Animated.View>
                        </Pressable>
                    );
                })}
            </View>
        </ScrollView>
    );
};

export default React.memo(ChatHeader);
