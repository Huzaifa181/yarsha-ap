import { z } from 'zod';

export const PinMessageRequestSchema = z.object({
  chatId: z.string(),
  messageId: z.string(),
  token: z.string(),
});

export type TPinMessageRequest = z.infer<typeof PinMessageRequestSchema>;
