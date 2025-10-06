import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { SearchBar } from '@/components/molecules';
import { MultiMediaPicker, SafeScreen } from '@/components/template';
import PinnedList from '@/components/template/Animated/AnimatedCarousel';
import { useRecentPicksPersistence } from '@/components/template/EmojiKeyboard/src';
import { EmojiKeyboard } from '@/components/template/EmojiKeyboard/src/EmojiKeyboard';
import { API_MAIN_NET } from '@/config';
import MessageRepository from '@/database/repositories/Message.repository';
import { useAddMessageMutation, useUpdateMessageMutation } from '@/hooks/domain';
import { useCreateTransactionMutation } from '@/hooks/domain/create-transaction/useCreateTransaction';
import { useFetchAllMessagesQuery, useFetchPinnedMessagesQuery } from '@/hooks/domain/db-messages/useDbMessages';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { useFetchGroupChatDetailQuery } from '@/hooks/domain/fetch-chat-details/useFetchChatDetails';
import { useGetTrendingGifsQuery } from '@/hooks/domain/fetch-gifs/useFetchGifs';
import { useFetchOtherUserMutation } from '@/hooks/domain/fetch-user/useFetchUser';
import { useGeneratePeerChatMutation } from '@/hooks/domain/individual-chat/individualChats';
import { TUploadRequest } from '@/hooks/domain/upload-file/schema';
import { useGenerateUploadUrlMutation, useUploadFileMutation } from '@/hooks/domain/upload-file/useUploadFile';
import { CheckIndividualChatRequestWrapper } from '@/pb/groupchat';
import { multimediaPayload, SendMessageRequest, transactionPayload } from '@/pb/message';
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
import { Blink } from '@/types/data/blink';
import {
  createSections,
  getNetworkFee,
  heightPercentToDp
} from '@/utils';
import { IsBlinkUrl } from '@/utils/blinks';
import { createClusterConnection } from '@/utils/connection';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import { shortenAddress } from '@/utils/shortenAddress';
import FastImage from '@d11/react-native-fast-image';
import * as RNFS from '@dr.pogodin/react-native-fs';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pick } from '@react-native-documents/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import axios from 'axios';
import moment from 'moment';
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
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  // Animated
  LayoutAnimation,
  ListRenderItem,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  SectionList,
  TextInput,
  TextInputContentSizeChangeEventData,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import NativeAnimated, {
  cancelAnimation,
  Extrapolate,
  interpolate,
  Easing as NativeEasing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import Realm from 'realm';
import { v4 as uuidv4 } from 'uuid';
import MediaItem from '../../ProfileDetails/MediaItem';
import RenderBlinkSkeletonPlaceholder from '../Shared/BlinkSkeleton';
import MessageItem from '../Shared/MessageItem';
import TransparentBackdrop from '../Shared/TransparentBackDrop';
import MessageStreamService from '@/services/streamingService/MessageStreamService';
import { useFetchMessagesMutation } from '@/hooks/domain/fetch-messages/useFetchMessages';
import { PERMISSIONS } from 'react-native-permissions';
import { checkAndRequestPermission } from '@/utils/permissionHandler';

interface IProps { }

/**
 * @author Nitesh Raj Khanal
 * @function @PrivateMessage
 **/

type MessageSendType =
  | 'text'
  | 'crypto'
  | 'other'
  | 'file'
  | 'transfer'
  | 'transaction'
  | 'blinkTransfered'
  | 'image'
  | 'blink'
  | 'gif';

type UploadMedia = {
  name: string;
  filePath: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  isLoading: boolean;
  localUri: string;
  retryStatus: 'uploading' | 'failed' | 'success';
  uploadStage: 'initial' | 'generateUrl' | 'uploading' | 'completed';
  signedUrl?: string;
  expirationTime?: string;
  filePathServer?: string;
  thumbnailUri?: string | null;
};

const MessageClient = new MessageServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

const screenWidth = Dimensions.get('window').width;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PrivateMessage: FC<IProps> = props => {
  const navigation = useNavigation<SafeScreenNavigationProp>();

  const sectionListRef = useRef(null);

  const { layout, gutters, components, borders, backgrounds, colors } =
    useTheme();

  const token = useSelector((state: RootState) => state.accessToken.authToken);

  const { t } = useTranslation(['translations']);

  const [generatePeerChat] = useGeneratePeerChatMutation();
  const [generateUploadUrl] = useGenerateUploadUrlMutation();

  const [multimediaPicker, setMultiMediaPicker] = useState<boolean>(false);

  const messageInputRef = useRef<TextInput>(null);
  const sentToBottomSheetModalRef = useRef<BottomSheetModal>(null);
  const processingBottomSheetModalRef = useRef<BottomSheetModal>(null);
  const blinkBottomSheetModalRef = useRef<BottomSheetModal>(null);
  const insufficientBalanceModalRef = useRef<BottomSheetModal>(null);
  const insufficientBalanceToSnapPoints = useMemo(
    () => [heightPercentToDp('30'), heightPercentToDp('30')],
    [],
  );

  const [isBlinkLoading, setIsBlinkLoading] = useState<boolean>(false);
  const [blinksData, setBlinksData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [networkFee, setNetworkFee] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  const { data: latestUser } = useFetchLatestUserQuery()
  const [addMessage] = useAddMessageMutation()
  const [updateMessage] = useUpdateMessageMutation();
  const { data: gifs, isLoading: isLoadingGif } = useGetTrendingGifsQuery();

  const gifBottomSheetRef = useRef<BottomSheetModal>(null);

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
  } = route.params;

  const { data: groupChatDetails, isLoading } = useFetchGroupChatDetailQuery({ ChatId: chatIdInParams }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  })

  const otherLastActive = useMemo(() => {
    const otherParticipant = groupChatDetails?.participants?.find((participant) => participant.id !== messageId);
    if (otherParticipant) {
      return otherParticipant.lastActive
    }
    return null;
  }, [])

  console.log("otherLastActive", otherLastActive)

  const otherOnlineOffline = useMemo(() => {
    const otherParticipant = groupChatDetails?.participants?.find((participant) => participant.id !== messageId);
    if (otherParticipant) {
      return otherParticipant.status
    }
    return null;
  }, [])

  const sendToSnapPoints = useMemo(
    () => [heightPercentToDp('45'), heightPercentToDp('50')],
    [],
  );
  const processingSnapPoints = useMemo(
    () => [heightPercentToDp('20'), heightPercentToDp('20')],
    [],
  );

  const [chatId, setChatId] = useState<string>('');
  const [fetchOtherUser] = useFetchOtherUserMutation();
  const [fetchMessages] = useFetchMessagesMutation()
  const [solAmount, setSolAmount] = useState<string>('0');
  const [recipientId, setRecipientId] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [messageToSend, setMessageToSend] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const replySlideAnim = useSharedValue(0);
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

  const { data: pinnedMessages } = useFetchPinnedMessagesQuery(
    { chatId },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  console.log("pinnedMessages", pinnedMessages)

  const { data: allMessages } = useFetchAllMessagesQuery({
    chatId
  }, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();


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

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(0);

  const handleFocus = () => {
    setMultiMediaPicker(false);
    setIsFocused(true);
    setShowEmojiPicker(false);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsExpanded(false);
  };

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

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

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
      setRecipientId(receiverId);
      setRecipientName(recipientName);
      sentToBottomSheetModalRef.current?.present();
    },
    [],
  );

  const fetchBlinks = useCallback(async () => {
    try {

    } catch (error) {
      console.error('Error fetching blinks:', error);
    } finally {
      setIsBlinkLoading(false);
    }
  }, []);


  useEffect(() => {
    (async () => {
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
        console.log("checkIndividualChatResponse", checkIndividualChatResponse)
        setChatId(checkIndividualChatResponse?.response?.groupId || '');
      } catch (error) {
        Alert.alert('User does not exist');
      }
    })();
  }, [messageId]);

  const openInsufficientBalanceBottomSheet = () => {
    insufficientBalanceModalRef.current?.present();
  };

  useEffect(() => {
    const fetchNetworkFee = async () => {
      try {
        const fee = await getNetworkFee(new PublicKey(latestUser?.address || ""));
        setNetworkFee(fee !== undefined ? fee.toString() : "");
      } catch (error) {
        console.error("Error fetching network fee:", error);
      }
    }
    fetchNetworkFee();
  }, [
    latestUser
  ])

  const [createTransaction] = useCreateTransactionMutation();

  const renderMediaItem = useCallback(
    ({ item }: { item: Blink }) => {
      const itemSize = screenWidth / 3 - 4;
      return (
        <View
          style={{ width: itemSize, marginHorizontal: 2, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              (async () => {
                await handleSendMessage({
                  content: '',
                  messageType: 'blink',
                  data: {
                    actionUrl: item.actionUrl,
                    blinkName: item.name,
                    blinkTitle: item.title,
                    blinkId: item.id,

                  },
                });
                blinkBottomSheetModalRef.current?.dismiss();
              })();
            }}>
            <MediaItem mediaSource={{ uri: item.icon }} itemSize={itemSize} />
          </TouchableOpacity>
        </View>
      );
    },
    [screenWidth, chatId],
  );

  useEffect(() => {
    console.log("chatIdchatIdchatId", chatId)
    MessageStreamService.getInstance().subscribeToChat(chatId);

    return () => {
      MessageStreamService.getInstance().unsubscribeFromChat(chatId);
    }
  }, [chatId]);

  const receiverAddress = useMemo(() => {
    const otherParticipant = groupChatDetails?.participants?.find((participant) => participant.id !== messageId);
    if (otherParticipant) {
      return otherParticipant.address
    }
    return null;
  }, [groupChatDetails])

  const receiver = useMemo(() => {
    const otherParticipant = groupChatDetails?.participants?.find((participant) => participant.id !== messageId);
    if (otherParticipant) {
      return otherParticipant
    }
    return null;
  }, [groupChatDetails])

  const handleImagePicker = async () => {
    try {
      const permission = Platform.OS === 'android' ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES : PERMISSIONS.IOS.PHOTO_LIBRARY;
      const isAllowed = await checkAndRequestPermission(
        permission,
        t("photoAccessDeniedTitle"),
        t("photoAccessDeniedMessage")
      );
      if (!isAllowed) return;
      const images = await ImagePicker.openPicker({
        cropping: false,
        multiple: true,
        includeBase64: false,
        mediaType: 'photo',
      });

      if (images && chatId && token && latestUser) {
        const messageId = new Realm.BSON.ObjectId().toHexString();
        const RequestHeader = await generateRequestHeader();
        const multimediaPayloads: multimediaPayload[] = [];
        const localMedias: any[] = [];
        const updatedMedias: any[] = [];

        for (const image of images) {
          const fileUri = image.path;
          const fileName = fileUri.split('/').pop() || 'file.jpg';

          const metadata = {
            name: fileName,
            filePath: fileUri,
            mimeType: image.mime || 'image/jpeg',
            width: image.width,
            height: image.height,
            size: image.size,
            isLoading: true,
            localUri: fileUri,
          };

          localMedias.push(metadata);
        }

        const storedMessage = await addMessage({
          chatId,
          senderId: latestUser.id,
          content: '',
          messageId,
          status: 'uploading',
          automated: false,
          type: 'image',
          multimedia: localMedias,
        });

        for (const image of images) {
          const fileUri = image.path;
          const fileName = fileUri.split('/').pop() || 'file.jpg';
          const uploadId = uuidv4();

          const metadata = localMedias.find(m => m.filePath === fileUri);

          const baseRequest: TUploadRequest = {
            AccessToken: token,
            RequestHeader,
            Body: {
              chatId,
              accessToken: token,
              fileUri,
              uploadId,
              fileName,
              contentType: metadata.mimeType,
              isLastChunk: true,
              data: new Uint8Array(),
            },
          };

          const uploadResponse = await uploadFile(baseRequest).unwrap();

          if (uploadResponse.Response) {
            const { filePath, signedUrl, expirationTime, mimeType } = uploadResponse.Response;

            multimediaPayloads.push({
              filePath,
              signedUrl,
              expirationTime,
              mimeType,
            });

            updatedMedias.push({
              ...metadata,
              signedUrl,
              expirationTime,
              isLoading: false,
              filePath
            });
          }
        }

        const grpcMessage = SendMessageRequest.create({
          chatId,
          senderId: latestUser.id,
          messageId,
          timestamp: new Date().toISOString(),
          content: '',
          automated: false,
          multimedia: multimediaPayloads,
        });

        await MessageClient.sendMessage(grpcMessage, {
          meta: { Authorization: `Bearer ${token}` },
        }).response;

        if (storedMessage?.data?._id) {
          await updateMessage({
            messageId: storedMessage.data._id,
            updates: {
              status: 'sent',
              multimedia: updatedMedias,
            },
          });
        }
      }
    } catch (error) {
      console.error('❌ Error sending multiple images:', error);
    }
  };

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

    };

    fetchMessagesFromMessage();
  }, [chatId]);

  const [renderedMessageIds, setRenderedMessageIds] = useState<Set<string>>(new Set());
  const prevMessagesCount = useRef(0);

  const configureMessageAnimation = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      create: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.7,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  }, []);

  useEffect(() => {
    if (!allMessages?.data) return;

    const currentMessages = allMessages.data;

    if (currentMessages.length > prevMessagesCount.current) {
      configureMessageAnimation();

      const newRenderedIds = new Set(renderedMessageIds);
      currentMessages.forEach(msg => newRenderedIds.add(msg._id));
      setRenderedMessageIds(newRenderedIds);
    }

    prevMessagesCount.current = currentMessages.length;
  }, [allMessages?.data, configureMessageAnimation]);

  const handleSendMessage = useCallback(
    async (payload?: {
      content: any;
      messageType?: MessageSendType;
      data?: any;
    }) => {
      const messageContent = payload?.content?.trim();
      if (
        !messageContent &&
        payload?.messageType !== 'transaction' &&
        payload?.messageType !== 'blink' &&
        payload?.messageType !== 'blinkTransfered'
      ) {
        return;
      }
      const messageType: MessageSendType = payload?.messageType ?? 'text';
      const tempReplyTo = replyingTo;

      setMessageToSend('');
      setReplyingTo(null);

      try {
        const urlRegex = /(https?:\/\/[^\s]+)/;

        if (messageType !== 'blink' && urlRegex.test(messageContent)) {
          const tempMessageId = new Realm.BSON.ObjectId().toHexString();

          if (latestUser) {
            const optimisticMessage = {
              chatId,
              senderId: latestUser.id,
              content: messageContent,
              status: "pending",
              messageId: tempMessageId,
              type: messageType,
              ...(tempReplyTo?.serverId && {
                replyTo: {
                  replyToId: tempReplyTo.serverId,
                  replyToSenderName: latestUser?.fullName,
                  replyToContent: tempReplyTo?.content
                }
              })
            };

            const storedMessagePromise = addMessage({
              ...optimisticMessage,
              status: "pending",
            }).unwrap();

            const blinkCheckPromise = IsBlinkUrl(messageContent);

            const grpcMessage = SendMessageRequest.create({
              automated: false,
              chatId,
              content: messageContent,
              messageId: tempMessageId,
              senderId: latestUser?.id,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              replyToMessageId: tempReplyTo?.serverId ?? undefined
            });

            const [storedMessage, isUrlBlink, sendResponse] = await Promise.all([
              storedMessagePromise,
              blinkCheckPromise,
              MessageClient.sendMessage(grpcMessage, {
                meta: { Authorization: `Bearer ${token}` },
              }).response
            ]);
            if (isUrlBlink && storedMessage) {
              await MessageRepository.updateMessageStatus(storedMessage._id, 'sent');
              await MessageRepository.updateMessageType(storedMessage._id, 'blink');
            } else if (storedMessage && payload?.messageType == "gif") {
              await MessageRepository.updateMessageStatus(storedMessage._id, 'sent');
              await MessageRepository.updateMessageType(storedMessage._id, 'gif');

            } else if (storedMessage) {
              await MessageRepository.updateMessageStatus(storedMessage._id, 'sent');
            }

            return storedMessage;
          }
        } else {
          console.log("else running")
          if (latestUser) {
            const existingMessage = await MessageRepository.getMessageByStatus(chatId, 'syncing');
            if (existingMessage) {
              console.warn("🚫 Previous message is still syncing. Skipping new message...");
              return;
            }

            const messageId = new Realm.BSON.ObjectId().toHexString();

            const messageObject = {
              chatId,
              senderId: latestUser?.id,
              content: messageContent,
              status: "pending",
              messageId,
              ...(tempReplyTo?.serverId && {
                replyTo: {
                  replyToId: tempReplyTo.serverId,
                  replyToSenderName: latestUser?.fullName,
                  replyToContent: tempReplyTo?.content
                }
              })
            };

            const storedMessagePromise = addMessage({
              ...messageObject,
              status: "pending",
            }).unwrap();

            const grpcMessage = SendMessageRequest.create({
              automated: false,
              chatId,
              content: messageContent,
              messageId,
              senderId: latestUser?.id,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              replyToMessageId: tempReplyTo?.serverId ?? undefined
            });

            try {
              const [storedMessage, sendThroughGrpc] = await Promise.all([
                storedMessagePromise,
                MessageClient.sendMessage(grpcMessage, {
                  meta: { Authorization: `Bearer ${token}` },
                }).response,
              ]);

              await MessageRepository.updateMessageStatus(storedMessage._id, 'sent');
              return storedMessage;
            } catch (error) {
              console.error("❌ Error sending message through GRPC:", error);
            }
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [messageToSend, chatId, latestUser, token, replyingTo],
  );

  const handleGifPicker = () => {
    Keyboard.dismiss();
    setShowEmojiPicker(false);
    setMultiMediaPicker(false);
    console.log("gifBottomSheetRef==>", gifBottomSheetRef)
    gifBottomSheetRef.current?.present();
  };

  const handleGifSelected = async (gifUrl: string) => {
    gifBottomSheetRef.current?.dismiss();
    await handleSendMessage({ content: gifUrl, messageType: 'gif' });
  };

  const handleReplyMessage = useCallback((message: MessageType) => {
    cancelAnimation(replySlideAnim);

    setReplyingTo(message);

    replySlideAnim.value = withTiming(1, {
      duration: 280,
      easing: NativeEasing.bezier(0.16, 1, 0.3, 1),
    });
  }, []);

  const dismissReply = useCallback(() => {
    cancelAnimation(replySlideAnim);

    replySlideAnim.value = withTiming(0, {
      duration: 200,
      easing: NativeEasing.bezier(0.33, 0, 0.67, 1),
    }, (finished) => {
      if (finished) {
        runOnJS(setReplyingTo)(null);
      }
    });
  }, []);

  const animatedReplyStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      replySlideAnim.value,
      [0, 1],
      [50, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
      opacity: replySlideAnim.value,
      ...(Platform.OS === 'ios' ? {
        shouldRasterizeIOS: true,
        opacity: replySlideAnim.value * 0.99 + 0.01,
      } : {}),
    };
  });

  const handleSendSol = useCallback(async () => {
    if (receiverAddress) {
      sentToBottomSheetModalRef.current?.close();
      try {
        processingBottomSheetModalRef.current?.present();

        const connection = await createClusterConnection();
        if (!connection) throw new Error("No blockchain connection available");
        console.log("latestUser", latestUser)
        if (latestUser?.privateKey) {
          const secretKey = Uint8Array.from(Buffer.from(latestUser?.privateKey, 'base64'));
          const senderKeypair = Keypair.fromSecretKey(secretKey);

          console.log("senderKeypair", senderKeypair)

          const lamportsToSend = Math.floor(+solAmount * LAMPORTS_PER_SOL);

          console.log("lamportsToSend", lamportsToSend)

          const transaction = new Transaction();

          console.log("transaction", transaction)
          console.log("recipientAddress", receiverAddress)
          const recipientPubkey = new PublicKey(receiverAddress);
          console.log("recipientPubkey", recipientPubkey)

          transaction.add(
            SystemProgram.transfer({
              fromPubkey: senderKeypair.publicKey,
              toPubkey: recipientPubkey,
              lamports: lamportsToSend,
            }),
          );

          const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);

          console.log("signature", signature)

          const RequestHeader = await generateRequestHeader();
          const createTransactionRequestPayload = {
            RequestHeader: RequestHeader,
            AccessToken: token,
            Body: {
              toWallet: receiverAddress,
              cluster: API_MAIN_NET,
              signature,
            }
          }
          const createTransactionResponse = await createTransaction(createTransactionRequestPayload).unwrap();
          console.log("createTransactionResponse", createTransactionResponse)
          console.log(`✅ Sent to ${receiverAddress} with signature:`, signature);
          const messageId = new Realm.BSON.ObjectId().toHexString();

          let transactionPayload: transactionPayload = {
            amount: solAmount,
            fromWallet: senderKeypair.publicKey.toString(),
            senderId: latestUser?.id,
            signature: signature,
            timestamp: Math.floor(Date.now() / 1000).toString(),
            toWallet: receiverAddress,
            transactionId: createTransactionResponse.transactionId
          };

          const storedMessagePromise = addMessage({
            chatId: chatIdInParams,
            senderId: latestUser?.id,
            content: `${latestUser.fullName} has successfully sent ${createTransactionResponse.amount} SOL to ${receiver?.fullName} `,
            messageId,
            status: "pending",
            automated: false,
            type: 'transaction',
            transaction: transactionPayload
          }).unwrap();

          const grpcMessage = SendMessageRequest.create({
            chatId: chatIdInParams,
            senderId: latestUser?.id,
            messageId,
            timestamp: new Date().toISOString(),
            content: `${latestUser.fullName} has successfully sent ${createTransactionResponse.amount} SOL to ${receiver?.fullName} `,
            automated: false,
            transaction: transactionPayload
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

            processingBottomSheetModalRef.current?.close();
            sentToBottomSheetModalRef.current?.dismiss();
          } catch (error) {
            console.error("❌ Error sending message through GRPC:", error);
          }

        }
      } catch (error) {
        sentToBottomSheetModalRef.current?.dismiss();
        processingBottomSheetModalRef.current?.close();
        processingBottomSheetModalRef.current?.dismiss();
        if ((error as string).includes('Insufficient balance')) {
          Keyboard.dismiss();
          openInsufficientBalanceBottomSheet();
        } else {
          Alert.alert('Transaction Error', error as string);
          console.error('Error sending SOL: ', error as string);
        }
      }
    }
  }, [solAmount, name, messageId, receiverAddress]);

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
  }, [searchQuery, blinksData, receiverAddress]);

  const handleDocumentPicker = async () => {
    try {
      let result;
      if (Platform.OS === "android") {
        result = await pick({
          allowMultiSelection: true,
          allowVirtualFiles: true,
          presentationStyle: 'fullScreen',
          type: [
            'application/*',
            'text/*',
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
          ],
        })
      }
      else {
        result = await pick({
          allowMultiSelection: true,
          allowVirtualFiles: true,
          presentationStyle: 'fullScreen',
        })
      }
      if (result && chatId && token && latestUser) {
        const messageId = new Realm.BSON.ObjectId().toHexString();
        const multimediaPayloads: multimediaPayload[] = [];

        const localDocuments: UploadMedia[] = result.map(doc => ({
          name: doc.name || 'document',
          filePath: doc.uri,
          mimeType: doc.type || 'application/octet-stream',
          size: doc.size || 0,
          width: 0,
          height: 0,
          isLoading: true,
          localUri: doc.uri,
          retryStatus: 'uploading',
          uploadStage: 'initial',
          thumbnailUri: null,
        }));

        const storedMessage = await addMessage({
          chatId,
          senderId: latestUser.id,
          content: '',
          messageId,
          status: 'uploading',
          automated: false,
          type: 'file',
          multimedia: localDocuments,
        });

        for (const doc of localDocuments) {
          try {
            doc.uploadStage = 'generateUrl';
            if (storedMessage?.data) {
              await updateMessage({
                messageId: storedMessage.data._id,
                updates: { multimedia: localDocuments },
              });
            }

            const { Response: uploadMeta } = await generateUploadUrl({
              chatId,
              fileName: doc.name,
              contentType: doc.mimeType,
              accessToken: token,
            }).unwrap();

            if (!uploadMeta?.uploadUrl) throw new Error('Failed to get upload URL');

            doc.uploadStage = 'uploading';
            if (storedMessage?.data) {
              await updateMessage({
                messageId: storedMessage.data._id,
                updates: { multimedia: localDocuments },
              });
            }

            const fileContent = await RNFS.readFile(doc.localUri, 'base64');
            const fileBuffer = Buffer.from(fileContent, 'base64');
            await axios.put(uploadMeta.uploadUrl, fileBuffer, {
              headers: {
                'Content-Type': doc.mimeType,
                'Content-Encoding': 'base64',
              },
            });

            doc.uploadStage = 'completed';
            doc.retryStatus = 'success';
            doc.signedUrl = uploadMeta.readUrl;
            doc.filePath = uploadMeta.filePath;
            doc.expirationTime = uploadMeta.expirationTime;
            doc.isLoading = false;

            multimediaPayloads.push({
              filePath: uploadMeta.filePath,
              signedUrl: uploadMeta.readUrl,
              expirationTime: uploadMeta.expirationTime,
              mimeType: uploadMeta.mimeType,
            });

            if (storedMessage?.data) {
              await updateMessage({
                messageId: storedMessage.data._id,
                updates: { multimedia: localDocuments },
              });
            }
          } catch (uploadError) {
            console.error('❌ Upload error:', uploadError);
            doc.retryStatus = 'failed';
            doc.uploadStage = doc.uploadStage === 'generateUrl' ? 'generateUrl' : 'uploading';
            doc.isLoading = false;
            if (storedMessage?.data) {
              await updateMessage({
                messageId: storedMessage.data._id,
                updates: { multimedia: localDocuments },
              });
            }
          }
        }

        if (multimediaPayloads.length > 0) {
          const grpcMessage = SendMessageRequest.create({
            chatId,
            senderId: latestUser.id,
            messageId,
            timestamp: new Date().toISOString(),
            content: '',
            automated: false,
            multimedia: multimediaPayloads,
          });

          await MessageClient.sendMessage(grpcMessage, {
            meta: { Authorization: `Bearer ${token}` },
          }).response;

          if (storedMessage?.data) {
            await updateMessage({
              messageId: storedMessage.data._id,
              updates: {
                status: 'sent',
                multimedia: localDocuments,
              },
            });
          }
        }
      }
    } catch (error) {
      if ((error as any)?.code === 'E_PICKER_CANCELLED') {
        console.log('Document picker cancelled');
      } else {
        console.error('❌ Error uploading documents:', error);
      }

    }
  };

  const handleVideoPicker = async () => {
    try {
      const permission = Platform.OS === 'android' ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES : PERMISSIONS.IOS.PHOTO_LIBRARY;
      const isAllowed = await checkAndRequestPermission(
        permission,
        t("photoAccessDeniedTitle"),
        t("photoAccessDeniedMessage")
      );
      if (!isAllowed) return;
      const videos = await ImagePicker.openPicker({
        mediaType: 'video',
        multiple: true,
      });

      if (videos && chatId && token && latestUser) {
        const messageId = new Realm.BSON.ObjectId().toHexString();
        const RequestHeader = await generateRequestHeader();
        const multimediaPayloads: multimediaPayload[] = [];
        const localVideos: any[] = [];
        const updatedVideos: any[] = [];

        for (const video of videos) {
          const fileUri = video.path;
          const fileName = fileUri.split('/').pop() || 'video.mp4';

          const metadata = {
            name: fileName,
            filePath: fileUri,
            mimeType: video.mime || 'video/mp4',
            isLoading: true,
            localUri: fileUri,
            duration: video.duration,
            height: video.height,
            width: video.width,
            size: video.size,
          };

          localVideos.push(metadata);
        }

        const storedMessage = await addMessage({
          chatId,
          senderId: latestUser.id,
          content: '',
          messageId,
          status: 'uploading',
          automated: false,
          type: 'video',
          multimedia: localVideos,
        });

        for (const video of videos) {
          const fileUri = video.path;
          const fileName = fileUri.split('/').pop() || 'video.mp4';
          const uploadId = uuidv4();
          const metadata = localVideos.find(v => v.filePath === fileUri);

          const baseRequest: TUploadRequest = {
            AccessToken: token,
            RequestHeader,
            Body: {
              chatId,
              accessToken: token,
              fileUri,
              uploadId,
              fileName,
              contentType: metadata.mimeType,
              isLastChunk: true,
              data: new Uint8Array(),
            },
          };

          const uploadResponse = await uploadFile(baseRequest).unwrap();

          if (uploadResponse.Response) {
            const { filePath, signedUrl, expirationTime, mimeType } = uploadResponse.Response;

            multimediaPayloads.push({
              filePath,
              signedUrl,
              expirationTime,
              mimeType,
            });

            updatedVideos.push({
              ...metadata,
              signedUrl,
              expirationTime,
              isLoading: false,
              filePath
            });
          }
        }

        const grpcMessage = SendMessageRequest.create({
          chatId,
          senderId: latestUser.id,
          messageId,
          timestamp: new Date().toISOString(),
          content: '',
          automated: false,
          multimedia: multimediaPayloads,
        });

        await MessageClient.sendMessage(grpcMessage, {
          meta: { Authorization: `Bearer ${token}` },
        }).response;

        if (storedMessage?.data?._id) {
          await updateMessage({
            messageId: storedMessage.data._id,
            updates: {
              status: 'sent',
              multimedia: updatedVideos,
            },
          });
        }
      }
    } catch (error) {
      console.error('❌ Error sending multiple videos:', error);
    }
  };

  const showBlink = useCallback(() => {
    if (true) {
      setBlinksData([]);
    } else {
      fetchBlinks();
    }
    blinkBottomSheetModalRef.current?.present();
  }, []);

  const handleCameraCapture = async () => {
    try {
      const image = await ImagePicker.openCamera({
        cropping: true,
        includeBase64: false,
        mediaType: 'photo',
      });

      if (image && chatId && token && latestUser) {
        const messageId = new Realm.BSON.ObjectId().toHexString();
        const multimediaPayloads: multimediaPayload[] = [];

        const media: UploadMedia = {
          name: image.path.split('/').pop() || 'file.jpg',
          filePath: image.path,
          mimeType: image.mime || 'image/jpeg',
          width: image.width,
          height: image.height,
          size: image.size,
          isLoading: true,
          localUri: image.path,
          retryStatus: 'uploading',
          uploadStage: 'initial',
        };

        const storedMessage = await addMessage({
          chatId,
          senderId: latestUser.id,
          content: '',
          messageId,
          status: 'uploading',
          automated: false,
          type: 'image',
          multimedia: [media],
        });

        media.uploadStage = 'generateUrl';
        if (storedMessage?.data)
          await updateMessage({ messageId: storedMessage.data._id, updates: { multimedia: [media] } });

        const res = await generateUploadUrl({
          chatId,
          fileName: media.name,
          contentType: media.mimeType,
          accessToken: token,
        }).unwrap();

        const uploadMeta = res?.Response;
        if (!uploadMeta || !uploadMeta.uploadUrl) throw new Error('Upload URL missing');

        media.uploadStage = 'uploading';
        if (storedMessage?.data)
          await updateMessage({ messageId: storedMessage.data._id, updates: { multimedia: [media] } });

        const fileContent = await RNFS.readFile(media.localUri, 'base64');
        const fileBuffer = Buffer.from(fileContent, 'base64');

        try {
          const uploadResponse = await axios.put(uploadMeta.uploadUrl, fileBuffer, {
            headers: {
              'Content-Type': media.mimeType,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          });
          console.log("✅ Upload response status:", uploadResponse.status);
        } catch (err) {
          console.log("❌ Upload failed:", err);
        }

        media.uploadStage = 'completed';
        media.retryStatus = 'success';
        media.signedUrl = uploadMeta.readUrl;
        media.filePath = uploadMeta.filePath;
        media.expirationTime = uploadMeta.expirationTime;
        media.isLoading = false;

        multimediaPayloads.push({
          filePath: uploadMeta.filePath,
          signedUrl: uploadMeta.readUrl,
          expirationTime: uploadMeta.expirationTime,
          mimeType: uploadMeta.mimeType,
        });

        if (storedMessage?.data)
          await updateMessage({ messageId: storedMessage.data._id, updates: { multimedia: [media] } });

        const grpcMessage = SendMessageRequest.create({
          chatId,
          senderId: latestUser.id,
          messageId,
          timestamp: new Date().toISOString(),
          content: '',
          automated: false,
          multimedia: multimediaPayloads,
        });

        await MessageClient.sendMessage(grpcMessage, {
          meta: { Authorization: `Bearer ${token}` },
        }).response;
        if (storedMessage?.data)
          await updateMessage({
            messageId: storedMessage.data._id,
            updates: { status: 'sent', multimedia: [media] },
          });
      }
    } catch (error) {
      console.error('❌ Error capturing image from camera:', error);
    }
  };

  const handleSearchBarFocus = useCallback(() => {
    blinkBottomSheetModalRef.current?.expand();
    Keyboard.isVisible();
  }, []);

  const handleChangeSearchQuery = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);


  const handleContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const { height } = e.nativeEvent.contentSize;
    setIsMultiline(height > 40);
  };


  const showSendSolScreen = useCallback(() => {
    (async () => {
      const otherUsers = await fetchOtherUser({ userId: localUserInfo.id || messageId, authToken: token }).unwrap();
      if (otherUsers["Response"]) {
        navigation.navigate('PortfolioScreen', {
          type: 'individual',
          receivers: [{
            ...otherUsers["Response"],
            id: otherUsers.Response.Id,
            username: otherUsers.Response.Username,
            fullName: otherUsers.Response.FullName,
            profilePicture: otherUsers.Response.ProfilePicture || '',
            backgroundColor: otherUsers.Response.BackgroundColor || '#FFF',
            lastActive: otherUsers.Response.LastActive,
            address: otherUsers.Response.Address,
            status: otherUsers.Response.Status?.toLowerCase() === 'online' ? 'online' : 'offline',
            chatId
          }]
        });
      }
    })()

  }, [type, messageId, name, chatId, chatIdInParams]);

  const renderMessageItem = useCallback<ListRenderItem<MessageType>>(
    ({ item, index }) => {
      return (
        <MessageItem
          messageType="individual"
          item={item}
          index={index}
          messages={[]}
          openSentToSlider={openSentToSlider}
          chatId={messageId}
          handleSendMessage={handleSendMessage}
          onReplyMessage={handleReplyMessage}
          simultaneousHandlers={sectionListRef}
        />
      );
    },
    [openSentToSlider, handleReplyMessage, messageId]
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
        : item?.type === 'video'
          ? 'Video'
          : item?.type === 'file'
            ? 'File'
            : item?.type === 'image'
              ? 'Image'
              : '';
    }
    return message.length > maxLength
      ? message.substring(0, maxLength) + '...'
      : message;
  };

  const onIgnoredEffectPress = () => {
    Keyboard.dismiss();
    handleBlur();
  };

  const toggleEmojiPicker = () => {
    setMultiMediaPicker(false);
    setShowEmojiPicker(!showEmojiPicker);
    if (!showEmojiPicker) {
      Keyboard.dismiss();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageToSend((prevMessage) => prevMessage + emoji);
  };

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

  const [activeIndex, setActiveIndex] = useState(0);


  return (
    <TouchableWithoutFeedback onPress={onIgnoredEffectPress}>
      <View style={{ flex: 1 }}>
        <View
          style={[
            {
              flex: 1,
            },
          ]}>
          <SafeScreen
            messageId={localUserInfo.id || messageId}
            groupName={name}
            type={type}
            profilePicture={profilePicture}
            backgroundColor={backgroundColor}
            lastActive={lastActive}
            timeStamp={timeStamp}
            onlineOffline={otherOnlineOffline as "online" | "offline"}
          >

            <KeyboardAvoidingView
              style={[layout.flex_1]}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View style={[layout.flex_1]}>
                <ImageBackground
                  style={[layout.absoluteFill, { opacity: 1 }]}
                  source={Images.background}>
                  <View style={[layout.absoluteFill]} />
                </ImageBackground>
                {
                  (pinnedMessages?.data?.length ?? 0) > 0 && (
                    <View style={[backgrounds.botCommandsBg, layout.row, gutters.paddingHorizontal_14, layout.itemsCenter, layout.justifyBetween, layout.height70]}>

                      <ScrollView
                        key={activeIndex}
                      >
                        {
                          pinnedMessages?.data?.map((_, index) => (
                            <View
                              key={index}
                              style={[index === activeIndex ? backgrounds.primary : backgrounds.white, index === activeIndex ? components.iconHeight15width4 : components.iconHeight2width4, borders.rounded_16, gutters.marginBottom_2]}>

                            </View>
                          ))
                        }
                      </ScrollView>


                      <PinnedList
                        setActiveIndex={setActiveIndex}
                        pinnedMessage={pinnedMessages?.data}

                      />


                      <ButtonVariant style={[layout.justifyEnd]} onPress={() => {
                        navigation.navigate("PinnedMessageScreen", {
                          messages: pinnedMessages?.data,
                          chatId
                        })
                      }}>
                        <ImageVariant
                          source={Images.pinned}
                          sourceDark={ImagesDark.pinned}
                          style={[components.iconSize28]}
                          resizeMode={'contain'}
                        />
                      </ButtonVariant>
                    </View>
                  )
                }
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
                  <NativeAnimated.View
                    style={[
                      borders.rounded_4,
                      gutters.marginTop_2,
                      gutters.padding_10,
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '92%',
                        alignSelf: 'center',
                        overflow: 'hidden',
                        ...(Platform.OS === 'android' ? {
                          renderToHardwareTextureAndroid: true,
                          elevation: 0.01,
                        } : {}),
                        shadowColor: 'rgba(0,0,0,0.1)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.8,
                        shadowRadius: 2,
                      },
                      animatedReplyStyle,
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
                  </NativeAnimated.View>
                )}

                <View>
                  <View style={[
                    // animatedContainerStyle,
                    layout.justifyCenter]}>
                    {isExpanded && (
                      <View
                        style={[
                          layout.row,
                          layout.itemsCenter,
                          layout.justifyStart,
                          gutters.paddingHorizontal_14,
                          components.messageSendBar,
                          gutters.paddingVertical_10,
                        ]}>
                        {
                          <ButtonVariant>
                            <ImageVariant
                              source={Images.gif}
                              sourceDark={ImagesDark.gif}
                              style={[
                                components.iconSize20,
                                gutters.marginRight_14,
                              ]}
                              resizeMode={'contain'}
                            />
                          </ButtonVariant>
                        }
                        {
                          <ButtonVariant onPress={showSendSolScreen}>
                            <ImageVariant
                              source={Images.transfer}
                              sourceDark={ImagesDark.transfer}
                              style={[
                                components.iconSize20,
                                gutters.marginRight_14,
                              ]}
                            />
                          </ButtonVariant>
                        }
                        {
                          <ButtonVariant onPress={showBlink}>
                            <ImageVariant
                              source={Images.clip}
                              sourceDark={ImagesDark.clip}
                              style={[
                                components.iconSize20,
                                gutters.marginRight_14,
                              ]}
                            />
                          </ButtonVariant>
                        }
                      </View>
                    )}
                  </View>
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

                    {(!multimediaPicker) ? (
                      <NativeAnimated.View style={[
                        isMultiline ? layout.alignSelfItemsEnd : null,
                      ]}>
                        <ButtonVariant
                          onPress={() => {
                            messageInputRef.current?.blur();
                            setShowEmojiPicker(false);
                            setMultiMediaPicker(true);
                          }}
                        >
                          <ImageVariant
                            source={Images.plus_Image}
                            sourceDark={ImagesDark.plus_Image}
                            style={[
                              components.iconSize28,
                              gutters.marginRight_14,
                            ]}
                            resizeMode="contain"
                          />
                        </ButtonVariant>
                      </NativeAnimated.View>
                    ) : <NativeAnimated.View style={[
                      isMultiline ? layout.alignSelfItemsEnd : null,
                    ]}>
                      <ButtonVariant
                        onPress={() => {
                          messageInputRef.current?.focus();
                          setMultiMediaPicker(false);
                        }}
                      >
                        <ImageVariant
                          source={Images.keyboard}
                          sourceDark={ImagesDark.keyboard}
                          style={[
                            components.iconSize28,
                            gutters.marginRight_16,
                          ]}
                          resizeMode="contain"
                        />
                      </ButtonVariant>
                    </NativeAnimated.View>}
                    {(
                      <View style={[
                        isMultiline ? layout.alignSelfItemsEnd : null,
                        gutters.marginBottom_6
                      ]}>
                        <ButtonVariant onPress={showSendSolScreen}>
                          <ImageVariant
                            source={Images.transfer}
                            sourceDark={ImagesDark.transfer}
                            style={[
                              components.iconSize20,
                              gutters.marginRight_14,
                            ]}
                          />
                        </ButtonVariant>
                      </View>
                    )}
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

              {multimediaPicker && (
                <MultiMediaPicker
                  docPicker={handleDocumentPicker}
                  blinksPicker={showBlink}
                  photosPicker={handleImagePicker}
                  cameraPicker={handleCameraCapture}
                  gifPicker={handleGifPicker}
                  videosPicker={handleVideoPicker} />
              )}
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
        <BottomSheetModal
          ref={sentToBottomSheetModalRef}
          index={0}
          snapPoints={sendToSnapPoints}
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
            <View
              style={[layout.row, layout.itemsCenter, gutters.marginBottom_20]}>
              <ButtonVariant
                onPress={() => {
                  sentToBottomSheetModalRef.current?.dismiss();
                }}>
                <ImageVariant
                  source={Images.arrowLeft}
                  sourceDark={ImagesDark.arrowLeft}
                  style={[components.iconSize20, gutters.marginRight_10]}
                />
              </ButtonVariant>
              <TextVariant style={[components.urbanist20BoldBlack]}>
                {t('confirmation')}
              </TextVariant>
            </View>

            <TextVariant
              style={[
                components.textCenter,
                components.urbanist14MediumcancelText,
              ]}>
              {t('youWillSend')}
            </TextVariant>
            <View
              style={[layout.itemsSelfCenter, layout.row, layout.itemsCenter, layout.justifyCenter]}>
              <TextVariant
                style={[
                  components.textCenter,
                  components.urbanist48RegularBlack,
                  gutters.marginRight_4,
                ]}>
                {solAmount}
              </TextVariant>
              <TextVariant
                style={[
                  components.textCenter,
                  components.urbanist24RegularBlack,
                  layout.alignSelfItemsEnd,
                  gutters.marginBottom_8,
                ]}>
                {tokenSymbol || 'SOL'}
              </TextVariant>
            </View>

            <View style={[gutters.marginVertical_10]}>
              <View
                style={[
                  layout.row,
                  layout.justifyBetween,
                  gutters.padding_14,
                  components.borderTopLeftRadius14,
                  components.borderTopRightRadius14,
                  backgrounds.messageInputBackground,
                ]}>
                <TextVariant style={[components.urbanist14RegularcancelText]}>
                  {t('to')}
                </TextVariant>
                {receiverAddress && (
                  <TextVariant style={[components.urbanist14RegularBlack]}>
                    {shortenAddress(receiverAddress)}
                  </TextVariant>
                )}
              </View>
              <View
                style={[
                  layout.row,
                  layout.justifyBetween,
                  gutters.padding_14,
                  components.borderBottomLeftRadius14,
                  components.borderBottomRightRadius14,
                  backgrounds.messageInputBackground,
                ]}>
                <TextVariant style={[components.urbanist14RegularcancelText]}>
                  {t('networkFee')}
                </TextVariant>
                <TextVariant style={[components.urbanist14RegularBlack]}>
                  {networkFee} {tokenSymbol || ''}
                </TextVariant>
              </View>
            </View>

            <ButtonVariant
              style={[
                components.blueBackgroundButton,
                layout.itemsCenter,
                gutters.padding_16,
                gutters.marginTop_20,
              ]}
              onPress={handleSendSol}>
              <TextVariant style={[components.urbanist16SemiBoldWhite]}>
                {t('send')}
              </TextVariant>
            </ButtonVariant>
            <ButtonVariant
              style={[
                layout.itemsCenter,
                gutters.padding_16,
                gutters.marginTop_20,
              ]}
              onPress={() => {
                sentToBottomSheetModalRef.current?.dismiss();
              }}>
              <TextVariant style={[components.urbanist14MediumcancelText]}>
                {t('cancel')}
              </TextVariant>
            </ButtonVariant>
            <View style={[layout.height30]} />
          </BottomSheetView>
        </BottomSheetModal>
        <BottomSheetModal
          ref={gifBottomSheetRef}
          index={0}
          snapPoints={['40%', '100%', '100%']}
          backdropComponent={renderBackdrop}
          onChange={handleSheetChanges}
          enableDismissOnClose
          enableContentPanningGesture={false}
          enableDynamicSizing={false}
          enableHandlePanningGesture={true}>
          <BottomSheetView
            style={[
              layout.itemsSelfCenter,
              layout.fullWidth,
              gutters.paddingHorizontal_14,
              { flex: 1 }
            ]}
            enableFooterMarginAdjustment={true}
          >
            {isLoading ? (
              <ActivityIndicator style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={gifs || []}
                numColumns={2}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                style={{ flexGrow: 1, minHeight: 600 }}
                contentContainerStyle={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingBottom: sheetIndex == 0 ? 520 : 10,
                }}
                columnWrapperStyle={{
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleGifSelected(item.images.original.url)}
                    style={{ borderRadius: 8, overflow: 'hidden' }}
                  >
                    <FastImage
                      source={{ uri: item.images.fixed_width.url }}
                      style={{ width: (screenWidth - 40) / 2, height: 150, borderRadius: 8 }}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </BottomSheetView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={blinkBottomSheetModalRef}
          index={0}
          snapPoints={['40%', '100%']}
          backdropComponent={props => (
            <TransparentBackdrop
              {...props}
              onPress={() => blinkBottomSheetModalRef.current?.dismiss()}
            />
          )}
          onChange={index => {
            setSheetIndex(index);
            setSheetVisible(index >= 0);
          }}
          enableDismissOnClose
          enableContentPanningGesture={false}
          enableDynamicSizing={false}
          enableHandlePanningGesture={true}>
          <BottomSheetView
            style={[
              layout.itemsSelfCenter,
              layout.fullWidth,
              gutters.paddingHorizontal_14,
              { flex: 1 },
            ]}
            enableFooterMarginAdjustment={true}>
            <SearchBar
              searchQuery={searchQuery}
              onChangeSearchQuery={value => handleChangeSearchQuery(value)}
              placeholder={t('searchBlinks')}
              style={[gutters.padding_5, gutters.marginBottom_8]}
              onFocus={handleSearchBarFocus}
            />
            {isBlinkLoading ? (
              <RenderBlinkSkeletonPlaceholder />
            ) : (
              <FlatList
                data={[...filteredBlinks]}
                keyExtractor={item => item.id}
                renderItem={renderMediaItem}
                numColumns={3}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingBottom: sheetIndex == 0 ? 520 : 10,
                }}
                style={{
                  flexGrow: 1,
                  minHeight: 600,
                }}
                columnWrapperStyle={{
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              />
            )}
          </BottomSheetView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={processingBottomSheetModalRef}
          index={0}
          snapPoints={processingSnapPoints}
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
            <View
              style={[layout.row, layout.itemsCenter, gutters.marginBottom_20]}>
              <ButtonVariant
                onPress={() => {
                  openSentToSlider({
                    receiverId: recipientId,
                    recipientAddress: receiverAddress || "",
                    recipientName: recipientName,
                    solAmount: solAmount,
                  });
                }}>
                <ImageVariant
                  source={Images.arrowLeft}
                  sourceDark={ImagesDark.arrowLeft}
                  style={[components.iconSize20, gutters.marginRight_10]}
                />
              </ButtonVariant>
              <TextVariant style={[components.urbanist20BoldBlack]}>
                {t('processing')}
              </TextVariant>
            </View>

            <ImageVariant
              source={Images.processingGif}
              sourceDark={ImagesDark.processingGif}
              style={[components.imageSize52, layout.itemsSelfCenter]}
            />
            <View style={[layout.height30]} />
            <View style={[layout.height30]} />
          </BottomSheetView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={insufficientBalanceModalRef}
          index={0}
          snapPoints={insufficientBalanceToSnapPoints}
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
            <View
              style={[layout.row, layout.itemsCenter, gutters.marginBottom_20]}>
              <ButtonVariant
                onPress={() => {
                  sentToBottomSheetModalRef.current?.dismiss();
                }}>
                <ImageVariant
                  source={Images.arrowLeft}
                  sourceDark={ImagesDark.arrowLeft}
                  style={[components.iconSize20, gutters.marginRight_10]}
                />
              </ButtonVariant>
              <TextVariant style={[components.urbanist20BoldBlack]}>
                {t('insufficientBalance')}
              </TextVariant>
            </View>

            <View
              style={[
                layout.itemsSelfCenter,
                layout.row,
                gutters.marginBottom_18,
              ]}>
              <TextVariant
                style={[
                  components.textCenter,
                  components.urbanist14RegularBlack,
                  gutters.marginRight_4,
                ]}>
                {t('insufficientBalanceDescription')}
              </TextVariant>
            </View>

            <View
              style={[
                layout.itemsSelfCenter,
                layout.row,
                layout.width100px,
                gutters.marginBottom_18,
              ]}>
              <TextVariant
                style={[
                  components.textCenter,
                  components.urbanist48RegularBlack,
                  gutters.marginRight_4,
                  { color: colors.error },
                ]}>
                {solAmount}
              </TextVariant>
              <TextVariant
                style={[
                  components.textCenter,
                  components.urbanist24RegularBlack,
                  layout.alignSelfItemsEnd,
                  gutters.marginBottom_8,
                  { color: colors.error },
                ]}>
                {t('sol')}
              </TextVariant>
            </View>

            <ButtonVariant
              style={[
                components.blueBackgroundButton,
                layout.itemsCenter,
                gutters.padding_14,
                gutters.marginBottom_8,
              ]}
              onPress={() => {
                insufficientBalanceModalRef.current?.dismiss();
                processingBottomSheetModalRef.current?.dismiss();
              }}>
              <TextVariant style={[components.urbanist16SemiBoldWhite]}>
                {t('close')}
              </TextVariant>
            </ButtonVariant>
            <View style={[layout.height30]} />
          </BottomSheetView>
        </BottomSheetModal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default React.memo(PrivateMessage);
