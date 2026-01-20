'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { KitchenDisplay } from '@/components/kitchen/KitchenDisplay';

export default function KitchenStaffPage() {
    return (
        <AuthGuard allowedRoles={['KitchenStaff', 'Admin']}>
            <DashboardLayout>
                <KitchenDisplay
                    viewType="queue"
                    title="Kitchen Staff Dashboard"
                    subtitle="Manage orders and track preparation status"
                />
            </DashboardLayout>
        </AuthGuard>
    );
}
