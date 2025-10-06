import { api } from "@/services";

export const extendedApi = api.injectEndpoints({
    endpoints: (builder) => ({
        uploadProfilePicture: builder.mutation<{ message: string }, { file: File; userId: string }>({
            query: ({ file, userId }) => {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("userId", userId);

                return {
                    url: "/users/profile-picture",
                    method: "POST",
                    body: formData,
                };
            },
        }),
    }),
});

export const { useUploadProfilePictureMutation } = extendedApi;
