'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
    useGetCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
} from '@/store/api/menuApi';
import type { FoodCategory } from '@/store/api/menuApi';
import styles from './categories.module.css';
import Link from 'next/link';

export default function CategoryManagementPage() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<FoodCategory | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    const { data: categoriesResponse, isLoading } = useGetCategoriesQuery({
        page,
        take: 10,
        keyword: searchTerm
    });
    const categories = categoriesResponse?.data?.data || [];
    const totalPages = categoriesResponse?.data?.totalPages || 1;
    const totalCategories = categoriesResponse?.data?.total || 0;

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
    const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();

    const [formData, setFormData] = useState({
        name: '',
        status: true,
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', formData.name);
        data.append('status', String(formData.status));
        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            if (editingCategory) {
                await updateCategory({ id: editingCategory.id, data }).unwrap();
            } else {
                await createCategory(data).unwrap();
            }
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save category:', error);
        }
    };

    const handleEdit = (category: FoodCategory) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            status: category.status,
        });
        setImagePreview(category.image || '');
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteCategory(id).unwrap();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete category:', error);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: '', status: true });
        setImageFile(null);
        setImagePreview('');
    };

    const displayCategories = categories;

    return (
        <AuthGuard allowedRoles={['Admin']}>
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.breadcrumb}>
                        <Link href="/dashboard/admin/menu">← Back to Menu Hub</Link>
                    </div>

                    <div className={styles.header}>
                        <div>
                            <h1 className={styles.title}>Categories</h1>
                            <p className={styles.subtitle}>Manage your food categories (Drinks, Main Course, etc.)</p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => setShowModal(true)}
                            icon={
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        >
                            Add Category
                        </Button>
                    </div>

                    <Card glass className={styles.searchCard}>
                        <CardBody>
                            <Input
                                type="text"
                                placeholder="Search categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                fullWidth
                                icon={
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                }
                            />
                        </CardBody>
                    </Card>

                    {isLoading ? (
                        <div className={styles.loading}>Loading categories...</div>
                    ) : (
                        <div className={styles.gridContainer}>
                            <div className={styles.grid}>
                                {displayCategories.map((category) => (
                                    <Card key={category.id} glass hover className={styles.categoryCard}>
                                        <CardBody>
                                            <div className={styles.categoryImage}>
                                                {category.image ? (
                                                    <img src={category.image} alt={category.name} />
                                                ) : (
                                                    <div className={styles.placeholderImg}>
                                                        <span>{category.name.charAt(0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.categoryInfo}>
                                                <h3 className={styles.categoryName}>{category.name}</h3>
                                                <span className={category.status ? styles.statusActive : styles.statusInactive}>
                                                    {category.status ? 'Active' : 'Inactive'}
                                                </span>
                                                <div className={styles.categoryActions}>
                                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(category)}>
                                                        Edit
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(category.id)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {!isLoading && totalPages > 1 && (
                                <div style={{
                                    padding: '1.5rem',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    marginTop: '2rem',
                                    borderTop: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.01)',
                                    borderRadius: '0 0 16px 16px'
                                }}>
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        style={{
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--glass-border)',
                                            background: page === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                                            color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                                            cursor: page === 1 ? 'not-allowed' : 'pointer',
                                            fontWeight: 700,
                                            transition: 'all 0.2s ease',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        ‹ Previous
                                    </button>

                                    <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        Page <span style={{ color: 'var(--primary-color)' }}>{page}</span> of {totalPages}
                                    </div>

                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        style={{
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--glass-border)',
                                            background: page === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                                            color: page === totalPages ? 'var(--text-muted)' : 'var(--text-main)',
                                            cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                            fontWeight: 700,
                                            transition: 'all 0.2s ease',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Next ›
                                    </button>

                                    <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        Showing {displayCategories.length} of {totalCategories} categories
                                    </div>
                                </div>
                            )}

                            {!isLoading && displayCategories.length === 0 && (
                                <div style={{ padding: '8rem', textAlign: 'center', opacity: 0.5 }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                                    <p>No categories found matching your search.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <Modal
                        isOpen={showModal}
                        onClose={handleCloseModal}
                        title={editingCategory ? 'Edit Category' : 'Add New Category'}
                        size="sm"
                    >
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="Category Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                fullWidth
                                placeholder="e.g. Main Course"
                            />

                            <div className={styles.imageUpload}>
                                <label className={styles.label}>Category Image</label>
                                <div className={styles.previewContainer}>
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className={styles.preview} />
                                    ) : (
                                        <div className={styles.uploadPlaceholder}>No image selected</div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        id="category-image"
                                        className={styles.fileInput}
                                    />
                                    <label htmlFor="category-image" className={styles.uploadButton}>
                                        {imagePreview ? 'Change Image' : 'Upload Image'}
                                    </label>
                                </div>
                            </div>

                            <div className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                    />
                                    <span>Active Status</span>
                                </label>
                            </div>

                            <Button type="submit" variant="primary" fullWidth loading={creating || updating}>
                                {editingCategory ? 'Update Category' : 'Create Category'}
                            </Button>
                        </form>
                    </Modal>

                    <Modal
                        isOpen={deleteConfirm !== null}
                        onClose={() => setDeleteConfirm(null)}
                        title="Confirm Delete"
                        size="sm"
                    >
                        <div className={styles.deleteConfirm}>
                            <p>Are you sure you want to delete this category? All linked food items may be affected.</p>
                            <div className={styles.deleteActions}>
                                <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                                    loading={deleting}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </Modal>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
