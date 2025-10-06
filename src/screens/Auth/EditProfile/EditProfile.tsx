import React, { FC, JSX, useCallback, useMemo, useRef, useState } from 'react'
import { ButtonVariant, ImageVariant, InputVariant, TextVariant } from '@/components/atoms'
import { SafeScreen } from '@/components/template'
import { Images, ImagesDark, useTheme } from '@/theme'
import { isImageSourcePropType, PlatformPermissions, SafeScreenNavigationProp } from '@/types'
import FastImage from '@d11/react-native-fast-image'
import * as RNFS from '@dr.pogodin/react-native-fs'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import { PERMISSION_TYPE, Permissions, REQUEST_PERMISSION_TYPE } from '@/utils/permissionHandler'
import { Permission } from 'react-native-permissions'
import log from '@/utils/logger'
import { getInitials, heightPercentToDp } from '@/utils'
import { useDispatch, useSelector } from '@/hooks'
import { Stack } from '@rneui/layout'
import { Skeleton } from '@rneui/themed'
import LottieView from 'lottie-react-native'
import { useTranslation } from 'react-i18next'
import { Alert, Keyboard, Platform, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import ImagePicker from 'react-native-image-crop-picker'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { generateRequestHeader } from '@/utils/requestHeaderGenerator'
import { RootState } from '@/store'
import { useUpdateUserMutation } from '@/hooks/domain/update-user/useUpdateUser'
import { useFetchUserMutation } from '@/hooks/domain/fetch-user/useFetchUser'
import { useUploadProfilePictureMutation } from '@/hooks/domain/profile-picture/profileUpload'
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser'
import { useNavigation } from '@react-navigation/native'
import { Snackbar } from 'react-native-paper'

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @EditProfile
* @returns JSX.Element
**/

const EditProfile: FC<IProps> = (props): React.JSX.Element => {

    const { t } = useTranslation(["translations"])

    const navigation = useNavigation<SafeScreenNavigationProp>()

    const { gutters, layout, borders, components, backgrounds } = useTheme()

    const profilePicture = ""
    const fsProfilePicture = ""
    const profilePicAndThumbnail = ""

    const userInfo = {}
    const updatedUserInfo = {}

    const [profileThumbnail, setProfileThumbnail] = useState<string | null | undefined>("")

    // const [isImageUploading, setIsImageUploading] = useState<boolean>(false)
    const [isProfileUpdating, setIsProfileUpdating] = useState<boolean>(false);
   
    const [profileSnackBar, setProfileSnackBar] = useState<boolean>(false);
    const { data: currentUser } = useFetchLatestUserQuery();
    const [uploadProfilePicture, { isLoading: isImageUploading, data }] = useUploadProfilePictureMutation();
    const [updateUser, { isLoading: isUserUpdateLoading }] = useUpdateUserMutation();

    const [updateInfo, setUpdateInfo] = useState<{
        fullName: string,
        username: string,
        userBio: string,
        profilePicture: string,
        profileThumbnail: string
    }>({
        fullName: "",
        username: "",
        userBio: "Blockchain Enthusiast",
        profilePicture: data?.url as string,
        profileThumbnail: profileThumbnail as string,
    });
    const onToggleSnackBar = () => setProfileSnackBar(!profileSnackBar);

    const onDismissSnackBar = () => setProfileSnackBar(false);

    const fullNameRef = useRef<TextInput>(null);
    const userNameRef = useRef<TextInput>(null);
    const bioRef = useRef<TextInput>(null);

    const token = useSelector((state: RootState) => state.accessToken.authToken)

    if (!isImageSourcePropType(Images.edit2) || !isImageSourcePropType(ImagesDark.edit2)) {
        throw new Error("Image source is not valid!")
    }

    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    const snapPoints = useMemo(() => [heightPercentToDp('35'), heightPercentToDp('35')], []);


    const buttonElevationStyle = Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2,
        },
        android: {
            elevation: 3,
        },
    })

    const saveImageLocally = async (imageUrl: string): Promise<string> => {
        try {
            const fileName = imageUrl.split('/').pop();
            const directoryPath = `${RNFS.DocumentDirectoryPath}/hidden_images`;
            const filePath = `${directoryPath}/${fileName}`;

            if (!(await RNFS.exists(directoryPath))) {
                await RNFS.mkdir(directoryPath);
            }

            const noMediaFilePath = `${directoryPath}/.nomedia`;
            if (!(await RNFS.exists(noMediaFilePath))) {
                await RNFS.writeFile(noMediaFilePath, '');
            }

            const downloadResult = await RNFS.downloadFile({
                fromUrl: imageUrl,
                toFile: filePath,
            }).promise;

            if (downloadResult.statusCode === 200) {
                return filePath;
            } else {
                console.error('Failed to download image:', downloadResult);
                throw new Error(`Failed to download image. Status code: ${downloadResult.statusCode}`);
            }
        } catch (error) {
            console.error('Error saving image locally:', error);
            Alert.alert('Error', 'An error occurred while saving the image locally.');
            throw error;
        }
    };

    const captureImageAndUpload = async () => {
        try {
            console.log("captureImageAndUpload")
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
            console.log("uploading ProfilePicture")
            console.log("currentUser?.id", currentUser?.id)
            console.log("formData", formData)
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

            await uploadProfilePicture({ userId: currentUser?.id || "", file: formData })
                .unwrap()
        } catch (err) {
            console.error("Error while picking from gallery:", err);
        }
    };

    const onTakeWithCamera = useCallback(() => {
        bottomSheetModalRef.current?.dismiss();

        const cameraPermission = REQUEST_PERMISSION_TYPE.camera[
            Platform.OS as keyof PlatformPermissions
        ] as Permission;

        Permissions.checkPermission(PERMISSION_TYPE.camera)
            .then(response => {
                if (!response) {
                    Permissions.requestPermission(cameraPermission)
                        .then(resp => {
                            if (resp) {
                                captureImageAndUpload();
                            } else {
                                Alert.alert(
                                    'Permission Denied',
                                    'Please allow the permission in your device settings to use this feature.',
                                    [
                                        { text: 'Okay', style: 'cancel' }
                                    ],
                                );
                            }
                        })
                        .catch(err => console.log('Error while requesting permission', err));
                } else {
                    captureImageAndUpload();
                }
            })
            .catch(err => log.error('Error while checking permission', err));
    }, []);

    const onChooseFromAlbum = useCallback(() => {
        bottomSheetModalRef.current?.dismiss();

        const photoLibraryPermission = REQUEST_PERMISSION_TYPE.photo[
            Platform.OS as keyof PlatformPermissions
        ] as Permission;

        Permissions.checkPermission(PERMISSION_TYPE.photo)
            .then(res => {
                if (!res) {
                    Permissions.requestPermission(photoLibraryPermission)
                        .then(res => {
                            if (res) {
                                pickImageAndUpload();
                            } else {
                                Alert.alert(
                                    'Permission Denied',
                                    'Please allow the permission in your device settings to use this feature.',
                                    [
                                        { text: 'Okay', style: 'cancel' }
                                    ],
                                );
                            }
                        })
                        .catch(err => console.log('Error while requesting permission', err));
                } else {
                    pickImageAndUpload();
                }
            })
            .catch(err => log.error('Error while checking permission', err));
    }, []);


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

    const openCamera = () => {
        ImagePicker.openCamera({
            cropping: true,
            mediaType: 'photo',
            compressImageQuality: 1,
            includeBase64: true,
            forceJpg: true,
        })
            .then(async image => {
                const imageRequestPayload = {
                    fileData: image.data,
                    contentType: image.mime,
                };
            })
            .catch(err => {
                log.error('Camera error', err);
            });
    };

    const openPicker = () => {
        ImagePicker.openPicker({
            cropping: true,
            mediaType: 'photo',
            compressImageQuality: 1,
            includeBase64: true,
            forceJpg: true,
        })
            .then(async image => {
                const imageRequestPayload = {
                    fileData: image.data,
                    contentType: image.mime,
                };
            })
            .catch(err => {
                log.error('Gallery error', err);
            });
    };

    const showPermissionDeniedAlert = (title: string, message: string) => {
        Alert.alert(title, message, [
            { text: t("okay"), style: "cancel" }
        ]);
    };


    const handleUpdate = useCallback(async () => {
        setIsProfileUpdating(true);
        try {
            setIsProfileUpdating(true);
            const UpdateProfileBody = {
                "User": {
                    FullName: updateInfo.fullName,
                    Username: updateInfo.username,
                    UserBio: updateInfo.userBio,
                    ...(data?.url && { ProfilePicture: data.url }),
                },
            }
            const RequestHeader = await generateRequestHeader();

            const updateProfilePayload = {
                RequestHeader: RequestHeader,
                Body: UpdateProfileBody,
                AccessToken: token
            }
            const updatedUserResponse = await updateUser(updateProfilePayload).unwrap();
            if(updatedUserResponse["ResponseHeader"]["Status"]=="0"){
                navigation.goBack();
            }
        }
        catch (error) {
            log.error("Error while updating the profile", error)
            Alert.alert("Error while updating the profile", "Please try again")
        }
        finally {
            setIsProfileUpdating(false)
        }
    }, [updateInfo, userInfo, updatedUserInfo, profilePicture, fsProfilePicture, profilePicAndThumbnail, data, profileThumbnail])

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

    const handleOpenBottomSheet = useCallback(() => {
        bottomSheetModalRef.current?.present();
    }, []);

    const scrollRef = useRef<KeyboardAwareScrollView>(null);

    const scrollToInput = (reactNode: any) => {
        if (reactNode) {
            scrollRef.current?.scrollToFocusedInput(reactNode);
        }
    }

    console.log("data?.url", data?.url)
    return (
        <>
            <KeyboardAwareScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" enableOnAndroid={true}
                keyboardOpeningTime={Number.MAX_SAFE_INTEGER} showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'space-between',
                    backgroundColor: '#FFFFFF'
                }}
                scrollEventThrottle={16}
            >
                <SafeScreen>
                    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                        <View style={[layout.flex_1, gutters.padding_14, layout.justifyBetween]}>
                            <View style={[components.imageSize90, layout.itemsSelfCenter]}>

                                {(isImageUploading && data) ?
                                    <Stack>
                                        <Skeleton circle width={90} height={90} />
                                    </Stack> :
                                    <View>
                                        <FastImage source={{ uri: data?.url as string }} style={[layout.fullHeight, layout.fullWidth, borders.rounded_500]} resizeMode='cover' />
                                        <ButtonVariant disabled={isProfileUpdating} onPress={handleOpenBottomSheet} style={[layout.absolute, layout.bottom0, layout.right0, components.iconSize35, borders.rounded_500, backgrounds.white, layout.itemsCenter, layout.justifyCenter, layout.z1, buttonElevationStyle]}>
                                            <ImageVariant
                                                source={Images.edit2}
                                                sourceDark={ImagesDark.edit2}
                                                style={[components.iconSize24]}
                                            />
                                        </ButtonVariant>
                                    </View>
                                }
                                {!isImageUploading && !data && <View style={[layout.absolute, layout.bottom0, layout.right0]}>
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
                                            {getInitials("" as string)}
                                        </TextVariant>
                                    </View>
                                    <ButtonVariant disabled={isProfileUpdating} onPress={handleOpenBottomSheet} style={[layout.absolute, layout.bottom0, layout.right0, components.iconSize35, borders.rounded_500, backgrounds.white, layout.itemsCenter, layout.justifyCenter, layout.z1, buttonElevationStyle]}>
                                        <ImageVariant
                                            source={Images.edit2}
                                            sourceDark={ImagesDark.edit2}
                                            style={[components.iconSize24]}
                                        />
                                    </ButtonVariant>
                                </View>}
                            </View>

                            <View style={[layout.flex_1, gutters.marginTop_14]}>
                                <View style={[gutters.marginVertical_10]}>
                                    <TextVariant style={[components.urbanist14RegularBlack, gutters.marginBottom_10]}>{t("fullName")}</TextVariant>
                                    <InputVariant
                                        ref={fullNameRef}
                                        returnKeyType="next"
                                        onSubmitEditing={() => userNameRef.current?.focus()}
                                        returnKeyLabel='Next'
                                        value={updateInfo.fullName}
                                        onChangeText={(value) => setUpdateInfo({ ...updateInfo, fullName: value })}
                                    />
                                </View>
                                <View style={[gutters.marginVertical_10]}>
                                    <TextVariant style={[components.urbanist14RegularBlack, gutters.marginBottom_10]}>{t("userName")}</TextVariant>
                                    <InputVariant
                                        ref={userNameRef}
                                        returnKeyType="next"
                                        onSubmitEditing={() => bioRef.current?.focus()}
                                        returnKeyLabel='Next'
                                        value={updateInfo.username}
                                        onChangeText={(value) => setUpdateInfo({ ...updateInfo, username: value })}
                                    />
                                </View>

                                <View style={[gutters.marginVertical_10]}>
                                    <TextVariant style={[components.urbanist14RegularBlack, gutters.marginBottom_10]}>{t("bio")}</TextVariant>
                                    <InputVariant
                                        ref={bioRef}
                                        returnKeyType="done"
                                        onSubmitEditing={handleUpdate}
                                        returnKeyLabel='Done'
                                        value={updateInfo.userBio}
                                        onChangeText={(value) => setUpdateInfo({ ...updateInfo, userBio: value })}
                                    />
                                </View>
                            </View>

                            <ButtonVariant
                                disabled={isUserUpdateLoading || isImageUploading}
                                style={[(isImageUploading || isUserUpdateLoading) ? components.disabledButton : components.blueBackgroundButton, gutters.padding_14, layout.itemsCenter,]} onPress={handleUpdate}>
                                {(isUserUpdateLoading || isImageUploading) ? <LottieView
                                    source={require('@/theme/assets/lottie/loading.json')}
                                    style={{ height: 20, width: 20 }}
                                    autoPlay
                                    loop
                                /> :
                                    <TextVariant style={[components.textCenter, components.urbanist16SemiBoldWhite]}>{t("update")}</TextVariant>
                                }
                            </ButtonVariant>
                        </View>
                    </TouchableWithoutFeedback>
                    <Snackbar
                        visible={profileSnackBar}
                        onDismiss={onDismissSnackBar}
                        duration={1000}
                        style={[components.blueBackgroundButton]}>
                        <TextVariant style={[components.urbanist16SemiBoldWhite]}>
                            {t('userUpdated')}
                        </TextVariant>
                    </Snackbar>
                </SafeScreen>
            </KeyboardAwareScrollView>
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

export default React.memo(EditProfile)

