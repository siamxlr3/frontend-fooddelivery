import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-fooddelivery.vercel.app/api';

export interface Supplier {
    id: number;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    itemType: string;
    status: string;
    purchaseDate?: string;
    totalPurchaseAmount?: number;
    paymentStatus?: string;
    createdAt: string;
    updatedAt: string;
}

export const supplierApi = createApi({
    reducerPath: 'supplierApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Suppliers'],
    endpoints: (builder) => ({
        getSuppliers: builder.query<{ data: Supplier[] }, void>({
            query: () => '/supplier',
            providesTags: ['Suppliers'],
        }),
        createSupplier: builder.mutation<{ message: string; supplier: Supplier }, Partial<Supplier>>({
            query: (data) => ({
                url: '/supplier',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Suppliers'],
        }),
        updateSupplier: builder.mutation<{ message: string; supplier: Supplier }, { id: number; data: Partial<Supplier> }>({
            query: ({ id, data }) => ({
                url: `/supplier/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Suppliers'],
        }),
        deleteSupplier: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/supplier/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Suppliers'],
        }),
    }),
});

export const {
    useGetSuppliersQuery,
    useCreateSupplierMutation,
    useUpdateSupplierMutation,
    useDeleteSupplierMutation,
} = supplierApi;
