'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { KitchenDisplay } from '@/components/kitchen/KitchenDisplay';

export default function KitchenCompletedPage() {
    return (
        <AuthGuard allowedRoles={['KitchenStaff', 'Admin']}>
            <DashboardLayout>
                <KitchenDisplay
                    viewType="completed"
                    title="Completed Orders"
                    subtitle="View orders that have been prepared and are ready to serve"
                />
            </DashboardLayout>
        </AuthGuard>
    );
}
