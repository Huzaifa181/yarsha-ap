import type {
  StackNavigationProp,
  StackScreenProps,
} from '@react-navigation/stack';
import {NavigatorScreenParams, RouteProp} from '@react-navigation/native';
import type {PropsWithChildren} from 'react';
import {CreateProfileSpace} from '../view/view';
import {SharedValue} from 'react-native-reanimated';
import {MessageModel} from '@/database';

export type MainParamsList = {
  SetupProfileScreen: undefined;
  ImportRecoveryPhraseScreen: undefined;
  OTPVerificationScreen: {
    phoneNumber: string;
    dialCode: string;
    number: string;
    countryCode: string;
  };
  CreateNewWalletScreen: undefined;
  CreatePasswordScreen: {isNewWallet: boolean};
  CreateProfileScreen: {
    authToken: string;
    address: string;
    id: string;
    phoneNumber: string;
  };
  VerifyYourSeedScreen: undefined;
};

export type BottomTabParamList = {
  ChatsScreen?: {
    userName?: string;
    profilePicture?: CreateProfileSpace.ImageMetadata | null;
    contactAdded?: boolean;
  };
  SettingsScreen: undefined;
  ContactsScreen: undefined;
  TokenContactsScreen: {
    token: any;
  };
  HistoryScreen: undefined;
};

export type AuthStackParamList = {
  ChatsScreen?: {
    userName?: string;
    profilePicture?: CreateProfileSpace.ImageMetadata | null;
    contactAdded?: boolean;
  };
  PortfolioScreen: {
    messageId?: string;
    chatId?: string;
    name?: string;
    groupName?: string;
    type?: string;
    receivers?: any[];
    receiverId?: string;
    receiverName?: string;
    groupDetail?: any;
  };
  SettingsScreen: undefined;
  ContactsScreen: undefined;
  SendMoney: undefined;
  TokenContactsScreen: {
    token: any;
  };
  BotMessage: {
    botId: string;
    name: string;
    profilePicture?: string;
    type: string;
    botDescription: string;
    botBio?: string;
    category?: string;
    username?: string;
    descriptions?: string[];
  };
  BottomTab: NavigatorScreenParams<BottomTabParamList>;
  MessageScreen: {
    messageId?: string;
    chatId: string;
    name: string;
    type: string;
    membersCount?: number;
    tokenSymbol?: string;
    receiverName?: string;
    profilePicture?: string;
    lastActive?: number;
    transactionId?: string;
    actionUrl?: string;
    amount?: number;
    recipientAddress?: string;
    receiverId?: string;
    blinkDetails?: string;
    backgroundColor?: string;
    color?: string;
  };
  GroupDetailsScreen: {groupId: string; groupName: string};
  ProfileDetails: {
    Id?: string;
    PhoneNumber?: string;
    FullName?: string;
    CountryCode?: string;
    Number?: string;
    DialCode?: string;
    Address?: string;
    Status?: string;
    ProfilePicture?: string;
    UserBio?: string;
    Username?: string;
    BackgroundColor?: string;
    LastActive?: string;
    CreatedAt?: string;
    UpdatedAt?: string;
  };
  EnterAmountScreen: {
    messageId?: string | string[];
    chatId?: string | string[];
    name?: string;
    groupName?: string;
    chatType: string;
    receiverName?: string;
    receiverType?: string;
    receiverId?: string;
    token?: any;
    receivers?: any[];
    groupDetail?: any;
  };
  CreateGroupScreen: undefined;
  SetGroupScreen: undefined;
  SearchScreen: undefined;
  EditProfileScreen: undefined;
  PrivateMessageScreen: {
    messageId: string;
    chatId?: string;
    name: string;
    type: string;
    tokenSymbol?: string;
    membersCount?: number;
    profilePicture?: string;
    lastActive?: number;
    transactionId?: string;
    actionUrl?: string;
    amount?: number;
    recipientAddress?: string;
    blinkDetails?: string;
    backgroundColor?: string;
    color?: string;
    timeStamp?: number;
  };
  PinnedMessageScreen: {
    chatId?: string;
    messages?: MessageModel[];
  };
  BotDescription: {
    botId: string;
  };
  AddAdminsScreen: {groupId: string};
  BotMessageScreen: {
    messageId: string;
    chatId?: string;
    name: string;
    type: string;
    membersCount?: number;
    tokenSymbol?: string;
    profilePicture?: string;
    lastActive?: number;
    transactionId?: string;
    actionUrl?: string;
    amount?: number;
    recipientAddress?: string;
    backgroundColor?: string;
    color?: string;
    timeStamp?: number;
    botId?: string;
  };
  AddAdminConfirmation: {
    fullName?: string;
    username?: string;
    backgroundColor?: string;
    address?: string;
    id?: string;
    profilePicture?: string;
    lastActive?: string;
    status?: 'online' | 'offline';
    role?: 'member' | 'admin' | 'creator';
    groupId: string;
  };
  HistoryScreen: undefined;
  SecurityAndPrivacyScreen: undefined;
  QRCodeScreen: undefined;
  EditGroupScreen: {groupId: string; groupName: string};
  MembersScreen: {screenName: string; groupId: string};
  AddMembers: {groupId: string};
  TermsAndCondition: undefined;
  PrivacyPolicy: undefined;
  DeleteAccount: undefined;
};

export type ApplicationStackParamList = {
  StartUpScreen: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainParamsList>;
  SetupProfileScreen: undefined;
  ImportRecoveryPhraseScreen: undefined;
  OTPVerificationScreen: {
    phoneNumber: string;
    dialCode: string;
    number: string;
    countryCode: string;
  };
  CreateNewWalletScreen: undefined;
  CreatePasswordScreen: {isNewWallet: boolean};
  SendMoney: undefined;
  CreateProfileScreen: {
    authToken: string;
    address: string;
    id: string;
    phoneNumber: string;
  };
  BottomTab: NavigatorScreenParams<BottomTabParamList>;
  ChatsScreen?: {
    userName?: string;
    profilePicture?: CreateProfileSpace.ImageMetadata | null;
    contactAdded?: boolean;
  };
  BotMessage: {
    botId: string;
    name: string;
    profilePicture?: string;
    type: string;
    botDescription: string;
    botBio?: string;
    category?: string;
    username?: string;
    descriptions?: string[];
  };
  PortfolioScreen: {
    messageId?: string;
    chatId?: string;
    name?: string;
    groupName?: string;
    type?: string;
    receivers?: any[];
    receiverId?: string;
    receiverName?: string;
    groupDetail?: any;
  };
  VerifyYourSeedScreen: undefined;
  SettingsScreen: undefined;
  MessageScreen: {
    messageId?: string;
    chatId: string;
    name: string;
    tokenSymbol?: string;
    membersCount?: number;
    type: string;
    receiverName?: string;
    profilePicture?: string;
    receiverId?: string;
    recipientAddress?: string;
    transactionId?: string;
    actionUrl?: string;
    amount?: number;
    groupName?: string;
    blinkDetails?: any;
    backgroundColor?: string;
    color?: string;
  };
  ContactsScreen: undefined;
  TokenContactsScreen: {
    token: any;
  };
  GroupDetailsScreen: {groupId: string; groupName: string};
  ProfileDetails: {
    Id?: string;
    PhoneNumber?: string;
    FullName?: string;
    CountryCode?: string;
    Number?: string;
    DialCode?: string;
    Address?: string;
    Status?: string;
    ProfilePicture?: string;
    UserBio?: string;
    Username?: string;
    BackgroundColor?: string;
    LastActive?: string;
    CreatedAt?: string;
    UpdatedAt?: string;
  };
  EnterAmountScreen: {
    messageId?: string | string[];
    chatId?: string | string[];
    name?: string;
    groupName?: string;
    chatType: string;
    receiverName?: string;
    receiverType?: string;
    receiverId?: string;
    receivers?: any[];
    token?: any;
    groupDetail?: any;
  };
  CreateGroupScreen: undefined;
  SetGroupScreen: undefined;
  SearchScreen: undefined;
  EditProfileScreen: undefined;
  PrivateMessageScreen: {
    messageId: string;
    chatId?: string;
    name: string;
    type: string;
    membersCount?: number;
    tokenSymbol?: string;
    profilePicture?: string;
    lastActive?: number;
    transactionId?: string;
    actionUrl?: string;
    amount?: number;
    recipientAddress?: string;
    backgroundColor?: string;
    color?: string;
    timeStamp?: number;
  };
  PinnedMessageScreen: {
    chatId?: string;
    messages?: MessageModel[];
  };
  BotDescription: {
    botId: string;
  };
  BotMessageScreen: {
    messageId: string;
    chatId?: string;
    name: string;
    type: string;
    membersCount?: number;
    tokenSymbol?: string;
    profilePicture?: string;
    lastActive?: number;
    transactionId?: string;
    actionUrl?: string;
    amount?: number;
    recipientAddress?: string;
    backgroundColor?: string;
    color?: string;
    timeStamp?: number;
    botId?: string;
  };
  AddAdminsScreen: {groupId: string};
  AddAdminConfirmation: {
    fullName?: string;
    username?: string;
    backgroundColor?: string;
    address?: string;
    id?: string;
    profilePicture?: string;
    lastActive?: string;
    status?: 'online' | 'offline';
    role?: 'member' | 'admin' | 'creator';
    groupId: string;
  };
  HistoryScreen: undefined;
  QRCodeScreen: undefined;
  SecurityAndPrivacyScreen: undefined;
  EditGroupScreen: {groupId: string; groupName: string};
  MembersScreen: {screenName: string; groupId: string};
  AddMembers: {groupId: string};
  TermsAndCondition: undefined;
  PrivacyPolicy: undefined;
  DeleteAccount: undefined;
};

export type ApplicationScreenProps =
  StackScreenProps<ApplicationStackParamList>;
export type NavigationProp<T extends keyof MainParamsList> =
  StackNavigationProp<MainParamsList, T>;
export type AuthNavigationProp<T extends keyof AuthStackParamList> =
  StackNavigationProp<AuthStackParamList, T>;

export type SafeScreenNavigationProp =
  StackNavigationProp<ApplicationStackParamList>;
export type SafeScreenRouteProp = RouteProp<
  ApplicationStackParamList,
  keyof ApplicationStackParamList
>;

export type SafeScreenProps = PropsWithChildren<{
  screenTitle?: string;
  isNewProfileCreated?: boolean;
  messageId?: string;
  groupName?: string;
  type?: string;
  profilePicture?: string;
  lastActive?: number;
  scrollY?: SharedValue<number>;
  membersCount?: number;
  screenName?: string;
  color?: string;
  backgroundColor?: string;
  timeStamp?: number;
  nextAction?: () => void;
  canEditGroup?: boolean;
  botId?: string;
  onlineOffline?: 'online' | 'offline';
}>;
