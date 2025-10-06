import { TextVariant } from "@/components/atoms";
import { useTheme } from "@/theme";
import { getInitials } from "@/utils";
import FastImage from "@d11/react-native-fast-image";
import { View, StyleSheet } from "react-native";
import { z } from "zod";

type AvatarSize = "small" | "medium" | "large";

const sizeStyles = StyleSheet.create({
  small: { width: 32, height: 32 },
  medium: { width: 48, height: 48 },
  large: { width: 64, height: 64 },
});

const Avatar = ({
  groupIcon,
  groupName,
  backgroundColor,
  size = "medium",
}: {
  groupIcon?: string;
  groupName?: string;
  backgroundColor?: string;
  size?: AvatarSize;
}) => {
  const { components, gutters, borders, layout } = useTheme();
  const isValidURL = z.string().url().safeParse(groupIcon).success;

  if (groupIcon && isValidURL) {
    return (
      <FastImage
        source={{ uri: groupIcon }}
        style={[
          sizeStyles[size],
          gutters.marginRight_6,
          borders.rounded_500,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        sizeStyles[size],
        gutters.marginRight_6,
        borders.rounded_500,
        { backgroundColor: backgroundColor || "#ccc" },
        layout.itemsCenter,
        layout.justifyCenter,
      ]}
    >
      <TextVariant style={components.urbanist24BoldWhite}>
        {getInitials(groupName || "")}
      </TextVariant>
    </View>
  );
};

export default Avatar;
