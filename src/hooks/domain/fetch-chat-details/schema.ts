import {z} from 'zod';
import {RequestHeaderSchema} from '../request/schema';
import { group } from 'console';

export const RequestSchema = z.object({
  ChatId: z.string(),
});

export type TChatsRequest = z.infer<typeof RequestSchema>;

export const ResponseHeaderSchema = z.object({
  Status: z.string(),
  StatusCode: z.string(),
  Timestamp: z.string().datetime(),
  RequestId: z.string(),
  ResponseTitle: z.string(),
  ResponseDescription: z.string(),
});

export const MessageSchema = z.object({
  MessageId: z.string(),
  SenderId: z.string(),
  SenderName: z.string(),
  Text: z.string(),
  MessageType: z.enum(['text', 'image', 'video', 'file']),
  Timestamp: z.string().datetime(),
});

export const ParticipantDetailsSchema = z.array(
  z.object({
    id: z.string(),
    username: z.string(),
    profilePicture: z.string().url(),
    role: z.string(),
    backgroundColor: z.string(),
    fullName: z.string(),
    lastActive: z.string().datetime(),
    address: z.string(),
    status: z.enum(['online', 'offline']),
  }),
);

export const ChatSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  groupIcon: z.string().url(),
  groupDescription: z.string().optional(),
  participantsId: z.array(z.string()),
  participants: ParticipantDetailsSchema,
  type: z.enum(['individual', 'group', 'community']),
  backgroundColor: z.string(),
  isMuted: z.boolean(),
});

export const ResponseBodySchema = ChatSchema;

export type TChats = z.infer<typeof ChatSchema>;

export const ResponseSchema = z.object({
  ResponseHeader: ResponseHeaderSchema,
  Chat: ResponseBodySchema,
});

export type TChatsResponse = z.infer<typeof ResponseSchema>;
