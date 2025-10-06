import { z } from 'zod';
import { RequestHeaderSchema } from '../request/schema';

export const FcmTokenSchema = z.object({
  DeviceId: z.string(),
  Model: z.string(),
  LastUpdated: z.number().optional(),
  Token: z.string(),
});

export const RequestBodySchema = z.object({
    SearchQuery: z.string(),
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

export type TSearchUserRequest = z.infer<typeof RequestSchema>;

export const ResponseHeaderSchema = z.object({
  Status: z.string(),
  StatusCode: z.string(),
  Message: z.string(),
  TimeStamp: z.string().datetime(),
  RequestId: z.string(),
  ResponseTitle: z.string(),
  ResponseDescription: z.string(),
});

export const ResponseBodySchema = z.array(
    z.object({
      Id: z.string(),
      FullName: z.string(),
      ProfilePicture: z.string().url(),
      Username: z.string(),
      BackgroundColor: z.string(),
      LastActive: z.string().datetime(),
      Status: z.string(),
      Address: z.string(),
    })
  );

export const ResponseSchema = z.object({
  ResponseHeader: ResponseHeaderSchema,
  Response: ResponseBodySchema,
});

export type TSearchUserResponse = z.infer<typeof ResponseSchema>;
