import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, deleteProduct } from '../store/slices/productsSlice';
import { Edit2, Trash2, Plus, Search, Image as ImageIcon } from 'lucide-react';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';

export default function Products() {
    const dispatch = useDispatch();
    const { products, pagination, loading: productsLoading } = useSelector(state => state.products);
    const { user: authUser } = useSelector(state => state.auth);
    const loading = productsLoading;
    
    const hasPermission = (permission) => authUser?.permissions?.includes(permission);

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchProducts({ page, search: searchQuery }));
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

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will delete the product, its variants, and all images permanently!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2bb69a',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await dispatch(deleteProduct(id)).unwrap();
                dispatch(fetchProducts({ page, search: searchQuery }));

                Swal.fire({
                    title: 'Deleted!',
                    text: 'The product has been deleted.',
                    icon: 'success',
                    confirmButtonColor: '#2bb69a',
                    timer: 1500
                });
            } catch (error) {
                console.error("Error deleting product:", error);
                Swal.fire({
                    title: 'Error!',
                    text: 'There was a problem deleting the product.',
                    icon: 'error',
                    confirmButtonColor: '#2bb69a'
                });
            }
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
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                    />
                </div>
                {hasPermission('create products') && (
                    <Link 
                        to="/admin/products/create"
                        className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm"
                        title="Add Product"
                    >
                        <Plus className="w-5 h-5" />
                    </Link>
                )}
            </div>

            <DataTable 
                columns={[
                    { 
                        header: 'Image', 
                        key: 'image',
                        render: (product) => {
                            const mainImage = product.images?.find(img => img.is_main) || product.images?.[0];
                            return mainImage ? (
                                <img src={mainImage.url} alt={product.name} className="w-12 h-12 rounded object-cover border border-gray-200" />
                            ) : (
                                <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                            );
                        }
                    },
                    { header: 'Product Name', key: 'name', cellClassName: 'font-medium text-black' },
                    { 
                        header: 'Category', 
                        key: 'category', 
                        render: (product) => <span className="text-gray-600">{product.category?.name || 'Uncategorized'}</span>
                    },
                    { 
                        header: 'Base Price', 
                        key: 'price', 
                        render: (product) => {
                            // Display the price of the first variant as the base price
                            const basePrice = product.variants?.[0]?.price || 0;
                            return <span className="font-medium">${Number(basePrice).toFixed(2)}</span>;
                        }
                    },
                    {
                        header: 'Variants',
                        key: 'variant_count',
                        render: (product) => (
                            <span className="text-gray-500 text-sm">{product.variants?.length || 0} variants</span>
                        )
                    },
                    {
                        header: 'Status',
                        key: 'is_active',
                        render: (product) => (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {product.is_active ? 'Active' : 'Draft'}
                            </span>
                        )
                    },
                    {
                        header: 'Actions',
                        key: 'actions',
                        className: 'text-right',
                        cellClassName: 'text-right space-x-3',
                        render: (product) => (
                            <>
                                {hasPermission('edit products') && (
                                    <Link to={`/admin/products/edit/${product.id}`} className="text-brand-primary hover:text-brand-hover inline-block" title="Edit Product"><Edit2 className="w-4 h-4 inline" /></Link>
                                )}
                                {hasPermission('delete products') && (
                                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900" title="Delete Product"><Trash2 className="w-4 h-4 inline" /></button>
                                )}
                            </>
                        )
                    }
                ]}
                data={products}
                keyExtractor={(product) => product.id}
                emptyMessage="No products found."
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
            />
        </div>
    );
}
