import {z} from 'zod';
import {RequestHeaderSchema} from '../request/schema';
import { ResponseHeaderSchema } from '../response/schema';

export const RequestBodySchema = z.object({PhoneNumber: z.string()});

export const RequestSchema = z.object({
  RequestHeader: RequestHeaderSchema,
  Body: RequestBodySchema,
});

export type TOtpRequest = z.infer<typeof RequestSchema>;


export const ResoponseBodySchema = z.object({
  PhoneNumber: z.string(),
  Message: z.string(),
});

export const ResponseSchema = z.object({
  ResponseHeader: ResponseHeaderSchema,
  Response: ResoponseBodySchema,
});

export type TOtpResponse = z.infer<typeof ResponseSchema>;
