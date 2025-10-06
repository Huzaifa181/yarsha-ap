import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { SearchBar } from '@/components/molecules';
import { MultiMediaPicker, SafeScreen, SwipeBackWrapper } from '@/components/template';
import PinnedList from '@/components/template/Animated/AnimatedCarousel';
import { useRecentPicksPersistence } from '@/components/template/EmojiKeyboard/src';
import { EmojiKeyboard } from '@/components/template/EmojiKeyboard/src/EmojiKeyboard';
import { API_MAIN_NET, APP_CLUSTER } from '@/config';
import MessageRepository from '@/database/repositories/Message.repository';
import { useSelector } from '@/hooks';
import { useAddMessageMutation, useUpdateMessageMutation } from '@/hooks/domain';
import { useCreateTransactionMutation } from '@/hooks/domain/create-transaction/useCreateTransaction';
import { useFetchAllMessagesQuery, useFetchPinnedMessagesQuery } from '@/hooks/domain/db-messages/useDbMessages';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { useFetchGroupChatDetailQuery, useFetchParticipantByIdQuery, useLazyFetchGroupChatDetailQuery } from '@/hooks/domain/fetch-chat-details/useFetchChatDetails';
import { useGetTrendingGifsQuery } from '@/hooks/domain/fetch-gifs/useFetchGifs';
import { useMarkAsSeenMutation } from '@/hooks/domain/mark-as-seen/useMarkAsSeen';
import { useGenerateUploadUrlMutation } from '@/hooks/domain/upload-file/useUploadFile';
import { multimediaPayload, SendMessageRequest, transactionPayload } from '@/pb/message';
import { MessageServiceClient } from '@/pb/message.client';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import MessageStreamService from '@/services/streamingService/MessageStreamService';
import { RootState } from '@/store';
import { Images, ImagesDark, useTheme } from '@/theme';
import {
  GroupDetailsSpace,
  isImageSourcePropType,
  MessageType,
  SafeScreenNavigationProp,
  SafeScreenRouteProp
} from '@/types';
import { Blink } from '@/types/data/blink';
import {
  createSections,
  getInitials,
  getNetworkFee,
  heightPercentToDp
} from '@/utils';
import { IsBlinkUrl } from '@/utils/blinks';
import { createClusterConnection } from '@/utils/connection';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import { shortenAddress } from '@/utils/shortenAddress';
import FastImage from '@d11/react-native-fast-image';
import * as RNFS from '@dr.pogodin/react-native-fs';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  TouchableOpacity,
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
  EmitterSubscription,
  FlatList,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  ListRenderItem,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  SectionList,
  StyleSheet,
  TextInputContentSizeChangeEventData,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';
import { TextInput } from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-crop-picker';
import NativeAnimated, {
  cancelAnimation,
  Extrapolate,
  interpolate,
  Easing as NativeEasing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Realm from 'realm';
import MediaItem from '../../ProfileDetails/MediaItem';
import RenderBlinkSkeletonPlaceholder from '../Shared/BlinkSkeleton';
import MessageItem from '../Shared/MessageItem';
import TransparentBackdrop from '../Shared/TransparentBackDrop';
import FriendItem from './components/FriendItem';
import RecentUserItem from './components/RecentUserItem';
import { useFetchMessagesMutation } from '@/hooks/domain/fetch-messages/useFetchMessages';
import { PERMISSIONS } from 'react-native-permissions';
import { checkAndRequestPermission } from '@/utils/permissionHandler';

interface IProps { }

/**
 * @author Nitesh Raj Khanal
 * @function Message
 * @returns JSX.Element
 */

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

const Message: FC<IProps> = (props): React.JSX.Element => {
  const { t } = useTranslation(['translations']);

  const navigation = useNavigation<SafeScreenNavigationProp>();

  const screenWidth = Dimensions.get('window').width;

  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);

  const sectionListRef = useRef(null);

  const { layout, gutters, components, borders, backgrounds, colors } =
    useTheme();

  const [blinksData, setBlinksData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGroupChatLoading, setIsGroupChatLoading] = useState<boolean>(false);
  const [isBlinkLoading, setIsBlinkLoading] = useState<boolean>(false);
  const [networkFee, setNetworkFee] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const keyboardDidShowListener = useRef<EmitterSubscription | null>(null);
  const keyboardDidHideListener = useRef<EmitterSubscription | null>(null);
  const { data: gifs, isLoading } = useGetTrendingGifsQuery();
  const [multimediaPicker, setMultiMediaPicker] = useState<boolean>(false);

  const token = useSelector((state: RootState) => state.accessToken.authToken);
  const gifBottomSheetRef = useRef<BottomSheetModal>(null);

  const replySlideAnim = useSharedValue(0);

  useRecentPicksPersistence({
    initialization: () => AsyncStorage.getItem("recent").then((item) => JSON.parse(item || '[]')),
    onStateChange: (next) => AsyncStorage.setItem("recent", JSON.stringify(next)),
  });

  const [showMemberList, setShowMemberList] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState<GroupDetailsSpace.ChatParticipant[]>([]);

  const route = useRoute<
    SafeScreenRouteProp & {
      params: {
        chatId: string;
        tokenSymbol: string;
        name: string;
        groupName: string;
        type: string;
        profilePicture: string;
        actionUrl: string;
        transactionId: string;
        amount: number;
        recipientAddress: string;
        blinkDetails: any;
        receiverName?: string;
        membersCount?: number;
        receiverId?: string;
        backgroundColor?: string;
      };
    }
  >();
  const {
    chatId,
    name,
    type,
    profilePicture,
    tokenSymbol,
    actionUrl,
    transactionId,
    amount,
    groupName,
    recipientAddress: recipientAddressInProps,
    blinkDetails,
    receiverName,
    receiverId,
    backgroundColor
  } = route.params;
  const [isMultiline, setIsMultiline] = useState(false);

  const { data: chatDetailsData } = useFetchGroupChatDetailQuery({ ChatId: chatId }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const [generateUploadUrl] = useGenerateUploadUrlMutation();

  const { data: latestUser } = useFetchLatestUserQuery()

  const [addMessage] = useAddMessageMutation();
  const [updateMessage] = useUpdateMessageMutation();

  const { data: allMessages } = useFetchAllMessagesQuery({
    chatId
  }, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });
  const [fetchMessages] = useFetchMessagesMutation()
  const { data: pinnedMessages } = useFetchPinnedMessagesQuery(
    { chatId },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const [triggerFetchGroupDetails] =
    useLazyFetchGroupChatDetailQuery();

  const { data: groupChatDetails } = useFetchGroupChatDetailQuery({ ChatId: chatId }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  })

  const messageInputRef = useRef<TextInput>(null);
  const sentToBottomSheetModalRef = useRef<BottomSheetModal>(null);
  const blinkBottomSheetModalRef = useRef<BottomSheetModal>(null);
  const processingBottomSheetModalRef = useRef<BottomSheetModal>(null);
  const paticipantsSheetModalRef = useRef<BottomSheetModal>(null);
  const sendSolBottomSheetModalRef = useRef<BottomSheetModal>(null);
  const insufficientBalanceModalRef = useRef<BottomSheetModal>(null);
  const mentionUsersSliderRef = useRef<BottomSheet>(null);
  const animatedValue = useSharedValue(0);
  const [animatedExpandHeight] = useState(useSharedValue(0));
  const inputFlex = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);
  const toggleButtonOpacity = useSharedValue(0);

  useEffect(() => {
    const fetchMessagesFromMessage = async () => {
      console.log("chatId==>", chatId)
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

      // const response = await fetchMessages(fullRequest).unwrap();

      // console.log('📥 Initial message fetch response:', response);
    };

    fetchMessagesFromMessage();
  }, [chatId]);

  const [messageToSend, setMessageToSend] = useState<string>('');
  const [solAmount, setSolAmount] = useState<string>('0');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [recipientId, setRecipientId] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(0);
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

  const sendToSnapPoints = useMemo(
    () => [heightPercentToDp('30'), heightPercentToDp('30')],
    [],
  );
  const processingSnapPoints = useMemo(
    () => [heightPercentToDp('20'), heightPercentToDp('20')],
    [],
  );
  // const blinkSnapPoints = useMemo(() => ['30%', '100%'], []);
  const participantsSnapPoints = useMemo(
    () => [heightPercentToDp('60'), heightPercentToDp('60')],
    [],
  );
  const insufficientBalanceToSnapPoints = useMemo(
    () => [heightPercentToDp('30'), heightPercentToDp('30')],
    [],
  );

  const mentionUsersSliderSnapPoints = useMemo(
    () => [heightPercentToDp('30'), heightPercentToDp('30')],
    [],
  );


  const openInsufficientBalanceBottomSheet = () => {
    processingBottomSheetModalRef.current?.dismiss();
    insufficientBalanceModalRef.current?.present();
  };

  const handleCameraCapture = async () => {
    try {
      const permission = Platform.OS === 'android' ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA;
      const isAllowed = await checkAndRequestPermission(
        permission,
        t("cameraAccessDeniedTitle"),
        t("cameraAccessDeniedMessage2")
      );
      if (!isAllowed) return;
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

  const renderBackdrop = useCallback(
    (
      props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps,
    ) => (
      <BottomSheetBackdrop
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.02}
        {...props}
      />
    ),
    [],
  );

  const handleFocus = () => {
    setMultiMediaPicker(false);
    setIsFocused(true);
    setShowEmojiPicker(false);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsExpanded(false);
  };

  const fetchBlinks = useCallback(async () => {
    try {

    } catch (error) {
      console.error('Error fetching blinks:', error);
    } finally {
      setIsBlinkLoading(false);
    }
  }, []);



  const handleContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const { height } = e.nativeEvent.contentSize;
    setIsMultiline(height > 40);
  };


  const renderMediaItem = useCallback(
    ({ item }: { item: Blink }) => {
      const itemSize = screenWidth / 3 - 4;
      return (
        <View
          style={{ width: itemSize, marginHorizontal: 2, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              (async () => {
                if (true) {
                  await handleSendMessage({
                    content: item.actionUrl,
                    messageType: 'blink',
                    data: {
                      actionUrl: item.actionUrl,
                      blinkName: item.name,
                      blinkTitle: item.title,
                      blinkId: item.id,
                      senderAddress: "",
                      senderId: "",
                      senderName: "",
                    },
                  });
                  blinkBottomSheetModalRef.current?.dismiss();
                }
              })();
            }}>
            <MediaItem mediaSource={{ uri: item.icon }} itemSize={itemSize} />
          </TouchableOpacity>
        </View>
      );
    },
    [screenWidth],
  );

  const handleSheetChanges = useCallback((index: number) => {
    // console.log('handleSheetChanges', index);
  }, []);

  const showBlink = useCallback(() => {
    if (true) {
      setBlinksData([]);
    } else {
      fetchBlinks();
    }
  }, []);

  const showSendSolScreen = useCallback(() => {
    Keyboard.dismiss();
    setMultiMediaPicker(false);
    setShowEmojiPicker(false);
    triggerFetchGroupDetails({ ChatId: chatId })
    paticipantsSheetModalRef.current?.present();

  }, [type, chatId, groupName, name]);

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
    console.log("chatId===> innn")
    MessageStreamService.getInstance().subscribeToChat(chatId);

    return () => {
      MessageStreamService.getInstance().unsubscribeFromChat(chatId);
    }
  }, [chatId]);

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
        const multimediaPayloads: multimediaPayload[] = [];

        const localVideos: UploadMedia[] = videos.map(video => ({
          name: video.path.split('/').pop() || 'video.mp4',
          filePath: video.path,
          mimeType: video.mime || 'video/mp4',
          width: video.width,
          height: video.height,
          size: video.size,
          isLoading: true,
          localUri: video.path,
          retryStatus: 'uploading',
          uploadStage: 'initial',
          thumbnailUri: null,
        }));

        for (const video of localVideos) {
          try {
            const thumb = await createThumbnail({
              url: Platform.OS === 'android'
                ? `file://${video.filePath}`
                : video.filePath.replace('file://', ''),
              timeStamp: 1000,
            });
            video.thumbnailUri = thumb?.path;
          } catch (err) {
            console.error("❌ Error while creating thumbnail:", err, video.filePath);
          }
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

        for (const media of localVideos) {
          try {
            media.uploadStage = 'generateUrl';
            if (storedMessage?.data)
              await updateMessage({
                messageId: storedMessage?.data?._id,
                updates: { multimedia: localVideos },
              });

            const { Response: uploadMeta } = await generateUploadUrl({
              chatId,
              fileName: media?.name || "video.mp4",
              contentType: media.mimeType,
              accessToken: token,
            }).unwrap();

            if (!uploadMeta?.uploadUrl) throw new Error('Failed to get upload URL');

            media.uploadStage = 'uploading';
            if (storedMessage?.data)
              await updateMessage({
                messageId: storedMessage.data?._id,
                updates: { multimedia: localVideos },
              });
            console.log("uploadMeta==>", uploadMeta)
            const fileContent = await RNFS.readFile(media.localUri, 'base64');
            const fileBuffer = Buffer.from(fileContent, 'base64');
            await axios.put(uploadMeta.uploadUrl, fileBuffer, {
              headers: {
                'Content-Type': media.mimeType,
                'Content-Encoding': 'base64',
              },
            });

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
              await updateMessage({
                messageId: storedMessage.data?._id,
                updates: { multimedia: localVideos },
              });
          } catch (uploadError) {
            console.error('❌ Upload error:', uploadError);
            media.retryStatus = 'failed';
            media.uploadStage = media.uploadStage === 'generateUrl' ? 'generateUrl' : 'uploading';
            media.isLoading = false;
            if (storedMessage?.data)
              await updateMessage({
                messageId: storedMessage.data?._id,
                updates: { multimedia: localVideos },
              });
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
          if (storedMessage?.data)
            await updateMessage({
              messageId: storedMessage.data._id,
              updates: {
                status: 'sent',
                multimedia: localVideos,
              },
            });
        }
      }
    } catch (error) {
      console.error('❌ Error uploading videos:', error);
    }
  };

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

  const handleReplyMessage = useCallback((message: MessageType) => {
    cancelAnimation(replySlideAnim);
    setReplyingTo(message);

    replySlideAnim.value = withTiming(1, {
      duration: 280,
      easing: NativeEasing.bezier(0.16, 1, 0.3, 1),
    });
  }, []);

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

  const handleSearchBarFocus = useCallback(() => {
    // blinkBottomSheetModalRef.current?.expand();
    Keyboard.isVisible();
  }, []);

  const handleChangeSearchQuery = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const [createTransaction] = useCreateTransactionMutation();

  const handleGifPicker = () => {
    Keyboard.dismiss();
    setShowEmojiPicker(false);
    setMultiMediaPicker(false);
    gifBottomSheetRef.current?.present();
  };

  const handleGifSelected = async (gifUrl: string) => {
    gifBottomSheetRef.current?.dismiss();
    await handleSendMessage({ content: gifUrl, messageType: 'gif' });
  };

  const handleSendSol = async () => {
    if (recipientAddress) {
      sentToBottomSheetModalRef.current?.close();
      try {
        processingBottomSheetModalRef.current?.present();
        const connection = await createClusterConnection();
        if (!connection) throw new Error("No blockchain connection available");
        if (latestUser?.privateKey) {
          const secretKey = Uint8Array.from(Buffer.from(latestUser?.privateKey, 'base64'));
          const senderKeypair = Keypair.fromSecretKey(secretKey);

          const lamportsToSend = Math.floor(+solAmount * LAMPORTS_PER_SOL);

          const transaction = new Transaction();

          const recipientPubkey = new PublicKey(recipientAddress);

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
              toWallet: recipientAddress,
              cluster: API_MAIN_NET,
              signature,
            }
          }
          const createTransactionResponse = await createTransaction(createTransactionRequestPayload).unwrap();
          console.log(`✅ Sent to ${recipientAddress} with signature:`, signature);
          const messageId = new Realm.BSON.ObjectId().toHexString();

          let transactionPayload: transactionPayload = {
            amount: solAmount,
            fromWallet: senderKeypair.publicKey.toString(),
            senderId: latestUser?.id,
            signature: signature,
            timestamp: Math.floor(Date.now() / 1000).toString(),
            toWallet: recipientAddress,
            transactionId: createTransactionResponse.transactionId
          };

          const storedMessagePromise = addMessage({
            chatId: chatId,
            senderId: latestUser?.id,
            content: `${latestUser.fullName} has successfully sent ${createTransactionResponse.amount} SOL to ${recipientName} `,
            messageId,
            status: "pending",
            automated: false,
            type: 'transaction',
            transaction: transactionPayload
          }).unwrap();

          const grpcMessage = SendMessageRequest.create({
            chatId: chatId,
            senderId: latestUser?.id,
            messageId,
            timestamp: new Date().toISOString(),
            content: `${latestUser.fullName} has successfully sent ${createTransactionResponse.amount} SOL to ${recipientName} `,
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
        if ((error as string).includes('Insufficient balance')) {
          Keyboard.dismiss();
          openInsufficientBalanceBottomSheet();
        } else {
          Alert.alert('Transaction Error', error as string);
          console.error('Error sending SOL: ', error as string);
        }
      }
    }
  };

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

  const renderMessageItem = useCallback<ListRenderItem<MessageType>>(
    ({ item, index }) => {
      console.log("chatDetailsData in render message item", chatDetailsData)
      const { data: senderUser } = useFetchParticipantByIdQuery(item.senderId)
      return (
        (
          <MessageItem
            messageType={type}
            item={item}
            index={index}
            messages={[]}
            chatDetailsData={chatDetailsData}
            openSentToSlider={openSentToSlider}
            chatId={chatId}
            handleSendMessage={handleSendMessage}
            onReplyMessage={handleReplyMessage}
            simultaneousHandlers={sectionListRef}
          />
        )
      )
    },
    [openSentToSlider, type, chatDetailsData],
  );

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

  const openSendSOLSlider = useCallback(() => {
    sendSolBottomSheetModalRef.current?.present();
  }, []);

  const closeSendSOLSlider = useCallback(() => {
    sendSolBottomSheetModalRef.current?.dismiss();
  }, []);

  const closeParticipantsSiider = useCallback(() => {
    paticipantsSheetModalRef.current?.dismiss();
  }, []);

  const renderRecentUserItem = useCallback(
    ({ item }: { item: GroupDetailsSpace.ChatParticipant }) => (
      <RecentUserItem
        item={item}
        chatId={chatId}
        openSendSOLSlider={openSendSOLSlider}
        closeParticipantsSiider={closeParticipantsSiider}
        navigation={navigation}
        groupDetail={{
          membersCount: route.params.membersCount || chatDetailsData?.participantsId.length || 0,
          chatId,
          name,
          profilePicture: profilePicture || chatDetailsData?.groupIcon,
          backgroundColor: backgroundColor || chatDetailsData?.backgroundColor,
          type
        }}
      />
    ),
    [openSendSOLSlider, closeSendSOLSlider, groupName, chatId, navigation],
  );

  const renderFriendItem = useCallback(
    ({ item }: { item: GroupDetailsSpace.ChatParticipant }) => (
      <FriendItem
        item={item}
        chatId={chatId}
        openSendSOLSlider={openSendSOLSlider}
        closeParticipantsSiider={closeParticipantsSiider}
        navigation={navigation}
        groupDetail={{
          membersCount: route.params.membersCount || chatDetailsData?.participantsId.length || 0,
          chatId,
          name,
          profilePicture: profilePicture || chatDetailsData?.groupIcon,
          backgroundColor: backgroundColor || chatDetailsData?.backgroundColor,
          type
        }}
      />
    ),
    [openSendSOLSlider, closeSendSOLSlider, chatId, navigation],
  );

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

  const concatenatedNewMessage = useMemo(() => {
    const newMessages = allMessages?.data || [];
    return newMessages;
  }, [allMessages]);

  const [seenMessage] = useMarkAsSeenMutation()

  const sections = createSections(concatenatedNewMessage || []);

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

  const toggleIsExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => !prev);
  }, []);


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

  const markChatAsRead = async (chatId: string) => {

    try {
      const payload = { chatId };


    } catch (error) {
      console.error('Error in markChatAsRead:', error);
    }
  };

  const onIgnoredEffectPress = () => {
    toggleIsExpanded();
    Keyboard.dismiss();
    handleBlur();
    // mentionUsersSliderRef.current?.close();
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

  useEffect(() => {
    animatedExpandHeight.value = withTiming(isExpanded ? 50 : 0, {
      duration: 150,
      easing: NativeEasing.out(NativeEasing.ease),
    });
  }, [isExpanded]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      height: animatedExpandHeight.value,
      overflow: 'hidden',
    };
  });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: animatedValue.value }],
  }));

  const animatedInputStyle = useAnimatedStyle(() => ({
    flex: inputFlex.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonOpacity.value }],
  }));

  const animatedToggleButtonStyle = useAnimatedStyle(() => ({
    opacity: toggleButtonOpacity.value,
    transform: [{ scale: toggleButtonOpacity.value }],
  }));

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
    opacity: withTiming(messageToSend.length === 0 ? 1 : 1, { duration: 300 }),
  }));

  const handleTextChange = (message: string) => {
    imageScale.value = withTiming(message.length === 0 ? 0.9 : 1.1, { duration: 300 });
    // blinkBottomSheetModalRef.current?.dismiss();

    const atSymbolIndex = message.indexOf('@');
    const showMember = atSymbolIndex !== -1 && message[atSymbolIndex + 1] !== ' ';

    setShowMemberList(showMember);
    setMessageToSend(message);

    if (showMember) {
      const searchTerm = message.slice(atSymbolIndex + 1).trim();
      if (searchTerm === '') {
        setFilteredMembers([]);
      } else {
        const filtered = []?.filter((member: any) => member.username.toLowerCase().startsWith(searchTerm.toLowerCase())) || [];
        setFilteredMembers(filtered);
        if (filtered.length > 0) {
        } else {
        }
      }
    } else {
      setFilteredMembers([]);
    }
  };

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
        const multimediaPayloads: multimediaPayload[] = [];

        const localMedias: UploadMedia[] = images.map(image => ({
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
        }));

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

        const updatedMedias: any[] = [];

        for (const media of localMedias) {
          try {
            media.uploadStage = 'generateUrl';
            if (storedMessage?.data?._id)
              await updateMessage({
                messageId: storedMessage.data._id,
                updates: { multimedia: localMedias },
              });

            const { Response: uploadMeta } = await generateUploadUrl({
              chatId,
              fileName: media.name,
              contentType: media.mimeType,
              accessToken: token,
            }).unwrap();

            if (!uploadMeta?.uploadUrl) throw new Error('Failed to get upload URL');

            media.uploadStage = 'uploading';
            if (storedMessage?.data?._id)
              await updateMessage({
                messageId: storedMessage.data._id,
                updates: { multimedia: localMedias },
              });
            console.log("media===>", media)
            console.log("uploadMeta===>", uploadMeta)
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

            updatedMedias.push(media);
          } catch (uploadError) {
            console.error('Upload failed for file:', media.name, uploadError);
            media.retryStatus = 'failed';
            media.uploadStage = media.uploadStage === 'generateUrl' ? 'generateUrl' : 'uploading';
            console.log("localMedias after catch==>", localMedias);

            if (storedMessage?.data?._id)
              await updateMessage({
                messageId: storedMessage.data._id,
                updates: { multimedia: localMedias },
              });
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
          if (storedMessage?.data)
            await updateMessage({
              messageId: storedMessage?.data?._id,
              updates: {
                status: 'sent',
                multimedia: localMedias,
              },
            });
        }
      }
    } catch (error) {
      console.error('❌ Error uploading images:', error);
    }
  };

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

  return (
    <SwipeBackWrapper>
      <TouchableWithoutFeedback onPress={onIgnoredEffectPress}>
        <View style={{ flex: 1 }}>
          <NativeAnimated.View
            style={[
              {
                flex: 1,
                backgroundColor: "white"
              },
              animatedSheetStyle,
            ]}>
            <SafeScreen
              backgroundColor={backgroundColor || chatDetailsData?.backgroundColor}
              messageId={chatId}
              groupName={name}
              type={type}
              profilePicture={profilePicture || chatDetailsData?.groupIcon}
              membersCount={route.params.membersCount || chatDetailsData?.participantsId.length}>
              <KeyboardAvoidingView
                style={[layout.flex_1]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
                      showsVerticalScrollIndicator={false}
                      scrollEventThrottle={16}
                      initialNumToRender={10}
                      maxToRenderPerBatch={10}
                      bounces={false}
                      bouncesZoom={false}
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
                      windowSize={15}
                      getItemLayout={(data, index) => ({
                        length: 80,
                        offset: 80 * index,
                        index,
                      })}
                      // onViewableItemsChanged={updateStickyDate}
                      inverted={sections.length > 0}
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
                        // console.log("response===>", response)
                        // console.log("earliest", earliest?.createdAt)
                        // const timeStamp = new Date(earliest?.createdAt || Date.now()).getTime().toString();
                        // MessageStreamService.getInstance().subscribeToChat(chatId, timeStamp, 50, 'before')
                      }}

                    />
                  )}
                  {((sections.length == 0) || (sections.length === 1 && sections[0].data.length === 1 && sections[0].data[0]?.automated == true)) && (
                    <View
                      style={[
                        layout.absoluteFill,
                        layout.justifyCenter,
                        layout.itemsCenter,
                      ]}>
                      <ImageBackground
                        source={Images.cardBody}
                        resizeMode="contain"
                        style={[
                          gutters.padding_40,
                          { backgroundColor: `${colors.chatInfo}5` },
                        ]}>
                        {/* <TextVariant
                          style={[
                            components.urbanist18RegularBlack,
                            gutters.marginBottom_14,
                            components.textCenter,
                          ]}>
                          {t('youCreatedAGroup')}
                        </TextVariant> */}
                        <TextVariant style={[components.urbanist18RegularBlack]}>
                          {t('groupsCanHave')}
                        </TextVariant>
                        <View
                          style={[
                            layout.row,
                            layout.itemsCenter,
                            gutters.marginTop_6,
                          ]}>
                          <ImageVariant
                            source={Images.tick}
                            sourceDark={ImagesDark.tick}
                            style={[
                              components.iconSize24,
                              { backgroundColor: `${colors}` },
                            ]}
                            resizeMode="contain"
                          />
                          <TextVariant
                            style={[
                              components.urbanist18RegularBlack,
                              gutters.marginLeft_10,
                            ]}>
                            {t('upto500000')}
                          </TextVariant>
                        </View>
                        <View
                          style={[
                            layout.row,
                            layout.itemsCenter,
                            gutters.marginTop_6,
                          ]}>
                          <ImageVariant
                            source={Images.tick}
                            sourceDark={ImagesDark.tick}
                            style={[components.iconSize24]}
                            resizeMode="contain"
                          />
                          <TextVariant
                            style={[
                              components.urbanist18RegularBlack,
                              gutters.marginLeft_10,
                            ]}>
                            {t('persistentHistory')}
                          </TextVariant>
                        </View>
                        <View
                          style={[
                            layout.row,
                            layout.itemsCenter,
                            gutters.marginTop_6,
                          ]}>
                          <ImageVariant
                            source={Images.tick}
                            sourceDark={ImagesDark.tick}
                            style={[components.iconSize24]}
                            resizeMode="contain"
                          />
                          <TextVariant
                            style={[
                              components.urbanist18RegularBlack,
                              gutters.marginLeft_10,
                            ]}>
                            {t('adminWithRight')}
                          </TextVariant>
                        </View>
                      </ImageBackground>
                    </View>
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
                  <View style={{ zIndex: 1000, backgroundColor: "white", paddingBottom: isKeyboardVisible ? 0 : 20 }}>
                    <NativeAnimated.View
                      style={[
                        animatedContainerStyle,
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
                          <TouchableOpacity
                            onPress={handleDocumentPicker}
                            style={styles.mediaButton}
                          >
                            <ImageVariant
                              source={Images.document}
                              sourceDark={ImagesDark.document}
                              style={components.iconSize24}
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </NativeAnimated.View>

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
                          // animatedButtonStyle
                          isMultiline ? layout.alignSelfItemsEnd : null,
                        ]}>
                          <ButtonVariant
                            onPress={() => {
                              // messageInputRef.current?.blur();
                              setShowEmojiPicker(false);
                              setMultiMediaPicker(true);
                            }}
                            hitSlop={{
                              top: 10,
                              bottom: 10,
                              left: 10,
                              right: 10
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
                            // messageInputRef.current?.focus();
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
                        <NativeAnimated.View style={[
                          // animatedButtonStyle
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
                        </NativeAnimated.View>
                      )}
                      {/* {!isFocused && (
                      <NativeAnimated.View style={[
                        // animatedButtonStyle
                      ]}>
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
                      </NativeAnimated.View>
                    )} */}
                      {/* {isFocused && (
                      <NativeAnimated.View style={[
                        // animatedToggleButtonStyle
                      ]}>
                        <ButtonVariant onPress={toggleIsExpanded}>
                          <ImageVariant
                            source={isExpanded ? Images.more_active : Images.more}
                            sourceDark={
                              isExpanded
                                ? ImagesDark.more_active
                                : ImagesDark.more
                            }
                            style={[
                              components.iconSize20,
                              gutters.marginRight_14,
                            ]}
                          />
                        </ButtonVariant>
                      </NativeAnimated.View>
                    )} */}
                      <NativeAnimated.View
                        style={[
                          layout.row,
                          layout.justifyBetween,
                          gutters.marginRight_14,
                          layout.itemsCenter,
                          layout.flex_1,
                          backgrounds.messageInputBackground,
                          borders.roundedTop_20,
                          borders.roundedBottom_20,
                          gutters.paddingVertical_2,
                          gutters.paddingHorizontal_10,
                          {
                            borderTopLeftRadius: 20,
                            borderBottomLeftRadius: 20,
                            borderTopRightRadius: 20,
                            borderBottomRightRadius: 20
                          },
                          animatedInputStyle,
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
                            borders.roundedTop_20,
                            borders.roundedBottom_20,
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
                            // ref={messageInputRef}
                            value={messageToSend}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            returnKeyLabel="default"
                            returnKeyType="default"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete='off'
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
                              { maxHeight: 120 },
                            ]}
                            onSubmitEditing={() => {
                              // messageInputRef.current?.blur();
                            }}
                            submitBehavior="newline"
                            multiline
                            onKeyPress={({ nativeEvent }) => {
                              if (nativeEvent.key === 'Enter') {
                                handleTextChange(messageToSend + '\n');
                              }
                            }}
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
                        <NativeAnimated.View style={[
                          animatedImageStyle
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
                        </NativeAnimated.View>
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
                    videosPicker={handleVideoPicker}
                  />
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
          </NativeAnimated.View>
          <BottomSheetModal
            ref={sentToBottomSheetModalRef}
            index={2}
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
                style={[
                  layout.itemsSelfCenter,
                  layout.row,
                  layout.fullWidth,
                  layout.itemsCenter,
                  layout.justifyCenter,
                ]}>
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
                  {recipientAddress && (
                    <TextVariant style={[components.urbanist14RegularBlack]}>
                      {shortenAddress(recipientAddress)}
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
            snapPoints={['40%', '100%', '100%']}
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
                  removeClippedSubviews={false}
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
                      recipientAddress: recipientAddress,
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
            ref={paticipantsSheetModalRef}
            index={2}
            snapPoints={participantsSnapPoints}
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
              {isGroupChatLoading ? (
                renderSkeletonPlaceholder()
              ) : (
                <>
                  <FlatList
                    data={
                      (groupChatDetails?.participants ?? []).filter(
                        (participant: GroupDetailsSpace.ChatParticipant) => participant.id !== '',
                      )
                    }
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    scrollEventThrottle={16}
                    initialNumToRender={10}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[gutters.marginVertical_14]}
                    renderItem={renderRecentUserItem}
                    removeClippedSubviews={false}
                  />

                  <FlatList
                    data={
                      (groupChatDetails?.participants ?? []).filter(
                        (participant: GroupDetailsSpace.ChatParticipant) => participant.id !== '',
                      )
                    }
                    keyExtractor={(item, index) =>
                      Math.random().toString() + item.id + index
                    }
                    scrollEventThrottle={16}
                    initialNumToRender={10}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[layout.flexGrow]}
                    renderItem={renderFriendItem}
                    contentInset={{ top: 0, bottom: 50, left: 0, right: 0 }}
                    contentInsetAdjustmentBehavior="automatic"
                    removeClippedSubviews={false}
                  />
                </>
              )}
            </BottomSheetView>
          </BottomSheetModal>
          <BottomSheetModal
            ref={insufficientBalanceModalRef}
            index={2}
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
                    processingBottomSheetModalRef.current?.dismiss();
                    insufficientBalanceModalRef.current?.dismiss();
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
                  layout.fullWidth,
                  layout.itemsCenter,
                  layout.justifyCenter,
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
                  {tokenSymbol || ''}
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
                  processingBottomSheetModalRef.current?.dismiss();
                  sentToBottomSheetModalRef.current?.dismiss();
                  insufficientBalanceModalRef.current?.dismiss();
                }}>
                <TextVariant style={[components.urbanist16SemiBoldWhite]}>
                  {t('close')}
                </TextVariant>
              </ButtonVariant>
              <View style={[layout.height30]} />
            </BottomSheetView>
          </BottomSheetModal>

          {showMemberList && <BottomSheet
            ref={mentionUsersSliderRef}
            android_keyboardInputMode="adjustResize"
            index={0}
            snapPoints={mentionUsersSliderSnapPoints}
            backdropComponent={renderBackdrop}
            onChange={handleSheetChanges}
            // enableDismissOnClose
            enablePanDownToClose={true}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            backgroundStyle={[backgrounds.white, borders.roundedTop_0, gutters.marginBottom_125]}
            handleIndicatorStyle={[layout.width40, backgrounds.cream]}
            handleComponent={null}
          >
            <BottomSheetView
              style={[
                layout.itemsSelfCenter,
                layout.fullWidth,
                gutters.paddingHorizontal_14
              ]}>

              <FlatList
                data={filteredMembers}
                keyExtractor={(item) => `${item.id}-${item.username}-mention`}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                style={[layout.flexGrow, gutters.paddingBottom_60]}
                renderItem={({ item, index }) => {
                  return (
                    <ButtonVariant
                      onPress={() => {
                        const atSymbolIndex = messageToSend.indexOf('@');
                        const searchTerm = messageToSend.slice(atSymbolIndex + 1).trim();
                        const newMessage = messageToSend.replace(searchTerm, item.username);
                        setMessageToSend(newMessage);
                        mentionUsersSliderRef.current?.close();
                      }}
                      style={{ borderBottomWidth: 1, borderColor: "#EBECFF" }}
                    >
                      <View style={[layout.row, layout.itemsCenter, gutters.paddingVertical_10]}>
                        {
                          item.profilePicture ? (
                            <FastImage
                              source={{ uri: item.profilePicture }}
                              style={[components.iconSize32, borders.rounded_500, gutters.marginRight_10]}
                            />
                          ) : (<View
                            style={[components.iconSize32, gutters.marginRight_14, borders.rounded_500, { backgroundColor: item.backgroundColor }, layout.itemsCenter, layout.justifyCenter]}
                          >
                            <TextVariant style={[components.urbanist18BoldWhite]}>
                              {getInitials(item.username as string)}
                            </TextVariant>
                          </View>)
                        }
                        <TextVariant style={[components.urbanist16RegularBlack]}>{item.username}</TextVariant>
                      </View>
                    </ButtonVariant>
                  )
                }}
              />

              <View style={[layout.height30]} />
            </BottomSheetView>
          </BottomSheet>}

        </View>
      </TouchableWithoutFeedback>
    </SwipeBackWrapper>
  );
};

const styles = StyleSheet.create({
  mediaButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default React.memo(Message);