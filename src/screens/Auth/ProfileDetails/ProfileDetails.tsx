import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { Images, ImagesDark, useTheme } from '@/theme';
import { isImageSourcePropType, ItemData, linkData, ProfileDetailsSpace, SafeScreenNavigationProp, SafeScreenRouteProp } from '@/types';
import { getInitials, heightPercentToDp } from '@/utils';
import { shortenAddress } from '@/utils/shortenAddress';
import FastImage from '@d11/react-native-fast-image';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageBackground, SafeAreaView, SectionList, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import GroupItem from './GroupItem';
import LinkItem from './LinkItem';
import { Snackbar } from 'react-native-paper';

interface IProps { }

/**
 * @author Nitesh Raj Khanal
* @function @ProfileDetails
* @returns JSX.Element
**/


const ProfileDetails: FC<IProps> = (props): JSX.Element => {
    const { layout, gutters, backgrounds, components, borders, colors } = useTheme();
    const { t } = useTranslation(["translations"]);

    const navigation = useNavigation<SafeScreenNavigationProp>();
    const route = useRoute<SafeScreenRouteProp & {
        params: {
            Address: string;
            FullName: string;
            ProfilePicture: string;
            BackgroundColor: string;
            UserBio: string;
            Username: string;
        }
    }>();

    const { Address, BackgroundColor, FullName, ProfilePicture, UserBio, Username } = route.params

    const [activeTab, setActiveTab] = useState<string>("Link");
    const [snackBarVisible, setSnackBarVisible] = useState<boolean>(false);
    const tabs = ["Link", "Groups"];


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

    const copyToClipboard = useCallback(() => {
        Clipboard.setString(Address);
        setSnackBarVisible(true);
    }, [Address]);


    const linkOpacity = useSharedValue(1);
    const groupsOpacity = useSharedValue(0);

    const handleTabPress = (tab: string) => {
        setActiveTab(tab);
        if (tab === 'Link') {
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

    const onDismissSnackbar = useCallback(() => {
        setSnackBarVisible(false);
    }, []);

    const renderGroupItem = useCallback(({ item }: { item: ProfileDetailsSpace.SharedGroupChats }) => (
        <GroupItem chatId={item.chatId} groupImage={item.groupIcon} groupName={item.name} membersCount={item.memberCount} />
    ), []);

    const renderLinkItem = useCallback(({ item }: { item: ItemData }) => (
        <LinkItem image={item.image} name={item.name} url={item.url} />
    ), []);

    const profileName = FullName || '';
    const profileDescription = UserBio || 'Blockchain Enthusiast';

    const shortenedWalletAddress = shortenAddress(Address || '');


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
                                <TextVariant style={[components.urbanist20BoldWhite]}>{t("profile")}</TextVariant>
                                <View
                                    style={[layout.height40, layout.width40, layout.itemsCenter, layout.justifyCenter]}
                                />

                            </View>
                            <View style={[layout.row, layout.itemsCenter, layout.justifyStart, gutters.marginTop_24, gutters.paddingHorizontal_12]}>
                                {
                                    (ProfilePicture) ? (
                                        <View style={[components.imageSize90, backgrounds.white, gutters.padding_4, borders.rounded_500]}>
                                            <FastImage source={{ uri: ProfilePicture }}
                                                style={[layout.fullHeight, layout.fullWidth, borders.rounded_500]}
                                                resizeMode='cover' />
                                            {/* <View style={[layout.absolute, layout.bottom0, layout.right0, backgrounds.white, borders.rounded_500, components.iconSize32, gutters.padding_4]}>
                                                <View style={[backgrounds.primary, borders.rounded_500, layout.fullHeight, layout.fullWidth, layout.itemsCenter, layout.justifyCenter]}>
                                                    <ImageVariant
                                                        source={Images.pencil_white}
                                                        sourceDark={ImagesDark.pencil_white}
                                                        style={[components.iconSize22]}
                                                        resizeMode='contain'
                                                    />
                                                </View>
                                            </View> */}
                                        </View>
                                    ) : (
                                        <View
                                            style={[
                                                components.imageSize90,
                                                borders.rounded_500,
                                                { backgroundColor: BackgroundColor || '#FFFFFF' },
                                                layout.itemsCenter,
                                                layout.justifyCenter,
                                            ]}
                                        >
                                            <TextVariant style={[components.urbanist48RegularWhite, components.textCenter]}>
                                                {getInitials(FullName as string)}
                                            </TextVariant>
                                            {/* <View style={[layout.absolute, layout.bottom0, layout.right0, backgrounds.white, borders.rounded_500, components.iconSize32, gutters.padding_4]}>
                                                <View style={[backgrounds.primary, borders.rounded_500, layout.fullHeight, layout.fullWidth, layout.itemsCenter, layout.justifyCenter]}>
                                                    <ImageVariant
                                                        source={Images.pencil_white}
                                                        sourceDark={ImagesDark.pencil_white}
                                                        style={[components.iconSize22]}
                                                        resizeMode='contain'
                                                    />
                                                </View>
                                            </View> */}
                                        </View>
                                    )
                                }
                                <View style={[gutters.marginLeft_14]}>
                                    <TextVariant
                                        style={[components.urbanist24BoldWhite, gutters.marginVertical_10]}>{t("displayProfileName", { profileName })}</TextVariant>
                                    <TextVariant
                                        style={[components.urbanist16RegularWhite, gutters.marginVertical_2]}>{t("profileDescription", { profileDescription })}</TextVariant>
                                </View>
                            </View>

                        </View>
                        <View style={[layout.absolute, layout.top27percentage, { width: "95%" }, layout.flex_1, gutters.marginHorizontal_12, backgrounds.white, gutters.paddingVertical_14, gutters.paddingHorizontal_12, borders.rounded_12, { borderWidth: 0.9, borderColor: "#EBECFF" }]}>
                            <View style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
                                <View>
                                    <TextVariant style={[components.urbanist12RegularwalletAddressPlaceholder]}>{t("walletAddress")}</TextVariant>
                                    <TextVariant style={[components.urbanist20BoldBlack, gutters.marginTop_6]}>{shortenedWalletAddress}</TextVariant>
                                </View>
                                <ButtonVariant onPress={copyToClipboard}>
                                    <ImageVariant style={[components.iconSize24]} source={Images.copy_settings}
                                        sourceDark={ImagesDark.copy_settings} />
                                </ButtonVariant>
                            </View>
                        </View>

                    </SafeAreaView>
                </ImageBackground>
            </View>
            <View style={[gutters.padding_14, layout.justifyBetween, layout.flex_1, backgrounds.white, gutters.marginTop_24]}>
                <View style={[layout.row, layout.justifyStart, gutters.marginTop_14]}>
                    {tabs.map((tab) => (
                        <TouchableOpacity key={tab} onPress={() => handleTabPress(tab)} style={[gutters.marginRight_16]}>
                            <TextVariant style={[activeTab === tab ? components.urbanist20BoldPrimary : components.urbanist20BoldtextInputPlaceholder]}>
                                {tab}
                            </TextVariant>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={[layout.flex_1]}>
                    <View style={[layout.flex_1]}>
                        {linkData.length > 0 && <Animated.View style={[layout.flex_1, linkAnimatedStyle]}>
                            <SectionList
                                sections={linkData}
                                showsVerticalScrollIndicator={false}
                                scrollEventThrottle={16}
                                keyExtractor={(item, index) => item.id + index}
                                renderItem={renderLinkItem}
                                ListEmptyComponent={() => (
                                    <View style={[layout.flex_1, layout.justifyCenter, layout.itemsCenter, gutters.marginRight_24]}>
                                        <TextVariant style={[components.urbanist16RegularPlaceholder]}>{t("youHaventSharedAnyMedia")}</TextVariant>
                                    </View>
                                )}
                                renderSectionHeader={({ section: { title } }) => (
                                    <TextVariant style={[components.urbanist16SemiBoldPlaceholder, gutters.marginVertical_14]}>{title}</TextVariant>
                                )}
                            />
                        </Animated.View>}

                        <Animated.View style={[layout.flex_1, groupsAnimatedStyle]}>
                            {/* <FlatList
                                data={userInfoFromRedux?.chats}
                                keyExtractor={(item, index) => item.chatId + index}
                                scrollEventThrottle={16}
                                showsVerticalScrollIndicator={false}
                                renderItem={renderGroupItem}
                                removeClippedSubviews={false}
                            /> */}
                        </Animated.View>
                    </View>
                </View>
            </View>
            <Snackbar
                visible={snackBarVisible}
                onDismiss={onDismissSnackbar}
                duration={Snackbar.DURATION_SHORT}
                style={[components.blueBackgroundButton]}
            >
                <TextVariant style={[components.urbanist16SemiBoldWhite]}>{t("copiedToClipboard")}</TextVariant>
            </Snackbar>
        </View>
    );
};

export default React.memo(ProfileDetails);
