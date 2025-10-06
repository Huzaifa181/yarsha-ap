import { z } from 'zod';


export const RequestBodySchema = z.object({
    userID: z.string(),
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

export type TProfilePictureRequest = {
    userId: string;
    file: {
      uri: string;
      type: string;
      name: string;
    };
  };
  
export const ResponseHeaderSchema = z.object({
    Status: z.string(),
    StatusCode: z.string(),
    Message: z.string(),
    TimeStamp: z.string().datetime(),
    RequestId: z.string(),
    ResponseTitle: z.string(),
    ResponseDescription: z.string(),
});

export const ResponseBodySchema = z.object({
    url: z.string(),
});;

export const ResponseSchema = z.object({
    ResponseHeader: ResponseHeaderSchema,
    Response: ResponseBodySchema,
});

export type TProfilePictureResponse = z.infer<typeof ResponseBodySchema>;
