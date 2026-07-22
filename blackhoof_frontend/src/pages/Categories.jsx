import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, createCategory, updateCategory, deleteCategory, syncCategoryAttributes } from '../store/slices/categoriesSlice';
import { fetchAttributes } from '../store/slices/attributesSlice';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';

export default function Categories() {
    const dispatch = useDispatch();
    const { categories, flatCategories, pagination, loading: categoriesLoading } = useSelector(state => state.categories);
    const { flatAttributes } = useSelector(state => state.attributes);
    const { user: authUser } = useSelector(state => state.auth);
    const loading = categoriesLoading;

    const hasPermission = (permission) => authUser?.permissions?.includes(permission);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [currentCategory, setCurrentCategory] = useState({ id: null, name: '', slug: '', parent_id: '', is_active: true, category_for: 'blackhoof', image: null, imageUrl: null, selectedAttributes: [], selectedAttributeValues: [] });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Fetch all categories for the parent dropdown
        dispatch(fetchCategories({ all: true }));
        // Fetch all attributes for the mapping
        dispatch(fetchAttributes({ all: true }));
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
            formData.append('category_for', currentCategory.category_for);

            if (currentCategory.image) {
                formData.append('image', currentCategory.image);
            }

            if (currentCategory.id) {
                await dispatch(updateCategory({ id: currentCategory.id, categoryData: formData })).unwrap();
                await dispatch(syncCategoryAttributes({
                    id: currentCategory.id,
                    attributes: currentCategory.selectedAttributes,
                    attribute_values: currentCategory.selectedAttributeValues
                })).unwrap();
            } else {
                const newCat = await dispatch(createCategory(formData)).unwrap();
                if (currentCategory.selectedAttributes.length > 0 || currentCategory.selectedAttributeValues.length > 0) {
                    await dispatch(syncCategoryAttributes({
                        id: newCat.id,
                        attributes: currentCategory.selectedAttributes,
                        attribute_values: currentCategory.selectedAttributeValues
                    })).unwrap();
                }
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

    const openForm = (category = { id: null, name: '', slug: '', parent_id: '', is_active: true, category_for: 'blackhoof', image: null, imageUrl: null, attributes: [], attribute_values: [] }) => {
        setCurrentCategory({
            ...category,
            parent_id: category.parent_id || '',
            is_active: category.is_active === undefined ? true : category.is_active,
            category_for: category.category_for || 'blackhoof',
            image: null,
            imageUrl: category.image ? `http://localhost:8000/storage/${category.image}` : null,
            selectedAttributes: category.attributes ? category.attributes.map(a => a.id) : [],
            selectedAttributeValues: category.attribute_values ? category.attribute_values.map(v => v.id) : []
        });
        setIsFormOpen(true);
    };

    const toggleAttribute = (attributeId) => {
        setCurrentCategory(prev => {
            const selected = prev.selectedAttributes || [];
            if (selected.includes(attributeId)) {
                return { ...prev, selectedAttributes: selected.filter(id => id !== attributeId) };
            } else {
                return { ...prev, selectedAttributes: [...selected, attributeId] };
            }
        });
    };

    const toggleAttributeValue = (valueId) => {
        setCurrentCategory(prev => {
            const selected = prev.selectedAttributeValues || [];
            if (selected.includes(valueId)) {
                return { ...prev, selectedAttributeValues: selected.filter(id => id !== valueId) };
            } else {
                return { ...prev, selectedAttributeValues: [...selected, valueId] };
            }
        });
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

    const [attributeSearchQuery, setAttributeSearchQuery] = useState('');

    const filteredAttributes = flatAttributes.filter(attr => attr.name.toLowerCase().includes(attributeSearchQuery.toLowerCase()));

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
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">{currentCategory.id ? 'Edit' : 'Create'} Category</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Basic Info */}
                                <div className="space-y-4">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category For</label>
                                        <select
                                            value={currentCategory.category_for}
                                            onChange={(e) => setCurrentCategory({ ...currentCategory, category_for: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                                        >
                                            <option value="blackhoof">Blackhoof</option>
                                            <option value="satkirti">Satkirti</option>
                                        </select>
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
                                                .filter(cat => cat.id !== currentCategory.id && cat.category_for === currentCategory.category_for)
                                                .map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center pt-2">
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
                                </div>

                                {/* Right Column: Attributes Mapping */}
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2 border-b border-gray-100 pb-2">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-medium text-gray-700">Mapped Attributes</label>
                                            <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-medium">
                                                {(currentCategory.selectedAttributes || []).length} Selected
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">Select the attributes that apply to products in this category.</p>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search attributes..."
                                            value={attributeSearchQuery}
                                            onChange={(e) => setAttributeSearchQuery(e.target.value)}
                                            className="pl-9 w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm bg-white shadow-sm"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-2 px-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allIds = filteredAttributes.map(a => a.id);
                                                const allValueIds = filteredAttributes.flatMap(a => a.values ? a.values.map(v => v.id) : []);

                                                const current = new Set(currentCategory.selectedAttributes || []);
                                                const currentValues = new Set(currentCategory.selectedAttributeValues || []);

                                                allIds.forEach(id => current.add(id));
                                                allValueIds.forEach(id => currentValues.add(id));

                                                setCurrentCategory(prev => ({
                                                    ...prev,
                                                    selectedAttributes: Array.from(current),
                                                    selectedAttributeValues: Array.from(currentValues)
                                                }));
                                            }}
                                            className="text-xs text-brand-primary hover:underline font-medium"
                                        >
                                            Select All
                                        </button>
                                        <span className="text-gray-300 text-xs">|</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const filteredIds = new Set(filteredAttributes.map(a => a.id));
                                                const filteredValueIds = new Set(filteredAttributes.flatMap(a => a.values ? a.values.map(v => v.id) : []));

                                                setCurrentCategory(prev => ({
                                                    ...prev,
                                                    selectedAttributes: (prev.selectedAttributes || []).filter(id => !filteredIds.has(id)),
                                                    selectedAttributeValues: (prev.selectedAttributeValues || []).filter(id => !filteredValueIds.has(id))
                                                }));
                                            }}
                                            className="text-xs text-gray-500 hover:text-red-500 hover:underline font-medium"
                                        >
                                            Clear
                                        </button>
                                    </div>

                                    <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 grid grid-cols-1 gap-2 content-start">
                                        {filteredAttributes.map(attr => (
                                            <div key={attr.id} className={`flex flex-col p-2 rounded border transition ${(currentCategory.selectedAttributes || []).includes(attr.id)
                                                ? 'bg-brand-primary/5 border-brand-primary'
                                                : 'bg-white border-gray-200 hover:border-brand-primary/50'
                                                }`}>
                                                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
                                                    <input
                                                        type="checkbox"
                                                        checked={(currentCategory.selectedAttributes || []).includes(attr.id)}
                                                        onChange={() => toggleAttribute(attr.id)}
                                                        className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
                                                    />
                                                    <span className="text-sm truncate" title={attr.name}>{attr.name}</span>
                                                </label>

                                                {(currentCategory.selectedAttributes || []).includes(attr.id) && attr.values && attr.values.length > 0 && (
                                                    <div className="mt-2 ml-6 flex flex-col gap-1.5 border-l-2 border-brand-primary/20 pl-3">
                                                        {attr.values.map(val => (
                                                            <label key={val.id} className="flex items-center gap-2 cursor-pointer text-gray-600">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(currentCategory.selectedAttributeValues || []).includes(val.id)}
                                                                    onChange={() => toggleAttributeValue(val.id)}
                                                                    className="w-3.5 h-3.5 text-brand-primary rounded focus:ring-brand-primary"
                                                                />
                                                                <span className="text-xs">{val.value}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {filteredAttributes.length === 0 && (
                                            <div className="col-span-2 py-4 text-center text-sm text-gray-400 italic">No attributes found matching '{attributeSearchQuery}'.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
                        header: 'Category For',
                        key: 'category_for',
                        render: (category) => (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize border">
                                {category.category_for || 'blackhoof'}
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
