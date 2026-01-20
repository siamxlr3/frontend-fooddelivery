'use client';

import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useGetOrderByIdQuery, useUpdateOrderStatusMutation } from '@/store/api/orderApi';
import { PaymentModal } from '@/components/billing/PaymentModal';
import type { Order } from '@/store/api/orderApi';
import styles from '@/components/orders/orders.module.css';
import { useState } from 'react';
import Link from 'next/link';

export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const { data: order, isLoading, error } = useGetOrderByIdQuery(Number(id));
    const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation();

    if (isLoading) return <DashboardLayout><div className={styles.container}>Loading order details...</div></DashboardLayout>;
    if (error || !order) return <DashboardLayout><div className={styles.container}>Order not found.</div></DashboardLayout>;

    const handleStatusChange = async (newStatus: any) => {
        try {
            await updateStatus({ id: order.id, status: newStatus }).unwrap();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    return (
        <AuthGuard allowedRoles={['Admin', 'Waiter', 'Cashier', 'KitchenStaff']}>
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <Button variant="secondary" size="sm" onClick={() => router.back()}>← Back</Button>
                            <h1 className={styles.title}>Order #{order.orderNumber.slice(-8)}</h1>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p className={styles.subtitle}>Placed on {new Date(order.createdAt).toLocaleString()}</p>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                    <span className={styles.badge} style={{
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        color: '#3b82f6',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        fontWeight: 600
                                    }}>
                                        {order.type}
                                    </span>
                                    <span className={styles.badge} style={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        fontWeight: 600
                                    }}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>Total Amount</p>
                                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-500)' }}>
                                    ${Number(order.totalAmount).toFixed(2)}
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className={styles.layout} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                        <div>
                            <Card glass>
                                <CardBody>
                                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Order Items</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '12px'
                                            }}>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        background: 'var(--primary-900)',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.2rem'
                                                    }}>
                                                        {item.food?.image ? <img src={item.food.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : '🍲'}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 600 }}>{item.food?.name}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{item.quantity} x ${Number(item.unitPrice).toFixed(2)}</p>
                                                        {item.notes && <p style={{ fontSize: '0.75rem', color: 'var(--primary-400)', marginTop: '0.25rem' }}>Note: {item.notes}</p>}
                                                    </div>
                                                </div>
                                                <p style={{ fontWeight: 700 }}>${Number(item.subtotal).toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Card glass>
                                <CardBody>
                                    <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Customer Details</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--gray-500)' }}>Type</span>
                                            <span style={{ fontWeight: 600 }}>{order.type}</span>
                                        </div>
                                        {order.type === 'DineIn' ? (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--gray-500)' }}>Table</span>
                                                <span style={{ fontWeight: 600 }}>{order.tableNumber}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--gray-500)' }}>Name</span>
                                                    <span style={{ fontWeight: 600 }}>{order.customerName || 'N/A'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--gray-500)' }}>Phone</span>
                                                    <span style={{ fontWeight: 600 }}>{order.customerPhone || 'N/A'}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>

                            <Card glass>
                                <CardBody>
                                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Actions</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {order.status === 'Ready' && (
                                            <Button variant="success" onClick={() => handleStatusChange('Served')} loading={updating}>
                                                Mark as Served
                                            </Button>
                                        )}
                                        {order.status === 'Served' && (
                                            <Button variant="primary" onClick={() => setSelectedOrder(order)}>Proceed to Checkout</Button>
                                        )}
                                        {(order.status === 'New' || order.status === 'InProgress') && (
                                            <Button variant="danger" onClick={() => handleStatusChange('Cancelled')} loading={updating}>
                                                Cancel Order
                                            </Button>
                                        )}
                                        <Button variant="secondary" onClick={() => window.print()}>Print Receipt</Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </div>
            </DashboardLayout>

            {selectedOrder && (
                <PaymentModal
                    isOpen={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    order={selectedOrder}
                />
            )}
        </AuthGuard>
    );
}
