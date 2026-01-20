'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { useGetSettingsQuery, useUpdateSettingsMutation, useUploadLogoMutation } from '@/store/api/settingsApi';
import { useGetFoodsQuery, useUpdateItemDiscountsMutation } from '@/store/api/menuApi';
import { toast } from 'react-hot-toast';
import styles from '../admin.module.css';

const SettingsPage = () => {
    const { data: settings, isLoading } = useGetSettingsQuery();
    const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();
    const [uploadLogo, { isLoading: isUploadingLogo }] = useUploadLogoMutation();

    const [taxRate, setTaxRate] = useState<string>('0');
    const [discountRate, setDiscountRate] = useState<string>('0');
    const [restaurantName, setRestaurantName] = useState<string>('');
    const [restaurantLogo, setRestaurantLogo] = useState<string>('');
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // Item-specific discounts state
    const [foodsPage, setFoodsPage] = useState(1);
    const { data: foodsData, isLoading: isLoadingFoods } = useGetFoodsQuery({ page: foodsPage, take: 10 });
    const [updateItemDiscounts, { isLoading: isUpdatingItems }] = useUpdateItemDiscountsMutation();
    const [itemDiscounts, setItemDiscounts] = useState<{ [key: number]: string }>({});

    const totalFoods = foodsData?.data?.total || 0;
    const totalFoodsPages = Math.ceil(totalFoods / 10);

    useEffect(() => {
        if (settings) {
            setTaxRate(settings.tax_rate || '0');
            setDiscountRate(settings.discount_rate || '0');
            setRestaurantName(settings.restaurant_name || '');
            setRestaurantLogo(settings.restaurant_logo || '');
        }
    }, [settings]);

    useEffect(() => {
        if (foodsData?.data?.data) {
            setItemDiscounts(prev => {
                const next = { ...prev };
                foodsData.data.data.forEach(food => {
                    if (next[food.id] === undefined) {
                        next[food.id] = food.discountPercentage.toString();
                    }
                });
                return next;
            });
        }
    }, [foodsData]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setRestaurantLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate inputs
        const tax = parseFloat(taxRate);
        const discount = parseFloat(discountRate);

        if (tax < 0 || tax > 100) {
            toast.error('Tax rate must be between 0 and 100');
            return;
        }

        if (discount < 0 || discount > 100) {
            toast.error('Discount rate must be between 0 and 100');
            return;
        }

        try {
            // First upload logo if changed
            if (logoFile) {
                const formData = new FormData();
                formData.append('logo', logoFile);
                await uploadLogo(formData).unwrap();
                setLogoFile(null); // Reset after upload
            }

            // Then update other settings
            await updateSettings({
                settings: {
                    tax_rate: taxRate,
                    discount_rate: discountRate,
                    restaurant_name: restaurantName
                }
            }).unwrap();
            // Toast notification is handled by socket listener
        } catch (err) {
            toast.error('Failed to update global settings');
        }
    };


    const handleItemDiscountChange = (id: number, value: string) => {
        setItemDiscounts(prev => ({ ...prev, [id]: value }));
    };

    const handleUpdateItemDiscounts = async () => {
        const discounts = Object.entries(itemDiscounts).map(([id, discount]) => ({
            id: parseInt(id),
            discountPercentage: parseFloat(discount) || 0
        }));

        try {
            await updateItemDiscounts({ discounts }).unwrap();
            // Toast notification is handled by socket listener
        } catch (err) {
            toast.error('Failed to update item discounts');
        }
    };

    if (isLoading) {
        return (
            <AuthGuard allowedRoles={['Admin']}>
                <DashboardLayout>
                    <div style={{ padding: '8rem', textAlign: 'center', opacity: 0.7 }}>
                        <div className="loader">⌛</div>
                        <p>Loading settings...</p>
                    </div>
                </DashboardLayout>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard allowedRoles={['Admin']}>
            <DashboardLayout>
                <div className={styles.container}>
                    {/* Header Section */}
                    <div className={styles.pageHeader}>
                        <h1 className={styles.title}>⚙️ System Settings</h1>
                        <p className={styles.subtitle}>Configure global tax and discount rates for all transactions</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        {/* Current Settings Preview */}
                        <Card glass>
                            <CardBody>
                                <div style={{ textAlign: 'center', padding: '1rem' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                                        Current Tax Rate
                                    </h3>
                                    <div style={{
                                        fontSize: '3rem',
                                        fontWeight: 800,
                                        background: 'var(--primary-gradient)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}>
                                        {taxRate}%
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                        Applied to all orders
                                    </p>
                                </div>
                            </CardBody>
                        </Card>

                        <Card glass>
                            <CardBody>
                                <div style={{ textAlign: 'center', padding: '1rem' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                                        Default Discount
                                    </h3>
                                    <div style={{
                                        fontSize: '3rem',
                                        fontWeight: 800,
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}>
                                        {discountRate}%
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                        Default for new orders
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Settings Form */}
                    <Card glass>
                        <CardBody>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                marginBottom: '2rem',
                                color: 'var(--text-main)',
                                borderLeft: '4px solid var(--primary-color)',
                                paddingLeft: '1rem'
                            }}>
                                Update Configuration
                            </h2>

                            <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {/* Brand Configuration */}
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1.5rem'
                                    }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                                            🏢 Brand Configuration
                                        </h3>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Restaurant Name</label>
                                            <input
                                                type="text"
                                                value={restaurantName}
                                                onChange={(e) => setRestaurantName(e.target.value)}
                                                className={styles.input}
                                                placeholder="e.g. Gourmet Haven"
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Restaurant Logo</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                <div style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '2px dashed rgba(255, 255, 255, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden'
                                                }}>
                                                    {restaurantLogo ? (
                                                        <img src={restaurantLogo} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    ) : (
                                                        <span style={{ fontSize: '2rem' }}>🖼️</span>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleLogoChange}
                                                        style={{ display: 'none' }}
                                                        id="logo-upload"
                                                    />
                                                    <label htmlFor="logo-upload" className={styles.saveButton} style={{
                                                        display: 'inline-block',
                                                        padding: '0.5rem 1rem',
                                                        fontSize: '0.9rem',
                                                        width: 'auto',
                                                        background: 'rgba(255, 255, 255, 0.1)',
                                                        boxShadow: 'none'
                                                    }}>
                                                        Choose Image
                                                    </label>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                        Recommended: 200x200px (PNG or SVG)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tax Rate Input */}
                                    <div className={styles.formGroup}>
                                        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>📈</span>
                                            Tax Percentage (%)
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={taxRate}
                                                onChange={(e) => setTaxRate(e.target.value)}
                                                className={styles.input}
                                                placeholder="e.g. 5.00"
                                                style={{ paddingRight: '3rem' }}
                                            />
                                            <span style={{
                                                position: 'absolute',
                                                right: '1.25rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'var(--primary-color)',
                                                fontWeight: 700,
                                                fontSize: '1.1rem'
                                            }}>%</span>
                                        </div>
                                        <p className={styles.helperText}>
                                            💡 This percentage will be automatically added to the subtotal of every order
                                        </p>
                                    </div>


                                    {/* Discount Rate Input */}
                                    <div className={styles.formGroup}>
                                        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>🎁</span>
                                            Default Discount Percentage (%)
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={discountRate}
                                                onChange={(e) => setDiscountRate(e.target.value)}
                                                className={styles.input}
                                                placeholder="e.g. 10.00"
                                                style={{ paddingRight: '3rem' }}
                                            />
                                            <span style={{
                                                position: 'absolute',
                                                right: '1.25rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: '#10b981',
                                                fontWeight: 700,
                                                fontSize: '1.1rem'
                                            }}>%</span>
                                        </div>
                                        <p className={styles.helperText}>
                                            💡 This percentage will be pre-filled as default discount (cashiers can adjust per order)
                                        </p>
                                    </div>

                                    {/* Preview Calculation */}
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        marginTop: '1rem'
                                    }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                                            📋 Example Calculation (for $100 order)
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                                                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>$100.00</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Tax ({taxRate}%):</span>
                                                <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                                                    +${(100 * parseFloat(taxRate || '0') / 100).toFixed(2)}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Discount ({discountRate}%):</span>
                                                <span style={{ color: '#10b981', fontWeight: 600 }}>
                                                    -${(100 * parseFloat(discountRate || '0') / 100).toFixed(2)}
                                                </span>
                                            </div>
                                            <div style={{
                                                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                                paddingTop: '0.5rem',
                                                marginTop: '0.5rem',
                                                display: 'flex',
                                                justifyContent: 'space-between'
                                            }}>
                                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Total:</span>
                                                <span style={{
                                                    fontWeight: 800,
                                                    fontSize: '1.25rem',
                                                    background: 'var(--primary-gradient)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    backgroundClip: 'text'
                                                }}>
                                                    ${(100 + (100 * parseFloat(taxRate || '0') / 100) - (100 * parseFloat(discountRate || '0') / 100)).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className={styles.saveButton}
                                        disabled={isUpdating}
                                        style={{ marginTop: '1rem' }}
                                    >
                                        {isUpdating ? (
                                            <>
                                                <span style={{ marginRight: '0.5rem' }}>⏳</span>
                                                Saving Changes...
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ marginRight: '0.5rem' }}>💾</span>
                                                Save Settings
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>

                    {/* Item Specific Discounts */}
                    <Card glass style={{ marginTop: '2rem' }}>
                        <CardBody>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 800,
                                    color: 'var(--text-main)',
                                    borderLeft: '4px solid var(--primary-color)',
                                    paddingLeft: '1rem',
                                    margin: 0
                                }}>
                                    🏷️ Item Specific Discounts
                                </h2>
                                <button
                                    onClick={handleUpdateItemDiscounts}
                                    disabled={isUpdatingItems}
                                    className={styles.saveButton}
                                    style={{ width: 'auto', padding: '0.75rem 2rem' }}
                                >
                                    {isUpdatingItems ? 'Saving...' : 'Save All Item Discounts'}
                                </button>
                            </div>

                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                Set unique discount percentages for specific menu items. These will override or add to the global discount based on your business logic.
                            </p>

                            {isLoadingFoods ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                                    <p>Loading items...</p>
                                </div>
                            ) : (
                                <div style={{
                                    maxHeight: '500px',
                                    overflowY: 'auto',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '16px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'separate',
                                        borderSpacing: 0
                                    }}>
                                        <thead style={{
                                            position: 'sticky',
                                            top: 0,
                                            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                                            backdropFilter: 'blur(10px)',
                                            zIndex: 2,
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                                        }}>
                                            <tr>
                                                <th style={{
                                                    textAlign: 'left',
                                                    padding: '1.25rem 1.5rem',
                                                    borderBottom: '2px solid rgba(255, 126, 51, 0.3)',
                                                    color: 'var(--text-main)',
                                                    fontWeight: 700,
                                                    fontSize: '0.95rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        🍽️ Item Name
                                                    </span>
                                                </th>
                                                <th style={{
                                                    textAlign: 'left',
                                                    padding: '1.25rem 1.5rem',
                                                    borderBottom: '2px solid rgba(255, 126, 51, 0.3)',
                                                    color: 'var(--text-main)',
                                                    fontWeight: 700,
                                                    fontSize: '0.95rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        📂 Category
                                                    </span>
                                                </th>
                                                <th style={{
                                                    textAlign: 'left',
                                                    padding: '1.25rem 1.5rem',
                                                    borderBottom: '2px solid rgba(255, 126, 51, 0.3)',
                                                    color: 'var(--text-main)',
                                                    fontWeight: 700,
                                                    fontSize: '0.95rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        💵 Base Price
                                                    </span>
                                                </th>
                                                <th style={{
                                                    textAlign: 'center',
                                                    padding: '1.25rem 1.5rem',
                                                    borderBottom: '2px solid rgba(255, 126, 51, 0.3)',
                                                    color: 'var(--text-main)',
                                                    fontWeight: 700,
                                                    fontSize: '0.95rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                        🏷️ Discount
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {foodsData?.data?.data.map((food, index) => (
                                                <tr
                                                    key={food.id}
                                                    style={{
                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                                        transition: 'all 0.2s ease',
                                                        background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 126, 51, 0.08)';
                                                        e.currentTarget.style.transform = 'translateX(4px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent';
                                                        e.currentTarget.style.transform = 'translateX(0)';
                                                    }}
                                                >
                                                    <td style={{
                                                        padding: '1.25rem 1.5rem',
                                                        color: 'var(--text-main)',
                                                        fontWeight: 600,
                                                        fontSize: '0.95rem'
                                                    }}>
                                                        {food.name}
                                                    </td>
                                                    <td style={{
                                                        padding: '1.25rem 1.5rem',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        <span style={{
                                                            background: 'rgba(255, 126, 51, 0.1)',
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '20px',
                                                            fontSize: '0.85rem',
                                                            border: '1px solid rgba(255, 126, 51, 0.2)'
                                                        }}>
                                                            {food.category?.name || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td style={{
                                                        padding: '1.25rem 1.5rem',
                                                        fontWeight: 700,
                                                        color: '#34d399',
                                                        fontSize: '1rem'
                                                    }}>
                                                        ${Number(food.price).toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                        <div style={{
                                                            position: 'relative',
                                                            display: 'inline-block',
                                                            width: '120px'
                                                        }}>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                min="0"
                                                                max="100"
                                                                value={itemDiscounts[food.id] || '0'}
                                                                onChange={(e) => handleItemDiscountChange(food.id, e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '0.75rem',
                                                                    paddingRight: '2rem',
                                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                                    border: '2px solid rgba(16, 185, 129, 0.3)',
                                                                    borderRadius: '10px',
                                                                    color: 'var(--text-main)',
                                                                    textAlign: 'center',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.95rem',
                                                                    transition: 'all 0.3s ease',
                                                                    outline: 'none'
                                                                }}
                                                                onFocus={(e) => {
                                                                    e.target.style.borderColor = '#10b981';
                                                                    e.target.style.background = 'rgba(16, 185, 129, 0.15)';
                                                                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                                                                }}
                                                                onBlur={(e) => {
                                                                    e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                                                                    e.target.style.background = 'rgba(16, 185, 129, 0.1)';
                                                                    e.target.style.boxShadow = 'none';
                                                                }}
                                                            />
                                                            <span style={{
                                                                position: 'absolute',
                                                                right: '0.75rem',
                                                                top: '50%',
                                                                transform: 'translateY(-50%)',
                                                                color: '#10b981',
                                                                fontSize: '0.9rem',
                                                                fontWeight: 800,
                                                                pointerEvents: 'none'
                                                            }}>%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {!isLoadingFoods && totalFoodsPages > 1 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '12px'
                                }}>
                                    <button
                                        onClick={() => setFoodsPage(p => Math.max(1, p - 1))}
                                        disabled={foodsPage === 1}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: foodsPage === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                                            cursor: foodsPage === 1 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        ‹ Previous
                                    </button>

                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                                        Page <span style={{ color: 'var(--primary-color)' }}>{foodsPage}</span> of {totalFoodsPages}
                                    </div>

                                    <button
                                        onClick={() => setFoodsPage(p => Math.min(totalFoodsPages, p + 1))}
                                        disabled={foodsPage === totalFoodsPages}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: foodsPage === totalFoodsPages ? 'var(--text-muted)' : 'var(--text-main)',
                                            cursor: foodsPage === totalFoodsPages ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Next ›
                                    </button>

                                    <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Showing {foodsData?.data?.data.length} of {totalFoods} items
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Info Section */}
                    <div style={{ marginTop: '2rem' }}>
                        <Card glass>
                            <CardBody>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ fontSize: '2rem' }}>ℹ️</div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                                            Important Information
                                        </h3>
                                        <ul style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                                            <li>Changes will apply to all new orders immediately after saving</li>
                                            <li>Existing orders will retain their original tax and discount rates</li>
                                            <li>Cashiers can manually adjust discount amounts per order if needed</li>
                                            <li>All changes are logged for audit purposes</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
};

export default SettingsPage;
