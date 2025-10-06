import { z } from 'zod';

export const GroupChatSchema = z.object({
    GroupIcon: z.string(),
    GroupName: z.string(), 
    GroupId: z.string(), 
    ParticipantsId: z.array(z.string()), 
    Type: z.string(), 
    BackgroundColor: z.string(), 
});

export const RequestBodySchema = z.object({
    GroupName: z.string(),
    ParticipantsId: z.array(z.string()),
    GroupIcon: z.string(),
    Token: z.string(),
});

export type TRequestBody = z.infer<typeof RequestBodySchema>;

export const RequestSchema = z.object({
    RequestHeader: z.object({
        RequestId: z.string(),
        DeviceId: z.string(),
        DeviceModel: z.string(),
        Timestamp: z.string().datetime(),
    }),
    Body: RequestBodySchema,
});

export type TGroupChatCreateRequest = z.infer<typeof RequestSchema>;

export const ResponseHeaderSchema = z.object({
    Status: z.string(),
    StatusCode: z.string(),
    TimeStamp: z.string().datetime(),
    RequestId: z.string(),
    ResponseTitle: z.string(),
    ResponseDescription: z.string(),
});

export const ResponseBodySchema = GroupChatSchema;

export const ResponseSchema = z.object({
    ResponseHeader: ResponseHeaderSchema,
    Response: ResponseBodySchema,
});

export type TGroupChatCreateResponse = z.infer<typeof ResponseSchema>;
