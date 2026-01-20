import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface FoodCategory {
    id: number;
    name: string;
    image?: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Food {
    id: number;
    name: string;
    description?: string;
    price: number;
    discountPercentage: number;
    image?: string;
    categoryId: number;
    status: boolean;
    ingredients?: string;
    createdAt: string;
    updatedAt: string;
    category?: FoodCategory;
}

export interface ApiResponse<T> {
    message: string;
    data: T;
}

export const menuApi = createApi({
    reducerPath: 'menuApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Foods', 'Categories'],
    endpoints: (builder) => ({
        // Food endpoints
        getFoods: builder.query<ApiResponse<{ data: Food[]; total: number }>, { page?: number; take?: number; keyword?: string; categoryId?: number }>({
            query: ({ page = 1, take = 10, keyword, categoryId }) => {
                const params = new URLSearchParams({
                    page: page.toString(),
                    take: take.toString(),
                });
                if (keyword) params.append('keyword', keyword);
                if (categoryId) params.append('categoryId', categoryId.toString());
                return `/food?${params.toString()}`;
            },
            providesTags: ['Foods'],
        }),
        getFoodById: builder.query<ApiResponse<Food>, number>({
            query: (id) => `/food/${id}`,
            providesTags: ['Foods'],
        }),
        createFood: builder.mutation<ApiResponse<Food>, FormData>({
            query: (formData) => ({
                url: '/food/create',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Foods'],
        }),
        updateFood: builder.mutation<ApiResponse<Food>, { id: number; data: FormData }>({
            query: ({ id, data }) => ({
                url: `/food/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Foods'],
        }),
        deleteFood: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/food/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Foods'],
        }),

        // Category endpoints
        getCategories: builder.query<ApiResponse<{ data: FoodCategory[]; total: number; page: number; totalPages: number }>, { page?: number; take?: number; keyword?: string } | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params?.page) searchParams.append('page', params.page.toString());
                if (params?.take) searchParams.append('take', params.take.toString());
                if (params?.keyword) searchParams.append('keyword', params.keyword);
                return `/category?${searchParams.toString()}`;
            },
            providesTags: ['Categories'],
        }),
        getCategoryById: builder.query<ApiResponse<FoodCategory>, number>({
            query: (id) => `/category/${id}`,
            providesTags: ['Categories'],
        }),
        createCategory: builder.mutation<ApiResponse<FoodCategory>, FormData>({
            query: (formData) => ({
                url: '/category/create',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Categories'],
        }),
        updateCategory: builder.mutation<ApiResponse<FoodCategory>, { id: number; data: FormData }>({
            query: ({ id, data }) => ({
                url: `/category/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Categories'],
        }),
        deleteCategory: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/category/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Categories'],
        }),
        updateItemDiscounts: builder.mutation<ApiResponse<Food[]>, { discounts: { id: number; discountPercentage: number }[] }>({
            query: (data) => ({
                url: '/food/discounts/bulk',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Foods'],
        }),
    }),
});

export const {
    useGetFoodsQuery,
    useGetFoodByIdQuery,
    useCreateFoodMutation,
    useUpdateFoodMutation,
    useDeleteFoodMutation,
    useGetCategoriesQuery,
    useGetCategoryByIdQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useUpdateItemDiscountsMutation,
} = menuApi;

