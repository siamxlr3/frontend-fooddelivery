import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-fooddelivery-5.onrender.com/api';

export interface Session {
    id: number;
    userId: number;
    terminalId: string;
    openingCash: number;
    closingCash?: number;
    status: 'OPEN' | 'CLOSED';
    openedAt: string;
    closedAt?: string;
    totalSales?: number;
}

export const sessionApi = createApi({
    reducerPath: 'sessionApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Session', 'SessionHistory'],
    endpoints: (builder) => ({
        getCurrentSession: builder.query<Session | null, void>({
            query: () => '/session/current',
            providesTags: ['Session'],
        }),
        getSessionHistory: builder.query<{ data: Session[]; total: number; page: number; totalPages: number }, { page?: number; take?: number }>({
            query: ({ page = 1, take = 10 }) => `/session/history?page=${page}&take=${take}`,
            providesTags: ['SessionHistory'],
        }),
        startSession: builder.mutation<Session, { terminalId: string; openingCash: number }>({
            query: (body) => ({
                url: '/session/start',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Session', 'SessionHistory'],
        }),
        closeSession: builder.mutation<Session, { sessionId: number; closingCash: number }>({
            query: (body) => ({
                url: '/session/close',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Session', 'SessionHistory'],
        }),
    }),
});

export const {
    useGetCurrentSessionQuery,
    useGetSessionHistoryQuery,
    useStartSessionMutation,
    useCloseSessionMutation,
} = sessionApi;

