'use client';

import { useMemo, useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetOrdersQuery } from '@/store/api/orderApi';
import { useGetTablesQuery, useAddTableMutation, useRemoveTableMutation } from '@/store/api/tableApi';
import { useGetBookingsQuery, useCreateBookingMutation, useDeleteBookingMutation } from '@/store/api/bookingApi';
import { Modal } from '@/components/ui/Modal';
import styles from '../../admin/admin.module.css';

export default function CashierTablesPage() {
    const { data: dbTables = [], isLoading: isTablesLoading } = useGetTablesQuery();
    const { data: ordersResponse, isLoading: isOrdersLoading } = useGetOrdersQuery({ page: 1, take: 100 });
    const orders = ordersResponse?.data || [];
    const [addTable] = useAddTableMutation();
    const [removeTable] = useRemoveTableMutation();

    const [newTableNumber, setNewTableNumber] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Booking state
    const { data: bookings = [], isLoading: isBookingsLoading } = useGetBookingsQuery();
    const [createBooking] = useCreateBookingMutation();
    const [deleteBooking] = useDeleteBookingMutation();
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<any>(null);
    const [bookingFormData, setBookingFormData] = useState({
        customerName: '',
        phone: '',
        guests: 2,
        bookingTime: ''
    });

    const tableStatus = useMemo(() => {
        const activeDineInOrders = orders.filter(
            order => order.type === 'DineIn' && ['New', 'InProgress', 'Ready', 'Served'].includes(order.status)
        );

        // Current active bookings (reserved)
        const activeBookings = bookings.filter(b => b.status === 'Reserved');

        return dbTables.map(table => {
            const activeOrder = activeDineInOrders.find(o => o.tableNumber === table.number);
            const activeBooking = activeBookings.find(b => b.tableId === table.id);

            let status = 'Available';
            if (activeOrder) status = 'Occupied';
            else if (activeBooking) status = 'Reserved';

            return {
                ...table,
                status,
                orderStatus: activeOrder?.status,
                orderId: activeOrder?.id,
                booking: activeBooking
            };
        });
    }, [dbTables, orders, bookings]);

    const handleAddTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTableNumber) return;
        try {
            setIsAdding(true);
            await addTable({ number: newTableNumber, capacity: 4 }).unwrap();
            setNewTableNumber('');
        } catch (err: any) {
            alert(err.data?.message || 'Failed to add table');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveTable = async (id: number, number: string) => {
        if (!confirm(`Are you sure you want to remove Table ${number}?`)) return;
        try {
            await removeTable(id).unwrap();
        } catch (err: any) {
            alert(err.data?.message || 'Failed to remove table');
        }
    };

    const handleOpenBooking = (table: any) => {
        setSelectedTable(table);
        setIsBookingModalOpen(true);
    };

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createBooking({
                ...bookingFormData,
                tableId: selectedTable.id
            }).unwrap();
            setIsBookingModalOpen(false);
            setBookingFormData({ customerName: '', phone: '', guests: 2, bookingTime: '' });
        } catch (err: any) {
            alert(err.data?.message || 'Failed to create booking');
        }
    };

    const handleCancelBooking = async (id: number) => {
        if (!confirm('Cancel this reservation?')) return;
        try {
            await deleteBooking(id).unwrap();
        } catch (err: any) {
            alert('Failed to cancel reservation');
        }
    };

    const isLoading = isTablesLoading || isOrdersLoading || isBookingsLoading;

    return (
        <AuthGuard allowedRoles={['Cashier', 'Admin', 'Waiter']}>
            <DashboardLayout>
                <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                        <div>
                            <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem', fontWeight: 800 }}>Table Management</h1>
                            <p style={{ color: 'var(--text-muted)' }}>Real-time occupancy and configuration</p>
                        </div>

                        <Card glass style={{ padding: '1rem', width: '300px' }}>
                            <form onSubmit={handleAddTable} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                <Input
                                    label="Add Table"
                                    placeholder="Number..."
                                    value={newTableNumber}
                                    onChange={(e) => setNewTableNumber(e.target.value)}
                                    style={{ marginBottom: 0 }}
                                />
                                <Button type="submit" loading={isAdding} size="sm" style={{ height: '42px' }}>Add</Button>
                            </form>
                        </Card>
                    </div>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '4rem' }}>
                            <p>Loading floor plan...</p>
                        </div>
                    ) : dbTables.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🪑</div>
                            <h2 style={{ fontWeight: 800 }}>No tables configured</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Use the "Add Table" form above to create your first table.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {tableStatus.map(table => (
                                <Card key={table.id} glass hover style={{
                                    border: table.status === 'Occupied' ? '1px solid var(--primary-500)' :
                                        table.status === 'Reserved' ? '1px solid #f59e0b' : '1px solid var(--glass-border)',
                                    position: 'relative',
                                    cursor: table.status === 'Available' ? 'pointer' : 'default'
                                }}
                                    onClick={() => table.status === 'Available' && handleOpenBooking(table)}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveTable(table.id, table.number);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '0.5rem',
                                            right: '0.5rem',
                                            background: 'rgba(255,59,59,0.1)',
                                            color: '#ff3b3b',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                            opacity: 0.2,
                                            zIndex: 5
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.2'}
                                        title="Remove Table"
                                    >
                                        ✕
                                    </button>
                                    <CardBody style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                                            {table.status === 'Reserved' ? '📅' : '🪑'}
                                        </div>
                                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Table {table.number}</h3>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            display: 'inline-block',
                                            background: table.status === 'Occupied' ? 'rgba(255,126,51,0.1)' :
                                                table.status === 'Reserved' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                            color: table.status === 'Occupied' ? 'var(--primary-400)' :
                                                table.status === 'Reserved' ? '#f59e0b' : '#10b981',
                                            marginTop: '0.75rem'
                                        }}>
                                            {table.status}
                                        </div>

                                        {table.status === 'Reserved' && table.booking && (
                                            <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                <div style={{ fontWeight: 700, color: '#f59e0b' }}>{table.booking.customerName}</div>
                                                <div>{new Date(table.booking.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancelBooking(table.booking!.id);
                                                    }}
                                                    style={{
                                                        marginTop: '0.5rem',
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#ff3b3b',
                                                        fontSize: '0.6rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    Cancel Booking
                                                </button>
                                            </div>
                                        )}

                                        {table.orderStatus && (
                                            <span style={{
                                                fontSize: '0.65rem',
                                                display: 'block',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '6px',
                                                marginTop: '0.75rem',
                                                padding: '0.35rem',
                                                fontWeight: 600,
                                                letterSpacing: '0.5px',
                                                textTransform: 'uppercase'
                                            }}>
                                                {table.orderStatus}
                                            </span>
                                        )}
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <Modal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    title={`📅 Book Table ${selectedTable?.number}`}
                >
                    <form onSubmit={handleBookingSubmit} style={{ padding: '0.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <Input
                                    label="Customer Name"
                                    required
                                    value={bookingFormData.customerName}
                                    onChange={(e) => setBookingFormData({ ...bookingFormData, customerName: e.target.value })}
                                />
                            </div>
                            <div>
                                <Input
                                    label="Phone Number"
                                    required
                                    value={bookingFormData.phone}
                                    onChange={(e) => setBookingFormData({ ...bookingFormData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <Input
                                    label="Guests"
                                    type="number"
                                    required
                                    value={bookingFormData.guests}
                                    onChange={(e) => setBookingFormData({ ...bookingFormData, guests: Number(e.target.value) })}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <Input
                                    label="Booking Time"
                                    type="datetime-local"
                                    required
                                    value={bookingFormData.bookingTime}
                                    onChange={(e) => setBookingFormData({ ...bookingFormData, bookingTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <Button variant="secondary" type="button" onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Confirm Reservation</Button>
                        </div>
                    </form>
                </Modal>
            </DashboardLayout>
        </AuthGuard>
    );
}

