import { z } from 'zod';

export const IndividualChatSchema = z.object({
    GroupIcon: z.string(),
    GroupName: z.string(),
    BackgroundColor: z.string(),
    GroupId: z.string(),
    Type: z.string(),
    ParticipantsId: z.array(z.string()), 
});

export const RequestBodySchema = z.object({
    PeerId: z.string(),
});

export const RequestSchema = z.object({
    RequestHeader: z.object({
        RequestId: z.string(),
        DeviceId: z.string(),
        DeviceModel: z.string(),
        Timestamp: z.string().datetime(),
    }),
    Body: RequestBodySchema,
});

export type TOtpRequest = z.infer<typeof RequestSchema>;

export const ResponseHeaderSchema = z.object({
    Status: z.number(),
    StatusCode: z.string(),
    Message: z.string(),
    TimeStamp: z.string().datetime(),
    RequestId: z.string(),
    ResponseTitle: z.string(),
    ResponseDescription: z.string(),
});

export const ResponseBodySchema = IndividualChatSchema;

export const ResponseSchema = z.object({
    ResponseHeader: ResponseHeaderSchema,
    Response: ResponseBodySchema,
});

export type TOtpResponse = z.infer<typeof ResponseSchema>;
