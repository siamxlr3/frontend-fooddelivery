import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { KitchenDisplay } from '@/components/kitchen/KitchenDisplay';

export default function KitchenDashboard() {
    return (
        <AuthGuard allowedRoles={['KitchenStaff', 'Admin']}>
            <DashboardLayout>
                <KitchenDisplay
                    viewType="queue"
                    title="Kitchen Display System"
                    subtitle="Real-time order monitoring and preparation"
                />
            </DashboardLayout>
        </AuthGuard>
    );
}

