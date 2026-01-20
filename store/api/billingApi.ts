import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-fooddelivery-5.onrender.com/api';

export interface Bill {
    id: number;
    orderId: number;
    invoiceNumber: string;
    subtotal: number;
    tax: number;
    discount: number;
    grandTotal: number;
    isPaid: boolean;
    paymentMethod?: string;
    createdAt: string;
}

export interface Transaction {
    id: number;
    billId: number;
    amount: number;
    method: 'Cash' | 'Card' | 'Mobile';
    reference?: string;
    createdAt: string;
}

export const billingApi = createApi({
    reducerPath: 'billingApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Bills'],
    endpoints: (builder) => ({
        generateBill: builder.mutation<Bill, { orderId: number; tax?: number; discount?: number }>({
            query: (body) => ({
                url: '/billing/generate',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Bills'],
        }),
        processPayment: builder.mutation<{ message: string; transaction: Transaction }, { billId: number; amount: number; method: string; reference?: string }>({
            query: (body) => ({
                url: '/billing/pay',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Bills'],
        }),
        getPaymentHistory: builder.query<Transaction[], void>({
            query: () => '/billing/history',
            providesTags: ['Bills'],
        }),
    }),
});

export const {
    useGenerateBillMutation,
    useProcessPaymentMutation,
    useGetPaymentHistoryQuery,
} = billingApi;
