import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { Switch } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { useAddAdminMutation } from '@/hooks/domain/add-members/useAddAdmin';
import { useFetchGroupChatDetailQuery } from '@/hooks/domain/fetch-chat-details/useFetchChatDetails';
import { useFetchChatDetailsMutation } from '@/hooks/domain/fetch-chats/useFetchChats';
import { store } from '@/store';
import { Images, ImagesDark, useTheme } from '@/theme';
import { SafeScreenNavigationProp, SafeScreenRouteProp } from '@/types';
import { getInitials, heightPercentToDp } from '@/utils';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import FastImage from '@d11/react-native-fast-image';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { FC, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { z } from 'zod';

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @AddAdminConfirmation
**/

const AddAdminConfirmation: FC<IProps> = (props) => {
    const { t } = useTranslation('translations');

    const { layout, gutters, components, borders, backgrounds } = useTheme();

    const route = useRoute<SafeScreenRouteProp & { params: { fullName: string, backgroundColor: string, id: string, profilePicture: string, role: string, status: string, groupId: string } }>();

    const { fullName, backgroundColor, id, profilePicture, status, groupId } = route.params;

    const hasValidImage = profilePicture &&
        z.string().url().safeParse(profilePicture).success;

    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    const snapPoints = useMemo(
        () => [heightPercentToDp('25'), heightPercentToDp('25')],
        [],
    );

    const [fetchChatDetails] = useFetchChatDetailsMutation()

    const navigation = useNavigation<SafeScreenNavigationProp>()

    const token = store.getState().accessToken.authToken

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

    const handleOpenBottomSheet = useCallback(() => {
        bottomSheetModalRef.current?.present();
    }, []);

    const [addAdmin, { isLoading }] = useAddAdminMutation()
    const { refetch, isLoading: isRefetchingGroupDetails } = useFetchGroupChatDetailQuery({ ChatId: groupId }, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
    })

    const addAdminToGroup = async () => {
        try {
            const response = await addAdmin({
                groupId: groupId,
                participantsId: [id],
            }).unwrap();

            if (response) {
                const RequestPayload = {
                    RequestHeader: await generateRequestHeader(),
                    AccessToken: token,
                    ChatId: groupId
                }
                await fetchChatDetails(RequestPayload).unwrap();
                refetch()
                navigation.pop();
                bottomSheetModalRef.current?.dismiss();
            }
        } catch (error) {
            console.error("Error adding admin:", error);
        }
    }

    return (
        <>
            <SafeScreen>
                <View style={[layout.flex_1, gutters.padding_12, layout.justifyBetween]}>
                    <View style={[gutters.marginTop_12]}>
                        <View style={[layout.row, layout.justifyStart, layout.itemsCenter, gutters.marginBottom_12]}>
                            {hasValidImage ? (
                                <FastImage
                                    source={{ uri: profilePicture }}
                                    style={[components.imageSize48, gutters.marginRight_12, borders.rounded_500]}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                            ) : (
                                <View
                                    style={[
                                        components.imageSize48,
                                        gutters.marginRight_6,
                                        borders.rounded_500,
                                        { backgroundColor: backgroundColor },
                                        layout.itemsCenter,
                                        layout.justifyCenter,
                                    ]}
                                >
                                    <TextVariant style={[components.urbanist24BoldWhite]}>
                                        {getInitials(fullName || '')}
                                    </TextVariant>
                                </View>
                            )}
                            <View>
                                <TextVariant style={[components.urbanist16SemiBoldDark]}>
                                    {fullName}
                                </TextVariant>
                                <TextVariant style={[components.urbanist14RegularSecondary, gutters.marginTop_4]}>
                                    {status === 'online' ? 'Online' : 'Offline'}
                                </TextVariant>
                            </View>
                        </View>

                        <View style={[gutters.marginTop_12]}>
                            <TextVariant style={[components.urbanist18BoldBlack]}>{t("whatCanAdminDo")}</TextVariant>

                            <View style={[layout.row, layout.justifyBetween, layout.itemsCenter, gutters.marginTop_12]}>
                                <TextVariant style={[components.urbanist14RegularEmojiDark]}>{t("deleteMessages")}</TextVariant>
                                <Switch isEnabled={true} onToggle={() => { }} disabled={false} />
                            </View>
                            <View style={[layout.row, layout.justifyBetween, layout.itemsCenter, gutters.marginTop_12]}>
                                <TextVariant style={[components.urbanist14RegularEmojiDark]}>{t("banUsers")}</TextVariant>
                                <Switch isEnabled={true} onToggle={() => { }} disabled={false} />
                            </View>
                            <View style={[layout.row, layout.justifyBetween, layout.itemsCenter, gutters.marginTop_12]}>
                                <TextVariant style={[components.urbanist14RegularEmojiDark]}>{t("inviteUsers")}</TextVariant>
                                <Switch isEnabled={true} onToggle={() => { }} disabled={false} />
                            </View>
                            <View style={[layout.row, layout.justifyBetween, layout.itemsCenter, gutters.marginTop_12]}>
                                <TextVariant style={[components.urbanist14RegularEmojiDark]}>{t("addNewAdmins")}</TextVariant>
                                <Switch isEnabled={true} onToggle={() => { }} disabled={false} />
                            </View>
                        </View>
                    </View>


                    <ButtonVariant
                        disabled={isLoading || isRefetchingGroupDetails}
                        onPress={handleOpenBottomSheet}
                        style={[layout.justifyEnd, (isLoading || isRefetchingGroupDetails) ? components.disabledButton : components.blueBackgroundButton, layout.itemsCenter,
                        gutters.padding_14]}>
                        {(isLoading || isRefetchingGroupDetails) ? (
                            <ActivityIndicator
                                animating={true}
                                color={"#ffffff"}
                                size="small"
                            />
                        ) : <TextVariant style={[components.urbanist16SemiBoldWhite]}>{t("update")}</TextVariant>}
                    </ButtonVariant>
                </View>
            </SafeScreen>

            <BottomSheetModal
                ref={bottomSheetModalRef}
                index={2}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose={true}
                backgroundStyle={[backgrounds.white, borders.roundedTop_20]}
                handleIndicatorStyle={[layout.width40, backgrounds.cream]}>
                <BottomSheetView
                    style={[
                        layout.itemsSelfCenter,
                        layout.fullWidth,
                        gutters.paddingHorizontal_14,
                    ]}>
                    <View style={[layout.row, layout.justifyBetween, gutters.marginTop_12]}>
                        <ButtonVariant
                            onPress={() => bottomSheetModalRef.current?.dismiss()}
                        >
                            <ImageVariant
                                source={Images.caretLeft}
                                sourceDark={ImagesDark.caretLeft}
                                style={[components.iconSize18, gutters.marginRight_12, gutters.marginTop_4]}
                            />
                        </ButtonVariant>
                        <TextVariant
                            style={[components.urbanist18BoldBlack, gutters.marginBottom_20, layout.flex_1]}>
                            {t("areYouSureYouWantToMakeThisUserAnAdmin", { name: fullName.split(" ")[0] })}
                        </TextVariant>
                    </View>

                    <View>
                        <ButtonVariant
                            disabled={isLoading || isRefetchingGroupDetails}
                            onPress={addAdminToGroup}
                            style={[(isLoading || isRefetchingGroupDetails) ? components.disabledButton : components.blueBackgroundButton, gutters.padding_14, gutters.marginBottom_12]}>
                            {
                                (isLoading || isRefetchingGroupDetails) ? (
                                    <ActivityIndicator
                                        animating={true}
                                        color={"#ffffff"}
                                        size="small"
                                    />
                                ) : <TextVariant style={[components.urbanist16SemiBoldWhite, components.textCenter,]}>{t("confirm")}</TextVariant>
                            }
                        </ButtonVariant>
                        <ButtonVariant
                            onPress={() => bottomSheetModalRef.current?.dismiss()}
                            style={[gutters.padding_14]}>
                            <TextVariant style={[components.urbanist16SemiBoldDark, components.textCenter]}>{t("cancel")}</TextVariant>
                        </ButtonVariant>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        </>
    )
}

export default React.memo(AddAdminConfirmation)
