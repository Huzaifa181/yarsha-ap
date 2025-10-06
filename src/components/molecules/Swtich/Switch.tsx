import React, { FC, useState } from 'react';
import { useTheme } from '@/theme';
import { Switch } from '@rneui/themed';


interface IProps {
  isEnabled?: boolean;
  onToggle?: () => void;
  disabled?: boolean
}

/**
 * @author @neeteshraj
 * @function SwitchComponent
 **/

const SwitchComponent: FC<IProps> = ({ isEnabled, onToggle, disabled = false }) => {
  const { colors, components } = useTheme();

  return (
    <Switch
      disabled={disabled}
      value={isEnabled}
      onValueChange={onToggle}
      color={colors.primary}
      trackColor={{ false: colors.codeDark, true: colors.primary }}
      thumbColor={colors.white}
      style={[components.switch]}
    />
  );
};


export default React.memo(SwitchComponent);
