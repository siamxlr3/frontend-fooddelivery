'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetOrderByIdQuery } from '@/store/api/orderApi';
import { useGenerateBillMutation, useProcessPaymentMutation } from '@/store/api/billingApi'; // Updated import for billingApi
import styles from '@/components/orders/orders.module.css';

export default function CheckoutPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = Number(params.id);
    const { data: order, isLoading } = useGetOrderByIdQuery(orderId);

    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile'>('Cash');
    const [discount, setDiscount] = useState('0');
    const [generateBill, { isLoading: isGenerating }] = useGenerateBillMutation(); // New mutation
    const [processPayment, { isLoading: isProcessing }] = useProcessPaymentMutation(); // Existing mutation

    if (isLoading) return <div className={styles.loading}>Generating invoice...</div>;
    if (!order) return <div className={styles.container}>Order not found</div>;

    const subtotal = Number(order.totalAmount);
    const taxRate = 0.10; // Matches UI display
    const tax = subtotal * taxRate;
    const discountVal = Number(discount);
    const total = subtotal + tax - discountVal;

    const handleCheckout = async () => {
        try {
            // 1. Generate Bill first
            const bill = await generateBill({ orderId: order.id }).unwrap();

            // 2. Process Payment
            await processPayment({
                billId: bill.id,
                amount: total,
                method: paymentMethod,
            }).unwrap();

            alert('Payment Successful!');
            router.push('/dashboard/orders');
        } catch (error) {
            console.error('Payment failed:', error);
            alert('Payment processing failed');
        }
    };

    return (
        <AuthGuard allowedRoles={['Admin', 'Cashier']}>
            <DashboardLayout>
                <div className={styles.container} style={{ maxWidth: '800px' }}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Billing & Checkout</h1>
                        <p className={styles.subtitle}>Finalize payment for Order #{order.orderNumber.slice(0, 8)}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Order Summary */}
                        <Card glass>
                            <CardBody>
                                <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Order Summary</h3>
                                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span>{item.quantity}x {item.food?.name}</span>
                                            <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Subtotal</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Tax (10%)</span>
                                        <span>${tax.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                                        <span>Discount</span>
                                        <span>-${discountVal.toFixed(2)}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '1.5rem',
                                        fontWeight: 900,
                                        marginTop: '1rem',
                                        paddingTop: '1rem',
                                        borderTop: '2px solid var(--primary-500)',
                                        color: 'var(--primary-400)'
                                    }}>
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Payment Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Card glass>
                                <CardBody>
                                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Payment Method</h3>
                                    <div className={styles.orderTypeGrid} style={{ marginBottom: 0 }}>
                                        <button
                                            className={`${styles.typeBtn} ${paymentMethod === 'Cash' ? styles.active : ''}`}
                                            onClick={() => setPaymentMethod('Cash')}
                                        >
                                            💵 Cash
                                        </button>
                                        <button
                                            className={`${styles.typeBtn} ${paymentMethod === 'Card' ? styles.active : ''}`}
                                            onClick={() => setPaymentMethod('Card')}
                                        >
                                            💳 Card
                                        </button>
                                        <button
                                            className={`${styles.typeBtn} ${paymentMethod === 'Mobile' ? styles.active : ''}`}
                                            onClick={() => setPaymentMethod('Mobile')}
                                            style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}
                                        >
                                            📱 Mobile Payment
                                        </button>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card glass>
                                <CardBody>
                                    <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>Apply Discount</h3>
                                    <Input
                                        type="number"
                                        placeholder="Enter discount amount"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        icon={<span>$</span>}
                                    />
                                </CardBody>
                            </Card>

                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleCheckout}
                                disabled={isProcessing}
                                style={{ height: '60px', fontSize: '1.25rem' }}
                            >
                                {isProcessing ? 'Processing...' : 'Complete Payment'}
                            </Button>

                            <Button variant="secondary" onClick={() => window.print()}>
                                🖨️ Print Receipt Preview
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
