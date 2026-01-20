'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useGetSuppliersQuery, useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation, type Supplier } from '@/store/api/supplierApi';
import styles from './suppliers.module.css';

export default function SuppliersPage() {
    const { data: suppliersData, isLoading } = useGetSuppliersQuery();
    const suppliers = suppliersData?.data || [];

    const [createSupplier] = useCreateSupplierMutation();
    const [updateSupplier] = useUpdateSupplierMutation();
    const [deleteSupplier] = useDeleteSupplierMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        itemType: '',
        status: 'Active',
        purchaseDate: '',
        totalPurchaseAmount: '',
        paymentStatus: 'Pending'
    });

    const handleOpenModal = (supplier: Supplier | null = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                phone: supplier.phone,
                email: supplier.email || '',
                address: supplier.address || '',
                itemType: supplier.itemType,
                status: supplier.status,
                purchaseDate: supplier.purchaseDate ? new Date(supplier.purchaseDate).toISOString().split('T')[0] : '',
                totalPurchaseAmount: supplier.totalPurchaseAmount?.toString() || '',
                paymentStatus: supplier.paymentStatus || 'Pending'
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '',
                phone: '',
                email: '',
                address: '',
                itemType: '',
                status: 'Active',
                purchaseDate: '',
                totalPurchaseAmount: '',
                paymentStatus: 'Pending'
            });
        }
        setIsModalOpen(true);
    };

    const handleViewInvoice = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsInvoiceModalOpen(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const handlePrintTable = () => {
        // We can use window.print() and the CSS will handle hiding non-table elements
        // But for a better experience, we can set a print-specific class or state
        window.print();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                totalPurchaseAmount: formData.totalPurchaseAmount ? Number(formData.totalPurchaseAmount) : undefined,
                purchaseDate: formData.purchaseDate || undefined
            };

            if (editingSupplier) {
                await updateSupplier({ id: editingSupplier.id, data }).unwrap();
            } else {
                await createSupplier(data).unwrap();
            }
            setIsModalOpen(false);
        } catch (err) {
            alert('Failed to save supplier information');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to remove this supplier?')) {
            try {
                await deleteSupplier(id).unwrap();
            } catch (err) {
                alert('Failed to delete supplier');
            }
        }
    };

    const filteredSuppliers = suppliers.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.itemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.phone.includes(searchTerm);

        if (!matchesSearch) return false;

        if (s.purchaseDate) {
            const date = new Date(s.purchaseDate);
            const y = date.getFullYear().toString();
            const m = (date.getMonth() + 1).toString();
            const d = date.getDate().toString();

            if (filterYear && y !== filterYear) return false;
            if (filterMonth && m !== filterMonth) return false;
            if (filterDate) {
                const selectedDate = new Date(filterDate);
                if (date.toDateString() !== selectedDate.toDateString()) return false;
            }
        } else if (filterYear || filterMonth || filterDate) {
            return false;
        }

        return true;
    });

    return (
        <AuthGuard allowedRoles={['Admin']}>
            <DashboardLayout>
                <div className={styles.container} data-print-mode={isInvoiceModalOpen ? 'invoice' : 'report'}>
                    <div className={styles.header}>
                        <div className={styles.headerInfo}>
                            <h1>Supplier Directory</h1>
                            <p>Manage your restaurant's inventory sources and procurement</p>
                        </div>
                        <Button variant="primary" onClick={() => handleOpenModal()} style={{ borderRadius: '12px', padding: '0.8rem 1.5rem' }}>
                            <span style={{ marginRight: '8px' }}>📦</span> Define Supplier
                        </Button>
                    </div>

                    <div className={styles.controls}>
                        <div className={styles.searchWrapper}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search by name, item type, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className={styles.dateFilters}>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Year</label>
                                <select
                                    className={styles.formSelect}
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                >
                                    <option value="">All Years</option>
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                        <option key={y} value={y.toString()}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Month</label>
                                <select
                                    className={styles.formSelect}
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(e.target.value)}
                                >
                                    <option value="">All Months</option>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={(i + 1).toString()}>
                                            {new Date(0, i).toLocaleString('en', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Specific Date</label>
                                <Input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                />
                            </div>
                            <div className={styles.filterGroup} style={{ alignSelf: 'flex-end' }}>
                                <Button variant="secondary" onClick={handlePrintTable}>
                                    📄 Print Report
                                </Button>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '8rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Loading suppliers...</p>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.suppliersTable}>
                                <thead>
                                    <tr>
                                        <th>Supplier Name</th>
                                        <th>Contact Info</th>
                                        <th>Item Type</th>
                                        <th>Last Purchase</th>
                                        <th>Total Amount</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSuppliers.map(supplier => (
                                        <tr key={supplier.id}>
                                            <td style={{ fontWeight: 700 }}>{supplier.name}</td>
                                            <td>
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <div>📞 {supplier.phone}</div>
                                                    <div style={{ color: 'var(--text-muted)' }}>✉️ {supplier.email || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                                                    {supplier.itemType}
                                                </span>
                                            </td>
                                            <td>{supplier.purchaseDate ? new Date(supplier.purchaseDate).toLocaleDateString() : 'No data'}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                                                ${Number(supplier.totalPurchaseAmount || 0).toLocaleString()}
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${supplier.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                                                    {supplier.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600 }} className={
                                                    supplier.paymentStatus === 'Paid' ? styles.paymentPaid :
                                                        supplier.paymentStatus === 'Pending' ? styles.paymentPending : styles.paymentPartial
                                                }>
                                                    {supplier.paymentStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <Button variant="secondary" size="sm" onClick={() => handleViewInvoice(supplier)}>📄 Invoice</Button>
                                                    <Button variant="secondary" size="sm" onClick={() => handleOpenModal(supplier)}>Edit</Button>
                                                    <Button variant="danger" size="sm" onClick={() => handleDelete(supplier.id)}>Delete</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSuppliers.length === 0 && (
                                        <tr>
                                            <td colSpan={8} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No suppliers found. Click "Define Supplier" to add one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingSupplier ? '📝 Update Supplier' : '📦 Register New Supplier'}
                >
                    <form onSubmit={handleSubmit} style={{ padding: '0.5rem' }}>
                        <div className={styles.formGrid}>
                            <div className={styles.fullWidth}>
                                <label className={styles.formLabel}>Supplier Name</label>
                                <Input
                                    placeholder="e.g. Fresh Farm Produce"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className={styles.formLabel}>Phone Number</label>
                                <Input
                                    placeholder="+1 234 567 890"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className={styles.formLabel}>Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="contact@supplier.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className={styles.fullWidth}>
                                <label className={styles.formLabel}>Physical Address</label>
                                <Input
                                    placeholder="123 Supply Lane, Business District"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={styles.formLabel}>Item Type</label>
                                <Input
                                    placeholder="e.g. Vegetables, Meat, Dairy"
                                    value={formData.itemType}
                                    onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className={styles.formLabel}>Status</label>
                                <select
                                    className={styles.formSelect}
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className={styles.formLabel}>Recent Purchase Date</label>
                                <Input
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={styles.formLabel}>Total Purchased Amount ($)</label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.totalPurchaseAmount}
                                    onChange={(e) => setFormData({ ...formData, totalPurchaseAmount: e.target.value })}
                                />
                            </div>
                            <div className={styles.fullWidth}>
                                <label className={styles.formLabel}>Payment Status</label>
                                <select
                                    className={styles.formSelect}
                                    value={formData.paymentStatus}
                                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                                >
                                    <option value="Paid">Paid</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Partial">Partial</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">
                                {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                <Modal
                    isOpen={isInvoiceModalOpen}
                    onClose={() => setIsInvoiceModalOpen(false)}
                    title="Supplier Invoice Preview"
                >
                    {selectedSupplier && (
                        <div className={styles.printSection}>
                            <div className={styles.invoiceContainer}>
                                <div className={styles.invoiceHeader}>
                                    <div>
                                        <h2 className={styles.invoiceTitle}>INVOICE</h2>
                                        <p style={{ color: '#666' }}>#{selectedSupplier.id.toString().padStart(6, '0')}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <h3 style={{ margin: 0 }}>Antigravity Foods</h3>
                                        <p style={{ margin: '0.2rem 0', color: '#666' }}>Restaurant Management System</p>
                                        <p style={{ margin: 0, color: '#666' }}>{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className={styles.invoiceInfo}>
                                    <div className={styles.infoBlock}>
                                        <h4>Supplier Details</h4>
                                        <p>{selectedSupplier.name}</p>
                                        <p>{selectedSupplier.phone}</p>
                                        <p>{selectedSupplier.email || 'No Email'}</p>
                                        <p>{selectedSupplier.address || 'No Address'}</p>
                                    </div>
                                    <div className={styles.infoBlock} style={{ textAlign: 'right' }}>
                                        <h4>Transaction Info</h4>
                                        <p>Status: {selectedSupplier.status}</p>
                                        <p>Payment: {selectedSupplier.paymentStatus}</p>
                                        <p>Date: {selectedSupplier.purchaseDate ? new Date(selectedSupplier.purchaseDate).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>

                                <table className={styles.invoiceTable}>
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Item Type</th>
                                            <th style={{ textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Purchase from {selectedSupplier.name}</td>
                                            <td>{selectedSupplier.itemType}</td>
                                            <td style={{ textAlign: 'right' }}>${Number(selectedSupplier.totalPurchaseAmount || 0).toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className={styles.invoiceFooter}>
                                    <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Total Payable Amount</p>
                                    <h2 className={styles.totalAmount}>${Number(selectedSupplier.totalPurchaseAmount || 0).toLocaleString()}</h2>
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }} className={styles.noPrint}>
                                <Button variant="secondary" onClick={() => setIsInvoiceModalOpen(false)}>Close</Button>
                                <Button variant="primary" onClick={handlePrint}>🖨️ Print / Download PDF</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </DashboardLayout>
        </AuthGuard>
    );
}
