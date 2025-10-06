import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Video from 'react-native-video';
import { TextVariant } from '@/components/atoms';
import { VideoGridProps } from '../../types/message-types';

const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  thumbnails,
  openVideoModal,
  direction,
  metadata,
  isLoading,
  messageTime
}) => {
  const videosToShow = videos.slice(0, 6);

  const renderGridLayout = () => {
    const total = videosToShow.length;

    if (total === 1) return <View style={styles.fullRow}>{renderVideo(0, '100%')}</View>;
    if (total === 2) return <View style={styles.imageRow}>{renderVideo(0, '49%')}{renderVideo(1, '49%')}</View>;
    if (total === 3) return <>
      <View style={styles.fullRow}>{renderVideo(0, '100%')}</View>
      <View style={styles.imageRow}>{renderVideo(1, '49%')}{renderVideo(2, '49%')}</View>
    </>;
    if (total === 4) return <>
      <View style={styles.imageRow}>{renderVideo(0, '49%')}{renderVideo(1, '49%')}</View>
      <View style={styles.imageRow}>{renderVideo(2, '49%')}{renderVideo(3, '49%')}</View>
    </>;
    if (total === 5) return <>
      <View style={styles.fullRow}>{renderVideo(0, '100%')}</View>
      <View style={styles.imageRow}>{renderVideo(1, '49%')}{renderVideo(2, '49%')}</View>
      <View style={styles.imageRow}>{renderVideo(3, '49%')}{renderVideo(4, '49%')}</View>
    </>;
    if (total === 6) return <>
      <View style={styles.imageRow}>{renderVideo(0, '32%')}{renderVideo(1, '32%')}{renderVideo(2, '32%')}</View>
      <View style={styles.imageRow}>{renderVideo(3, '32%')}{renderVideo(4, '32%')}{renderVideo(5, '32%')}</View>
    </>;

    return null;
  };

  const renderVideo = (index: number, widthPercent: `${number}%`) => {
    const videoUri = videosToShow[index];
    return (
      <TouchableOpacity key={index} style={{ width: widthPercent }} onPress={() => openVideoModal(videos, thumbnails, index)}>
        <Video
          source={{ uri: videoUri }}
          style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }}
          resizeMode="cover"
          repeat
          muted
          paused={false}
          ignoreSilentSwitch="ignore"
        />
      </TouchableOpacity>
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
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  fullRow: {
    width: '100%',
    marginBottom: 3,
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

export default VideoGrid;
