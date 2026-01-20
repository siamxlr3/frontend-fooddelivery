import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { menuApi } from './api/menuApi';
import { orderApi } from './api/orderApi';
import { billingApi } from './api/billingApi';
import { reportApi } from './api/reportApi';
import { sessionApi } from './api/sessionApi';
import { tableApi } from './api/tableApi';
import { settingsApi } from './api/settingsApi';
import { supplierApi } from './api/supplierApi';
import { bookingApi } from './api/bookingApi';
import authReducer from './slices/authSlice';

export const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        [menuApi.reducerPath]: menuApi.reducer,
        [orderApi.reducerPath]: orderApi.reducer,
        [billingApi.reducerPath]: billingApi.reducer,
        [reportApi.reducerPath]: reportApi.reducer,
        [sessionApi.reducerPath]: sessionApi.reducer,
        [tableApi.reducerPath]: tableApi.reducer,
        [settingsApi.reducerPath]: settingsApi.reducer,
        [supplierApi.reducerPath]: supplierApi.reducer,
        [bookingApi.reducerPath]: bookingApi.reducer,
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            authApi.middleware,
            menuApi.middleware,
            orderApi.middleware,
            billingApi.middleware,
            reportApi.middleware,
            sessionApi.middleware,
            tableApi.middleware,
            settingsApi.middleware,
            supplierApi.middleware,
            bookingApi.middleware
        ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
