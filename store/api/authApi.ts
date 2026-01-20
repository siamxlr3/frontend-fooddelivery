import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
    id: number;
    email: string;
    name: string;
    role: 'Admin' | 'Cashier' | 'Waiter' | 'KitchenStaff';
    salary?: number;
}

export interface PaginatedUsers {
    message: string;
    data: User[];
    total: number;
    page: number;
    totalPages: number;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    message: string;
}

export interface VerifyOTPRequest {
    otp: string;
}

export interface VerifyOTPResponse {
    message: string;
    token: string;
    user: User;
}

export interface RecoverEmailRequest {
    email: string;
}

export interface RecoverPasswordRequest {
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role: 'Admin' | 'Cashier' | 'Waiter' | 'KitchenStaff';
    salary?: number;
}

export interface RegisterResponse {
    message: string;
}


export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Users'],
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/user/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        verifyOTP: builder.mutation<VerifyOTPResponse, { email: string; otp: string }>({
            query: ({ email, otp }) => ({
                url: `/user/verify-otp/${email}`,
                method: 'POST',
                body: { otp },
            }),
        }),
        recoverEmail: builder.mutation<{ message: string }, RecoverEmailRequest>({
            query: (body) => ({
                url: '/user/recover-email',
                method: 'POST',
                body,
            }),
        }),
        recoverOTP: builder.mutation<{ message: string }, { email: string; otp: string }>({
            query: ({ email, otp }) => ({
                url: `/user/recover-otp/${email}`,
                method: 'POST',
                body: { otp },
            }),
        }),
        recoverPassword: builder.mutation<{ message: string }, { email: string; otp: string; password: string }>({
            query: ({ email, otp, password }) => ({
                url: `/user/recover-password/${email}/${otp}`,
                method: 'POST',
                body: { password },
            }),
        }),
        register: builder.mutation<RegisterResponse, RegisterRequest>({
            query: (userData) => ({
                url: '/user/register',
                method: 'POST',
                body: userData,
            }),
        }),
        createStaff: builder.mutation<RegisterResponse, RegisterRequest>({
            query: (userData) => ({
                url: '/user/staff',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['Users'],
        }),
        getUsers: builder.query<PaginatedUsers, { page?: number; take?: number; keyword?: string } | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params?.page) searchParams.append('page', params.page.toString());
                if (params?.take) searchParams.append('take', params.take.toString());
                if (params?.keyword) searchParams.append('keyword', params.keyword);
                return `/user?${searchParams.toString()}`;
            },
            providesTags: ['Users'],
        }),
        updateStaff: builder.mutation<User, { id: number; data: Partial<RegisterRequest> }>({
            query: ({ id, data }) => ({
                url: `/user/staff/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Users'],
        }),
        deleteStaff: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/user/staff/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Users'],
        }),
        logout: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/user/logout',
                method: 'POST',
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useVerifyOTPMutation,
    useRecoverEmailMutation,
    useRecoverOTPMutation,
    useRecoverPasswordMutation,
    useRegisterMutation,
    useCreateStaffMutation,
    useLogoutMutation,
    useGetUsersQuery,
    useUpdateStaffMutation,
    useDeleteStaffMutation,
} = authApi;
