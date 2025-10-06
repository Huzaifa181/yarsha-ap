import React, { FC, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Images, ImagesDark, useTheme } from '@/theme'
import { isImageSourcePropType, SafeScreenNavigationProp } from '@/types'
import { useSelector } from '@/hooks'
import { RootState } from '@/store'
import { ImageBackground, SafeAreaView, View } from 'react-native'
import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms'
import { useNavigation } from '@react-navigation/native'
import Clipboard from '@react-native-clipboard/clipboard'
import { Skeleton } from '@rneui/themed'
import LinearGradient from 'react-native-linear-gradient'
import { shortenAddress } from '@/utils/shortenAddress'
import { getInitials, getRandomColor, heightPercentToDp } from "@/utils";
import { Snackbar } from 'react-native-paper'
import FastImage from '@d11/react-native-fast-image';

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @SecurityAndPrivacy
* @returns JSX.Element
**/


const SecurityAndPrivacy: FC<IProps> = (props): JSX.Element => {
    const { layout, gutters, backgrounds, components, borders, colors } = useTheme()

    const { t } = useTranslation(["translations"])

    const navigation = useNavigation<SafeScreenNavigationProp>()

    const [snackBarVisible, setSnackBarVisible] = useState<boolean>(false);

    const onToggleSnackBar = () => setSnackBarVisible(!snackBarVisible);

    const onDismissSnackBar = () => setSnackBarVisible(false);


    if (!isImageSourcePropType(Images.noisyGradients)
        || !isImageSourcePropType(ImagesDark.noisyGradients)
        || !isImageSourcePropType(Images.editProfile)
        || !isImageSourcePropType(Images.arrow_left_white)
        || !isImageSourcePropType(ImagesDark.editProfile)
        || !isImageSourcePropType(ImagesDark.arrow_left_white)
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
        || !isImageSourcePropType(Images.caretLeft)
        || !isImageSourcePropType(ImagesDark.caretLeft)
        || !isImageSourcePropType(Images.arrowLeft)
        || !isImageSourcePropType(ImagesDark.arrowLeft)
    ) {
        throw new Error("Image source is not valid")
    }
    // console.log("userInfo in setting screen", userInfo)
    const profileDescription = "Blockchain Enthusiast"
    const walletAddress =  ""

    const copyToClipboard = useCallback(() => {
        Clipboard.setString(walletAddress);
        onToggleSnackBar()
    }, [setSnackBarVisible])

    const shortenedWalletAddress = shortenAddress(walletAddress)

    const { backgroundColor } = getRandomColor();

    const isBiometricsAvailable = useSelector((state: RootState) => state.availableBiometrics.availableBiometrics);
    const isBioEnrolled = useSelector((state: RootState) => state.availableBiometrics.isBiometricEnrolled);

    console.log("isBiometricsAvailable", isBiometricsAvailable[0])
    console.log("isBioEnrolled", isBioEnrolled)

    return (
        <View style={[layout.flex_1]}>
            <View style={[{ height: heightPercentToDp("30") }, layout.fullWidth]}>
                <ImageBackground style={[layout.justifyBetween, layout.flex_1]} source={Images.noisyGradients} resizeMode='stretch'>
                    <SafeAreaView style={[layout.flex_1, layout.z1]}>
                        <View style={[]}>
                            <View
                                style={[layout.row, layout.justifyBetween, gutters.paddingHorizontal_4, gutters.paddingTop_10]}>
                                <ButtonVariant style={[layout.height40, layout.width40, layout.itemsCenter, layout.justifyCenter]} onPress={() => {
                                    navigation.goBack()
                                }}>
                                    <ImageVariant source={Images.caretLeft} sourceDark={ImagesDark.caretLeft} style={[components.iconSize24]} tintColor={colors.white} resizeMode='contain' />
                                </ButtonVariant>
                                {/* {
                                    userInfo?.user?.profilePicture ? (
                                        <View style={[components.imageSize90]}>
                                             <FastImage source={{ uri: userInfo?.user.profilePicture }}
                                                    style={[layout.fullHeight, layout.fullWidth, borders.rounded_500]}
                                                    resizeMode='cover' />
                                            <View style={[layout.absolute, layout.bottom0, layout.right0]}>
                                                <ImageVariant
                                                    source={Images.verified}
                                                    sourceDark={ImagesDark.verified}
                                                    style={[components.iconSize24]}
                                                />
                                            </View>
                                        </View>
                                    ) : (
                                        <View
                                            style={[
                                                components.imageSize90,
                                                borders.rounded_500,
                                                { backgroundColor },
                                                layout.itemsCenter,
                                                layout.justifyCenter,
                                            ]}
                                        >
                                            <TextVariant style={[components.urbanist48RegularWhite, components.textCenter]}>
                                                {getInitials(userInfo?.user?.username || nonUpdatedUserInfo?.userData?.username as string)}
                                            </TextVariant>
                                            <View style={[layout.absolute, layout.bottom0, layout.right0]}>
                                                <ImageVariant
                                                    source={Images.verified}
                                                    sourceDark={ImagesDark.verified}
                                                    style={[components.iconSize24]}
                                                />
                                            </View>
                                        </View>
                                    )
                                } */}

                                <ButtonVariant style={[layout.height40, layout.width40, layout.itemsCenter, layout.justifyCenter]} onPress={() => {
                                    navigation.navigate("EditProfileScreen")
                                }}>
                                    <ImageVariant source={Images.editProfile} sourceDark={ImagesDark.editProfile} style={[components.iconSize20]} resizeMode='contain' />
                                </ButtonVariant>
                            </View>
                            <TextVariant style={[components.urbanist24BoldWhite, components.textCenter, gutters.marginVertical_10]}>{t("displayProfileName", { profileName:"" })}</TextVariant>
                            <TextVariant style={[components.urbanist16RegularWhite, components.textCenter, gutters.marginVertical_2]}>{t("profileDescription", { profileDescription })}</TextVariant>
                            {
                                walletAddress ? (
                                    <View style={[layout.itemsSelfCenter, layout.row, layout.justifyCenter, layout.itemsCenter, gutters.padding_10, borders.rounded_500, gutters.marginVertical_10]}>
                                        <TextVariant style={[components.urbanist14RegularWhite, components.textCenter, gutters.marginRight_8]}>{walletAddress ? shortenedWalletAddress : ""}</TextVariant>
                                        <ButtonVariant onPress={copyToClipboard}>
                                            <ImageVariant style={[components.iconSize16]} source={Images.copy} sourceDark={ImagesDark.copy} />
                                        </ButtonVariant>
                                    </View>
                                ) : (
                                    <Skeleton
                                        LinearGradientComponent={LinearGradient}
                                        animation="wave"
                                        height={38}
                                        width={120}
                                        style={[layout.itemsSelfCenter]}
                                        circle={true}
                                    />
                                )
                            }

                        </View>
                    </SafeAreaView>
                </ImageBackground>
            </View>

            {
                isBiometricsAvailable.length > 0 && isBioEnrolled && (
                    <View style={[gutters.marginVertical_10, gutters.paddingHorizontal_14]}>
                        <TextVariant style={[components.urbanist18BoldBlack]}>{isBiometricsAvailable[0]?isBiometricsAvailable[0]:t("noBiometricsAvailable")}</TextVariant>
                    </View>
                )
            }

            <Snackbar
                visible={snackBarVisible}
                onDismiss={onDismissSnackBar}
                duration={1000}
                style={[components.blueBackgroundButton]}
            >
                <TextVariant style={[components.urbanist16SemiBoldWhite]}>{t("copiedToClipboard")}</TextVariant>
            </Snackbar>
        </View>
    )
}


export default React.memo(SecurityAndPrivacy)
