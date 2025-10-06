import { z } from 'zod';
import { RequestHeaderSchema } from '../request/schema';

export const ToggleMuteChatRequestSchema = z.object({
  RequestHeader: RequestHeaderSchema,
  Body: z.object({
    ChatId: z.string().uuid(),
  }),
  AccessToken: z.string(),
});

export type TToggleMuteChatRequest = z.infer<typeof ToggleMuteChatRequestSchema>;

export const ToggleMuteChatResponseSchema = z.object({
  ChatId: z.string().uuid(),
  muteStatus: z.boolean(),
});

export type TToggleMuteChatResponse = z.infer<typeof ToggleMuteChatResponseSchema>;