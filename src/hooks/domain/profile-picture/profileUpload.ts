import { api } from '@/services';
import { TProfilePictureRequest, TProfilePictureResponse } from './schema';
import { ENDPOINT_COLLECTIONS } from '@/config';

export const uploadProfilePictureApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadProfilePicture: builder.mutation<TProfilePictureResponse, { userId: string; file: FormData }>({
      query: ({ userId, file }) => {
        if (!(file instanceof FormData)) {
          throw new Error("File must be a FormData object.");
        }

        return {
          url: ENDPOINT_COLLECTIONS.UPLOAD_PROFILE_PICTURE_URL,
          method: 'POST',
          body: file,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        };
      },
    }),
  }),
  overrideExisting: true,
});

export const { useUploadProfilePictureMutation } = uploadProfilePictureApi;
