'use client';

import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import styles from './menu-hub.module.css';

export default function MenuHubPage() {
    return (
        <AuthGuard allowedRoles={['Admin']}>
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Menu Management</h1>
                        <p className={styles.subtitle}>Configure your restaurant's offerings and organization</p>
                    </div>

                    <div className={styles.hubGrid}>
                        <Link href="/dashboard/admin/menu/categories" className={styles.hubLink}>
                            <Card glass hover className={styles.hubCard}>
                                <CardBody>
                                    <div className={styles.hubIcon} style={{ background: 'var(--gradient-primary)' }}>
                                        📁
                                    </div>
                                    <div className={styles.hubContent}>
                                        <h3 className={styles.hubTitle}>Categories</h3>
                                        <p className={styles.hubDesc}>Manage food categories like Drinks, Main Course, and Desserts.</p>
                                        <span className={styles.hubAction}>Manage Categories →</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </Link>

                        <Link href="/dashboard/admin/menu/items" className={styles.hubLink}>
                            <Card glass hover className={styles.hubCard}>
                                <CardBody>
                                    <div className={styles.hubIcon} style={{ background: 'var(--gradient-secondary)' }}>
                                        🍽️
                                    </div>
                                    <div className={styles.hubContent}>
                                        <h3 className={styles.hubTitle}>Menu Items</h3>
                                        <p className={styles.hubDesc}>Add, edit, and delete food items with prices, descriptions, and images.</p>
                                        <span className={styles.hubAction}>Manage Items →</span>
                                    </div>
                                </CardBody>
                            </Card>
                        </Link>
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
