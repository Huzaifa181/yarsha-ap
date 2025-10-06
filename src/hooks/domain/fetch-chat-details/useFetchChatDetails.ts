import {api} from '@/services';
import {TChatsRequest, TChats} from './schema';
import GroupChatRepository from '@/database/repositories/GroupChat.repository';
import {FetchBaseQueryError, QueryReturnValue} from '@reduxjs/toolkit/query';
import {ParticipantDetailsModel} from '@/database';

export const fetchGroupChatDetailApi = api.injectEndpoints({
  endpoints: builder => ({
    fetchGroupChatDetail: builder.query<TChats | null, TChatsRequest>({
      providesTags: ['GroupChatDetail'],
      // @ts-ignore
      queryFn: async (
        data: TChatsRequest,
      ): Promise<QueryReturnValue<TChats, FetchBaseQueryError>> => {
        try {
          const groupChat = await GroupChatRepository.getGroupChatById(data.ChatId);
          if (!groupChat) {
            return {
              error: {
                status: 404,
                data: `Group chat [${data.ChatId}] not found.`,
              },
            };
          }
          return {
            data: {
              groupId: groupChat.ChatId,
              groupName: groupChat.GroupName,
              groupIcon: groupChat.GroupIcon || '',
              groupDescription: groupChat.GroupDescription || '',
              backgroundColor: groupChat.BackgroundColor,
              isMuted: groupChat.IsMuted,
              type: groupChat.Type,
              participants: groupChat.Participants.map(participant => ({
                id: participant.Id,
                username: participant.Username,
                fullName: participant.FullName,
                profilePicture: participant.ProfilePicture || '',
                role: participant.Role,
                backgroundColor: participant.BackgroundColor,
                lastActive: participant.LastActive,
                address: participant.Address,
                status: participant.Status,
              })),
              participantsId: groupChat.ParticipantsId.map(id => id.toString()),
            },
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch group chats detail',
              error: 'RPC Error',
              data: {
                message: 'Unable to fetch the details from local database',
              },
            } as FetchBaseQueryError,
          };
        }
      },
    }),

    /**
     * Fetch Participant by Participant ID
     */
    fetchParticipantById: builder.query<ParticipantDetailsModel | null, string>(
      {
        // @ts-ignore
        queryFn: async (
          participantId: string,
        ): Promise<
          QueryReturnValue<ParticipantDetailsModel | null, FetchBaseQueryError>
        > => {
          try {
            const participant =
              await GroupChatRepository.getParticipantById(participantId);
            if (!participant) {
              return {
                error: {
                  status: 404,
                  data: `Participant [${participantId}] not found.`,
                },
              };
            }
            return {data: participant};
          } catch (error) {
            return {
              error: {
                status: 'CUSTOM_ERROR',
                statusText: 'Failed to fetch participant details',
                error: 'RPC Error',
                data: {
                  message:
                    'Unable to fetch the participant details from local database',
                },
              } as FetchBaseQueryError,
            };
          }
        },
      },
    ),
  }),
  overrideExisting: true,
});

export const {useFetchGroupChatDetailQuery, useFetchParticipantByIdQuery, useLazyFetchGroupChatDetailQuery} =
  fetchGroupChatDetailApi;
