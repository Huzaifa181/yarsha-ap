import { z } from 'zod';
import { RequestHeaderSchema } from '../request/schema';

export const RequestSchema = z.object({
  RequestHeader: RequestHeaderSchema,
  Body: z.object({
    page: z.string(),
    limit: z.string(),
  }),
  AccessToken: z.string(),
});

export type TGroupChatsRequest = z.infer<typeof RequestSchema>;

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
  Multimedia: z.any(),
  Transaction: z.any(),
});

export const GroupChatSchema = z.object({
  GroupId: z.string(),
  GroupName: z.string(),
  Type: z.enum(['individual', 'group', "community"]),
  GroupIcon: z.string().url(),
  ParticipantsId: z.array(z.string()),
  BackgroundColor: z.string(),
  IsIndividualBotChat: z.boolean(),
  isPinned: z.string(),
  isMuted: z.string(),
  LastMessage: MessageSchema,
  SeenDetails: z.array(z.object({
    ParticipantId: z.string(),
    SeenCount: z.number().int(),
    TimeStamp: z.string().datetime(),
  })),
  MessageCount: z.string(),
  UpdatedAt: z.string().datetime(),
});

export const GroupChatsSchema = z.array(GroupChatSchema);

export const ResponseBodySchema = GroupChatsSchema;

export const ResponseSchema = z.object({
  ResponseHeader: ResponseHeaderSchema,
  GroupChats: ResponseBodySchema,
  Pagination: z.object({
    TotalPages: z.number().int(),
    CurrentPage: z.number().int(),
  }),
});

export type TGroupChatsResponse = z.infer<typeof ResponseSchema>;

export const ChatDetailsRequestSchema = z.object({
  RequestHeader: z.object({
    RequestId: z.string(),
    Timestamp: z.string().datetime(),
  }),
  ChatId: z.string().uuid(),
  AccessToken: z.string(),
});

export type TChatRequestDetails = z.infer<typeof ChatDetailsRequestSchema>;

const ParticipantSchema = z.object({
  Id: z.string().uuid(),
  Username: z.string(),
  FullName: z.string(),
  ProfilePicture: z.string().url().or(z.literal('')),
  Role: z.enum(['member', 'creator']),
  BackgroundColor: z.string(),
  LastActive: z.string(),
  Address: z.string(),
  Status: z.enum(['online', 'offline']),
});

const ChatSchema = z.object({
  ParticipantsId: z.array(z.string().uuid()),
  ParticipantDetails: z.array(ParticipantSchema),
  GroupDescription: z.string().optional(),
  ChatId: z.string().uuid(),
  GroupName: z.string(),
  GroupIcon: z.string().url(),
  BackgroundColor: z.string(),
  Type: z.enum(['individual', 'group', "community"]),
  IsMuted: z.boolean(),
});

export const ChatDetailsResponseSchema = z.object({
  ResponseHeader: ResponseHeaderSchema,
  Chat: ChatSchema,
});

export type TChatDetailsResponse = z.infer<typeof ChatDetailsResponseSchema>;