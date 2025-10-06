import { z } from 'zod'
import { RequestHeaderSchema } from '../request/schema'
import { ResponseHeaderSchema } from '../response/schema'

export const RequestBodySchemaGetUser = z.object({ UserId: z.string() })

export const RequestSchemaGetUser = z.object({
    RequestHeader: RequestHeaderSchema,
    Body: RequestBodySchemaGetUser,
})

export type TGetUserRequest = z.infer<typeof RequestSchemaGetUser> 

export const ResponseBodySchemaGetUser = z.object({
    Id: z.string(),
    PhoneNumber: z.string(),
    FullName: z.string(),
    CountryCode: z.string(),
    Number: z.string(),
    DialCode: z.string(),
    Address: z.string(),
    Status: z.string(),
    ProfilePicture: z.string(),
    UserBio: z.string(),
    Username: z.string(),
    BackgroundColor: z.string(),
    CreatedAt: z.string(),
    UpdatedAt: z.string(),
})


export const ResponseSchemaGetUser = z.object({
    ResponseHeader: ResponseHeaderSchema,
    Response: ResponseBodySchemaGetUser,
})

export type TGetUserResponse = z.infer<typeof ResponseSchemaGetUser>
export type TResponseGetUser = z.infer<typeof ResponseBodySchemaGetUser>