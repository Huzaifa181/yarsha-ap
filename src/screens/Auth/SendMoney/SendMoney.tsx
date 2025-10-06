import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms'
import { SafeScreen } from '@/components/template'
import { useDispatch, useSelector } from '@/hooks'
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser'
import { useGeneratePeerChatMutation } from '@/hooks/domain/individual-chat/individualChats'
import { useSearchUsersMutation } from '@/hooks/domain/search-user/useSearchUser'
import { RootState } from '@/store'
import log from '@/utils/logger';
import { Images, ImagesDark, useTheme } from '@/theme'
import { Friend, isImageSourcePropType, SafeScreenNavigationProp, SafeScreenRouteProp } from '@/types'
import { getInitials, getLastSeen } from '@/utils'
import FastImage from '@d11/react-native-fast-image'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { debounce } from 'lodash'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Keyboard, ListRenderItem, ScrollView, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import { addUser, removeUser } from '@/store/slices'
import { generateRequestHeader } from '@/utils/requestHeaderGenerator'
import { Stack } from '@rneui/layout'
import { Skeleton } from '@rneui/base'
import { CheckIndividualChatRequestWrapper } from '@/pb/groupchat'

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @SendMoney
**/

interface ChatResult {
    chatId: string;
}

interface User {
    address?: string;
    id: string;
    lastActive?: string;
    profilePicture: string;
    status?: string;
    username: string;
    fullName: string;
    backgroundColor: string;
}


const SendMoney: FC<IProps> = () => {
    const { t } = useTranslation(["translations"]);

    const dispatch = useDispatch();

    const navigation = useNavigation<SafeScreenNavigationProp>();

    const { data: currentUser } = useFetchLatestUserQuery();
    const [searchUsers] = useSearchUsersMutation();
    const [generatePeerChat] = useGeneratePeerChatMutation();

    // const route = useRoute<SafeScreenRouteProp & { params: { } }>();
    // const { token } = route.params;
    const authToken = useSelector((state: RootState) => state.accessToken.authToken);

    const { gutters, layout, components, borders, backgrounds, colors } = useTheme();

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [users, setUsers] = useState<User[]>([]);
    const selectedUsers = useSelector((state: RootState) => state.selectedUsers.selectedUsers);
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
    const [isUserSearching, setUserSearching] = useState<boolean>(false)

    if (!isImageSourcePropType(Images.checkBoxFilled) || !isImageSourcePropType(ImagesDark.checkBoxFilled)) {
        throw new Error("Image source is not valid!")
    }

    const renderEnterUsername = useCallback(() => (
        <View style={[layout.itemsCenter, layout.justifyCenter, gutters.padding_20]}>
            <TextVariant style={[components.urbanist14RegularcodeDark]}>
                {t("enterUsername")}
            </TextVariant>
        </View>
    ), [layout, components]);

    const searchUser = useCallback(
        debounce(async (query: string) => {
            if (query.trim()) {
                setUserSearching(true);
                try {
                    const SearchUsersBody = {
                        "SearchQuery": query,
                        "Token": authToken
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
                                status: user["Status"],
                                address: user["Address"],
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
            }
        }, 500),
        [authToken, currentUser]
    );


    useEffect(() => {
        searchUser(searchQuery);
    }, [searchQuery, searchUser]);


    const handleSelectUser = useCallback((user: User) => {
        if (selectedUsers.some((selectedUser: any) => selectedUser.id === user.id)) {
            dispatch(removeUser(user.id));
        } else {
            dispatch(addUser(user));
            setSearchQuery("");
        }
        setSearchQuery("");
    }, [dispatch, selectedUsers]);

    const renderItem: ListRenderItem<User> = useCallback(({ item }) => {
        const isSelected = selectedUsers.some((selectedUser: any) => selectedUser.id === item.id);

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
                {selectedUsers.map((user: any) => (
                    <ButtonVariant
                        key={user.id}
                        onPress={() => handleSelectUser({
                            backgroundColor: user.backgroundColor || "",
                            fullName: user.fullName,
                            id: user.id,
                            profilePicture: user.profilePicture || "",
                            username: user.username,
                            lastActive: user.lastActive,
                            status: user.status,
                            address: user.address,
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
                    {/* <TextInput
                        autoCapitalize="none"
                        returnKeyLabel="Done"
                        returnKeyType="done"
                        style={[components.urbanist14RegularBlack, layout.flex_1]}
                        placeholderTextColor={colors.textInputPlaceholder}
                        keyboardAppearance="light"
                        placeholder={placeholder}
                        value={searchQuery}
                        onChangeText={onChangeSearchQuery}
                        onFocus={onFocus}
                    /> */}
                    <TextInput
                        autoFocus
                        autoCapitalize="none"
                        returnKeyLabel="Done"
                        returnKeyType="done"
                        keyboardAppearance="light"
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
            const RequestHeader = await generateRequestHeader();
            const chatResults: ChatResult[] = [];

            for (const user of selectedUsers) {
                const requestPayload: CheckIndividualChatRequestWrapper = {
                    body: {
                        peerId: user.id,
                    },
                    requestHeader: {
                        action: 'checkIndividualChat',
                        requestId: Date.now().toString(),
                        timestamp: RequestHeader.Timestamp,
                        appVersion: '1.0.1',
                        deviceId: RequestHeader.DeviceId,
                        deviceType: 'mobile',
                        channel: 'mobile',
                        deviceModel: RequestHeader.DeviceModel,
                        clientIp: '127.0.0.1',
                        languageCode: 'en',
                    },
                };

                const checkIndividualChatResponse = await generatePeerChat(requestPayload).unwrap();

                chatResults.push({
                    chatId: checkIndividualChatResponse?.response?.groupId ?? '',
                });
            }

            navigation.navigate("EnterAmountScreen", {
                chatType: "",
                // token,
                receivers: selectedUsers.map((selectedUser, index) => ({
                    ...selectedUser,
                    chatId: chatResults[index].chatId,
                })) || [],
            });
        } catch (error) {
            console.error('❌ Error checking individual chats:', error);
        }
    }, [selectedUsers, navigation]);


    useFocusEffect(
        useCallback(() => {
            return () => {
                setSearchQuery("")
                setUsers([])
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

    const filteredUsers = useMemo(() => {
        return users.filter(
            (user) => !selectedUsers.some((selectedUser: any) => selectedUser.id === user.id)
        );
    }, [users, selectedUsers]);

    const maxScrollViewHeight = 130;
    const minScrollViewHeight = 50;
    const stepHeight = 20;

    const scrollViewHeight = Math.min(
        minScrollViewHeight + selectedUsers.length * stepHeight,
        maxScrollViewHeight
    );

    const filteredRecentUsers = useMemo(() => {
        return [].filter(
            (user: any) => !selectedUsers.some((selectedUser: any) => selectedUser.id === user.id)
        );
    }, [selectedUsers]);

    return (
        <SafeScreen membersCount={selectedUsers.length}>
            <TouchableWithoutFeedback onPress={
                () => {
                    Keyboard.dismiss()
                    setIsSearchFocused(false);
                    setSearchQuery("");
                }
            }>
                <View style={[layout.flex_1, gutters.paddingTop_10]}>
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
                            disabled={selectedUsers.length === 0}
                            style={[selectedUsers.length > 0 ? components.blueBackgroundButton : components.disabledButton, gutters.padding_16]}
                            onPress={handleContinue}
                        >
                            <TextVariant style={[components.textCenter, components.urbanist16SemiBoldWhite]}>{t("continue")}</TextVariant>
                        </ButtonVariant>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </SafeScreen>
    );
};

export default React.memo(SendMoney);

