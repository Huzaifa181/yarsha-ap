import { z } from 'zod';

export const ReactToMessageRequestSchema = z.object({
  chatId: z.string(),
  messageId: z.string(),
  token: z.string(),
  reaction: z.any(),
});

export type TReactToMessageRequest = z.infer<typeof ReactToMessageRequestSchema>;
