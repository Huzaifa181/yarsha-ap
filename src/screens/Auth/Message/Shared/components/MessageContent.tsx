import React from 'react';
import { View, Pressable, Linking } from 'react-native';
import { TextVariant } from '@/components/atoms';
import FastImage from '@d11/react-native-fast-image';
import ImageGrid from './ImageGrid';
import VideoGrid from './VideoGrid';
import DocumentList from './DocumentList';
import { MessageType } from '../../types/message-types';
import ReplyMessage from './ReplyMessage';

interface MessageContentProps {
  item: MessageType;
  direction: 'sent' | 'received';
  openImageModal: (images: string[], index: number) => void;
  openVideoModal: (videos: string[], thumbnails: string[], index: number) => void;
  openDocument: (uri: string) => void;
  retryUpload: (media: any, index: number) => void;
  messageTime: string;
  colors: any;
}

const urlRegex = /(https?:\/\/[^\s]+)/;

const MessageContent: React.FC<MessageContentProps> = ({
  item,
  direction,
  openImageModal,
  openVideoModal,
  openDocument,
  retryUpload,
  messageTime,
  colors
}) => {
  if (item.type === "image") {
    return (
      <ImageGrid
        images={item.multimedia?.map((data: any) =>
          data?.localUri
            ? `file://${data.localUri}`
            : data?.signedUrl
        ) || []}
        thumbnails={item?.multimedia?.map((data: any) => data?.thumbnailUrl) || []}
        openImageModal={openImageModal}
        direction={direction}
        metadata={item?.multimedia || []}
        isLoading={item?.status === "uploading"}
        retryUpload={retryUpload}
        messageTime={messageTime}
      />
    );
  }

  if (item.type === "video") {
    return (
      <VideoGrid
        videos={item.multimedia?.map((data: any) =>
          data?.localUri
            ? `file://${data.localUri}`
            : data?.signedUrl
        ) || []}
        thumbnails={item?.multimedia?.map((data: any) => data?.thumbnailUrl) || []}
        openVideoModal={openVideoModal}
        direction={direction}
        metadata={item.multimedia || []}
        isLoading={item?.status === "uploading"}
        messageTime={messageTime}
      />
    );
  }

  if (item.type === "file") {
    return (
      <DocumentList
        documents={item.multimedia?.map((data: any) =>
          data?.localUri
            ? `file://${data.localUri}`
            : data?.signedUrl
        ) || []}
        openDocument={openDocument}
        direction={direction}
        metadata={item.multimedia || []}
        isLoading={item?.status === "uploading"}
      />
    );
  }

  // For text messages
  return (
    <View>
      {item?.replyTo?.replyToId && <ReplyMessage replyTo={item.replyTo} colors={colors} />}
      <View>
        {item?.content
          ?.split(/(https?:\/\/[^\s]+)/g)
          .map((segment: string, index: number) => {
            const isFirebaseUrl = segment.startsWith('https://firebasestorage.googleapis.com');
            const isUrl = urlRegex.test(segment);

            if (isUrl) {
              if (isFirebaseUrl) {
                return (
                  <Pressable
                    key={index}
                    onPress={() => openImageModal([item?.content], 0)}
                  >
                    <FastImage
                      source={{ uri: segment }}
                      style={{
                        width: 300,
                        height: 150,
                        borderRadius: 10,
                      }}
                      resizeMode="stretch"
                    />
                  </Pressable>
                );
              } else {
                return (
                  <Pressable key={index} onPress={() => Linking.openURL(segment)}>
                    <TextVariant
                      style={{
                        color: direction === 'received' ? '#333' : 'white',
                        fontSize: 16
                      }}
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
                  style={{
                    flexDirection: direction === 'received' ? 'row' : 'column',
                    justifyContent: direction === 'received' ? 'space-between' : 'flex-start',
                    alignItems: direction === 'received' ? 'center' : 'flex-start',
                    paddingLeft: 10,
                    paddingTop: 10,
                  }}
                >
                  <TextVariant
                    style={{
                      color: direction === 'received' ? '#333' : 'white',
                      fontSize: 16,
                      letterSpacing: 0.5,
                      flexShrink: 1,
                    }}
                  >
                    {segment}
                  </TextVariant>
                </View>
              );
            }
          })}
      </View>

      {item.preparedTransaction && (
        <View style={{ marginTop: 10 }}>
          <Pressable
            style={{
              backgroundColor: '#007AFF',
              alignItems: 'center',
              padding: 14,
              marginTop: 10,
              borderRadius: 8
            }}
          >
            <TextVariant style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Sign Transaction
            </TextVariant>
          </Pressable>
        </View>
      )}

      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingBottom: 8, 
        justifyContent: 'flex-end', 
        marginRight: 16, 
        marginTop: 2 
      }}>
        <TextVariant style={{
          fontSize: 12,
          textAlign: 'right',
          letterSpacing: 0.5,
          color: direction === 'sent' ? 'white' : '#333',
        }}>
          {messageTime}
        </TextVariant>

        {direction === "sent" && (
          <FastImage
            source={require('@/theme/assets/images/single_tick.png')}
            style={{ marginLeft: 8, width: 12, height: 12 }}
            resizeMode='contain'
          />
        )}
      </View>
    </View>
  );
};

export default MessageContent;
