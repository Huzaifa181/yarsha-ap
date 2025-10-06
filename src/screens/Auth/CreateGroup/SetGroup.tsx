import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms'
import { SafeScreen } from '@/components/template'
import { useRecentPicksPersistence } from '@/components/template/EmojiKeyboard/src'
import { EmojiKeyboard } from '@/components/template/EmojiKeyboard/src/EmojiKeyboard'
import { useMount, useSelector } from '@/hooks'
import { TRequestBody } from '@/hooks/domain/create-groupchat/schema'
import { useCreateGroupChatMutation } from '@/hooks/domain/create-groupchat/useCreateGroupChat'
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser'
import { useFetchChatDetailsMutation } from '@/hooks/domain/fetch-chats/useFetchChats'
import { useUploadProfilePictureMutation } from '@/hooks/domain/profile-picture/profileUpload'
import ChatStreamService from '@/services/streamingService/ChatStreamService'
import { RootState } from '@/store'
import { Images, ImagesDark, useTheme } from '@/theme'
import { isImageSourcePropType, PlatformPermissions, SafeScreenNavigationProp } from '@/types'
import { getInitials, heightPercentToDp } from '@/utils'
import { REQUEST_PERMISSION_TYPE } from '@/utils/permissionHandler'
import { generateRequestHeader } from '@/utils/requestHeaderGenerator'
import FastImage from '@d11/react-native-fast-image'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { Stack } from '@rneui/layout'
import { Skeleton } from '@rneui/themed'
import LottieView from 'lottie-react-native'
import React, { FC, JSX, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, FlatList, Keyboard, Platform, TextInput, View } from 'react-native'
import ImagePicker from 'react-native-image-crop-picker'
import { check, Permission, request, RESULTS } from 'react-native-permissions'

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @SetGroup
* @returns JSX.Element
**/

interface User {
    id?: string;
    profilePicture?: string;
    status?: string;
    username?: string;
    fullName?: string;
    lastActive?: string;
    backgroundColor?: string;
}

const SetGroup: FC<IProps> = (props): JSX.Element => {
    const { t } = useTranslation(["translations"]);

    const { gutters, layout, components, borders, backgrounds, colors } = useTheme();

    const navigation = useNavigation<SafeScreenNavigationProp>()

    const [createGroupChat, { isLoading, isError }] = useCreateGroupChatMutation();
    const [fetchChatDetails] = useFetchChatDetailsMutation()
    const { data: currentUser } = useFetchLatestUserQuery();
    const [uploadProfilePicture, { isLoading: isImageUploading, error, data }] = useUploadProfilePictureMutation();

    const selectedUsers = useSelector((state: RootState) => state.selectedUsers.selectedUsers);
    const token = useSelector((state: RootState) => state.accessToken.authToken)

    const [groupName, setGroupName] = useState<string>("")
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState<boolean>(false);


    useRecentPicksPersistence({
        initialization: () => AsyncStorage.getItem("recent").then((item) => JSON.parse(item || '[]')),
        onStateChange: (next) => AsyncStorage.setItem("recent", JSON.stringify(next)),
    })

    const filteredDataOfCurrentUser = {
        id: currentUser?.id,
        username: currentUser?.username,
        fullName: currentUser?.fullName,
        profilePicture: currentUser?.profilePicture,
        status: currentUser?.status,
        lastActive: currentUser?.lastActive,
        backgroundColor: currentUser?.backgroundColor
    }

    const allUsers = [filteredDataOfCurrentUser, ...selectedUsers].filter(user => user !== null);

    if (!isImageSourcePropType(Images.edit2) || !isImageSourcePropType(ImagesDark.edit2) || !isImageSourcePropType(Images.emoji) || !isImageSourcePropType(ImagesDark.emoji)) {
        throw new Error("Image source is not valid!")
    }

    const toggleEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
        if (!showEmojiPicker) {
            Keyboard.dismiss();
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setGroupName((prev) => prev + emoji);
        setShowEmojiPicker(false);
    };

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

    const handleContinue = useCallback(async () => {
        try {
            const userIDOfSelectedUsers = selectedUsers.map((user) => user.id);
            console.log("userIDOfSelectedUsers", userIDOfSelectedUsers)


            const createGroupBody: TRequestBody = {
                GroupName: groupName,
                ParticipantsId: userIDOfSelectedUsers,
                GroupIcon: data?.url || "",
                Token: token
            }
            const createGroupResponse = await createGroupChat(createGroupBody).unwrap();

            console.log("createGroupResponse", createGroupResponse);

            if (createGroupResponse["ResponseHeader"]["StatusCode"] == "201") {
                setTimeout(async () => {
                    const RequestHeader = await generateRequestHeader();

                    const groupChatRequestPayload = {
                        RequestHeader: RequestHeader,
                        AccessToken: token,
                        Body: {
                            page: '1',
                            limit: '15',
                        },
                    }
                    const streamService = ChatStreamService.getInstance();
                    streamService.startStream();
                    const RequestPayload = {
                        RequestHeader: await generateRequestHeader(),
                        AccessToken: token,
                        ChatId: createGroupResponse["Response"]["GroupId"],
                    }
                    await fetchChatDetails(RequestPayload).unwrap();

                }, 0);


                navigation.replace("MessageScreen", {
                    chatId: createGroupResponse["Response"]["GroupId"],
                    name: createGroupResponse["Response"]["GroupName"],
                    type: "group",
                    profilePicture: createGroupResponse["Response"]["GroupIcon"],
                    membersCount: createGroupResponse["Response"]["ParticipantsId"].length,
                });
            }
        }
        catch (error: any) {
            console.log("error while creating the group", error)
            Alert.alert("Error while creating the group", "Please try again")
        }
    }, [groupName, data])


    const renderItem = useCallback(({ item }: { item: User }) => {
        const isOwner = item.id === currentUser?.id;

        return (
            <View
                style={[layout.row, layout.itemsCenter, gutters.paddingVertical_10]}
            >
                <View style={[layout.relative]}>

                    {item.profilePicture ? (
                        <>
                            <FastImage source={{ uri: item.profilePicture }} style={[components.imageSize48, borders.rounded_500]} />
                        </>
                    ) : (
                        <View
                            style={[
                                components.imageSize48,
                                borders.rounded_500,
                                { backgroundColor: (item as any).backgroundColor },
                                layout.itemsCenter,
                                layout.justifyCenter,
                            ]}
                        >
                            <TextVariant style={[components.urbanist16RegularWhite, components.textCenter]}>
                                {getInitials((item?.username ? item?.fullName : item?.username) as string)}
                            </TextVariant>
                        </View>
                    )}
                </View>
                <View style={[gutters.marginLeft_10]}>
                    <TextVariant style={[components.urbanist16SemiBoldDark]}>{item?.fullName ? item?.fullName : item?.username}</TextVariant>
                    <TextVariant style={[components.urbanist14RegularcodeDark]}>{isOwner ? t("owner") : t("member")}</TextVariant>
                </View>
            </View>
        );
    }, [layout, components, borders, gutters]);

    const onTakeWithCamera = useCallback(async () => {
        bottomSheetModalRef.current?.dismiss();

        const permission = REQUEST_PERMISSION_TYPE.camera[
            Platform.OS as keyof PlatformPermissions
        ] as Permission;

        const result = await check(permission);

        if (result === RESULTS.GRANTED) {
            captureImageAndUpload();
        } else if (result === RESULTS.DENIED) {
            const reqResult = await request(permission);
            if (reqResult === RESULTS.GRANTED) {
                captureImageAndUpload();
            } else {
                Alert.alert(
                    t("cameraAccessDeniedTitle"),
                    t("cameraAccessDeniedMessage"),
                    [{ text: t("okay"), style: "cancel" }]
                );
            }
        } else if (result === RESULTS.BLOCKED || result === RESULTS.UNAVAILABLE) {
            Alert.alert(
                t("cameraAccessDeniedTitle"),
                t("cameraAccessBlockedMessage"),
                [{ text: t("okay"), style: "cancel" }]
            );
        }
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

    console.log("data==>", data)

    return (
        <>
            <SafeScreen>
                <View style={[gutters.padding_14, layout.justifyBetween, layout.flex_1]}>

                    {(!isImageUploading && !data) && <ButtonVariant style={[layout.itemsSelfCenter, layout.justifyCenter, layout.itemsCenter, borders.rounded_500, backgrounds.primary, layout.height100px, layout.width100px]} onPress={handleOpenBottomSheet} disabled={isImageUploading}>
                        <View style={[gutters.padding_10, borders.rounded_500, backgrounds.white]}>
                            <ImageVariant
                                source={Images.edit2}
                                sourceDark={ImagesDark.edit2}
                                style={[components.iconSize20]}
                            />
                        </View>
                    </ButtonVariant>}

                    {(!isImageUploading && data) && <View style={[layout.itemsSelfCenter]}>
                        <FastImage source={{ uri: data?.url }} style={[layout.itemsSelfCenter, layout.justifyCenter, layout.itemsCenter, borders.rounded_500, layout.height100px, layout.width100px]} />
                    </View>}

                    {(isImageUploading) && <View style={[layout.itemsSelfCenter]}>
                        <Stack>
                            <Skeleton circle width={100} height={100} />
                        </Stack>
                    </View>}


                    <View style={[layout.row, layout.itemsCenter, layout.justifyBetween, borders.w_1, borders.tertiary, borders.rounded_8, gutters.paddingHorizontal_10, layout.height50px, gutters.marginTop_20]}>
                        <TextInput
                            autoCapitalize='none'
                            returnKeyLabel='Done'
                            returnKeyType='done'
                            style={[components.urbanist14RegularBlack, layout.flex_1]}
                            placeholderTextColor={colors.textInputPlaceholder}
                            keyboardAppearance='light'
                            placeholder={t("groupName")}
                            value={groupName}
                            onBlur={() => setGroupName(groupName.trim())}
                            onChangeText={(text) => { setGroupName(text) }}
                        />
                        <ButtonVariant onPress={toggleEmojiPicker}>
                            <ImageVariant
                                tintColor={colors.emojiDark}
                                source={Images.emoji}
                                sourceDark={ImagesDark.emoji}
                                style={[components.iconSize20]}
                            />
                        </ButtonVariant>
                    </View>

                    {showEmojiPicker && (
                        <EmojiKeyboard
                            onEmojiSelected={(emoji) => {
                                handleEmojiSelect(emoji.emoji)
                            }}
                            categoryPosition='top'
                            emojiSize={35}
                            enableRecentlyUsed
                        />
                    )}

                    <View style={[layout.flex_1]}>
                        <TextVariant style={[components.urbanist16SemiBoldPlaceholder, gutters.marginVertical_20]}>{allUsers.length} {t("members")}</TextVariant>
                        <FlatList
                            data={allUsers}
                            scrollEventThrottle={16}
                            showsVerticalScrollIndicator={false}
                            keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
                            renderItem={renderItem}
                            initialNumToRender={10}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                            getItemLayout={(data, index) => ({
                                length: 70,
                                offset: 70 * index,
                                index,
                            })}
                            style={[layout.flex_1]}
                            removeClippedSubviews={false}
                        />
                    </View>

                    <ButtonVariant
                        disabled={isLoading || isImageUploading || !groupName || groupName.trim().length === 0}
                        style={[
                            (!groupName || isImageUploading || isLoading || groupName.trim().length === 0)
                                ? components.disabledButton
                                : components.blueBackgroundButton,
                            gutters.padding_14,
                            layout.itemsCenter
                        ]}
                        onPress={handleContinue}
                    >
                        {(isLoading || isImageUploading) ? <LottieView
                            source={require('@/theme/assets/lottie/loading.json')}
                            style={{ height: 20, width: 20 }}
                            autoPlay
                            loop
                        /> : <TextVariant style={[components.textCenter, components.urbanist16SemiBoldWhite]}>{t("create")}</TextVariant>
                        }
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

export default React.memo(SetGroup)
