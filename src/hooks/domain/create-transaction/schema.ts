import { z } from 'zod';
import { RequestHeaderSchema } from '../request/schema';

export const ReceiverInfoSchema = z.object({
  toWallet: z.string(),
  cluster: z.string(),
  signature: z.string(),
});

export const CreateTransactionRequestSchema = z.object({
  RequestHeader: RequestHeaderSchema,
  Body: ReceiverInfoSchema,
  AccessToken: z.string(), 
});

export const CreateTransactionResponseSchema = z.object({
  amount: z.string(),
  toWallet: z.string(),
  fromWallet: z.string(),
  signature: z.string(),
  transactionId: z.string(),
});

export type TCreateTransactionRequest = z.infer<typeof CreateTransactionRequestSchema>;
export type TCreateTransactionResponse = z.infer<typeof CreateTransactionResponseSchema>;
