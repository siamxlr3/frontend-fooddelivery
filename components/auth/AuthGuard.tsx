'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { loadFromStorage } from '@/store/slices/authSlice';
import { User } from '@/store/api/authApi';

interface AuthGuardProps {
    children: ReactNode;
    allowedRoles?: User['role'][];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load auth state from localStorage on mount
        dispatch(loadFromStorage());
        setIsLoading(false);
    }, [dispatch]);

    useEffect(() => {
        // Don't check auth until loading is complete
        if (isLoading) return;

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check role-based access
        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            // Redirect to appropriate dashboard based on user's role
            const dashboardRoutes = {
                Admin: '/dashboard/admin',
                Cashier: '/dashboard/cashier',
                Waiter: '/dashboard/waiter',
                KitchenStaff: '/dashboard/kitchen',
            };
            router.push(dashboardRoutes[user.role]);
        }
    }, [isAuthenticated, user, allowedRoles, router, isLoading]);

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--gray-50)'
            }}>
                <div className="animate-spin" style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid var(--gray-200)',
                    borderTopColor: 'var(--primary-500)',
                    borderRadius: '50%'
                }}></div>
            </div>
        );
    }

    if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
        return null;
    }

    return <>{children}</>;
}

