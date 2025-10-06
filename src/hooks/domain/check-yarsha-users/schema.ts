import {z} from 'zod';
import { RequestHeaderSchema } from '../request/schema';

const BodySchema = z.object({
  ContactList: z.array(z.string().min(10).max(15)),
});

const RequestSchema = z.object({
  RequestHeader: RequestHeaderSchema,
  Body: BodySchema,
});

export type TYarshaUserRequestType = z.infer<typeof RequestSchema>;

const ResponseHeaderSchema = z.object({
  Status: z.enum(["Success", "Failure"]),
  Message: z.string().min(1),
  TimeStamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid timestamp format",
  }),
  RequestId: z.string().min(1),
  ResponseTitle: z.string().min(1),
  ResponseDescription: z.string().min(1),
});

const MatchedUserSchema = z.object({
  Id: z.string().min(1),
  PhoneNumber: z.string().min(10).max(15),
  FullName: z.string().min(1),
  CountryCode: z.string().min(1),
  Number: z.string().min(10).max(15),
  DialCode: z.string().min(1),
  Address: z.string().min(1).optional(),
  Status: z.enum(["Active", "Inactive", "Blocked"]).optional(), 
  ProfilePicture: z.string().url().optional(),
  UserBio: z.string().optional(),
  Username: z.string().min(1),
  BackgroundColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, {
    message: "Invalid hex color code",
  }),
  CreatedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid timestamp format",
  }),
  UpdatedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid timestamp format",
  }),
});

const ResponseSchema = z.object({
  ResponseHeader: ResponseHeaderSchema,
  Response: z.object({
    MatchedUsers: z.array(MatchedUserSchema),
  }).optional(),
});

export type TYarshaUsersResponseType = z.infer<typeof ResponseSchema>;
