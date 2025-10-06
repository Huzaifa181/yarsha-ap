import {URL_CONFIGURATIONS} from '@/config';
import {RootState} from '@/store';
import {
  BaseQueryFn,
  FetchArgs,
  createApi,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import {HttpMethod} from 'react-native-compressor/lib/typescript/utils';
import perf from '@react-native-firebase/perf';

const baseQuery = fetchBaseQuery({
  baseUrl: URL_CONFIGURATIONS.APP_URL,
  prepareHeaders: (headers, {getState}) => {
    const state = getState() as RootState;
    const authToken = state?.accessToken?.authToken;
    console.log('authToken', authToken);
    if (authToken) {
      headers.set('authorization', `Bearer ${authToken}`);
    }
    return headers;
  },
});

const baseQueryWithInterceptor: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const {url, method} = args as FetchArgs;
  const trace = await perf().newHttpMetric(url, method as HttpMethod);

  try {
    console.log('args', args);
    await trace.start();
    trace.putAttribute('http.request.url', url);
    let result = await baseQuery(args, api, extraOptions);

    const response = result.meta?.response;

    if (response) {
      trace.putAttribute(
        'http.response.status_code',
        response.status.toString(),
      );
      trace.putAttribute(
        'http.response.content_length',
        response.headers.get('content-length') || '0',
      );
      trace.putAttribute(
        'http.response.status_code',
        response.status.toString(),
      );
      trace.setHttpResponseCode(response.status);
      trace.setResponseContentType(response.headers.get('content-type') || '');
    } else {
      trace.putAttribute(
        'http.response.status_code',
        result.error?.status?.toString() || 'unknown',
      );
    }

    if (result.error && result.error.status === 401) {
      // Handle 401 errors
    }

    return result;
  } catch (error) {
    trace.putAttribute('http.error', (error as Error).message);
    throw error;
  } finally {
    console.log(`[${method}] ${url}`);
    await trace.stop();
  }
};

export const api = createApi({
  reducerPath: 'api',
  refetchOnReconnect: true,
  tagTypes: [
    'MatchedUsers',
    'GroupChats',
    'RecentUsers',
    'Messages',
    'RecentChats',
    'GroupChatDetail',
    "YarshaContacts"
  ],
  baseQuery: baseQueryWithInterceptor,
  endpoints: () => ({}),
});
