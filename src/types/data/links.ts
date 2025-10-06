import { ImageSourcePropType } from "react-native";

export interface ItemData {
  id: string;
  name: string;
  url: string;
  image: ImageSourcePropType;
}

export interface MonthData {
  title: string;
  data: ItemData[];
}

export const linkData: MonthData[] = [];
