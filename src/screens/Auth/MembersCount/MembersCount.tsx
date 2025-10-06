import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { SafeScreen } from '@/components/template';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { useFetchGroupChatDetailQuery } from '@/hooks/domain/fetch-chat-details/useFetchChatDetails';
import { Images, ImagesDark, useTheme } from '@/theme';
import { SafeScreenNavigationProp, SafeScreenRouteProp } from '@/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { FC, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import MembersCard from './MembersCard';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { heightPercentToDp } from '@/utils';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { useRemoveAdminMutation, useRemoveMemberMutation } from '@/hooks/domain/add-members/useAddAdmin';
import { useFetchChatDetailsMutation } from '@/hooks/domain/fetch-chats/useFetchChats';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import { useSelector } from '@/hooks';
import { RootState } from '@/store';
import { ActivityIndicator, Snackbar } from 'react-native-paper';

interface IProps { }

/**
 * @author Nitesh Raj Khanal
 * @function @MembersCount
 **/
const MembersCount: FC<IProps> = (props) => {
    const { t } = useTranslation("translations");

    const { gutters, layout, components, backgrounds, borders } = useTheme();

    const navigation = useNavigation<SafeScreenNavigationProp>();

    const route = useRoute<SafeScreenRouteProp & { params: { screenName: string, groupId: string } }>();
    const { screenName, groupId } = route.params;

    const token = useSelector((state: RootState) => state.accessToken.authToken)

    const { data: currentUser } = useFetchLatestUserQuery();
    const currentUserId = currentUser?.id;

    const [snackBarVisible, setSnackBarVisible] = React.useState(false);
    const [snackBarMessage, setSnackBarMessage] = React.useState("");

    const { data: groupChatDetails, refetch, isLoading: isRefetchingGroupDetails } = useFetchGroupChatDetailQuery({ ChatId: groupId }, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
    })

    if (!groupChatDetails) {
        return (
            <SafeScreen screenName={screenName}>
                <TextVariant>{t('loading')}</TextVariant>
            </SafeScreen>
        );
    }

    const adminParticipants = groupChatDetails.participants.filter(
        participant => participant.role === 'creator' || participant.role === 'admin'
    );


    const membersParticipants = groupChatDetails.participants.filter(
        (participant) => participant.role === 'member'
    );

    const isOwner = () => {
        if (groupChatDetails?.participants?.find(item => item.id == currentUserId && (item.role === 'creator' || item.role === 'admin'))) return true
        return false
    }

    const navigateAction = useCallback(() => {
        if (screenName === "Members") {
            navigation.navigate('AddMembers', { groupId: groupId });
        } else if (screenName === "Administrators") {
            navigation.navigate('AddAdminsScreen', { groupId: groupId });
        }
    }, [])

    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    const snapPoints = useMemo(() => [heightPercentToDp('23'), heightPercentToDp('23')], []);

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


    const [selectedMember, setSelectedMember] = React.useState<{
        profilePicture: string;
        role: string;
        username: string;
        id: string;
        fullName: string;
        backgroundColor: string;
    } | null>(null);

    const handleOpenBottomSheet = useCallback((member: React.SetStateAction<{ profilePicture: string; role: string; username: string; id: string; fullName: string; backgroundColor: string; } | null>) => {
        setSelectedMember(member);
        bottomSheetModalRef.current?.present();
    }, []);

    const [removeAdmin, { isLoading }] = useRemoveAdminMutation()
    const [removeUser, { isLoading: isRemovingAdmin }] = useRemoveMemberMutation()
    const [fetchChatDetails] = useFetchChatDetailsMutation()

    const removeAdminAction = useCallback(async () => {
        if (selectedMember) {
            try {
                bottomSheetModalRef.current?.dismiss();
                const response = await removeAdmin({
                    groupId: groupId,
                    adminIds: [selectedMember.id],
                }).unwrap();
                if (response) {
                    const RequestPayload = {
                        RequestHeader: await generateRequestHeader(),
                        AccessToken: token,
                        ChatId: groupId
                    }
                    await fetchChatDetails(RequestPayload).unwrap();
                    setSnackBarVisible(true);
                    setSnackBarMessage(t("adminRemoved"));
                    refetch()
                    setTimeout(() => {
                        setSnackBarVisible(false);
                        navigation.navigate("BottomTab", { screen: "ChatsScreen" });
                    }, 1500)
                }
            } catch (error) {
                console.error("Failed to remove admin:", error);
            }
        }
    }, [selectedMember, groupId, removeAdmin]);

    const removeUserAction = useCallback(async () => {
        if (selectedMember) {
            try {
                bottomSheetModalRef.current?.dismiss();
                const response = await removeUser({
                    groupId: groupId,
                    participantsId: [selectedMember.id],
                }).unwrap();
                if (response) {
                    const RequestPayload = {
                        RequestHeader: await generateRequestHeader(),
                        AccessToken: token,
                        ChatId: groupId
                    }
                    await fetchChatDetails(RequestPayload).unwrap();
                    setSnackBarVisible(true);
                    setSnackBarMessage(t("adminRemoved"));
                    refetch()
                    setTimeout(() => {
                        setSnackBarVisible(false);
                        navigation.navigate("BottomTab", { screen: "ChatsScreen" });
                    }, 1500)
                }
            } catch (error) {
                console.error("Failed to remove user:", error);
            }
        }
    }, [selectedMember, groupId, removeUser]);

    return (
        <>
            <SafeScreen screenName={screenName}>
                <View style={[layout.flex_1]}>
                    <FlashList
                        data={screenName === "Administrators" ? adminParticipants : membersParticipants}
                        keyExtractor={(item, index) => item.id + index}
                        scrollEventThrottle={16}
                        showsVerticalScrollIndicator={false}
                        estimatedItemSize={60}
                        renderItem={({ item, index }) => {
                            return (
                                <MembersCard
                                    item={item}
                                    toggleSheet={handleOpenBottomSheet}
                                />
                            );
                        }}
                        style={[gutters.padding_14, layout.flex_1]}
                        ListFooterComponent={
                            screenName === "Administrators"
                                ? () => (
                                    <TextVariant
                                        style={[
                                            components.urbanist16RegularBlack,
                                            components.textCenter,
                                            gutters.paddingVertical_10,
                                        ]}
                                    >
                                        {t("addOthersToHelp")}
                                    </TextVariant>
                                )
                                : null
                        }
                    />
                    {isOwner() && <View style={[gutters.padding_14]}>
                        {
                            screenName === "Members" && <ButtonVariant style={[components.blueBorderButton, , gutters.padding_14, layout.itemsCenter, gutters.marginBottom_10]}>
                                <TextVariant style={[components.textCenter, components.urbanist16SemiBoldPrimary]}>{t("inviteViaLink")}</TextVariant>
                            </ButtonVariant>
                        }
                        <ButtonVariant onPress={navigateAction} style={[components.blueBackgroundButton, gutters.padding_14, layout.itemsCenter]}>
                            <TextVariant style={[components.textCenter, components.urbanist16SemiBoldWhite]}>{screenName === "Administrators" ? t("addAdmin") : t("addMembers")}</TextVariant>
                        </ButtonVariant>
                    </View>}
                </View>
            </SafeScreen>

            <BottomSheetModal
                ref={bottomSheetModalRef}
                index={2}
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
                        {selectedMember?.role === "admin" ? (<TextVariant
                            style={[components.urbanist18BoldBlack, gutters.marginBottom_20, layout.flex_1]}>
                            {t("doYouWantToRemoveThisAdmin", { name: selectedMember?.fullName.split(" ")[0] })}
                        </TextVariant>) : (
                            <TextVariant
                                style={[components.urbanist18BoldBlack, gutters.marginBottom_20, layout.flex_1]}>
                                {t("doYouWantToRemoveThisUser", { name: selectedMember?.fullName.split(" ")[0] })}
                            </TextVariant>
                        )}
                    </View>

                    <View>
                        <ButtonVariant
                            disabled={isLoading || isRefetchingGroupDetails || isRemovingAdmin}
                            onPress={selectedMember?.role === "admin" ? removeAdminAction : removeUserAction}
                            style={[(isLoading || isRefetchingGroupDetails || isRemovingAdmin) ? components.disabledButton : components.redBackgroundButton, gutters.padding_14, gutters.marginBottom_12]}>

                            {
                                (isLoading || isRefetchingGroupDetails || isRemovingAdmin) ? (
                                    <ActivityIndicator
                                        animating={true}
                                        color={"#ffffff"}
                                        size="small"
                                    />
                                ) :
                                    <TextVariant style={[components.urbanist16SemiBoldWhite, components.textCenter,]}>{t("confirm")}</TextVariant>
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
            <Snackbar
                visible={snackBarVisible}
                onDismiss={()=>{}}
                duration={Snackbar.DURATION_SHORT}
                style={[gutters.marginBottom_70, snackBarVisible ? [components.blueBackgroundButton] : [components.redBackgroundButton]]}
            >
                <TextVariant style={[components.urbanist16SemiBoldWhite]}>{selectedMember?.role==="admin" ? t("adminRemoved") : t("userRemoved")}</TextVariant>
            </Snackbar>
        </>
    );
};


export default React.memo(MembersCount);
