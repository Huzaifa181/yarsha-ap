import { z } from 'zod';
import { RequestHeaderSchema } from '../request/schema';

export const UploadRequestBodySchema = z.object({
  uploadId: z.string(),
  fileUri: z.string(),
  accessToken: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  chatId: z.string(),
  isLastChunk: z.boolean(),
  data: z.instanceof(Uint8Array),
});


export const UploadRequestSchema = z.object({
  Body: UploadRequestBodySchema,
  RequestHeader: RequestHeaderSchema,
  AccessToken: z.string(),
});

export type TUploadRequest = z.infer<typeof UploadRequestSchema>;

export const ResponseHeaderSchema = z.object({
  status: z.string(),
  statusCode: z.string(),
  timestamp: z.string(),
  requestId: z.string(),
  responseTitle: z.string(),
  responseDescription: z.string(),
});

export const ResponseBodySchema = z.object({
  filePath: z.string(),
  signedUrl: z.string(),
  expirationTime: z.string(),
  mimeType: z.string(),
});

export const UploadResponseSchema = z.object({
  Response: ResponseBodySchema.optional(),
  ResponseHeader: ResponseHeaderSchema.optional(),
});

export type TUploadResponse = z.infer<typeof UploadResponseSchema>;

export const GenerateUploadUrlRequestBodySchema = z.object({
  chatId: z.string(),
  fileName: z.string(),
  contentType: z.string(),
});

export const GenerateUploadUrlRequestSchema = z.object({
  RequestHeader: RequestHeaderSchema,
  Body: GenerateUploadUrlRequestBodySchema,
  AccessToken: z.string(),
});

export type TGenerateUploadUrlRequest = z.infer<typeof GenerateUploadUrlRequestSchema>;

export const GenerateUploadUrlResponseBodySchema = z.object({
  filePath: z.string(),
  uploadUrl: z.string(),
  readUrl: z.string(),
  expirationTime: z.string(),
  mimeType: z.string(),
});

export const GenerateUploadUrlResponseSchema = z.object({
  Response: GenerateUploadUrlResponseBodySchema.optional(),
  ResponseHeader: ResponseHeaderSchema.optional(),
});

export type TGenerateUploadUrlResponse = z.infer<typeof GenerateUploadUrlResponseSchema>;
