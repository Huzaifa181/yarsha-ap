import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import Modal from 'react-native-modal';
import FastImage from '@d11/react-native-fast-image';
import { FlatList } from 'react-native-gesture-handler';
import { ImageVariant, TextVariant } from '@/components/atoms';
import { Images, ImagesDark } from '@/theme';

interface ImageModalProps {
  isVisible: boolean;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  handleNextImage: () => void;
  handlePrevImage: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImageModal: React.FC<ImageModalProps> = ({
  isVisible,
  images,
  currentIndex,
  onClose,
  handleNextImage,
  handlePrevImage
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(currentIndex);
  const [loading, setLoading] = useState<boolean>(true);

  // Shared values for transformations
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Reset values when image changes
  useEffect(() => {
    setCurrentImageIndex(currentIndex);
    setLoading(true);
    
    // Reset transformations with animation
    scale.value = withTiming(1, { duration: 300 });
    rotation.value = withTiming(0, { duration: 300 });
    translateX.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
    savedScale.value = 1;
    savedRotation.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [currentIndex]);

  // Double tap gesture for quick zoom in/out
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onStart((event) => {
      if (scale.value > 1.2) {
        // Reset to original position and scale
        scale.value = withSpring(1);
        rotation.value = withSpring(0);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedRotation.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom to 3x at the tap position
        const centerX = SCREEN_WIDTH / 2;
        const centerY = SCREEN_HEIGHT / 2;
        
        // Calculate the focus point for zooming
        translateX.value = withSpring((centerX - event.x) * 2);
        translateY.value = withSpring((centerY - event.y) * 2);
        scale.value = withSpring(3);
        
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        savedScale.value = 3;
      }
    });

  // Pan gesture for moving the image
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
        // When not zoomed in, horizontal pan changes images
        if (Math.abs(event.translationX) > 100 && Math.abs(event.velocityX) > 300) {
          if (event.translationX > 0 && currentImageIndex > 0) {
            runOnJS(handlePrevImage)();
          } else if (event.translationX < 0 && currentImageIndex < images.length - 1) {
            runOnJS(handleNextImage)();
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
    .onStart((event) => {
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onUpdate((event) => {
      // Apply scale with limits
      scale.value = Math.min(8, Math.max(0.5, savedScale.value * event.scale));
      
      // Adjust translation to keep the focal point fixed
      const newFocalX = event.focalX;
      const newFocalY = event.focalY;
      
      // Calculate the focal point shift
      const focalShiftX = (newFocalX - focalX.value) * (1 - 1/event.scale);
      const focalShiftY = (newFocalY - focalY.value) * (1 - 1/event.scale);
      
      // Apply the shift to maintain the focal point
      translateX.value = savedTranslateX.value + focalShiftX;
      translateY.value = savedTranslateY.value + focalShiftY;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onUpdate((event) => {
      rotation.value = savedRotation.value + event.rotation;
    })
    .onEnd(() => {
      // Snap to nearest 90 degrees if close
      const normalizedRotation = rotation.value % (2 * Math.PI);
      const snapPoints = [0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI];
      
      let closestSnapPoint = 0;
      let minDistance = Math.abs(normalizedRotation);
      
      snapPoints.forEach(point => {
        const distance = Math.abs(normalizedRotation - point);
        if (distance < minDistance) {
          minDistance = distance;
          closestSnapPoint = point;
        }
      });
      
      // If within 0.2 radians of a snap point, snap to it
      if (minDistance < 0.2) {
        rotation.value = withSpring(savedRotation.value + closestSnapPoint - normalizedRotation);
      }
      
      savedRotation.value = rotation.value;
    });

  // Combine all gestures
  const composedGestures = Gesture.Simultaneous(
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotationGesture),
    doubleTapGesture
  );

  // Animated style for transformations
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotateZ: `${rotation.value}rad` },
      ],
    };
  });

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
      {images.length > 0 && (
        <View style={styles.container}>
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

          {currentImageIndex > 0 && (
            <TouchableOpacity
              onPress={handlePrevImage}
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
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <FastImage
                source={{ uri: images[currentImageIndex] }}
                style={styles.image}
                resizeMode="contain"
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
              />
            </Animated.View>
          </GestureDetector>

          {currentImageIndex < images.length - 1 && (
            <TouchableOpacity
              onPress={handleNextImage}
              style={styles.nextButton}
            >
              <ImageVariant
                source={Images.arrowRightWithBg}
                sourceDark={ImagesDark.arrowRightWithBg}
                style={[{ width: 24, height: 24 }]}
              />
            </TouchableOpacity>
          )}

          <FlatList
            data={images}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            style={styles.carousel}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => {
                  setCurrentImageIndex(index);
                  // Reset transformations
                  scale.value = withTiming(1);
                  rotation.value = withTiming(0);
                  translateX.value = withTiming(0);
                  translateY.value = withTiming(0);
                  savedScale.value = 1;
                  savedRotation.value = 0;
                  savedTranslateX.value = 0;
                  savedTranslateY.value = 0;
                }}
                style={[
                  styles.thumbnailContainer,
                  currentImageIndex === index && styles.activeThumbnail
                ]}
              >
                <FastImage
                  source={{ uri: item }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          />
          
          <TextVariant style={styles.helpText}>
            Double tap to zoom • Pinch to zoom • Rotate with two fingers
          </TextVariant>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
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
  carousel: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    maxHeight: 80,
  },
  carouselContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  thumbnailContainer: {
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 5,
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: 'white',
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 5,
  },
  helpText: {
    position: 'absolute',
    bottom: 100,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
  }
});

export default ImageModal;