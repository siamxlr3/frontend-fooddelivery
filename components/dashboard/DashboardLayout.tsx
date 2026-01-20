'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store/store';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/store/api/authApi';
import { useGetSettingsQuery } from '@/store/api/settingsApi';
import { useSocketListener } from '@/hooks/useSocketListener';
import { NotificationBell } from './NotificationBell';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const [logout] = useLogoutMutation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { data: settings } = useGetSettingsQuery();

    // Initialize global socket listener for real-time updates
    useSocketListener();

    const handleLogout = async () => {
        try {
            await logout().unwrap();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch(logoutAction());
            router.push('/login');
        }
    };

    const getNavigationItems = () => {
        const baseItems = [
            { name: 'Dashboard', icon: '📊', path: `/dashboard/${user?.role.toLowerCase()}` },
        ];

        switch (user?.role) {
            case 'Admin':
                return [
                    ...baseItems,
                    { name: 'Menu Management', icon: '🍽️', path: '/dashboard/admin/menu' },
                    { name: 'Orders', icon: '📋', path: '/dashboard/admin/orders' },
                    { name: 'Staff', icon: '👥', path: '/dashboard/admin/staff' },
                    { name: 'Suppliers', icon: '📦', path: '/dashboard/admin/suppliers' },
                    { name: 'Reports', icon: '📈', path: '/dashboard/admin/reports' },
                    { name: 'Settings', icon: '⚙️', path: '/dashboard/admin/settings' },
                ];
            case 'Cashier':
                return [
                    ...baseItems,
                    { name: 'New Order', icon: '➕', path: '/dashboard/cashier/new-order' },
                    { name: 'Tables', icon: '🪑', path: '/dashboard/cashier/tables' },
                    { name: 'Orders', icon: '📝', path: '/dashboard/cashier/orders' },
                    { name: 'Sessions', icon: '🕐', path: '/dashboard/cashier/sessions' },
                    { name: 'Payments', icon: '💳', path: '/dashboard/cashier/payments' },
                ];
            case 'KitchenStaff':
                return [
                    ...baseItems,
                    { name: 'Order Queue', icon: '🔥', path: '/dashboard/kitchen/queue' },
                    { name: 'Completed', icon: '✅', path: '/dashboard/kitchen/completed' },
                ];
            default:
                return baseItems;
        }
    };

    const navigationItems = getNavigationItems();

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logo}>
                        {settings?.restaurant_logo ? (
                            <img
                                src={settings.restaurant_logo}
                                alt="Logo"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    objectFit: 'contain',
                                    borderRadius: '8px'
                                }}
                            />
                        ) : (
                            <span className={styles.logoIcon}>🍽️</span>
                        )}
                        {sidebarOpen && (
                            <span className={styles.logoText}>
                                {settings?.restaurant_name || 'Restaurant POS'}
                            </span>
                        )}
                    </div>
                </div>


                <nav className={styles.navigation}>
                    {navigationItems.map((item) => (
                        <a
                            key={item.path}
                            href={item.path}
                            className={styles.navItem}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {sidebarOpen && <span className={styles.navText}>{item.name}</span>}
                        </a>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <button className={styles.toggleButton} onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={styles.main}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h2 className={styles.greeting}>
                            Welcome back, <span className={styles.userName}>{user?.name}</span>
                        </h2>
                    </div>

                    <div className={styles.headerRight}>
                        {(user?.role === 'KitchenStaff' || user?.role === 'Admin') && (
                            <NotificationBell />
                        )}
                        <div className={styles.userBadge}>
                            <span className={styles.roleBadge}>{user?.role}</span>
                        </div>

                        <button className={styles.logoutButton} onClick={handleLogout}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
