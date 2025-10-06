import { z } from 'zod';
import { RequestHeaderSchema } from '../request/schema';

export const RequestBodySchema = z.object({
  UserId: z.string(),
});

export const RequestSchema = z.object({
  RequestHeader: RequestHeaderSchema,
  Body: RequestBodySchema,
});

export type TOtpRequest = z.infer<typeof RequestSchema>;

export const ResponseHeaderSchema = z.object({
  Status: z.string(),
  StatusCode: z.string(),
  Timestamp: z.string().datetime(),
  RequestId: z.string(),
  ResponseTitle: z.string(),
  ResponseDescription: z.string(),
});

export const UserSchema = z.object({
  Id: z.string(),
  PhoneNumber: z.string(),
  FullName: z.string(),
  CountryCode: z.string(),
  Number: z.string(),
  DialCode: z.string(),
  Address: z.string(),
  Status: z.string(),
  ProfilePicture: z.string().url(),
  UserBio: z.string(),
  Username: z.string(),
  BackgroundColor: z.string(),
  LastActive: z.string().datetime(),
  CreatedAt: z.string().datetime(),
  UpdatedAt: z.string().datetime(),
});

export const ResponseBodySchema = UserSchema;


export const ResponseSchema = z.object({
  ResponseHeader: ResponseHeaderSchema,
  Response: ResponseBodySchema,
});

export type TOtpResponse = z.infer<typeof ResponseSchema>;
