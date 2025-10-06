import { z } from 'zod'
import { RequestHeaderSchema } from '../request/schema'
import { ResponseHeaderSchema } from '../response/schema'

export const RequestBodySchemaSearchUser = z.object({ SearchQuery: z.string() })

export const RequestSchemaSearchUser = z.object({
    RequestHeader: RequestHeaderSchema,
    Body: RequestBodySchemaSearchUser,
})

export type TSearchUserRequest = z.infer<typeof RequestSchemaSearchUser >;
export const responseObject = z.object({
    Id: z.string(),
    FullName: z.string(),
    ProfilePicture: z.string(),
    Username: z.string(),
    BackgroundColor: z.string(),
    LastSeen: z.string(),
})
export const ResponseBodySchemaSearchUser = z.array(responseObject)

export const ResponseSchemaSearchUser = z.object({
    ResponseHeader: ResponseHeaderSchema,
    Response: ResponseBodySchemaSearchUser
})

export type TSearchUserResponse = z.infer<typeof ResponseSchemaSearchUser>
export type TResponseSearchUsers = z.infer<typeof ResponseBodySchemaSearchUser>
export type TResponseSearchUser = z.infer<typeof responseObject>