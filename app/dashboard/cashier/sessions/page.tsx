'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetCurrentSessionQuery, useGetSessionHistoryQuery, useStartSessionMutation, useCloseSessionMutation } from '@/store/api/sessionApi';
import toast from 'react-hot-toast';
import styles from '../dashboard.module.css';

export default function CashierSessionsPage() {
    const { data: currentSession, isLoading } = useGetCurrentSessionQuery();
    const [historyPage, setHistoryPage] = useState(1);
    const { data: sessionHistory } = useGetSessionHistoryQuery({ page: historyPage, take: 5 });
    const [startSession, { isLoading: isStarting }] = useStartSessionMutation();
    const [closeSession, { isLoading: isClosing }] = useCloseSessionMutation();

    const [openingCash, setOpeningCash] = useState('');
    const [closingCash, setClosingCash] = useState('');
    const [terminalId, setTerminalId] = useState('1'); // Default terminal
    const [showHistory, setShowHistory] = useState(false);

    const handleStart = async () => {
        try {
            await startSession({ terminalId, openingCash: Number(openingCash) }).unwrap();
            setOpeningCash('');
            toast.success('✅ Session started successfully!');
        } catch (err: any) {
            console.error('Failed to start session', err);
            toast.error(err?.data?.message || 'Failed to start session');
        }
    };

    const handleClose = async () => {
        if (!currentSession) return;

        const expectedCash = (Number(currentSession.openingCash) + Number(currentSession.totalSales || 0)).toFixed(2);

        try {
            await closeSession({
                sessionId: currentSession.id,
                closingCash: Number(expectedCash)
            }).unwrap();
            toast.success('✅ Session closed successfully!');
        } catch (err: any) {
            console.error('Failed to close session', err);
            toast.error(err?.data?.message || 'Failed to close session');
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Loading session data...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <AuthGuard allowedRoles={['Cashier', 'Admin']}>
            <DashboardLayout>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            💼 Session Management
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Manage your daily cash register sessions. Sessions auto-close after 24 hours.
                        </p>
                    </div>

                    {/* Toggle History Button */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <Button
                            variant={showHistory ? 'primary' : 'secondary'}
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            {showHistory ? '📊 Current Session' : '📜 View History'}
                        </Button>
                    </div>

                    {!showHistory ? (
                        /* Current Session View */
                        currentSession ? (
                            <Card glass>
                                <CardHeader>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            🟢 Active Session
                                        </h3>
                                        <span style={{
                                            padding: '0.5rem 1rem',
                                            background: 'rgba(16, 185, 129, 0.2)',
                                            color: '#10b981',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            border: '1px solid rgba(16, 185, 129, 0.3)'
                                        }}>
                                            OPEN
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>⏰ Started At</p>
                                            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{new Date(currentSession.openedAt).toLocaleString()}</p>
                                        </div>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>💵 Opening Cash</p>
                                            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#34d399' }}>${Number(currentSession.openingCash).toFixed(2)}</p>
                                        </div>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>🖥️ Terminal ID</p>
                                            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>#{currentSession.terminalId}</p>
                                        </div>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>🆔 Session ID</p>
                                            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>#{currentSession.id}</p>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                                        <div style={{
                                            marginBottom: '1.5rem',
                                            background: 'linear-gradient(135deg, rgba(255, 126, 51, 0.1) 0%, rgba(255, 126, 51, 0.05) 100%)',
                                            padding: '1.5rem',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255, 126, 51, 0.2)'
                                        }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>💰 Current Session Sales</p>
                                            <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-color)' }}>
                                                ${Number(currentSession.totalSales || 0).toFixed(2)}
                                            </p>
                                        </div>

                                        <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>🔒 Close Session</h4>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: '250px' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <Input
                                                        label={
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                                <span>💵 Closing Cash Amount</span>
                                                                <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                                                                    Total Sales: ${Number(currentSession.totalSales || 0).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        }
                                                        type="number"
                                                        placeholder="Calculated automatically"
                                                        value={(Number(currentSession.openingCash) + Number(currentSession.totalSales || 0)).toFixed(2)}
                                                        readOnly
                                                        style={{ opacity: 0.8, cursor: 'not-allowed', backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                    />
                                                    <div style={{
                                                        marginTop: '0.5rem',
                                                        fontSize: '0.85rem',
                                                        color: 'var(--text-muted)',
                                                        display: 'flex',
                                                        justifyContent: 'flex-end',
                                                        gap: '0.5rem'
                                                    }}>
                                                        <span>Expected In Drawer:</span>
                                                        <strong style={{ color: '#34d399' }}>
                                                            ${(Number(currentSession.openingCash) + Number(currentSession.totalSales || 0)).toFixed(2)}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="danger"
                                                onClick={handleClose}
                                                disabled={isClosing}
                                                size="lg"
                                            >
                                                {isClosing ? '⏳ Closing...' : '🔒 Close Session'}
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ) : (
                            <Card glass>
                                <CardHeader>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        🚀 Start New Session
                                    </h3>
                                </CardHeader>
                                <CardBody>
                                    <div style={{
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        marginBottom: '1.5rem',
                                        border: '1px solid rgba(245, 158, 11, 0.3)'
                                    }}>
                                        <p style={{ fontSize: '0.9rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            ⚠️ <strong>Important:</strong> You must start a session before creating any orders.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
                                        <Input
                                            label="🖥️ Terminal ID"
                                            placeholder="e.g. 1"
                                            value={terminalId}
                                            onChange={(e) => setTerminalId(e.target.value)}
                                        />
                                        <Input
                                            label="💵 Opening Cash Amount"
                                            type="number"
                                            placeholder="Enter initial cash in drawer"
                                            value={openingCash}
                                            onChange={(e) => setOpeningCash(e.target.value)}
                                        />
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={handleStart}
                                            disabled={!openingCash || isStarting}
                                            fullWidth
                                        >
                                            {isStarting ? '⏳ Starting...' : '🚀 Start Session'}
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        )
                    ) : (
                        /* Session History View */
                        <Card glass>
                            <CardHeader>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    📜 Session History
                                </h3>
                            </CardHeader>
                            <CardBody>
                                {sessionHistory?.data && sessionHistory.data.length > 0 ? (
                                    <>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {sessionHistory.data.map((session) => (
                                                <div
                                                    key={session.id}
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.03)',
                                                        padding: '1.5rem',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                                        e.currentTarget.style.transform = 'translateX(4px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                                        e.currentTarget.style.transform = 'translateX(0)';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                        <div>
                                                            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                                                Session #{session.id} • Terminal {session.terminalId}
                                                            </h4>
                                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                {new Date(session.openedAt).toLocaleDateString()} • {new Date(session.openedAt).toLocaleTimeString()} - {session.closedAt ? new Date(session.closedAt).toLocaleTimeString() : 'N/A'}
                                                            </p>
                                                        </div>
                                                        <span style={{
                                                            padding: '0.5rem 1rem',
                                                            background: 'rgba(107, 114, 128, 0.2)',
                                                            color: '#9ca3af',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            border: '1px solid rgba(107, 114, 128, 0.3)'
                                                        }}>
                                                            CLOSED
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                                        <div>
                                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Opening Cash</p>
                                                            <p style={{ fontWeight: 700, color: '#34d399' }}>${Number(session.openingCash).toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Sales</p>
                                                            <p style={{ fontWeight: 700, color: 'var(--primary-color)' }}>${Number(session.totalSales || 0).toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Closing Cash</p>
                                                            <p style={{ fontWeight: 700 }}>${Number(session.closingCash || 0).toFixed(2)}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Variance</p>
                                                            <p style={{
                                                                fontWeight: 700,
                                                                color: (Number(session.closingCash || 0) - (Number(session.openingCash) + Number(session.totalSales || 0))) >= 0 ? '#34d399' : '#ef4444'
                                                            }}>
                                                                ${(Number(session.closingCash || 0) - (Number(session.openingCash) + Number(session.totalSales || 0))).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {sessionHistory.totalPages > 1 && (
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
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                                    disabled={historyPage === 1}
                                                >
                                                    ‹ Previous
                                                </Button>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                    Page {historyPage} of {sessionHistory.totalPages}
                                                </span>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setHistoryPage(p => Math.min(sessionHistory.totalPages, p + 1))}
                                                    disabled={historyPage === sessionHistory.totalPages}
                                                >
                                                    Next ›
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Session History</p>
                                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>You haven't closed any sessions yet.</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
