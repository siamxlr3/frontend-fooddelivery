'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/orderApi';
import { useGenerateBillMutation, useProcessPaymentMutation } from '@/store/api/billingApi';
import type { Order, OrderStatus } from '@/store/api/orderApi';
import type { Bill } from '@/store/api/billingApi';
import styles from './orders.module.css';

export default function OrdersPage() {
    // State
    const [view, setView] = useState<'kitchen' | 'cashier'>('kitchen');

    // Billing State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeBill, setActiveBill] = useState<Bill | null>(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile'>('Cash');
    const [discountCode, setDiscountCode] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [page, setPage] = useState(1);
    const take = 20; // Increased page size since we have more space

    // Determine status filter based on view
    const statusFilter = useMemo(() => {
        if (view === 'kitchen') return 'New,InProgress';
        if (view === 'cashier') return 'New,InProgress,Ready,Served';
        return undefined;
    }, [view]);

    const { data: ordersResponse } = useGetOrdersQuery({
        page,
        take,
        status: statusFilter
    }, {
        pollingInterval: 5000,
    });

    const [updateStatus] = useUpdateOrderStatusMutation();
    const [generateBill, { isLoading: isGeneratingBill }] = useGenerateBillMutation();
    const [processPayment, { isLoading: isProcessingPayment }] = useProcessPaymentMutation();

    // Reset page when switching views
    useEffect(() => {
        setPage(1);
    }, [view]);

    const orders = ordersResponse?.data || [];
    const totalOrders = ordersResponse?.total || 0;
    const totalPages = ordersResponse?.totalPages || 1;


    const statusFlow: OrderStatus[] = ['New', 'InProgress', 'Ready', 'Served', 'Paid'];

    const handleStatusUpdate = async (id: number, currentStatus: OrderStatus) => {
        const nextIdx = statusFlow.indexOf(currentStatus) + 1;
        if (nextIdx < statusFlow.length) {
            await updateStatus({ id, status: statusFlow[nextIdx] }).unwrap();
        }
    };

    const handleOpenCheckout = async (order: Order) => {
        try {
            setSelectedOrder(order);
            const bill = await generateBill({ orderId: order.id }).unwrap();
            setActiveBill(bill);
            setPaymentSuccess(false);
            setShowCheckoutModal(true);
        } catch (err) {
            alert('Failed to generate bill');
        }
    };

    const handlePayment = async () => {
        if (!activeBill) return;
        try {
            await processPayment({
                billId: activeBill.id,
                amount: activeBill.grandTotal,
                method: paymentMethod,
                reference: paymentMethod !== 'Cash' ? `REF-${Date.now()}` : undefined
            }).unwrap();
            setPaymentSuccess(true);
        } catch (err) {
            alert('Payment processing failed');
        }
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    return (
        <AuthGuard allowedRoles={['Admin', 'Cashier', 'Waiter', 'KitchenStaff']}>
            <DashboardLayout>
                <div className={styles.posContainer}>
                    <div className={styles.menuSection}>
                        <div className={styles.menuHeader}>
                            <Button variant={view === 'kitchen' ? 'primary' : 'secondary'} onClick={() => setView('kitchen')}>Kitchen View</Button>
                            <Button variant={view === 'cashier' ? 'primary' : 'secondary'} onClick={() => setView('cashier')}>Cashier View</Button>
                        </div>

                        <div className={styles.ordersListContainer}>
                            <div className={styles.orderStatusList} style={{ overflowY: 'auto' }}>
                                {orders.map(order => (
                                    <Card key={order.id} glass className={styles.orderItemCard}>
                                        <CardBody>
                                            <div className={styles.orderHeader}>
                                                <div>
                                                    <h3 className={styles.orderID}>#{order.orderNumber.slice(0, 8)}</h3>
                                                    <p className={styles.orderSub}>
                                                        {order.type} {order.tableNumber ? `• Table ${order.tableNumber}` : ''}
                                                    </p>
                                                </div>
                                                <span className={`${styles.statusBadge} ${styles['status-' + order.status]}`}>{order.status}</span>
                                            </div>
                                            <div style={{ margin: '1rem 0' }}>
                                                {order.items.map(item => (
                                                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '0.5rem' }}>
                                                        <div className={styles.orderItemRow}>
                                                            <span style={{ fontWeight: 600 }}>{item.quantity}x {item.food?.name}</span>
                                                            <span>${Number(item.subtotal).toFixed(2)}</span>
                                                        </div>
                                                        {item.notes && <p className={styles.orderNote}>📝 {item.notes}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                                {view === 'kitchen' && order.status === 'New' && <Button size="sm" variant="primary" fullWidth onClick={() => handleStatusUpdate(order.id, 'New')}>Start Cooking</Button>}
                                                {view === 'kitchen' && order.status === 'InProgress' && <Button size="sm" variant="success" fullWidth onClick={() => handleStatusUpdate(order.id, 'InProgress')}>Mark as Ready</Button>}
                                                {view === 'cashier' && order.status === 'Ready' && <Button size="sm" variant="primary" fullWidth onClick={() => handleStatusUpdate(order.id, 'Ready')}>Mark Served</Button>}
                                                {view === 'cashier' && order.status === 'Served' && <Button size="sm" variant="success" fullWidth onClick={() => handleOpenCheckout(order)}>Collect Payment</Button>}
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>

                            {/* Detailed Pagination */}
                            <div className={styles.pagination}>
                                <button
                                    className={styles.pageBtn}
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    title="Previous Page"
                                >
                                    ‹
                                </button>

                                <div className={styles.pageNumbers}>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => {
                                            // Only show current page, first, last, and pages around current
                                            return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                                        })
                                        .map((p, i, arr) => {
                                            const elements = [];
                                            // Add ellipsis
                                            if (i > 0 && p - arr[i - 1] > 1) {
                                                elements.push(<span key={`ellipsis-${p}`} style={{ color: 'var(--text-muted)' }}>...</span>);
                                            }
                                            elements.push(
                                                <button
                                                    key={p}
                                                    className={`${styles.pageBtn} ${page === p ? styles.active : ''}`}
                                                    onClick={() => setPage(p)}
                                                >
                                                    {p}
                                                </button>
                                            );
                                            return elements;
                                        })
                                    }
                                </div>

                                <button
                                    className={styles.pageBtn}
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    title="Next Page"
                                >
                                    ›
                                </button>

                                <span className={styles.pageInfo}>
                                    {take} items per page • {totalOrders} total
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Removed Cart Section */}
                </div>

                {/* Checkout & Payment Modal */}
                <Modal
                    isOpen={showCheckoutModal}
                    onClose={() => setShowCheckoutModal(false)}
                    title={paymentSuccess ? "Order Completed" : "Checkout"}
                    size="md"
                >
                    {!paymentSuccess ? (
                        <div className={styles.checkoutContainer}>
                            <div className={styles.checkoutSummary}>
                                <h3 style={{ marginBottom: '1rem' }}>Order Summary (#{selectedOrder?.orderNumber.slice(0, 8)})</h3>
                                {selectedOrder?.items.map(item => (
                                    <div key={item.id} className={styles.checkoutItem}>
                                        <span>{item.quantity}x {item.food?.name}</span>
                                        <span>${Number(item.subtotal).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className={styles.divider} />
                                <div className={styles.checkoutItem}><span>Subtotal</span><span>${Number(activeBill?.subtotal).toFixed(2)}</span></div>
                                <div className={styles.checkoutItem}><span>Tax (5%)</span><span>${Number(activeBill?.tax).toFixed(2)}</span></div>
                                <div className={styles.checkoutItem}><span>Discount</span><span style={{ color: '#10b981' }}>-${Number(activeBill?.discount).toFixed(2)}</span></div>
                                <div className={styles.divider} />
                                <div className={styles.checkoutItem} style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                                    <span>Total Amount</span>
                                    <span style={{ color: 'var(--primary-color)' }}>${Number(activeBill?.grandTotal).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className={styles.paymentSection}>
                                <h4 style={{ marginBottom: '0.5rem' }}>Select Payment Method</h4>
                                <div className={styles.paymentGrid}>
                                    {(['Cash', 'Card', 'Mobile'] as const).map(method => (
                                        <div
                                            key={method}
                                            className={`${styles.paymentOption} ${paymentMethod === method ? styles.active : ''}`}
                                            onClick={() => setPaymentMethod(method)}
                                        >
                                            <span>{method === 'Cash' ? '💵' : method === 'Card' ? '💳' : '📱'}</span>
                                            {method}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.discountSection}>
                                <Input
                                    placeholder="Enter Coupon Code"
                                    fullWidth
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                />
                                <Button variant="secondary">Apply</Button>
                            </div>

                            <Button
                                variant="primary"
                                fullWidth
                                size="lg"
                                onClick={handlePayment}
                                loading={isProcessingPayment}
                            >
                                Process Payment (${Number(activeBill?.grandTotal).toFixed(2)})
                            </Button>
                        </div>
                    ) : (
                        <div className={styles.receiptDisplay}>
                            <div className={styles.successIcon}>✓</div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Payment Successful!</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
                                Invoice #{activeBill?.invoiceNumber} has been generated.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button variant="secondary" fullWidth onClick={handlePrintReceipt}>Print Receipt</Button>
                                <Button variant="primary" fullWidth onClick={() => setShowCheckoutModal(false)}>Done</Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Print Receipt (Hidden) */}
                <div className={`${styles.receiptPrint} print-only`}>
                    <div style={{ textAlign: 'center' }}>
                        <h2>RESTAURANT POS</h2>
                        <p>123 Foodie Street, Digital City</p>
                        <hr />
                    </div>
                    <p><strong>Invoice:</strong> {activeBill?.invoiceNumber}</p>
                    <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
                    <p><strong>Order:</strong> {selectedOrder?.orderNumber}</p>
                    <hr />
                    <table style={{ width: '100%', textAlign: 'left' }}>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Amt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedOrder?.items.map(item => (
                                <tr key={item.id}>
                                    <td>{item.food?.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>${Number(item.subtotal).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <hr />
                    <div style={{ textAlign: 'right' }}>
                        <p>Subtotal: ${Number(activeBill?.subtotal).toFixed(2)}</p>
                        <p>Tax: ${Number(activeBill?.tax).toFixed(2)}</p>
                        <p><strong>Total: ${Number(activeBill?.grandTotal).toFixed(2)}</strong></p>
                        <p>Method: {paymentMethod}</p>
                    </div>
                    <hr />
                    <p style={{ textAlign: 'center' }}>Thank you for visiting!</p>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
