import {z} from 'zod';

const RequestHeaderSchema = z.object({
  RequestId: z.string(),
  DeviceId: z.string(),
  DeviceModel: z.string(),
  Timestamp: z.string().datetime(),
});

export {RequestHeaderSchema};

export type TRequestHeader = z.infer<typeof RequestHeaderSchema>;
