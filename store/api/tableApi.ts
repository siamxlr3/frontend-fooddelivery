import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-fooddelivery.vercel.app/api';

export interface DiningTable {
    id: number;
    number: string;
    capacity: number;
    createdAt: string;
    updatedAt: string;
}

export const tableApi = createApi({
    reducerPath: 'tableApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Tables'],
    endpoints: (builder) => ({
        getTables: builder.query<DiningTable[], void>({
            query: () => '/table',
            providesTags: ['Tables'],
        }),
        addTable: builder.mutation<DiningTable, Partial<DiningTable>>({
            query: (body) => ({
                url: '/table',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Tables'],
        }),
        updateTable: builder.mutation<DiningTable, { id: number; data: Partial<DiningTable> }>({
            query: ({ id, data }) => ({
                url: `/table/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Tables'],
        }),
        removeTable: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/table/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Tables'],
        }),
    }),
});

export const {
    useGetTablesQuery,
    useAddTableMutation,
    useUpdateTableMutation,
    useRemoveTableMutation,
} = tableApi;
