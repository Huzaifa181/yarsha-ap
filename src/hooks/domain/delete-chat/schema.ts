import { z } from 'zod';
import { RequestHeaderSchema } from '../request/schema';

export const ResponseHeaderSchema = z.object({
    Status: z.string(),
    StatusCode: z.string(),
    Timestamp: z.string().datetime(),
    RequestId: z.string(),
    ResponseTitle: z.string(),
    ResponseDescription: z.string(),
});

export const DeleteChatRequestSchema = z.object({
    RequestHeader: RequestHeaderSchema,
    Body: z.object({
        ChatId: z.string().uuid(),
    }),
    AccessToken: z.string(),
});

export type TDeleteChatRequest = z.infer<typeof DeleteChatRequestSchema>;

export const DeleteChatResponseSchema = z.object({
    ChatId: z.string().uuid(),
    isDeleted: z.boolean(),
});

export const DeleteChatResponseWrapperSchema = z.object({
    ResponseHeader: ResponseHeaderSchema,
    Response: DeleteChatResponseSchema,
});

export type TDeleteChatResponse = z.infer<typeof DeleteChatResponseSchema>;
