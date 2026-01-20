import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const settingsApi = createApi({
    reducerPath: 'settingsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://backend-fooddelivery.vercel.app/api',
        prepareHeaders: (headers) => {
            // Add auth token if needed
            return headers;
        },
    }),
    tagTypes: ['Settings'],
    endpoints: (builder) => ({
        getSettings: builder.query<Record<string, string>, void>({
            query: () => '/settings',
            providesTags: ['Settings'],
        }),
        updateSettings: builder.mutation<any, { settings: Record<string, string> }>({
            query: (body) => ({
                url: '/settings',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Settings'],
        }),
        updateSetting: builder.mutation<any, { key: string, value: string }>({
            query: ({ key, value }) => ({
                url: `/settings/${key}`,
                method: 'PATCH',
                body: { value },
            }),
            invalidatesTags: ['Settings'],
        }),
        uploadLogo: builder.mutation<any, FormData>({
            query: (formData) => ({
                url: '/settings/logo-upload',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Settings'],
        }),
    }),
});

export const {
    useGetSettingsQuery,
    useUpdateSettingsMutation,
    useUpdateSettingMutation,
    useUploadLogoMutation
} = settingsApi;

