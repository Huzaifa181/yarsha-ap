import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { TextVariant } from '@/components/atoms';

const GIFGrid = ({
    gifs,
    openGifModal,
    direction,
    isLoading,
    messageTime,
  }: {
    gifs: string[];
    openGifModal: (gifs: string[], index: number) => void;
    direction: string;
    isLoading: boolean;
    messageTime: string;
  }) => {
    return (
      <View style={{ paddingHorizontal: 3, paddingTop: 3 }}>
        {gifs.map((gif, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => openGifModal(gifs, index)}
            style={{ marginBottom: 4 }}
          >
            <FastImage
              source={{ uri: gif }}
              style={{
                width: 200,
                height: 200,
                borderRadius: 10,
              }}
              resizeMode="stretch"
            />
          </TouchableOpacity>
        ))}
  
        {isLoading && (
          <View style={styles.loadingOverlayWhole}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        )}
  
        <View style={styles.gridTimeOverlay}>
          <TextVariant style={styles.gridTimeText}>{messageTime}</TextVariant>
        </View>
      </View>
    );
  };
  

  export default GIFGrid;

  const styles = StyleSheet.create({
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