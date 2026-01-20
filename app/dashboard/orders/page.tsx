'use client';

import { useState, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/orderApi';
import { PaymentModal } from '@/components/billing/PaymentModal';
import type { OrderStatus, Order } from '@/store/api/orderApi';
import styles from './orders.module.css';
import Link from 'next/link';

interface OrderListPageProps {
    defaultStatus?: OrderStatus | 'All';
}

export default function OrderListPage({ defaultStatus = 'All' }: OrderListPageProps) {
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>(defaultStatus);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const { data: ordersResponse, isLoading } = useGetOrdersQuery({
        status: statusFilter === 'All' ? undefined : statusFilter as OrderStatus,
        page: currentPage,
        take: itemsPerPage
    });
    const orders = ordersResponse?.data || [];
    const totalOrders = ordersResponse?.total || 0;
    const totalPages = ordersResponse?.totalPages || 1;
    const [updateStatus] = useUpdateOrderStatusMutation();

    const currentOrders = orders;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (val > 0) {
            setItemsPerPage(val);
            setCurrentPage(1); // Reset to first page
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'New': return '#3b82f6'; // Blue
            case 'InProgress': return '#f59e0b'; // Amber
            case 'Ready': return '#10b981'; // Green
            case 'Served': return '#6366f1'; // Indigo
            case 'Paid': return '#14b8a6'; // Teal
            case 'Cancelled': return '#ef4444'; // Red
            default: return '#94a3b8';
        }
    };

    const handleStatusChange = async (id: number, newStatus: OrderStatus) => {
        try {
            await updateStatus({ id, status: newStatus }).unwrap();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    return (
        <AuthGuard allowedRoles={['Admin', 'Waiter', 'Cashier', 'KitchenStaff']}>
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 className={styles.title}>Unified Station</h1>
                            <p className={styles.subtitle}>Full-cycle management: Orders, Kitchen Status, and Billing</p>
                        </div>
                        <Link href="/dashboard/orders/new">
                            <Button variant="primary" icon={<span>+</span>}>New Order</Button>
                        </Link>
                    </div>

                    <div className={styles.menuHeader} style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {['All', 'New', 'InProgress', 'Ready', 'Served', 'Paid', 'Cancelled'].map((status) => (
                                <button
                                    key={status}
                                    className={`${styles.typeBtn} ${statusFilter === status ? styles.active : ''}`}
                                    onClick={() => {
                                        setStatusFilter(status as any);
                                        setCurrentPage(1); // Reset pagination on filter change
                                    }}
                                    style={{ minWidth: '100px' }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className={styles.loading}>Synchronizing data hubs...</div>
                    ) : orders.length === 0 ? (
                        <div className={styles.emptyCart}>
                            <div style={{ fontSize: '4rem' }}>📋</div>
                            <h2>No records found</h2>
                            <p>All clear! Create a new order to get started.</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.foodGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                                {currentOrders.map((order) => (
                                    <Card key={order.id} glass className={styles.orderCard}>
                                        <CardBody>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <div>
                                                    <h3 style={{ fontWeight: 800 }}>#{order.orderNumber.slice(0, 8)}</h3>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {new Date(order.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    background: `${getStatusColor(order.status)}22`,
                                                    color: getStatusColor(order.status),
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                    border: `1px solid ${getStatusColor(order.status)}44`
                                                }}>
                                                    {order.status}
                                                </span>
                                            </div>

                                            <div style={{ marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <span style={{ fontSize: '1.1rem' }}>{order.type === 'DineIn' ? '🪑' : '🛍️'}</span>
                                                    <span style={{ fontWeight: 600 }}>
                                                        {order.type === 'DineIn' ? `Table ${order.tableNumber}` : `Takeaway: ${order.customerName || 'Guest'}`}
                                                    </span>
                                                </div>
                                                {order.customerPhone && (
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1.7rem' }}>
                                                        📞 {order.customerPhone}
                                                    </p>
                                                )}
                                            </div>

                                            <div style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '12px',
                                                padding: '1rem',
                                                marginBottom: '1rem'
                                            }}>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                                        <span>{item.quantity}x {item.food?.name}</span>
                                                        <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                <div style={{
                                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                                    marginTop: '0.5rem',
                                                    paddingTop: '0.5rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontWeight: 800
                                                }}>
                                                    <span>Total</span>
                                                    <span style={{ color: 'var(--primary-400)' }}>${Number(order.totalAmount).toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                                {order.status === 'New' && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        disabled
                                                        style={{
                                                            width: '100%',
                                                            opacity: 0.5,
                                                            cursor: 'not-allowed',
                                                            pointerEvents: 'none'
                                                        }}
                                                        onClick={() => handleStatusChange(order.id, 'InProgress')}
                                                    >
                                                        Accept Order
                                                    </Button>
                                                )}
                                                {order.status === 'InProgress' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled
                                                        style={{
                                                            width: '100%',
                                                            opacity: 0.8,
                                                            cursor: 'not-allowed',
                                                            background: 'rgba(245, 158, 11, 0.1)',
                                                            color: '#f59e0b',
                                                            border: '1px solid rgba(245, 158, 11, 0.3)'
                                                        }}
                                                    >
                                                        ⏳ In Progress...
                                                    </Button>
                                                )}
                                                {(order.status === 'Ready' || order.status === 'Served') && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        style={{ width: '100%' }}
                                                        onClick={() => setSelectedOrder(order)}
                                                    >
                                                        💳 Process Payment
                                                    </Button>
                                                )}
                                                {order.status === 'New' && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        disabled
                                                        style={{
                                                            opacity: 0.5,
                                                            cursor: 'not-allowed',
                                                            pointerEvents: 'none'
                                                        }}
                                                        onClick={() => handleStatusChange(order.id, 'Cancelled')}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {/* Pagination Controls */}
                            <div style={{
                                marginTop: '2.5rem',
                                padding: '1rem 1.5rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '1.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    Showing <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalOrders)}</span> of <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{totalOrders}</span> orders
                                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Rows per page:</span>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => handleItemsPerPageChange(e as any)}
                                                style={{
                                                    appearance: 'none',
                                                    padding: '0.4rem 2rem 0.4rem 1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    color: 'var(--text-main)',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                            <span style={{
                                                position: 'absolute',
                                                right: '0.75rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                pointerEvents: 'none',
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)'
                                            }}>▼</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        ← Previous
                                    </Button>

                                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '10px' }}>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let p = i + 1;
                                            if (totalPages > 5) {
                                                if (currentPage > 3) {
                                                    p = currentPage - 2 + i;
                                                }
                                                if (p > totalPages) {
                                                    p = totalPages - (4 - i);
                                                }
                                            }
                                            if (p < 1) p = i + 1;

                                            return (
                                                <button
                                                    key={p}
                                                    onClick={() => handlePageChange(p)}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: currentPage === p ? 'var(--primary-gradient)' : 'transparent',
                                                        color: currentPage === p ? 'white' : 'var(--text-muted)',
                                                        cursor: 'pointer',
                                                        fontWeight: currentPage === p ? 700 : 500,
                                                        transition: 'all 0.2s ease',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        Next →
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {selectedOrder && (
                    <PaymentModal
                        isOpen={!!selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                        order={selectedOrder}
                    />
                )}
            </DashboardLayout>
        </AuthGuard>
    );
}
