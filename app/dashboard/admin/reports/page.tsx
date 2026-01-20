'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    useGetSalesReportQuery,
    useGetTopSellingItemsQuery,
    useGetFinancialReportQuery,
    type ReportParams
} from '@/store/api/reportApi';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './report.module.css';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<'sales' | 'financial'>('sales');
    const [finPeriod, setFinPeriod] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    });

    const [filters, setFilters] = useState<ReportParams>({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        status: 'Paid',
        groupBy: 'day'
    });
    const [page, setPage] = useState(1);

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
    };

    useEffect(() => {
        setPage(1);
    }, [filters]);

    const { data: report, isLoading } = useGetSalesReportQuery(
        { ...filters, page, take: 10 },
        { skip: activeTab !== 'sales' }
    );
    const { data: topSellingItems, isLoading: isTopSellingLoading } = useGetTopSellingItemsQuery(
        { startDate: filters.startDate, endDate: filters.endDate },
        { skip: activeTab !== 'sales' }
    );
    const { data: finReport, isLoading: isFinLoading } = useGetFinancialReportQuery(
        finPeriod,
        { skip: activeTab !== 'financial' }
    );

    const topItem = topSellingItems?.[0];

    const handleExportCSV = () => {
        if (!report?.orders) return;
        const headers = ['Order #', 'Date', 'Type', 'Table', 'Waiter', 'Amount', 'Payment'];
        const rows = report.orders.map((o: any) => [
            o.orderNumber,
            new Date(o.createdAt).toLocaleString(),
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
        link.setAttribute("download", `Report_${filters.startDate}_to_${filters.endDate}.csv`);
        link.click();
    };

    return (
        <AuthGuard allowedRoles={['Admin']}>
            <DashboardLayout>
                <div className={styles.reportContainer} data-active-tab={activeTab}>
                    {/* Print Header (Visible only in PDF) */}
                    <div className={styles.printHeader}>
                        <div className={styles.printLeft}>
                            <h2>Antigravity Kitchen</h2>
                            <p>Official Financial Report</p>
                        </div>
                        <div className={styles.printRight}>
                            <p><strong>Period:</strong> {activeTab === 'sales' ? `${filters.startDate} to ${filters.endDate}` : `${finPeriod.month}/${finPeriod.year}`}</p>
                            <p><strong>Generated:</strong> {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className={styles.reportHeader}>
                        <div className={styles.headerInfo}>
                            <h1>Restaurant Insights</h1>
                            <p style={{ color: 'var(--text-muted)' }}>Financial performance and operations tracking</p>
                        </div>
                        <div className={styles.headerActions}>
                            <Button variant="secondary" onClick={handleExportCSV}>Export CSV</Button>
                            <Button variant="primary" onClick={() => window.print()}>Print Report</Button>
                        </div>
                    </div>

                    <div className={styles.reportTabs}>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'sales' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('sales')}
                        >
                            📈 Sales & Inventory
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'financial' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('financial')}
                        >
                            💰 Income & Expenses
                        </button>
                    </div>

                    {activeTab === 'sales' ? (
                        <>
                            <div className={styles.filterSection}>
                                <div className={styles.filterGrid}>
                                    <div className={styles.filterGroup}>
                                        <label className={styles.filterLabel}>Start Date</label>
                                        <Input
                                            type="date"
                                            value={filters.startDate}
                                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className={styles.filterGroup}>
                                        <label className={styles.filterLabel}>End Date</label>
                                        <Input
                                            type="date"
                                            value={filters.endDate}
                                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className={styles.filterGroup}>
                                        <label className={styles.filterLabel}>Quick Periods</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {(['day', 'week', 'month'] as const).map(p => (
                                                <Button
                                                    key={p}
                                                    size="sm"
                                                    variant={filters.groupBy === p ? 'primary' : 'secondary'}
                                                    onClick={() => handlePeriodChange(p)}
                                                >
                                                    {p}ly
                                                </Button>
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
                                            <span className={styles.statLabel}>Revenue</span>
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
                                <Card glass hover>
                                    <CardBody className={styles.statItem}>
                                        <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>🏆</div>
                                        <div className={styles.statInfo}>
                                            <span className={styles.statLabel}>Top Performer</span>
                                            <h3 className={styles.statValue} style={{ fontSize: '1.2rem' }}>
                                                {isTopSellingLoading ? '...' : (topItem?.foodName || 'None')}
                                            </h3>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>


                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={styles.chartSection}
                                style={{ marginTop: '1.5rem' }}
                            >
                                <div className={styles.chartHeader}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>Sales Flow Analysis</h3>
                                        <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            Revenue trend and transaction volume flow
                                        </p>
                                    </div>
                                    <div className={styles.chartLegend}>
                                        <div className={styles.legendItem}>
                                            <span className={styles.legendDot} style={{ background: 'var(--primary-color)' }}></span>
                                            Revenue ($)
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.chartContainer} style={{ height: '380px', display: 'block', border: 'none' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={report?.chartData || []}
                                            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.6} />
                                                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                                </linearGradient>
                                                <filter id="shadow" height="200%">
                                                    <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="var(--primary-color)" floodOpacity="0.3" />
                                                </filter>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="rgba(255,255,255,0.03)"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="date"
                                                stroke="rgba(255,255,255,0.2)"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                                tickFormatter={(str) => {
                                                    const date = new Date(str);
                                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                }}
                                            />
                                            <YAxis
                                                stroke="rgba(255,255,255,0.2)"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                dx={-10}
                                                tickFormatter={(val) => `$${val}`}
                                            />
                                            <Tooltip
                                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                                contentStyle={{
                                                    background: 'rgba(15, 15, 15, 0.95)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '16px',
                                                    color: '#fff',
                                                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                                    backdropFilter: 'blur(12px)',
                                                    padding: '12px 16px'
                                                }}
                                                itemStyle={{
                                                    color: 'var(--primary-color)',
                                                    fontSize: '14px',
                                                    fontWeight: '700'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="var(--primary-color)"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorAmount)"
                                                filter="url(#shadow)"
                                                animationDuration={2000}
                                                activeDot={{
                                                    r: 8,
                                                    fill: '#fff',
                                                    stroke: 'var(--primary-color)',
                                                    strokeWidth: 4
                                                }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            <div className={styles.tableSection} style={{ marginTop: '2rem' }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                                    <h3 style={{ margin: 0 }}>Detailed Transaction Log</h3>
                                </div>
                                <table className={styles.reportTable}>
                                    <thead>
                                        <tr>
                                            <th>Order #</th>
                                            <th>Date & Time</th>
                                            <th>Type</th>
                                            <th>Personnel</th>
                                            <th>Total Amount</th>
                                            <th>Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report?.orders.map((order: any) => (
                                            <tr key={order.id}>
                                                <td style={{ fontWeight: 800 }}>#{order.orderNumber.slice(-8)}</td>
                                                <td>{new Date(order.createdAt).toLocaleString()}</td>
                                                <td>{order.type}</td>
                                                <td>{order.waiter?.name || 'Kiosk'}</td>
                                                <td style={{ fontWeight: 800 }}>${Number(order.totalAmount).toFixed(2)}</td>
                                                <td>{order.bill?.paymentMethod || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {report && report.totalPages > 1 && (
                                    <div className={styles.pagination}>
                                        <div className={styles.paginationInfo}>
                                            Showing 10 items per page
                                        </div>
                                        <div className={styles.paginationControls}>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                disabled={page === 1}
                                                onClick={() => setPage(p => p - 1)}
                                            >
                                                ← Prev
                                            </Button>

                                            <div className={styles.pageNumbers}>
                                                {Array.from({ length: Math.min(5, report.totalPages) }, (_, i) => {
                                                    const pageNum = i + 1;
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            className={`${styles.pageNumber} ${page === pageNum ? styles.activePage : ''}`}
                                                            onClick={() => setPage(pageNum)}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                                {report.totalPages > 5 && <span className={styles.dots}>...</span>}
                                            </div>

                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                disabled={page === report.totalPages}
                                                onClick={() => setPage(p => p + 1)}
                                            >
                                                Next →
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className={styles.financialSection}>
                            <div className={styles.filterSection} style={{ marginBottom: '2rem' }}>
                                <div className={styles.filterGrid}>
                                    <div className={styles.filterGroup}>
                                        <label className={styles.filterLabel}>Year</label>
                                        <Input
                                            type="number"
                                            value={finPeriod.year}
                                            onChange={(e) => setFinPeriod(prev => ({ ...prev, year: Number(e.target.value) }))}
                                        />
                                    </div>
                                    <div className={styles.filterGroup}>
                                        <label className={styles.filterLabel}>Month</label>
                                        <select
                                            className={styles.filterSelect}
                                            value={finPeriod.month}
                                            onChange={(e) => setFinPeriod(prev => ({ ...prev, month: Number(e.target.value) }))}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {new Date(0, i).toLocaleString('en', { month: 'long' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {isFinLoading ? <p>Calculating...</p> : finReport && (
                                <>
                                    <div className={styles.financialSummary}>
                                        <Card glass hover>
                                            <CardBody className={styles.statItem}>
                                                <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>📈</div>
                                                <div className={styles.statInfo}>
                                                    <span className={styles.statLabel}>Monthly Income</span>
                                                    <h3 className={`${styles.statValue} ${styles.incomeText}`}>${finReport.summary.totalIncome.toLocaleString()}</h3>
                                                </div>
                                            </CardBody>
                                        </Card>
                                        <Card glass hover>
                                            <CardBody className={styles.statItem}>
                                                <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>📉</div>
                                                <div className={styles.statInfo}>
                                                    <span className={styles.statLabel}>Monthly Expense</span>
                                                    <h3 className={`${styles.statValue} ${styles.expenseText}`}>${finReport.summary.totalExpense.toLocaleString()}</h3>
                                                </div>
                                            </CardBody>
                                        </Card>
                                        <Card glass hover>
                                            <CardBody className={styles.statItem}>
                                                <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>🏦</div>
                                                <div className={styles.statInfo}>
                                                    <span className={styles.statLabel}>Net Profit</span>
                                                    <h3 className={`${styles.statValue} ${styles.profitText}`}>${finReport.summary.netProfit.toLocaleString()}</h3>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>

                                    <div className={styles.financialDetailGrid}>
                                        <div className={styles.tableSection}>
                                            <h4 className={styles.sectionTitle}>Expense Breakdowns (Salaries)</h4>
                                            <table className={styles.reportTable}>
                                                <thead>
                                                    <tr><th>Name</th><th>Role</th><th>Salary</th></tr>
                                                </thead>
                                                <tbody>
                                                    {finReport.details.staff.map((s, i) => (
                                                        <tr key={i}>
                                                            <td>{s.name}</td>
                                                            <td>{s.role}</td>
                                                            <td className={styles.expenseText}>-${Number(s.salary).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className={styles.tableSection}>
                                            <h4 className={styles.sectionTitle}>Expense Breakdowns (Suppliers)</h4>
                                            <table className={styles.reportTable}>
                                                <thead>
                                                    <tr><th>Supplier</th><th>Item</th><th>Amount</th><th>Date</th></tr>
                                                </thead>
                                                <tbody>
                                                    {finReport.details.supplierPurchases.map((s, i) => (
                                                        <tr key={i}>
                                                            <td>{s.name}</td>
                                                            <td>{s.itemType}</td>
                                                            <td className={styles.expenseText}>-${Number(s.totalPurchaseAmount).toLocaleString()}</td>
                                                            <td>{new Date(s.purchaseDate).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
