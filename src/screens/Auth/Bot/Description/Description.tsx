import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import BotsRepository from '@/database/repositories/Bots.repository';
import { Images, ImagesDark, useTheme } from '@/theme';
import { isImageSourcePropType, SafeScreenNavigationProp, SafeScreenRouteProp } from '@/types';
import { getInitials, heightPercentToDp } from '@/utils';
import FastImage from '@d11/react-native-fast-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import { View, Text, ImageBackground, SafeAreaView } from 'react-native'
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @Description
**/

const BotDescription: FC<IProps> = (props) => {
    const { layout, gutters, backgrounds, components, borders, colors } = useTheme();
    const { t } = useTranslation(["translations"]);

    const [activeTab, setActiveTab] = useState<string>("Shared Media");

    const navigation = useNavigation<SafeScreenNavigationProp>();

    const route = useRoute<SafeScreenRouteProp & {
        params: {
            botId: string
        }
    }>();

    const tabs = [
        { id: 'Shared Media', label: "Shared Media" },
        { id: 'Similar Bots', label: "Similar Bots" },
    ];
    const { botId } = route.params;

    const [botInfo, setBotInfo] = useState<{
        id: string;
        name: string;
        profilePicture: string;
        botBio?: string;
        category?: string;
        username?: string;
        descriptions: string
    }>({
        descriptions: "",
        id: "",
        name: "",
        profilePicture: "",
        botBio: "",
        category: "",
        username: ""
    })

    if (!isImageSourcePropType(Images.noisyGradients)
        || !isImageSourcePropType(ImagesDark.noisyGradients)
        || !isImageSourcePropType(Images.edit2)
        || !isImageSourcePropType(Images.arrowBack)
        || !isImageSourcePropType(ImagesDark.edit2)
        || !isImageSourcePropType(ImagesDark.arrowBack)
        || !isImageSourcePropType(Images.dummyProfile)
        || !isImageSourcePropType(ImagesDark.dummyProfile)
        || !isImageSourcePropType(Images.verified)
        || !isImageSourcePropType(ImagesDark.verified)
        || !isImageSourcePropType(Images.copy)
        || !isImageSourcePropType(ImagesDark.copy)
        || !isImageSourcePropType(Images.solana)
        || !isImageSourcePropType(ImagesDark.solana)
        || !isImageSourcePropType(Images.arrow_right)
        || !isImageSourcePropType(ImagesDark.arrow_right)
    ) {
        throw new Error("Image source is not valid");
    }

    const linkOpacity = useSharedValue(1);
    const groupsOpacity = useSharedValue(0);

    const handleTabPress = (tab: string) => {
        setActiveTab(tab);
        if (tab === 'Shared Media') {
            linkOpacity.value = withTiming(1);
            groupsOpacity.value = withTiming(0);
        } else {
            linkOpacity.value = withTiming(0);
            groupsOpacity.value = withTiming(1);
        }
    };

    const linkAnimatedStyle = useAnimatedStyle(() => ({
        opacity: linkOpacity.value,
    }));

    const groupsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: groupsOpacity.value,
    }));

    useEffect(() => {
        const fetchBotDetails = async () => {
            const botInfo = await BotsRepository.getBotDescription(botId)

            setBotInfo({
                descriptions: botInfo?.botDescription || "",
                id: botInfo?.botId || "",
                name: botInfo?.botName || "",
                profilePicture: botInfo?.botName || "",
                botBio: botInfo?.botBio || "",
                category: botInfo?.category || "",
                username: botInfo?.username || ""
            })
        }

        fetchBotDetails()
    }, [])

    const profileName = botInfo.name || '';


    return (
        <View
            style={[layout.flex_1, backgrounds.white]}
        >
            <View style={[layout.fullWidth, { height: heightPercentToDp(("30")) }]}>
                <ImageBackground
                    style={[layout.justifyBetween, layout.flex_1, gutters.paddingVertical_14]}
                    source={Images.noisyGradients}
                    resizeMode='stretch'
                >
                    <SafeAreaView style={[layout.flex_1, layout.z1, { marginTop: -20 }]}>
                        <View style={[]}>
                            <View
                                style={[layout.row, layout.itemsCenter, layout.justifyBetween, gutters.paddingHorizontal_4, gutters.paddingTop_10]}>
                                <ButtonVariant style={[layout.height40, layout.width40, layout.itemsCenter, layout.justifyCenter]} onPress={() => {
                                    navigation.goBack()
                                }}>
                                    <ImageVariant source={Images.headerBack} sourceDark={ImagesDark.headerBack}
                                        style={[components.iconSize24]} tintColor={colors.white}
                                        resizeMode='contain' />
                                </ButtonVariant>

                                <ButtonVariant style={[layout.height40, layout.width40, layout.itemsCenter, layout.justifyCenter]} onPress={() => {
                                }}>
                                    <ImageVariant source={Images.settings_edit} sourceDark={ImagesDark.settings_edit}
                                        style={[components.iconSize24]} tintColor={colors.white}
                                        resizeMode='contain' />
                                </ButtonVariant>
                            </View>

                            <View style={[layout.row, layout.itemsCenter, layout.justifyStart, gutters.marginTop_24, gutters.paddingHorizontal_12]}>
                                {
                                    (botInfo.profilePicture) ? (
                                        <View style={[components.imageSize90, backgrounds.white, gutters.padding_4, borders.rounded_500]}>
                                            <FastImage source={{ uri: botInfo.profilePicture }}
                                                style={[layout.fullHeight, layout.fullWidth, borders.rounded_500]}
                                                resizeMode='cover' />
                                        </View>
                                    ) : (
                                        <View
                                            style={[
                                                components.imageSize90,
                                                borders.rounded_500,
                                                { backgroundColor: '#FFFFFF' },
                                                layout.itemsCenter,
                                                layout.justifyCenter,
                                            ]}
                                        >
                                            <TextVariant style={[components.urbanist48RegularWhite, components.textCenter]}>
                                                {getInitials(botInfo.name as string)}
                                            </TextVariant>
                                        </View>)}
                                <View style={[gutters.marginLeft_14]}>
                                    <TextVariant
                                        style={[components.urbanist24BoldWhite, gutters.marginVertical_10]}>{t("displayProfileName", { profileName })}</TextVariant>
                                    <TextVariant
                                        style={[components.urbanist16RegularWhite, gutters.marginVertical_2]}>2000 Monthly Users</TextVariant>
                                </View>
                            </View>
                        </View>

                        <View style={[layout.absolute, layout.top27percentage, { width: "95%" }, layout.flex_1, gutters.marginHorizontal_12, backgrounds.white, gutters.paddingVertical_14, gutters.paddingHorizontal_12, borders.rounded_12, { borderWidth: 0.9, borderColor: "#EBECFF" }]}>
                            <View style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
                                <View>
                                    <TextVariant style={[components.urbanist12RegularwalletAddressPlaceholder]}>{t("username")}</TextVariant>
                                    <TextVariant style={[components.urbanist20BoldBlack, gutters.marginTop_6]}>{botInfo.username}</TextVariant>
                                </View>
                                <ButtonVariant onPress={() => { }}>
                                    <ImageVariant style={[components.iconSize24]} source={Images.share}
                                        sourceDark={ImagesDark.share} />
                                </ButtonVariant>
                            </View>
                        </View>
                    </SafeAreaView>
                </ImageBackground>
            </View>
            <View style={[gutters.padding_14, layout.justifyBetween, backgrounds.white, gutters.marginTop_24]}>
                <TextVariant style={[components.urbanist14SemiBoldPrimary, gutters.marginTop_18, gutters.marginBottom_6]}>{t("info")}</TextVariant>
                <TextVariant style={[components.urbanist14RegularBlack]}>{botInfo.descriptions}</TextVariant>

                <View style={[gutters.marginTop_18]}>
                    <TextVariant style={[components.urbanist14SemiBoldPrimary, gutters.marginBottom_6]}>{t("botManage")}</TextVariant>
                    <ButtonVariant style={[layout.row, layout.justifyBetween, layout.itemsCenter, gutters.marginTop_12]}>
                        <View style={[layout.row, layout.itemsCenter]}>
                            <ImageVariant
                                source={Images.circleadd}
                                sourceDark={ImagesDark.circleadd}
                                style={[components.iconSize24]}
                            />
                            <TextVariant style={[components.urbanist14SemiBoldBlack, gutters.marginLeft_12]}>{t("addToGroupOrChannel")}</TextVariant>
                        </View>
                        <ImageVariant
                            source={Images.arrow_right_add}
                            sourceDark={ImagesDark.arrow_right_add}
                            style={[components.iconSize18]}
                            tintColor={colors.dark}
                        />
                    </ButtonVariant>
                </View>

                <View style={[layout.row, layout.justifyStart, gutters.marginTop_18]}>
                    {tabs.map((tab) => {
                        const animation = useSharedValue(activeTab === tab.id ? 1 : 0);

                        React.useEffect(() => {
                            animation.value = withTiming(activeTab === tab.id ? 1 : 0, { duration: 200 });
                        }, [activeTab]);

                        const animatedStyle = useAnimatedStyle(() => ({
                            borderColor: interpolateColor(animation.value, [0, 1], [colors.cream, colors.primary]),
                            backgroundColor: interpolateColor(animation.value, [0, 1], ["transparent", `${colors.primary}20`]),
                        }));
                        return (
                            <ButtonVariant key={tab.id} onPress={() => handleTabPress(tab.label)} style={[gutters.marginRight_4]}>
                                <Animated.View style={[components.inactiveTabStyle, animatedStyle, gutters.marginRight_10]}>
                                    <TextVariant style={[activeTab === tab.id ? components.urbanist1BoldPrimary : components.urbanist14RegularPrimary]}>
                                        {tab.label}
                                    </TextVariant>
                                </Animated.View>
                            </ButtonVariant>
                        )
                    })}
                </View>
            </View>
        </View>
    )
}

export default React.memo(BotDescription)
