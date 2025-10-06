import React, { useCallback, useMemo } from 'react';
import {
  Platform,
  Pressable,
  Animated as RNAnimated,
  StyleSheet,
  View,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ButtonVariant, ImageVariant, TextVariant } from '@/components/atoms';
import { ChatsModel } from '@/database/models/Chats.model';
import { heightPercentToDp } from '@/utils';
import { formatChatTimestamp } from '@/utils/formatters';
import ContextMenu from 'react-native-context-menu-view';
import { setActiveCard } from './CardController';
import Avatar from './ImageOrInitials';
import FastImage from '@d11/react-native-fast-image';

interface CardProps {
  item: Partial<ChatsModel>;
  isGif?: boolean;
  isImage?: boolean;
  isFile?: boolean;
  isVideo?: boolean;
  imageCounts?: number;
  gifUrl?: string;
  index: number;
  unseenCount: number;
  onPress: () => void;
  onLongPress: () => void;
  onSwipeAction: (action: 'mute' | 'pin' | 'delete') => void;
  onContextAction: (action: 'mute' | 'pin' | 'delete') => void;
}

const ACTION_WIDTH = 70;
const MAX_TRANSLATE_X = -ACTION_WIDTH * 3;

type GestureContext = { startX: number };

const Card: React.FC<CardProps> = ({
  item,
  isGif,
  isImage,
  isVideo,
  isFile,
  gifUrl,
  imageCounts,
  onPress,
  onLongPress,
  onSwipeAction,
  onContextAction,
  unseenCount,
}) => {
  const translateX = useSharedValue(0);

  const closeCard = useCallback(() => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.5 });
  }, [translateX]);

  const handleSwipeAction = useCallback((action: 'mute' | 'pin' | 'delete') => {
    onSwipeAction(action);
    closeCard();
  }, [onSwipeAction, closeCard]);

  const panGesture = useAnimatedGestureHandler<any, GestureContext>({
    onStart: (_, ctx) => {
      runOnJS(setActiveCard)(item.groupId || '', translateX);
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      const multiplier = 1.2;
      translateX.value = Math.max(
        MAX_TRANSLATE_X,
        Math.min(0, ctx.startX + event.translationX * multiplier)
      );
    },
    onEnd: (event) => {
      const swipeThreshold = MAX_TRANSLATE_X / 3;

      translateX.value =
        translateX.value < swipeThreshold || event.velocityX < -500
          ? withSpring(MAX_TRANSLATE_X, { damping: 18, stiffness: 180, mass: 0.5 })
          : withSpring(0, { damping: 20, stiffness: 200, mass: 0.5 });
    },
  });


  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedActionStyle = (index: number) =>
    useAnimatedStyle(() => {
      const progress = interpolate(
        translateX.value,
        [0, MAX_TRANSLATE_X],
        [0, 1],
        Extrapolation.CLAMP
      );

      const delay = index * 0.1;
      const delayedProgress = Math.max(0, progress - delay);
      const easedProgress = Math.min(delayedProgress / (1 - delay), 1);
      const baseOffset = ACTION_WIDTH * index;

      return {
        position: 'absolute',
        right: baseOffset,
        zIndex: -index,
        height: '100%',
        width: interpolate(easedProgress, [0, 1], [0, ACTION_WIDTH], Extrapolation.CLAMP),
        opacity: interpolate(easedProgress, [0.05, 1], [0, 1], Extrapolation.CLAMP),
        transform: [
          {
            scale: interpolate(easedProgress, [0, 1], [0.6, 1], Extrapolation.CLAMP),
          },
        ],
      };
    });


  const renderActionButton = (
    icon: any,
    color: string,
    action: 'mute' | 'pin' | 'delete',
    index: number
  ) => {
    const scale = new RNAnimated.Value(1);
    const animatedStyle = animatedActionStyle(index);

    const onPressIn = () => {
      RNAnimated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      RNAnimated.spring(scale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };


    return (
      <Animated.View key={action} style={[styles.actionButtonAnimated, animatedStyle]}>
        <Pressable
          onPress={() => handleSwipeAction(action)}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[
            styles.actionButton,
            {
              backgroundColor: color,
              padding: 12,
              borderRadius: 14,
              marginHorizontal: 2
            },
          ]}
        >
          <ImageVariant source={icon} style={styles.actionIcon} resizeMode='contain' />
        </Pressable>
      </Animated.View>
    );
  };

  console.log('Card rendered last message', item.lastMessage);

  const lastMessageText = useMemo(() => {
    const text = item.lastMessage?.text || '';
    return text.length > 40 ? text.slice(0, 40) + '…' : text;
  }, [item]);

  const lastMessageTime = useMemo(() => {
    return item.lastMessage?.timestamp
      ? formatChatTimestamp(Number(item.lastMessage.timestamp))
      : '';
  }, [item.lastMessage?.timestamp]);

  const Wrapper = Platform.OS === 'ios' ? ContextMenu : React.Fragment;
  const wrapperProps = Platform.OS === 'ios'
    ? {
      actions: [
        { title: item.isMuted === 'true' ? 'Unmute' : 'Mute', systemIcon: 'bell' },
        { title: item.isPinned === 'true' ? 'Unpin' : 'Pin', systemIcon: 'pin' },
        { title: 'Delete', systemIcon: 'trash', destructive: true },
      ],
      onPress: ({ nativeEvent: { index } }: { nativeEvent: { index: number } }) => {
        if (index === 0) onContextAction('mute');
        else if (index === 1) onContextAction('pin');
        else if (index === 2) onContextAction('delete');
      },
    }
    : {};

  const muteIcon = useMemo(() => {
    return item.isMuted === 'true'
      ? require('@/theme/assets/images/unmute_home.png')
      : require('@/theme/assets/images/Mute.png');
  }, [item.isMuted]);

  const pinIcon = useMemo(() => {
    return item.isPinned === 'true'
      ? require('@/theme/assets/images/unpin.png')
      : require('@/theme/assets/images/Pin.png');
  }, [item.isPinned]);

  const smallMuteIcon = useMemo(
    () => require('@/theme/assets/images/mute_home.png'),
    []
  );

  const smallPinIcon = useMemo(
    () => require('@/theme/assets/images/pin_home.png'),
    []
  );

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={panGesture}
        activeOffsetX={[-1, 1]}
        failOffsetY={[-5, 5]}
      >
        <Animated.View>
          <View style={styles.actionsContainer}>
            {renderActionButton(require('@/theme/assets/images/Thrash.png'), '#FF3737', 'delete', 0)}
            {renderActionButton(pinIcon, '#00C900', 'pin', 1)}
            {renderActionButton(muteIcon, '#F19B33', 'mute', 2)}
          </View>

          <Animated.View style={[animatedCardStyle, styles.cardSurface]}>
            <Wrapper previewBackgroundColor="white" disableShadow={true} {...wrapperProps}>
              <ButtonVariant
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.cardButton}
              >
                <Avatar
                  groupIcon={item.groupIcon}
                  groupName={item.groupName}
                  backgroundColor={item.backgroundColor}
                />
                <View style={styles.middleContent}>
                  <TextVariant numberOfLines={1} style={[styles.groupName, {
                    color: item.isMuted === 'true' ? '#999' : '#000',
                    textDecorationLine: item.isMuted === 'true' ? 'line-through' : 'none',
                    textDecorationColor: item.isMuted === 'true' ? '#999' : 'transparent',
                    fontFamily: unseenCount > 0 ? 'Urbanist-Bold' : 'Urbanist-SemiBold',
                    fontSize: unseenCount > 0 ? 17 : 16,
                  }]}>
                    {item.groupName}
                  </TextVariant>
                  {isGif ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextVariant style={[styles.lastMessage, {
                        color: item.isMuted === 'true' ? '#999' : '#666',
                        textDecorationLine: item.isMuted === 'true' ? 'line-through' : 'none',
                        textDecorationColor: item.isMuted === 'true' ? '#999' : 'transparent',
                        fontFamily: unseenCount > 0 ? 'Urbanist-Bold' : 'Urbanist-Medium',
                        fontSize: unseenCount > 0 ? 15 : 14,
                      }]}>{(item.type === "group" || item.type === "community") && `${item.lastMessage?.senderName}`} {((item.type === "group" || item.type === "community") && item.lastMessage) && ": "}</TextVariant>
                      <FastImage
                        source={{ uri: gifUrl }}
                        style={{
                          width: 20,
                          height: 20,
                        }}
                        resizeMode="contain"
                      />
                    </View>
                  ) : isImage ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextVariant style={[styles.lastMessage, {
                        color: item.isMuted === 'true' ? '#999' : '#666',
                        textDecorationLine: item.isMuted === 'true' ? 'line-through' : 'none',
                        textDecorationColor: item.isMuted === 'true' ? '#999' : 'transparent',
                        fontFamily: unseenCount > 0 ? 'Urbanist-Bold' : 'Urbanist-Medium',
                        fontSize: unseenCount > 0 ? 15 : 14,
                      }]}>{(item.type === "group" || item.type === "community") && `${item.lastMessage?.senderName}`} {((item.type === "group" || item.type === "community") && item.lastMessage) && ": "}</TextVariant>
                      {
                        imageCounts && imageCounts > 0 && (
                          <TextVariant style={[styles.lastMessage, {
                            color: item.isMuted === 'true' ? '#999' : '#666',
                            textDecorationLine: item.isMuted === 'true' ? 'line-through' : 'none',
                            textDecorationColor: item.isMuted === 'true' ? '#999' : 'transparent',
                            fontFamily: unseenCount > 0 ? 'Urbanist-Bold' : 'Urbanist-Medium',
                            fontSize: unseenCount > 0 ? 15 : 14,
                          }]}>
                            {`sent ${imageCounts} ${imageCounts > 1 ? 'images' : 'image'}`}
                          </TextVariant>
                        )
                      }
                    </View>
                  ) : isVideo ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextVariant style={[styles.lastMessage, {
                        color: item.isMuted === 'true' ? '#999' : '#666',
                        textDecorationLine: item.isMuted === 'true' ? 'line-through' : 'none',
                        textDecorationColor: item.isMuted === 'true' ? '#999' : 'transparent',
                        fontFamily: unseenCount > 0 ? 'Urbanist-Bold' : 'Urbanist-Medium',
                        fontSize: unseenCount > 0 ? 15 : 14,
                      }]}>{(item.type === "group" || item.type === "community") && `${item.lastMessage?.senderName}`} {((item.type === "group" || item.type === "community") && item.lastMessage) && ": "}</TextVariant>
                      {
                        <TextVariant style={[styles.lastMessage, {
                          color: item.isMuted === 'true' ? '#999' : '#666',
                          textDecorationLine: item.isMuted === 'true' ? 'line-through' : 'none',
                          textDecorationColor: item.isMuted === 'true' ? '#999' : 'transparent',
                          fontFamily: unseenCount > 0 ? 'Urbanist-Bold' : 'Urbanist-Medium',
                          fontSize: unseenCount > 0 ? 15 : 14,
                        }]}>
                          {`sent a video`}
                        </TextVariant>
                      }
                    </View>
                  ): isFile ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextVariant style={[styles.lastMessage, {
                        color: item.isMuted === 'true' ? '#999' : '#666',
                        textDecorationLine: item.isMuted === 'true' ? 'line-through' : 'none',
                        textDecorationColor: item.isMuted === 'true' ? '#999' : 'transparent',
                        fontFamily: unseenCount > 0 ? 'Urbanist-Bold' : 'Urbanist-Medium',
                        fontSize: unseenCount > 0 ? 15 : 14,
                      }]}>{(item.type === "group" || item.type === "community") && `${item.lastMessage?.senderName}`} {((item.type === "group" || item.type === "community") && item.lastMessage) && ": "}</TextVariant>
                      {
                        <TextVariant style={[styles.lastMessage, {
                          color: item.isMuted === 'true' ? '#999' : '#666',
                          textDecorationLine: item.isMuted === 'true' ? 'line-through' : 'none',
                          textDecorationColor: item.isMuted === 'true' ? '#999' : 'transparent',
                          fontFamily: unseenCount > 0 ? 'Urbanist-Bold' : 'Urbanist-Medium',
                          fontSize: unseenCount > 0 ? 15 : 14,
                        }]}>
                          {`sent a file`}
                        </TextVariant>
                      }
                    </View>
                  ) : <TextVariant numberOfLines={1} style={[styles.lastMessage, {
                    color: item.isMuted === 'true' ? '#999' : '#666',
                    textDecorationLine: item.isMuted === 'true' ? 'line-through' : 'none',
                    textDecorationColor: item.isMuted === 'true' ? '#999' : 'transparent',
                    fontFamily: unseenCount > 0 ? 'Urbanist-Bold' : 'Urbanist-Medium',
                    fontSize: unseenCount > 0 ? 15 : 14,
                  }]}>
                    {(item.type === "group" || item.type === "community") && item.lastMessage && `${item.lastMessage?.senderName}`} {((item.type === "group" || item.type === "community") && item.lastMessage) && ": "}{lastMessageText}
                  </TextVariant>}
                </View>
                <View style={styles.rightContent}>
                  <TextVariant style={styles.messageTime}>
                    {lastMessageTime}
                  </TextVariant>

                  <View style={styles.statusRow}>
                    {item.isPinned === 'true' && (
                      <ImageVariant
                        source={smallPinIcon}
                        style={styles.metaIcon}
                        resizeMode="contain"
                      />
                    )}
                    {item.isMuted === 'true' && (
                      <ImageVariant
                        source={smallMuteIcon}
                        style={styles.metaIcon}
                        resizeMode="contain"
                      />
                    )}
                    {unseenCount > 0 && (
                      <View
                        style={[
                          styles.unreadBadge,
                          {
                            backgroundColor:
                              item.isMuted === 'true' ? '#999' : '#184BFF',
                            paddingHorizontal: unseenCount > 9 ? 4 : 6,
                          },
                        ]}
                      >
                        <TextVariant style={styles.unreadText}>
                          {unseenCount > 9 ? '9+' : unseenCount}
                        </TextVariant>
                      </View>
                    )}
                  </View>
                </View>
              </ButtonVariant>
            </Wrapper>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

export default React.memo(Card);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginTop: 5,
    width: '100%',
    overflow: 'hidden',
  },
  cardSurface: {
    backgroundColor: '#fff',
    zIndex: 1,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    height: heightPercentToDp('7.5'),
  },
  middleContent: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  rightContent: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 8,
    paddingVertical: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
    letterSpacing: 0.5,
    fontFamily: 'Urbanist-Medium',
  },
  unreadBadge: {
    backgroundColor: '#184BFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'Urbanist-Bold',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH * 3,
    flexDirection: 'row',
    zIndex: 0,
  },
  actionButtonAnimated: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  actionButton: {
    width: ACTION_WIDTH - 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    width: 28,
    height: 28,
  },
});
