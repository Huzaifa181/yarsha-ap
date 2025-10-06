import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { SearchBar } from '@/components/molecules';
import { WAPAL_MEDIA_CACHE } from '@/config';
import { useDispatch } from '@/hooks';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { useFetchOtherUserMutation } from '@/hooks/domain/fetch-user/useFetchUser';
import { useMarkAsSeenMutation } from '@/hooks/domain/mark-as-seen/useMarkAsSeen';
import { reCheckBalance } from '@/hooks/useBalance';
import useBalanceStream from '@/hooks/useBalanceStream';
import { RootState } from '@/store';
import { setSolanaBalance } from '@/store/slices';
import { Images, ImagesDark, useTheme } from '@/theme';
import {
  isImageSourcePropType,
  SafeScreenNavigationProp,
  SafeScreenRouteProp
} from '@/types';
import {
  getInitials,
  getLastSeen,
  heightPercentToDp
} from '@/utils';
import FastImage from "@d11/react-native-fast-image";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import {
  useFocusEffect,
  useNavigation,
  useRoute
} from '@react-navigation/native';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  EmitterSubscription,
  Keyboard,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';

interface IProps {
  messageId?: string;
  groupName?: string;
  type?: string;
  profilePicture?: string;
  lastActive?: number;
  scrollY?: SharedValue<number>;
  membersCount?: number;
  screenName?: string;
  backgroundColor?: string;
  color?: string;
  timeStamp?: number;
  nextAction?: () => void;
  canEditGroup?: boolean;
  botId?: string;
  onlineOffline?: string;
}

/**
 * @author Nitesh Raj Khanal
 * @function @Header
 * @returns JSX.Element
 **/



const Header: FC<IProps> = (props): React.JSX.Element => {
  const { gutters, components, layout, borders, backgrounds, colors } =
    useTheme();

  const dispatch = useDispatch();

  const { data: latestUser } = useFetchLatestUserQuery();
  const navigation = useNavigation<SafeScreenNavigationProp>();
  const solAmount = useSelector((state: RootState) => state.solanaBalance.balance)

  const [mediaCacheUrl, setMediaCacheUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const keyboardDidShowListener = useRef<EmitterSubscription | null>(null);
  const keyboardDidHideListener = useRef<EmitterSubscription | null>(null);
  const [fetchOtherUser] = useFetchOtherUserMutation()


  const { t } = useTranslation(['translations']);

  const route = useRoute<SafeScreenRouteProp>();

  const { price, difference } = useBalanceStream();

  if (
    !isImageSourcePropType(Images.caretLeft) ||
    !isImageSourcePropType(ImagesDark.caretLeft) ||
    !isImageSourcePropType(Images.send) ||
    !isImageSourcePropType(ImagesDark.send) ||
    !isImageSourcePropType(Images.arrowLeft) ||
    !isImageSourcePropType(ImagesDark.arrowLeft) ||
    !isImageSourcePropType(Images.loader) ||
    !isImageSourcePropType(ImagesDark.loader) ||
    !isImageSourcePropType(Images.hamburger) ||
    !isImageSourcePropType(ImagesDark.hamburger) ||
    !isImageSourcePropType(Images.searchIcon) ||
    !isImageSourcePropType(ImagesDark.searchIcon) ||
    !isImageSourcePropType(Images.lensSharp) ||
    !isImageSourcePropType(ImagesDark.lensSharp) ||
    !isImageSourcePropType(Images.editProfileDark) ||
    !isImageSourcePropType(ImagesDark.editProfileDark) ||
    !isImageSourcePropType(Images.arrow_down) ||
    !isImageSourcePropType(ImagesDark.arrow_down) ||
    !isImageSourcePropType(Images.search_dark) ||
    !isImageSourcePropType(ImagesDark.search_dark) ||
    !isImageSourcePropType(Images.sendInHome) ||
    !isImageSourcePropType(ImagesDark.sendInHome) ||
    !isImageSourcePropType(Images.receive) ||
    !isImageSourcePropType(ImagesDark.receive) ||
    !isImageSourcePropType(Images.up) ||
    !isImageSourcePropType(ImagesDark.up) ||
    !isImageSourcePropType(Images.down) ||
    !isImageSourcePropType(ImagesDark.down) ||
    !isImageSourcePropType(Images.chatHeaderYarsha) ||
    !isImageSourcePropType(ImagesDark.chatHeaderYarsha) ||
    !isImageSourcePropType(Images.filter) ||
    !isImageSourcePropType(ImagesDark.filter) ||
    !isImageSourcePropType(Images.arrowRighPrimary) ||
    !isImageSourcePropType(ImagesDark.arrowRighPrimary) ||
    !isImageSourcePropType(Images.headerBack) ||
    !isImageSourcePropType(ImagesDark.headerBack)
  ) {
    throw new Error('Image source is not valid');
  }

  const caretPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(
    () => [heightPercentToDp('50'), heightPercentToDp('50')],
    [],
  );

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

  useEffect(() => {
    const fetchBalance = async () => {
      const response = await reCheckBalance(latestUser?.address || "")
      dispatch(setSolanaBalance(response))
    }

    fetchBalance();
  }, [])


  useEffect(() => {
    keyboardDidShowListener.current = Keyboard.addListener(
      'keyboardWillShow',
      () => {
        setKeyboardVisible(true);
      },
    );

    keyboardDidHideListener.current = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidHideListener.current?.remove();
      keyboardDidShowListener.current?.remove();
    };
  }, []);

  const openSendSOLSlider = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const closeSendSOLSlider = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    // console.log('handleSheetChanges', index);
  }, []);


  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-50);

  useFocusEffect(
    useCallback(() => {
      opacity.value = withTiming(1, { duration: 700 });
      translateY.value = withTiming(0, { duration: 700 });

      return () => {
        opacity.value = withTiming(0, { duration: 700 });
        translateY.value = withTiming(-50, { duration: 700 });
      };
    }, [opacity, translateY]),
  );

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const scrollYValue = props.scrollY?.value ?? 0;

    return {
      shadowColor: 'rgba(47, 63, 87, 0.08)',
      shadowOffset: { width: 0, height: 21 },
      shadowOpacity: withTiming(scrollYValue > 0 ? 1 : 0, { duration: 300 }),
      shadowRadius: 26,
      elevation: withTiming(scrollYValue > 0 ? 10 : 0, { duration: 300 }),
    };
  }, [props.scrollY?.value]);

  useEffect(() => {
    if (WAPAL_MEDIA_CACHE) {
      setMediaCacheUrl(WAPAL_MEDIA_CACHE);
    }
  }, [WAPAL_MEDIA_CACHE, latestUser]);

  const navToSendMoney = useCallback(() => {
    navigation.navigate('PortfolioScreen', {});
  }, [navigation]);

  const [isVisible, setIsVisible] = useState<boolean>(false);


  const toggleModalOn = () => {
    setIsVisible(true);
  }

  const toggleModalOff = () => {
    setIsVisible(false);
  }

  const token = useSelector((state: RootState) => state.accessToken.authToken)

  const [seenMessage] = useMarkAsSeenMutation()

  return (
    <>
      <Animated.View
        style={[
          route.name !== "MessageScreen" ? layout.z1 : { zIndex: 1000 },
          gutters.padding_4,
          route.name === 'MessageScreen' && components.headerBottom,
          route.name === 'EnterAmountScreen' && components.headerBottom,
          shadowStyle
        ]}>
        {
          route.name !== 'ChatsScreen' &&
            route.name !== 'SettingsScreen' &&
            route.name !== 'ContactsScreen' &&
            route.name !== 'PortfolioScreen' &&
            route.name !== 'MessageScreen' &&
            route.name !== 'EnterAmountScreen' &&
            route.name !== 'CreateGroupScreen' &&
            route.name !== 'SetGroupScreen' &&
            route.name !== 'EditProfileScreen' &&
            route.name !== 'GroupDetailsScreen' &&
            route.name !== 'PrivateMessageScreen' &&
            route.name !== 'PinnedMessageScreen' &&
            route.name !== 'QRCodeScreen' &&
            route.name !== 'HistoryScreen' &&
            route.name !== 'EditGroupScreen' &&
            route.name !== 'MembersScreen' &&
            route.name !== 'AddAdminsScreen' &&
            route.name !== 'SendMoney' &&
            route.name !== "SearchScreen" &&
            route.name !== "AddAdminConfirmation" &&
            route.name !== "BotMessage" &&
            route.name !== "BotMessageScreen" &&
            route.name !== 'AddMembers' &&
            route.name !== "DeleteAccount" &&
            route.name !== 'TermsAndCondition' &&
            route.name !== 'PrivacyPolicy' ? (
            <ButtonVariant onPress={caretPress}>
              <ImageVariant
                source={Images.caretLeft}
                sourceDark={ImagesDark.caretLeft}
                style={components.iconSize24}
              />
            </ButtonVariant>
          ) : route.name === 'ChatsScreen' ? (
            <View style={[layout.z10, backgrounds.white]}>
              <View
                style={[
                  layout.row,
                  layout.itemsCenter,
                  layout.justifyBetween,
                  gutters.paddingHorizontal_10,
                ]}>
                <View style={[layout.row, layout.justifyStart]}>
                  <ButtonVariant
                    onPress={() => navigation.navigate('SettingsScreen')}
                    style={[
                      layout.row,
                      layout.itemsCenter,
                      layout.justifyBetween,
                    ]}>
                    {(latestUser?.profilePicture) && mediaCacheUrl ? (
                      <FastImage
                        source={
                          { uri: latestUser?.profilePicture }
                        }
                        style={[
                          components.iconSize24,
                          gutters.marginRight_10,
                          borders.rounded_500,
                        ]}
                      />
                    ) : latestUser?.fullName ? (
                      <View
                        style={[
                          components.iconSize24,
                          gutters.marginRight_10,
                          borders.rounded_500,
                          { backgroundColor: latestUser.backgroundColor },
                          layout.itemsCenter,
                          layout.justifyCenter,
                        ]}>
                        <TextVariant style={[components.urbanist16SemiBoldWhite]}>
                          {getInitials(latestUser?.fullName)}
                        </TextVariant>
                      </View>
                    ) : null}
                    <View style={[layout.justifyCenter]}>
                      <TextVariant style={[components.urbanist14SemiBoldBlack]}>
                        {latestUser?.fullName?.split(' ')[0] ||
                          latestUser?.username?.split(' ')[0]}
                      </TextVariant>
                    </View>
                  </ButtonVariant>

                  {Images.arrow_down && ImagesDark.arrow_down && (
                    <ButtonVariant
                      hitSlop={{
                        top: 12,
                        right: 12,
                        bottom: 12,
                        left: 12,
                      }}
                      style={[
                        layout.itemsCenter,
                        layout.justifyCenter,
                        gutters.marginLeft_12,
                      ]}
                      onPress={navToSendMoney}>
                      <ImageVariant
                        source={Images.arrow_down}
                        sourceDark={ImagesDark.arrow_down}
                        style={[components.iconDown, gutters.marginLeft_6]}
                      />
                    </ButtonVariant>
                  )}
                </View>
              </View>

              <View
                style={[
                  layout.row,
                  layout.itemsCenter,
                  layout.justifyBetween,
                  gutters.paddingHorizontal_10,
                  gutters.marginVertical_10,
                ]}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('PortfolioScreen', {});
                  }}>
                  <View style={[layout.row, layout.itemsCenter]}>
                    <TextVariant style={[components.urbanist14RegularPrimary]}>
                      {t('protfolioBalance')}
                    </TextVariant>
                    <ImageVariant
                      source={Images.arrowRighPrimary}
                      sourceDark={ImagesDark.arrowRighPrimary}
                      style={[components.iconSize12]}
                    />
                  </View>
                  <View
                    style={[layout.row, layout.itemsCenter, layout.justifyStart]}>
                    <TextVariant style={[components.urbanist16SemiBoldDark]}>
                      $ {price?.solToUsd !== undefined ? Number((solAmount ?? 0) * Number(price.solToUsd)).toFixed(2) : '0.00'}
                    </TextVariant>
                    {
                      (difference !== null && difference !== 0) && (
                        <View
                          style={[
                            layout.row,
                            layout.itemsCenter,
                            layout.justifyStart,
                            gutters.marginLeft_10
                          ]}>
                          <ImageVariant
                            source={difference.toString().includes("-") ? Images.down : Images.up}
                            sourceDark={difference.toString().includes("-") ? ImagesDark.down : ImagesDark.up}
                            style={[components.iconSize20]}
                            resizeMode="cover"
                          />
                          <TextVariant style={[difference.toString().includes("-") ? components.urbanist12BoldDecrease : components.urbanist12BoldIncrease]}>
                            {difference !== null ? `${difference.toFixed(3)}%` : '0.00%'}
                          </TextVariant>
                        </View>
                      )
                    }
                  </View>
                </TouchableOpacity>

                <View style={[layout.row, layout.itemsCenter, layout.justifyEnd]}>
                  <ButtonVariant
                    onPress={() => {
                      navigation.navigate('QRCodeScreen');
                    }}
                    style={[
                      layout.row,
                      layout.itemsCenter,
                      layout.justifyBetween,
                      backgrounds.sendReceiveBg,
                      gutters.paddingVertical_14,
                      gutters.paddingHorizontal_10,
                      borders.rounded_10,
                      gutters.marginRight_10,
                    ]}>
                    <View style={[components.iconSize10, gutters.marginRight_8]}>
                      <ImageVariant
                        source={Images.receive}
                        sourceDark={ImagesDark.receive}
                        style={[layout.fullHeight, layout.fullWidth]}
                        resizeMode="contain"
                      />
                    </View>
                    <TextVariant style={[components.urbanist14RegularBlack]}>
                      {t('receive')}
                    </TextVariant>
                  </ButtonVariant>
                  <ButtonVariant
                    onPress={() => {
                      navigation.navigate('PortfolioScreen', {});
                    }}
                    style={[
                      layout.row,
                      layout.itemsCenter,
                      layout.justifyBetween,
                      backgrounds.sendReceiveBg,
                      gutters.paddingVertical_14,
                      gutters.paddingHorizontal_10,
                      borders.rounded_10,
                    ]}>
                    <View style={[components.iconSize10, gutters.marginRight_8]}>
                      <ImageVariant
                        source={Images.sendInHome}
                        sourceDark={ImagesDark.sendInHome}
                        style={[layout.fullHeight, layout.fullWidth]}
                        resizeMode="contain"
                      />
                    </View>
                    <TextVariant style={[components.urbanist14RegularBlack]}>
                      {t('send')}
                    </TextVariant>
                  </ButtonVariant>
                </View>
              </View>
            </View>
          ) : route.name === 'MessageScreen' ? (
            <View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <ImageVariant
                source={Images.chatHeaderYarsha}
                sourceDark={ImagesDark.chatHeaderYarsha}
                style={[components.imageSize80, layout.absolute, layout.right0]}
                resizeMode="contain"
              />
              <View
                style={[layout.row, layout.itemsCenter]}>
                <ButtonVariant
                  style={[{ width: "5%" }]}
                  onPress={() => {
                    setTimeout(async () => {
                      const RequestPayload = {
                        chatId: props.messageId || "",
                      }
                      await seenMessage(RequestPayload).unwrap();
                    }, 100)
                    navigation.pop()
                  }}
                  hitSlop={{
                    top: 20,
                    bottom: 20,
                    right: 20,
                    left: 20,
                  }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={[components.iconSize24]}
                  />
                </ButtonVariant>
                <ButtonVariant
                  style={[
                    layout.row,
                    layout.itemsCenter,
                    gutters.marginLeft_20,
                    { width: "75%" }
                  ]}
                  onPress={() => {
                    if (props.type === 'group' || props.type === 'community') {
                      navigation.navigate('GroupDetailsScreen', {
                        groupId: props.messageId as string,
                        groupName: props.groupName as string,
                      });
                    }
                  }}>
                  {props.profilePicture ? (
                    <View>
                      <FastImage
                        source={{
                          uri: `${props.profilePicture}`,
                        }}
                        style={[
                          components.iconSize34,
                          gutters.marginRight_2,
                          borders.rounded_500,
                        ]}
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        components.iconSize34,
                        gutters.marginRight_2,
                        borders.rounded_500,
                        {
                          backgroundColor: props.backgroundColor,
                        },
                        layout.itemsCenter,
                        layout.justifyCenter,
                      ]}>
                      <TextVariant style={[components.urbanist18BoldWhite]}>
                        {getInitials(props.groupName as string)}
                      </TextVariant>
                    </View>
                  )}
                  <View style={[gutters.marginLeft_10]}>
                    <TextVariant style={[components.urbanist18SemiBoldDark]} numberOfLines={1} ellipsizeMode='tail'>
                      {props.groupName}
                    </TextVariant>
                    {props.membersCount && (
                      <TextVariant style={[components.urbanist12RegularDate]}>
                        {props.membersCount} {t('members')}
                      </TextVariant>
                    )}
                  </View>
                </ButtonVariant>
              </View>
              <View
                style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
                <ButtonVariant>
                  <ImageVariant
                    source={Images.searchIcon}
                    sourceDark={ImagesDark.searchIcon}
                    style={[components.iconSize24, gutters.marginRight_10]}
                  />
                </ButtonVariant>
                <ButtonVariant>
                  <ImageVariant
                    source={Images.hamburger}
                    sourceDark={ImagesDark.hamburger}
                    style={[components.iconSize24]}
                  />
                </ButtonVariant>
              </View>
            </View>
          ) : route.name === 'PrivateMessageScreen' ? (
            <View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <ImageVariant
                source={Images.chatHeaderYarsha}
                sourceDark={ImagesDark.chatHeaderYarsha}
                style={[components.imageSize80, layout.absolute, layout.right0]}
                resizeMode="contain"
              />

              <View
                style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
                <ButtonVariant
                  onPress={() => {
                    setTimeout(async () => {
                      const RequestPayload = {
                        chatId: props.messageId || "",
                      }
                      await seenMessage(RequestPayload).unwrap();
                    }, 100)
                    navigation.pop()
                  }}
                  hitSlop={{
                    top: 20,
                    bottom: 20,
                    right: 20,
                    left: 20,
                  }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={[components.iconSize24]}
                  />
                </ButtonVariant>
                <ButtonVariant
                  style={[
                    layout.row,
                    layout.itemsCenter,
                    layout.justifyBetween,
                    gutters.marginLeft_20,
                  ]}
                  onPress={async () => {
                    if (props.type === 'group' || props.type === 'community') {
                      navigation.navigate('GroupDetailsScreen', {
                        groupId: props.messageId as string,
                        groupName: props.groupName as string,
                      });
                    } else {
                      const otherUsers = await fetchOtherUser({ userId: props.messageId as string, authToken: token }).unwrap()
                      navigation.navigate('ProfileDetails', {
                        Id: otherUsers.Response.Id,
                        Address: otherUsers.Response.Address,
                        ProfilePicture: otherUsers.Response.ProfilePicture,
                        FullName: otherUsers.Response.FullName,
                        UserBio: otherUsers.Response.UserBio,
                        Username: otherUsers.Response.Username,
                        BackgroundColor: otherUsers.Response.BackgroundColor,
                      });
                    }
                  }}>
                  {props.profilePicture ? (
                    <>
                      <FastImage
                        source={{
                          uri: `${(WAPAL_MEDIA_CACHE as string) + props.profilePicture}`,
                        }}
                        style={[
                          components.iconSize34,
                          gutters.marginRight_2,
                          borders.rounded_500,
                        ]}
                      />
                    </>
                  ) : (
                    <>
                      <View
                        style={[
                          components.iconSize34,
                          gutters.marginRight_2,
                          borders.rounded_500,
                          { backgroundColor: props.backgroundColor },
                          layout.itemsCenter,
                          layout.justifyCenter,
                        ]}>
                        <TextVariant style={[components.urbanist18BoldWhite]}>
                          {getInitials(props.groupName as string)}
                        </TextVariant>
                      </View>
                    </>
                  )}

                  <View>
                    <TextVariant
                      style={[
                        components.urbanist18SemiBoldDark,
                        gutters.marginLeft_10,
                      ]}>
                      {props.groupName}
                    </TextVariant>
                    {props.type === 'individual' && (
                      <TextVariant
                        style={[
                          components.urbanist12RegularBlack,
                          gutters.marginLeft_10,
                        ]}>
                        {props.onlineOffline === "online" ? props.onlineOffline : getLastSeen(Number(props.lastActive))}
                      </TextVariant>
                    )}
                  </View>
                </ButtonVariant>
              </View>
              <View
                style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
                <ButtonVariant>
                  <ImageVariant
                    source={Images.searchIcon}
                    sourceDark={ImagesDark.searchIcon}
                    style={[components.iconSize24, gutters.marginRight_10]}
                  />
                </ButtonVariant>
                <ButtonVariant>
                  <ImageVariant
                    source={Images.hamburger}
                    sourceDark={ImagesDark.hamburger}
                    style={[components.iconSize24]}
                  />
                </ButtonVariant>
              </View>
            </View>
          ) : route.name === 'BotMessageScreen' ? (
            <View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <ImageVariant
                source={Images.chatHeaderYarsha}
                sourceDark={ImagesDark.chatHeaderYarsha}
                style={[components.imageSize80, layout.absolute, layout.right0]}
                resizeMode="contain"
              />

              <View
                style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
                <ButtonVariant
                  onPress={() => {
                    setTimeout(async () => {
                      const RequestPayload = {
                        chatId: props.botId || "",
                      }
                      await seenMessage(RequestPayload).unwrap();
                    }, 100)
                    navigation.pop()
                  }}
                  hitSlop={{
                    top: 20,
                    bottom: 20,
                    right: 20,
                    left: 20,
                  }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={[components.iconSize24]}
                  />
                </ButtonVariant>
                <ButtonVariant
                  style={[
                    layout.row,
                    layout.itemsCenter,
                    layout.justifyBetween,
                    gutters.marginLeft_20,
                  ]}
                  onPress={async () => {
                    navigation.navigate("BotDescription", {
                      botId: props.botId || ""
                    })
                  }}>
                  {props.profilePicture ? (
                    <>
                      <FastImage
                        source={{
                          uri: `${(WAPAL_MEDIA_CACHE as string) + props.profilePicture}`,
                        }}
                        style={[
                          components.iconSize34,
                          gutters.marginRight_2,
                          borders.rounded_500,
                        ]}
                      />
                    </>
                  ) : (
                    <>
                      <View
                        style={[
                          components.iconSize34,
                          gutters.marginRight_2,
                          borders.rounded_500,
                          { backgroundColor: props.backgroundColor },
                          layout.itemsCenter,
                          layout.justifyCenter,
                        ]}>
                        <TextVariant style={[components.urbanist18BoldWhite]}>
                          {getInitials(props.groupName as string)}
                        </TextVariant>
                      </View>
                    </>
                  )}

                  <View>
                    <TextVariant
                      style={[
                        components.urbanist18SemiBoldDark,
                        gutters.marginLeft_10,
                      ]}>
                      {props.groupName}
                    </TextVariant>

                    <TextVariant
                      style={[
                        components.urbanist12RegularBlack,
                        gutters.marginLeft_10,
                      ]}>
                      {t("online")}
                    </TextVariant>
                  </View>
                </ButtonVariant>
              </View>
              <View
                style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
                <ButtonVariant>
                  <ImageVariant
                    source={Images.searchIcon}
                    sourceDark={ImagesDark.searchIcon}
                    style={[components.iconSize24, gutters.marginRight_10]}
                  />
                </ButtonVariant>
                <ButtonVariant>
                  <ImageVariant
                    source={Images.hamburger}
                    sourceDark={ImagesDark.hamburger}
                    style={[components.iconSize24]}
                  />
                </ButtonVariant>
              </View>
            </View>
          ) : route.name === 'GroupDetailsScreen' ? (
            <View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View style={[layout.row, layout.itemsCenter]}>
                <ButtonVariant
                  onPress={() => {
                    // dispatch(clearMessagesInStore());
                    caretPress();
                  }}
                  hitSlop={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <TextVariant
                  style={[
                    components.urbanist18SemiBoldDark,
                    gutters.marginLeft_20,
                  ]}>
                  {t('groupDetail')}
                </TextVariant>
              </View>
              {props.canEditGroup && <ButtonVariant
                onPress={() => {
                  Keyboard.dismiss();
                  navigation.navigate('EditGroupScreen', {
                    groupId: props.messageId as string,
                    groupName: props.groupName as string,
                  });
                }}>
                <ImageVariant
                  source={Images.editProfileDark}
                  sourceDark={ImagesDark.editProfileDark}
                  style={[components.iconSize24]}
                  tintColor={colors.dark}
                />
              </ButtonVariant>}
            </View>
          ) : route.name === 'ContactsScreen' ? (
            <View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <TextVariant style={[components.urbanist24semiBoldBlack]}>
                {t('contact')}
              </TextVariant>
            </View>
          ) : route.name === 'PortfolioScreen' ? (
            <View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View style={[layout.row, layout.itemsCenter]}>
                <ButtonVariant
                  onPress={() => navigation.pop()}
                  hitSlop={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <TextVariant
                  style={[
                    components.urbanist18SemiBoldDark,
                    gutters.marginLeft_20,
                  ]}>
                  {t('myPortfolio')}
                </TextVariant>
              </View>
              {isKeyboardVisible && (
                <ButtonVariant
                  onPress={() => {
                    Keyboard.dismiss();
                  }}>
                  <TextVariant style={[components.urbanist16BoldPrimary]}>
                    {t('next')}
                  </TextVariant>
                </ButtonVariant>
              )}
            </View>
          ) : route.name === 'EnterAmountScreen' ? (
            <View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View style={[layout.row, layout.itemsCenter]}>
                <ButtonVariant
                  onPress={caretPress}
                  hitSlop={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <TextVariant
                  style={[
                    components.urbanist18SemiBoldDark,
                    gutters.marginLeft_20,
                  ]}>
                  {t('enterAmount')}
                </TextVariant>
              </View>
              {isKeyboardVisible && (
                <ButtonVariant
                  onPress={() => {
                    Keyboard.dismiss();
                  }}>
                  <TextVariant style={[components.urbanist16BoldPrimary]}>
                    {t('next')}
                  </TextVariant>
                </ButtonVariant>
              )}
            </View>
          ) : route.name === 'QRCodeScreen' ? (
            <View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View
                style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
                <ButtonVariant
                  onPress={caretPress}
                  hitSlop={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={[components.iconSize24]}
                  />
                </ButtonVariant>
                <TextVariant
                  style={[
                    components.urbanist18SemiBoldDark,
                    components.textCenter,
                    layout.flex_1,
                  ]}>
                  {t('receive')}
                </TextVariant>
                <View style={[components.iconSize24]} />
              </View>
            </View>
          ) : route.name === 'EditProfileScreen' ? (
            <View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View
                style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
                <ButtonVariant
                  onPress={caretPress}
                  hitSlop={{
                    top: 30,
                    right: 30,
                    bottom: 30,
                    left: 30,
                  }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={[components.iconSize24]}
                  />
                </ButtonVariant>
                <TextVariant
                  style={[
                    components.urbanist18SemiBoldDark,
                    components.textCenter,
                    layout.flex_1,
                  ]}>
                  {t('edit')}
                </TextVariant>
                <View style={[components.iconSize24]} />
              </View>
            </View>
          ) : route.name === 'CreateGroupScreen' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                // animatedHeaderStyle,
                gutters.padding_4,
              ]}>
              <View style={[layout.row, layout.itemsCenter, layout.justifyBetween, layout.fullWidth]}>
                <ButtonVariant
                  onPress={() => navigation.goBack()}
                  hitSlop={{
                    bottom: 20,
                    top: 20,
                    left: 20,
                    right: 20,
                  }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <View style={[layout.itemsSelfCenter]}>
                  <TextVariant style={[components.urbanist18SemiBoldDark, { textAlign: "center" }]}>
                    {t('newGroup')}
                  </TextVariant>
                  <TextVariant style={[components.urbanist12RegularBlack, { textAlign: "center" }]}>
                    {props.membersCount
                      ? props.membersCount + ' ' + t('of500000')
                      : t('upto500000').toLowerCase()}
                  </TextVariant>
                </View>
                {(isKeyboardVisible && props.membersCount && props.membersCount > 0) ? (
                  <ButtonVariant
                    style={[layout.width35]}
                    onPress={() => {
                      if (props.nextAction) {
                        props.nextAction();
                      }
                    }}>
                    <TextVariant style={[components.urbanist16BoldPrimary]}>
                      {t('next')}
                    </TextVariant>
                  </ButtonVariant>
                ) :
                  <View style={[layout.width35]} />
                }
              </View>
            </Animated.View>
          ) : route.name === 'SetGroupScreen' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                // animatedHeaderStyle,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View style={[layout.row, layout.itemsCenter, layout.justifyBetween, layout.fullWidth]}>
                <ButtonVariant
                  onPress={() => navigation.goBack()}
                  hitSlop={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <TextVariant
                  style={[
                    components.urbanist18SemiBoldDark,
                    gutters.marginLeft_10,
                  ]}>
                  {t('newGroup')}
                </TextVariant>
                <View style={[layout.width30px]} />
              </View>
            </Animated.View>
          ) : route.name === 'HistoryScreen' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                // animatedHeaderStyle,
                gutters.paddingVertical_10,
              ]}>
              <View
                style={[
                  layout.row,
                  layout.itemsCenter,
                  layout.justifyBetween,
                  layout.fullWidth,
                ]}>
                <View style={[layout.row, layout.itemsCenter]}>
                  <TextVariant
                    style={[
                      components.urbanist24semiBoldBlack,
                      gutters.marginLeft_10,
                    ]}>
                    {t('history')}
                  </TextVariant>
                </View>
                <ButtonVariant>
                  <ImageVariant
                    source={Images.filter}
                    sourceDark={ImagesDark.filter}
                    style={[components.iconSize24, gutters.marginRight_10]}
                  />
                </ButtonVariant>
              </View>
            </Animated.View>
          ) : route.name === 'PinnedMessageScreen' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.paddingVertical_10,
                gutters.paddingHorizontal_10
              ]}>
              <View
                style={[
                  layout.row,
                  layout.itemsCenter,
                  layout.justifyBetween,
                  layout.fullWidth,
                ]}>
                <ButtonVariant onPress={() => navigation.goBack()}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <View style={[layout.row, layout.itemsCenter]}>
                  <TextVariant
                    style={[
                      components.urbanist24semiBoldBlack,
                      gutters.marginLeft_10,
                    ]}>
                    {t('pinnedMessages')}
                  </TextVariant>
                </View>
                <View style={[components.iconSize24]} />

              </View>
            </Animated.View>
          ) : route.name === 'EditGroupScreen' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View
                style={[
                  layout.row,
                  layout.itemsCenter,
                  layout.justifyBetween,
                  layout.fullWidth,
                ]}>
                <ButtonVariant onPress={() => navigation.goBack()}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <View style={[layout.row, layout.itemsCenter]}>
                  <TextVariant style={[components.urbanist18SemiBoldDark]}>
                    {t('editGroup')}
                  </TextVariant>
                </View>
                <View style={[components.iconSize24, gutters.marginRight_10]} />
              </View>
            </Animated.View>
          ): route.name === 'DeleteAccount' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View
                style={[
                  layout.row,
                  layout.itemsCenter,
                  layout.justifyBetween,
                  layout.fullWidth,
                ]}>
                <ButtonVariant onPress={() => navigation.goBack()}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <View style={[layout.row, layout.itemsCenter]}>
                  <TextVariant style={[components.urbanist18SemiBoldDark]}>
                    {t('confirmation')}
                  </TextVariant>
                </View>
                <View style={[components.iconSize24, gutters.marginRight_10]} />
              </View>
            </Animated.View>
          ) : route.name === 'MembersScreen' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                // animatedHeaderStyle,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View
                style={[
                  layout.row,
                  layout.itemsCenter,
                  layout.justifyBetween,
                  layout.fullWidth,
                ]}>
                <ButtonVariant onPress={() => navigation.goBack()}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <View style={[layout.row, layout.itemsCenter]}>
                  <TextVariant style={[components.urbanist18SemiBoldDark]}>
                    {props.screenName}
                  </TextVariant>
                </View>
                <View style={[components.iconSize24, gutters.marginRight_10]} />
              </View>
            </Animated.View>
          ) : route.name === 'AddAdminsScreen' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                // animatedHeaderStyle,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View
                style={[
                  layout.row,
                  layout.itemsCenter,
                  layout.justifyBetween,
                  layout.fullWidth,
                ]}>
                <ButtonVariant onPress={() => navigation.goBack()}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <View style={[layout.row, layout.itemsCenter]}>
                  <TextVariant style={[components.urbanist18SemiBoldDark]}>
                    {t("addAdministrators")}
                  </TextVariant>
                </View>
                <View style={[components.iconSize24, gutters.marginRight_10]} />
              </View>
            </Animated.View>
          ) : route.name === 'AddAdminConfirmation' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                // animatedHeaderStyle,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View
                style={[
                  layout.row,
                  layout.itemsCenter,
                  layout.justifyBetween,
                  layout.fullWidth,
                ]}>
                <ButtonVariant onPress={() => navigation.goBack()}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <View style={[layout.row, layout.itemsCenter]}>
                  <TextVariant style={[components.urbanist18SemiBoldDark]}>
                    {t("addAdministrators")}
                  </TextVariant>
                </View>
                <View style={[components.iconSize24, gutters.marginRight_10]} />
              </View>
            </Animated.View>
          ) : route.name === 'AddMembers' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                // animatedHeaderStyle,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View style={[layout.row, layout.itemsCenter]}>
                <ButtonVariant onPress={() => navigation.goBack()}>
                  <ImageVariant
                    source={Images.caretLeft}
                    sourceDark={ImagesDark.caretLeft}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <View style={[gutters.marginLeft_10]}>
                  <TextVariant style={[components.urbanist18SemiBoldDark]}>
                    {t('addMembers')}
                  </TextVariant>
                  <TextVariant style={[components.urbanist12RegularBlack]}>
                    {props.membersCount
                      ? props.membersCount + ' ' + t('of500000')
                      : t('upto500000').toLowerCase()}
                  </TextVariant>
                </View>
              </View>
            </Animated.View>
          ) : route.name === 'SendMoney' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                // animatedHeaderStyle,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View style={[layout.row, layout.itemsCenter]}>
                <ButtonVariant
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 20, bottom: 20, right: 20, left: 20 }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
              </View>

              <View
                style={[
                  layout.absoluteFill,
                  layout.itemsCenter,
                  layout.justifyCenter,
                ]}>
                <TextVariant style={[components.urbanist18SemiBoldDark]}>
                  {t('sendMoney')}
                </TextVariant>
              </View>
            </Animated.View>
          ) : route.name === 'BotMessage' ? (
            <View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View
                style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
                <ButtonVariant
                  onPress={() => navigation.pop()}
                  hitSlop={{
                    top: 20,
                    bottom: 20,
                    right: 20,
                    left: 20,
                  }}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={[components.iconSize24]}
                  />
                </ButtonVariant>
                <ButtonVariant
                  style={[
                    layout.row,
                    layout.itemsCenter,
                    layout.justifyBetween,
                    gutters.marginLeft_20,
                  ]}
                  onPress={async () => {

                  }}>
                  {props.profilePicture ? (
                    <>
                      <FastImage
                        source={{
                          uri: props.profilePicture,
                        }}
                        style={[
                          components.iconSize34,
                          gutters.marginRight_2,
                          borders.rounded_500,
                        ]}
                      />
                    </>
                  ) : (
                    <>
                      <View
                        style={[
                          components.iconSize34,
                          gutters.marginRight_2,
                          borders.rounded_500,
                          { backgroundColor: props.backgroundColor },
                          layout.itemsCenter,
                          layout.justifyCenter,
                        ]}>
                        <TextVariant style={[components.urbanist18BoldWhite]}>
                          {getInitials(props.groupName as string)}
                        </TextVariant>
                      </View>
                    </>
                  )}

                  <View>
                    <TextVariant
                      style={[
                        components.urbanist18SemiBoldDark,
                        gutters.marginLeft_10,
                      ]}>
                      {props.groupName}
                    </TextVariant>
                  </View>
                </ButtonVariant>
              </View>
            </View>
          ) : route.name === "SearchScreen" ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}
            >
              <View style={[layout.row, layout.itemsCenter]}>
                <ButtonVariant
                  onPress={() => navigation.navigate('ChatsScreen')}
                  hitSlop={{ top: 20, bottom: 20, right: 20, left: 20 }}
                >
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
              </View>

              <View style={[layout.absoluteFill, layout.itemsCenter, layout.justifyCenter]}>
                <View style={[layout.row, layout.itemsCenter]}>
                  <ImageVariant
                    source={Images.aiBasedSearch}
                    sourceDark={ImagesDark.aiBasedSearch}
                    style={[components.iconSize28, { marginLeft: -2 }]}
                  />
                  <TextVariant style={[components.urbanist18SemiBoldPrimary]}>
                    {t('aIBasedSearch')}
                  </TextVariant>
                </View>
              </View>

              <ButtonVariant onPress={toggleModalOn}>
                <ImageVariant
                  source={Images.hamburgerSearch}
                  sourceDark={ImagesDark.hamburgerSearch}
                  style={[components.iconSize32]}
                />
              </ButtonVariant>
            </Animated.View>

          ) : route.name === 'TermsAndCondition' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                // animatedHeaderStyle,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View
                style={[
                  layout.row,
                  layout.itemsCenter,
                  layout.justifyBetween,
                  layout.fullWidth,
                ]}>
                <ButtonVariant onPress={() => navigation.goBack()}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <View style={[layout.row, layout.itemsCenter]}>
                  <TextVariant style={[components.urbanist18SemiBoldDark]}>
                    {t('Terms&cond')}
                  </TextVariant>
                </View>
                <View style={[components.iconSize24, gutters.marginRight_10]} />
              </View>
            </Animated.View>
          ) : route.name === 'PrivacyPolicy' ? (
            <Animated.View
              style={[
                layout.row,
                layout.itemsCenter,
                layout.justifyBetween,
                // animatedHeaderStyle,
                gutters.padding_4,
                gutters.paddingVertical_10,
              ]}>
              <View
                style={[
                  layout.row,
                  layout.itemsCenter,
                  layout.justifyBetween,
                  layout.fullWidth,
                ]}>
                <ButtonVariant onPress={() => navigation.goBack()}>
                  <ImageVariant
                    source={Images.headerBack}
                    sourceDark={ImagesDark.headerBack}
                    style={components.iconSize24}
                  />
                </ButtonVariant>
                <View style={[layout.row, layout.itemsCenter]}>
                  <TextVariant style={[components.urbanist18SemiBoldDark]}>
                    {t('privacyPolicy')}
                  </TextVariant>
                </View>
                <View style={[components.iconSize24, gutters.marginRight_10]} />
              </View>
            </Animated.View>
          ) : null}
      </Animated.View>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={2}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        enableDismissOnClose
        enablePanDownToClose={true}
        backgroundStyle={[backgrounds.white, borders.roundedTop_20]}
        handleIndicatorStyle={[layout.width40, backgrounds.cream]}>
        <BottomSheetView
          style={[
            layout.itemsSelfCenter,
            layout.fullWidth,
            gutters.paddingHorizontal_14,
          ]}>
          <TextVariant
            style={[components.urbanist20BoldBlack, gutters.marginBottom_20]}>
            {t('sendMoney')}
          </TextVariant>

          <SearchBar
            searchQuery={searchQuery}
            onChangeSearchQuery={value => {
              setSearchQuery(value);
            }}
            placeholder={t('userNameOrSolWallet')}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
};

export default React.memo(Header);
