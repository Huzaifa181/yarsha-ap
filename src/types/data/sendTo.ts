import { ImageSourcePropType } from "react-native";

export interface User {
  backgroundColor: string;
  groupIcon: string;
  groupId: string;
  groupName: string;
  participants: string[];
}

export interface Friend extends User {}
