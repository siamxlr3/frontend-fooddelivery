'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/orderApi';
import type { Order } from '@/store/api/orderApi';
import styles from './KitchenDisplay.module.css';

interface KitchenDisplayProps {
    viewType: 'queue' | 'completed';
    title: string;
    subtitle: string;
}

export function KitchenDisplay({ viewType, title, subtitle }: KitchenDisplayProps) {
    const { data: ordersResponse, isLoading } = useGetOrdersQuery({ page: 1, take: 100 });
    const allOrders = ordersResponse?.data || [];
    const [updateStatus] = useUpdateOrderStatusMutation();

    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Filter logic
    const orders = allOrders.filter(o => {
        // First filter by status/view type
        const isCorrectStatus = viewType === 'queue'
            ? (o.status === 'New' || o.status === 'InProgress')
            : (o.status === 'Ready' || o.status === 'Served' || o.status === 'Paid');

        if (!isCorrectStatus) return false;

        // Apply Date/Month filters (mostly relevant for 'completed' view)
        const orderDate = new Date(o.createdAt);

        if (selectedDate) {
            const filterDate = new Date(selectedDate).toDateString();
            if (orderDate.toDateString() !== filterDate) return false;
        }

        if (selectedMonth && !selectedDate) {
            const [year, month] = selectedMonth.split('-'); // Format: YYYY-MM
            if (orderDate.getFullYear() !== parseInt(year) || (orderDate.getMonth() + 1) !== parseInt(month)) return false;
        }

        return true;
    }).sort((a, b) => {
        // Sort by oldest first for queue, newest first for completed
        if (viewType === 'queue') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    // Calculate pagination items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = viewType === 'completed' ? orders.slice(indexOfFirstItem, indexOfLastItem) : orders;
    const totalPages = Math.ceil(orders.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const stats = {
        pending: allOrders.filter(o => o.status === 'New' || o.status === 'InProgress').length,
        completedToday: allOrders.filter(o =>
            (o.status === 'Ready' || o.status === 'Served' || o.status === 'Paid') &&
            new Date(o.createdAt).toDateString() === new Date().toDateString()
        ).length
    };

    const handleUpdateStatus = async (id: number, status: 'InProgress' | 'Ready' | 'Served') => {
        try {
            await updateStatus({ id, status }).unwrap();
        } catch (error) {
            console.error('Failed to update kitchen order status:', error);
        }
    };

    const getTimeElapsed = (date: string) => {
        const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        if (orders.length === 0) return;

        // Create CSV content
        const headers = ['Order Number', 'Type', 'Table', 'Status', 'Items', 'Total Amount', 'Created At'];
        const csvContent = [
            headers.join(','),
            ...orders.map(o => [
                `"${o.orderNumber}"`,
                `"${o.type}"`,
                `"${o.tableNumber || 'N/A'}"`,
                `"${o.status}"`,
                `"${o.items.map(i => `${i.quantity}x ${i.food?.name}`).join(' | ')}"`,
                `"${o.totalAmount}"`,
                `"${new Date(o.createdAt).toLocaleString()}"`
            ].join(','))
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const fileName = `Kitchen_Orders_${selectedDate || selectedMonth || 'Report'}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [, setTick] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 30000);
        return () => clearInterval(timer);
    }, []);


    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading kitchen data...</p>
            </div>
        );
    }


    return (
        <div className={styles.container}>
            <div className={`${styles.header} no-print`}>
                <div className={styles.headerInfo}>
                    <h1 className={styles.title}>{title}</h1>
                    <p className={styles.subtitle}>{subtitle}</p>
                </div>

                <div className={styles.headerActions}>
                    {viewType === 'completed' && (
                        <div className={styles.filterGroup}>
                            <div className={styles.filterField}>
                                <label>Items / Page</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className={styles.filterInput}
                                    style={{ width: '80px' }}
                                />
                            </div>
                            <div className={styles.filterField}>
                                <label>Filter by Date</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        if (e.target.value) setSelectedMonth('');
                                        setCurrentPage(1);
                                    }}
                                    onClick={(e) => {
                                        try { (e.target as any).showPicker(); } catch (err) { }
                                    }}
                                    className={styles.filterInput}
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <div className={styles.filterField}>
                                <label>Filter by Month</label>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => {
                                        setSelectedMonth(e.target.value);
                                        if (e.target.value) setSelectedDate('');
                                        setCurrentPage(1);
                                    }}
                                    onClick={(e) => {
                                        try { (e.target as any).showPicker(); } catch (err) { }
                                    }}
                                    className={styles.filterInput}
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            {(selectedDate || selectedMonth) && (
                                <button
                                    className={styles.clearFilter}
                                    onClick={() => { setSelectedDate(''); setSelectedMonth(''); setCurrentPage(1); }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    )}
                    <div className={styles.headerRight}>
                        {viewType === 'completed' && orders.length > 0 && (
                            <div className={styles.exportActions}>
                                <button className={styles.exportBtn} onClick={handlePrint}>
                                    <span>🖨️</span> Print PDF
                                </button>
                                <button className={styles.exportBtn} onClick={handleExportExcel}>
                                    <span>📊</span> Export Excel
                                </button>
                            </div>
                        )}
                        <div className={styles.statsRow}>
                            <div className={styles.miniStat}>
                                <span className={styles.statDot} style={{ color: '#ff7e33' }}></span>
                                <strong>{stats.pending}</strong> Active Orders
                            </div>
                            <div className={styles.miniStat}>
                                <span className={styles.statDot} style={{ color: '#10b981' }}></span>
                                <strong>{stats.completedToday}</strong> Completed
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Only Header */}
            <div className={styles.printHeader}>
                <div className={styles.printTitle}>
                    <h1>KITCHEN {viewType.toUpperCase()} REPORT</h1>
                    <p>Generated on {new Date().toLocaleString()}</p>
                </div>
                <div className={styles.printMeta}>
                    <div><strong>Date Range:</strong> {selectedDate || selectedMonth || 'All Records'}</div>
                    <div><strong>Total Orders:</strong> {orders.length}</div>
                </div>
            </div>

            <div className={styles.orderGrid}>
                {currentOrders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>{viewType === 'queue' ? '😴' : '📦'}</div>
                        <h3>{viewType === 'queue' ? 'All caught up!' : 'No completed orders'}</h3>
                        <p>{viewType === 'queue' ? 'No active orders in the kitchen.' : 'Completed orders will appear here.'}</p>
                    </div>
                ) : (
                    currentOrders.map(order => {
                        const diffInMinutes = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
                        const timeClass = diffInMinutes > 20 ? styles.timeDanger : diffInMinutes > 10 ? styles.timeWarning : '';

                        return (
                            <Card
                                key={order.id}
                                glass
                                className={`${styles.orderCard} ${order.status === 'New' ? styles.cardNew :
                                    order.status === 'InProgress' ? styles.cardInProgress : styles.cardReady
                                    }`}
                            >
                                <CardBody className={styles.cardBody}>
                                    <div className={styles.ticketTop}>
                                        <div className={styles.orderHeader}>
                                            <div>
                                                <div className={styles.orderNumber}>#{order.orderNumber.slice(-6)}</div>
                                                <div className={styles.orderType}>
                                                    {order.type === 'DineIn' ? `🪑 Table ${order.tableNumber}` : '🥡 Takeaway'}
                                                </div>
                                            </div>
                                            <div className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                                                {order.status}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.ticketBottom}>
                                        <div className={styles.itemList}>
                                            {order.items.map(item => (
                                                <div key={item.id} className={styles.item}>
                                                    <div className={styles.itemPrimary}>
                                                        <span className={styles.qty}>{item.quantity}</span>
                                                        <span className={styles.itemName}>{item.food?.name}</span>
                                                    </div>
                                                    {item.notes && (
                                                        <div className={styles.itemNote}>
                                                            <span>📝</span> {item.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.footerLeft}>
                                            <span className={styles.itemCountBadge}>
                                                {order.items.reduce((acc, item) => acc + item.quantity, 0)} Items Total
                                            </span>
                                            <div className={`${styles.timeInfo} ${timeClass}`}>
                                                <span>⏱️</span> {getTimeElapsed(order.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.actionZone}>
                                        {order.status === 'New' && (
                                            <Button
                                                variant="primary"
                                                className={styles.actionBtn}
                                                onClick={() => handleUpdateStatus(order.id, 'InProgress')}
                                            >
                                                🍳 Start
                                            </Button>
                                        )}
                                        {order.status === 'InProgress' && (
                                            <Button
                                                variant="success"
                                                className={styles.actionBtn}
                                                onClick={() => handleUpdateStatus(order.id, 'Ready')}
                                            >
                                                ✅ Ready
                                            </Button>
                                        )}
                                        {order.status === 'Ready' && (
                                            <Button
                                                variant="ghost"
                                                className={styles.actionBtn}
                                                onClick={() => handleUpdateStatus(order.id, 'Served')}
                                            >
                                                🚚 Serve
                                            </Button>
                                        )}
                                        {(order.status === 'New' || order.status === 'InProgress') && (
                                            <Button
                                                variant="danger"
                                                className={styles.actionBtn}
                                                style={{ flex: '0 0 auto', width: 'auto' }}
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to cancel this order?')) {
                                                        const status: any = 'Cancelled';
                                                        updateStatus({ id: order.id, status }).unwrap();
                                                    }
                                                }}
                                            >
                                                ✕
                                            </Button>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Pagination Controls */}
            {viewType === 'completed' && orders.length > 0 && (
                <div className={`${styles.pagination} no-print`}>
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={styles.pageBtn}
                    >
                        ◀ Prev
                    </button>
                    <span className={styles.pageInfo}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={styles.pageBtn}
                    >
                        Next ▶
                    </button>
                </div>
            )}
        </div>
    );
}
