'use client';

import OrderListPage from '@/components/orders/OrderListPage';

/**
 * Order List Page
 * 
 * This is a wrapper for the OrderListPage component.
 * Next.js App Router expects page.tsx to have a default export that matches its expected signature.
 */
export default function Page() {
    return <OrderListPage />;
}
