import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Booking {
    id: number;
    customerName: string;
    phone: string;
    guests: number;
    bookingTime: string;
    tableId: number;
    status: 'Reserved' | 'Seated' | 'Cancelled' | 'Completed';
    table?: {
        number: string;
        capacity: number;
    };
    createdAt: string;
    updatedAt: string;
}

export const bookingApi = createApi({
    reducerPath: 'bookingApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Bookings'],
    endpoints: (builder) => ({
        getBookings: builder.query<Booking[], void>({
            query: () => '/booking',
            providesTags: ['Bookings'],
        }),
        createBooking: builder.mutation<void, Partial<Booking>>({
            query: (data) => ({
                url: '/booking',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Bookings'],
        }),
        updateBookingStatus: builder.mutation<void, { id: number; status: string }>({
            query: ({ id, status }) => ({
                url: `/booking/${id}/status`,
                method: 'PUT',
                body: { status },
            }),
            invalidatesTags: ['Bookings'],
        }),
        deleteBooking: builder.mutation<void, number>({
            query: (id) => ({
                url: `/booking/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Bookings'],
        }),
    }),
});

export const {
    useGetBookingsQuery,
    useCreateBookingMutation,
    useUpdateBookingStatusMutation,
    useDeleteBookingMutation
} = bookingApi;
