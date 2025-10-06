import React from 'react';
import { View } from 'react-native';
import { TextVariant } from '@/components/atoms';
import { AutomatedMessageProps } from '../../types/message-types';

const AutomatedMessage: React.FC<AutomatedMessageProps> = ({ content }) => {
  return (
    <View
      style={{
        alignSelf: 'center',
        marginVertical: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 500,
      }}
    >
      <View
        style={{
          opacity: 0.3,
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          borderRadius: 500,
          backgroundColor: '#007AFF',
        }}
      />
      <TextVariant style={{ color: '#007AFF' }}>{content}</TextVariant>
    </View>
  );
};

export default AutomatedMessage;
