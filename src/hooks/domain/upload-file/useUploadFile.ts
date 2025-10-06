import { api } from '@/services';
import { UploadServiceClient } from '@/pb/upload.client';
import { RNGrpcTransport } from '@/services/grpcService/RPCTransport';
import { QueryReturnValue, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { UserGRPClient } from '@/services/grpcService/grpcClient';
import { TGenerateUploadUrlResponse, TUploadRequest, TUploadResponse } from './schema';
import { DownloadFileRequest, GenerateUploadUrlRequest, GenerateUploadUrlResponse, UploadFileChunkResponse } from '@/pb/upload';
import { generateRequestHeader } from '@/utils/requestHeaderGenerator';

const UploadClient = new UploadServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const uploadApi = api.injectEndpoints({
  endpoints: builder => ({
    uploadFile: builder.mutation<TUploadResponse, TUploadRequest>({
      // @ts-ignore

      async queryFn(data): Promise<QueryReturnValue<TUploadResponse, FetchBaseQueryError>> {
        try {
          const { fileUri, chatId, accessToken, uploadId } = data.Body;
          const fileName = fileUri.split('/').pop() || 'file';
          const contentType = fileUri.endsWith('.jpg') || fileUri.endsWith('.jpeg')
            ? 'image/jpeg'
            : fileUri.endsWith('.png')
              ? 'image/png'
              : fileUri.endsWith('.mp4')
                ? 'video/mp4'
                : 'application/octet-stream';

          const fileData = await fetch(fileUri);
          const fileBuffer = await fileData.arrayBuffer();
          const buffer = new Uint8Array(fileBuffer);
          let chunkSize: number;

          if (buffer.length < 1 * 1024 * 1024) {
            chunkSize = 64 * 1024;
          } else if (buffer.length < 5 * 1024 * 1024) {
            chunkSize = 128 * 1024;
          } else if (buffer.length < 100 * 1024 * 1024) {
            chunkSize = 512 * 1024;
          } else if (buffer.length < 500 * 1024 * 1024) {
            chunkSize = 2 * 1024 * 1024;
          } else {
            chunkSize = 4 * 1024 * 1024;
          }
          const totalChunks = Math.ceil(buffer.length / chunkSize);
          let lastResponse: UploadFileChunkResponse | null = null;
          for (let offset = 0; offset < buffer.length; offset += chunkSize) {
            const isLastChunk = offset + chunkSize >= buffer.length;

            const chunkRequest = {
              uploadId,
              fileName,
              contentType,
              chatId,
              isLastChunk,
              data: buffer.slice(offset, offset + chunkSize),
            };

            const response = await UploadClient.uploadFileChunked(chunkRequest, {
              meta: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            lastResponse = response.response;
          }

          if (!lastResponse) {
            throw new Error('No upload response received');
          }

          const plainResponse: TUploadResponse = {
            Response: {
              filePath: lastResponse.response?.filePath || '',
              signedUrl: lastResponse.response?.readUrl || '',
              expirationTime: lastResponse.response?.expirationTime || '',
              mimeType: lastResponse.response?.mimeType || '',
            },
            ResponseHeader: {
              status: lastResponse.responseHeader?.status || '',
              statusCode: lastResponse.responseHeader?.statusCode || '',
              timestamp: lastResponse.responseHeader?.timestamp || '',
              requestId: lastResponse.responseHeader?.requestId || '',
              responseTitle: lastResponse.responseHeader?.responseTitle || '',
              responseDescription: lastResponse.responseHeader?.responseDescription || '',
            },
          };

          return { data: plainResponse };
        } catch (err) {
          console.error('Upload failed:', err);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'UPLOAD_FAILED',
              data: { message: (err as Error).message },
            } as FetchBaseQueryError,
          };
        }
      },
    }),
    generateUploadUrl: builder.mutation<
      TGenerateUploadUrlResponse,
      { chatId: string; fileName: string; contentType: string; accessToken: string }
    >({
      async queryFn({ chatId, fileName, contentType, accessToken }) {
        try {
          const requestHeader = await generateRequestHeader();

          const request: GenerateUploadUrlRequest = {
            body: {
              chatId,
              fileName,
              contentType,
            },
            requestHeader:{
              action: "",
              appVersion:"",
              channel:"",
              clientIp:"",
              deviceId: requestHeader.DeviceId,
              deviceModel: requestHeader.DeviceModel,
              deviceType:"",
              languageCode:"",
              requestId: requestHeader.RequestId,
              timestamp: requestHeader.Timestamp
            }
          };
          console.log("accessToken", accessToken)
          console.log("body", {
            chatId,
            fileName,
            contentType,
          })
          const response = await UploadClient.generateUploadUrl(request, {
            meta: { Authorization: `Bearer ${accessToken}` },
          });
          console.log("response of generating url", response)
          const grpcResp = response.response;

          const plainResponse: TGenerateUploadUrlResponse = {
            Response: {
              filePath: grpcResp?.response?.filePath || '',
              uploadUrl: grpcResp?.response?.uploadUrl || '',
              readUrl: grpcResp?.response?.readUrl || '',
              expirationTime: grpcResp?.response?.expirationTime || '',
              mimeType: grpcResp?.response?.mimeType || '',
            },
            ResponseHeader: {
              status: grpcResp?.responseHeader?.status || '',
              statusCode: grpcResp?.responseHeader?.statusCode || '',
              timestamp: grpcResp?.responseHeader?.timestamp || '',
              requestId: grpcResp?.responseHeader?.requestId || '',
              responseTitle: grpcResp?.responseHeader?.responseTitle || '',
              responseDescription: grpcResp?.responseHeader?.responseDescription || '',
            },
          };

          return { data: plainResponse };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'GENERATE_UPLOAD_URL_FAILED',
              data: { message: (err as Error).message },
            } as FetchBaseQueryError,
          };
        }
      },
    }),


    getFileUrl: builder.query<any, { fileId: string; accessToken: string }>({
      async queryFn({ fileId, accessToken }) {
        try {
          console.log("getFileUrl")
          const request = DownloadFileRequest.create({
            body: {
              filePath: fileId,
            },
          });
          const response = await UploadClient.getFileUrl(request, {
            meta: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          console.log("getFileUrl 1", response)
          return { data: response.response.response };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'GET_FILE_URL_FAILED',
              data: { message: (err as Error).message },
            } as FetchBaseQueryError,
          };
        }
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useUploadFileMutation,
  useLazyGetFileUrlQuery,
  useGenerateUploadUrlMutation
} = uploadApi;