import {ReactNode} from 'react';

export interface MessageData {
  actionUrl?: string;
  blinkName?: string;
  blinkTitle?: string;
  blinkId?: string;
  senderAddress?: string;
  senderId?: string;
  senderName?: string;
  buyerId?: string;
  buyerName?: string;
  transactionId?: string;
  amount?: number;
  token?: string;
  receiverId?: string;
  receiverName?: string;
  receiverAddress?: string;
}

export interface ReactionPayload {
  reaction: string;
  reactorId: string;
  reactorName: string;
  timestamp: string;
}

export interface MessageMultimedia {
  name: string;
  filePath: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  isLoading: boolean;
  localUri: string;
  retryStatus: 'uploading' | 'failed' | 'success';
  uploadStage: 'initial' | 'generateUrl' | 'uploading' | 'completed';
  signedUrl?: string;
  expirationTime?: string;
  filePathServer?: string;
  thumbnailUri?: string | null;
}

export interface MessageTransaction {
  amount: string;
  fromWallet: string;
  senderId: string;
  signature: string;
  timestamp: string;
  toWallet: string;
  transactionId: string;
}

export interface ReplyTo {
  replyToId: string;
  replyToSenderName: string;
  replyToContent: string;
}

export interface MessageType {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status: 'pending' | 'sent' | 'uploading' | 'syncing';
  automated: boolean;
  type?:
    | 'text'
    | 'image'
    | 'video'
    | 'file'
    | 'blink'
    | 'transaction'
    | 'blinkTransfered';
  multimedia?: MessageMultimedia[];
  transaction?: MessageTransaction;
  data?: MessageData;
  serverId?: string;
  messageId?: string;
  senderName?: string;
  senderFullName?: string;
  senderImage?: string;
  isPinned?: boolean;
  reactions?: ReactionPayload[];
  replyTo?: ReplyTo;
  preparedTransaction?: string;
}

export interface SentToSliderProps {
  solAmount: string;
  recipientAddress: string;
  recipientName: string;
  receiverId: string;
}

export interface MessageItemProps {
  messageType?: string;
  item: MessageType;
  index: number;
  messages: MessageType[];
  chatId: string;
  openSentToSlider: (props: SentToSliderProps) => void;
  handleSendMessage?: (payload?: {
    content: any;
    messageType?:
      | 'text'
      | 'crypto'
      | 'other'
      | 'file'
      | 'transfer'
      | 'blink'
      | 'transaction'
      | 'blinkTransfered'
      | 'image';
    data?: any;
  }) => Promise<any>;
  onReplyMessage?: (message: MessageType) => void;
  simultaneousHandlers: any;
  isNewMessage?: boolean;
  botId?: string;
  senderUser?: {
    id?: string;
    Address?: string;
    FullName?: string;
    ProfilePicture?: string;
    BackgroundColor?: string;
  };
  latestUser?: {
    id: string;
    privateKey?: string;
    address?: string;
    fullName?: string;
  };
  direction: 'sent' | 'received';
  isSameSenderAsPrevious: boolean;
  isSameSenderAsNext: boolean;
  messageTime: string;
  colors: any;
  token: string;
}

export interface ImageGridProps {
  images: string[];
  thumbnails: string[];
  openImageModal: (images: string[], index: number) => void;
  direction: string;
  isLoading: boolean;
  metadata: any[];
  messageTime: string;
  retryUpload: (media: any, index: number) => void;
}

export interface VideoGridProps {
  videos: string[];
  thumbnails: string[];
  openVideoModal: (
    videos: string[],
    thumbnails: string[],
    index: number,
  ) => void;
  direction: string;
  metadata: any[];
  isLoading: boolean;
  messageTime: string;
}

export interface DocumentListProps {
  documents: string[];
  openDocument: (uri: string) => void;
  metadata: any[];
  direction: string;
  isLoading: boolean;
}

export interface ImageModalProps {
  isVisible: boolean;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  handleNextImage: () => void;
  handlePrevImage: () => void;
}

export interface VideoModalProps {
  isVisible: boolean;
  videos: string[];
  currentIndex: number;
  onClose: () => void;
}

export interface EmojiModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export interface ReplyMessageProps {
  replyTo?: ReplyTo;
  colors: any;
}

export interface AutomatedMessageProps {
  content: string;
}
