import { ButtonVariant, TextVariant } from '@/components/atoms'
import { SearchBar } from '@/components/molecules'
import { AnimatedTabBar, SafeScreen } from '@/components/template'
import { searchOptions } from '@/data'
import { AppBot } from '@/database'
import { useSelector } from '@/hooks'
import { useFetchBotsMutation, useSearchBotsMutation } from '@/hooks/domain'
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser'
import { ChatInformation, IFriend } from '@/hooks/domain/recent-user/schema'
import { useAddOrUpdateUserMutation, useFetchContactedGroupsQuery, useFetchContactedUsersQuery, useFetchLocalFriendsQuery, useFetchLocalUsersQuery } from '@/hooks/domain/recent-user/useRecentUser'
import { useSearchUsersMutation } from '@/hooks/domain/search-user/useSearchUser'
import { RootState } from '@/store'
import { useTheme } from '@/theme'
import { SafeScreenNavigationProp } from '@/types'
import { getInitials, getLastSeen } from '@/utils'
import log from '@/utils/logger'
import FastImage from '@d11/react-native-fast-image'
import { useNavigation } from '@react-navigation/native'
import { Stack } from '@rneui/layout'
import { Skeleton } from '@rneui/themed'
import { debounce } from 'lodash'
import React, { FC, JSX, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Keyboard, ListRenderItem, ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import Bots from './Bots'
import { WAPAL_MEDIA_CACHE } from '@/config'
import { useFetchAllChatsQuery } from '@/hooks/domain/db-chats/useDbChats'

interface IProps { }

/**
 * @author Nitesh Raj Khanal
 * @function SearchScreen
 * @returns JSX.Element
 */


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

const PAGE_LIMIT = 10;

const SearchScreen: FC<IProps> = (props): JSX.Element => {
  const { t } = useTranslation(["translations"])
  const { layout, gutters, components, borders, backgrounds } = useTheme()
  const navigation = useNavigation<SafeScreenNavigationProp>()

  const [activeOption, setActiveOption] = useState<string | null>("chats")
  const [searchQuery, setSearchQuery] = useState<string>("");

  const token = useSelector((state: RootState) => state.accessToken.authToken);
  const [users, setUsers] = useState<User[]>([]);
  const [bots, setBots] = useState<AppBot[]>([]);
  const [searchedBots, setSearchedBots] = useState<AppBot[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { data: allChats } = useFetchAllChatsQuery(
    undefined,
    { refetchOnFocus: true, refetchOnMountOrArgChange: true }
  );

  const filteredGroupTypeOnly = useMemo(() => {
    return allChats?.data
      .filter((chat) => chat.type === "group")
      .slice(0, 20)
      .map(chat => ({
        ...chat,
        groupIcon: chat.groupIcon || ''
      })) || [];
  }, [allChats?.data])

  console.log("filteredGroupTypeOnly", filteredGroupTypeOnly)

  const [addOrUpdateUser] = useAddOrUpdateUserMutation();
  const { data: currentUser } = useFetchLatestUserQuery();
  const { data: recentUsers } = useFetchLocalUsersQuery();
  useFetchContactedUsersQuery()
  useFetchContactedGroupsQuery()

  const [fetchBotsTrigger, { isLoading }] = useFetchBotsMutation();

  const { data: contactedLocalUsers } = useFetchLocalFriendsQuery()
  console.log("contactedLocalUsers", contactedLocalUsers)

  const [searchUsers, { isLoading: searchUsersLoading }] = useSearchUsersMutation();
  const searchUser = useCallback(
    debounce(async (query: string) => {
      if (query.trim() && query.length >= 3) {
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
        }
      } else {
        setUsers([]);
      }
    }, 100),
    [currentUser]
  );

  const [searchBots, { reset: resetBotsSearch }] = useSearchBotsMutation();

  const searchBot = useCallback(
    debounce(async (query: string) => {
      if (query.trim() && query.length >= 3) {
        try {

          const searchBotsResponse = await searchBots({
            searchQuery: query,
          }).unwrap();

          console.log("searchBotsResponse in screen", searchBotsResponse)

          if (searchBotsResponse.responseHeader?.statusCode === "200") {
            const searchBotsResponseParsed = searchBotsResponse.response?.bots;

            if (searchBotsResponseParsed) {
              let bots = searchBotsResponseParsed.map(bot => ({
                botId: bot.id,
                botName: bot.name,
                profilePicture: bot.profilePicture,
                botDescription: bot.botBio || '',
                category: bot.category,
                username: bot.username,
                descriptions: bot.descriptions
              })) as AppBot[];
              setSearchedBots(bots);
            } else {
              setSearchedBots([]);
            }
          }
        } catch (error) {
          log.error("Error searching bots:", error);
        } finally {
        }
      } else {
        setSearchedBots([]);
      }
    }, 100), []);


  const fetchBots = useCallback(async (pageToFetch: number, isRefresh = false) => {
    try {
      const response = await fetchBotsTrigger({
        limit: PAGE_LIMIT,
        page: pageToFetch,
        searchQuery: '',
      }).unwrap();

      const fetchedBots = (response.response?.bots ?? []).map(bot => ({
        botId: bot.id,
        botName: bot.name,
        botDescription: bot.botBio,
        ...bot
      })) as AppBot[];

      setHasMore(fetchedBots.length === PAGE_LIMIT);
      setPage(prev => (isRefresh ? 2 : prev + 1));
      setBots(prevBots =>
        isRefresh ? fetchedBots : [...prevBots, ...fetchedBots]
      );
    } catch (err) {
      console.error('Failed to fetch bots:', err);
    }
  }, [fetchBotsTrigger]);

  useEffect(() => {
    fetchBots(1, true);
  }, []);

  const loadMoreBots = () => {
    if (!isLoading && hasMore) {
      fetchBots(page);
    }
  };

  const refreshBots = async () => {
    setRefreshing(true);
    await fetchBots(1, true);
    setRefreshing(false);
  };


  const renderItem = ({ item }: { item: AppBot }) => {
    return (
      <Bots
        botId={item.botId}
        botName={item.botName}
        botIcon={item.profilePicture}
        botDescription={item.botDescription}
        category={item.category}
        username={item.username}
        botBio={item.botBio}
        descriptions={item.descriptions}
      />
    )
  }


  useEffect(() => {
    if (searchQuery.length > 0) {
      if (activeOption === "chats") {
        searchUser(searchQuery);
      } else if (activeOption === "apps") {
        searchBot(searchQuery);
      }
    }
    else {
      setUsers([])
      setSearchedBots([])
      resetBotsSearch()
    }
  }, [searchQuery]);

  const renderLocalContacts: ListRenderItem<IFriend> = useCallback(({ item }) => (
    <ButtonVariant
      onPress={() => {
        addOrUpdateUser(item);
        setSearchQuery("");
        navigation.navigate("PrivateMessageScreen", { messageId: item.friendId, name: item.fullName, type: "individual", profilePicture: item.profilePicture })
      }}
      style={[layout.row, layout.itemsCenter, layout.justifyStart, gutters.marginRight_14, gutters.paddingVertical_6, borders.rounded_500]}
    >
      {
        item.profilePicture ? (
          <>
            <FastImage
              source={{ uri: `${(WAPAL_MEDIA_CACHE as string) + item.profilePicture}` }}
              style={[components.imageSize48, borders.rounded_500]}
            />
          </>) : (
          <>
            <View
              style={[components.imageSize48, borders.rounded_500, { backgroundColor: item.backgroundColor }, layout.itemsCenter, layout.justifyCenter]}
            >
              <TextVariant style={[components.urbanist24BoldWhite]}>
                {getInitials(item.fullName as string)}
              </TextVariant>
            </View>
          </>
        )
      }
      <View style={[gutters.marginLeft_8]}>
        <TextVariant style={[components.urbanist16SemiBoldDark]}>
          {item.fullName}
        </TextVariant>
        <TextVariant style={[components.urbanist14MediumcancelText, gutters.marginTop_4]}>
          {item.status === "online" ? item.status : getLastSeen(Number(item.lastActive))}
        </TextVariant>
      </View>
    </ButtonVariant>
  ), [layout, components, borders]);

  const renderRecentGroups: ListRenderItem<ChatInformation> = useCallback(({ item }) => {
    console.log("item in recent groups", item)
    return (
      <ButtonVariant
        onPress={() => {
          setSearchQuery("");
          navigation.navigate("MessageScreen", {
            name: item.groupName || "",
            type: item.type,
            profilePicture: item.groupIcon,
            membersCount: item.participants.length,
            backgroundColor: item.backgroundColor,
            chatId: item.groupId,
          })
        }}
        style={[layout.row, layout.itemsCenter, layout.justifyStart, gutters.marginRight_14, gutters.paddingVertical_6, borders.rounded_500]}
      >
        {
          item.groupIcon ? (
            <>
              <FastImage
                source={{ uri: item.groupIcon }}
                style={[components.imageSize48, borders.rounded_500]}
              />
            </>) : (
            <>
              <View
                style={[components.imageSize48, borders.rounded_500, { backgroundColor: item.backgroundColor }, layout.itemsCenter, layout.justifyCenter]}
              >
                <TextVariant style={[components.urbanist24BoldWhite]}>
                  {getInitials(item.groupName as string)}
                </TextVariant>
              </View>
            </>
          )
        }
        <View style={[gutters.marginLeft_8]}>
          <TextVariant style={[components.urbanist16SemiBoldDark]}>
            {item.groupName}
          </TextVariant>
          <TextVariant numberOfLines={1} ellipsizeMode='tail' style={[components.urbanist14MediumcancelText, gutters.marginTop_4]}>
            {item.lastMessage.text}
          </TextVariant>
        </View>
      </ButtonVariant>
    )
  }, [layout, components, borders]);

  const renderSelectedUser: ListRenderItem<User> = useCallback(({ item }) => (
    <ButtonVariant
      onPress={() => {
        addOrUpdateUser(item);
        navigation.navigate("PrivateMessageScreen", { messageId: item.id, name: item.fullName, type: "individual", profilePicture: item.profilePicture })
      }}
      style={[layout.row, layout.itemsCenter, layout.justifyStart, gutters.marginRight_14, gutters.paddingVertical_6, borders.rounded_500]}
    >
      {
        item.profilePicture ? (
          <>
            <FastImage
              source={{ uri: `${(WAPAL_MEDIA_CACHE as string) + item.profilePicture}` }}
              style={[components.imageSize48, borders.rounded_500]}
            />
          </>) : (
          <>
            <View
              style={[components.imageSize48, borders.rounded_500, { backgroundColor: item.backgroundColor }, layout.itemsCenter, layout.justifyCenter]}
            >
              <TextVariant style={[components.urbanist24BoldWhite]}>
                {getInitials(item.fullName as string)}
              </TextVariant>
            </View>
          </>
        )
      }
      <View style={[gutters.marginLeft_8]}>
        <TextVariant style={[components.urbanist16SemiBoldDark]}>
          {item.fullName}
        </TextVariant>
        <TextVariant style={[components.urbanist14MediumcancelText, gutters.marginTop_4]}>
          {item.status === "online" ? item.status : getLastSeen(Number(item.lastActive))}
        </TextVariant>
      </View>
    </ButtonVariant>
  ), [layout, components, borders]);

  const renderRecentUser: ListRenderItem<User> = useCallback(({ item }) => (
    <ButtonVariant
      onPress={() => {
        navigation.navigate("PrivateMessageScreen", { messageId: item.id, name: item.fullName, type: "individual", profilePicture: item.profilePicture, })
      }}
      style={[layout.itemsCenter, layout.justifyStart, gutters.marginRight_10, borders.rounded_500]}
    >
      {
        item.profilePicture ? (
          <>
            <FastImage
              source={{ uri: `${(WAPAL_MEDIA_CACHE as string) + item.profilePicture}` }}
              style={[components.imageSize48, borders.rounded_500]}
            />
          </>) : (
          <>
            <View
              style={[components.imageSize48, borders.rounded_500, { backgroundColor: item.backgroundColor }, layout.itemsCenter, layout.justifyCenter]}
            >
              <TextVariant style={[components.urbanist24BoldWhite]}>
                {getInitials(item.fullName as string)}
              </TextVariant>
            </View>
          </>
        )
      }
      <View style={[gutters.marginTop_6, { width: 60 }]}>
        <TextVariant
          style={[components.urbanist14MediumcancelText, gutters.marginTop_4, components.textCenter]}
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {item.fullName.split(" ")[0]}
        </TextVariant>
      </View>
    </ButtonVariant>
  ), [layout, components, borders, gutters]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  console.log("recentUsers", recentUsers)

  const plainGroupList = useMemo(() => Array.from(filteredGroupTypeOnly), [filteredGroupTypeOnly]);

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeScreen>
        <View style={[gutters.paddingHorizontal_14, gutters.paddingVertical_10, backgrounds.white, borders.wBottom_1, borders.gray100]}>
          <AnimatedTabBar
            searchOptions={searchOptions}
            activeOption={activeOption as string}
            setActiveOption={setActiveOption}
          />
          <SearchBar
            style={[gutters.marginTop_15, gutters.marginBottom_10]}
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            placeholder={t("searchMessageChat")}
          />
        </View>

        <View style={[backgrounds.secondaryBackground, layout.flex_1, gutters.paddingHorizontal_14]}>
          {activeOption === "chats" ? (
            <View style={[layout.flex_1, gutters.marginTop_18]}>
              {!searchUsersLoading && users?.length > 0 && searchQuery.length > 0 ? (
                <>
                  <TextVariant style={[components.urbanist16SemiBoldPlaceholder, gutters.marginBottom_10]}>
                    {t("personal")}
                  </TextVariant>

                  <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSelectedUser}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 70 }}
                    keyboardShouldPersistTaps="handled"
                  />
                </>
              ) : searchUsersLoading ? (
                <View>
                  <TextVariant style={[components.urbanist16SemiBoldPlaceholder]}>{t("personal")}</TextVariant>
                  <ScrollView style={[gutters.marginVertical_4]}>
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
                </View>
              ) : (
                <View >
                  <TextVariant style={[components.urbanist16SemiBoldPlaceholder, gutters.marginBottom_16]}>
                    {t("recentContacts")}
                  </TextVariant>
                  {recentUsers && recentUsers.length > 0 ? (<FlatList
                    data={recentUsers}
                    keyExtractor={(item) => `recent-users-${item.id}`}
                    renderItem={renderRecentUser}
                    showsHorizontalScrollIndicator={false}
                    horizontal
                    removeClippedSubviews={false}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingBottom: 30 }}
                    keyboardShouldPersistTaps="handled"
                  />) : (
                    <View style={[layout.itemsCenter, layout.justifyCenter]}>
                      <TextVariant style={[components.urbanist16SemiBoldDark]}>
                        {t("noRecentSearch")}
                      </TextVariant>
                    </View>
                  )}

                  <TextVariant style={[components.urbanist16SemiBoldPlaceholder, gutters.marginTop_16, gutters.marginBottom_10]}>
                    {t("contacts")}
                  </TextVariant>

                  {contactedLocalUsers && contactedLocalUsers.length > 0 ? (<FlatList
                    data={contactedLocalUsers.slice(0, 20)}
                    keyExtractor={(item) => `recent-contacted-users-${item.friendId}`}
                    renderItem={renderLocalContacts}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                  />
                  ) : (
                    <View style={[layout.itemsCenter, layout.justifyCenter]}>
                      <TextVariant style={[components.urbanist16SemiBoldDark]}>
                        {t("noRecentContact")}
                      </TextVariant>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : activeOption === "group" ? (
            <View style={[layout.flex_1, gutters.marginTop_18]}>
              {!searchUsersLoading && users?.length > 0 && searchQuery.length > 0 ? (
                <>
                  <TextVariant style={[components.urbanist16SemiBoldPlaceholder, gutters.marginBottom_10]}>
                    {t("groups")}
                  </TextVariant>

                  <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSelectedUser}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 70 }}
                    keyboardShouldPersistTaps="handled"
                  />
                </>
              ) : searchUsersLoading ? (
                <View>
                  <TextVariant style={[components.urbanist16SemiBoldPlaceholder]}>{t("personal")}</TextVariant>
                  <ScrollView style={[gutters.marginVertical_4]}>
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
                </View>
              ) : (
                <View >
                  <TextVariant style={[components.urbanist16SemiBoldPlaceholder, gutters.marginBottom_16]}>
                    {t("recentGroups")}
                  </TextVariant>
                  {recentUsers && recentUsers.length > 0 ? (<FlatList
                    data={recentUsers}
                    keyExtractor={(item) => `recent-users-${item.id}`}
                    renderItem={renderRecentUser}
                    showsHorizontalScrollIndicator={false}
                    horizontal
                    removeClippedSubviews={false}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingBottom: 30 }}
                    keyboardShouldPersistTaps="handled"
                  />) : (
                    <View style={[layout.itemsCenter, layout.justifyCenter]}>
                      <TextVariant style={[components.urbanist16SemiBoldDark]}>
                        {t("noRecentSearch")}
                      </TextVariant>
                    </View>
                  )}

                  <TextVariant style={[components.urbanist16SemiBoldPlaceholder, gutters.marginTop_16, gutters.marginBottom_10]}>
                    {t("groups")}
                  </TextVariant>

                  {filteredGroupTypeOnly && filteredGroupTypeOnly.length > 0 ? (<FlatList
                    data={plainGroupList as any}
                    keyExtractor={(item) => `recent-filteredGroupTypeOnly-groups-${item.groupId}`}
                    renderItem={renderRecentGroups}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 300 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                  />
                  ) : (
                    <View style={[layout.itemsCenter, layout.justifyCenter]}>
                      <TextVariant style={[components.urbanist16SemiBoldDark]}>
                        {t("noRecentContact")}
                      </TextVariant>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : activeOption === "yarshaAI" ? (
            <TextVariant>Yarsha AI</TextVariant>
          ) : activeOption === "apps" ? (
            <View style={[layout.flex_1, gutters.marginTop_18]}>
              <TextVariant style={[components.urbanist16SemiBoldPlaceholder, gutters.marginBottom_16]}>
                {searchedBots?.length > 0 ? t("searchedBots") : t("bots")}
              </TextVariant>
              {searchedBots && searchedBots.length > 0 ? (<FlatList
                data={searchedBots}
                keyExtractor={(item) => item.botId}
                renderItem={renderItem}
                onEndReached={loadMoreBots}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                refreshing={refreshing}
                onRefresh={refreshBots}
                contentContainerStyle={{ paddingBottom: 30 }}
                ListFooterComponent={
                  isLoading ? <ActivityIndicator size="small" /> : null
                }
              />) : (<FlatList
                data={bots}
                keyExtractor={(item) => item.botId}
                renderItem={renderItem}
                onEndReached={loadMoreBots}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                refreshing={refreshing}
                onRefresh={refreshBots}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 300 }}
                ListFooterComponent={
                  isLoading ? <ActivityIndicator size="small" /> : null
                }
              />)}
            </View>
          ) : (
            <TextVariant>Chats</TextVariant>
          )}
        </View>
      </SafeScreen>

    </TouchableWithoutFeedback>
  );
};

export default React.memo(SearchScreen);