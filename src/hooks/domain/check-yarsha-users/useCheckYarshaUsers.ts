import YarshaContactsRepository from '@/database/repositories/YarshaContacts.Repository';
import {CheckYarshaUserRequest, CheckYarshaUserResponse} from '@/pb/users';
import {UserServiceClient} from '@/pb/users.client';
import {api} from '@/services';
import {RNGrpcTransport} from '@/services/grpcService/RPCTransport';
import {UserGRPClient} from '@/services/grpcService/grpcClient';
import {store} from '@/store';
import {syncUsersWithDatabase} from '@/utils';
import Contacts from '@/utils/contactsAdapter';
import {FetchBaseQueryError, QueryReturnValue} from '@reduxjs/toolkit/query';

const CheckYarshaUserClient = new UserServiceClient(
  new RNGrpcTransport(UserGRPClient),
);

export const checkYarshaUsersApi = api.injectEndpoints({
  endpoints: builder => ({
    checkYarshaUsers: builder.mutation<
      CheckYarshaUserResponse,
      CheckYarshaUserRequest
    >({
      // @ts-ignore
      async queryFn(
        data,
      ): Promise<
        QueryReturnValue<CheckYarshaUserResponse, FetchBaseQueryError>
      > {
        try {
          const token = store.getState().accessToken?.authToken;
          if (!token) {
            throw new Error('Missing authentication token');
          }

          const response = await CheckYarshaUserClient.checkYarshaUser(
            CheckYarshaUserRequest.create({
              body: data.body,
              requestHeader: data.requestHeader,
            }),
            {
              meta: {Authorization: `Bearer ${token}`},
            },
          ).response;

          if (response && response.response?.matchedUsers) {
            await syncUsersWithDatabase(response.response.matchedUsers);
          }

          console.log('response of yarsha users', response);
          return {data: response || []};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch the Yarsha users',
              error: 'RPC Error',
              data: {message: 'Unable to connect to RPC Server'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),

    fetchYarshaContacts: builder.query({
      queryFn: async () => {
        try {
          const contacts = await YarshaContactsRepository.getAllContacts();
          const plainContacts = contacts.map(contact =>
            JSON.parse(JSON.stringify(contact)),
          );
          return {data: plainContacts};
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch Yarsha contacts from local database',
              error: 'Database Error',
              data: {message: 'Unable to retrieve contacts from Realm'},
            } as FetchBaseQueryError,
          };
        }
      },
    }),

    fetchDeviceContacts: builder.query({
        queryFn: async (_arg, _queryApi, _extraOptions, baseFetch) => {
        try {
          const {shouldFetch} = _arg as {shouldFetch: boolean};

          if (!shouldFetch) {
            return {
              error: {
                status: 'PERMISSION_BLOCKED',
                statusText: 'Permission check blocked query execution',
                error: 'Permission Error',
                data: {
                  message: 'Skipped fetching contacts due to lack of permission.',
                },
              } as unknown as FetchBaseQueryError,
            };
          }
          if (Contacts) {
            const contactsList = await Contacts.getAll();
            const formattedContacts = contactsList.map((contact: any) => ({
              recordID: contact.recordID || '',
              givenName: contact.givenName || '',
              middleName: contact.middleName || '',
              familyName: contact.familyName || '',
              displayName: contact.displayName || '',
              jobTitle: contact.jobTitle || '',
              company: contact.company || '',
              hasThumbnail: !!contact.thumbnailPath,
              thumbnailPath: contact.thumbnailPath || '',
              postalAddresses:
                contact.postalAddresses?.map((address: any) => ({
                  street: address.street || '',
                  city: address.city || '',
                  country: address.country || '',
                  region: address.region || '',
                  postCode: address.postCode || '',
                  label: address.label || '',
                  state: address.state || '',
                })) || [],
              emailAddresses:
                contact.emailAddresses?.map((email: any) => ({
                  email: email.email || '',
                  label: email.label || '',
                })) || [],
              phoneNumbers:
                contact.phoneNumbers?.map((phone: any) => ({
                  number: phone.number || '',
                  label: phone.label || '',
                })) || [],
              urlAddresses:
                contact.urlAddresses?.map((url: any) => ({
                  url: url.url || '',
                  label: url.label || '',
                })) || [],
              birthday: contact.birthday
                ? {
                    year: contact.birthday.year || 0,
                    month: contact.birthday.month || 0,
                    day: contact.birthday.day || 0,
                  }
                : null,
            }));

            return {data: formattedContacts};
          } else {
            return {data: []};
          }
        } catch (error) {
          console.log('fetch device contact error===>', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              statusText: 'Failed to fetch device contacts',
              error: 'Contacts Error',
              data: {message: 'Unable to fetch contacts from the device'},
            } as FetchBaseQueryError,
          };
        }
      },
      providesTags: ['YarshaContacts'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCheckYarshaUsersMutation,
  useFetchYarshaContactsQuery,
  useFetchDeviceContactsQuery,
} = checkYarshaUsersApi;
