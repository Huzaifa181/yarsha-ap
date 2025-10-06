import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { TextVariant } from '@/components/atoms';
import { ImageGridProps } from '../../types/message-types';

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  thumbnails,
  openImageModal,
  direction,
  metadata,
  isLoading,
  retryUpload,
  messageTime
}) => {
  const imagesToShow = images.slice(0, 6);

  const renderGridLayout = () => {
    const total = imagesToShow.length;

    if (total === 1) {
      return <View style={styles.fullRow}>{renderImage(0, '100%')}</View>;
    }

    if (total === 2) {
      return (
        <View style={styles.imageRow}>
          {renderImage(0, '49%')}
          {renderImage(1, '49%')}
        </View>
      );
    }

    if (total === 3) {
      return (
        <>
          <View style={styles.fullRow}>{renderImage(0, '100%')}</View>
          <View style={styles.row}>
            {renderImage(1, '49%')}
            {renderImage(2, '49%')}
          </View>
        </>
      );
    }

    if (total === 4) {
      return (
        <>
          <View style={styles.imageRow}>
            {renderImage(0, '49%')}
            {renderImage(1, '49%')}
          </View>
          <View style={styles.imageRow}>
            {renderImage(2, '49%')}
            {renderImage(3, '49%')}
          </View>
        </>
      );
    }

    if (total === 5) {
      return (
        <>
          <View style={styles.fullRow}>{renderImage(0, '100%')}</View>
          <View style={styles.imageRow}>
            {renderImage(1, '49%')}
            {renderImage(2, '49%')}
          </View>
          <View style={styles.imageRow}>
            {renderImage(3, '49%')}
            {renderImage(4, '49%')}
          </View>
        </>
      );
    }

    if (total === 6) {
      return (
        <>
          <View style={styles.imageRow}>
            {renderImage(0, '32%')}
            {renderImage(1, '32%')}
            {renderImage(2, '32%')}
          </View>
          <View style={styles.imageRow}>
            {renderImage(3, '32%')}
            {renderImage(4, '32%')}
            {renderImage(5, '32%')}
          </View>
        </>
      );
    }

    return null;
  };

  const renderImage = (index: number, widthPercent: `${number}%`) => {
    const imageUri = imagesToShow[index];
    const thumbnailUri = thumbnails[index] || imageUri;
    const media = metadata[index];

    return (
      <View key={index} style={{ width: widthPercent, position: 'relative' }}>
        <TouchableOpacity onPress={() => openImageModal(images, index)}>
          <FastImage
            source={{ uri: thumbnailUri }}
            style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }}
            resizeMode="cover"
          />

          {index === 5 && images.length > 6 && (
            <View style={styles.overlay}>
              <TextVariant style={styles.overlayText}>
                +{images.length - 6}
              </TextVariant>
            </View>
          )}
        </TouchableOpacity>

        {media?.retryStatus === 'failed' && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => retryUpload(media, index)}
          >
            <TextVariant style={styles.retryText}>Retry</TextVariant>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={{ paddingHorizontal: 3, paddingTop: 3 }}>
      {renderGridLayout()}
      {isLoading && (
        <View style={styles.loadingOverlayWhole}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}
      <View style={styles.gridTimeOverlay}>
        <TextVariant style={styles.gridTimeText}>
          {messageTime}
        </TextVariant>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  fullRow: {
    width: '100%',
    marginBottom: 3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  overlayText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  retryButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'red',
    borderRadius: 5,
    padding: 4,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
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
  gridTimeOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(128,128,128,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  gridTimeText: {
    color: 'white',
    fontSize: 10,
  },
});

export default ImageGrid;
