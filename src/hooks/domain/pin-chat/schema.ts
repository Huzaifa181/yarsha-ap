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

export const TogglePinChatRequestSchema = z.object({
  RequestHeader: RequestHeaderSchema,
  Body: z.object({
    ChatId: z.string().uuid(),
  }),
  AccessToken: z.string(),
});

export const TogglePinChatResponseSchema = z.object({
  ChatId: z.string().uuid(),
  pinStatus: z.string(),
});

export type TTogglePinChatRequest = z.infer<typeof TogglePinChatRequestSchema>;
export type TTogglePinChatResponse = z.infer<typeof TogglePinChatResponseSchema>;