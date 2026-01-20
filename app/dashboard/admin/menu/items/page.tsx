'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
    useGetFoodsQuery,
    useGetCategoriesQuery,
    useCreateFoodMutation,
    useUpdateFoodMutation,
    useDeleteFoodMutation,
} from '@/store/api/menuApi';
import type { Food } from '@/store/api/menuApi';
import type { RootState } from '@/store/store';
import styles from './menu-items.module.css';
import Link from 'next/link';

export default function MenuItemsManagementPage() {
    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role === 'Admin';
    const [page, setPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingFood, setEditingFood] = useState<Food | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    const { data: foodsResponse, isLoading: foodsLoading } = useGetFoodsQuery({
        page,
        take: 10,
        keyword: searchTerm,
        categoryId: selectedCategory,
    });
    const { data: categoriesResponse } = useGetCategoriesQuery({ take: 100 });
    const categories = categoriesResponse?.data?.data || [];
    const foods = foodsResponse?.data?.data || [];
    const totalFoods = foodsResponse?.data?.total || 0;
    const totalPages = Math.ceil(totalFoods / 10);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, selectedCategory]);

    const [createFood, { isLoading: creating }] = useCreateFoodMutation();
    const [updateFood, { isLoading: updating }] = useUpdateFoodMutation();
    const [deleteFood, { isLoading: deleting }] = useDeleteFoodMutation();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        status: true,
        ingredients: '',
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
        data.append('description', formData.description);
        data.append('price', formData.price);
        data.append('categoryId', formData.categoryId);
        data.append('status', String(formData.status));
        data.append('ingredients', formData.ingredients);
        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            if (editingFood) {
                await updateFood({ id: editingFood.id, data }).unwrap();
            } else {
                await createFood(data).unwrap();
            }
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save food:', error);
        }
    };

    const handleEdit = (food: Food) => {
        setEditingFood(food);
        setFormData({
            name: food.name,
            description: food.description || '',
            price: food.price.toString(),
            categoryId: food.categoryId.toString(),
            status: food.status,
            ingredients: food.ingredients || '',
        });
        setImagePreview(food.image || '');
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteFood(id).unwrap();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete food:', error);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingFood(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            categoryId: '',
            status: true,
            ingredients: '',
        });
        setImageFile(null);
        setImagePreview('');
    };

    return (
        <AuthGuard allowedRoles={['Admin', 'Waiter', 'Cashier', 'KitchenStaff']}>
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.breadcrumb}>
                        <Link href={isAdmin ? "/dashboard/admin/menu" : "/dashboard/waiter"}>
                            ← Back to {isAdmin ? 'Menu Hub' : 'Dashboard'}
                        </Link>
                    </div>

                    {/* Statistics Row */}
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>🍔</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statLabel}>Total Dishes</span>
                                <span className={styles.statValue}>{totalFoods}</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>📂</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statLabel}>Categories</span>
                                <span className={styles.statValue}>{categories.length}</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>⚡</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statLabel}>Active Status</span>
                                <span className={styles.statValue}>Live</span>
                            </div>
                        </div>
                        {isAdmin && (
                            <button className={styles.addNewBtn} onClick={() => setShowModal(true)}>
                                <span className={styles.plusIcon}>+</span>
                                <div>
                                    <span className={styles.btnTitle}>New Dish</span>
                                    <span className={styles.btnSubtitle}>Add to menu</span>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Advanced Filter Bar */}
                    <div className={styles.filterBar}>
                        <div className={styles.searchContainer}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search your culinary masterpiece..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>

                        <div className={styles.filterActions}>
                            <select
                                value={selectedCategory || ''}
                                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                                className={styles.categorySelect}
                            >
                                <option value="">All Collections</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {foodsLoading ? (
                        <div className={styles.loading}>Loading menu items...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className={styles.grid}>
                                {foods.map((food) => (
                                    <Card key={food.id} glass hover className={styles.foodCard}>
                                        <CardBody style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
                                            <div className={styles.foodImage}>
                                                {food.image ? (
                                                    <img src={food.image} alt={food.name} />
                                                ) : (
                                                    <div className={styles.placeholderImg}>🍽️</div>
                                                )}
                                                {food.discountPercentage > 0 && (
                                                    <div className={styles.discountBadge}>
                                                        -{food.discountPercentage}% OFF
                                                    </div>
                                                )}
                                                {!food.status && (
                                                    <div className={styles.outOfStockOverlay}>
                                                        <span>Sold Out</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.foodInfo}>
                                                <div className={styles.foodHeader}>
                                                    <h3 className={styles.foodName}>{food.name}</h3>
                                                    <span className={styles.foodCategory}>{food.category?.name}</span>
                                                </div>
                                                <p className={styles.foodDesc}>{food.description}</p>
                                                <div className={styles.foodMeta}>
                                                    <div className={styles.priceContainer}>
                                                        {food.discountPercentage > 0 ? (
                                                            <>
                                                                <span className={styles.price}>
                                                                    ${(Number(food.price) * (1 - food.discountPercentage / 100)).toFixed(2)}
                                                                </span>
                                                                <span className={styles.originalPrice}>
                                                                    ${Number(food.price).toFixed(2)}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className={styles.price}>${Number(food.price).toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                    <div className={food.status ? styles.statusAvailable : styles.statusOut}>
                                                        <span className={styles.statusDot}></span>
                                                        {food.status ? 'Live' : 'Hidden'}
                                                    </div>
                                                </div>
                                                {isAdmin && (
                                                    <div className={styles.foodActions}>
                                                        <button className={styles.actionBtnEdit} onClick={() => handleEdit(food)}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            <span>Edit Details</span>
                                                        </button>
                                                        <button className={styles.actionBtnDelete} onClick={() => setDeleteConfirm(food.id)} title="Delete Item">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        className={styles.paginationBtn}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        ‹ Previous
                                    </button>

                                    <div className={styles.pageInfo}>
                                        Page <span>{page}</span> of {totalPages}
                                    </div>

                                    <button
                                        className={styles.paginationBtn}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        Next ›
                                    </button>

                                    <div className={styles.showingText}>
                                        Showing {foods.length} of {totalFoods} dishes
                                    </div>
                                </div>
                            )}

                            {foods.length === 0 && !foodsLoading && (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>🍽️</div>
                                    <h2 className={styles.emptyTitle}>No dishes found</h2>
                                    <p className={styles.emptyText}>Try adjusting your search or category filters.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <Modal
                        isOpen={showModal}
                        onClose={handleCloseModal}
                        title={editingFood ? '📝 Edit Masterpiece' : '✨ Create New Dish'}
                        size="md"
                    >
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Premium Header with Image Preview */}
                            <div className={styles.formHeader}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className={styles.headerImagePreview} />
                                ) : (
                                    <div className={styles.placeholderIcon}>🍽️</div>
                                )}
                                <div className={styles.uploadOverlay} onClick={() => document.getElementById('food-image-input')?.click()}>
                                    <span className={styles.uploadIconLarge}>📸</span>
                                    <span className={styles.uploadText}>{imagePreview ? 'Change Photography' : 'Add Food Photography'}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        id="food-image-input"
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            <div className={styles.formBody}>
                                {/* Basic Info */}
                                <div className={styles.premiumGroup}>
                                    <label className={styles.premiumLabel}>Item Master Name</label>
                                    <input
                                        className={styles.inputVibe}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter dish name..."
                                        required
                                    />
                                </div>

                                {/* Category Selection (Relation) */}
                                <div className={styles.premiumGroup}>
                                    <label className={styles.premiumLabel}>Select Category</label>
                                    <div className={styles.categoryGrid}>
                                        {categories.map((cat) => (
                                            <div
                                                key={cat.id}
                                                className={`${styles.categoryChip} ${formData.categoryId === cat.id.toString() ? styles.active : ''}`}
                                                onClick={() => setFormData({ ...formData, categoryId: cat.id.toString() })}
                                            >
                                                <span className={styles.chipIcon}>
                                                    {cat.name.toLowerCase().includes('drink') ? '🥤' :
                                                        cat.name.toLowerCase().includes('pizza') ? '🍕' :
                                                            cat.name.toLowerCase().includes('burger') ? '🍔' : '🍛'}
                                                </span>
                                                <span className={styles.chipName}>{cat.name}</span>
                                                {formData.categoryId === cat.id.toString() && (
                                                    <div className={styles.activeIndicator}>✓</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Link to Category Management */}
                                    <Link href="/dashboard/admin/menu/categories" className={styles.relationLink}>
                                        + Manage Categories
                                    </Link>
                                </div>

                                <div className={styles.rowSplit}>
                                    <div className={styles.premiumGroup}>
                                        <label className={styles.premiumLabel}>Price ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={styles.inputVibe}
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className={styles.premiumGroup}>
                                        <label className={styles.premiumLabel}>Inventory Status</label>
                                        <div className={styles.statusCard}>
                                            <div className={styles.statusLabel}>
                                                <span className={styles.statusTitle}>{formData.status ? 'Live' : 'Hidden'}</span>
                                                <span className={styles.statusDesc}>{formData.status ? 'Available for orders' : 'Out of stock'}</span>
                                            </div>
                                            <label className={styles.switch}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                                />
                                                <span className={styles.slider}></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.premiumGroup}>
                                    <label className={styles.premiumLabel}>Gourmet Description</label>
                                    <textarea
                                        className={`${styles.inputVibe} styles.textareaVibe`}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Tell the story of this dish..."
                                        rows={2}
                                    />
                                </div>

                                <div className={styles.premiumGroup}>
                                    <label className={styles.premiumLabel}>Key Ingredients</label>
                                    <input
                                        className={styles.inputVibe}
                                        value={formData.ingredients}
                                        onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                                        placeholder="e.g. Organic beef, Truffle oil..."
                                    />
                                </div>
                            </div>

                            <div className={styles.formFooterPremium}>
                                <button type="button" className={styles.cancelBtnPremium} onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtnPremium} disabled={creating || updating}>
                                    {creating || updating ? 'Processing...' : editingFood ? 'Save Changes' : 'Publish Dish'}
                                </button>
                            </div>
                        </form>
                    </Modal>

                    <Modal
                        isOpen={deleteConfirm !== null}
                        onClose={() => setDeleteConfirm(null)}
                        title="Confirm Delete"
                        size="sm"
                    >
                        <div className={styles.deleteConfirm}>
                            <p>Are you sure you want to delete this menu item?</p>
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
