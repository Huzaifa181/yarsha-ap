import { z } from 'zod'

const ResponseHeaderSchema = z.object({
  Status: z.string(),
  StatusCode: z.string(),
  Timestamp: z.string().datetime(),
  RequestId: z.string(),
  ResponseTitle: z.string(),
  ResponseDescription: z.string(),
});

export { ResponseHeaderSchema }

export type TResponseHeader = z.infer<typeof ResponseHeaderSchema>