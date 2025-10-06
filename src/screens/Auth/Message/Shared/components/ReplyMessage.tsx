import React from 'react';
import { View } from 'react-native';
import { TextVariant } from '@/components/atoms';
import { ReplyMessageProps } from '../../types/message-types';
import { useTheme } from '@/theme';

const ReplyMessage: React.FC<ReplyMessageProps> = ({ replyTo }) => {
  if (!replyTo) return null;
  const {colors} = useTheme()
  return (
    <View
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 10,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
      }}
    >
      <TextVariant
        style={{
          color: colors.primary,
          fontWeight: 'bold',
          fontStyle: 'italic',
          marginBottom: 4,
          fontSize: 10,
        }}
      >
        {replyTo.replyToSenderName || 'Unknown'}:
      </TextVariant>
      <TextVariant style={{ fontSize: 14 }}>
        {replyTo.replyToContent || ''}
      </TextVariant>
    </View>
  );
};

export default ReplyMessage;
