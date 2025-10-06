import React, { FC, useCallback } from 'react';
import { View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Images, ImagesDark, useTheme } from '@/theme';
import { ImageVariant, ButtonVariant, TextVariant } from '@/components/atoms';
import { isImageSourcePropType } from '@/types';
import {
    useSharedValue,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { BlurView } from '@react-native-community/blur';

/**
 * @function BottomTab
 * @param state, descriptors, navigation
 * @returns JSX.Element
 * @description BottomTab component for bottom tab navigation bar
 * @author Nitesh Raj Khanal
 */

const BottomTab: FC<BottomTabBarProps> = ({
    state,
    descriptors,
    navigation,
}) => {
    const { navigationTheme, components, layout, gutters } = useTheme();

    const { t } = useTranslation(["translations"])

    const icons = {
        ContactsScreen: Images.contacts,
        ChatsScreen: Images.chat,
        SettingsScreen: Images.settings,
        HistoryScreen: Images.historyInactive,
        SearchScreen: Images.searchInactive
    };

    const iconsDark = {
        ContactsScreen: ImagesDark.contacts,
        ChatsScreen: ImagesDark.chat,
        SettingsScreen: ImagesDark.settings,
        HistoryScreen: Images.historyInactive,
        SearchScreen: ImagesDark.searchInactive
    };

    const iconsFilled = {
        ContactsScreen: Images.contactsActive,
        ChatsScreen: Images.chatActive,
        SettingsScreen: Images.settingsActive,
        HistoryScreen: Images.historyActive,
        SearchScreen: Images.searchActive
    };

    const iconsDarkFilled = {
        ContactsScreen: ImagesDark.contactsActive,
        ChatsScreen: ImagesDark.chatActive,
        SettingsScreen: ImagesDark.settingsActive,
        HistoryScreen: Images.historyActive,
        SearchScreen: ImagesDark.searchActive
    };

    if (
        !isImageSourcePropType(Images.chat) ||
        !isImageSourcePropType(Images.chatActive) ||
        !isImageSourcePropType(Images.contacts) ||
        !isImageSourcePropType(Images.contactsActive) ||
        !isImageSourcePropType(Images.settings) ||
        !isImageSourcePropType(Images.settingsActive) ||
        !isImageSourcePropType(ImagesDark.chat) ||
        !isImageSourcePropType(ImagesDark.chatActive) ||
        !isImageSourcePropType(ImagesDark.contacts) ||
        !isImageSourcePropType(ImagesDark.contactsActive) ||
        !isImageSourcePropType(ImagesDark.settings) ||
        !isImageSourcePropType(ImagesDark.settingsActive) ||
        !isImageSourcePropType(Images.historyInactive) ||
        !isImageSourcePropType(ImagesDark.historyInactive) ||
        !isImageSourcePropType(Images.historyActive) ||
        !isImageSourcePropType(ImagesDark.historyActive) ||
        !isImageSourcePropType(Images.searchInactive) ||
        !isImageSourcePropType(ImagesDark.searchInactive) ||
        !isImageSourcePropType(Images.searchActive) ||
        !isImageSourcePropType(ImagesDark.searchActive)
    ) {
        throw new Error('Image source is not valid');
    }

    const scaleValues = state.routes.map(() => useSharedValue(1));

    return (
        <View
            style={[
                layout.height80px,
                {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    overflow: 'hidden',
                    backgroundColor:"#fff"
                    // backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    // // borderWidth: 1,
                    // borderColor: 'rgba(255, 255, 255, 0.3)',
                    // shadowColor: '#000',
                    // shadowOffset: { width: 0, height: 4 },
                    // shadowOpacity: 0.2,
                    // shadowRadius: 10,
                    // elevation: 10,
                },
            ]}
        >
            {/* <BlurView
                style={{
                    ...layout.absoluteFillObject,
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                }}
                blurType="light"
                blurAmount={20}
                reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.2)"
                pointerEvents="none"
            /> */}

            <View style={[layout.row, layout.justifyBetween, gutters.paddingVertical_10]}>

                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];

                    const isFocused = state.index === index;

                    const onPress = useCallback(() => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    }, [navigation, route.key, route.name]);

                    const onLongPress = useCallback(() => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    }, [navigation, route.key]);


                    const iconName = route.name as keyof typeof icons;

                    return (
                        <ButtonVariant
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={`tab-${route.name}`}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={[layout.flex_1, layout.justifyCenter, layout.itemsCenter, { zIndex: 10000 }]}
                        >
                            <View style={[layout.itemsCenter, layout.justifyCenter]}>
                                <ImageVariant
                                    source={isFocused ? iconsFilled[iconName] : icons[iconName]}
                                    sourceDark={
                                        isFocused ? iconsDarkFilled[iconName] : iconsDark[iconName]
                                    }
                                    style={[
                                        components.iconSize24,
                                        gutters.marginVertical_4,
                                    ]}
                                />
                                <TextVariant style={[isFocused ? components.urbanist12BoldActive : components.urbanist12BoldInactive, gutters.marginVertical_4]}>{route.name === "ContactsScreen" ? t("contacts") : route.name === "ChatsScreen" ? t("chats") : route.name === "SettingsScreen" ? t("settings") : route.name === "HistoryScreen" ? t("activities") : route.name === "SearchScreen" ? t("search") : null}</TextVariant>
                            </View>
                        </ButtonVariant>
                    );
                })}
            </View>
        </View>
    );
};

export default React.memo(BottomTab);