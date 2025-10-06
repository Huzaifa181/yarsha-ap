import {DimensionValue, ImageSourcePropType} from 'react-native';

export namespace BrandSpace {
  export type Props = {
    height?: DimensionValue;
    width?: DimensionValue;
    mode?: 'contain' | 'cover' | 'stretch' | 'repeat' | 'center';
    isLoading: boolean;
  };
}

export namespace CreateProfileSpace {
  export interface ImageMetadata {
    exif: any | null;
    filename: string;
    path: string;
    height: number;
    width: number;
    data: any | null;
    modificationDate: string | null;
    localIdentifier: string;
    size: number;
    sourceURL: string;
    mime: string;
    cropRect: {
      height: number;
      width: number;
    };
    duration: string | null;
    creationDate: string;
  }

  export type Mnemonic = string;
  export type Wallet = {
    publicKey: string;
    balance: number;
  };

  export type GenerateWallets = (
    mnemonic: Mnemonic,
    count: number,
  ) => Promise<Wallet[]>;

  export interface VerifyUserResponse<TChat> {
    authToken: string;
    success: boolean;
    user: {
      address: string;
      chats: TChat[];
      id: string;
      lastActive: number;
      newNonce: string;
      profilePicture: string;
      status: string;
      username: string;
    };
  }
}

export namespace ImportRecoverPhraseSpace {
  export type Mnemonic = string;

  export type Wallet = {
    publicKey: string;
    balance: number;
  };

  export type GenerateWallets = (
    mnemonic: Mnemonic,
    count: number,
  ) => Promise<Wallet[]>;
}

export namespace SetGroupPhase {
  export interface VerifyUserResponse<TChat> {
    address: string;
    chats: TChat[];
    id: string;
    profilePicture: string;
    profileThumbnail: string;
    status: string;
    username: string;
  }

  export interface UserData {
    address: string;
    chats: {
      chatId: string;
      groupIcon: string;
      memberCount: number;
      name: string;
    }[];
    id: string;
    fullName?: string;
    displayName?: string;
    backgroundColor?: string;
    lastActive: number;
    profilePicture: string;
    profileThumbnail: string;
    status: string;
    username: string;
    userBio: string;
  }
}

export namespace StartupSpace {
  export interface GroupChatsRequest {
    limit: number;
    page: number;
  }

  export interface SeenDetail {
    seenCount: number;
    timestamp: number;
  }
  export interface SeenDetails {
    [userId: string]: SeenDetail;
  }

  export type SeenCount = Record<string, number>;

  export interface ParticipantDetail {
    id: string;
    fullName: string;
    address: string;
    profilePicture: string | null;
    chatId?: string;
    backgroundColor?: string;
    color?: string;
  }

  export interface MuteEntry {
    [userId: string]: boolean;
  }

  export interface GroupChat {
    chatId: string;
    type: 'group' | 'individual' | 'community';
    name: string;
    lastMessage?: {
      content: string;
      messageId: string;
      senderId: string;
      senderName: string;
      type: string;
      timestamp: number;
    };
    mutedBy?: MuteEntry[];
    messageCount?: number;
    seenDetails?: SeenCount;
    createdAt?: string;
    updatedAt?: string | {_seconds: number; _nanoseconds: number};
    groupIcon: string;
    participants?: string[];
    participantsDetails?: ParticipantDetail[];
  }

  export interface GroupChatsResponse {
    groupChats: GroupChat[];
    currentPage: number;
    totalPages: number;
  }
}

export namespace GroupDetailsSpace {
  export interface MuteResponse {
    response: {
      success: boolean;
    };
    responseHeader: {
      requestId: string;
      responseDescription: string;
      responseTitle: string;
      status: number;
      statusCode: string;
      timeStamp: Record<string, any>;
    };
  }

  export interface ChatParticipant {
    id: string;
    username: string;
    profilePicture: string;
    role: string;
    avatar?: ImageSourcePropType | undefined;
    backgroundColor: string;
    fullName?: string;
    address?: string;
  }

  export interface ChatRole {
    [key: string]: 'admin' | 'member';
  }

  export interface ChatMessage {
    content: string;
    timestamp: number;
    sender: string;
  }

  export interface MutedBy {
    [key: string]: boolean;
  }

  export interface Chat {
    chatId: string;
    type: 'individual' | 'group' | 'community';
    participants: ChatParticipant[];
    participantIds?: string[];
    roles?: ChatRole;
    lastMessage?: any;
    createdAt?: number;
    updatedAt?: number;
    groupIcon: string;
    name?: string;
    archived?: boolean;
    mutedBy?: MutedBy[];
    backgroundColor?: string;
  }

  export interface ChatResponse {
    success: boolean;
    chat: Chat;
  }
}

export namespace ProfileDetailsSpace {
  export interface UserInfo {
    username: string;
    fullName: string;
    id: string;
    status: string;
    chats: {
      chatId: string;
      groupIcon: string;
      memberCount: number;
      name: string;
    }[];
    profilePicture: string;
    address: string;
  }

  export interface SharedGroupChats {
    chatId: string;
    groupIcon: string;
    memberCount: number;
    name: string;
  }
}

export namespace SearchScreenSpace {
  export interface User {
    username: string;
    fullName: string;
    displayName: string;
    status: string;
    id: string;
    profilePicture: string;
    address: string;
    chats: string[];
    lastActive: number;
    number: string;
  }
}

export namespace IndividualChatSpace {
  export interface ChatResponse {
    chat: Chat;
    message: string;
    status: number;
    success: boolean;
  }

  export interface Chat {
    archived: boolean;
    chatId: string;
    createdAt: string;
    lastMessage: string | null;
    name: string;
    pairId: string;
    participants: string[];
    type: 'individual' | 'group' | 'community';
    updatedAt: string;
  }
}

export namespace EditProfileSpace {
  export interface User {
    address: string;
    chats: {
      chatId: string;
      groupIcon: string;
      memberCount: number;
      name: string;
    }[];
    id: string;
    profilePicture: string;
    profileThumbnail: string;
    status: string;
    userBio: string;
    username: string;
    displayName: string;
    fullName: string;
  }

  export interface UserUpdateResponse {
    message: string;
    success: boolean;
    user: User;
  }
}

export namespace EditGroupSpace {
  export interface ChatDetails {
    archived: boolean;
    chatId: string;
    createdAt: string;
    description: string;
    groupIcon: string;
    lastMessage: string;
    messageCount: number;
    name: string;
    participants: string[];
    roles: Record<string, 'admin' | 'member'>;
    seenCount: Record<string, number>;
    type: 'group';
    updatedAt: {
      _nanoseconds: number;
      _seconds: number;
    };
  }

  export interface ChatResponse {
    chat: ChatDetails;
    message: string;
    success: boolean;
  }
}

export namespace ContactsScreenSpace {
  export interface Contact {
    recordID: string;
    givenName: string;
    middleName: string;
    familyName: string;
    company?: string | null;
    jobTitle: string;
    emailAddresses: {label: string; email: string}[];
    phoneNumbers: {label: string; number: string}[];
    postalAddresses: {
      street: string;
      city: string;
      state: string;
      region: string;
      postCode: string;
      country: string;
    }[];
    urlAddresses: {label: string; url: string}[];
    birthday?: {
      day: number;
      month: number;
      year: number;
    };
    imAddresses: {username: string; service: string}[];
    hasThumbnail: boolean;
    thumbnailPath: string;
    id?: string;
    profilePicture?: string;

    [key: string]: any;
  }

  export interface Section {
    title: string;
    data: Contact[];
  }

  export interface MatchedUser {
    address: string;
    fullName: string;
    id: string;
    phoneNumber: string;
    profilePicture: string;
    username: string;
  }

  export interface UsersResponse {
    matchedUsers: MatchedUser[];
    success: boolean;
  }

  export interface CombinedContact
    extends ContactsScreenSpace.Contact,
      ContactsScreenSpace.MatchedUser {
    recordID: string;
    givenName: string;
    middleName: string;
    familyName: string;
    company?: string | null;
    jobTitle: string;
    emailAddresses: {label: string; email: string}[];
    phoneNumbers: {label: string; number: string}[];
    postalAddresses: {
      street: string;
      city: string;
      state: string;
      region: string;
      postCode: string;
      country: string;
    }[];
    urlAddresses: {label: string; url: string}[];
    birthday?: {
      day: number;
      month: number;
      year: number;
    };
    imAddresses: {username: string; service: string}[];
    hasThumbnail: boolean;
    thumbnailPath: string;
    address: string;
    fullName: string;
    id: string;
    phoneNumber: string;
    profilePicture: string;
    username: string;

    [key: string]: any;
  }
}

export namespace PortfolioScreenSpace {
  export interface Token {
    token: string;
    symbol: string;
    balance: string;
    frequency: string;
    picture: string;
  }
}

export namespace CardSpace {
  export interface DeleteResponse {
    message: string;
    success: boolean;
  }

  export interface SeenDetails {
    [key: string]: {
      seenCount: number;
      timestamp: number;
    };
  }

  export interface MarkAsReadResponse {
    message: string;
    seenDetails: SeenDetails & {
      messageCount: number;
    };
    success: boolean;
  }
}

export interface RNFBModule {
  RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS: boolean;
}
