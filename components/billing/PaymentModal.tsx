'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createPortal } from 'react-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGenerateBillMutation, useProcessPaymentMutation } from '@/store/api/billingApi';
import { sessionApi } from '@/store/api/sessionApi';
import { useGetSettingsQuery } from '@/store/api/settingsApi';
import type { Order } from '@/store/api/orderApi';
import styles from '@/components/orders/orders.module.css';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
}

export const PaymentModal = ({ isOpen, onClose, order }: PaymentModalProps) => {
    const dispatch = useDispatch();
    const { data: settings } = useGetSettingsQuery();
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile'>('Cash');
    const [discount, setDiscount] = useState('0');
    const [generatedBill, setGeneratedBill] = useState<any>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [generateBill] = useGenerateBillMutation();
    const [processPayment, { isLoading: isProcessing }] = useProcessPaymentMutation();

    const subtotal = Number(order.totalAmount);

    // Use settings for tax and discount
    const taxPercentage = parseFloat(settings?.tax_rate || '0');
    const defaultDiscountPercentage = parseFloat(settings?.discount_rate || '0');

    useEffect(() => {
        if (settings && settings.discount_rate) {
            const calculatedDiscount = (subtotal * parseFloat(settings.discount_rate)) / 100;
            setDiscount(calculatedDiscount.toFixed(2));
        }
    }, [settings, subtotal]);

    const tax = (subtotal * taxPercentage) / 100;
    const discountVal = Number(discount) || 0;
    const total = Math.max(0, subtotal + tax - discountVal);

    const handlePayment = async () => {
        try {
            // 1. Generate Bill
            // We pass the calculated values to the backend so it matches what the user sees
            const bill = await generateBill({
                orderId: order.id,
                tax: tax,
                discount: discountVal
            }).unwrap();
            setGeneratedBill(bill);

            // 2. Process Payment
            await processPayment({
                billId: bill.id,
                amount: total,
                method: paymentMethod,
            }).unwrap();

            // Force refresh of session sales data
            dispatch(sessionApi.util.invalidateTags(['Session']));

            // 3. Trigger Print - Set state
            setIsPrinting(true);
        } catch (error) {
            console.error('Payment failed:', error);
            alert('Payment processing failed. Please try again.');
        }
    };

    // Effect to handle automatic printing when ready
    useEffect(() => {
        if (isPrinting && generatedBill) {
            const timer = setTimeout(() => {
                window.print();
                setIsPrinting(false);
                onClose();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isPrinting, generatedBill, onClose]);

    const billSlipContent = (
        <div className="print-container">
            <div className="thermal-bill-slip">
                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h1 className="bill-slip-title">SIAM XLR</h1>
                    <div className="bill-slip-info">
                        <p style={{ fontWeight: 'bold' }}>FINE DINING RESTAURANT</p>
                        <p>123 Gourmet St, Dhaka, Bangladesh</p>
                        <p>VAT Reg: 123456789-001</p>
                        <p>Tel: +880 1234-567890</p>
                    </div>
                </div>

                <div className="bill-slip-line-double" />

                {/* Transaction Metadata */}
                <div className="bill-slip-info" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    <span>INV: {generatedBill?.invoiceNumber || order.orderNumber.slice(-8).toUpperCase()}</span>
                    <span style={{ textAlign: 'right' }}>DATE: {new Date().toLocaleDateString()}</span>
                    <span>TABLE: {order.tableNumber || 'N/A'} ({order.type})</span>
                    <span style={{ textAlign: 'right' }}>TIME: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    <span>CASHIER: SYSTEM</span>
                </div>

                <div className="bill-slip-line" />

                {/* Items Table */}
                <div style={{ fontWeight: 'bold', fontSize: '10pt', display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span>DESCRIPTION</span>
                    <span>AMOUNT</span>
                </div>

                <div className="bill-slip-line" />

                <div style={{ minHeight: '50px' }}>
                    {order.items?.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '6px' }}>
                            <div className="bill-slip-item-row">
                                <span style={{ fontWeight: 'bold' }}>{item.food?.name?.toUpperCase()}</span>
                                <span>${(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                            </div>
                            <div className="bill-slip-item-details">
                                {item.quantity} PCS x ${Number(item.unitPrice).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bill-slip-line-double" />

                {/* Totals Section */}
                <div className="bill-slip-info">
                    <div className="bill-slip-item-row">
                        <span>SUB TOTAL:</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="bill-slip-item-row">
                        <span>VAT ({taxPercentage}%):</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    {discountVal > 0 && (
                        <div className="bill-slip-item-row" style={{ color: '#000' }}>
                            <span>DISCOUNT:</span>
                            <span>-${discountVal.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div className="bill-slip-line" />

                <div className="bill-slip-total-row">
                    <span>NET AMOUNT:</span>
                    <span>${total.toFixed(2)}</span>
                </div>

                <div className="bill-slip-line" />

                {/* Payment Detail */}
                <div className="bill-slip-info" style={{ marginTop: '5px' }}>
                    <div className="bill-slip-item-row">
                        <span>PAYMENT TYPE:</span>
                        <span style={{ fontWeight: 'bold' }}>{paymentMethod.toUpperCase()}</span>
                    </div>
                    <div className="bill-slip-item-row">
                        <span>STATUS:</span>
                        <span style={{ fontWeight: 'bold' }}>PAID</span>
                    </div>
                </div>

                <div className="bill-slip-line-double" style={{ marginTop: '10px' }} />

                {/* Footer */}
                <div className="bill-slip-footer">
                    <p style={{ fontWeight: 'bold', fontSize: '10pt' }}>THANK YOU FOR YOUR VISIT!</p>
                    <p>PLEASE COME AGAIN</p>
                    <p style={{ fontSize: '7pt', marginTop: '5px' }}>Powered by Antigravity POS v2.0</p>

                    <div className="receipt-barcode">
                        {order.orderNumber.toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Checkout #${order.orderNumber.slice(0, 8)}`} size="lg">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Summary Section */}
                    <div>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Order Summary</h4>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.5rem' }}>
                            {order.items?.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-main)' }}>{item.quantity}x {item.food?.name}</span>
                                    <span style={{ color: 'var(--text-main)' }}>${(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Tax ({taxPercentage}%)
                                    <span style={{
                                        fontSize: '0.7rem',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '4px',
                                        color: 'var(--text-muted)'
                                    }}>
                                        System
                                    </span>
                                </span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', marginBottom: '0.5rem' }}>
                                <span>Discount</span>
                                <span>-${discountVal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, marginTop: '1rem', color: 'var(--primary-color)' }}>
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Payment Method</h4>
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
                                    style={{ gridColumn: 'span 2' }}
                                >
                                    📱 Mobile
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-main)'
                            }}>
                                Discount Amount
                                <span style={{
                                    fontSize: '0.7rem',
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px',
                                    color: '#10b981'
                                }}>
                                    Default: {defaultDiscountPercentage}%
                                </span>
                            </label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                icon={<span>$</span>}
                            />
                            <p style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginTop: '0.25rem'
                            }}>
                                💡 Pre-filled from system settings, adjustable per order
                            </p>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <Button
                                variant="primary"
                                size="lg"
                                style={{ width: '100%', marginBottom: '0.5rem' }}
                                onClick={handlePayment}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Processing Transaction...' : `Pay $${total.toFixed(2)}`}
                            </Button>
                            <Button variant="secondary" size="sm" style={{ width: '100%' }} onClick={onClose}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
            {typeof document !== 'undefined' && createPortal(billSlipContent, document.body)}
        </>
    );
};
