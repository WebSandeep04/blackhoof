import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBlogCategories, createBlogCategory, updateBlogCategory, deleteBlogCategory } from '../store/slices/blogCategoriesSlice';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';

export default function BlogCategories() {
    const dispatch = useDispatch();
    const { categories, pagination, loading } = useSelector(state => state.blogCategories);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [currentCategory, setCurrentCategory] = useState({ id: null, name: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchBlogCategories({ page, search: searchQuery }));
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, page, dispatch]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...currentCategory };
            
            if (currentCategory.id) {
                await dispatch(updateBlogCategory({ id: currentCategory.id, data: payload })).unwrap();
            } else {
                await dispatch(createBlogCategory(payload)).unwrap();
            }
            setIsSubmitting(false);
            setIsFormOpen(false);
            dispatch(fetchBlogCategories({ page, search: searchQuery }));
            Swal.fire({
                title: 'Success!',
                text: 'Blog category saved successfully.',
                icon: 'success',
                confirmButtonColor: '#2bb69a',
                timer: 1500
            });
        } catch (error) {
            setIsSubmitting(false);
            console.error("Error saving blog category:", error);
            Swal.fire({
                title: 'Error!',
                text: typeof error === 'string' ? error : 'Error saving category. Please check the form data.',
                icon: 'error',
                confirmButtonColor: '#2bb69a'
            });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2bb69a',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await dispatch(deleteBlogCategory(id)).unwrap();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The blog category has been deleted.',
                    icon: 'success',
                    confirmButtonColor: '#2bb69a',
                    timer: 1500
                });
            } catch (error) {
                console.error("Error deleting category:", error);
                Swal.fire({
                    title: 'Error!',
                    text: 'There was a problem deleting the category.',
                    icon: 'error',
                    confirmButtonColor: '#2bb69a'
                });
            }
        }
    };

    const openForm = (category = { id: null, name: '' }) => {
        setCurrentCategory(category);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search blog categories..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                    />
                </div>
                <button 
                    onClick={() => openForm()}
                    className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm"
                    title="Add Blog Category"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">{currentCategory.id ? 'Edit' : 'Create'} Blog Category</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input 
                                    type="text" required
                                    value={currentCategory.name}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="px-5 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition font-medium flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed">
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DataTable 
                columns={[
                    { header: 'Name', key: 'name' },
                    { header: 'Slug', key: 'slug' },
                    {
                        header: 'Actions',
                        key: 'actions',
                        className: 'text-right',
                        cellClassName: 'text-right space-x-3',
                        render: (cat) => (
                            <>
                                <button onClick={() => openForm(cat)} className="text-brand-primary hover:text-brand-hover"><Edit2 className="w-4 h-4 inline" /></button>
                                <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4 inline" /></button>
                            </>
                        )
                    }
                ]} 
                data={categories} 
                keyExtractor={(cat) => cat.id} 
                emptyMessage="No blog categories found."
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
            />
        </div>
    );
}
