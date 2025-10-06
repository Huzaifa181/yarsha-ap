import { ImageSourcePropType } from "react-native";

export type ChatItem = {
  key: string;
  name: string;
  message: string;
  date: string;
  unreadCount: number;
  avatar: undefined | ImageSourcePropType;
};
