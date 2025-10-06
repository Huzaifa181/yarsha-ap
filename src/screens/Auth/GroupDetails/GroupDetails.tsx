import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { SearchBar, Switch } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { useSelector } from '@/hooks';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { useFetchGroupChatDetailQuery, useFetchParticipantByIdQuery } from '@/hooks/domain/fetch-chat-details/useFetchChatDetails';
import { TChatDetailsResponse } from '@/hooks/domain/fetch-chats/schema';
import { useFetchChatDetailsMutation } from '@/hooks/domain/fetch-chats/useFetchChats';
import { useFetchOtherUserMutation } from '@/hooks/domain/fetch-user/useFetchUser';
import { useToggleMuteChatMutation } from '@/hooks/domain/mute-chat/useMuteChat';
import { RootState } from '@/store';
import { Images, ImagesDark, useTheme } from '@/theme';
import {
  GroupDetailsSpace,
  isImageSourcePropType,
  SafeScreenNavigationProp,
  SafeScreenRouteProp,
} from '@/types';
import {
  capitalizeFirstLetter,
  getInitials,
  width,
} from '@/utils';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import FastImage from '@d11/react-native-fast-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { FC, JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { z } from 'zod';
import RenderBlinkSkeletonPlaceholder from '../Message/Shared/BlinkSkeleton';
import MediaItem from './MediaItem';


interface IProps { }

export interface Blink {
  id: string;
  icon: string;
  name: string;
  description: string;
  actionUrl: string;
  label: string;
  title: string;
}

/**
 * @author Nitesh Raj Khanal
 * @function GroupDetails
 * @returns JSX.Element
 */

const GroupDetails: FC<IProps> = (props): JSX.Element => {
  const { layout, gutters, components, borders, backgrounds } = useTheme();

  const route = useRoute<
    SafeScreenRouteProp & { params: { groupId: string; groupName: string } }
  >();
  const { groupId, groupName } = route.params;

  const { data: currentUser } = useFetchLatestUserQuery();

  const token = useSelector((state: RootState) => state.accessToken.authToken)

  const [participantId, setParticipantId] = useState<string>('');

  const [toggleMuteChat] = useToggleMuteChatMutation();
  const { data: groupChatDetails, isLoading, refetch } = useFetchGroupChatDetailQuery({ ChatId: groupId }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  console.log("groupChatDetails", groupChatDetails)

  const normalizeWhitespace = (text: string): string => {
    return text.trim().replace(/\s+/g, ' ');
  };

  useFetchParticipantByIdQuery(participantId);

  const [fetchOtherUser] = useFetchOtherUserMutation()

  const { t } = useTranslation(['translations']);

  const navigation = useNavigation<SafeScreenNavigationProp>();

  const tabs = ['Members', 'Media', 'Blinks', 'Links'];
  const [activeTab, setActiveTab] = useState<string>('Members');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isBlinkLoading, setIsBlinkLoading] = useState<boolean>(false);
  const [blinksData, setBlinksData] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMuting, setIsMuting] = useState<boolean>(false)

  const screenWidth = Dimensions.get('window').width;

  if (
    !isImageSourcePropType(Images.admin) ||
    !isImageSourcePropType(ImagesDark.admin)
  ) {
    throw new Error('Image source is not valid !');
  }


  const filteredBlinks = useMemo(() => {
    if (!searchQuery) return blinksData;

    const lowercasedQuery = searchQuery.toLowerCase();
    return blinksData.filter(
      blink =>
        blink?.title?.toLowerCase()?.includes(lowercasedQuery) ||
        blink?.name?.toLowerCase()?.includes(lowercasedQuery) ||
        blink?.description?.toLowerCase()?.includes(lowercasedQuery) ||
        blink?.label?.toLowerCase()?.includes(lowercasedQuery) ||
        blink?.actionUrl?.toLowerCase()?.includes(lowercasedQuery),
    );
  }, [searchQuery, blinksData]);

  const handleChangeSearchQuery = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleTabPress = useCallback(
    (tab: string) => {
      setActiveTab(tab);
    },
    [screenWidth],
  );

  const isAdmin = useMemo(() => {
    if (!groupChatDetails || !currentUser) return false;

    return groupChatDetails.participants.some(
      participant =>
        (participant.role === 'creator' || participant.role === 'admin') &&
        participant.id === currentUser.id
    );
  }, [groupChatDetails, currentUser]);


  useEffect(() => {
    console.log("Group Chat Details", groupChatDetails);
    if (!groupChatDetails) {
      const fetchGroupChatDetails = async () => {
        const RequestPayload = {
          RequestHeader: await generateRequestHeader(),
          AccessToken: token,
          ChatId: groupId
        }
        await fetchChatDetails(RequestPayload).unwrap();
        await refetch();
      }

      fetchGroupChatDetails()
    } else {
      console.log("Group Chat Details", groupChatDetails);
    }
  }, [groupChatDetails])

  const renderItem = useCallback(
    ({ item }: { item: GroupDetailsSpace.ChatParticipant }) => (
      <ButtonVariant
        style={[layout.row, layout.itemsCenter, gutters.marginVertical_12]}
        onPress={async () => {
          console.log("Item", item);
          const otherUsers = await fetchOtherUser({ userId: item.id, authToken: token }).unwrap()
          setParticipantId(item.id);

          if (otherUsers.Response.Id === currentUser?.id) {
            navigation.navigate("BottomTab", { screen: "SettingsScreen" })
          } else {
            navigation.navigate('ProfileDetails', {
              Address: otherUsers?.Response.Address,
              FullName: otherUsers?.Response.FullName,
              BackgroundColor: otherUsers?.Response.BackgroundColor,
              ProfilePicture: otherUsers?.Response.ProfilePicture,
              UserBio: otherUsers?.Response.UserBio,
              Username: otherUsers?.Response.Username,
            });
          }
        }}>
        <View>
          {item.role === 'creator' && (
            <ImageVariant
              style={[
                components.iconSize24,
                borders.rounded_500,
                layout.absolute,
                layout.bottom0,
                layout.right0,
                layout.z1,
              ]}
              source={Images.admin}
              sourceDark={ImagesDark.admin}
            />
          )}
          {(item.profilePicture && item.profilePicture != "" && z.string().url().safeParse(item.profilePicture).success) ? (
            <FastImage
              source={{
                uri: item.profilePicture,
              }}
              style={[components.imageSize52, borders.rounded_500]}
            />
          ) : (
            console.log("Background Color", item.backgroundColor),
            <View
              style={[
                components.imageSize52,
                borders.rounded_500,
                { backgroundColor: item.backgroundColor },
                layout.itemsCenter,
                layout.justifyCenter,
              ]}>
              <TextVariant style={[components.urbanist18BoldWhite]}>
                {getInitials(item.fullName as string)}
              </TextVariant>
            </View>
          )}
        </View>

        <View>
          <TextVariant
            style={[gutters.marginLeft_14, components.urbanist16SemiBoldDark]}>
            {item.fullName}
          </TextVariant>
          <TextVariant
            style={[gutters.marginLeft_14, components.urbanist14RegularBlack]}>
            {capitalizeFirstLetter(item.role)}
          </TextVariant>
        </View>
      </ButtonVariant>
    ),
    [layout, gutters, components, borders],
  );

  const keyExtractor = useCallback(
    (item: GroupDetailsSpace.ChatParticipant) => item.id,
    [],
  );

  const [chatDetails, setChatDetails] = useState<TChatDetailsResponse>();

  const [fetchChatDetails] = useFetchChatDetailsMutation()

  console.log("Chat Details", chatDetails);

  useEffect(() => {
    const fetchChatDetailsData = async () => {
      const RequestPayload = {
        RequestHeader: await generateRequestHeader(),
        AccessToken: token,
        ChatId: groupId || "",
      };
      const response = await fetchChatDetails(RequestPayload).unwrap();
      setChatDetails(response);
    }

    fetchChatDetailsData()
  }, [isMuted])


  const onMuteNotifications = useCallback(async () => {
    setIsMuting(true)
    try {
      const RequestHeader = await generateRequestHeader();
      const toggleMuteRequestPayload = {
        RequestHeader: RequestHeader,
        AccessToken: token,
        Body: {
          ChatId: groupId
        }
      }

      const toggleMuteChatResponse = await toggleMuteChat(toggleMuteRequestPayload).unwrap();
      console.log("groupchatdetails Toggle Mute Chat Response", toggleMuteChatResponse);

      if (toggleMuteChatResponse.muteStatus || !toggleMuteChatResponse.muteStatus) {
        const RequestPayload = {
          RequestHeader: await generateRequestHeader(),
          AccessToken: token,
          ChatId: groupId || "",
        };
        setIsMuted(toggleMuteChatResponse.muteStatus);
        const chatDetails = await fetchChatDetails(RequestPayload).unwrap();
        console.log("Chat Details Response", chatDetails);
        setChatDetails(chatDetails);
      }

    } catch (error) {
      Alert.alert("Can't mute notification");
    }
    finally {
      setIsMuting(false)
    }
  }, [isMuted, isMuting]);

  const renderSkeletonPlaceholder = () => (
    <ScrollView style={[gutters.marginVertical_12]}>
      {Array.from({ length: 10 }).map((_, index) => (
        <SkeletonPlaceholder key={index} borderRadius={4}>
          <SkeletonPlaceholder.Item
            flexDirection="row"
            alignItems="center"
            marginBottom={12}>
            <SkeletonPlaceholder.Item
              width={52}
              height={52}
              borderRadius={26}
            />
            <SkeletonPlaceholder.Item marginLeft={14}>
              <SkeletonPlaceholder.Item
                width={200}
                height={20}
                borderRadius={4}
              />
              <SkeletonPlaceholder.Item
                marginTop={6}
                width={100}
                height={20}
                borderRadius={4}
              />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder>
      ))}
    </ScrollView>
  );

  const renderMediaItem = useCallback(
    ({ item }: { item: Blink }) => {
      const itemSize = screenWidth / 3 - 4;

      return (
        <View
          style={{ width: itemSize, marginHorizontal: 2, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              navigation.replace('MessageScreen', {
                chatId: groupId,
                name: groupName,
                groupName,
                actionUrl: item?.actionUrl,
                type: 'group',
                blinkDetails: { ...item },
              });
            }}>
            <MediaItem mediaSource={{ uri: item.icon }} itemSize={itemSize} />
          </TouchableOpacity>
        </View>
      );
    },
    [screenWidth, groupName, groupId],
  );

  const handleAddMembers = useCallback(() => {
    navigation.navigate('AddMembers', { groupId: groupId });
  }, []);


  console.log("Is Loader", isLoading);

  return (
    <SafeScreen groupName={groupName} messageId={groupId} canEditGroup={isAdmin}>
      <View style={[gutters.padding_14, layout.justifyBetween, layout.flex_1]}>
        <View style={[layout.row, layout.itemsCenter]}>
          {isLoading ? (
            <SkeletonPlaceholder borderRadius={4}>
              <SkeletonPlaceholder.Item flexDirection="row" alignItems="center">
                <SkeletonPlaceholder.Item
                  width={80}
                  height={80}
                  borderRadius={40}
                />
                <SkeletonPlaceholder.Item marginLeft={14}>
                  <SkeletonPlaceholder.Item width={200} height={20} />
                  <SkeletonPlaceholder.Item
                    marginTop={6}
                    width={100}
                    height={20}
                  />
                </SkeletonPlaceholder.Item>
              </SkeletonPlaceholder.Item>
            </SkeletonPlaceholder>
          ) : (
            <>
              {groupChatDetails?.groupIcon ? (
                <FastImage
                  source={{
                    uri: groupChatDetails?.groupIcon,
                  }}
                  style={[components.imageSize80, borders.rounded_500]}
                />
              ) : (
                <View
                  style={[
                    components.imageSize80,
                    borders.rounded_500,
                    { backgroundColor: groupChatDetails?.backgroundColor },
                    layout.itemsCenter,
                    layout.justifyCenter,
                  ]}>
                  <TextVariant style={[components.urbanist18BoldWhite]}>
                    {getInitials(groupName as string)}
                  </TextVariant>
                </View>
              )}
              <View style={[gutters.marginLeft_14, { width: "80%" }]}>
                <TextVariant style={[components.urbanist24BoldBlack]}>
                  {groupName}
                </TextVariant>
                <TextVariant
                  style={[components.urbanist16RegularMessageSendText]}>
                  {groupChatDetails?.participants.length} {t('members')}
                </TextVariant>
              </View>
            </>
          )}
        </View>

        {isLoading ? (
          <SkeletonPlaceholder borderRadius={4}>
            <SkeletonPlaceholder.Item marginTop={10} marginBottom={10}>
              <SkeletonPlaceholder.Item
                height={20}
                width={width * 0.92}
                borderRadius={4}
              />
              <SkeletonPlaceholder.Item
                height={20}
                width={100}
                marginTop={6}
                borderRadius={4}
              />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder>
        ) : (
          <View style={[layout.maxHeight150]}>
            <TextVariant
              style={[
                components.urbanist14RegularBlack,
                gutters.marginVertical_14,
              ]}>
              {normalizeWhitespace(groupChatDetails?.groupDescription || t('groupDescription'))}
            </TextVariant>
          </View>
        )}
        <View
          style={[
            layout.fullWidth,
            layout.row,
            layout.justifyBetween,
            gutters.marginVertical_10,
          ]}>
          <TextVariant style={[components.urbanist16BoldDark]}>
            {t('notifications')}
          </TextVariant>
          <Switch isEnabled={!chatDetails?.Chat.IsMuted} onToggle={onMuteNotifications} disabled={isMuting} />
        </View>
        <View style={[layout.justifyBetween, layout.flex_1, backgrounds.white]}>
          <View style={[layout.row, layout.justifyStart]}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabPress(tab)}
                style={[gutters.marginRight_16]}>
                <TextVariant
                  style={[
                    activeTab === tab
                      ? components.urbanist16RegularPrimary
                      : components.urbanist16RegulartextInputPlaceholder,
                  ]}>
                  {tab}
                </TextVariant>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[layout.flex_1]}>
            {activeTab === 'Members' &&
              (isLoading ? (
                renderSkeletonPlaceholder()
              ) : (
                <FlashList
                  data={groupChatDetails?.participants || []}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  estimatedItemSize={100}
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  onEndReachedThreshold={0.5}
                />
              ))}
            {activeTab === 'Media' && <TextVariant>Media</TextVariant>}
            {activeTab === 'Blinks' &&
              (isBlinkLoading ? (
                <RenderBlinkSkeletonPlaceholder />
              ) : (
                <>
                  <SearchBar
                    searchQuery={searchQuery}
                    onChangeSearchQuery={value =>
                      handleChangeSearchQuery(value)
                    }
                    placeholder={t('searchBlinks')}
                    style={[gutters.padding_14, gutters.marginTop_14]}
                  />
                  <FlatList
                    data={filteredBlinks}
                    keyExtractor={item => item.id}
                    renderItem={renderMediaItem}
                    numColumns={3}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={{
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    contentContainerStyle={{
                      marginTop: gutters.marginTop_14.marginTop,
                    }}
                  />
                </>
              ))}
            {activeTab === 'Links' && <TextVariant>Links</TextVariant>}
          </View>
        </View>

        {activeTab === 'Members' && (
          <>
            {!isAdmin && <View>
              <TextVariant style={[components.urbanist12BoldInactive, components.textCenter, gutters.marginBottom_6]}>{t("youDontHaveEnoughPermissions")}</TextVariant>
            </View>}
            <ButtonVariant
              disabled={!isAdmin}
              style={[isAdmin ? components.blueBackgroundButton : components.disabledButton, gutters.padding_14]}
              onPress={handleAddMembers}>
              <TextVariant
                style={[
                  components.textCenter,
                  components.urbanist16SemiBoldWhite,
                ]}>
                {t('addMembers')}
              </TextVariant>
            </ButtonVariant>
          </>
        )}
      </View>
    </SafeScreen>
  );
};

export default React.memo(GroupDetails);
