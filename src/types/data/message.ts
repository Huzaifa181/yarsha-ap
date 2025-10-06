export type MessageType = {
  _id: string;
  senderId: string;
  senderAddress: string;
  senderName: string;
  content: any;
  type:
    | 'text'
    | 'crypto'
    | 'other'
    | 'file'
    | 'transfer'
    | 'blink'
    | 'video'
    | 'transaction'
    | 'image'
    | 'gif'
    | 'blinkTransfered';
  timestamp: Date;
  signature?: string;
  publicKey: string;
  status: string;
  data?: any;
  multimedia?: any;
  transaction?: any;
  senderImage?: string;
  createdAt: string;
  senderFullName?: string;
  senderColor?: string;
  replyTo?: any;
  reactions?: any;
  messageId: string;
  serverId?: string;
  automated?:boolean;
  isPinned?:boolean;
  groupChatId?: string;
  preparedTransaction?: string;
};
