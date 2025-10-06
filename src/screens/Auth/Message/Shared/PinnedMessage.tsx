import { SafeScreen } from '@/components/template';
import { Images, ImagesDark, useTheme } from '@/theme';
import { TextVariant } from '@/components/atoms';
import { useRecentPicksPersistence } from '@/components/template/EmojiKeyboard/src';
import MessageRepository from '@/database/repositories/Message.repository';
import { useAddMessageMutation, useUpdateMessageMutation } from '@/hooks/domain';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { TUploadRequest } from '@/hooks/domain/upload-file/schema';
import { useUploadFileMutation } from '@/hooks/domain/upload-file/useUploadFile';
import { CheckIndividualChatRequestWrapper } from '@/pb/groupchat';
import { multimediaPayload, SendMessageRequest, transactionPayload } from '@/pb/message';
import { MessageServiceClient } from '@/pb/message.client';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { RootState } from '@/store';
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
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from '@react-native-documents/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
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
    Alert,
    Dimensions,
    FlatList,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    // Animated
    LayoutAnimation,
    ListRenderItem,
    NativeScrollEvent,
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
import MessageItem from '../Shared/MessageItem';

interface IProps { }

/**
 * @author Nitesh Raj Khanal
 * @function @PinnedMessage
 **/


const MessageClient = new MessageServiceClient(
    new RNGrpcTransport(UserGRPClient),
);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PinnedMessage: FC<IProps> = props => {
    const navigation = useNavigation<SafeScreenNavigationProp>();
    const route = useRoute<
        SafeScreenRouteProp & {
            params: {
                chatId: string;
                messages: any[]
            };
        }
    >();

    const {
        chatId,
        messages
    } = route.params;

    const sectionListRef = useRef(null);

    const { layout, gutters, components, borders, backgrounds, colors } =
        useTheme();

    const token = useSelector((state: RootState) => state.accessToken.authToken);

    const { t } = useTranslation(['translations']);

    const [multimediaPicker, setMultiMediaPicker] = useState<boolean>(false);

    const sentToBottomSheetModalRef = useRef<BottomSheetModal>(null);


    // const [currentDate, setCurrentDate] = useState<string | null>(null);
    const [networkFee, setNetworkFee] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);

    const { data: latestUser } = useFetchLatestUserQuery()
    const [addMessage] = useAddMessageMutation()
    const [updateMessage] = useUpdateMessageMutation();

    // const inputWidth = useSharedValue(100);

    // const [loading, setLoading] = useState<boolean>(false);
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

    const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
    // const {
    //   chatId: chatIdInReducer,
    //   status,
    //   error,
    // } = useSelector((state: RootState) => state.individualChatCreation);
    // console.log("messageInStore===>", messageInStore)
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

    // Track the list of rendered messages for animation purposes
    const [renderedMessageIds, setRenderedMessageIds] = useState<Set<string>>(new Set());

    // Configure custom animation for new messages
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
            messageType?:
            | 'text'
            | 'crypto'
            | 'other'
            | 'file'
            | 'transfer'
            | 'blink'
            | 'transaction'
            | 'blinkTransfered'
            | "image";
            data?: any;
        }) => {
            if (
                !payload?.content &&
                payload?.messageType !== 'transaction' &&
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
                        messageId,
                        replyTo: replyingTo?.serverId ?? null,
                    }).unwrap();
                    console.log("storedMessagePromise==>", storedMessagePromise)
                    setMessageToSend('');
                    setReplyingTo(null);

                    const grpcMessage = SendMessageRequest.create({
                        automated: false,
                        chatId,
                        content: messageContent,
                        messageId,
                        senderId: latestUser?.id,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        replyToMessageId: replyingTo?.serverId ?? undefined
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
        [messageToSend, chatId, configureMessageAnimation],
    );

    const handleReplyMessage = useCallback((message: MessageType) => {
        cancelAnimation(replySlideAnim);

        setReplyingTo(message);

        // Use the optimized animation config for smooth 60fps performance
        replySlideAnim.value = withTiming(1, {
            duration: 280,
            easing: NativeEasing.bezier(0.16, 1, 0.3, 1),
        });
    }, []);

    const renderMessageItem = useCallback<ListRenderItem<MessageType>>(
        ({ item, index }) => {
            return (
                <MessageItem
                    messageType="individual"
                    item={item}
                    index={index}
                    messages={[]}
                    openSentToSlider={openSentToSlider}
                    chatId={chatId}
                    handleSendMessage={handleSendMessage}
                    onReplyMessage={handleReplyMessage}
                    simultaneousHandlers={sectionListRef}
                />
            );
        },
        [openSentToSlider, handleReplyMessage, renderedMessageIds, chatId]
    );

    const concatenatedNewMessage = useMemo(() => {
        const newMessages = messages || [];
        return newMessages;
    }, [messages]);

    const sections = createSections(concatenatedNewMessage);
    const onIgnoredEffectPress = () => {
        Keyboard.dismiss();
    };

    const toggleEmojiPicker = () => {
        setMultiMediaPicker(false);
        setShowEmojiPicker(!showEmojiPicker);
        if (!showEmojiPicker) {
            Keyboard.dismiss();
        }
    };

    useRecentPicksPersistence({
        initialization: () => AsyncStorage.getItem("recent").then((item) => JSON.parse(item || '[]')),
        onStateChange: (next) => AsyncStorage.setItem("recent", JSON.stringify(next)),
    })

    return (
        <TouchableWithoutFeedback onPress={onIgnoredEffectPress}>
            <>
                <View
                    style={[
                        {
                            flex: 1,
                        },
                    ]}>
                    <SafeScreen
                        screenName='Pinned Messages'
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
                                    />
                                )}
                            </View>

                        </KeyboardAvoidingView>
                    </SafeScreen>
                </View>
            </>
        </TouchableWithoutFeedback>
    );
};

export default React.memo(PinnedMessage);
