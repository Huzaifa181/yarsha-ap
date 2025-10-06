import React from 'react';
import { View } from 'react-native';
import { ImageVariant, TextVariant } from '@/components/atoms';
import { useTheme } from '@/theme';
import { Images } from '@/theme';

interface ConnectionStatusProps {
  visible: boolean;
  message: string;
  isConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  visible,
  message,
  isConnected,
}) => {
  const { layout, backgrounds, components, gutters } = useTheme();

  if (!visible) return null;

  return (
    <View
      style={[
        layout.row,
        layout.itemsCenter,
        layout.justifyCenter,
        isConnected ? backgrounds.connectionStored : backgrounds.primary,
        gutters.paddingVertical_8,
        layout.z10,
      ]}>
      <ImageVariant
        source={isConnected ? Images.circle_check : Images.warning}
        sourceDark={isConnected ? Images.circle_check : Images.warning}
        style={[components.iconSize14, gutters.marginRight_6]}
      />
      <TextVariant
        style={[components.textCenter, components.urbanist14RegularWhite]}>
        {message}
      </TextVariant>
    </View>
  );
};

export default ConnectionStatus;