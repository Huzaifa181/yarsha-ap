import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  Platform
} from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { BlurView } from '@react-native-community/blur';
import { ButtonVariant, TextVariant } from '@/components/atoms';
import { DocumentListProps } from '../../types/message-types';

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  openDocument,
  metadata,
  direction,
  isLoading
}) => {
  const { width: screenWidth } = Dimensions.get('window');
  const documentItemWidth = screenWidth * 0.65;

  const [downloadedDocs, setDownloadedDocs] = useState<{ [key: string]: string }>({});
  const [fileSizes, setFileSizes] = useState<{ [key: string]: number }>({});

  const formatSize = (bytes: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getLocalPath = (filename: string) => {
    return Platform.OS === 'ios'
      ? `${RNFS.DocumentDirectoryPath}/${filename}`
      : `${RNFS.DownloadDirectoryPath}/${filename}`;
  };

  const checkDownloadedAndSize = async (uri: string, filename: string) => {
    const localPath = getLocalPath(filename);
    const exists = await RNFS.exists(localPath);
    if (exists) {
      setDownloadedDocs(prev => ({ ...prev, [uri]: localPath }));

      try {
        const stat = await RNFS.stat(localPath);
        setFileSizes(prev => ({ ...prev, [uri]: stat.size }));
      } catch (e) {
        console.warn(`Could not get size for ${filename}`, e);
      }
    }
  };

  useEffect(() => {
    documents.forEach((docUri, index) => {
      const filename = metadata[index]?.name || `document_${index + 1}`;
      checkDownloadedAndSize(docUri, filename);
    });
  }, [documents]);

  const handleDownload = async (uri: string, index: number) => {
    try {
      const filename = metadata[index]?.name || `document_${index + 1}`;
      const localPath = getLocalPath(filename);

      const downloadResult = await RNFS.downloadFile({
        fromUrl: uri,
        toFile: localPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        setDownloadedDocs(prev => ({ ...prev, [uri]: localPath }));
        const stat = await RNFS.stat(localPath);
        setFileSizes(prev => ({ ...prev, [uri]: stat.size }));
        Alert.alert("Downloaded", `File saved to ${Platform.OS === 'ios' ? 'Files' : 'Downloads'}`);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Download failed", "Please try again.");
    }
  };

  return (
    <View style={styles.documentListContainer}>
      {documents.map((docUri, index) => {
        const documentMetadata = metadata[index];
        const [isExpanded, setExpanded] = useState(false);

        const filename = documentMetadata?.name || `Document ${index + 1}`;
        const isDownloaded = !!downloadedDocs[docUri];
        const isLocalUri = docUri.startsWith("file://");
        const shouldShowDownload = direction !== 'sent' && !isDownloaded;
        const showBlur = !isExpanded && !isDownloaded && !isLocalUri;
        const fileSize =
          documentMetadata?.size ??
          fileSizes[docUri] ??
          (direction !== 'sent' ? undefined : undefined);

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.documentRow,
              {
                width: documentItemWidth,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                paddingHorizontal: 14
              }
            ]}
            onPress={() => {
              openDocument(docUri);
            }}
          >
            <View style={{ flexDirection: 'row', flex: 1 }}>
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: docUri }}
                  style={isExpanded ? styles.previewExpanded : styles.previewThumbnail}
                />
                {showBlur && (
                  <BlurView
                    style={StyleSheet.absoluteFill}
                    blurType="light"
                    blurAmount={10}
                    reducedTransparencyFallbackColor="white"
                  />
                )}
              </View>

              <View style={styles.textColumn}>
                <TextVariant style={[styles.docTitle, {
                  color: direction === "sent" ? "#fff" : "#333",
                  fontSize: 14,
                  fontFamily: "Urbanist-Medium",
                }]}>
                  {filename}
                </TextVariant>
                {fileSize !== undefined && (
                  <TextVariant style={[styles.docSize, {
                    color: direction === "sent" ? "#fff" : "#777",
                    fontSize: 10,
                    fontFamily: "Urbanist-Regular",
                  }]}>
                    {formatSize(fileSize)}
                  </TextVariant>
                )}
              </View>
            </View>

            {shouldShowDownload && (
              <ButtonVariant onPress={() => handleDownload(docUri, index)}>
                <Image
                  source={require("@/theme/assets/images/download.png")}
                  style={{ width: 20, height: 20, resizeMode: 'cover' }}
                />
              </ButtonVariant>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

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
  previewContainer: {
    height: 90,
    width: 60,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEE',
    marginRight: 10,
  },
  previewThumbnail: {
    height: 90,
    width: 60,
    resizeMode: 'stretch',
  },
  previewExpanded: {
    height: 90,
    width: 60,
    resizeMode: 'stretch',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  docTitle: {
    fontSize: 14,
    fontFamily: 'Urbanist-Medium',
    color: '#333',
  },
  docSize: {
    fontSize: 12,
    fontFamily: 'Urbanist-Regular',
    color: '#777',
    marginTop: 2,
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
  }
});

export default DocumentList;
