'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetFoodsQuery, useGetCategoriesQuery } from '@/store/api/menuApi';
import { useCreateOrderMutation, useGetOrdersQuery } from '@/store/api/orderApi';
import type { Order } from '@/store/api/orderApi';
import { useGetTablesQuery } from '@/store/api/tableApi';
import { useGetCurrentSessionQuery } from '@/store/api/sessionApi';
import { useGetBookingsQuery } from '@/store/api/bookingApi';
import { Modal } from '@/components/ui/Modal';
import type { Food } from '@/store/api/menuApi';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import styles from '../orders.module.css';

interface CartItem {
    cartId: string;
    foodId: number;
    name: string;
    price: number;
    quantity: number;
    notes: string;
    image?: string;
    customizations: string[];
}

export default function NewOrderPage() {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: currentSession, isLoading: sessionLoading } = useGetCurrentSessionQuery();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderType, setOrderType] = useState<'DineIn' | 'Takeaway'>('DineIn');
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [showError, setShowError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
    const [currentCustomizationFood, setCurrentCustomizationFood] = useState<Food | null>(null);
    const [customizationConfig, setCustomizationConfig] = useState<{ type: 'radio' | 'checkbox', options: string[] } | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const SPECIAL_ITEMS_CONFIG: { [key: string]: { type: 'radio' | 'checkbox', options: string[] } } = {
        'pizza': {
            type: 'radio',
            options: ['9 Inch', '12 Inch', '16 Inch']
        },
        'burger': {
            type: 'checkbox',
            options: ['Extra Patty', 'Extra Sauce', 'Extra Spicy']
        }
    };

    const { data: foodsResponse, isLoading: foodsLoading } = useGetFoodsQuery({
        keyword: searchTerm,
        categoryId: selectedCategory,
        take: 50,
    });
    const { data: categoriesResponse } = useGetCategoriesQuery({ take: 100 });
    const { data: tables = [] } = useGetTablesQuery();
    const { data: bookings = [] } = useGetBookingsQuery();
    const { data: ordersResponse } = useGetOrdersQuery({ page: 1, take: 100 });
    const orders = ordersResponse?.data || [];

    const foods = foodsResponse?.data?.data || [];
    const categories = categoriesResponse?.data?.data || [];

    const [createOrder, { isLoading: submitting }] = useCreateOrderMutation();

    const addToCart = (food: Food) => {
        const lowerName = food.name.toLowerCase();
        let config = null;

        if (lowerName.includes('pizza')) {
            config = SPECIAL_ITEMS_CONFIG['pizza'];
        } else if (lowerName.includes('burger')) {
            config = SPECIAL_ITEMS_CONFIG['burger'];
        }

        if (config) {
            setCurrentCustomizationFood(food);
            setCustomizationConfig(config);
            // Default select first option for Radio (required size), none for Checkbox (optional extras)
            setSelectedOptions(config.type === 'radio' ? [config.options[0]] : []);
            setCustomizationModalOpen(true);
            return;
        }

        addItemToCartInternal(food, [], '');
    };

    const addItemToCartInternal = (food: Food, customizations: string[] = [], additionalNotes: string = '') => {
        setCart(prev => {
            const existing = prev.find(item =>
                item.foodId === food.id &&
                JSON.stringify(item.customizations?.sort()) === JSON.stringify(customizations.sort())
            );

            const itemPrice = Number(food.price);
            const discount = Number(food.discountPercentage || 0);
            const discountedPrice = itemPrice - (itemPrice * discount / 100);

            if (existing) {
                return prev.map(item =>
                    item.cartId === existing.cartId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...prev, {
                cartId: `${Date.now()}-${Math.random()}`,
                foodId: food.id,
                name: food.name,
                price: discountedPrice,
                quantity: 1,
                notes: additionalNotes,
                image: food.image,
                customizations: customizations
            }];
        });
    };

    const handleCustomizationConfirm = () => {
        if (!currentCustomizationFood) return;

        // Add item to cart with selected options (even if empty)
        addItemToCartInternal(currentCustomizationFood, selectedOptions, '');

        setCustomizationModalOpen(false);
        setCurrentCustomizationFood(null);
        setCustomizationConfig(null);
        setSelectedOptions([]);
    };

    const toggleOption = (option: string) => {
        if (!customizationConfig) return;

        if (customizationConfig.type === 'radio') {
            setSelectedOptions(prev => {
                // Allow deselecting the active radio option
                if (prev.includes(option)) {
                    return [];
                }
                return [option];
            });
        } else {
            setSelectedOptions(prev => {
                if (prev.includes(option)) {
                    return prev.filter(o => o !== option);
                } else {
                    return [...prev, option];
                }
            });
        }
    };

    const updateQuantity = (cartId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.cartId === cartId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const updateNotes = (cartId: string, notes: string) => {
        setCart(prev => prev.map(item =>
            item.cartId === cartId ? { ...item, notes } : item
        ));
    };

    const subtotal = useMemo(() =>
        cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        [cart]);

    const handleSubmitOrder = async () => {
        if (cart.length === 0) return;

        if (orderType === 'DineIn') {
            if (!tableNumber) {
                setErrorMsg('Please enter a table number');
                setShowError(true);
                return;
            }

            // 1. Check if table exists
            const tableExists = tables.some((t: any) => t.number === tableNumber);
            if (!tableExists) {
                setErrorMsg(`Table "${tableNumber}" does not exist in the system.`);
                setShowError(true);
                return;
            }

            // 2. Check if table is occupied (active order exists)
            const isOccupied = orders.some((o: Order) =>
                o.tableNumber === tableNumber &&
                o.status !== 'Paid' &&
                o.status !== 'Cancelled'
            );

            if (isOccupied) {
                setErrorMsg(`Table "${tableNumber}" is currently occupied. Please select an empty table.`);
                setShowError(true);
                return;
            }

            // 3. Check if table is reserved
            const activeBooking = bookings.find((b: any) =>
                b.table?.number === tableNumber && b.status === 'Reserved'
            );

            if (activeBooking) {
                setErrorMsg(`Table "${tableNumber}" is reserved for ${activeBooking.customerName}. Please select another table.`);
                setShowError(true);
                return;
            }
        } else {
            // Takeaway validation
            if (!customerName.trim()) {
                setErrorMsg('Please enter a customer name for Takeaway orders.');
                setShowError(true);
                return;
            }
        }

        const orderData = {
            type: orderType,
            tableNumber: orderType === 'DineIn' ? tableNumber : undefined,
            customerName: orderType === 'Takeaway' ? customerName : undefined,
            customerPhone: orderType === 'Takeaway' ? customerPhone : undefined,
            items: cart.map(item => {
                // Merge customizations and notes
                const finalNotesParts = [];
                if (item.customizations && item.customizations.length > 0) {
                    finalNotesParts.push(`Options: ${item.customizations.join(', ')}`);
                }
                if (item.notes && item.notes.trim()) {
                    finalNotesParts.push(item.notes.trim());
                }

                return {
                    foodId: item.foodId,
                    quantity: item.quantity,
                    notes: finalNotesParts.join(' | ')
                };
            })
        };

        try {
            await createOrder(orderData).unwrap();
            router.push('/dashboard/orders');
        } catch (error: any) {
            console.error('Order creation failed:', error);

            // Check if it's a session error
            if (error?.data?.requireSession || error?.data?.message?.includes('session')) {
                setErrorMsg('No active session found. Please start a session first.');
                setShowError(true);
                // Auto-redirect to sessions page after 2 seconds
                setTimeout(() => {
                    router.push('/dashboard/cashier/sessions');
                }, 2000);
            } else {
                setErrorMsg(error?.data?.message || 'Failed to place order');
                setShowError(true);
            }
        }
    };

    return (
        <AuthGuard allowedRoles={['Admin', 'Waiter', 'Cashier']}>
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Create New Order</h1>
                        <p className={styles.subtitle}>Select items and configure order details</p>
                    </div>

                    {/* Session Warning for Cashier/Admin */}
                    {(user?.role === 'Cashier' || user?.role === 'Admin') && !sessionLoading && !currentSession && (
                        <Card glass style={{
                            marginBottom: '1.5rem',
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                            border: '2px solid rgba(239, 68, 68, 0.3)'
                        }}>
                            <CardBody>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ fontSize: '3rem' }}>🚫</div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 700,
                                            marginBottom: '0.5rem',
                                            color: '#ef4444'
                                        }}>
                                            No Active Session
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                            You must start a cashier session before creating orders. This ensures all sales are properly tracked.
                                        </p>
                                        <Button
                                            variant="danger"
                                            onClick={() => router.push('/dashboard/cashier/sessions')}
                                        >
                                            🚀 Start Session Now
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    <div className={styles.layout}>
                        {/* Menu Items */}
                        <div className={styles.menuSection}>
                            <div className={styles.menuHeader}>
                                <div className={styles.searchWrapper}>
                                    <Input
                                        placeholder="Search menu..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        icon={<span>🔍</span>}
                                    />
                                </div>
                                <select
                                    className={styles.categorySelect}
                                    value={selectedCategory || ''}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value ? Number(e.target.value) : undefined);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {foodsLoading ? (
                                <div className={styles.loading}>Loading menu masterpieces...</div>
                            ) : (
                                <>
                                    <div className={styles.foodGrid}>
                                        {(() => {
                                            const itemsPerPage = 10;
                                            const startIndex = (currentPage - 1) * itemsPerPage;
                                            const endIndex = startIndex + itemsPerPage;
                                            const currentFoods = foods.slice(startIndex, endIndex);

                                            return currentFoods.map(food => (
                                                <Card key={food.id} glass hover className={styles.foodCard}>
                                                    <CardBody>
                                                        <div className={styles.foodImage}>
                                                            {food.image ? (
                                                                <img src={food.image} alt={food.name} />
                                                            ) : (
                                                                <div className={styles.placeholderImg}>🍽️</div>
                                                            )}
                                                            {food.discountPercentage > 0 && (
                                                                <div className={styles.discountBadge}>
                                                                    {Number(food.discountPercentage)}% OFF
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={styles.foodInfo}>
                                                            <h3 className={styles.foodName}>{food.name}</h3>
                                                            <p className={styles.foodDesc}>{food.description}</p>
                                                            <div className={styles.foodFooter}>
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    {Number(food.discountPercentage) > 0 ? (
                                                                        <>
                                                                            <span className={styles.oldPrice}>${Number(food.price).toFixed(2)}</span>
                                                                            <span className={styles.price}>
                                                                                ${(Number(food.price) - (Number(food.price) * Number(food.discountPercentage) / 100)).toFixed(2)}
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <span className={styles.price}>${Number(food.price).toFixed(2)}</span>
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    onClick={() => addToCart(food)}
                                                                    disabled={!food.status}
                                                                >
                                                                    {food.status ? 'Add' : 'Out'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ));
                                        })()}
                                    </div>

                                    {foods.length > 0 && (
                                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            >
                                                Previous
                                            </Button>
                                            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                Page {currentPage} of {Math.ceil(foods.length / 10)}
                                            </span>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                disabled={currentPage >= Math.ceil(foods.length / 10)}
                                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(foods.length / 10), prev + 1))}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Cart / Order Details */}
                        <div className={styles.cartSection}>
                            <div className={styles.cartHeader}>
                                <h2><span>🛒</span> Current Order</h2>
                            </div>

                            <div className={styles.cartItems}>
                                {cart.length === 0 ? (
                                    <div className={styles.emptyCart}>
                                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🥡</div>
                                        <p>Your cart is empty</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Add delicious items from the left</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.cartId} className={styles.cartItem}>
                                            <div className={styles.itemHeader}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span className={styles.itemName}>{item.name}</span>
                                                    {item.customizations && item.customizations.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                                            {item.customizations.map((opt, idx) => (
                                                                <span key={idx} style={{
                                                                    fontSize: '0.75rem',
                                                                    background: 'rgba(16, 185, 129, 0.15)',
                                                                    color: '#10b981',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                                                }}>
                                                                    {opt}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                            <div className={styles.itemControls}>
                                                <div className={styles.qtyControls}>
                                                    <button className={styles.qtyBtn} onClick={() => updateQuantity(item.cartId, -1)}>−</button>
                                                    <span>{item.quantity}</span>
                                                    <button className={styles.qtyBtn} onClick={() => updateQuantity(item.cartId, 1)}>+</button>
                                                </div>
                                                <Input
                                                    placeholder="Special instructions..."
                                                    value={item.notes}
                                                    onChange={(e) => updateNotes(item.cartId, e.target.value)}
                                                    className={styles.notesArea}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className={styles.cartFooter}>
                                <div className={styles.orderTypeGrid}>
                                    <button
                                        className={`${styles.typeBtn} ${orderType === 'DineIn' ? styles.active : ''}`}
                                        onClick={() => setOrderType('DineIn')}
                                    >
                                        Dine-In
                                    </button>
                                    <button
                                        className={`${styles.typeBtn} ${orderType === 'Takeaway' ? styles.active : ''}`}
                                        onClick={() => setOrderType('Takeaway')}
                                    >
                                        Takeaway
                                    </button>
                                </div>

                                <div className={styles.orderFields}>
                                    {orderType === 'DineIn' ? (
                                        <div style={{ position: 'relative' }}>
                                            <Input
                                                placeholder={`Table No (Avail: ${tables
                                                    .filter((t: any) => {
                                                        const occupied = orders.some((o: Order) => o.tableNumber === t.number && o.status !== 'Paid' && o.status !== 'Cancelled');
                                                        const reserved = bookings.some((b: any) => b.tableId === t.id && b.status === 'Reserved');
                                                        return !occupied && !reserved;
                                                    })
                                                    .map((t: any) => t.number).join(', ')})`}
                                                value={tableNumber}
                                                onChange={(e) => setTableNumber(e.target.value)}
                                                error={tableNumber ? (
                                                    !tables.some((t: any) => t.number === tableNumber) ? 'Table does not exist' : ''
                                                ) : ''}
                                                required
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <Input
                                                placeholder="Customer Name"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                            />
                                            <Input
                                                placeholder="Customer Phone"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                            />
                                        </>
                                    )}
                                </div>

                                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                    <div className={styles.summaryRow}>
                                        <span className={styles.totalLabel}>Total Amount</span>
                                        <span className={styles.totalValue}>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <button
                                        className={styles.submitBtn}
                                        onClick={handleSubmitOrder}
                                        disabled={cart.length === 0 || submitting}
                                    >
                                        {submitting ? 'Placing Order...' : 'Place Order'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>

            {/* Customization Modal */}
            <Modal
                isOpen={customizationModalOpen}
                onClose={() => setCustomizationModalOpen(false)}
                title={`Customize ${currentCustomizationFood?.name}`}
                size="md"
            >
                <div style={{ padding: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        {customizationConfig?.type === 'checkbox' ? 'Optional: Select any extras you would like.' : 'Please select one option:'}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {customizationConfig?.options.map(option => (
                            <div
                                key={option}
                                onClick={() => toggleOption(option)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: selectedOptions.includes(option) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                    border: selectedOptions.includes(option) ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: customizationConfig.type === 'radio' ? '50%' : '6px',
                                    border: '2px solid',
                                    borderColor: selectedOptions.includes(option) ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                                    marginRight: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {selectedOptions.includes(option) && (
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: customizationConfig.type === 'radio' ? '50%' : '2px',
                                            background: '#10b981'
                                        }} />
                                    )}
                                </div>
                                <span style={{
                                    color: selectedOptions.includes(option) ? '#10b981' : 'var(--text-main)',
                                    fontWeight: 600
                                }}>
                                    {option}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button variant="secondary" onClick={() => setCustomizationModalOpen(false)}>
                            Cancel Item
                        </Button>
                        <Button variant="primary" onClick={handleCustomizationConfirm}>
                            Add to Cart
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Error Popup */}
            <Modal

                isOpen={showError}
                onClose={() => setShowError(false)}
                title="⚠️ Order Issue"
                size="sm"
            >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
                    <p style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>{errorMsg}</p>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => setShowError(false)}
                    >
                        Got it
                    </Button>
                </div>
            </Modal>
        </AuthGuard>
    );
}
