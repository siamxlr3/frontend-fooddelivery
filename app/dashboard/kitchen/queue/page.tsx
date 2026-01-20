'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { KitchenDisplay } from '@/components/kitchen/KitchenDisplay';

export default function KitchenQueuePage() {
    return (
        <AuthGuard allowedRoles={['KitchenStaff', 'Admin']}>
            <DashboardLayout>
                <KitchenDisplay
                    viewType="queue"
                    title="Live Order Queue"
                    subtitle="Manage incoming and active food preparation"
                />
            </DashboardLayout>
        </AuthGuard>
    );
}
