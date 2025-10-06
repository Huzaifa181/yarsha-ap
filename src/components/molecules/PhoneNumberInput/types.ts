import { TextInputProps, StyleProp, TextStyle, ViewStyle } from "react-native";
import {
  CountryCode,
  CallingCode,
  Country,
} from "react-native-country-picker-modal";
import { CountryFilterProps } from "react-native-country-picker-modal/lib/CountryFilter";

export interface PhoneInputProps {
  withDarkTheme?: boolean;
  withShadow?: boolean;
  autoFocus?: boolean;
  defaultCode?: CountryCode;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  disableArrowIcon?: boolean;
  placeholder?: string;
  flagSize?: number;
  onChangeCountry?: (country: Country) => void;
  onChangeText?: (text: string) => void;
  onChangeFormattedText?: (text: string) => void;
  renderDropdownImage?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  textContainerStyle?: StyleProp<ViewStyle>;
  textInputProps?: TextInputProps;
  textInputStyle?: StyleProp<TextStyle>;
  codeTextStyle?: StyleProp<TextStyle>;
  flagButtonStyle?: StyleProp<ViewStyle>;
  countryPickerButtonStyle?: StyleProp<ViewStyle>;
  layout?: "first" | "second";
  filterProps?: CountryFilterProps;
  countryPickerProps?: any;
}

export interface PhoneInputState {
  code: CallingCode | undefined;
  number: string;
  modalVisible: boolean;
  countryCode: CountryCode;
  disabled: boolean;
}
