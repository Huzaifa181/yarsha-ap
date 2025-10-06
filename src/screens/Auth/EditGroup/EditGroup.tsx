import { ButtonVariant, ImageVariant, InputVariant, TextVariant } from '@/components/atoms'
import { SafeScreen } from '@/components/template'
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser'
import { useFetchGroupChatDetailQuery } from '@/hooks/domain/fetch-chat-details/useFetchChatDetails'
import { useFetchChatDetailsMutation, useUpdateChatMutation } from '@/hooks/domain/fetch-chats/useFetchChats'
import { useUploadProfilePictureMutation } from '@/hooks/domain/profile-picture/profileUpload'
import { store } from '@/store'
import { Images, ImagesDark, useTheme } from '@/theme'
import { isImageSourcePropType, PlatformPermissions, SafeScreenNavigationProp, SafeScreenRouteProp } from '@/types'
import { getInitials, heightPercentToDp } from '@/utils'
import log from '@/utils/logger'
import { PERMISSION_TYPE, Permissions, REQUEST_PERMISSION_TYPE } from '@/utils/permissionHandler'
import { generateRequestHeader } from '@/utils/requestHeaderGenerator'
import FastImage from '@d11/react-native-fast-image'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Stack } from '@rneui/layout'
import { Skeleton } from '@rneui/themed'
import LottieView from 'lottie-react-native'
import React, { FC, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, KeyboardAvoidingView, Linking, Platform, View } from 'react-native'
import ImagePicker from 'react-native-image-crop-picker'
import LinearGradient from 'react-native-linear-gradient'
import { Snackbar } from 'react-native-paper'
import { check, Permission, request, RESULTS } from 'react-native-permissions'

interface IProps { }

/**
* @author Nitesh Raj Khanal 
* @function @EditGroup
**/

const EditGroup: FC<IProps> = (props) => {
    const { t } = useTranslation(["translations"])

    const [uploadProfilePicture, { isLoading: isImageUploading, error, data }] = useUploadProfilePictureMutation();

    const navigation = useNavigation<SafeScreenNavigationProp>();

    const { layout, gutters, components, borders, backgrounds } = useTheme()

    const route = useRoute<SafeScreenRouteProp & { params: { groupId: string, groupName: string } }>();
    const { groupId, groupName } = route.params;

    const { data: groupChatDetails, refetch } = useFetchGroupChatDetailQuery({ ChatId: groupId }, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
    })

    const { data: currentUser } = useFetchLatestUserQuery()

    const [updateChat, { isLoading: isGroupUpdating }] = useUpdateChatMutation();

    const token = store.getState().accessToken.authToken;

    const [fetchChatDetails, { isLoading: isFetchingChatDetails }] = useFetchChatDetailsMutation()


    const isAdmin = useMemo(() => {
        if (!groupChatDetails || !currentUser) return false;

        return groupChatDetails.participants.some(
            participant =>
                ['admin', 'creator'].includes(participant.role) &&
                participant.id === currentUser.id
        );
    }, [groupChatDetails, currentUser]);


    console.log("Is Admin", isAdmin);

    const normalizeWhitespace = (text: string): string => {
        return text.trim().replace(/\s+/g, ' ');
    };

    const [updateInfo, setUpdateInfo] = useState<{
        name: string,
        description: string,
    }>({
        name: groupChatDetails?.groupName ? groupChatDetails.groupName : "",
        description: groupChatDetails?.groupDescription ? normalizeWhitespace(groupChatDetails.groupDescription) : "Web3 Superfriends: United by the Chain, Building the Future Together",
    });
    const [snackBarVisible, setSnackBarVisible] = useState<boolean>(false);

    const onToggleSnackBar = () => setSnackBarVisible(!snackBarVisible);

    const onDismissSnackBar = () => setSnackBarVisible(false);

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
                                    t('cameraAccessDeniedTitle'),
                                    t('cameraAccessDeniedMessage'),
                                    [
                                        { text: t('okay'), style: 'cancel' }
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


    const onChooseFromAlbum = useCallback(async () => {
        bottomSheetModalRef.current?.dismiss();

        const permission = REQUEST_PERMISSION_TYPE.photo[
            Platform.OS as keyof PlatformPermissions
        ] as Permission;

        const result = await check(permission);

        if (result === RESULTS.GRANTED) {
            pickImageAndUpload();
        } else if (result === RESULTS.DENIED) {
            const reqResult = await request(permission);
            if (reqResult === RESULTS.GRANTED) {
                pickImageAndUpload();
            } else {
                Alert.alert(
                    t("photoAccessDeniedTitle"),
                    t("photoAccessDeniedMessage"),
                    [{ text: t("okay"), style: "cancel" }]
                );
            }
        } else if (result === RESULTS.BLOCKED || result === RESULTS.UNAVAILABLE) {
            Alert.alert(
                t("photoAccessDeniedTitle"),
                t("photoAccessBlockedMessage"),
                [{ text: t("okay"), style: "cancel" }]
            );
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

            const response = await uploadProfilePicture({ userId: currentUser?.id || "", file: formData })
                .unwrap();
            console.log("Upload Success:", response);
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

    const handleUpdate = useCallback(async () => {
        try {
            if (updateInfo.name === "" || updateInfo.description === "") {
                Alert.alert("Error", "Please fill all the fields");
                return;
            }

            const normalizedDescription = normalizeWhitespace(updateInfo.description);

            const payload: {
                groupName: string;
                groupDescription: string;
                groupIcon: string;
                chatId: string;
            } = {
                chatId: groupId,
                groupName: updateInfo.name.trim(),
                groupDescription: normalizedDescription,
                groupIcon: data?.url || groupChatDetails?.groupIcon || "",
            };

            console.log("Update Payload:", payload);

            await updateChat(payload).unwrap()
                .then(async (response) => {
                    console.log("Update Success:", response);
                    onToggleSnackBar();
                    const RequestPayload = {
                        RequestHeader: await generateRequestHeader(),
                        AccessToken: token,
                        ChatId: groupId,
                    }
                    await fetchChatDetails(RequestPayload).unwrap();
                    await refetch();
                    setTimeout(() => {
                        navigation.goBack();
                    }, 1000);
                })
                .catch((error) => {
                    console.error("Update Error:", error);
                    Alert.alert("Error", "Could not update group chat");
                });
        }
        catch (error) {
            Alert.alert("Error while updating group chat", "Please try again later.");
        }
    }, [updateInfo, data])

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


    let adminsCount = 0;
    let membersCount = 0;

    if (groupChatDetails) {
        adminsCount = groupChatDetails.participants.filter((participant) => participant.role === 'creator' || participant.role === 'admin').length;
        membersCount = groupChatDetails.participants.filter((participant) => participant.role === "member").length;
    }

    const handleActionsPress = useCallback(async (actionType: "creator" | "member" | "invite" | "leave") => {
        if (actionType === "creator") {
            navigation.navigate("MembersScreen", { screenName: "Administrators", groupId: groupId })
        } else if (actionType === "member") {
            navigation.navigate("MembersScreen", { screenName: "Members", groupId: groupId })
        } else if (actionType === "invite") {

        } else if (actionType === "leave") {
        }
    }, [])

    return (
        <>
            <SafeScreen>
                <KeyboardAvoidingView
                    style={[layout.flex_1]}
                    {...(Platform.OS === 'ios' && { behavior: 'padding' })}
                >
                    <View style={[gutters.padding_14, layout.justifyBetween, layout.flex_1]}>
                        <View style={[components.imageSize90, layout.itemsSelfCenter]}>
                            {
                                (groupChatDetails?.groupIcon && !isImageUploading) ? (
                                    <View style={[components.imageSize90]}>
                                        <FastImage
                                            source={{ uri: groupChatDetails?.groupIcon }}
                                            style={[layout.fullHeight, layout.fullWidth, borders.rounded_500]}
                                            resizeMode="cover"
                                        />
                                        {!isImageUploading && (
                                            <View style={[layout.absolute, layout.bottom0, layout.right0]}>
                                                <ButtonVariant
                                                    onPress={handleOpenBottomSheet}
                                                    style={[components.iconSize35, borders.rounded_500, backgrounds.white, layout.itemsCenter, layout.justifyCenter, layout.z1, buttonElevationStyle]}>
                                                    <ImageVariant
                                                        source={Images.edit2}
                                                        sourceDark={ImagesDark.edit2}
                                                        style={[components.iconSize24]}
                                                    />
                                                </ButtonVariant>
                                            </View>
                                        )}
                                    </View>
                                ) : (data?.url && data.url !== "" && !isImageUploading) ? (
                                    <View style={[components.imageSize90]}>
                                        <FastImage
                                            source={{ uri: data.url }}
                                            style={[layout.fullHeight, layout.fullWidth, borders.rounded_500]}
                                            resizeMode="cover"
                                        />
                                        {!isImageUploading && (
                                            <View style={[layout.absolute, layout.bottom0, layout.right0]}>
                                                <ButtonVariant
                                                    onPress={handleOpenBottomSheet}
                                                    style={[components.iconSize35, borders.rounded_500, backgrounds.white, layout.itemsCenter, layout.justifyCenter, layout.z1, buttonElevationStyle]}>
                                                    <ImageVariant
                                                        source={Images.edit2}
                                                        sourceDark={ImagesDark.edit2}
                                                        style={[components.iconSize24]}
                                                    />
                                                </ButtonVariant>
                                            </View>
                                        )}
                                    </View>
                                ) : isImageUploading ? (
                                    <Stack>
                                        <Skeleton
                                            LinearGradientComponent={LinearGradient}
                                            animation="wave"
                                            height={90}
                                            width={90}
                                            style={[layout.itemsSelfCenter]}
                                            circle={true}
                                        />
                                    </Stack>
                                ) : (
                                    <View style={[components.imageSize90, borders.rounded_500, { backgroundColor: groupChatDetails?.backgroundColor }, layout.itemsCenter, layout.justifyCenter]}>
                                        <TextVariant style={[components.urbanist40RegularWhite, components.textCenter]}>
                                            {getInitials(groupName as string)}
                                        </TextVariant>
                                        {!isImageUploading && (
                                            <View style={[layout.absolute, layout.bottom0, layout.right0]}>
                                                <ButtonVariant
                                                    onPress={handleOpenBottomSheet}
                                                    style={[components.iconSize35, borders.rounded_500, backgrounds.white, layout.itemsCenter, layout.justifyCenter, layout.z1, buttonElevationStyle]}>
                                                    <ImageVariant
                                                        source={Images.edit2}
                                                        sourceDark={ImagesDark.edit2}
                                                        style={[components.iconSize24]}
                                                    />
                                                </ButtonVariant>
                                            </View>
                                        )}
                                    </View>
                                )
                            }
                        </View>

                        <View style={[layout.flex_1, gutters.marginTop_14]}>
                            <View style={[gutters.marginVertical_10]}>
                                <TextVariant style={[components.urbanist14RegularBlack, gutters.marginBottom_10]}>{t("groupName")}</TextVariant>
                                <InputVariant
                                    value={updateInfo.name}
                                    onChangeText={(value) => setUpdateInfo({ ...updateInfo, name: value })}
                                />
                            </View>

                            <View style={[gutters.marginVertical_10, layout.maxHeight150]}>
                                <TextVariant style={[components.urbanist14RegularBlack, gutters.marginBottom_10]}>{t("groupDescriptionInfo")}</TextVariant>
                                <InputVariant
                                    value={updateInfo.description}
                                    onChangeText={(value) => setUpdateInfo({
                                        ...updateInfo,
                                        description: value
                                    })}
                                    onBlur={() => {
                                        // Normalize whitespace when user finishes editing
                                        setUpdateInfo({
                                            ...updateInfo,
                                            description: normalizeWhitespace(updateInfo.description)
                                        });
                                    }}
                                    multiline={true}
                                    numberOfLines={3}
                                    style={[layout.maxHeight150]}
                                />
                            </View>

                            <View style={[gutters.marginTop_10]}>
                                <ButtonVariant onPress={() => { handleActionsPress("creator") }} style={[gutters.marginVertical_14, layout.row, layout.justifyBetween, layout.itemsCenter]}>
                                    <TextVariant style={[components.urbanist16RegularDark]}>{t("administrators")}</TextVariant>
                                    <TextVariant style={[components.urbanist16RegularPrimary]}>{adminsCount}</TextVariant>
                                </ButtonVariant>

                                <ButtonVariant onPress={() => { handleActionsPress("member") }} style={[gutters.marginVertical_14, layout.row, layout.justifyBetween, layout.itemsCenter]}>
                                    <TextVariant style={[components.urbanist16RegularDark]}>{t("members")}</TextVariant>
                                    <TextVariant style={[components.urbanist16RegularPrimary]}>{membersCount}</TextVariant>
                                </ButtonVariant>

                                <ButtonVariant onPress={() => { handleActionsPress("invite") }} style={[gutters.marginVertical_14, layout.row, layout.justifyBetween, layout.itemsCenter]}>
                                    <TextVariant style={[components.urbanist16RegularDark]}>{t("invite")}</TextVariant>
                                </ButtonVariant>

                                <ButtonVariant onPress={() => { handleActionsPress("leave") }} style={[gutters.marginVertical_14, layout.row, layout.justifyBetween, layout.itemsCenter]}>
                                    <TextVariant style={[components.urbanist16RegularRed]}>{t("deleteAndLeave")}</TextVariant>
                                </ButtonVariant>
                            </View>
                        </View>

                        {isAdmin &&
                            <ButtonVariant
                                disabled={isGroupUpdating || isImageUploading || isFetchingChatDetails}
                                style={[(isImageUploading || isGroupUpdating || isFetchingChatDetails) ? components.disabledButton : components.blueBackgroundButton, gutters.padding_14, layout.itemsCenter]} onPress={handleUpdate}>
                                {(isGroupUpdating || isImageUploading || isFetchingChatDetails) ? <LottieView
                                    source={require('@/theme/assets/lottie/loading.json')}
                                    style={{ height: 20, width: 20 }}
                                    autoPlay
                                    loop
                                /> :
                                    <TextVariant style={[components.textCenter, components.urbanist16SemiBoldWhite]}>{t("update")}</TextVariant>
                                }
                            </ButtonVariant>
                        }
                    </View>
                </KeyboardAvoidingView>
                <Snackbar
                    visible={snackBarVisible}
                    onDismiss={onDismissSnackBar}
                    duration={1000}
                    style={[components.blueBackgroundButton]}
                >
                    <TextVariant style={[components.urbanist16SemiBoldWhite]}>{t("groupUpdateSuccessful")}</TextVariant>
                </Snackbar>
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

export default React.memo(EditGroup)