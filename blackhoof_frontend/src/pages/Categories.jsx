import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../store/slices/categoriesSlice';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';

export default function Categories() {
    const dispatch = useDispatch();
    const { categories, flatCategories, pagination, loading: categoriesLoading } = useSelector(state => state.categories);
    const { user: authUser } = useSelector(state => state.auth);
    const loading = categoriesLoading;
    
    const hasPermission = (permission) => authUser?.permissions?.includes(permission);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [currentCategory, setCurrentCategory] = useState({ id: null, name: '', slug: '', parent_id: '', is_active: true, image: null, imageUrl: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Fetch all categories for the parent dropdown
        dispatch(fetchCategories({ all: true }));
    }, [dispatch]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchCategories({ page, search: searchQuery }));
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

    const generateSlug = (name) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        // Only auto-generate slug if it's a new category and slug hasn't been manually heavily edited
        if (!currentCategory.id) {
            setCurrentCategory({ ...currentCategory, name, slug: generateSlug(name) });
        } else {
            setCurrentCategory({ ...currentCategory, name });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', currentCategory.name);
            formData.append('slug', currentCategory.slug);
            if (currentCategory.parent_id) {
                formData.append('parent_id', currentCategory.parent_id);
            }
            formData.append('is_active', currentCategory.is_active ? 1 : 0);
            
            if (currentCategory.image) {
                formData.append('image', currentCategory.image);
            }

            if (currentCategory.id) {
                await dispatch(updateCategory({ id: currentCategory.id, categoryData: formData })).unwrap();
            } else {
                await dispatch(createCategory(formData)).unwrap();
            }
            
            setIsSubmitting(false);
            setIsFormOpen(false);
            
            // Refresh lists
            dispatch(fetchCategories({ page, search: searchQuery }));
            dispatch(fetchCategories({ all: true }));
            
            Swal.fire({
                title: 'Success!',
                text: 'Category saved successfully.',
                icon: 'success',
                confirmButtonColor: '#2bb69a',
                timer: 1500
            });
        } catch (error) {
            setIsSubmitting(false);
            console.error("Error saving category:", error);
            
            // Format validation errors if present
            let errorMessage = 'There was a problem saving the category.';
            if (error.errors) {
                const messages = Object.values(error.errors).flat();
                if (messages.length > 0) {
                    errorMessage = messages.join('\n');
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            Swal.fire({
                title: 'Error!',
                text: errorMessage,
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
                await dispatch(deleteCategory(id)).unwrap();
                // Refresh dropdown list
                dispatch(fetchCategories({ all: true }));
                dispatch(fetchCategories({ page, search: searchQuery }));

                Swal.fire({
                    title: 'Deleted!',
                    text: 'The category has been deleted.',
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

    const openForm = (category = { id: null, name: '', slug: '', parent_id: '', is_active: true, image: null, imageUrl: null }) => {
        setCurrentCategory({ 
            ...category, 
            parent_id: category.parent_id || '',
            is_active: category.is_active === undefined ? true : category.is_active,
            image: null,
            imageUrl: category.image ? `http://localhost:8000/storage/${category.image}` : null
        });
        setIsFormOpen(true);
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCurrentCategory({
                ...currentCategory,
                image: file,
                imageUrl: URL.createObjectURL(file)
            });
        }
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
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                    />
                </div>
                {hasPermission('create categories') && (
                    <button 
                        onClick={() => openForm()}
                        className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm"
                        title="Add Category"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">{currentCategory.id ? 'Edit' : 'Create'} Category</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={currentCategory.name}
                                    onChange={handleNameChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                <input 
                                    type="text" 
                                    required
                                    value={currentCategory.slug}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, slug: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-gray-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                                <select 
                                    value={currentCategory.parent_id}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, parent_id: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                                >
                                    <option value="">None (Top Level)</option>
                                    {flatCategories
                                        .filter(c => c.id !== currentCategory.id) // Prevent self-referencing
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center mt-2">
                                <input 
                                    type="checkbox" 
                                    id="isActive"
                                    checked={currentCategory.is_active}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, is_active: e.target.checked })}
                                    className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
                                />
                                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">Is Active</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                                />
                                {currentCategory.imageUrl && (
                                    <div className="mt-2">
                                        <img src={currentCategory.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border" />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="px-5 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition font-medium flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed">
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {isSubmitting ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DataTable 
                columns={[
                    { header: 'ID', key: 'id' },
                    { 
                        header: 'Image', 
                        key: 'image',
                        render: (category) => (
                            category.image ? 
                            <img src={`http://localhost:8000/storage/${category.image}`} alt={category.name} className="h-10 w-10 object-cover rounded-md border" /> 
                            : <div className="h-10 w-10 bg-gray-100 rounded-md border flex items-center justify-center text-gray-400 text-xs">None</div>
                        )
                    },
                    { header: 'Name', key: 'name', cellClassName: 'font-medium text-black' },
                    { header: 'Slug', key: 'slug', cellClassName: 'text-gray-500' },
                    { 
                        header: 'Parent', 
                        key: 'parent', 
                        render: (category) => (
                            <span className="text-gray-600">
                                {category.parent ? category.parent.name : <span className="text-gray-400 italic">None</span>}
                            </span>
                        )
                    },
                    {
                        header: 'Status',
                        key: 'is_active',
                        render: (category) => (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                        )
                    },
                    {
                        header: 'Actions',
                        key: 'actions',
                        className: 'text-right',
                        cellClassName: 'text-right space-x-3',
                        render: (category) => (
                            <>
                                {hasPermission('edit categories') && (
                                    <button onClick={() => openForm(category)} className="text-brand-primary hover:text-brand-hover" title="Edit Category"><Edit2 className="w-4 h-4 inline" /></button>
                                )}
                                {hasPermission('delete categories') && (
                                    <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900" title="Delete Category"><Trash2 className="w-4 h-4 inline" /></button>
                                )}
                            </>
                        )
                    }
                ]}
                data={categories}
                keyExtractor={(category) => category.id}
                emptyMessage="No categories found."
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
            />
        </div>
    );
}
