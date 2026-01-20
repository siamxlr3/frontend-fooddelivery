import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-fooddelivery.vercel.app/api';

export interface ReportSummary {
    totalSales: number;
    orderCount: number;
}

export interface ReportResponse {
    summary: ReportSummary;
    orders: any[];
    totalOrders: number;
    page: number;
    totalPages: number;
    chartData: { date: string; amount: number }[];
}

export interface ReportParams {
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    waiterId?: number;
    status?: string;
    groupBy?: 'day' | 'week' | 'month';
    page?: number;
    take?: number;
    search?: string;
}

export const reportApi = createApi({
    reducerPath: 'reportApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Reports'],
    endpoints: (builder) => ({
        getSalesReport: builder.query<ReportResponse, ReportParams | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params) {
                    Object.entries(params).forEach(([key, value]) => {
                        if (value) searchParams.append(key, value.toString());
                    });
                }
                return `/report/daily?${searchParams.toString()}`;
            },
            providesTags: ['Reports'],
        }),
        getTopSellingItems: builder.query<TopSellingItem[], { startDate?: string; endDate?: string }>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params.startDate) searchParams.append('startDate', params.startDate);
                if (params.endDate) searchParams.append('endDate', params.endDate);
                return `/report/top-selling?${searchParams.toString()}`;
            },
            providesTags: ['Reports'],
        }),
        getFinancialReport: builder.query<FinancialReportResponse, { year?: number; month?: number }>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params.year) searchParams.append('year', params.year.toString());
                if (params.month) searchParams.append('month', params.month.toString());
                return `/report/financial?${searchParams.toString()}`;
            },
            providesTags: ['Reports'],
        }),
    }),
});

export interface FinancialReportResponse {
    summary: {
        totalIncome: number;
        totalExpense: number;
        netProfit: number;
        staffCost: number;
        supplierCost: number;
        orderCount: number;
    };
    details: {
        staff: { name: string; role: string; salary: number }[];
        supplierPurchases: { name: string; itemType: string; totalPurchaseAmount: number; purchaseDate: string }[];
    };
    period: {
        year: number;
        month: number;
    };
}

export interface TopSellingItem {
    foodName: string;
    category: string | number;
    totalQuantity: number;
    price: number;
}

export const { useGetSalesReportQuery, useGetTopSellingItemsQuery, useGetFinancialReportQuery } = reportApi;
