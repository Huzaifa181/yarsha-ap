import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageBackground, SafeAreaView, ScrollView, SectionList, View } from 'react-native';
import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { Images, ImagesDark, useTheme } from '@/theme';
import { isImageSourcePropType, SafeScreenNavigationProp } from '@/types';
import { shortenAddress } from '@/utils/shortenAddress';
import { useTranslation } from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';
import { sections } from '@/data';
import { useDispatch, useMount, useSelector } from '@/hooks';
import DeviceInfo from 'react-native-device-info';
import { SectionListItem } from '@/screens';
import { reduxStorage, RootState } from '@/store';
import { useNavigation } from '@react-navigation/native';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { getInitials, heightPercentToDp } from '@/utils';
import {
    clearAuthToken,
    clearSolanaBalance,
} from '@/store/slices';
import { Snackbar } from 'react-native-paper';
import FastImage from '@d11/react-native-fast-image';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import UserRepository from '@/database/repositories/User.repository';
import ChatsRepository from '@/database/repositories/Chats.repository';
import GroupChatRepository from '@/database/repositories/GroupChat.repository';
import { getSocket } from '@/services';
import MessageRepository from '@/database/repositories/Message.repository';
import FriendsRepository from '@/database/repositories/Friends.repository';
import YarshaContactsRepository from '@/database/repositories/YarshaContacts.Repository';
import { useLogoutMutation } from '@/hooks/domain';
import { APP_SECRETS } from '@/secrets';
import { SafeScreen } from '@/components/template';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';

interface IProps { }

/**
 * @author Nitesh Raj Khanal
 * @function @Settings
 **/

const Settings: FC<IProps> = () => {
    const { layout, gutters, backgrounds, components, borders, colors } =
        useTheme();

    const { t } = useTranslation(['translations']);

    const navigation = useNavigation<SafeScreenNavigationProp>();

    const [snackBarVisible, setSnackBarVisible] = useState<boolean>(false);

    const onToggleSnackBar = () => setSnackBarVisible(!snackBarVisible);

    const onDismissSnackBar = () => setSnackBarVisible(false);

    const dispatch = useDispatch();

    const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

    if (
        !isImageSourcePropType(Images.noisyGradients) ||
        !isImageSourcePropType(ImagesDark.noisyGradients) ||
        !isImageSourcePropType(Images.editProfile) ||
        !isImageSourcePropType(Images.arrow_left_white) ||
        !isImageSourcePropType(ImagesDark.editProfile) ||
        !isImageSourcePropType(ImagesDark.arrow_left_white) ||
        !isImageSourcePropType(Images.dummyProfile) ||
        !isImageSourcePropType(ImagesDark.dummyProfile) ||
        !isImageSourcePropType(Images.verified) ||
        !isImageSourcePropType(ImagesDark.verified) ||
        !isImageSourcePropType(Images.copy) ||
        !isImageSourcePropType(ImagesDark.copy) ||
        !isImageSourcePropType(Images.solana) ||
        !isImageSourcePropType(ImagesDark.solana) ||
        !isImageSourcePropType(Images.arrow_right) ||
        !isImageSourcePropType(ImagesDark.arrow_right) ||
        !isImageSourcePropType(Images.caretLeft) ||
        !isImageSourcePropType(ImagesDark.caretLeft) ||
        !isImageSourcePropType(Images.arrowLeft) ||
        !isImageSourcePropType(ImagesDark.arrowLeft) ||
        !isImageSourcePropType(ImagesDark.headerBack) ||
        !isImageSourcePropType(Images.headerBack)
    ) {
        throw new Error('Image source is not valid');
    }

    const isBiometricEnabled = useSelector((state: RootState) => state?.availableBiometrics.isBiometricEnabled);
    const [biometricSnackBarVisible, setBiometricSnackBarVisible] = useState<boolean>(false);
    const [biometricMessage, setBiometricMessage] = useState<string>("");
    const hasMounted = useRef(false);

    const { data: latestUser } = useFetchLatestUserQuery();

    const onDismissBiometricSnackBar = () => setBiometricSnackBarVisible(false);

    const snapPoints = useMemo(
        () => [heightPercentToDp('20'), heightPercentToDp('20')],
        [],
    );

    const copyToClipboard = useCallback(() => {
        Clipboard.setString(latestUser?.address || '');
        onToggleSnackBar();
    }, [setSnackBarVisible]);

    const [versionNumber, setVersionNumber] = useState<string>('');

    useMount(() => {
        const fetchVersionNumber = async () => {
            const version = await DeviceInfo.getVersion();
            setVersionNumber(version);
        };

        fetchVersionNumber();
    });

    const shortenedWalletAddress = shortenAddress(latestUser?.address || '');

    const renderBackdrop = useCallback(
        (
            props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps,
        ) => (
            <BottomSheetBackdrop
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                {...props}
            />
        ),
        [],
    );

    useEffect(() => {
        if (hasMounted.current) {
            if (isBiometricEnabled !== null) {
                setBiometricMessage(isBiometricEnabled ? "Biometric Enabled" : "Biometric Disabled");
                setBiometricSnackBarVisible(true);

                const timer = setTimeout(() => {
                    setBiometricSnackBarVisible(false);
                }, 10000);

                return () => clearTimeout(timer);
            }
        } else {
            hasMounted.current = true;
        }
    }, [isBiometricEnabled]);

    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
    }, []);

    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    const handleOpenLogoutSlider = useCallback(() => {
        bottomSheetModalRef.current?.present();
    }, []);

    const handleCloseLogoutSlider = useCallback(() => {
        bottomSheetModalRef.current?.dismiss();
    }, []);

    const profileName = latestUser?.fullName || '';
    const profileDescription = latestUser?.userBio || 'Blockchain Enthusiast';

    const logoutAction = useCallback(async () => {
        let fcmToken;
        await reduxStorage
            .getItem(APP_SECRETS.REGISTERED_FCM_TOKEN)
            .then((tokenFromStorage: string) => {
                console.log('tokenFromStorage', tokenFromStorage);
                fcmToken = tokenFromStorage || '';
            })
            .catch((error: unknown) => {
                console.log('error while getting fcm token from storage', error);
            });
        const logoutResponse = await logout({ fcmToken: fcmToken || "" }).unwrap();
        console.log("logoutResponse", logoutResponse);
        const socket = getSocket();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
        });
        setTimeout(async () => {
            socket?.disconnect();
            handleCloseLogoutSlider();
            dispatch(clearAuthToken());
            dispatch(clearSolanaBalance());
            await UserRepository.clearAllUsers();
            await ChatsRepository.deleteAllGroupChats();
            await GroupChatRepository.deleteAllGroupChats();
            await MessageRepository.deleteAllMessages();
            await FriendsRepository.deleteAllFriends();
            await YarshaContactsRepository.deleteAllContacts();
        }, 0);
    }, []);

    return (
        <>
            <View
                style={[layout.flex_1, backgrounds.white]}
            >
                <View style={[layout.flex_1]}>
                    <View style={[{ height: hp("30%") }, layout.fullWidth]}>
                        <ImageBackground
                            style={[layout.justifyBetween, layout.flex_1, gutters.paddingVertical_14]}
                            source={Images.noisyGradients}
                            resizeMode='stretch'
                        >
                            <SafeAreaView style={[layout.flex_1, layout.z1, { marginTop: -20 }]}>
                                <View style={[]}>
                                    <View
                                        style={[layout.row, layout.itemsCenter, layout.justifyBetween, gutters.paddingHorizontal_4, gutters.paddingTop_10]}>
                                        <ButtonVariant
                                            style={[layout.height40, layout.width40, layout.itemsCenter, layout.justifyCenter]}
                                            onPress={() => {
                                                navigation.navigate("ChatsScreen")
                                            }}>
                                            <ImageVariant source={Images.headerBack} sourceDark={ImagesDark.headerBack}
                                                style={[components.iconSize24]} tintColor={colors.white}
                                                resizeMode='contain' />
                                        </ButtonVariant>

                                        <TextVariant style={[components.urbanist20BoldWhite]}>{t("settings")}</TextVariant>

                                        <ButtonVariant
                                            style={[layout.height40, layout.width40, layout.itemsCenter, layout.justifyCenter]}
                                            onPress={() => {
                                                navigation.navigate("EditProfileScreen")
                                            }}>
                                            <ImageVariant source={Images.settings_edit} sourceDark={ImagesDark.settings_edit}
                                                style={[components.iconSize24]} resizeMode='contain' />
                                        </ButtonVariant>
                                    </View>

                                    <View style={[layout.row, layout.itemsCenter, layout.justifyStart, gutters.marginTop_24, gutters.paddingHorizontal_12]}>
                                        {
                                            (latestUser?.profilePicture) ? (
                                                <View style={[components.imageSize90, backgrounds.white, gutters.padding_4, borders.rounded_500]}>
                                                    <FastImage source={{ uri: latestUser?.profilePicture }}
                                                        style={[layout.fullHeight, layout.fullWidth, borders.rounded_500]}
                                                        resizeMode='cover' />
                                                    <View style={[layout.absolute, layout.bottom0, layout.right0, backgrounds.white, borders.rounded_500, components.iconSize32, gutters.padding_4]}>
                                                        <View style={[backgrounds.primary, borders.rounded_500, layout.fullHeight, layout.fullWidth, layout.itemsCenter, layout.justifyCenter]}>
                                                            <ImageVariant
                                                                source={Images.pencil_white}
                                                                sourceDark={ImagesDark.pencil_white}
                                                                style={[components.iconSize22]}
                                                                resizeMode='contain'
                                                            />
                                                        </View>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View
                                                    style={[
                                                        components.imageSize90,
                                                        borders.rounded_500,
                                                        { backgroundColor: latestUser?.backgroundColor || '#FFFFFF' },
                                                        layout.itemsCenter,
                                                        layout.justifyCenter,
                                                    ]}
                                                >
                                                    <TextVariant style={[components.urbanist48RegularWhite, components.textCenter]}>
                                                        {getInitials(latestUser?.fullName as string)}
                                                    </TextVariant>
                                                    <View style={[layout.absolute, layout.bottom0, layout.right0, backgrounds.white, borders.rounded_500, components.iconSize32, gutters.padding_4]}>
                                                        <View style={[backgrounds.primary, borders.rounded_500, layout.fullHeight, layout.fullWidth, layout.itemsCenter, layout.justifyCenter]}>
                                                            <ImageVariant
                                                                source={Images.pencil_white}
                                                                sourceDark={ImagesDark.pencil_white}
                                                                style={[components.iconSize22]}
                                                                resizeMode='contain'
                                                            />
                                                        </View>
                                                    </View>
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
                                <View style={[layout.absolute, layout.top26percentage, { width: "95%" }, layout.flex_1, gutters.marginHorizontal_12, backgrounds.white, gutters.paddingVertical_14, gutters.paddingHorizontal_12, borders.rounded_12, { borderWidth: 0.9, borderColor: "#EBECFF" }]}>
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
                    <View style={[gutters.padding_14, layout.justifyBetween, layout.flex_1, backgrounds.white, gutters.marginTop_30]}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            scrollEventThrottle={16}
                            style={[layout.flex_1, gutters.paddingBottom_125]}

                        >
                            {sections.map((section, index) => (
                                <React.Fragment key={index}>
                                    <TextVariant
                                        style={[components.urbanist16SemiBoldPrimary, gutters.marginTop_6]}>{section.title}</TextVariant>
                                    {section.data.map((item, index) => (
                                        <SectionListItem key={index} item={item} versionNumber={versionNumber}
                                            handleLogout={handleOpenLogoutSlider} />
                                    ))}
                                </React.Fragment>
                            ))}
                        </ScrollView>
                    </View>
                </View>
                <Snackbar
                    visible={snackBarVisible}
                    onDismiss={onDismissSnackBar}
                    duration={1000}
                    style={[components.blueBackgroundButton, layout.z100, gutters.marginBottom_70]}>
                    <TextVariant style={[components.urbanist16SemiBoldWhite]}>
                        {t('copiedToClipboard')}
                    </TextVariant>
                </Snackbar>

                <Snackbar
                    visible={biometricSnackBarVisible}
                    onDismiss={onDismissBiometricSnackBar}
                    duration={Snackbar.DURATION_SHORT}
                    style={[gutters.marginBottom_70, isBiometricEnabled ? [components.blueBackgroundButton] : [components.redBackgroundButton]]}
                >
                    <TextVariant style={[components.urbanist16SemiBoldWhite]}>{biometricMessage}</TextVariant>
                </Snackbar>
            </View>

            <BottomSheetModal
                ref={bottomSheetModalRef}
                index={2}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                onChange={handleSheetChanges}
                enableDismissOnClose
                enablePanDownToClose={true}
                backgroundStyle={[backgrounds.white, borders.roundedTop_20]}
                handleIndicatorStyle={[layout.width40, backgrounds.cream]}>
                <BottomSheetView
                    style={[
                        layout.itemsSelfCenter,
                        layout.fullWidth,
                        gutters.paddingHorizontal_14,
                    ]}>
                    <View
                        style={[
                            layout.row,
                            layout.itemsCenter,
                            layout.justifyStart,
                            gutters.marginVertical_14,
                        ]}>
                        <ImageVariant
                            source={Images.arrowLeft}
                            sourceDark={ImagesDark.arrowLeft}
                            style={[components.iconSize20]}
                        />
                        <TextVariant style={[components.urbanist20BoldBlack]}>
                            {t('doYouWantToLogOut')}
                        </TextVariant>
                    </View>
                    <ButtonVariant
                        onPress={logoutAction}
                        style={[
                            components.redBackgroundButton,
                            layout.itemsCenter,
                            gutters.padding_16,
                            gutters.marginVertical_14,
                        ]}>
                        <TextVariant style={[components.urbanist16SemiBoldWhite]}>
                            {t('confirm')}
                        </TextVariant>
                    </ButtonVariant>
                    <ButtonVariant
                        onPress={handleCloseLogoutSlider}
                        style={[layout.itemsCenter, gutters.padding_16]}>
                        <TextVariant style={[components.urbanist16SemiBoldPlaceholder]}>
                            {t('cancel')}
                        </TextVariant>
                    </ButtonVariant>
                    <View style={[gutters.marginBottom_10]} />
                </BottomSheetView>
            </BottomSheetModal>

        </>
    );
};

export default React.memo(Settings);
