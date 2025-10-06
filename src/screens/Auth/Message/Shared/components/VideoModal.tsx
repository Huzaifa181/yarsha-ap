import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import Modal from 'react-native-modal';
import Video, { VideoRef } from "react-native-video";
import Slider from '@react-native-community/slider';
import { ImageVariant, TextVariant } from '@/components/atoms';
import { Images, ImagesDark } from '@/theme';

interface VideoModalProps {
  isVisible: boolean;
  videos: string[];
  currentIndex: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VideoModal: React.FC<VideoModalProps> = ({
  isVisible,
  videos,
  currentIndex,
  onClose
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(currentIndex);
  const [paused, setPaused] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoEnded, setVideoEnded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const videoRef = useRef<VideoRef | null>(null);

  // Shared values for transformations
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Reset values when video changes
  useEffect(() => {
    setCurrentVideoIndex(currentIndex);
    setPaused(false);
    setCurrentTime(0);
    setVideoEnded(false);
    setLoading(true);
    
    // Reset transformations with animation
    scale.value = withTiming(1, { duration: 300 });
    translateX.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [currentIndex]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle play/pause toggle
  const handlePlayPause = () => {
    if (videoEnded) {
      videoRef.current?.seek(0);
      setCurrentTime(0);
      setVideoEnded(false);
      setPaused(false);
    } else {
      setPaused(!paused);
    }
  };

  // Double tap gesture for quick zoom in/out
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onStart(() => {
      if (scale.value > 1.2) {
        // Reset to original position and scale
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom to 2x (videos usually don't need as much zoom as images)
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  // Pan gesture for moving the video
  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((event) => {
      // Only allow panning when zoomed in
      if (scale.value > 1.1) {
        // Calculate boundaries based on current scale
        const maxTranslateX = (scale.value * SCREEN_WIDTH - SCREEN_WIDTH) / 2;
        const maxTranslateY = (scale.value * SCREEN_HEIGHT - SCREEN_HEIGHT) / 2;
        
        // Apply translation with boundaries
        translateX.value = Math.min(
          maxTranslateX,
          Math.max(-maxTranslateX, savedTranslateX.value + event.translationX)
        );
        translateY.value = Math.min(
          maxTranslateY,
          Math.max(-maxTranslateY, savedTranslateY.value + event.translationY)
        );
      } else {
        // When not zoomed in, horizontal pan changes videos
        if (Math.abs(event.translationX) > 100 && Math.abs(event.velocityX) > 300) {
          if (event.translationX > 0 && currentVideoIndex > 0) {
            runOnJS(setCurrentVideoIndex)(currentVideoIndex - 1);
          } else if (event.translationX < 0 && currentVideoIndex < videos.length - 1) {
            runOnJS(setCurrentVideoIndex)(currentVideoIndex + 1);
          }
        }
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      // Apply scale with limits (videos usually don't need as much zoom)
      scale.value = Math.min(4, Math.max(0.5, savedScale.value * event.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Combine all gestures
  const composedGestures = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    doubleTapGesture
  );

  // Animated style for transformations
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      animationIn="fadeIn"
      animationOut="fadeOut"
      useNativeDriver={true}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.9}
      backdropColor="black"
      style={{ margin: 0 }}
    >
      <View style={styles.videoContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
        
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
        >
          <ImageVariant
            source={Images.arrowRightWithBg}
            sourceDark={ImagesDark.arrowRightWithBg}
            style={[{ width: 38, height: 38, transform: [{ rotate: '180deg' }] }]}
          />
        </TouchableOpacity>

        {currentVideoIndex > 0 && (
          <TouchableOpacity
            onPress={handlePrevVideo}
            style={styles.prevButton}
          >
            <ImageVariant
              source={Images.arrowRightWithBg}
              sourceDark={ImagesDark.arrowRightWithBg}
              style={[{ width: 24, height: 24, transform: [{ rotate: '180deg' }] }]}
            />
          </TouchableOpacity>
        )}

        <GestureDetector gesture={composedGestures}>
          <Animated.View style={[styles.videoWrapper, animatedStyle]}>
            <Video
              ref={videoRef}
              source={{ uri: videos[currentVideoIndex] }}
              style={styles.video}
              controls={false}
              resizeMode="contain"
              paused={paused}
              onLoadStart={() => setLoading(true)}
              onLoad={(data) => {
                setVideoDuration(data.duration);
                setLoading(false);
              }}
              onProgress={(data) => setCurrentTime(data.currentTime)}
              onEnd={() => {
                setPaused(true);
                setVideoEnded(true);
              }}
            />
          </Animated.View>
        </GestureDetector>

        {currentVideoIndex < videos.length - 1 && (
          <TouchableOpacity
            onPress={handleNextVideo}
            style={styles.nextButton}
          >
            <ImageVariant
              source={Images.arrowRightWithBg}
              sourceDark={ImagesDark.arrowRightWithBg}
              style={[{ width: 24, height: 24 }]}
            />
          </TouchableOpacity>
        )}

        {!loading && (
          <>
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={handlePlayPause}
            >
              <TextVariant style={styles.playPauseIcon}>
                {paused ? '▶' : '❚❚'}
              </TextVariant>
            </TouchableOpacity>

            <View style={styles.controlsContainer}>
              <TextVariant style={styles.timeText}>{formatTime(currentTime)}</TextVariant>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={videoDuration}
                value={currentTime}
                onSlidingComplete={(value) => {
                  if (videoRef.current) {
                    videoRef.current.seek(value);
                  }
                }}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="#888888"
                thumbTintColor="#FFFFFF"
              />
              <TextVariant style={styles.timeText}>{formatTime(videoDuration)}</TextVariant>
            </View>
            
            <TextVariant style={styles.helpText}>
              Double tap to zoom • Pinch to zoom • Swipe to change videos
            </TextVariant>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 25,
  },
  prevButton: {
    position: 'absolute',
    left: 10,
    top: '50%',
    zIndex: 10,
    transform: [{ translateY: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    zIndex: 10,
    transform: [{ translateY: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 50,
    zIndex: 5,
  },
  playPauseIcon: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    zIndex: 5,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    color: 'white',
    fontSize: 14,
  },
  helpText: {
    position: 'absolute',
    bottom: 30,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
  }
});

export default VideoModal;