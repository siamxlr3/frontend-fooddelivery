'use client';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useGetCurrentSessionQuery } from '@/store/api/sessionApi';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/orderApi';
import { useGetSalesReportQuery } from '@/store/api/reportApi';
import type { RootState } from '@/store/store';
import styles from '../admin/admin.module.css';

export default function CashierDashboard() {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);

    // Session Query
    const { data: session, isLoading: sessionLoading } = useGetCurrentSessionQuery();

    // Report Query (Today's Sales)
    const today = new Date().toISOString().split('T')[0];
    const { data: reportData } = useGetSalesReportQuery({
        startDate: today,
        endDate: today,
        status: 'Paid'
    });

    // Orders Query (Recently active orders)
    const { data: ordersResponse, isLoading: ordersLoading } = useGetOrdersQuery({ page: 1, take: 50 });
    const allOrders = ordersResponse?.data || [];
    const [updateStatus] = useUpdateOrderStatusMutation();

    // Stats & Active Orders
    const activeOrders = useMemo(() => {
        return allOrders.filter(order =>
            ['New', 'InProgress', 'Ready'].includes(order.status)
        );
    }, [allOrders]);

    const stats = useMemo(() => {
        if (!allOrders) return { active: 0, completed: 0, tables: 0 };
        const ordersToday = allOrders.filter(o =>
            new Date(o.createdAt).toISOString().split('T')[0] === today
        );
        const active = ordersToday.filter(o => ['New', 'InProgress', 'Ready'].includes(o.status)).length;
        const completed = ordersToday.filter(o => o.status === 'Served' || o.status === 'Paid').length;
        const uniqueTables = new Set(
            ordersToday
                .filter(o => ['New', 'InProgress', 'Ready'].includes(o.status))
                .map(o => o.tableNumber)
                .filter(Boolean)
        ).size;
        return { active, completed, tables: uniqueTables };
    }, [allOrders, today]);

    const handleMarkServed = async (orderId: number) => {
        try {
            await updateStatus({ id: orderId, status: 'Served' }).unwrap();
        } catch (error) {
            console.error('Failed to mark as served:', error);
            alert('Failed to update status');
        }
    };

    const getTimeAgo = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        return `${mins} min ago`;
    };

    return (
        <AuthGuard allowedRoles={['Cashier', 'Admin']}>
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.pageHeader}>
                        <h1 className={styles.title}>Cashier Dashboard</h1>
                        <p className={styles.subtitle}>Billing, payments, and session management</p>
                    </div>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        <Card glass hover>
                            <CardBody>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon} style={{ background: 'var(--gradient-success)' }}>
                                        💰
                                    </div>
                                    <div className={styles.statContent}>
                                        <p className={styles.statLabel}>Today's Sales</p>
                                        <h3 className={styles.statValue}>${reportData?.summary?.totalSales || 0}</h3>
                                        <span className={styles.statChange}>From {reportData?.summary?.orderCount || 0} paid orders</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card glass hover>
                            <CardBody>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon} style={{ background: 'var(--gradient-primary)' }}>
                                        📝
                                    </div>
                                    <div className={styles.statContent}>
                                        <p className={styles.statLabel}>Active Orders</p>
                                        <h3 className={styles.statValue}>{stats.active}</h3>
                                        <span className={styles.statChange}>Orders in progress</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card glass hover>
                            <CardBody>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon} style={{ background: 'var(--gradient-secondary)' }}>
                                        🪑
                                    </div>
                                    <div className={styles.statContent}>
                                        <p className={styles.statLabel}>Active Tables</p>
                                        <h3 className={styles.statValue}>{stats.tables}</h3>
                                        <span className={styles.statChange}>Currently occupied</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Session Status */}
                    <Card glass className="mb-6" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <CardHeader>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Current Session</h3>
                        </CardHeader>
                        <CardBody>
                            {sessionLoading ? (
                                <p>Loading session status...</p>
                            ) : session ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                width: '12px',
                                                height: '12px',
                                                background: 'var(--accent-success)',
                                                borderRadius: '50%',
                                                display: 'inline-block'
                                            }}></span>
                                            <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Active</span>
                                        </div>
                                        <p style={{ color: 'var(--gray-600)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                            Started at {new Date(session.startedAt).toLocaleTimeString()} • Opening Cash: ${Number(session.openingCash).toFixed(2)}
                                        </p>
                                    </div>
                                    <Link href="/dashboard/cashier/sessions">
                                        <Button variant="danger">Manage Session</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                width: '12px',
                                                height: '12px',
                                                background: 'var(--gray-400)',
                                                borderRadius: '50%',
                                                display: 'inline-block'
                                            }}></span>
                                            <span style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--text-muted)' }}>Inactive</span>
                                        </div>
                                        <p style={{ color: 'var(--gray-600)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                            Start a new session to handle transactions.
                                        </p>
                                    </div>
                                    <Link href="/dashboard/cashier/sessions">
                                        <Button variant="primary">Start Session</Button>
                                    </Link>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Quick Actions */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Quick Actions</h2>
                        <div className={styles.actionsGrid}>
                            <Link href="/dashboard/cashier/new-order">
                                <Card glass hover className={styles.actionCard} style={{ cursor: 'pointer' }}>
                                    <CardBody>
                                        <div className={styles.actionIcon}>➕</div>
                                        <h3 className={styles.actionTitle}>New Order</h3>
                                        <p className={styles.actionDesc}>Create a new order</p>
                                    </CardBody>
                                </Card>
                            </Link>

                            <Link href="/dashboard/cashier/orders">
                                <Card glass hover className={styles.actionCard} style={{ cursor: 'pointer' }}>
                                    <CardBody>
                                        <div className={styles.actionIcon}>💰</div>
                                        <h3 className={styles.actionTitle}>Process Payment</h3>
                                        <p className={styles.actionDesc}>Handle customer payments</p>
                                    </CardBody>
                                </Card>
                            </Link>

                            <Link href="/dashboard/cashier/tables">
                                <Card glass hover className={styles.actionCard} style={{ cursor: 'pointer' }}>
                                    <CardBody>
                                        <div className={styles.actionIcon}>🪑</div>
                                        <h3 className={styles.actionTitle}>Table Status</h3>
                                        <p className={styles.actionDesc}>View floor plan</p>
                                    </CardBody>
                                </Card>
                            </Link>

                            <Link href="/dashboard/cashier/orders">
                                <Card glass hover className={styles.actionCard} style={{ cursor: 'pointer' }}>
                                    <CardBody>
                                        <div className={styles.actionIcon}>📋</div>
                                        <h3 className={styles.actionTitle}>Order History</h3>
                                        <p className={styles.actionDesc}>View all orders</p>
                                    </CardBody>
                                </Card>
                            </Link>

                            <Link href="/dashboard/cashier/payments">
                                <Card glass hover className={styles.actionCard} style={{ cursor: 'pointer' }}>
                                    <CardBody>
                                        <div className={styles.actionIcon}>📊</div>
                                        <h3 className={styles.actionTitle}>Payment History</h3>
                                        <p className={styles.actionDesc}>View past transactions</p>
                                    </CardBody>
                                </Card>
                            </Link>
                        </div>
                    </div>

                    {/* Active Orders List */}
                    <div className={styles.section} style={{ marginTop: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Active Orders</h2>
                            <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard/cashier/orders')}>View All Orders</Button>
                        </div>

                        {ordersLoading ? (
                            <p>Loading orders...</p>
                        ) : activeOrders.length === 0 ? (
                            <Card glass>
                                <CardBody>
                                    <p style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '2rem' }}>
                                        No active orders.
                                    </p>
                                </CardBody>
                            </Card>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                                {activeOrders.slice(0, 5).map(order => (
                                    <Card key={order.id} glass>
                                        <CardBody>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                                        {order.type === 'DineIn' ? `Table ${order.tableNumber}` : 'Takeaway'} - #{order.orderNumber.slice(-4)}
                                                    </h4>
                                                    <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                                                        {order.items.length} items • Placed {getTimeAgo(order.createdAt)} • By Waiter #{order.waiterId || 'N/A'}
                                                    </p>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        marginTop: '0.5rem',
                                                        padding: '0.25rem 0.75rem',
                                                        background: order.status === 'Ready' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                                                        color: order.status === 'Ready' ? 'var(--accent-success)' : 'var(--primary-600)',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}>
                                                        {order.status === 'Ready' ? 'Ready to Serve' : order.status}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <Button variant="secondary" size="sm" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>Details</Button>
                                                    {order.status === 'Ready' && (
                                                        <Button variant="success" size="sm" onClick={() => handleMarkServed(order.id)}>Mark Served</Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
