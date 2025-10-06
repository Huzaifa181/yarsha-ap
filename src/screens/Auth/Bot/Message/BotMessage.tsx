import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { SafeScreen } from '@/components/template';
import { useRecentPicksPersistence } from '@/components/template/EmojiKeyboard/src';
import { EmojiKeyboard } from '@/components/template/EmojiKeyboard/src/EmojiKeyboard';
import MessageRepository from '@/database/repositories/Message.repository';
import { useAddMessageMutation, useBotDetailsMutation, useGetBotCommandsMutation } from '@/hooks/domain';
import { useFetchAllMessagesQuery } from '@/hooks/domain/db-messages/useDbMessages';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { useFetchMessagesMutation } from '@/hooks/domain/fetch-messages/useFetchMessages';
import { useGeneratePeerChatMutation } from '@/hooks/domain/individual-chat/individualChats';
import { CheckIndividualChatRequestWrapper } from '@/pb/groupchat';
import { SendMessageRequest } from '@/pb/message';
import { MessageServiceClient } from '@/pb/message.client';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { RootState } from '@/store';
import { Images, ImagesDark, useTheme } from '@/theme';
import {
  isImageSourcePropType,
  MessageType,
  SafeScreenNavigationProp,
  SafeScreenRouteProp,
} from '@/types';
import {
  createSections
} from '@/utils';
import { IsBlinkUrl } from '@/utils/blinks';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import {
  BottomSheetModal
} from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import moment from 'moment';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  ListRenderItem,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  SectionList,
  StyleSheet,
  TextInput,
  TextInputContentSizeChangeEventData,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import NativeAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import Realm from 'realm';
import MessageItem from '../../Message/Shared/MessageItem';
import FastImage from '@d11/react-native-fast-image';
import Animated from 'react-native-reanimated';

interface IProps { }

/**
 * @author Nitesh Raj Khanal
 * @function @PrivateMessage
 **/

const MessageClient = new MessageServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

const BotMessage: FC<IProps> = props => {
  const navigation = useNavigation<SafeScreenNavigationProp>();

  const sectionListRef = useRef(null);

  const { layout, gutters, components, borders, backgrounds, colors } =
    useTheme();

  const token = useSelector((state: RootState) => state.accessToken.authToken);

  const [generatePeerChat] = useGeneratePeerChatMutation();

  const messageInputRef = useRef<TextInput>(null);
  const sentToBottomSheetModalRef = useRef<BottomSheetModal>(null);
  const blinkBottomSheetModalRef = useRef<BottomSheetModal>(null);

  const [blinksData, setBlinksData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const [getBotCommands, setBotCommands] = useState<{
    id: string;
    command: string;
    description: string;
  }[]>([]);

  console.log("getBotCommands", getBotCommands);

  const { data: latestUser } = useFetchLatestUserQuery()
  const [addMessage] = useAddMessageMutation()
  const [botsCommands] = useGetBotCommandsMutation()

  // const inputWidth = useSharedValue(100);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const route = useRoute<
    SafeScreenRouteProp & {
      params: {
        messageId: string;
        tokenSymbol: string;
        name: string;
        type: string;
        profilePicture: string;
        actionUrl: string;
        transactionId: string;
        recipientAddress: string;
        chatId: string;
        amount: number;
        lastActive: number;
        backgroundColor: string;
        color: string;
        timeStamp: number | undefined;
        botId: string;
      };
    }
  >();

  const {
    messageId,
    chatId: chatIdInParams,
    name,
    tokenSymbol,
    type,
    profilePicture,
    actionUrl,
    transactionId,
    amount,
    lastActive,
    recipientAddress: recipientAddressInProps,
    backgroundColor,
    color,
    timeStamp,
    botId,
  } = route.params;

  console.log("botId", botId);

  const translateY = useSharedValue(200);
  const opacity = useSharedValue(0);

  const [chatId, setChatId] = useState<string>('');
  const [solAmount, setSolAmount] = useState<string>('0');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [recipientId, setRecipientId] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [messageToSend, setMessageToSend] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const [showBotCommands, setShowBotCommands] = useState(false);
  const [localUserInfo, setUserInfo] = useState<{
    username: string;
    id: string;
    status: string;
    chats: {
      chatId: string;
      groupIcon: string;
      memberCount: number;
      name: string;
    }[];
    profilePicture: string;
    address: string;
    backgroundColor?: string;
    color?: string;
  }>({
    address: '',
    chats: [
      {
        chatId: '',
        groupIcon: '',
        memberCount: 0,
        name: '',
      },
    ],
    id: '',
    profilePicture: '',
    status: '',
    username: '',
    backgroundColor: '',
    color: '',
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

  const [fetchDetails, { data: botDetails }] = useBotDetailsMutation();

  useEffect(() => {
    const fetchBotInfo = async () => {
      const response = await fetchDetails({ botId: botId }).unwrap()

      console.log("Bot details response =>", response)
    }

    fetchBotInfo()
  }, [])

  const { data: allMessages } = useFetchAllMessagesQuery({
    chatId
  }, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });
  const [fetchMessages] = useFetchMessagesMutation()

  const [isMultiline, setIsMultiline] = useState(false);

  const imageScale = useSharedValue(1);

  if (
    !isImageSourcePropType(Images.clip) ||
    !isImageSourcePropType(ImagesDark.clip) ||
    !isImageSourcePropType(Images.emoji) ||
    !isImageSourcePropType(ImagesDark.emoji) ||
    !isImageSourcePropType(Images.sendMessage) ||
    !isImageSourcePropType(ImagesDark.sendMessage) ||
    !isImageSourcePropType(Images.background) ||
    !isImageSourcePropType(ImagesDark.background) ||
    !isImageSourcePropType(Images.arrowLeft) ||
    !isImageSourcePropType(ImagesDark.arrowLeft) ||
    !isImageSourcePropType(Images.gif) ||
    !isImageSourcePropType(ImagesDark.gif) ||
    !isImageSourcePropType(Images.emptyMessage) ||
    !isImageSourcePropType(Images.messageSend) ||
    !isImageSourcePropType(ImagesDark.emptyMessage) ||
    !isImageSourcePropType(ImagesDark.messageSend)
  ) {
    throw new Error('Image source is not valid');
  }

  const handleFocus = () => {
    setIsFocused(true);
    setShowEmojiPicker(false);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsExpanded(false);
  };

  useEffect(() => {
    const fetchBotCommands = async () => {
      const botCommands = await botsCommands({
        botId: botId
      }).unwrap();

      console.log("botCommands in response", botCommands);
      console.log("botCommands in response botId", botId);

      setBotCommands(botCommands.response?.botCommands || []);
      console.log("botCommands in response", botCommands);
    }

    fetchBotCommands();
  }, [])

  const openSentToSlider = useCallback(
    ({
      solAmount,
      recipientAddress,
      recipientName,
      receiverId,
    }: {
      solAmount: string;
      recipientAddress: string;
      recipientName: string;
      receiverId: string;
    }) => {
      setSolAmount(solAmount);
      setRecipientAddress(recipientAddress);
      setRecipientId(receiverId);
      setRecipientName(recipientName);
      sentToBottomSheetModalRef.current?.present();
    },
    [],
  );

  useEffect(() => {
    (async () => {
      if (
        chatIdInParams
      )
        return;
      try {
        const RequestHeader = await generateRequestHeader();
        const requestPayload: CheckIndividualChatRequestWrapper = {
          body: {
            peerId: messageId,
          },
          requestHeader: {
            action: 'checkIndividualChat',
            requestId: Date.now().toString(),
            timestamp: RequestHeader.Timestamp,
            appVersion: "1.0.1",
            deviceId: RequestHeader.DeviceId,
            deviceType: "mobile",
            channel: "mobile",
            deviceModel: RequestHeader.DeviceModel,
            clientIp: "127.0.0.1",
            languageCode: "en",
          }
        }

        const checkIndividualChatResponse = await generatePeerChat(requestPayload).unwrap();

        console.log('checkIndividualChatResponse in private message screen', checkIndividualChatResponse);
        setChatId(checkIndividualChatResponse?.response?.groupId || '');
      } catch (error) {
        Alert.alert('User does not exist');
      }
    })();
  }, [messageId, chatIdInParams, chatId]);


  useEffect(() => {
    const fetchMessagesFromMessage = async () => {
      const ResponseHeader = await generateRequestHeader();

      const existingMessages = await MessageRepository.getMessagesByChatId(chatId);

      const baseRequest = {
        AccessToken: token,
        RequestHeader: ResponseHeader,
        Body: {
          chatId,
        },
      };

      const fullRequest: {
        AccessToken: string;
        RequestHeader: typeof ResponseHeader;
        Body: {
          chatId: string;
          timestamp?: string;
          limit?: number;
          direction?: 'before' | 'after';
          page?: number;
        };
      } = existingMessages.length === 0
          ? {
            ...baseRequest,
            Body: {
              ...baseRequest.Body,
              direction: 'after',
              limit: 50,
            },
          }
          : baseRequest;

      const response = await fetchMessages(fullRequest).unwrap();

      console.log('📥 Initial message fetch response:', response);
    };

    fetchMessagesFromMessage();
  }, [chatId]);

  const handleSendMessage = useCallback(
    async (payload?: {
      content: string;
      messageType?:
      | 'text'
      | 'crypto'
      | 'other'
      | 'file'
      | 'transfer'
      | 'blink'
      | 'sentSol'
      | 'blinkTransfered';
      data?: any;
    }) => {
      if (
        !payload?.content &&
        payload?.messageType !== 'sentSol' &&
        payload?.messageType !== 'blink' &&
        payload?.messageType !== 'blinkTransfered'
      )
        return;
      try {
        let messageType = payload?.messageType ?? 'text';
        let messageData = payload?.data;
        const messageContent = payload?.content;
        let isBlink = false;
        const urlRegex = /(https?:\/\/[^\s]+)/;

        if (messageType !== 'blink' && urlRegex.test(messageContent)) {
          isBlink = await IsBlinkUrl(messageContent);
          if (isBlink) {
            messageType = 'blink';
            messageData = {
              actionUrl: messageContent,
              senderAddress: "",
              senderId: "",
              senderName: "",
            };
          }
        }
        if (latestUser) {
          const existingMessage = await MessageRepository.getMessageByStatus(chatId, 'syncing');

          console.log("existingMessage", existingMessage);

          if (existingMessage) {
            console.warn("🚫 Previous message is still syncing. Skipping new message...");
            return;
          }

          const messageId = new Realm.BSON.ObjectId().toHexString();

          const storedMessagePromise = addMessage({
            chatId,
            senderId: latestUser?.id,
            content: messageContent,
            status: "pending",
            messageId
          }).unwrap();

          setMessageToSend('');
          setReplyingTo(null);
          console.log("chatId===>", chatId)
          const grpcMessage = SendMessageRequest.create({
            automated: false,
            chatId,
            content: messageContent,
            messageId,
            senderId: latestUser?.id,
            timestamp: new Date().toISOString(),
          });

          try {
            const [storedMessage, sendThroughGrpc] = await Promise.all([
              storedMessagePromise,
              MessageClient.sendMessage(grpcMessage, {
                meta: { Authorization: `Bearer ${token}` },
              }).response,
            ]);
            console.log("✅ Stored Message:", storedMessage);
            console.log("✅ GRPC Response:", sendThroughGrpc);

            await MessageRepository.updateMessageStatus(storedMessage._id, 'sent');
          } catch (error) {
            console.error("❌ Error sending message through GRPC:", error);
          }
        }

      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [messageToSend, chatId]
  );


  const handleReplyMessage = (message: MessageType) => {
    setReplyingTo(message);
  };

  const handleContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const { height } = e.nativeEvent.contentSize;
    setIsMultiline(height > 40);
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => { },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => { },
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (chatIdInParams) {
        setChatId(chatIdInParams);
      }
      if (transactionId && chatIdInParams) {
        await handleSendMessage({
          content: ``,
          data: {
            transactionId,
            amount: amount,
            token: tokenSymbol || '',
            senderId: "",
            receiverId: messageId,
            senderName: "",
            receiverName: name,
            senderAddress: "",
            receiverAddress: recipientAddressInProps,
          },
          messageType: 'sentSol',
        });
        navigation.setParams({
          transactionId: undefined,
          chatId: undefined,
          recipientAddress: undefined,
          amount: undefined,
        });
        // dispatch(setChatIdInReducer(chatIdInParams));
      }
    })();
  }, [actionUrl, transactionId]);


  const renderMessageItem = useCallback<ListRenderItem<MessageType>>(
    ({ item, index }) => {
      console.log("item in message screen", item);
      return (
        <MessageItem
          messageType="bot"
          item={item}
          index={index}
          messages={[]}
          openSentToSlider={openSentToSlider}
          chatId={messageId}
          handleSendMessage={handleSendMessage}
          onReplyMessage={handleReplyMessage}
          simultaneousHandlers={sectionListRef}
          botId={botId}
        />
      );
    },
    [openSentToSlider],
  );

  const concatenatedNewMessage = useMemo(() => {
    const newMessages = allMessages?.data || [];
    return newMessages;
  }, [allMessages]);

  const sections = createSections(concatenatedNewMessage);
  const truncatedMessage = (item: any) => {
    const maxLength = 120;
    let message = '';
    if (item?.data?.transactionId) {
      const { senderId, receiverId, senderName, receiverName, amount } =
        item?.data;
      if (receiverId === "") {
        message = `You have successfully received ${amount} ${item?.data?.token || "Unknown"} from ${senderName}`;
      } else if (senderId === "") {
        message = `You have successfully sent ${amount} ${item?.data?.token || "Unknown"} to ${receiverName}`;
      } else {
        message = `${senderName} has successfully sent ${amount} ${item?.data?.token || "Unknown"} to ${receiverName}`;
      }
    } else {
      message = item.content
        ? item.content
        : item?.type === 'sentSol'
          ? 'sol transaction'
          : item?.type === 'blinkTransfered'
            ? 'blink transfered'
            : item?.type === 'blink'
              ? 'blink'
              : '';
    }
    return message.length > maxLength
      ? message.substring(0, maxLength) + '...'
      : message;
  };

  // useEffect(() => {
  //   const particularChat = [];
  // }, [groupedMessages, chatId]);

  const onIgnoredEffectPress = () => {
    Keyboard.dismiss();
    handleBlur();
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    if (!showEmojiPicker) {
      Keyboard.dismiss();
    }
  };

  const dismissReply = () => {
    setReplyingTo(null)
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessageToSend((prevMessage) => prevMessage + emoji);
  };

  // useEffect(() => {
  //   animatedExpandHeight.value = withTiming(isExpanded ? 50 : 0, {
  //     duration: 150,
  //     easing: NativeEasing.out(NativeEasing.ease),
  //   });
  // }, [isExpanded]);

  // const animatedContainerStyle = useAnimatedStyle(() => {
  //   return {
  //     height: animatedExpandHeight.value,
  //     overflow: 'hidden',
  //   };
  // });

  // const animatedSheetStyle = useAnimatedStyle(() => ({
  //   transform: [{ translateY: animatedValue.value }],
  // }));

  // const animatedInputStyle = useAnimatedStyle(() => ({
  //   flex: inputFlex.value,
  // }));

  // const animatedButtonStyle = useAnimatedStyle(() => ({
  //   opacity: buttonOpacity.value,
  //   transform: [{ scale: buttonOpacity.value }],
  // }));

  // const animatedToggleButtonStyle = useAnimatedStyle(() => ({
  //   opacity: toggleButtonOpacity.value,
  //   transform: [{ scale: toggleButtonOpacity.value }],
  // }));

  // const animatedImageStyle = useAnimatedStyle(() => ({
  //   transform: [{ scale: imageScale.value }],
  //   opacity: withTiming(messageToSend.length === 0 ? 1 : 1, { duration: 300 }),
  // }));

  const handleTextChange = (message: string) => {
    imageScale.value = withTiming(message.length === 0 ? 0.9 : 1.1, {
      duration: 300,
    });
    blinkBottomSheetModalRef.current?.dismiss();
    setMessageToSend(message);
  };

  useRecentPicksPersistence({
    initialization: () => AsyncStorage.getItem("recent").then((item) => JSON.parse(item || '[]')),
    onStateChange: (next) => AsyncStorage.setItem("recent", JSON.stringify(next)),
  })

  useEffect(() => {
    const shouldShow = messageToSend.trim().startsWith('/');
    translateY.value = withTiming(shouldShow ? 0 : 200, { duration: 300 });
    opacity.value = withTiming(shouldShow ? 1 : 0, { duration: 300 });
  }, [messageToSend]);

  useEffect(() => {
    setShowBotCommands(messageToSend.trim().startsWith('/'));
  }, [messageToSend]);


  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <TouchableWithoutFeedback onPress={onIgnoredEffectPress}>
      <>
        <View
          style={[
            {
              flex: 1,
            },
            // animatedSheetStyle,
          ]}>
          <SafeScreen
            messageId={localUserInfo.id || messageId}
            groupName={name}
            type={type}
            profilePicture={profilePicture}
            backgroundColor={backgroundColor}
            lastActive={lastActive}
            timeStamp={timeStamp}
            botId={botId}
          >
            <KeyboardAvoidingView
              style={[layout.flex_1]}
              {...(Platform.OS === 'ios' && { behavior: 'padding' })}>
              <View style={[layout.flex_1]}>
                <ImageBackground
                  style={[layout.absoluteFill, { opacity: 1 }]}
                  source={Images.background}>
                  <View style={[layout.absoluteFill]} />
                </ImageBackground>
                {sections.length > 0 && (
                  <SectionList
                    ref={sectionListRef}
                    sections={sections}
                    keyExtractor={(item, index) => item._id}
                    renderItem={renderMessageItem}
                    renderSectionFooter={({ section }) =>
                      section.data.length > 0 ? (
                        <View
                          style={[
                            layout.itemsSelfCenter,
                            gutters.marginTop_4,
                            gutters.padding_4,
                            borders.rounded_500,
                          ]}>
                          <TextVariant
                            style={[components.urbanist14RegularBlack]}>
                            {moment(section.title).isSame(moment(), 'day')
                              ? 'Today'
                              : moment(section.title).isSame(
                                moment().subtract(1, 'days'),
                                'day',
                              )
                                ? 'Yesterday'
                                : moment(section.title).format('MMMM D')}
                          </TextVariant>
                        </View>
                      ) : null
                    }
                    getItemLayout={(data, index) => ({
                      length: 80,
                      offset: 80 * index,
                      index,
                    })}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={15}
                    inverted={true}
                    extraData={sections}
                    removeClippedSubviews={false}
                    onEndReachedThreshold={0.8}
                    onEndReached={async () => {
                      const earliest = await MessageRepository.getEarliestMessage(chatId);
                      if (earliest?.content?.includes("created the groupchat")) {
                        return
                      }
                      const requestHeader = await generateRequestHeader();

                      const response = await fetchMessages({
                        AccessToken: token,
                        Body: {
                          chatId,
                          timestamp: new Date(earliest?.createdAt || Date.now()).getTime().toString(),
                          limit: 50,
                          direction: 'before',
                        },
                        RequestHeader: requestHeader
                      }).unwrap();
                    }}

                  />
                )}
              </View>
              <View style={[gutters.marginTop_2]}>
                {replyingTo && (
                  <View
                    style={[
                      // backgrounds.gray50,
                      borders.rounded_4,
                      gutters.marginTop_2,
                      gutters.padding_10,
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '92%',
                        alignSelf: 'center',
                      },
                    ]}
                  >
                    <View style={[
                      {
                        display: "flex",
                        flex: 1,
                        flexDirection: 'column',
                      },
                    ]}>
                      <TextVariant style={[components.urbanist14BoldBlack, { color: colors.primary, fontWeight: "500" }]}>
                        Reply to: {"" == replyingTo.senderId ? "Me" : replyingTo.senderName}
                      </TextVariant>
                      <TextVariant style={[components.urbanist14RegularBlack]}>
                        {truncatedMessage(replyingTo)}
                      </TextVariant>
                    </View>
                    <ButtonVariant onPress={dismissReply}>
                      <ImageVariant
                        source={Images.close}
                        sourceDark={ImagesDark.close}
                        style={[components.iconSize12]}
                      />
                    </ButtonVariant>
                  </View>
                )}

                {
                  showBotCommands && <Animated.View style={[layout.relative, animatedStyle]}>
                    <View
                      style={[
                        {
                          ...StyleSheet.absoluteFillObject,
                          backgroundColor: 'rgba(114, 171, 241, 0.1)',
                          zIndex: 0,
                        },
                      ]}
                    />

                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      scrollEventThrottle={16}
                      style={[layout.maxHeight150]}
                      contentContainerStyle={{ zIndex: 1 }}
                    >
                      {getBotCommands.map((item, index) => (
                        <ButtonVariant onPress={() => {
                          setMessageToSend("/" + item.command)
                        }} key={index} style={[layout.row, layout.justifyStart, layout.itemsCenter, gutters.padding_10]}>
                          <View>
                            <FastImage
                              source={{ uri: profilePicture }}
                              style={[layout.height30, layout.width30, borders.rounded_500]}
                            />
                          </View>
                          <View style={[layout.row, layout.justifyStart, gutters.marginLeft_12]}>
                            <TextVariant style={[components.urbanist14BoldBlack]}>/{item.command}</TextVariant>
                            <TextVariant style={[gutters.marginLeft_10, components.urbanist14RegularSecondary]}>{item.description}</TextVariant>
                          </View>
                        </ButtonVariant>
                      ))}
                    </ScrollView>
                  </Animated.View>
                }

                <View>
                  <View
                    style={[
                      layout.row,
                      layout.itemsCenter,
                      layout.justifyBetween,
                      gutters.paddingHorizontal_14,
                      !isExpanded && components.messageSendBar,
                      !isExpanded && gutters.paddingVertical_10,
                      isExpanded && gutters.paddingBottom_10,
                    ]}>
                    <NativeAnimated.View
                      style={[
                        layout.row,
                        layout.justifyBetween,
                        gutters.marginRight_14,
                        layout.itemsCenter,
                        layout.flex_1,
                        backgrounds.messageInputBackground,
                        borders.rounded_20,
                        {
                          borderTopLeftRadius: 20,
                          borderBottomLeftRadius: 20,
                          borderTopRightRadius: 20,
                          borderBottomRightRadius: 20
                        },
                        gutters.paddingVertical_2,
                        gutters.paddingHorizontal_10,
                        // animatedInputStyle,
                      ]}>
                      <ButtonVariant
                        onPress={() => {
                          messageInputRef.current?.focus();
                        }}
                        activeOpacity={1}
                        style={[
                          layout.row,
                          layout.justifyBetween,
                          gutters.marginRight_14,
                          layout.itemsCenter,
                          layout.flex_1,
                          backgrounds.messageInputBackground,
                          borders.rounded_20,
                          {
                            borderTopLeftRadius: 20,
                            borderBottomLeftRadius: 20,
                            borderTopRightRadius: 20,
                            borderBottomRightRadius: 20
                          },
                          gutters.paddingVertical_2,
                          gutters.paddingHorizontal_10,
                          layout.overflowHidden
                        ]}>
                        <TextInput
                          ref={messageInputRef}
                          value={messageToSend}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                          returnKeyLabel="default"
                          returnKeyType="default"
                          autoCapitalize="none"
                          keyboardAppearance="light"
                          onChangeText={handleTextChange}
                          style={[
                            {
                              borderTopLeftRadius: 20,
                              borderBottomLeftRadius: 20,
                              borderTopRightRadius: 20,
                              borderBottomRightRadius: 20
                            },
                            layout.flex_1,
                            Platform.OS === 'ios'
                              ? gutters.paddingVertical_8
                              : gutters.padding_8,
                            components.urbanist16SemiBoldDark,
                            { maxHeight: 100 },
                          ]}
                          onSubmitEditing={() => {
                            messageInputRef.current?.blur();
                          }}
                          blurOnSubmit={false}
                          multiline
                          onKeyPress={({ nativeEvent }) => {
                            if (nativeEvent.key === 'Enter') {
                              handleTextChange(messageToSend + '\n');
                            }
                          }
                          }
                          onContentSizeChange={(e) => handleContentSizeChange(e)}
                        />
                      </ButtonVariant>
                      <ButtonVariant onPress={toggleEmojiPicker} style={[
                        isMultiline ? layout.alignSelfItemsEnd : null,
                        isMultiline ? gutters.marginBottom_8 : null
                      ]}>
                        <ImageVariant
                          source={Images.emoji}
                          sourceDark={ImagesDark.emoji}
                          style={[components.iconSize20]}
                        />
                      </ButtonVariant>
                    </NativeAnimated.View>
                    <ButtonVariant
                      hitSlop={{
                        top: 20,
                        bottom: 20,
                        left: 20,
                        right: 20,
                      }}
                      style={[
                        layout.height40,
                        layout.width40,
                        layout.itemsCenter,
                        layout.justifyCenter,
                        isMultiline ? layout.alignSelfItemsEnd : null,
                      ]}
                      onPress={() => handleSendMessage({ content: messageToSend })}>
                      <View style={[
                        // animatedImageStyle
                      ]}>
                        <ImageVariant
                          source={
                            messageToSend.length === 0
                              ? Images.emptyMessage
                              : Images.messageSend
                          }
                          sourceDark={
                            messageToSend.length === 0
                              ? ImagesDark.emptyMessage
                              : ImagesDark.messageSend
                          }
                          style={[components.iconSize24]}
                        />
                      </View>
                    </ButtonVariant>
                  </View>
                </View>
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
            </KeyboardAvoidingView>
          </SafeScreen>
        </View>
      </>
    </TouchableWithoutFeedback>
  );
};

export default React.memo(BotMessage);
