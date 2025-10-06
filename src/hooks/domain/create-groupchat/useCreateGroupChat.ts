import {api, getSocket} from '@/services';
import {TGroupChatCreateResponse, TRequestBody} from './schema';
import {GroupChatServiceClient} from '@/pb/groupchat.client';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {FetchBaseQueryError, QueryReturnValue} from '@reduxjs/toolkit/query';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {
  AddParticipantsRequestBody,
  AddParticipantsRequestWrapper,
  AddParticipantsResponseWrapper,
  GroupChatRequestWrapper,
} from '@/pb/groupchat';
import {InteractionManager} from 'react-native';
import ChatsRepository from '@/database/repositories/Chats.repository';
import {store} from '@/store';
import {clearUsers} from '@/store/slices';

const CreateGroupClient = new GroupChatServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const createGroupChatApi = api.injectEndpoints({
  endpoints: builder => ({
    createGroupChat: builder.mutation<TGroupChatCreateResponse, TRequestBody>({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<
        QueryReturnValue<TGroupChatCreateResponse, FetchBaseQueryError>
      > {
        try {
          const requestHeader = await generateRequestHeader();
          const groupChatCreateResponse = await CreateGroupClient.createGroup(
            GroupChatRequestWrapper.create({
              body: {
                groupName: data.GroupName,
                groupIcon: data.GroupIcon,
                participantsId: data.ParticipantsId,
              },
              requestHeader: {
                deviceId: requestHeader.DeviceId,
                deviceModel: requestHeader.DeviceModel,
                requestId: requestHeader.RequestId,
                timestamp: requestHeader.Timestamp,
              },
            }),
            {
              meta: {
                Authorization: `Bearer ${data.Token}`,
              },
            },
          ).response;

          const transformedResponse: TGroupChatCreateResponse = {
            ResponseHeader: {
              Status: String(
                groupChatCreateResponse.responseHeader?.status || '',
              ),
              StatusCode:
                groupChatCreateResponse.responseHeader?.statusCode || '',
              TimeStamp:
                groupChatCreateResponse.responseHeader?.timestamp || '',
              RequestId:
                groupChatCreateResponse.responseHeader?.requestId || '',
              ResponseTitle:
                groupChatCreateResponse.responseHeader?.responseTitle || '',
              ResponseDescription:
                groupChatCreateResponse.responseHeader?.responseDescription ||
                '',
            },
            Response: {
              BackgroundColor:
                groupChatCreateResponse.response?.backgroundColor || '',
              GroupIcon: groupChatCreateResponse.response?.groupIcon || '',
              GroupId: groupChatCreateResponse.response?.groupId || '',
              GroupName: groupChatCreateResponse.response?.groupName || '',
              ParticipantsId:
                groupChatCreateResponse.response?.participantsId || [],
              Type: groupChatCreateResponse.response?.type || '',
            },
          };

          console.log('transformedResponse', transformedResponse);

          const socket = getSocket();
          if (socket) {
            socket.emit(
              'joinRoom',
              JSON.stringify({chatId: transformedResponse.Response.GroupId}),
            );
            console.log(
              'Joined room for this :',
              transformedResponse.Response.GroupId,
            );
          } else {
            console.warn('Socket not initialized when emitting event.');
          }

          InteractionManager.runAfterInteractions(async () => {
            try {
              const realm = ChatsRepository.getRealmInstance();

              let lastMessageRealmObject;

              realm.write(() => {
                console.log('✅ Creating lastMessage object in Realm...');

                lastMessageRealmObject = realm.create('LastMessageModel', {
                  messageId: '',
                  senderId: '',
                  senderName: '',
                  text: '',
                  messageType: 'text',
                  timestamp: new Date().toISOString(),
                });

                console.log('✅ Successfully created lastMessage object.');
              });

              console.log('🔹 Now saving the chat...');

              ChatsRepository.createOrUpdateGroupChat({
                groupId: transformedResponse.Response.GroupId,
                groupName: transformedResponse.Response.GroupName,
                type: transformedResponse.Response.Type,
                groupIcon: transformedResponse.Response.GroupIcon,
                participants: transformedResponse.Response
                  .ParticipantsId as unknown as Realm.List<string>,
                backgroundColor: transformedResponse.Response.BackgroundColor,
                lastMessage: lastMessageRealmObject,
              });

              console.log('✅ Group chat saved in Realm.');
            } catch (error) {
              console.error('❌ Error inserting group chats:', error);
            }
          });

          store.dispatch(clearUsers());
          return {data: transformedResponse};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to create group chat',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),

    addMembersInGroupChat: builder.mutation<
      AddParticipantsResponseWrapper,
      AddParticipantsRequestBody
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<
        QueryReturnValue<AddParticipantsResponseWrapper, FetchBaseQueryError>
      > {
        try {
          const token = store.getState().accessToken.authToken;
          const requestHeader = await generateRequestHeader();
          const addParticipantsResponse =
            await CreateGroupClient.addParticipants(
              AddParticipantsRequestWrapper.create({
                body: {
                  groupId: data.groupId,
                  participantsId: data.participantsId,
                },
                requestHeader: {
                  deviceId: requestHeader.DeviceId,
                  deviceModel: requestHeader.DeviceModel,
                  requestId: requestHeader.RequestId,
                  timestamp: requestHeader.Timestamp,
                },
              }),
              {
                meta: {
                  Authorization: `Bearer ${token}`,
                },
              },
            ).response;

          return {data: addParticipantsResponse};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to add participants to group chat',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),
  }),
  overrideExisting: true,
});

export const {useCreateGroupChatMutation, useAddMembersInGroupChatMutation} =
  createGroupChatApi;
