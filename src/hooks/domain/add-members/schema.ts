import { z } from 'zod';

export const RequestBodySchema = z.object({
    GroupId: z.string(),
    ParticipantsId: z.array(z.string()),
})

export const requestSchema = z.object({
    RequestHeader: z.object({
        RequestId: z.string(),
        DeviceId: z.string(),
        DeviceModel: z.string(),
        Timestamp: z.string().datetime(),
    }),
    Body: RequestBodySchema
});

export type AMRequestSchema = z.infer<typeof requestSchema>

export const ParticipantDetail = z.object({
    Id: z.string(),
    FullName: z.string(),
    Username: z.string(),
    ProfilePicture: z.string(),
    Role: z.string(),
    BackgroundColor: z.string(),
    LastActive: z.string(),
    Status: z.string(),
})

export const Response = z.object({
    GroupId: z.string(),
    AddedParticipants: z.array(z.string()),
    ParticipantDetails: z.array(ParticipantDetail),
})

export const ResponseHeader = z.object({
    Status: z.string(),
    Message: z.string(),
    TimeStamp: z.string(),
    RequestId: z.string(),
    ResponseTitle: z.string(),
    ResponseDescription: z.string()
})

export const ResponseSchema = z.object({
    ResponseHeader: ResponseHeader,
    Response: Response,
})

export type AMResponse = z.infer<typeof ResponseSchema>