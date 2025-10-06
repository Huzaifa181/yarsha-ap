import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { SafeScreen } from '@/components/template';
import { CHAT_PAGINATION_LIMIT } from '@/constants';
import { useMount, useSelector } from '@/hooks';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { useFetchUserMutation } from '@/hooks/domain/fetch-user/useFetchUser';
import { useUploadProfilePictureMutation } from '@/hooks/domain/profile-picture/profileUpload';
import { useUpdateUserMutation } from '@/hooks/domain/update-user/useUpdateUser';
import { APP_SECRETS } from '@/secrets';
import ChatStreamService from '@/services/streamingService/ChatStreamService';
import { reduxStorage, RootState } from '@/store';
import { Images, ImagesDark, useTheme } from '@/theme';
import { isImageSourcePropType, PlatformPermissions, SafeScreenNavigationProp } from '@/types';
import { heightPercentToDp } from '@/utils';
import log from '@/utils/logger';
import { PERMISSION_TYPE, Permissions, REQUEST_PERMISSION_TYPE } from '@/utils/permissionHandler';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import FastImage from '@d11/react-native-fast-image';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import {
    BottomSheetDefaultBackdropProps
} from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Stack } from '@rneui/layout';
import { Skeleton } from '@rneui/themed';
import LottieView from 'lottie-react-native';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, TextInput, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import ImagePicker from 'react-native-image-crop-picker';
import { check, Permission, request, RESULTS } from 'react-native-permissions';

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @CreateProfile
* @returns JSX.Element
**/

const CreateProfile: FC<IProps> = (props) => {
    const { t } = useTranslation(["translations"]);

    const { components, layout, gutters, borders, backgrounds, colors } = useTheme();

    const navigation = useNavigation<SafeScreenNavigationProp>();

    const [uploadProfilePicture, { isLoading: isImageUploading, data }] = useUploadProfilePictureMutation();
    const [updateUser, { isLoading: isUserUpdateLoading }] = useUpdateUserMutation();
    const [fetchUser, { isLoading: isUserFetchLoading }] = useFetchUserMutation();
    const { data: currentUser } = useFetchLatestUserQuery();
    const token = useSelector((state: RootState) => state.accessToken.authToken)

    const userNameRef = useRef<TextInput>(null);

    const [isMounted, setIsMounted] = useState<boolean>(false);
    const [userNameData, setUserNameData] = useState<{ userName: string }>({
        userName: "",
    });
    const [fcmFromStorage, setFcmFromStorage] = useState<string>("")

    const [fcmPayload, setFcmPayload] = useState<{
        token: string,
        deviceInfo: {
            model: string,
            deviceId: string
        }
    }>({
        token: "",
        deviceInfo: {
            model: "",
            deviceId: ""
        }
    })

    const handleUserNameChange = useCallback((key: 'userName', value: string) => {
        setUserNameData(prevState => ({
            ...prevState,
            [key]: value
        }));
    }, []);

    if (!isImageSourcePropType(Images.addIcon) || !isImageSourcePropType(ImagesDark.addIcon)) {
        throw new Error("Image source is not valid")
    }

    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    const snapPoints = useMemo(() => [heightPercentToDp('35'), heightPercentToDp('35')], []);

    const renderBackdrop = useCallback(
        (props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps) => (
            <BottomSheetBackdrop
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                {...props}
            />
        ),
        [],
    );

    useMount(() => {
        setIsMounted(true);
    });

    const handleOpenBottomSheet = useCallback(() => {
        if (isMounted) {
            bottomSheetModalRef.current?.present();
        } else {
            console.warn('Component not mounted yet');
        }
    }, [isMounted]);



    const onTakeWithCamera = useCallback(async () => {
        bottomSheetModalRef.current?.dismiss();

        const permission = REQUEST_PERMISSION_TYPE.camera[Platform.OS as keyof PlatformPermissions] as Permission;
        try {
            const result = await check(permission);

            if (result === RESULTS.GRANTED) {
                captureImageAndUpload();
            } else if (result === RESULTS.DENIED) {
                const requestResult = await request(permission);
                if (requestResult === RESULTS.GRANTED) {
                    captureImageAndUpload();
                } else {
                    Alert.alert(
                        t("cameraAccessDeniedTitle"),
                        t("cameraAccessDeniedMessage"),
                        [{ text: t("okay"), style: "cancel" }]
                    );
                }
            } else {
                Alert.alert(
                    t("cameraAccessDeniedTitle"),
                    t("cameraAccessDeniedMessage"),
                    [{ text: t("okay"), style: "cancel" }]
                );
            }
        } catch (err) {
            console.error("Error checking camera permission", err);
        }
    }, []);




    const onChooseFromAlbum = useCallback(async () => {
        bottomSheetModalRef.current?.dismiss();

        const permission = REQUEST_PERMISSION_TYPE.photo[Platform.OS as keyof PlatformPermissions] as Permission;
        try {
            const result = await check(permission);

            if (result === RESULTS.GRANTED) {
                pickImageAndUpload();
            } else if (result === RESULTS.DENIED) {
                const requestResult = await request(permission);
                if (requestResult === RESULTS.GRANTED) {
                    pickImageAndUpload();
                } else {
                    Alert.alert(
                        t("photoAccessDeniedTitle"),
                        t("photoAccessDeniedMessage"),
                        [{ text: t("okay"), style: "cancel" }]
                    );
                }
            } else {
                Alert.alert(
                    t("photoAccessDeniedTitle"),
                    t("photoAccessDeniedMessage"),
                    [{ text: t("okay"), style: "cancel" }]
                );
            }
        } catch (err) {
            console.error("Error checking photo permission", err);
        }
    }, []);

    const captureImageAndUpload = async () => {
        try {
            const image = await ImagePicker.openCamera({
                cropping: false,
                mediaType: 'photo',
                compressImageQuality: 1,
            });

            if (!image.path) {
                Alert.alert("Error", "Could not get image file path");
                return;
            }

            const fileUri = image.path;
            const fileName = fileUri.split('/').pop();
            const fileType = image.mime;

            const formData = new FormData();
            formData.append("file", {
                uri: fileUri,
                name: fileName || "profile_picture.jpg",
                type: fileType,
            } as any);
            formData.append("userId", currentUser?.id || "");

            console.log("Uploading Image:", formData);

            await uploadProfilePicture({ userId: currentUser?.id || "", file: formData })
                .unwrap()
                .then(response => {
                    console.log("Upload Success:", response);
                })
                .catch(error => {
                    console.error("Upload Error:", error);
                });

        } catch (err) {
            console.error("Error while taking picture:", err);
        }
    };

    const pickImageAndUpload = async () => {
        try {
            const image = await ImagePicker.openPicker({
                cropping: false,
                mediaType: 'photo',
                compressImageQuality: 1,
            });

            if (!image.path) {
                Alert.alert("Error", "Could not get image file path");
                return;
            }

            const fileUri = image.path;
            const fileName = fileUri.split('/').pop();
            const fileType = image.mime;

            const formData = new FormData();
            formData.append("file", {
                uri: fileUri,
                name: fileName || "profile_picture.jpg",
                type: fileType,
            } as any);
            formData.append("userId", currentUser?.id || "");

            console.log("Uploading Image:", formData);

            await uploadProfilePicture({ userId: currentUser?.id || "", file: formData })
                .unwrap()
        } catch (err) {
            console.error("Error while picking from gallery:", err);
        }
    };


    const selectionOptions = [
        {
            id: "1",
            label: t("takePhoto"),
            image: Images.camera,
            imageDark: ImagesDark.camera,
            action: onTakeWithCamera
        },
        {
            id: "2",
            label: t("chooseImage"),
            image: Images.gallery,
            imageDark: ImagesDark.gallery,
            action: onChooseFromAlbum
        },
        {
            id: "3",
            label: t("useAvatar"),
            image: Images.avatar,
            imageDark: ImagesDark.avatar,
            action: onChooseFromAlbum
        }
    ]

    useEffect(() => {
        const fetchDeviceInfo = async () => {
            await reduxStorage.getItem(APP_SECRETS.REGISTERED_FCM_TOKEN).then((tokenFromStorage: string) => {
                console.log("fcm token from storage =>", tokenFromStorage)
                setFcmPayload(prevState => ({
                    ...prevState,
                    token: tokenFromStorage || "fcmToken"
                }))
            }).catch((error: unknown) => {
                console.log("error while getting fcm token from storage", error)
                setFcmPayload(prevState => ({
                    ...prevState,
                    token: ""
                }))
            })
            let deviceId = await DeviceInfo.getUniqueId();
            setFcmPayload(prevState => ({
                ...prevState,
                deviceInfo: {
                    model: DeviceInfo.getModel(),
                    deviceId: deviceId
                }
            }))
        }

        fetchDeviceInfo()
    }, [])

    console.log("image data =>", data)

    const handleContinue = useCallback(async () => {
        try {
            const UpdateProfileBody = {
                "FcmToken": {
                    Model: fcmPayload?.deviceInfo?.model,
                    DeviceId: fcmPayload?.deviceInfo?.deviceId,
                    Token: fcmPayload?.token
                },
                "User": {
                    FullName: userNameData.userName,
                    ProfilePicture: data?.url || "",
                }
            }
            const RequestHeader = await generateRequestHeader();

            const updateProfilePayload = {
                RequestHeader: RequestHeader,
                Body: UpdateProfileBody,
                AccessToken: token
            }
            console.log("update profile payload =>", updateProfilePayload)
            const updatedUserResponse = await updateUser(updateProfilePayload).unwrap();
            const fetchUserResponse = await fetchUser({ userId: updatedUserResponse.Response.Id, authToken: token }).unwrap();
            console.log("updated user response =>", updatedUserResponse)
            reduxStorage.setItem(APP_SECRETS.IS_PROFILE_SETUP, "true");
            const streamService = ChatStreamService.getInstance();
            streamService.startStream();
            if (fetchUserResponse) {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{
                            name: 'Auth',
                            state: {
                                routes: [{
                                    name: "BottomTab",
                                    state: {
                                        routes: [{
                                            name: "ChatsScreen",
                                            params: {
                                                userName: userNameData.userName,
                                                profilePicture: ""
                                            }
                                        }]
                                    }
                                }]
                            }
                        }],
                    }),
                );
            }
        } catch (error) {
            log.error("Error during profile creation:", error);
            Alert.alert("Error", "An error occurred while creating the profile. Please try again.");
        } finally {
        }
    }, [navigation, userNameData.userName, fcmFromStorage, data, token]);

    console.log("is image uploading =>", isImageUploading)

    return (
        <>
            <SafeScreen>
                <View style={[gutters.padding_14, layout.justifyBetween, layout.flex_1]}>
                    <View>
                        <TextVariant style={[layout.width80, components.urbanist30BoldBlack, components.textLeft]}>
                            {t("createYarshaProfile")}
                        </TextVariant>
                        <TextVariant style={[layout.width80, components.urbanist16RegularBlack, components.textLeft, gutters.marginTop_12]}>
                            {t("createProfileDescription")}
                        </TextVariant>

                        <View style={[gutters.marginTop_10]}>
                            <TextVariant style={[components.urbanist14MediumBlack, gutters.marginVertical_14]}>{t("userName")}</TextVariant>
                            <TextInput
                                ref={userNameRef}
                                returnKeyLabel='Done'
                                returnKeyType='done'
                                autoCapitalize='none'
                                keyboardAppearance='light'
                                value={userNameData.userName}
                                onChangeText={(value) => handleUserNameChange('userName', value)}
                                style={[components.urbanist14RegularBlack, borders.w_1, borders.tertiary, borders.rounded_8, gutters.padding_14]}
                                placeholderTextColor={colors.textInputPlaceholder}
                                placeholder={t("userNamePlaceholder")}
                                onSubmitEditing={() => {
                                    userNameRef.current?.blur();
                                }}
                            />


                            {(!isImageUploading && !data) && <ButtonVariant onPress={handleOpenBottomSheet} disabled={isImageUploading} style={[borders.w_1, borders.primary, layout.borderDashed, layout.itemsCenter, layout.justifyCenter, gutters.padding_60, gutters.marginTop_16]}>
                                <ImageVariant
                                    source={Images.addIcon}
                                    sourceDark={ImagesDark.addIcon}
                                    style={[layout.height120, layout.width115]}
                                />
                            </ButtonVariant>}

                            {(isImageUploading) && <View style={[borders.w_1, borders.primary, layout.itemsSelfCenter, borders.rounded_125, layout.itemsCenter, layout.justifyCenter, gutters.padding_60, gutters.marginTop_16, layout.width250, layout.height250, gutters.padding_48]}>
                                <Stack>
                                    <Skeleton circle width={152} height={152} />
                                </Stack>
                            </View>}

                            {(!isImageUploading && data) && <View style={[borders.w_1, borders.primary, layout.itemsSelfCenter, borders.rounded_125, layout.itemsCenter, layout.justifyCenter, gutters.padding_60, gutters.marginTop_16, layout.width250, layout.height250, gutters.padding_48]}>
                                <FastImage
                                    source={{ uri: data.url }}
                                    style={[
                                        layout.fullHeight,
                                        layout.fullWidth,
                                        layout.height152,
                                        layout.width152,
                                        borders.rounded_76,
                                        layout.itemsSelfCenter
                                    ]}
                                />
                                <ButtonVariant style={[layout.absolute, layout.bottom0, layout.right20, layout.bottom20]} onPress={() => {
                                    handleOpenBottomSheet()
                                }}>
                                    <ImageVariant
                                        source={Images.edit}
                                        sourceDark={ImagesDark.edit}
                                        style={[components.iconSize32, borders.rounded_16]}
                                    />
                                </ButtonVariant>
                            </View>}
                        </View>
                    </View>

                    <ButtonVariant
                        disabled={isUserUpdateLoading || isImageUploading || !userNameData.userName || isUserFetchLoading}
                        style={[(!userNameData.userName || isImageUploading || isUserUpdateLoading || isUserFetchLoading) ? components.disabledButton : components.blueBackgroundButton, layout.itemsCenter, gutters.padding_14, gutters.marginBottom_8]}
                        onPress={handleContinue}
                    >
                        {(isUserUpdateLoading || isImageUploading || isUserFetchLoading) ? <LottieView
                            source={require('@/theme/assets/lottie/loading.json')}
                            style={{ height: 20, width: 20 }}
                            autoPlay
                            loop
                        /> : <TextVariant style={[components.urbanist16SemiBoldWhite]}>{t("continue")}</TextVariant>}
                    </ButtonVariant>
                </View>
            </SafeScreen>

            <BottomSheetModal
                ref={bottomSheetModalRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose={true}
                backgroundStyle={[
                    backgrounds.white,
                    borders.roundedTop_20
                ]}
                handleIndicatorStyle={[layout.width40, backgrounds.cream]}
            >
                <BottomSheetView style={[layout.itemsSelfCenter, layout.fullWidth, gutters.paddingHorizontal_14]}>

                    <TextVariant
                        style={[components.urbanist20BoldBlack, gutters.marginBottom_20]}>{t("selectPhoto")}</TextVariant>

                    {selectionOptions.map((button, index) => (
                        <ButtonVariant key={button.id + index.toString()} style={[layout.row, layout.itemsCenter, components.blueBorderButton, gutters.padding_14, gutters.marginVertical_5]} onPress={button.action}>
                            <ImageVariant
                                source={button.image}
                                sourceDark={button.imageDark}
                                style={[components.iconSize24, gutters.marginRight_10]}
                            />
                            <TextVariant style={[components.urbanist14MediumBlack]}>{button.label}</TextVariant>
                        </ButtonVariant>
                    ))}
                    <View style={[layout.height30]} />
                </BottomSheetView>
            </BottomSheetModal>
        </>
    )
}


export default React.memo(CreateProfile)