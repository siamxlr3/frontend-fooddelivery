import React from 'react';
import { useGetCategoriesQuery, useDeleteCategoryMutation } from '@/store/api/menuApi';
import styles from './CategoryPage.module.css';

type CategoryListProps = {
    onEdit: (categoryId: number) => void;
};

export default function CategoryList({ onEdit }: CategoryListProps) {
    const { data: categoriesResponse, error, isLoading } = useGetCategoriesQuery({ take: 100 });
    const [deleteCategory] = useDeleteCategoryMutation();

    const handleDelete = async (id: number) => {
        if (window.confirm('Delete this category?')) {
            await deleteCategory(id);
        }
    };

    if (isLoading) return <p>Loading categories...</p>;
    if (error) return <p>Error loading categories.</p>;

    const categories = categoriesResponse?.data?.data || [];

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {categories.map((cat) => (
                    <tr key={cat.id}>
                        <td>{cat.name}</td>
                        <td>{cat.status ? 'Active' : 'Inactive'}</td>
                        <td>
                            <button className={styles.editBtn} onClick={() => onEdit(cat.id)}>
                                Edit
                            </button>
                            <button className={styles.deleteBtn} onClick={() => handleDelete(cat.id)}>
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
