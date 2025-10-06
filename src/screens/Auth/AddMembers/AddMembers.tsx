import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, Keyboard, ListRenderItem, ScrollView, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import { SafeScreen } from '@/components/template'
import { Images, ImagesDark, useTheme } from '@/theme'
import { isImageSourcePropType, SafeScreenNavigationProp, SafeScreenRouteProp } from '@/types'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { useDispatch, useSelector } from '@/hooks'
import { RootState } from '@/store'
import { useTranslation } from 'react-i18next'
import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms'
import log from '@/utils/logger'
import { debounce } from 'lodash'
import { getInitials, getLastSeen } from '@/utils'
import { Skeleton } from '@rneui/base'
import { Stack } from '@rneui/layout'
import LottieView from 'lottie-react-native'
import FastImage from '@d11/react-native-fast-image'
import { useFetchGroupChatDetailQuery } from '@/hooks/domain/fetch-chat-details/useFetchChatDetails'
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser'
import { useSearchUsersMutation } from '@/hooks/domain/search-user/useSearchUser'
import { addUser, clearUsers, removeUser } from '@/store/slices'
import { useAddMembersInGroupChatMutation } from '@/hooks/domain/create-groupchat/useCreateGroupChat'
import { useFetchChatDetailsMutation } from '@/hooks/domain/fetch-chats/useFetchChats'
import { generateRequestHeader } from '@/utils/requestHeaderGenerator'
import { Snackbar } from 'react-native-paper';
import GroupChatRepository from '@/database/repositories/GroupChat.repository'
import { ParticipantDetailsModel } from '@/database'

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @AddMembers
**/

interface User {
    backgroundColor: string;
    fullName: string;
    username: string;
    id: string;
    lastActive?: string;
    profilePicture: string;
    status?: string;
    address?: string;
}

const AddMembers: FC<IProps> = (props) => {
    const { gutters, components, layout, backgrounds, borders, colors } = useTheme()

    const { t } = useTranslation("translations")

    const dispatch = useDispatch()

    const navigation = useNavigation<SafeScreenNavigationProp>()

    const [addMembersInGroupChat, { isLoading: isAddingMembers }] = useAddMembersInGroupChatMutation()

    const route = useRoute<SafeScreenRouteProp & { params: { groupId: string } }>();
    const { groupId } = route.params;

    const { data: groupChatDetails, isLoading, refetch } = useFetchGroupChatDetailQuery({ ChatId: groupId }, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
    })

    const { data: currentUser } = useFetchLatestUserQuery();

    const token = useSelector((state: RootState) => state.accessToken.authToken);

    const selectedUsers = useSelector((state: RootState) => state.selectedUsers.selectedUsers);


    const [searchQuery, setSearchQuery] = useState<string>("");
    const [users, setUsers] = useState<User[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
    const [isUserSearching, setUserSearching] = useState<boolean>(false)

    const [addedUser, setAddedUser] = useState<User[]>([]);

    const [snackBarVisible, setSnackBarVisible] = useState<boolean>(false);

    const onDismissSnackBar = () => setSnackBarVisible(false);

    if (!isImageSourcePropType(Images.checkBoxFilled) || !isImageSourcePropType(ImagesDark.checkBoxFilled)) {
        throw new Error("Image source is not valid!")
    }

    const [searchUsers] = useSearchUsersMutation();
    const [fetchChatDetails] = useFetchChatDetailsMutation()

    const searchUser = useCallback(
        debounce(async (query: string) => {
            if (query.trim() && query.length >= 3) {
                setUserSearching(true);
                try {
                    const SearchUsersBody = {
                        "SearchQuery": query,
                        "Token": token
                    };

                    const searchUsersResponse = await searchUsers(SearchUsersBody).unwrap();

                    if (searchUsersResponse["ResponseHeader"]["StatusCode"] === "200") {
                        const searchUsersResponseParsed = searchUsersResponse["Response"];

                        if (searchUsersResponseParsed) {
                            let users = searchUsersResponseParsed.map(user => ({
                                backgroundColor: user["BackgroundColor"],
                                fullName: user["FullName"],
                                id: user["Id"],
                                profilePicture: user["ProfilePicture"],
                                username: user["Username"],
                                lastActive: user["LastActive"],
                                status: user["Status"]
                            }));

                            if (currentUser) {
                                users = users.filter(user => user.id !== currentUser.id);
                            }

                            setUsers(users);
                        } else {
                            setUsers([]);
                        }
                    }
                } catch (error) {
                    log.error("Error searching user:", error);
                } finally {
                    setUserSearching(false);
                }
            } else {
                setUserSearching(false);
                setUsers([]);
            }
        }, 100),
        [currentUser]
    );

    useEffect(() => {
        searchUser(searchQuery);
    }, [searchQuery, searchUser]);

    const handleSelectUser = useCallback((user: User) => {
        if (selectedUsers.some((selectedUser) => selectedUser.id === user.id)) {
            dispatch(removeUser(user.id));
        } else {
            dispatch(addUser(user));
            setSearchQuery("");
        }
        setSearchQuery("");
    }, [dispatch, selectedUsers]);

    const renderItem: ListRenderItem<User> = useCallback(({ item }) => {
        const isSelected = selectedUsers.some((selectedUser) => selectedUser.id === item.id);

        return (
            <ButtonVariant
                style={[layout.row, layout.itemsCenter, layout.justifyBetween]}
                onPress={() => handleSelectUser(item)}
            >
                <View style={[layout.row, layout.itemsCenter, gutters.paddingVertical_10]}>
                    <View style={[layout.relative]}>
                        {item.profilePicture ? (
                            <FastImage
                                source={{ uri: item.profilePicture }}
                                style={[components.imageSize48, borders.rounded_500, gutters.marginRight_14]}
                            />
                        ) : (
                            <View
                                style={[components.imageSize48, gutters.marginRight_14, borders.rounded_500, { backgroundColor: item.backgroundColor }, layout.itemsCenter, layout.justifyCenter]}
                            >
                                <TextVariant style={[components.urbanist18BoldWhite]}>
                                    {getInitials(item.username as string)}
                                </TextVariant>
                            </View>
                        )}
                    </View>
                    <View>
                        <TextVariant style={[components.urbanist16SemiBoldDark]}>{item.fullName}</TextVariant>
                        <TextVariant style={[components.urbanist14RegularcodeDark]}>{item.status === "online" ? item.status : getLastSeen(Number(item.lastActive))}</TextVariant>
                    </View>
                </View>

                <ImageVariant
                    source={isSelected ? Images.checkContact : Images.uncheckedContact}
                    sourceDark={isSelected ? Images.checkContact : Images.uncheckedContact}
                    style={[components.iconSize24,]}
                />
            </ButtonVariant>
        );
    }, [layout, components, borders, gutters, selectedUsers, handleSelectUser, searchQuery, setSearchQuery]);


    const renderSelectedUsers = useCallback(() => {
        return (
            <View style={[layout.row, layout.wrap, layout.itemsCenter, { flex: 1 }]}>
                {selectedUsers.map((user) => (
                    <ButtonVariant
                        key={user.id}
                        onPress={() => handleSelectUser({
                            backgroundColor: user.backgroundColor || "",
                            fullName: user.fullName,
                            id: user.id,
                            profilePicture: user.profilePicture || "",
                            username: user.username,
                            lastActive: user.lastActive,
                            status: user.status
                        })}
                        style={[
                            gutters.marginHorizontal_4,
                            gutters.marginVertical_6,
                            backgrounds.clipBackground,
                            borders.rounded_500,
                            layout.row,
                            layout.itemsCenter,
                        ]}
                    >
                        {user.profilePicture ? (
                            <ImageVariant
                                source={{ uri: user.profilePicture }}
                                style={[components.iconSize32, borders.rounded_500]}
                            />
                        ) : (
                            <View
                                style={[
                                    components.iconSize32,
                                    borders.rounded_500,
                                    { backgroundColor: user.backgroundColor },
                                    layout.itemsCenter,
                                    layout.justifyCenter,
                                ]}
                            >
                                <TextVariant style={[components.urbanist12SemiboldWhite]}>
                                    {getInitials(user.fullName)}
                                </TextVariant>
                            </View>
                        )}
                        <TextVariant style={[components.urbanist12SemiBoldBlack, gutters.marginHorizontal_8]}>
                            {user.fullName.split(" ")[0]}
                        </TextVariant>
                    </ButtonVariant>
                ))}

                <View style={[gutters.marginLeft_8, layout.flexGrow, { minWidth: 60 }]}>
                    <TextInput
                        autoFocus
                        autoCapitalize='none'
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={t("whoWouldYouLikeToAdd")}
                        placeholderTextColor={colors.textInputPlaceholder}
                        style={[
                            components.urbanist14RegularBlack,
                            gutters.paddingVertical_6,
                            { maxWidth: '100%' },
                        ]}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                    />
                </View>
            </View>
        );
    }, [
        selectedUsers,
        handleSelectUser,
        searchQuery,
        setSearchQuery,
        components,
        layout,
        gutters,
        backgrounds,
        borders,
    ]);

    const handleContinue = useCallback(async () => {
        try {
            const addParticipantsResponse = await addMembersInGroupChat({
                groupId: groupId,
                participantsId: selectedUsers.map((user) => user.id)
            }).unwrap();

            console.log("addParticipantsResponse", addParticipantsResponse)

            if (addParticipantsResponse.responseHeader?.statusCode === "200") {
                if (addParticipantsResponse.response?.participantDetails) {
                    const mappedUsers = addParticipantsResponse.response.participantDetails.map(participant => ({
                        backgroundColor: participant.backgroundColor || '',
                        fullName: participant.fullName,
                        username: participant.username,
                        id: participant.id,
                        lastActive: participant.lastActive,
                        profilePicture: participant.profilePicture || '',
                        status: participant.status,
                    }));
                    setAddedUser(mappedUsers);
                }
                setSnackBarVisible(true);
                const RequestPayload = {
                    RequestHeader: await generateRequestHeader(),
                    AccessToken: token,
                    ChatId: groupId || "",
                }
                const response = await fetchChatDetails(RequestPayload).unwrap();
                await refetch();
                console.log("fetchChatDetails response", response);
                const participantDetails = response.Chat.ParticipantDetails.map(p => ({
                    Id: p.Id,
                    Username: p.Username,
                    FullName: p.FullName,
                    ProfilePicture: p.ProfilePicture,
                    Role: p.Role,
                    BackgroundColor: p.BackgroundColor,
                    LastActive: p.LastActive,
                    Address: p.Address,
                    Status: p.Status,
                    SchemaVersion: 1
                })) as ParticipantDetailsModel[];
                GroupChatRepository.updateGroupChat(
                    groupId, response.Chat, participantDetails)
                clearUsers();
                setUsers([]);
                setTimeout(() => {
                    navigation.pop();
                }, 1000);
            }

        }
        catch (error) {
            Alert.alert("Error", "An error occured while adding participants,Please try again")
        }
    }, [selectedUsers]);

    useFocusEffect(
        useCallback(() => {
            return () => {
                setSearchQuery("")
                setUsers([])
                clearUsers()
            }
        }, [])
    )

    const renderEmptyState = useCallback(() => (
        <View style={[layout.itemsCenter, layout.justifyCenter, gutters.padding_20]}>
            <TextVariant style={[components.urbanist14RegularcodeDark]}>
                {t("noUsersFound")}
            </TextVariant>
        </View>
    ), [layout, components]);

    const renderEnterUsername = useCallback(() => (
        <View style={[layout.itemsCenter, layout.justifyCenter, gutters.padding_20]}>
            <TextVariant style={[components.urbanist14RegularcodeDark]}>
                {t("enterUsername")}
            </TextVariant>
        </View>
    ), [layout, components]);


    const filteredUsers = useMemo(() => {
        return users.filter(
            (user) =>
                !selectedUsers.some((selectedUser) => selectedUser.id === user.id) &&
                !groupChatDetails?.participants?.some((participant: any) => participant.id === user.id)
        );
    }, [users, selectedUsers, groupChatDetails]);

    const filteredRecentUsers = useMemo(() => {
        return [].filter(
            (user: any) =>
                !selectedUsers.some((selectedUser) => selectedUser.id === user.id) &&
                !groupChatDetails?.participants?.some((participant: any) => participant.id === user.id)
        );
    }, [selectedUsers, groupChatDetails]);

    const maxScrollViewHeight = 130;
    const minScrollViewHeight = 50;
    const stepHeight = 20;

    const scrollViewHeight = Math.min(
        minScrollViewHeight + selectedUsers.length * stepHeight,
        maxScrollViewHeight
    );

    return (
        <>
            <SafeScreen>
                <TouchableWithoutFeedback onPress={
                    () => {
                        Keyboard.dismiss()
                        setIsSearchFocused(false);
                        setSearchQuery("");
                    }
                }>
                    <View style={[layout.flex_1]}>
                        <ScrollView
                            scrollEventThrottle={16}
                            showsVerticalScrollIndicator={false}
                            style={[gutters.paddingHorizontal_14, components.borderBottom02, { borderBottomColor: colors.gray400, maxHeight: scrollViewHeight }]}
                        >
                            <View style={[layout.row, layout.wrap, layout.itemsCenter]}>
                                {renderSelectedUsers()}
                            </View>
                        </ScrollView>

                        <View style={[gutters.padding_14, layout.justifyBetween, layout.flex_1]}>
                            {
                                isSearchFocused && filteredUsers.length === 0 ? (
                                    isUserSearching ? (
                                        <ScrollView style={[gutters.marginVertical_12]}>
                                            {Array.from({ length: 5 }).map((_, index) => (
                                                <Stack row align="center" spacing={4} style={[gutters.marginVertical_12]} key={index}>
                                                    <Skeleton circle width={52} height={52} />
                                                    <Stack align="flex-start" spacing={4} key={index}>
                                                        <Skeleton width={200} height={20} />
                                                        <Skeleton width={150} height={20} />
                                                    </Stack>
                                                </Stack>
                                            ))}
                                        </ScrollView>
                                    ) : (
                                        searchQuery.trim() === "" ? (
                                            renderEnterUsername()
                                        ) : (
                                            renderEmptyState()
                                        )
                                    )
                                ) : (
                                    <FlatList
                                        data={isSearchFocused ? filteredUsers : filteredRecentUsers}
                                        keyExtractor={(item) => item.id}
                                        renderItem={renderItem}
                                        showsVerticalScrollIndicator={false}
                                        scrollEnabled={filteredUsers.length > 0}
                                        initialNumToRender={10}
                                        maxToRenderPerBatch={10}
                                        windowSize={5}
                                        getItemLayout={(data, index) => ({ length: 70, offset: 70 * index, index })}
                                        style={[layout.flex_1]}
                                        keyboardShouldPersistTaps="handled"
                                        removeClippedSubviews={false}
                                    />
                                )
                            }

                            <ButtonVariant
                                disabled={selectedUsers.length === 0 || isAddingMembers}
                                style={[isAddingMembers ? components.disabledButton : components.blueBackgroundButton, layout.itemsCenter, layout.justifyCenter, gutters.padding_14]} onPress={handleContinue}>

                                {isAddingMembers ? (
                                    <LottieView
                                        source={require('@/theme/assets/lottie/loading.json')}
                                        style={{ height: 20, width: 20 }}
                                        autoPlay
                                        loop
                                    />
                                ) : (<TextVariant style={[components.urbanist16SemiBoldWhite]}>{t("continue")}</TextVariant>)}
                            </ButtonVariant>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </SafeScreen>
            <Snackbar
                visible={snackBarVisible}
                onDismiss={onDismissSnackBar}
                duration={Snackbar.DURATION_SHORT}
                style={[gutters.marginBottom_70, snackBarVisible ? [components.blueBackgroundButton] : [components.redBackgroundButton]]}
            >
                <TextVariant style={[components.urbanist16SemiBoldWhite]}>{addedUser.length === 1 ? t("participantAddedSuccessfully") : t("participantsAddedSuccessfully")}</TextVariant>
            </Snackbar>
        </>
    )
}

export default React.memo(AddMembers)
