'use client';

import { useState, useMemo, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useGetUsersQuery, useCreateStaffMutation, useUpdateStaffMutation, useDeleteStaffMutation, type User } from '@/store/api/authApi';
import styles from './staff.module.css';

export default function StaffManagementPage() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const { data: usersData, isLoading } = useGetUsersQuery({
        page,
        take: 10,
        keyword: searchTerm
    });
    const users = usersData?.data || [];
    const totalPages = usersData?.totalPages || 1;
    const totalUsers = usersData?.total || 0;
    const [createStaff] = useCreateStaffMutation();
    const [updateStaff] = useUpdateStaffMutation();
    const [deleteStaff] = useDeleteStaffMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Waiter' as User['role'],
        salary: ''
    });

    // Summary Stats
    const stats = useMemo(() => {
        return {
            admins: users.filter(u => u.role === 'Admin').length,
            cashiers: users.filter(u => u.role === 'Cashier').length,
            waiters: users.filter(u => u.role === 'Waiter').length,
            kitchen: users.filter(u => u.role === 'KitchenStaff').length
        };
    }, [users]);

    // Reset to page 1 on search
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    // Use users directly as they are now filtered server-side
    const displayUsers = users;

    const handleOpenModal = (user: User | null = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                salary: user.salary?.toString() || ''
            });
        } else {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'Waiter', salary: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const updateData: any = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    salary: formData.salary ? Number(formData.salary) : null
                };
                if (formData.password) updateData.password = formData.password;
                await updateStaff({ id: editingUser.id, data: updateData }).unwrap();
            } else {
                await createStaff({
                    ...formData,
                    salary: formData.salary ? Number(formData.salary) : undefined
                } as any).unwrap();
            }
            setIsModalOpen(false);
        } catch (err) {
            alert('Failed to save staff information');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to remove this employee from the system?')) {
            try {
                await deleteStaff(id).unwrap();
            } catch (err) {
                alert('Failed to delete staff');
            }
        }
    };

    const getRoleClass = (role: string) => {
        switch (role) {
            case 'Admin': return styles.roleAdmin;
            case 'Cashier': return styles.roleCashier;
            case 'Waiter': return styles.roleWaiter;
            case 'KitchenStaff': return styles.roleKitchen;
            default: return '';
        }
    };

    return (
        <AuthGuard allowedRoles={['Admin']}>
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerInfo}>
                            <h1>Staff Management</h1>
                            <p>Control access levels and manage your restaurant team</p>
                        </div>
                        <Button variant="primary" onClick={() => handleOpenModal()} style={{ borderRadius: '12px', padding: '0.8rem 1.5rem' }}>
                            <span style={{ marginRight: '8px' }}>👤</span> Add Staff Member
                        </Button>
                    </div>

                    {/* Team Insights */}
                    <div className={styles.statsGrid}>
                        <Card glass>
                            <CardBody className={styles.statItem}>
                                <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>🛡️</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statLabel}>Administrators</span>
                                    <h3 className={styles.statValue}>{stats.admins}</h3>
                                </div>
                            </CardBody>
                        </Card>
                        <Card glass>
                            <CardBody className={styles.statItem}>
                                <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>💵</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statLabel}>Cashiers</span>
                                    <h3 className={styles.statValue}>{stats.cashiers}</h3>
                                </div>
                            </CardBody>
                        </Card>
                        <Card glass>
                            <CardBody className={styles.statItem}>
                                <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>🛎️</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statLabel}>Waiters</span>
                                    <h3 className={styles.statValue}>{stats.waiters}</h3>
                                </div>
                            </CardBody>
                        </Card>
                        <Card glass>
                            <CardBody className={styles.statItem}>
                                <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🍳</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statLabel}>Kitchen Staff</span>
                                    <h3 className={styles.statValue}>{stats.kitchen}</h3>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <div className={styles.controls}>
                        <div className={styles.searchWrapper}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search by name, email, or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '8rem', textAlign: 'center' }}>
                            <div className="loader" style={{ marginBottom: '1rem' }}>⌛</div>
                            <p style={{ color: 'var(--text-muted)' }}>Synchronizing team directory...</p>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.staffTable}>
                                <thead>
                                    <tr>
                                        <th>Employee Details</th>
                                        <th>Internal Email</th>
                                        <th>Permission Level</th>
                                        <th>Monthly Salary</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <div className={styles.avatar}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className={styles.userName}>
                                                        <span>{user.name}</span>
                                                        <span className={styles.userEmail}>{user.role} Member</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`${styles.roleBadge} ${getRoleClass(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                                                {user.salary ? `$${Number(user.salary).toLocaleString()}` : "Not Set"}
                                            </td>
                                            <td>
                                                <div className={styles.actionButtons} style={{ justifyContent: 'flex-end' }}>
                                                    <Button variant="secondary" size="sm" className={styles.editBtn} onClick={() => handleOpenModal(user)}>Edit</Button>
                                                    <Button variant="danger" size="sm" className={styles.deleteBtn} onClick={() => handleDelete(user.id)}>Remove</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No team members found matching "{searchTerm}"
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {!isLoading && totalPages > 1 && (
                                <div style={{
                                    padding: '1.5rem',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    borderTop: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.01)'
                                }}>
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        style={{
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: '10px',
                                            border: '1px solid var(--glass-border)',
                                            background: page === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                                            color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                                            cursor: page === 1 ? 'not-allowed' : 'pointer',
                                            fontWeight: 700
                                        }}
                                    >
                                        ‹ Previous
                                    </button>

                                    <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                                        Page <span style={{ color: 'var(--primary-color)' }}>{page}</span> of {totalPages}
                                    </div>

                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        style={{
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: '10px',
                                            border: '1px solid var(--glass-border)',
                                            background: page === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                                            color: page === totalPages ? 'var(--text-muted)' : 'var(--text-main)',
                                            cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                            fontWeight: 700
                                        }}
                                    >
                                        Next ›
                                    </button>

                                    <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        Showing {displayUsers.length} of {totalUsers} employees
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingUser ? '⚓ Update Personnel' : '👤 Onboard New Staff'}
                >
                    <form onSubmit={handleSubmit} style={{ padding: '0.5rem' }}>
                        <div className={styles.formGrid}>
                            <div className={styles.fullWidth}>
                                <label className={styles.formLabel}>Full name</label>
                                <Input
                                    placeholder="e.g. Rezwan Ahmmed"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.fullWidth}>
                                <label className={styles.formLabel}>Email address</label>
                                <Input
                                    type="email"
                                    placeholder="name@restaurant.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className={styles.formLabel}>{editingUser ? "Change Password" : "Set Password"}</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                />
                            </div>
                            <div>
                                <label className={styles.formLabel}>Staff Role</label>
                                <select
                                    className={styles.formSelect}
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                >
                                    <option value="Admin">Administrator</option>
                                    <option value="Cashier">Cashier</option>
                                    <option value="Waiter">Waiter</option>
                                    <option value="KitchenStaff">Kitchen Staff</option>
                                </select>
                            </div>
                            <div>
                                <label className={styles.formLabel}>Monthly Salary ($)</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 2500"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
                            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Discard</Button>
                            <Button variant="primary" type="submit" style={{ padding: '0.8rem 2rem' }}>
                                {editingUser ? 'Save Changes' : 'Confirm Onboarding'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </DashboardLayout>
        </AuthGuard>
    );
}

