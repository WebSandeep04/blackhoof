import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCatalogue } from '../store/slices/catalogueSlice';
import { Search, Image as ImageIcon, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import DataTable from '../components/DataTable';

export default function AdminCatalogue() {
    const dispatch = useDispatch();
    const { items: products, pagination, loading } = useSelector(state => state.catalogue);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchCatalogue({ page, search: searchQuery }));
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

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search catalogue..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                    />
                </div>
                <Link 
                    to="/admin/products/create"
                    className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm"
                    title="Add to Catalogue"
                >
                    <Plus className="w-5 h-5" />
                </Link>
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
                            const basePrice = product.variants?.[0]?.price || 0;
                            return <span className="font-medium">${Number(basePrice).toFixed(2)}</span>;
                        }
                    },
                    {
                        header: 'Brand',
                        key: 'product_for',
                        render: (product) => (
                            <span className="capitalize text-gray-600">{product.product_for}</span>
                        )
                    }
                ]}
                data={products}
                keyExtractor={(product) => product.id}
                emptyMessage="No products in the catalogue yet."
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
            />
        </div>
    );
}
