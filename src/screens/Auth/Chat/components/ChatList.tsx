import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { Card, EmptyList } from '@/components/template';
import { AndroidActionBottomSheetManager, AndroidActionBottomSheetManagerRef } from '@/components/template/BottomSheetManager/AndroidActionSheetManager';
import { BottomSheetManager, BottomSheetManagerRef } from '@/components/template/BottomSheetManager/BottomSheetManager';
import { ChatsModel } from '@/database/models/Chats.model';
import { useSelector } from '@/hooks';
import { useFetchLatestUserQuery } from '@/hooks/domain/db-user/useDbUser';
import { useFetchChatDetailsMutation } from '@/hooks/domain/fetch-chats/useFetchChats';
import { useMarkAsSeenMutation } from '@/hooks/domain/mark-as-seen/useMarkAsSeen';
import { useChatActions } from '@/hooks/useChatActions';
import { RootState } from '@/store';
import { Images, ImagesDark, useTheme } from '@/theme';
import { SafeScreenNavigationProp } from '@/types';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';
import FastImage from '@d11/react-native-fast-image';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, RefreshControl, View } from 'react-native';
import ChatHeader from '../ChatHeader';

interface ChatListProps {
    filteredChats: ChatsModel[];
    isRefreshing: boolean;
    onRefresh: () => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
    handleChatDeleted: () => void;
    handleChatMuted: () => void;
    handleChatUnmuted: () => void;
    handleChatPinned: () => void;
    handleChatUnPinned: () => void;
    onLoadEarlier: () => void;
}

const ChatList: React.FC<ChatListProps> = ({
    filteredChats,
    isRefreshing,
    onRefresh,
    activeTab,
    onTabChange,
    handleChatDeleted,
    handleChatMuted,
    handleChatUnmuted,
    handleChatPinned,
    handleChatUnPinned,
    onLoadEarlier,
}) => {
    const { t } = useTranslation(['translations']);
    const navigation = useNavigation<SafeScreenNavigationProp>();
    const { muteChat, pinChat, deleteChat } = useChatActions();
    const { data: currentUser } = useFetchLatestUserQuery();
    const [fetchChatDetails] = useFetchChatDetailsMutation()
    const [selectedChat, setSelectedChat] = useState<ChatsModel | null>(null);
    const { backgrounds, colors, borders, components, gutters, layout } = useTheme();
    const token = useSelector((state: RootState) => state.accessToken.authToken)

    const [seenMessage] = useMarkAsSeenMutation()

    const scrollRef = useRef(null);
    const handleChatPress = useCallback((item: ChatsModel) => {
        if (item.isIndividualBotChat) {
            const botId = item.participants?.find(id => id.endsWith('-bot'));
            setTimeout(async () => {
                const RequestPayload ={
                    chatId: item.groupId || "",
                }
                const response = await seenMessage(RequestPayload).unwrap();
            },300)
            navigation.navigate('BotMessageScreen', {
                name: item.groupName || '',
                type: 'bot',
                profilePicture: item.groupIcon,
                messageId: item.groupId || '',
                chatId: item.groupId || '',
                botId: botId || '',
            });
        } else if (item.type === 'group' || item.type === 'community') {
            setTimeout(async () => {
                const SeenRequestPayload ={
                    chatId: item.groupId || "",
                }
                await seenMessage(SeenRequestPayload).unwrap();
                const RequestPayload = {
                    RequestHeader: await generateRequestHeader(),
                    AccessToken: token,
                    ChatId: item.groupId || "",
                }
                await fetchChatDetails(RequestPayload).unwrap();
            }, 300)
            navigation.navigate('MessageScreen', {
                chatId: item.groupId || '',
                name: item.groupName || '',
                type: item.type,
                profilePicture: item.groupIcon,
                membersCount: item.participants?.length,
                backgroundColor: item.backgroundColor,
            });
        } else {
            const otherUserId = item.participants?.find(id => id !== currentUser?.id);
            setTimeout(async () => {
                const SeenRequestPayload ={
                    chatId: item.groupId || "",
                }
                await seenMessage(SeenRequestPayload).unwrap();
                const RequestPayload = {
                    RequestHeader: await generateRequestHeader(),
                    AccessToken: token,
                    ChatId: item.groupId || "",
                }
                await fetchChatDetails(RequestPayload).unwrap();
            }, 300)
            navigation.navigate('PrivateMessageScreen', {
                messageId: otherUserId || '',
                name: item.groupName || '',
                type: 'individual',
                profilePicture: item.groupIcon,
                chatId: item.groupId || '',
                backgroundColor: item.backgroundColor,
            });
        }
    }, [navigation, currentUser]);

    const performActionFromBottomSheet = useCallback(async (action: 'pin' | 'mute') => {
        if (!selectedChat) return;

        if (action === 'pin') {
            await pinChat(selectedChat.groupId!);
            selectedChat.isPinned === "true" ? handleChatUnPinned() : handleChatPinned();
        }

        if (action === 'mute') {
            await muteChat(selectedChat.groupId!);
            selectedChat.isMuted === "true" ? handleChatUnmuted() : handleChatMuted();
        }
    }, [selectedChat, pinChat, muteChat, handleChatPinned, handleChatUnPinned, handleChatMuted, handleChatUnmuted]);

    const handleSwipeAction = useCallback(async (action: 'mute' | 'pin' | 'delete', item: ChatsModel) => {
        if (action === 'mute') {
            await muteChat(item.groupId!);
            item.isMuted === "true" ? handleChatUnmuted() : handleChatMuted();
        } else if (action === 'pin') {
            await pinChat(item.groupId!);
            item.isPinned === "true" ? handleChatUnPinned() : handleChatPinned();
        } else if (action === 'delete') {
            setSelectedChat(item);
            bottomSheetRef.current?.open();
        }
    }, [muteChat, pinChat, deleteChat]);

    const bottomSheetRef = useRef<BottomSheetManagerRef>(null);
    const androidActionSheetRef = useRef<AndroidActionBottomSheetManagerRef>(null);

    const handleLongPress = useCallback((item: ChatsModel) => {
        androidActionSheetRef.current?.open();
        setSelectedChat(item);
    }, []);

    const lastMessageText = useMemo(() => {
        if (selectedChat) {
            const text = selectedChat.lastMessage?.text || '';
            return text.length > 40 ? text.slice(0, 40) + '…' : text;
        }
    }, [selectedChat]);

    const isGif = useMemo(() => {
        if (selectedChat?.lastMessage?.text) {
            return selectedChat.lastMessage.text.includes('.giphy.com/media/');
        }
        return false;
    }, [selectedChat]);

    const renderItem = useCallback(
        ({ item, index }: { item: ChatsModel; index: number }) => {
            const unseenCount =
                (item.messageCount ?? 0) - (item.seenDetails?.[0]?.seenCount ?? 0);
            const isGif = item.lastMessage.text.includes(".giphy.com/media/")
            const isImage = item.lastMessage.multimedia?.some((item: { mimeType: string; }) => item.mimeType === 'image/jpeg' || item.mimeType === 'image/png')
            const isVideo = item.lastMessage.multimedia?.some((item: { mimeType: string; }) => item.mimeType === 'video/mp4')
            const isFile = item.lastMessage.multimedia?.some((item: { mimeType: string; }) => item.mimeType === 'application/pdf' || item.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || item.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || item.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || item.mimeType === 'application/zip')
            return (
                <Card
                    item={item}
                    isGif={isGif}
                    isImage={isImage}
                    isVideo={isVideo}
                    isFile={isFile}
                    index={index}
                    imageCounts={item.lastMessage.multimedia?.length}
                    gifUrl={item.lastMessage.text}
                    onPress={() => handleChatPress(item)}
                    onLongPress={Platform.OS === "android" ? () => handleLongPress(item) : () => { }}
                    onSwipeAction={(action) => handleSwipeAction(action, item)}
                    onContextAction={(action) => handleSwipeAction(action, item)}
                    unseenCount={unseenCount}
                />
            );
        },
        [handleChatPress, handleSwipeAction]
    );

    return (
        <>
            <View style={{ flex: 1 }}>
                <FlashList
                    ref={scrollRef}
                    data={filteredChats}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.groupId || ''}
                    estimatedItemSize={120}
                    onEndReached={onLoadEarlier}
                    onEndReachedThreshold={0.2}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    }
                    ListHeaderComponent={
                        <ChatHeader activeTab={activeTab} onTabChange={onTabChange} />
                    }
                    ListEmptyComponent={<EmptyList />}
                    ListFooterComponent={<View style={{ height: 60 }} />}
                    contentContainerStyle={{
                        paddingBottom: 60,
                    }}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}
                    maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                    overScrollMode="never"
                    scrollEventThrottle={16}
                />
            </View>
            <BottomSheetManager ref={bottomSheetRef} onAction={() => { }}>
                <BottomSheetView style={[layout.itemsSelfCenter, layout.fullWidth, gutters.paddingHorizontal_14]}>
                    <View style={[layout.row, layout.itemsCenter, layout.justifyStart, gutters.marginVertical_14]}>
                        <ImageVariant
                            source={Images.arrowLeft}
                            sourceDark={ImagesDark.arrowLeft}
                            style={components.iconSize16}
                        />
                        <TextVariant style={components.urbanist16BoldDark}>
                            {t('deleteChat', { chatName: selectedChat?.groupName ?? '' })}
                        </TextVariant>
                    </View>

                    <ButtonVariant
                        onPress={async () => {
                            if (selectedChat?.groupId) {
                                await deleteChat(selectedChat.groupId);
                                handleChatDeleted();
                            }
                            bottomSheetRef.current?.close();
                        }}
                        style={[
                            components.redBackgroundButton,
                            layout.itemsCenter,
                            gutters.padding_16,
                            gutters.marginVertical_14,
                        ]}
                    >
                        <TextVariant style={components.urbanist16SemiBoldWhite}>
                            {t('confirm')}
                        </TextVariant>
                    </ButtonVariant>

                    <ButtonVariant
                        onPress={() => bottomSheetRef.current?.close()}
                        style={[layout.itemsCenter, gutters.padding_16]}
                    >
                        <TextVariant style={components.urbanist16SemiBoldPlaceholder}>
                            {t('cancel')}
                        </TextVariant>
                    </ButtonVariant>

                    <View style={gutters.marginBottom_10} />
                </BottomSheetView>
            </BottomSheetManager>

            <AndroidActionBottomSheetManager ref={androidActionSheetRef} onAction={() => { }}>
                <View style={[gutters.marginBottom_10]} />
                <View
                    style={[
                        backgrounds.gray50,
                        gutters.padding_10,
                        borders.rounded_12,
                        gutters.marginBottom_10,
                    ]}
                >
                    {isGif ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TextVariant>
                                {(selectedChat?.type === "group" || selectedChat?.type === "community") && `${selectedChat?.lastMessage?.senderName}`}
                                {(selectedChat?.type === "group" || selectedChat?.type === "community") && ": "}
                            </TextVariant>
                            <FastImage
                                source={{ uri: selectedChat?.lastMessage?.text }}
                                style={{ width: 20, height: 20 }}
                                resizeMode="contain"
                            />
                        </View>
                    ) : (
                        <TextVariant
                            style={[
                                components.urbanist14MediumBlack,
                                {
                                    flexGrow: 1,
                                    flexShrink: 1,
                                    color: 'black',
                                },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {(selectedChat?.type === "group" || selectedChat?.type === "community") && `${selectedChat?.lastMessage?.senderName}`}
                            {(selectedChat?.type === "group" || selectedChat?.type === "community") && ": "}
                            {lastMessageText}
                        </TextVariant>
                    )}


                </View>

                <View>
                    {[
                        selectedChat?.isPinned == "true"
                            ? { label: t('unpin'), icon: Images.unpin, action: () => performActionFromBottomSheet('pin') }
                            : { label: t('pin'), icon: Images.pin, action: () => performActionFromBottomSheet('pin') },
                        selectedChat?.isMuted == "true"
                            ? { label: t('unmute'), action: () => performActionFromBottomSheet('mute') }
                            : { label: t('mute'), action: () => performActionFromBottomSheet('mute') },
                        { label: t('block'), icon: Images.block, action: () => console.log('Block user') },
                        { label: t('delete'), icon: Images.delete, action: () => bottomSheetRef.current?.open(), isDestructive: true },
                    ]
                        .map((option, index) => (
                            <ButtonVariant
                                key={index}
                                onPress={() => {
                                    androidActionSheetRef.current?.close();
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
            </AndroidActionBottomSheetManager>

        </>
    );
};

export default React.memo(ChatList);
