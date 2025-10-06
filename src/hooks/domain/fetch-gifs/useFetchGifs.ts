import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const GIPHY_API_KEY = 'M00LnNbiENrfsXgX4GzAhf2rrRGNgkpl';

export const giphyApi = createApi({
  reducerPath: 'giphyApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.giphy.com/v1/gifs/',
  }),
  endpoints: (builder) => ({
    getTrendingGifs: builder.query<any[], void>({
      query: () => `trending?api_key=${GIPHY_API_KEY}&limit=30`,
      transformResponse: (response: any) => response.data,
    }),
    searchGifs: builder.query<any[], string>({
      query: (searchTerm: string) =>
        `search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=30`,
      transformResponse: (response: any) => response.data,
    }),
  }),
});

export const { useGetTrendingGifsQuery, useSearchGifsQuery } = giphyApi;
