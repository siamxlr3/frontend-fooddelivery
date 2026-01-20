'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetSalesReportQuery, type ReportParams } from '@/store/api/reportApi';
import styles from '../../admin/reports/report.module.css';

export default function CashierPaymentsPage() {
    const [filters, setFilters] = useState<ReportParams>({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        status: 'Paid',
        groupBy: 'day'
    });
    const [currentPage, setCurrentPage] = useState(1);

    const { data: report, isLoading } = useGetSalesReportQuery(filters);

    const handlePeriodChange = (period: 'day' | 'week' | 'month') => {
        const end = new Date();
        const start = new Date();
        if (period === 'day') {
            start.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            start.setDate(start.getDate() - 7);
        } else {
            start.setMonth(start.getMonth() - 1);
        }

        setFilters(prev => ({
            ...prev,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            groupBy: period
        }));
        setCurrentPage(1);
    };

    const handleExportCSV = () => {
        if (!report?.orders) return;
        const headers = ['Order #', 'Date', 'Type', 'Table', 'Waiter', 'Amount', 'Payment'];
        const rows = report.orders.map((o: any) => [
            o.orderNumber,
            new Date(o.createdAt).toLocaleString('en-US', {
                month: 'short', day: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            }),
            String(o.type).toUpperCase(),
            o.tableNumber || 'WALK-IN',
            o.waiter?.name || 'SYSTEM',
            `$${Number(o.totalAmount).toFixed(2)}`,
            o.bill?.paymentMethod || 'N/A'
        ]);

        const csvContent = "\ufeff" + [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `SiamXlr_Payments_${filters.startDate}.csv`);
        link.click();
    };

    return (
        <AuthGuard allowedRoles={['Cashier', 'Admin']}>
            <DashboardLayout>
                <div className={styles.reportContainer} style={{ paddingBottom: '5rem' }}>
                    <div className={styles.printHeader}>
                        <div className={styles.printRestaurantInfo}>
                            <h1>SIAM XLR RESTAURANT</h1>
                            <p>Cashier Payment History Report</p>
                            <p>Generated: {new Date().toLocaleString()}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 800 }}>PAYMENT LOG</p>
                            <p>Period: {filters.startDate} to {filters.endDate}</p>
                        </div>
                    </div>

                    <div className={styles.reportHeader}>
                        <div className={styles.headerInfo}>
                            <h1 style={{ fontSize: '2rem' }}>Payment History</h1>
                            <p style={{ color: 'var(--text-muted)' }}>Track and manage daily transactions</p>
                        </div>

                        <div className={styles.headerActions}>
                            <Button variant="secondary" onClick={handleExportCSV}>Export CSV</Button>
                            <Button variant="primary" onClick={() => window.print()}>Print / PDF</Button>
                        </div>
                    </div>

                    <div className={styles.filterSection}>
                        <div className={styles.filterGrid}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Start Date</label>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, startDate: e.target.value }));
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>End Date</label>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, endDate: e.target.value }));
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Method</label>
                                <select
                                    className={styles.filterSelect}
                                    value={filters.paymentMethod}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, paymentMethod: e.target.value }));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="">All Methods</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Mobile">Mobile</option>
                                </select>
                            </div>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Quick Filters</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {(['day', 'week', 'month'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => handlePeriodChange(p)}
                                            style={{
                                                padding: '0.6rem 1rem',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: filters.groupBy === p ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                                                color: filters.groupBy === p ? '#fff' : 'var(--text-muted)',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.statsGrid}>
                        <Card glass hover>
                            <CardBody className={styles.statItem}>
                                <div className={styles.statIcon} style={{ background: 'rgba(79, 70, 229, 0.15)', color: '#6366f1' }}>💵</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statLabel}>Total Collected</span>
                                    <h3 className={styles.statValue}>${Number(report?.summary.totalSales || 0).toLocaleString()}</h3>
                                </div>
                            </CardBody>
                        </Card>
                        <Card glass hover>
                            <CardBody className={styles.statItem}>
                                <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>🧾</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statLabel}>Transactions</span>
                                    <h3 className={styles.statValue}>{report?.summary.orderCount || 0}</h3>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <div className={styles.tableSection}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
                            <h3 style={{ margin: 0 }}>Transaction Log</h3>
                        </div>
                        <table className={styles.reportTable}>
                            <thead>
                                <tr>
                                    <th>Ref #</th>
                                    <th>Date & Time</th>
                                    <th>Mode</th>
                                    <th>Total</th>
                                    <th>Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Fetching records...</td></tr>
                                ) : (
                                    (() => {
                                        const orders = report?.orders || [];
                                        const itemsPerPage = 10;
                                        const totalPages = Math.ceil(orders.length / itemsPerPage);
                                        const startIndex = (currentPage - 1) * itemsPerPage;
                                        const endIndex = startIndex + itemsPerPage;
                                        const currentOrders = orders.slice(startIndex, endIndex);

                                        return (
                                            <>
                                                {currentOrders.map((order: any) => (
                                                    <tr key={order.id}>
                                                        <td style={{ fontWeight: 800, fontFamily: 'monospace' }}>#{order.orderNumber.slice(-8)}</td>
                                                        <td>{new Date(order.createdAt).toLocaleString()}</td>
                                                        <td>{order.type}</td>
                                                        <td style={{ fontWeight: 800 }}>${Number(order.totalAmount).toFixed(2)}</td>
                                                        <td>
                                                            <span
                                                                className={styles.methodBadge}
                                                                style={{
                                                                    background: order.bill?.paymentMethod === 'Cash' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                                                                    color: order.bill?.paymentMethod === 'Cash' ? '#10b981' : '#3b82f6',
                                                                    border: `1px solid ${order.bill?.paymentMethod === 'Cash' ? '#10b98133' : '#3b82f633'}`
                                                                }}
                                                            >
                                                                {order.bill?.paymentMethod || 'Paid'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {orders.length > 0 && (
                                                    <tr>
                                                        <td colSpan={5} style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                                    Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} entries
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        disabled={currentPage === 1}
                                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                                    >
                                                                        Previous
                                                                    </Button>

                                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
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
                                                                                    onClick={() => setCurrentPage(p)}
                                                                                    style={{
                                                                                        width: '32px',
                                                                                        height: '32px',
                                                                                        borderRadius: '6px',
                                                                                        border: currentPage === p ? '1px solid var(--primary-500)' : '1px solid transparent',
                                                                                        background: currentPage === p ? 'var(--primary-500)' : 'transparent',
                                                                                        color: currentPage === p ? 'white' : 'var(--text-muted)',
                                                                                        cursor: 'pointer'
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
                                                                        disabled={currentPage >= totalPages}
                                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                                    >
                                                                        Next
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })()
                                )}
                            </tbody>
                        </table>
                        {!isLoading && report?.orders.length === 0 && (
                            <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <p>No transactions found for the selected dates.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}

