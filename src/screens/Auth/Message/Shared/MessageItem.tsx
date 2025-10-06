"use client"

import { ButtonVariant, ImageVariant, TextVariant } from "@/components/atoms"
import { API_MAIN_NET } from "@/config"
import MessageRepository from "@/database/repositories/Message.repository"
import { useDispatch } from "@/hooks"
import { useGetSwapMessageMutation, useUpdateMessageMutation } from "@/hooks/domain"
import { useFetchLatestUserQuery } from "@/hooks/domain/db-user/useDbUser"
import { useFetchParticipantByIdQuery } from "@/hooks/domain/fetch-chat-details/useFetchChatDetails"
import { fetchMessagesApi } from "@/hooks/domain/fetch-messages/useFetchMessages"
import { usePinMessageMutation, useUnPinMessageMutation } from "@/hooks/domain/pin-message/usePinMessage"
import { useReactToMessageMutation } from "@/hooks/domain/react-to-message/useReactToMessage"
import { useGenerateUploadUrlMutation, useLazyGetFileUrlQuery } from "@/hooks/domain/upload-file/useUploadFile"
import type { ReactionPayload } from "@/pb/stream.message"
import { reduxStorage, type RootState } from "@/store"
import { Images, ImagesDark, useTheme } from "@/theme"
import type { MessageType, SafeScreenNavigationProp } from "@/types"
import { formatTimestampToLocalTimeAMPM, getInitials, heightPercentToDp, processTransaction } from "@/utils"
import FastImage from "@d11/react-native-fast-image"
import * as RNFS from "@dr.pogodin/react-native-fs"
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet"
import type { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types"
import Clipboard from "@react-native-clipboard/clipboard"
import { useNavigation } from "@react-navigation/native"
import { Connection, Keypair } from "@solana/web3.js"
import axios from "axios"
import emojiData from "emoji-datasource/emoji.json"
import { getLinkPreview } from "link-preview-js"
import React, { type FC, memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import FileViewer from "react-native-file-viewer"
import { PanGestureHandler } from "react-native-gesture-handler"
import Modal from "react-native-modal"
import Animated, {
  Easing as NativeEasing,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { useSelector } from "react-redux"
import { z } from "zod"
import Avatar from "../../../../components/template/Card/ImageOrInitials"
import BlinkPreview from "../Blink"
import DocumentList from "./components/DocumentList"
import GIFGrid from "./components/GifGrid"
import ImageGrid from "./components/ImageGrid"
import ImageModal from "./components/ImageModal"
import VideoGrid from "./components/VideoGrid"
import VideoModal from "./components/VideoModal"
import { useFetchChatDetailsMutation } from "@/hooks/domain/fetch-chats/useFetchChats"
import { generateRequestHeader } from "@/utils/requestHeaderGenerator"
import { useMarkAsSeenMutation } from "@/hooks/domain/mark-as-seen/useMarkAsSeen"
import { useGeneratePeerChatMutation } from "@/hooks/domain/individual-chat/individualChats"
import { CheckIndividualChatRequestWrapper } from "@/pb/groupchat"

/**
 * @author Nitesh Raj Khanal
 * @function MessageItem
 * @returns JSX.Element
 */

type SentToSliderProps = {
  solAmount: string
  recipientAddress: string
  recipientName: string
  receiverId: string
}

interface VideoModalProps {
  isVisible: boolean
  videos: string[]
  currentIndex: number
  onClose: () => void
}

interface ImageModalProps {
  isVisible: boolean
  images: string[]
  currentIndex: number
  onClose: () => void
  handleNextImage: () => void
  handlePrevImage: () => void
}

type EmojiModalProps = {
  isVisible: boolean
  onClose: () => void
  onSelectEmoji: (emoji: string) => void
}

const unifiedToEmoji = (unified: string) =>
  unified
    .split("-")
    .map((u) => String.fromCodePoint(Number.parseInt(u, 16)))
    .join("")

const urlRegex = /(https?:\/\/[^\s]+)/

const MessageItem: FC<{
  messageType?: string
  item: MessageType
  index: number
  messages: any
  chatId: string
  openSentToSlider: (props: SentToSliderProps) => void
  handleSendMessage?: any
  onReplyMessage?: (message: MessageType) => void
  simultaneousHandlers: any
  isNewMessage?: boolean
  botId?: string
  chatDetailsData?: any
}> = memo(
  ({
    messageType,
    item,
    index,
    messages,
    openSentToSlider,
    chatId,
    handleSendMessage,
    onReplyMessage,
    simultaneousHandlers,
    isNewMessage = false,
    botId,
    chatDetailsData
  }) => {
    console.log("chatDetailsData in message item", chatDetailsData)
    const dispatch = useDispatch();
    const [fetchChatDetails] = useFetchChatDetailsMutation()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const reactionSheetRef = useRef<BottomSheetModal>(null);
    const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(null);
    const { data: senderUser } = useFetchParticipantByIdQuery(item.senderId)
    const [updateMessage] = useUpdateMessageMutation();
    const [generateUploadUrl] = useGenerateUploadUrlMutation();
    const [pinMessage] = usePinMessageMutation();
    const [unPinMessage] = useUnPinMessageMutation();
    const [reactToMessage] = useReactToMessageMutation();
    const [getFileUrl] = useLazyGetFileUrlQuery();

    const [reactionUsers, setReactionUsers] = useState<ReactionPayload[]>([]);
    const [reactionEmoji, setReactionEmoji] = useState<string>('');

    const openReactionSheet = (emoji: string, users: ReactionPayload[]) => {
      setReactionEmoji(emoji);
      setReactionUsers(users);
      reactionSheetRef.current?.present()
    };
    const token = useSelector((state: RootState) => state.accessToken.authToken);
    const [seenMessage] = useMarkAsSeenMutation()
    const [generatePeerChat] = useGeneratePeerChatMutation();

    const [isEmojiModalVisible, setIsEmojiModalVisible] = useState(false);
    const [swappingToken, setSwappingToken] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [imagesToRender, setGroupImagesToRender] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
    const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
    const [videosToRender, setVideosToRender] = useState<string[]>([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
    const [getSwapMessage, { isLoading: isSwappingToken }] = useGetSwapMessageMutation()

    const navigation = useNavigation<SafeScreenNavigationProp>()
    const { layout, borders, backgrounds, gutters, components, colors } =
      useTheme();
    const { t } = useTranslation(['translations']);
    const [linkPreviewData, setLinkPreviewData] = useState<any>(null);

    const { data: latestUser } = useFetchLatestUserQuery();

    const direction: 'sent' | 'received' =
      item?.senderId === latestUser?.id ? 'sent' : 'received';
    const isSameSenderAsPrevious =
      index > 0 && messages[index - 1]?.senderId === item?.senderId;
    const isSameSenderAsNext =
      index < messages.length - 1 &&
      messages[index + 1]?.senderId === item?.senderId;

    const borderRadius = {
      borderTopEndRadius: 0,
      borderBottomEndRadius: 0,
      borderBottomStartRadius: 15,
      borderTopStartRadius: 15,
    };

    const borderRadiusSingle = {
      borderTopEndRadius: 15,
      borderBottomEndRadius: 0,
      borderBottomStartRadius: 15,
      borderTopStartRadius: 15,
    };

    const borderRadiusReceived = {
      borderTopEndRadius: 15,
      borderBottomEndRadius: 15,
      borderBottomStartRadius: 0,
      borderTopStartRadius: 0,
    };

    const borderRadiusReceivedSingle = {
      borderTopEndRadius: 15,
      borderBottomEndRadius: 15,
      borderBottomStartRadius: 0,
      borderTopStartRadius: 15,
    };

    const borderTopRadius = {
      borderTopStartRadius: 15,
      borderTopEndRadius: 15,
      borderBottomStartRadius: 15,
    };

    const borderBottomRadius = {
      borderBottomStartRadius: 15,
      borderBottomEndRadius: 15,
      borderTopStartRadius: 15,
    };

    const borderTopRadiusReceived = {
      borderTopStartRadius: 15,
      borderTopEndRadius: 15,
      borderBottomEndRadius: 15,
    };

    const borderBottomRadiusReceived = {
      borderBottomStartRadius: 15,
      borderBottomEndRadius: 15,
      borderTopEndRadius: 15,
    };

    const defaultBorder = {
      borderRadius: 15,
    };

    const defaultBorderBottom = {
      borderBottomEndRadius: 15,
      borderBottomStartRadius: 15,
    };

    const defaultBorderTop = {
      borderTopEndRadius: 15,
      borderTopStartRadius: 15,
    };

    let borderStyle = {};

    if (direction === 'sent') {
      if (isSameSenderAsNext && isSameSenderAsPrevious) {
        borderStyle = borderRadius;
      } else if (isSameSenderAsPrevious) {
        borderStyle = borderTopRadius;
      } else if (isSameSenderAsNext) {
        borderStyle = borderBottomRadius;
      } else {
        borderStyle = borderRadiusSingle;
      }
    } else if (direction === 'received') {
      if (isSameSenderAsNext && isSameSenderAsPrevious) {
        borderStyle = borderRadiusReceived;
      } else if (isSameSenderAsPrevious) {
        borderStyle = borderTopRadiusReceived;
      } else if (isSameSenderAsNext) {
        borderStyle = borderBottomRadiusReceived;
      } else {
        borderStyle = borderRadiusReceivedSingle;
      }
    }

    const isUrlMessage = (message: string) => {
      return urlRegex.test(message) && item?.type !== 'blink';
    };

    const messageTime = formatTimestampToLocalTimeAMPM(item.createdAt);

    const getGroupedReactions = (reactions: ReactionPayload[] = []) => {
      const grouped: { [emoji: string]: ReactionPayload[] } = {};

      reactions.forEach(reaction => {
        if (!grouped[reaction.reaction]) {
          grouped[reaction.reaction] = [];
        }
        grouped[reaction.reaction].push(reaction);
      });

      return Object.entries(grouped).map(([emoji, users]) => ({ emoji, users }));
    };


    const saveImageLocally = async (remoteUrl: string, fileName: string) => {
      const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      const folderPath = localPath.substring(0, localPath.lastIndexOf('/'));

      try {
        const folderExists = await RNFS.exists(folderPath);
        if (!folderExists) await RNFS.mkdir(folderPath);

        const fileExists = await RNFS.exists(localPath);
        if (!fileExists) {
          console.log("remoteUrl saveImageLocally==>", remoteUrl)
          console.log("localPath saveImageLocally==>", localPath)
          const result = await RNFS.downloadFile({
            fromUrl: remoteUrl,
            toFile: localPath,
          }).promise;

          if (result.statusCode !== 200) {
            console.error('❌ Download failed saveImageLocally', result);
            return null;
          }
        }

        const verified = await RNFS.exists(localPath);
        return verified ? localPath : null;
      } catch (error) {
        console.error('❌ Error saving file:', error);
        return null;
      }
    };

    const handlePrevVideo = () => {
      if (currentVideoIndex > 0) {
        setCurrentVideoIndex(currentVideoIndex - 1);
      }
    };

    const messageSnapPoints = useMemo(
      () => [heightPercentToDp('42'), heightPercentToDp('42')],
      [],
    );

    const reactionSnapPoints = useMemo(
      () => [heightPercentToDp('42'), heightPercentToDp('42')],
      [],
    );

    const isPortrait = item.data?.height > item.data?.width;

    const imageSize = isPortrait ? { width: 150, height: 300 } : { width: 300, height: 150 };

    const openVideoModal = (videos: string[], thumbnails: string[], index: number) => {
      setVideosToRender(videos);
      setCurrentVideoIndex(index);
      setIsVideoModalVisible(true);
    };

    const handleNextVideo = () => {
      if (currentVideoIndex < videosToRender.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
      }
    };

    useEffect(() => {
      let isMounted = true;

      const refreshSignedUrlsIfExpired = async () => {
        if (
          ['image', 'video', 'file'].includes(item?.type) &&
          Array.isArray(item?.multimedia)
        ) {
          const updatedData = await Promise.all(
            item.multimedia.map(async (media: any) => {
              if (!media.filePath) return media;

              const localFileName = `${item._id}_${media.filePath}`;
              const localPath = `${RNFS.DocumentDirectoryPath}/${localFileName}`;
              const fileExists = await RNFS.exists(localPath);
              const now = Date.now();
              const expired = media.expirationTime && now > Number(media.expirationTime);

              let signedUrl = media.signedUrl;
              let expirationTime = media.expirationTime;
              let localUri: string | null = localPath;
              const thumbnailUri = media.thumbnailUri;

              if (expired) {
                try {
                  const result = await getFileUrl({
                    fileId: media.filePath,
                    accessToken: token,
                  }).unwrap();
                  signedUrl = result.signedUrl;
                  expirationTime = result.expirationTime;
                } catch (error) {
                  console.error('❌ Failed to refresh signed URL:', error);
                  return media;
                }
              }

              if (!fileExists) {
                try {
                  localUri = await saveImageLocally(signedUrl, localFileName);
                  const fileReady = localUri && (await RNFS.exists(localUri));
                  if (!fileReady || !isMounted) {
                    console.warn('❌ File not ready after download or unmounted:', localUri);
                    return media;
                  }
                } catch (error) {
                  console.error('❌ Error saving file:', error);
                  return media;
                }
              }

              return {
                ...media,
                signedUrl,
                expirationTime,
                localUri,
                thumbnailUri,
              };
            })
          );

          if (!isMounted) return;

          await updateMessage({
            messageId: item._id,
            updates: {
              multimedia: updatedData,
            },
          });
        }
      };

      refreshSignedUrlsIfExpired();

      return () => {
        isMounted = false;
      };
    }, []);

    const fetchUrlPreview = async (url: string) => {
      try {
        const actionKey = `preview_${item?._id}`;
        const cachedPreview = await reduxStorage.getItem(actionKey);
        if (cachedPreview) {
          const data = JSON.parse(cachedPreview);
          setLinkPreviewData(data);
        } else {
          const previewData = await getLinkPreview(url, {
            timeout: 10000,
          });
          reduxStorage.setItem(actionKey, JSON.stringify(previewData));
          setLinkPreviewData(previewData);
        }
      } catch (error) {
        console.error('Error fetching URL preview:', error);
      }
    };

    useEffect(() => {
      if (item?.type != "image" && item?.type != "gif" && item?.type != "file" && item?.type != "video")
        if (item?.content) {
          const urls = item?.content.match(urlRegex);
          if (isUrlMessage(item?.content) && urls) {
            fetchUrlPreview(urls[0]);
          }
        }
    }, [item]);

    const handleEmojiReaction = async (emoji: string) => {
      if (!item.serverId) return;
      try {
        await reactToMessage({
          chatId,
          messageId: item.serverId,
          reaction: emoji,
          token,
        }).unwrap();
        console.log('✅ Reaction sent:', emoji);
        reactionSheetRef?.current?.dismiss();
        bottomSheetModalRef?.current?.dismiss();
      } catch (err) {
        console.error('❌ Failed to send reaction:', err);
      }
    };

    const translateX = useSharedValue(0);
    const translateXModal = useSharedValue(0);

    let containsSOL = false;
    let cryptoAmount;
    if (item?.type != "image" && item?.type != "gif" && item?.type != "file" && item?.type != "video" && messageType !== "bot") {
      const message = item?.content?.toLowerCase() || '';
      const solAmountRegex = /send\b(?:\s+\w+)*\s+(?:(\d+(?:\.\d+)?)\s*(sol(?:ana)?)|(sol(?:ana)?)\s*(\d+(?:\.\d+)?))/i;
      const match = message.match(solAmountRegex);
      containsSOL = solAmountRegex.test(message);
      cryptoAmount = match ? match[1] : '0';
    }

    const handleOpenExplorer = () => {
      const url = `https://explorer.solana.com/tx/${item?.transaction.signature}?cluster=devnet`;
      Linking.openURL(url);
    };

    const retryUpload = async (media: any, mediaIndex: number) => {
      try {
        const media = item.multimedia[mediaIndex];
        const fileUri = media.filePath;
        const fileName = fileUri.split('/').pop() || 'file.jpg';

        item.multimedia[mediaIndex].uploadStage = 'generateUrl';
        item.multimedia[mediaIndex].retryStatus = 'uploading';
        await updateMessage({
          messageId: item._id,
          updates: { multimedia: item.multimedia },
        });

        const { Response: uploadMeta } = await generateUploadUrl({
          chatId,
          fileName,
          contentType: media.mimeType,
          accessToken: token,
        }).unwrap();

        item.multimedia[mediaIndex].uploadStage = 'uploading';
        await updateMessage({
          messageId: item._id,
          updates: { multimedia: item.multimedia },
        });

        const fileBlob = await (await fetch(fileUri)).blob();
        if (uploadMeta) {
          await axios.put(uploadMeta.uploadUrl, fileBlob, {
            headers: { 'Content-Type': media.mimeType },
          });

          item.multimedia[mediaIndex] = {
            ...media,
            signedUrl: uploadMeta.readUrl,
            expirationTime: uploadMeta.expirationTime,
            isLoading: false,
            retryStatus: 'success',
          };
        }

        await updateMessage({
          messageId: item._id,
          updates: { multimedia: item.multimedia },
        });

      } catch (err) {
        item.multimedia[mediaIndex].retryStatus = 'failed';
        await updateMessage({
          messageId: item._id,
          updates: { multimedia: item.multimedia },
        });
        console.error('❌ Retry upload failed:', err);
      }
    };

    const renderBackdrop = useCallback(
      (
        props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps,
      ) => (
        <BottomSheetBackdrop
          appearsOnIndex={1}
          disappearsOnIndex={-1}
          opacity={0.8}
          {...props}
        />
      ),
      [],
    );

    const openImageModal = (images: string[], index: number) => {
      console.log("images", images)
      setGroupImagesToRender(images);
      setCurrentImageIndex(index);
      setIsModalVisible(true);
    };

    const handleNextImage = () => {
      if (currentImageIndex < imagesToRender.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      }
    };

    const openDocument = (uri: string) => {
      if (uri.startsWith("https://") || uri.startsWith("http://")) {
        Linking.openURL(uri).catch((err) => {
          console.error("Failed to open document URL:", err);
        });
      } else if (uri.startsWith("file://")) {
        FileViewer.open(uri).catch((err) => {
          console.error("Failed to open local file:", err);
        });
      } else {
        console.error("Invalid document URI:", uri);
      }
    };

    const handlePrevImage = () => {
      if (currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      }
    };

    const onPressUserIcon = async () => {

      console.log("item====>", item);
      console.log("chatDetailsData item====>", chatDetailsData);
      const otherUser = chatDetailsData?.participants?.find((id: string) => id !== latestUser?.id);
      console.log("otherUser", otherUser);
      console.log("sender user", senderUser);
      if(senderUser){
        const RequestHeader = await generateRequestHeader();
        const requestPayload: CheckIndividualChatRequestWrapper = {
          body: {
            peerId: senderUser["Id"],
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
        console.log("checkIndividualChatResponse item====>", checkIndividualChatResponse);
  
        navigation.navigate('PrivateMessageScreen', {
          messageId: senderUser["Id"] || '',
          name: checkIndividualChatResponse?.response?.groupName || '',
          type: 'individual',
          profilePicture: checkIndividualChatResponse?.response?.groupIcon,
          chatId: checkIndividualChatResponse?.response?.groupId || '',
          backgroundColor: checkIndividualChatResponse?.response?.backgroundColor,
        });
      }
    }
    const defaultReplyHandler = (message: MessageType) => {
      console.warn('Reply handler not provided');
    };

    const replyHandler = onReplyMessage || defaultReplyHandler;

    const gestureHandler = useAnimatedGestureHandler({
      onStart: (_, context: any) => {
        context.startX = translateX.value;
      },
      onActive: (event, context) => {
        if (Math.abs(event.translationX) > Math.abs(event.translationY)) {
          const isValidSwipe = direction === 'sent'
            ? event.translationX < 0
            : event.translationX > 0;

          if (isValidSwipe) {
            const maxTranslation = direction === 'sent' ? -200 : 200;
            const newValue = context.startX + event.translationX;
            translateX.value = direction === 'sent'
              ? Math.max(newValue, maxTranslation)
              : Math.min(newValue, maxTranslation);
          }
        }
      },
      onEnd: (event) => {
        const swipeThreshold = 100;
        const hasReachedThreshold = direction === 'sent'
          ? event.translationX < -swipeThreshold
          : event.translationX > swipeThreshold;

        if (hasReachedThreshold) {
          console.log("item before reply handler", item)
          runOnJS(replyHandler)(item);
        }

        translateX.value = withSpring(0, {
          damping: 25,
          stiffness: 300,
          mass: 0.8,
          velocity: 0,
          overshootClamping: false,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 2,
        });
      },
    });

    const entryAnim = useSharedValue(isNewMessage ? 50 : 0);
    const opacityAnim = useSharedValue(isNewMessage ? 0 : 1);

    useEffect(() => {
      if (isNewMessage) {
        entryAnim.value = 50;
        opacityAnim.value = 0;

        entryAnim.value = withTiming(0, {
          duration: 450,
          easing: NativeEasing.bezier(0.16, 1, 0.3, 1),
        });

        opacityAnim.value = withTiming(1, {
          duration: 400,
          easing: NativeEasing.bezier(0.22, 1, 0.36, 1),
        });
      }
    }, [isNewMessage]);

    const enhancedAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: entryAnim.value },
      ],
      opacity: opacityAnim.value,
      alignSelf: direction === 'sent' ? 'flex-end' : 'flex-start',
      width: '100%',
      marginBottom: (item?.transaction?.signature || containsSOL || item?.type === 'blinkTransfered')
        ? 8
        : isSameSenderAsNext
          ? 4
          : 8,
    }));

    const handleUnpinMessage = async () => {
      try {
        console.log("handleUnpinMessage", item.serverId)
        if (item.serverId) {
          const response = await unPinMessage({
            chatId,
            messageId: item.serverId,
            token,
          }).unwrap();

          await MessageRepository.updateIsPinnedByMessageId(item.messageId, false);
          await dispatch(fetchMessagesApi.util.invalidateTags(['Messages']));

          console.log('📌 Message pinned:', response);
        }
      } catch (err) {
        console.error('❌ Failed to pin message:', err);
      }
    };

    const categorizedEmojis = emojiData.reduce((acc, emoji) => {
      const category = emoji.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(emoji);
      return acc;
    }, {} as Record<string, typeof emojiData>);


    const handlePinMessage = async () => {
      try {
        console.log("handlePinMessage", item.serverId)
        if (item.serverId) {
          const response = await pinMessage({
            chatId,
            messageId: item.serverId,
            token,
          }).unwrap();
          console.log('📌 Message pinned:', response);
        }
      } catch (err) {
        console.error('❌ Failed to pin message:', err);
      }
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
      alignSelf: direction === 'sent' ? 'flex-end' : 'flex-start',
      width: 'auto',
      marginBottom: (item?.transaction?.signature ||
        containsSOL ||
        item?.type === 'blinkTransfered') ? 8 :
        (isSameSenderAsNext) ? 4 : 16,
    }), [item?.transaction?.signature, containsSOL, item?.type, isSameSenderAsNext]);

    const secretKey = latestUser?.privateKey
      ? Uint8Array.from(Buffer.from(latestUser.privateKey, 'base64'))
      : new Uint8Array();
    const senderKeypair = Keypair.fromSecretKey(secretKey);

    const renderReplyMessage = useCallback<any>(
      ({ }) => {
        return (
          <View
            style={[
              backgrounds.gray50,
              gutters.paddingHorizontal_10,
              gutters.paddingVertical_6,
              gutters.marginRight_10,
              borders.rounded_8,
              {
                marginBottom: 8,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <TextVariant
              style={[
                components.urbanist10BoldActive,
                { fontStyle: 'italic', marginBottom: 4 },
              ]}
            >
              {item?.replyTo?.replyToSenderName || 'Unknown'}:
            </TextVariant>
            <TextVariant style={[components.urbanist14MediumBlack]}>
              {item?.replyTo?.replyToContent || ''}
            </TextVariant>
          </View>
        );
      },
      [item],
    );

    translateXModal.value = withSpring(0, { damping: 20, stiffness: 150 })

    if (item.automated) {
      return (
        <View
          style={[
            layout.itemsSelfCenter,
            gutters.marginVertical_8,
            gutters.paddingVertical_6,
            gutters.paddingHorizontal_10,
            borders.rounded_500,
          ]}
        >
          <View
            style={[
              backgrounds.primary,
              { opacity: 0.3, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 500 },
            ]}
          />
          <TextVariant style={[components.urbanist14RegularPrimary]}>{item.content}</TextVariant>
        </View>
      );
    } else {
      return (
        <>
          <PanGestureHandler
            activeOffsetX={[-10, 10]}
            onGestureEvent={gestureHandler} simultaneousHandlers={simultaneousHandlers} waitFor={simultaneousHandlers}>
            <Animated.View style={[
              enhancedAnimatedStyle
            ]}>


              {item?.type === 'blink' && item?.data?.actionUrl && (
                <View
                  style={[
                    layout.row,
                    gutters.paddingHorizontal_10,
                    gutters.marginLeft_36,
                    layout.justifyStart,
                    gutters.marginVertical_4,
                    direction === 'sent' ? layout.justifyEnd : layout.justifyStart,
                  ]}>
                  <View
                    style={[
                      gutters.paddingVertical_10,
                      borderStyle,
                      { maxWidth: '80%' },
                      layout.row,
                      gutters.paddingHorizontal_10,
                      gutters.marginLeft_48,
                      layout.justifyStart,
                      gutters.marginVertical_4,
                      direction === 'sent' ? layout.justifyEnd : layout.justifyStart,
                    ]}>
                    <View
                      style={[
                        gutters.paddingVertical_10,
                        borderStyle,
                        { maxWidth: '80%' },
                      ]}>
                      <BlinkPreview
                        url={item?.data?.actionUrl}
                        name={item?.data?.blinkName}
                        title={item?.data?.blinkTitle}
                        id={item?.data?.blinkId}
                        handleSendMessage={handleSendMessage}
                        chatId={chatId}
                        message={item}
                      />
                    </View>
                  </View>
                </View>
              )}

              {containsSOL && cryptoAmount && direction === 'received' && (
                <View
                  style={[
                    Platform.OS === 'ios' ? defaultBorder : { borderRadius: 2 },
                    messageType === 'group' && gutters.marginLeft_60,
                    messageType !== 'group' && gutters.marginLeft_8,
                    gutters.marginVertical_4,
                    gutters.marginTop_6,
                    layout.width190px,
                    {
                      elevation: Platform.OS === 'android' ? 2 : 6,
                      shadowColor: Platform.OS === 'ios' ? '#000' : "#000000",
                      shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 1 } : {
                        width: 0,
                        height: 2,
                      },
                      shadowOpacity: Platform.OS === 'ios' ? 0.5 : 0.17,
                      shadowRadius: Platform.OS === 'ios' ? 3.84 : 4.05,
                      marginBottom: 4,
                    },
                  ]}
                >
                  <View style={[gutters.paddingHorizontal_2]}>
                    <View
                      style={[
                        backgrounds.receivedMessage,
                        gutters.paddingVertical_10,
                        defaultBorderTop,
                        layout.fullWidth,
                      ]}>
                      <TextVariant
                        style={[
                          components.urbanist18BoldPrimary,
                          components.textCenter,
                        ]}>
                        {cryptoAmount} {t('sol')}
                      </TextVariant>
                    </View>
                    <View
                      style={[
                        backgrounds.white,
                        gutters.paddingVertical_14,
                        gutters.paddingHorizontal_8,
                        defaultBorderBottom,
                        layout.row,
                      ]}>
                      <ImageVariant
                        source={Images.solanaGradient}
                        sourceDark={ImagesDark.solanaGradient}
                        style={[components.iconSize22, gutters.marginRight_10]}
                      />
                      <View>
                        <TextVariant style={[components.urbanist16SemiBoldDark]}>
                          {t('sendSolana')}
                        </TextVariant>
                      </View>
                    </View>
                  </View>
                  <ButtonVariant
                    style={[
                      gutters.marginVertical_4,
                      gutters.marginHorizontal_10,
                      gutters.paddingHorizontal_4,
                      layout.row,
                      layout.itemsCenter,
                      layout.justifyAround,
                      layout.width55px,
                      borders.w_1,
                      borders.rounded_125,
                      gutters.marginBottom_12,
                      gutters.paddingVertical_4,
                    ]}
                    onPress={() =>
                      openSentToSlider({
                        receiverId: item?.senderId,
                        recipientAddress: senderUser?.Address || "",
                        recipientName: senderUser?.FullName || "",
                        solAmount: cryptoAmount,
                      })
                    }>
                    <TextVariant
                      style={[
                        components.urbanist10RegularmessageSenderText,
                        layout.flex_1,
                      ]}>
                      {t('send')}
                    </TextVariant>
                    <ImageVariant
                      source={Images.arrowRightWithBg}
                      sourceDark={ImagesDark.arrowRightWithBg}
                      style={[components.iconSize16]}
                    />
                  </ButtonVariant>
                </View>
              )}

              {item?.type === 'blinkTransfered' && item?.transaction.signature && (
                <View
                  style={[
                    layout.row,
                    gutters.paddingHorizontal_10,
                    layout.justifyStart,
                    gutters.marginVertical_4,
                    direction === 'sent' ? layout.justifyEnd : layout.justifyStart,
                    animatedStyle,
                  ]}>
                  <View
                    style={[
                      backgrounds.primary,
                      gutters.paddingVertical_10,
                      gutters.paddingHorizontal_14,
                      borderStyle,
                      { maxWidth: '80%', position: 'relative' },
                      direction === 'received' && backgrounds.receivedMessage,
                    ]}>
                    <TextVariant
                      style={[
                        direction === 'received'
                          ? components.urbanist16RegularDark
                          : components.urbanist16RegularWhite,
                      ]}>
                      {item.data?.buyerId != latestUser?.id
                        ? `${item?.data?.buyerName} have successfuly bought the ${item?.data?.blinkName ? `${item?.data?.blinkName} blink` : `blink`}`
                        : item.data?.buyerId == latestUser?.id
                          ? `You have successfully bought the ${item?.data?.blinkName ? `${item?.data?.blinkName} blink` : `blink`}`
                          : ``}
                    </TextVariant>
                  </View>
                </View>
              )}
              {!(item?.type == 'blinkTransfered' && direction == 'received') &&
                !(item?.type === 'blink' && item?.data?.actionUrl) &&
                // item?.type !== 'transaction' &&
                !(containsSOL && cryptoAmount && direction === 'received') &&
                item?.type !== 'blinkTransfered' && (
                  <View
                    style={[
                      layout.row,
                      // gutters.paddingHorizontal_10,
                      layout.justifyStart,
                      gutters.marginVertical_4,
                      gutters.marginRight_10,
                      direction === 'sent' ? layout.justifyEnd : layout.justifyStart,
                    ]}>
                    <ButtonVariant
                      onPress={() => {
                        console.log('Message pressed:', item._id);
                      }}
                      onLongPress={() => {
                        setSelectedMessage(item);
                        bottomSheetModalRef.current?.present();
                      }}
                      style={[
                        (item?.type === 'image') &&
                          item?.content?.length == 1 ? {} : borderStyle,
                        {
                          maxWidth: '85%',
                          width: 'auto',
                          minWidth: item?.content?.length < 15 ? 110 : 'auto',
                          position: 'relative',
                          alignSelf: direction === 'sent' ? 'flex-end' : 'flex-start',
                        },
                        direction === "received" && { minWidth: 100 },
                        (item?.type === 'image') &&
                          item?.content?.length == 1 ? {} : {
                          elevation: 4,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 3.84,
                        },
                        (item?.type === 'image') &&
                          item?.content?.length == 1
                          ? ""
                          : direction === 'received' ? backgrounds.white : backgrounds.primary,
                        direction === 'received' &&
                        messageType === 'group' &&
                        gutters.marginLeft_50,
                      ]}>
                      {
                        <View style={[]}>
                          {item?.replyTo?.replyToId && renderReplyMessage({})}
                          <View
                            style={[
                              direction === 'received'
                                ? components.urbanist16RegularDark
                                : components.urbanist16RegularWhite
                            ]}
                          >
                            {(item?.type == "image")
                              ?
                              <ImageGrid
                                images={item.multimedia.map((data: any) =>
                                  data?.localUri
                                    ? `file://${data.localUri}`
                                    : data?.signedUrl
                                )}
                                thumbnails={item?.content?.thumbnailUrls || []}
                                openImageModal={(images, index) => openImageModal(images, index)}
                                direction={direction}
                                metadata={item?.multimedia}
                                isLoading={item?.status == "uploading"}
                                retryUpload={retryUpload}
                                messageTime={messageTime}
                              />
                              : (item?.type === "video") ? (
                                <VideoGrid
                                  videos={item.multimedia.map((data: any) =>
                                    data?.localUri
                                      ? `file://${data.localUri}`
                                      : data?.signedUrl
                                  )}
                                  thumbnails={item?.content?.thumbnailUrls || []}
                                  openVideoModal={(videos: string[], thumbnails: string[], index: number) =>
                                    openVideoModal(videos, thumbnails, index)
                                  }
                                  direction={direction}
                                  metadata={item.multimedia}
                                  isLoading={item?.status == "uploading"}
                                  messageTime={messageTime}
                                />

                              )
                                : (item?.type === "file") ?
                                  <DocumentList
                                    documents={item.multimedia.map((data: any) =>
                                      data?.localUri
                                        ? `file://${data.localUri}`
                                        : data?.signedUrl
                                    )}
                                    openDocument={openDocument}
                                    direction={direction}
                                    metadata={item.multimedia}
                                    isLoading={item?.status == "uploading"}
                                  />
                                  :
                                  item?.type === "gif" ? (
                                    <GIFGrid
                                      gifs={[item.content]}
                                      openGifModal={(gifs: string[], index: number) => openImageModal(gifs, index)}
                                      direction={direction}
                                      isLoading={item.status === "uploading"}
                                      messageTime={messageTime}
                                    />
                                  ) :
                                    item?.content
                                      ?.split(/(https?:\/\/[^\s]+)/g)
                                      .map((segment: string, index: number) => {
                                        const isFirebaseUrl = segment.startsWith('https://firebasestorage.googleapis.com');
                                        const isUrl = urlRegex.test(segment);

                                        if (isUrl) {
                                          if (isFirebaseUrl) {
                                            return (
                                              <ButtonVariant
                                                key={index}
                                                onPress={() => openImageModal([item?.content], 0)}
                                              >
                                                <FastImage
                                                  source={{ uri: segment }}
                                                  style={{
                                                    width: imageSize.width,
                                                    height: imageSize.height,
                                                    borderRadius: 10,
                                                  }}
                                                  resizeMode="stretch"
                                                />
                                              </ButtonVariant>
                                            );
                                          } else {
                                            return (
                                              <Pressable key={index} onPress={() => Linking.openURL(segment)}>
                                                <TextVariant
                                                  style={[
                                                    direction === 'received'
                                                      ? components.urbanist16RegularDark
                                                      : components.urbanist16RegularWhite,
                                                  ]}
                                                >
                                                  {segment}
                                                </TextVariant>
                                              </Pressable>
                                            );
                                          }
                                        } else {
                                          return (
                                            <View
                                              key={index}
                                              style={[
                                                direction === 'received' && layout.row,
                                                direction === 'received' && layout.justifyBetween,
                                                direction === 'received' && layout.itemsCenter,
                                                gutters.paddingLeft_10,
                                                gutters.paddingTop_10,
                                              ]}
                                            >
                                              <TextVariant
                                                style={[
                                                  direction === 'received'
                                                    ? components.urbanist16RegularDark
                                                    : components.urbanist16RegularWhite,
                                                  {
                                                    letterSpacing: 0.5,
                                                    flexShrink: 1,
                                                  },
                                                ]}
                                              >
                                                {segment}
                                              </TextVariant>
                                            </View>
                                          );
                                        }
                                      })}

                          </View>

                          {item.preparedTransaction && <ButtonVariant
                            onPress={() => {
                              setSwappingToken(true)
                              processTransaction(
                                item?.preparedTransaction || "",
                                senderKeypair,
                                new Connection(API_MAIN_NET as string, 'confirmed'),
                                "finalized"
                              ).then(async (res) => {
                                console.log("res in the sign transaction", res)
                                if (res) {
                                  const response = await getSwapMessage({
                                    botId: botId || "",
                                    chatId: chatId,
                                    isSuccess: true,
                                    transactionHash: res,
                                    userId: latestUser?.id || "",
                                  })

                                  console.log("res in the sign transaction", response)
                                }

                              }).catch((err) => {
                                console.log("err", err)
                              })
                                .finally(() => {
                                  setSwappingToken(false)
                                }
                                )

                            }}
                            disabled={swappingToken}
                            style={[components.blueBackgroundButton, layout.itemsCenter, gutters.padding_14, gutters.marginTop_10]}>
                            {
                              swappingToken ? (
                                <ActivityIndicator
                                  size="small"
                                  color={colors.white}
                                  animating={swappingToken}
                                />
                              ) : <TextVariant style={[components.urbanist16SemiBoldWhite]}>{"Sign Transaction"}</TextVariant>
                            }
                          </ButtonVariant>}
                          {item.reactions?.length > 0 && (
                            <View style={[gutters.marginLeft_8, gutters.marginBottom_8, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                              {getGroupedReactions(item.reactions).map(({ emoji, users }) => (
                                <TouchableOpacity
                                  key={emoji}
                                  onLongPress={() => openReactionSheet(emoji, users)}
                                  style={{
                                    backgroundColor: '#eee',
                                    borderRadius: 14,
                                    paddingHorizontal: 6,
                                    paddingVertical: 3,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginRight: 8,
                                    marginTop: 4,
                                  }}
                                >
                                  <TextVariant style={{ fontSize: 16 }}>{emoji}</TextVariant>
                                  <TextVariant style={{ fontSize: 12, marginLeft: 4 }}>{users.length}</TextVariant>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                          {(item?.type !== "image" && item?.type !== "gif" && item?.type !== "video") && (
                            <View style={[layout.row, layout.itemsCenter, gutters.paddingBottom_8, layout.justifyEnd, gutters.marginRight_16, gutters.marginTop_2]}>
                              <TextVariant style={[
                                components.urbanist12RegularWhite,
                                components.textRight,
                                {
                                  letterSpacing: 0.5,
                                  color: direction === 'sent'
                                    ? colors.white
                                    : colors.codeDark
                                },
                              ]}>
                                {messageTime}
                              </TextVariant>

                              {direction == "sent" && (
                                <ImageVariant
                                  source={Images.single_tick}
                                  sourceDark={Images.single_tick}
                                  style={[gutters.marginLeft_8, components.iconSize12]}
                                  resizeMode='contain'
                                />
                              )}
                            </View>
                          )}


                        </View>
                      }

                      {isUrlMessage(item?.content) &&
                        linkPreviewData &&
                        linkPreviewData.url &&
                        linkPreviewData.description &&
                        linkPreviewData.title && (
                          <Pressable
                            onPress={() => Linking.openURL(linkPreviewData.url)}
                            style={{ marginTop: 10 }}
                          >
                            <View
                              style={[
                                backgrounds.gray50,
                                borders.receivedMessage,
                                gutters.padding_10,
                                defaultBorder,
                                { minHeight: 90 },
                              ]}>
                              <View>
                                {linkPreviewData.images &&
                                  linkPreviewData.images.length > 0 && (
                                    <FastImage
                                      source={{ uri: linkPreviewData.images[0] }}
                                      style={{
                                        width: 70,
                                        height: 70,
                                        borderRadius: 5,
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                      }}
                                    />
                                  )}
                                <View style={{ paddingRight: 80 }}>
                                  <TextVariant
                                    style={[components.urbanist10BoldIncrease]}>
                                    {linkPreviewData.title}
                                  </TextVariant>
                                  <TextVariant
                                    style={[
                                      components.urbanist10RegularmessageSenderText,
                                      { marginTop: 5 },
                                    ]}>
                                    {linkPreviewData.description}
                                  </TextVariant>
                                </View>
                              </View>
                            </View>
                          </Pressable>
                        )}
                    </ButtonVariant>
                  </View>
                )}

              {messageType === 'group' &&
                direction === 'received' &&
                !isSameSenderAsPrevious &&
                (senderUser?.ProfilePicture && senderUser?.ProfilePicture !== '' && z.string().url().safeParse(senderUser.ProfilePicture).success) ? (
                <ButtonVariant
                  onPress={onPressUserIcon}
                >
                  <FastImage
                    source={{ uri: senderUser?.ProfilePicture }}
                    style={[
                      components.iconSize32,
                      layout.absolute,
                      messageType === 'group' && layout.left10,
                      containsSOL && cryptoAmount && direction === 'received'
                        ? layout.topNeg45
                        : layout.topNeg33,
                      borders.rounded_500,
                      gutters.marginBottom_10,
                    ]}
                  />
                </ButtonVariant>
              ) : messageType === 'group' &&
                direction === 'received' &&
                !isSameSenderAsPrevious &&
                !item.senderImage ? (
                <ButtonVariant
                  onPress={onPressUserIcon}
                  style={[
                    { backgroundColor: senderUser?.BackgroundColor },
                    components.iconSize32,
                    layout.absolute,
                    messageType === 'group' && layout.left10,
                    containsSOL && cryptoAmount && direction === 'received' ? layout.bottom15 : layout.bottom0,
                    borders.rounded_500,
                    layout.itemsCenter,
                    layout.justifyCenter,

                  ]}>
                  <TextVariant
                    style={[
                      components.urbanist16SemiBoldWhite,
                      components.textCenter,
                    ]}>
                    {getInitials(item?.senderName)}
                  </TextVariant>
                </ButtonVariant>
              ) : null}
              {item?.transaction?.signature && (
                <>
                  {
                    item?.transaction.signature && (
                      <View
                        style={[
                          layout.row,
                          gutters.paddingHorizontal_10,
                          layout.justifyStart,
                          gutters.marginVertical_2,
                          gutters.marginBottom_4,
                          direction === 'sent'
                            ? layout.justifyEnd
                            : layout.justifyStart,
                        ]}>
                        <TouchableOpacity
                          onPress={handleOpenExplorer}
                          style={{
                            borderColor: colors.primary,
                            borderWidth: 1,
                            borderRadius: 16,
                            padding: 4,
                            marginBottom: 2,
                            backgroundColor: 'transparent',
                            marginLeft: direction !== "sent" ? 40 : 0,
                            alignSelf:
                              direction === 'sent' ? 'flex-end' : 'flex-start',
                            ...(direction === 'sent'
                              ? {
                                borderTopRightRadius: 3,
                                borderTopLeftRadius: 3,
                                borderBottomLeftRadius: 20,
                                borderBottomRightRadius: 3,
                              }
                              : {
                                borderTopRightRadius: 3,
                                borderTopLeftRadius: 3,
                                borderBottomLeftRadius: 3,
                                borderBottomRightRadius: 20,
                              }),
                          }}>
                          <TextVariant
                            style={[
                              components.urbanist12RegularPrimary,
                              components.textCenter,
                            ]}>
                            {t('viewOnExplorer')}
                          </TextVariant>
                        </TouchableOpacity>
                      </View>
                    )}
                </>
              )}

            </Animated.View>
          </PanGestureHandler>
          <View style={[
            layout.row,
          ]}>
            <VideoModal
              isVisible={isVideoModalVisible}
              currentIndex={currentVideoIndex}
              onClose={() => setIsVideoModalVisible(false)}
              videos={videosToRender}
            />
          </View>
          <View style={[
            layout.row,
          ]}>
            <ImageModal
              isVisible={isModalVisible}
              currentIndex={currentImageIndex}
              onClose={() => setIsModalVisible(false)}
              images={imagesToRender}
              handleNextImage={handleNextImage}
              handlePrevImage={handlePrevImage}
            />
          </View>
          <View style={[
            layout.row,
          ]}>
            <EmojiPickerModal
              isVisible={isEmojiModalVisible}
              onSelectEmoji={(emoji) => {
                setIsEmojiModalVisible(false);
                handleEmojiReaction(emoji);
              }}
              onClose={() => setIsEmojiModalVisible(false)}
            />
          </View>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            snapPoints={messageSnapPoints}
            index={0}
            enableDismissOnClose
            enablePanDownToClose={true}
            backgroundStyle={[backgrounds.white, borders.roundedTop_20]}
            handleIndicatorStyle={[layout.width40, backgrounds.cream]}
            backdropComponent={renderBackdrop}
          >
            <BottomSheetView
              style={[
                layout.itemsSelfCenter,
                layout.fullWidth,
                gutters.paddingHorizontal_14,
                gutters.paddingVertical_20,
              ]}
            >
              <View
                style={[
                  backgrounds.gray50,
                  gutters.padding_10,
                  borders.rounded_12,
                  gutters.marginBottom_10,
                ]}
              >
                <TextVariant style={components.urbanist14MediumBlack}>
                  {selectedMessage?.content}
                </TextVariant>
              </View>

              <View style={[layout.row, layout.justifyEvenly, gutters.marginBottom_14, layout.alignBetween]}>
                {['😍', '😃', '😢', '😡', '👍', '👎'].map((emoji, index) => (
                  <TouchableOpacity key={index} onPress={() => handleEmojiReaction(emoji)}>
                    <TextVariant key={index} style={{ fontSize: 24, marginHorizontal: 6 }}>
                      {emoji}
                    </TextVariant>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setIsEmojiModalVisible(true)}
                  style={{ marginLeft: 10 }}
                >
                  <ImageVariant
                    source={Images.arrow_down}
                    style={{ width: 16, height: 16 }}
                    tintColor={colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <View>
                {[
                  { label: t('reply'), icon: Images.reply, action: () => replyHandler(selectedMessage!) },
                  { label: t('copy'), icon: Images.copy, action: () => Clipboard.setString(selectedMessage?.content || "") },
                  selectedMessage?.isPinned
                    ? { label: t('unpin'), icon: Images.unpin, action: () => handleUnpinMessage() }
                    : { label: t('pin'), icon: Images.pin, action: () => handlePinMessage() }, { label: t('block'), icon: Images.block, action: () => console.log('Block user') },
                  { label: t('delete'), icon: Images.delete, action: () => console.log('Delete message'), isDestructive: true },
                ].map((option, index) => (
                  <ButtonVariant
                    key={index}
                    onPress={() => {
                      bottomSheetModalRef.current?.dismiss();
                      option.action();
                    }}
                    style={[layout.row, layout.itemsCenter, gutters.paddingVertical_12]}
                  >
                    <ImageVariant
                      source={option.icon}
                      style={[components.iconSize20, gutters.marginRight_14]}
                      tintColor={option.isDestructive ? 'red' : colors.primary}
                    />
                    <TextVariant
                      style={[
                        components.urbanist16RegularBlack,
                        option.isDestructive && { color: 'red' },
                      ]}
                    >
                      {option.label}
                    </TextVariant>
                  </ButtonVariant>
                ))}
              </View>
            </BottomSheetView>
          </BottomSheetModal>
          <BottomSheetModal
            ref={reactionSheetRef}
            snapPoints={reactionSnapPoints}
            index={0}
            enableDismissOnClose
            enablePanDownToClose={true}
            backgroundStyle={[backgrounds.white, borders.roundedTop_20]}
            handleIndicatorStyle={[layout.width40, backgrounds.cream]}
            backdropComponent={renderBackdrop}
          >
            <BottomSheetView
              style={[
                layout.itemsSelfCenter,
                layout.fullWidth,
                gutters.paddingHorizontal_14,
                gutters.paddingVertical_20,
              ]}
            >
              <TextVariant style={{ fontSize: 18, fontWeight: 'bold' }}>{reactionEmoji}</TextVariant>
              {reactionUsers.map((user, i) => (
                <View key={i} style={[layout.row, layout.itemsCenter, { paddingVertical: 8 }]}>
                  <Avatar
                    groupIcon={user.reactorProfilePicture}
                    groupName={user.reactorName}
                    backgroundColor={user.reactorBackgroundColor}
                    size="small"
                  />
                  <TextVariant>{user.reactorName}</TextVariant>
                </View>
              ))}
            </BottomSheetView>
          </BottomSheetModal>

        </>
      );
    }
  },
)

export default React.memo(MessageItem)

const EmojiPickerModal: React.FC<EmojiModalProps> = ({ isVisible, onClose, onSelectEmoji }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Smileys & Emotion")

  const categorizedEmojis = useMemo(() => {
    return emojiData.reduce(
      (acc, emoji) => {
        const category = emoji.category || "Other"
        if (!acc[category]) acc[category] = []
        acc[category].push(emoji)
        return acc
      },
      {} as Record<string, typeof emojiData>,
    )
  }, [])

  const categories = Object.keys(categorizedEmojis)

  const categoryIcons: Record<string, string> = {
    "Smileys & Emotion": "😄",
    "People & Body": "🧑",
    "Animals & Nature": "🐶",
    "Food & Drink": "🍕",
    "Travel & Places": "✈️",
    Activities: "⚽",
    Objects: "💡",
    Symbols: "❤️",
    Flags: "🏁",
    Component: "🧩",
    Other: "❓",
  }

  return (
    <Modal
      isVisible={isVisible}
      animationIn="fadeIn"
      animationOut="fadeOut"
      useNativeDriver={true}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.5}
      backdropColor="black"
      style={{ margin: 0 }}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TextVariant style={styles.headerText}>Select Emoji</TextVariant>
            <TouchableOpacity onPress={onClose}>
              <TextVariant style={styles.closeButton}>✕</TextVariant>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedCategory(category)}
                style={[styles.tab, selectedCategory === category && styles.activeTab]}
              >
                <TextVariant style={[styles.tabText, selectedCategory === category && styles.activeTabText]}>
                  {categoryIcons[category] || "❓"}
                </TextVariant>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={categorizedEmojis[selectedCategory]}
            keyExtractor={(item) => item.unified}
            numColumns={8}
            contentContainerStyle={styles.emojiGrid}
            renderItem={({ item }) => {
              const emoji = unifiedToEmoji(item.unified)
              return (
                <TouchableOpacity
                  onPress={() => {
                    onSelectEmoji(emoji)
                    onClose()
                  }}
                  style={styles.emojiItem}
                >
                  <TextVariant style={styles.emojiText}>{emoji}</TextVariant>
                </TouchableOpacity>
              )
            }}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  documentListContainer: {
    flexDirection: "column",
    width: "100%",
    padding: 3,
  },
  documentRow: {
    borderBottomWidth: 1,
    borderColor: "#E5E5E5",
  },
  openButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E0F7FF",
    borderRadius: 4,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  videoGridContainer: {
    flexDirection: "column",
    flexWrap: "nowrap",
    gap: 6,
    alignSelf: "flex-start",
    minWidth: 250,
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  loadingOverlayWhole: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 99,
  },
  image: {
    borderRadius: 10,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  overlayText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  videoContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "80%",
  },
  playPauseButton: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
    borderRadius: 50,
  },
  playPauseIcon: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
  },
  timeText: {
    color: "white",
    fontSize: 14,
  },
  shareButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  shareText: {
    color: "white",
    fontSize: 16,
  },
  videoItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    width: "100%",
  },
  thumbnail: {
    borderRadius: 8,
  },
  textContainer: {
    marginLeft: 10,
    justifyContent: "center",
  },
  videoTextContainer: {
    marginLeft: 10,
    justifyContent: "center",
    flex: 1,
    flexShrink: 1,
  },

  centerLoadingOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 10,
  },

  videoName: {
    fontSize: 16,
    flexShrink: 1,
  },
  videoSize: {
    fontSize: 14,
    marginTop: 4,
  },
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  documentGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  documentItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    // width: '100%',
  },
  documentIcon: {
    backgroundColor: "#E0F7FF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  documentExtension: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
  },
  documentTextContainer: {
    marginLeft: 10,
    justifyContent: "center",
    width: "70%",
  },
  documentName: {
    fontSize: 16,
  },
  documentSize: {
    fontSize: 14,
    marginTop: 4,
  },
  documentLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  fullRow: {
    width: "100%",
    marginBottom: 3,
  },
  retryButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "red",
    borderRadius: 5,
    padding: 4,
  },
  retryText: {
    color: "white",
    fontSize: 12,
  },
  timeOverlay: {
    position: "absolute",
    bottom: 5,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  timeTextOverlay: {
    color: "white",
    fontSize: 10,
  },
  timeContainer: {
    alignItems: "flex-end",
    marginTop: 4,
    marginRight: 6,
  },
  timeOverlayBottomRight: {
    position: "absolute",
    bottom: 70,
    right: 8,
    backgroundColor: "rgba(128, 128, 128, 0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  timeTextOverlayBottomRight: {
    color: "white",
    fontSize: 10,
  },

  timeTextImage: {
    backgroundColor: "rgba(128, 128, 128, 0.4)",
    color: "white",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  gridTimeOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(128,128,128,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  gridTimeText: {
    color: "white",
    fontSize: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "60%",
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 22,
    color: "#999",
  },
  tabs: {
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 12,
    color: "#444",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emojiGrid: {
    paddingBottom: 20,
  },
  emojiItem: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "12.5%",
  },
  emojiText: {
    fontSize: 24,
  },
})
