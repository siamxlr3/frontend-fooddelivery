import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Food } from './menuApi';
import type { User } from './authApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-fooddelivery.vercel.app/api';

export type OrderStatus = 'New' | 'InProgress' | 'Ready' | 'Served' | 'Paid' | 'Cancelled';
export type OrderType = 'DineIn' | 'Takeaway';

export interface OrderItem {
    id: number;
    orderId: number;
    foodId: number;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    notes?: string;
    food?: Food;
}

export interface Order {
    id: number;
    orderNumber: string;
    type: OrderType;
    status: OrderStatus;
    tableNumber?: string;
    customerName?: string;
    customerPhone?: string;
    totalAmount: number;
    waiterId?: number;
    waiter?: User;
    sessionId?: number;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
}

export interface PaginatedOrders {
    data: Order[];
    total: number;
    page: number;
    totalPages: number;
}

export const orderApi = createApi({
    reducerPath: 'orderApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Orders'],
    endpoints: (builder) => ({
        getOrders: builder.query<PaginatedOrders, { status?: OrderStatus | string; page?: number; take?: number } | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params?.status) searchParams.append('status', params.status);
                if (params?.page) searchParams.append('page', params.page.toString());
                if (params?.take) searchParams.append('take', params.take.toString());
                return `/order?${searchParams.toString()}`;
            },
            providesTags: ['Orders'],
        }),
        getOrderById: builder.query<Order, number>({
            query: (id) => `/order/${id}`,
            providesTags: ['Orders'],
        }),
        createOrder: builder.mutation<{ message: string; order: Order }, any>({
            query: (orderData) => ({
                url: '/order',
                method: 'POST',
                body: orderData,
            }),
            invalidatesTags: ['Orders'],
        }),
        updateOrderStatus: builder.mutation<Order, { id: number; status: OrderStatus }>({
            query: ({ id, status }) => ({
                url: `/order/${id}/status`,
                method: 'PUT',
                body: { status },
            }),
            invalidatesTags: ['Orders'],
        }),
    }),
});

export const {
    useGetOrdersQuery,
    useGetOrderByIdQuery,
    useCreateOrderMutation,
    useUpdateOrderStatusMutation,
} = orderApi;
