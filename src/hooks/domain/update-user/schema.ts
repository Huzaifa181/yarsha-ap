import { z } from 'zod';

export const UserSchema = z.object({
  FullName: z.string(),
  CountryCode: z.string(),
  Number: z.string(),
  DialCode: z.string(),
  Status: z.string(),
  ProfilePicture: z.string().url(),
  UserBio: z.string(),
  Username: z.string(),
  Address: z.string(),
  Id: z.string(),
  PhoneNumber: z.string(),
  BackgroundColor: z.string(),
  LastActive: z.string(),
  CreatedAt: z.string().datetime(),
  UpdatedAt: z.string().datetime(),
});

export const FcmTokenSchema = z.object({
  DeviceId: z.string(),
  Model: z.string(),
  LastUpdated: z.number().optional(),
  Token: z.string(),
});

export const UserUpdateSchema = z.object({
  FullName: z.string().optional(),
  UserName: z.string().optional(),
  ProfilePicture: z.string().url().optional(),
  UserBio: z.string().optional(),
  CountryCode: z.string().optional(),
  Number: z.string().optional(),
})

export const RequestBodySchema = z.object({
  FcmToken: FcmTokenSchema.optional(),
  User: UserUpdateSchema.optional(),
});

export const RequestSchema = z.object({
  RequestHeader: z.object({
    RequestId: z.string(),
    DeviceId: z.string(),
    DeviceModel: z.string(),
    Timestamp: z.string().datetime(),
  }),
  Body: RequestBodySchema,
  AccessToken: z.string(),
});

export type TOtpRequest = z.infer<typeof RequestSchema>;

export const ResponseHeaderSchema = z.object({
  Status: z.string(),
  StatusCode: z.string(),
  Message: z.string(),
  TimeStamp: z.string().datetime(),
  RequestId: z.string(),
  ResponseTitle: z.string(),
  ResponseDescription: z.string(),
});

export const ResponseBodySchema = UserSchema;

export const ResponseSchema = z.object({
  ResponseHeader: ResponseHeaderSchema,
  Response: ResponseBodySchema,
});

export type TOtpResponse = z.infer<typeof ResponseSchema>;
