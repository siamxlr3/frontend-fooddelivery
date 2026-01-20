'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { useGetSalesReportQuery } from '@/store/api/reportApi';
import { useGetOrdersQuery } from '@/store/api/orderApi';
import { useGetUsersQuery } from '@/store/api/authApi';
import styles from './admin.module.css';

export default function AdminDashboard() {
    const today = new Date().toISOString().split('T')[0];

    // Fetch Data
    const { data: salesData, isLoading: isSalesLoading } = useGetSalesReportQuery({
        startDate: today,
        endDate: today
    });
    const { data: ordersResponse, isLoading: isOrdersLoading } = useGetOrdersQuery({ page: 1, take: 100 });
    const orders = ordersResponse?.data || [];
    const { data: usersResponse, isLoading: isUsersLoading } = useGetUsersQuery({ take: 1000 });
    const users = usersResponse?.data || [];

    // Calculate Dashboard Stats
    const stats = useMemo(() => {
        const activeOrders = orders.filter(o => !['Paid', 'Cancelled', 'Served'].includes(o.status));
        const kitchenOrders = orders.filter(o => o.status === 'InProgress').length;
        const readyOrders = orders.filter(o => o.status === 'Ready').length;

        const occupiedTableList = new Set(
            orders
                .filter(o => !['Paid', 'Cancelled'].includes(o.status) && o.tableNumber)
                .map(o => o.tableNumber)
        );

        return {
            todaySales: salesData?.summary?.totalSales || 0,
            activeCount: activeOrders.length,
            kitchenCount: kitchenOrders,
            readyCount: readyOrders,
            staffTotal: users.length,
            staffBreakdown: {
                cashiers: users.filter(u => u.role === 'Cashier').length,
                waiters: users.filter(u => u.role === 'Waiter').length,
                kitchen: users.filter(u => u.role === 'KitchenStaff').length
            },
            tableOccupancy: occupiedTableList.size,
            totalTables: 25 // Assuming static for now or can be dynamic if tableApi exists
        };
    }, [salesData, orders, users]);

    const isLoading = isSalesLoading || isOrdersLoading || isUsersLoading;

    return (
        <AuthGuard allowedRoles={['Admin']}>
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.pageHeader}>
                        <h1 className={styles.title}>Admin Dashboard</h1>
                        <p className={styles.subtitle}>Real-time system overview and management</p>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '8rem', textAlign: 'center', opacity: 0.7 }}>
                            <div className="loader">⌛</div>
                            <p>Synchronizing dashboard data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className={styles.statsGrid}>
                                <Card glass hover>
                                    <CardBody>
                                        <div className={styles.statCard}>
                                            <div className={styles.statIcon} style={{ background: 'var(--gradient-primary)' }}>
                                                💰
                                            </div>
                                            <div className={styles.statContent}>
                                                <p className={styles.statLabel}>Total Sales Today</p>
                                                <h3 className={styles.statValue}>${Number(stats.todaySales).toFixed(2)}</h3>
                                                <span className={styles.statChange}>Syncing...</span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card glass hover>
                                    <CardBody>
                                        <div className={styles.statCard}>
                                            <div className={styles.statIcon} style={{ background: 'var(--gradient-secondary)' }}>
                                                📋
                                            </div>
                                            <div className={styles.statContent}>
                                                <p className={styles.statLabel}>Active Orders</p>
                                                <h3 className={styles.statValue}>{stats.activeCount}</h3>
                                                <span className={styles.statChange}>
                                                    {stats.kitchenCount} in kitchen, {stats.readyCount} ready
                                                </span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card glass hover>
                                    <CardBody>
                                        <div className={styles.statCard}>
                                            <div className={styles.statIcon} style={{ background: 'var(--gradient-success)' }}>
                                                👥
                                            </div>
                                            <div className={styles.statContent}>
                                                <p className={styles.statLabel}>Staff Records</p>
                                                <h3 className={styles.statValue}>{stats.staffTotal}</h3>
                                                <span className={styles.statChange}>
                                                    {stats.staffBreakdown.cashiers}C, {stats.staffBreakdown.waiters}W, {stats.staffBreakdown.kitchen}K
                                                </span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card glass hover>
                                    <CardBody>
                                        <div className={styles.statCard}>
                                            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
                                                🪑
                                            </div>
                                            <div className={styles.statContent}>
                                                <p className={styles.statLabel}>Tables Occupied</p>
                                                <h3 className={styles.statValue}>{stats.tableOccupancy}/{stats.totalTables}</h3>
                                                <span className={styles.statChange}>
                                                    {Math.round((stats.tableOccupancy / stats.totalTables) * 100)}% occupancy
                                                </span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            {/* Quick Actions */}
                            <div className={styles.section}>
                                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                                <div className={styles.actionsGrid}>
                                    <Link href="/dashboard/admin/menu">
                                        <Card glass hover className={styles.actionCard}>
                                            <CardBody>
                                                <div className={styles.actionIcon}>🍽️</div>
                                                <h3 className={styles.actionTitle}>Menu Management</h3>
                                                <p className={styles.actionDesc}>Manage food items and categories</p>
                                            </CardBody>
                                        </Card>
                                    </Link>

                                    <Link href="/dashboard/admin/orders">
                                        <Card glass hover className={styles.actionCard}>
                                            <CardBody>
                                                <div className={styles.actionIcon}>📦</div>
                                                <h3 className={styles.actionTitle}>Orders Management</h3>
                                                <p className={styles.actionDesc}>Take orders and track kitchen status</p>
                                            </CardBody>
                                        </Card>
                                    </Link>

                                    <Link href="/dashboard/admin/staff">
                                        <Card glass hover className={styles.actionCard}>
                                            <CardBody>
                                                <div className={styles.actionIcon}>👤</div>
                                                <h3 className={styles.actionTitle}>Staff Management</h3>
                                                <p className={styles.actionDesc}>Manage staff accounts and roles</p>
                                            </CardBody>
                                        </Card>
                                    </Link>

                                    <Link href="/dashboard/admin/reports">
                                        <Card glass hover className={styles.actionCard}>
                                            <CardBody>
                                                <div className={styles.actionIcon}>📊</div>
                                                <h3 className={styles.actionTitle}>View Reports</h3>
                                                <p className={styles.actionDesc}>Sales, inventory, and analytics</p>
                                            </CardBody>
                                        </Card>
                                    </Link>

                                    <Link href="/dashboard/admin/settings">
                                        <Card glass hover className={styles.actionCard}>
                                            <CardBody>
                                                <div className={styles.actionIcon}>⚙️</div>
                                                <h3 className={styles.actionTitle}>System Settings</h3>
                                                <p className={styles.actionDesc}>Global tax, discounts and configurations</p>
                                            </CardBody>
                                        </Card>
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
