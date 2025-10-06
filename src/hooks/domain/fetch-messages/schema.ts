import {z} from 'zod';
import {RequestHeaderSchema} from '../request/schema';

export const BodySchema = z.object({
  chatId: z.string(),
  timestamp: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  direction: z.enum(['before', 'after']).optional(),
});

export const RequestSchema = z.object({
  RequestHeader: RequestHeaderSchema,
  Body: BodySchema,
  AccessToken: z.string(),
});

export type TMessageRequest = z.infer<typeof RequestSchema>;

export const ResponseHeaderSchema = z.object({
  Status: z.string(),
  StatusCode: z.string(),
  Timestamp: z.string().datetime(),
  RequestId: z.string(),
  ResponseTitle: z.string(),
  ResponseDescription: z.string(),
});

export const MessageSchema = z.object({
  _id: z.string(),
  chatId: z.string(),
  senderId: z.string(),
  messageId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  automated: z.boolean(),
});

export const MessagesSchema = z.array(MessageSchema);

export const ResponseBodySchema = MessagesSchema;

export const ResponseSchema = z.object({
  ResponseHeader: ResponseHeaderSchema,
  messages: MessagesSchema,
  pinnedMessages: MessagesSchema,
});

export type TMessageResponse = z.infer<typeof ResponseSchema>;
