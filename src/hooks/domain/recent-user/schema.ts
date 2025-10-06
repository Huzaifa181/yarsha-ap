import {z} from 'zod';

export const FriendSchema = z.object({
  friendId: z.string(),
  fullName: z.string(),
  username: z.string(),
  profilePicture: z.string(),
  backgroundColor: z.string(),
  lastActive: z.string(),
  status: z.string(),
});

export type IFriend = z.infer<typeof FriendSchema>;

const chatSchema = z.object({
  ChatId: z.string().uuid(),
  GroupName: z.string(),
  GroupIcon: z.string().url(),
  Type: z.literal('group'),
  Description: z.string(),
  BackgroundColor: z.string(),
});

export type IChat = z.infer<typeof chatSchema>;


export interface ChatInformation {
  groupId: string;
  groupName: string;
  type: string;
  groupIcon: string;
  participants: string[];
  lastMessage: LastMessage;
  messageCount: number;
  seenDetails: SeenDetail[];
  backgroundColor: string;
  schemaVersion: number;
  createdAt: null;
  isPinned: string;
  pinnedAt: null;
  isMuted: string;
  isIndividualBotChat: boolean;
}

interface SeenDetail {
  participantId: string;
  seenCount: number;
  timeStamp: string;
}

interface LastMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  text: string;
  messageType: string;
  timestamp: string;
  schemaVersion: number;
  multimedia: any[];
  transaction: null;
}