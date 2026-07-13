import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSavedCatalogues, deleteSavedCatalogue, fetchCatalogueVersions } from '../store/slices/savedCataloguesSlice';
import { fetchCountries } from '../store/slices/countriesSlice';
import { clearCartAsync } from '../store/slices/catalogueCartSlice';
import api from '../api/axios';
import { FileText, Download, Trash2, Eye, X, Package, Search, LayoutGrid, Plus, Edit2, History, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';

export default function AdminCatalogue() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { catalogues, pagination, loading: cataloguesLoading } = useSelector((state) => state.savedCatalogues);
    const { user: authUser } = useSelector(state => state.auth);
    const { allCountries } = useSelector(state => state.countries);
    const loading = cataloguesLoading;
    
    const hasPermission = (permission) => authUser?.permissions?.includes(permission);

    
    const [selectedCatalogue, setSelectedCatalogue] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // New states
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [versions, setVersions] = useState([]);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editProducts, setEditProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        dispatch(fetchCountries({ all: true }));
    }, [dispatch]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchSavedCatalogues({ page, search: searchQuery, country_id: selectedCountry }));
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, selectedCountry, page, dispatch]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleDownload = (id) => {
        window.open(`http://localhost:8000/api/saved-catalogues/${id}/download`, '_blank');
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
                await dispatch(deleteSavedCatalogue(id)).unwrap();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The catalogue has been deleted.',
                    icon: 'success',
                    confirmButtonColor: '#2bb69a',
                    timer: 1500
                });
            } catch (error) {
                console.error("Error deleting catalogue:", error);
                Swal.fire({
                    title: 'Error!',
                    text: 'There was a problem deleting the catalogue.',
                    icon: 'error',
                    confirmButtonColor: '#2bb69a'
                });
            }
        }
    };

    
    const handleDownloadVersion = (catalogueId, versionId) => {
        window.open(`http://localhost:8000/api/saved-catalogues/${catalogueId}/download?version_id=${versionId}`, '_blank');
    };

    const openHistoryModal = async (catalogue) => {
        setSelectedCatalogue(catalogue);
        try {
            const data = await dispatch(fetchCatalogueVersions(catalogue.id)).unwrap();
            setVersions(data);
            setIsHistoryModalOpen(true);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = async (catalogue) => {
        try {
            await api.post(`/saved-catalogues/${catalogue.id}/load-to-draft`);
            navigate('/admin/catalogue/preview');
        } catch (error) {
            Swal.fire('Error', 'Failed to load catalogue for editing', 'error');
        }
    };

    const handleCreateNew = async () => {
        try {
            await dispatch(clearCartAsync()).unwrap();
            navigate('/admin/catalogue/preview');
        } catch (error) {
            console.error('Failed to clear cart:', error);
            navigate('/admin/catalogue/preview');
        }
    };

    useEffect(() => {
        if (productSearch.length > 2) {
            setIsSearching(true);
            const delay = setTimeout(async () => {
                try {
                    const res = await api.get(`/products?search=${productSearch}`);
                    setSearchResults(res.data.data || res.data);
                } catch (err) {}
                setIsSearching(false);
            }, 500);
            return () => clearTimeout(delay);
        } else {
            setSearchResults([]);
        }
    }, [productSearch]);

    const openProductsModal = (catalogue) => {
        setSelectedCatalogue(catalogue);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center gap-4">
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={selectedCountry}
                            onChange={(e) => {
                                setSelectedCountry(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-48 bg-white shadow-sm appearance-none"
                        >
                            <option value="">All Countries</option>
                            {allCountries?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Search catalogues..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                        />
                    </div>
                </div>
                {hasPermission('create saved catalogues') && (
                    <button 
                        onClick={handleCreateNew}
                        className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm"
                        title="Add Catalogue"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            <DataTable 
                columns={[
                    { 
                        header: 'Customer Name', 
                        key: 'name',
                        render: (catalogue) => (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-brand-light text-brand-primary flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-800">
                                    {catalogue.customer?.name || catalogue.name || 'Untitled Catalogue'}
                                </span>
                            </div>
                        )
                    },
                    { 
                        header: 'Products', 
                        key: 'products_count',
                        render: (catalogue) => (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium text-xs">
                                {catalogue.products_count} Items
                            </span>
                        )
                    },
                    {
                        header: 'Country',
                        key: 'country',
                        render: (catalogue) => catalogue.customer?.country?.name || 'N/A'
                    },
                    { 
                        header: 'Created Date', 
                        key: 'created_at',
                        render: (catalogue) => new Date(catalogue.created_at).toLocaleDateString()
                    },
                    {
                        header: 'Actions',
                        key: 'actions',
                        className: 'text-right',
                        cellClassName: 'text-right space-x-2',
                        render: (catalogue) => (
                            <>
                                <button 
                                    onClick={() => openProductsModal(catalogue)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-brand-primary bg-brand-light hover:bg-brand-primary hover:text-white rounded-lg transition font-medium text-xs"
                                    title="View Products"
                                >
                                    <Eye className="w-4 h-4" /> View
                                </button>

                                <button 
                                    onClick={() => handleEdit(catalogue)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition font-medium text-xs"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" /> Edit
                                </button>
                                <button 
                                    onClick={() => openHistoryModal(catalogue)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-orange-600 bg-orange-50 hover:bg-orange-600 hover:text-white rounded-lg transition font-medium text-xs"
                                    title="History"
                                >
                                    <History className="w-4 h-4" /> History
                                </button>

                                <button 
                                    onClick={() => handleDownload(catalogue.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-xs"
                                    title="Download PDF"
                                >
                                    <Download className="w-4 h-4" /> PDF
                                </button>
                                <button 
                                    onClick={() => handleDelete(catalogue.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition font-medium text-xs"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )
                    }
                ]} 
                data={catalogues} 
                keyExtractor={(catalogue) => catalogue.id} 
                emptyMessage="No saved catalogues yet."
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
            />

            {/* Products Modal */}
            {isModalOpen && selectedCatalogue && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-primary rounded-lg text-white">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{selectedCatalogue.name}</h2>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{selectedCatalogue.products?.length || 0} Products Included</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto scrollbar-brand">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedCatalogue.products?.map(product => {
                                    const allImages = [...(product.images || []), ...(product.variants?.flatMap(v => v.images || []) || [])];
                                    const mainImage = allImages.find(img => img.is_main) || allImages[0];
                                    const imageUrl = mainImage ? (mainImage.url || (mainImage.image_path ? (mainImage.image_path.startsWith('http') ? mainImage.image_path : `http://localhost:8000/storage/${mainImage.image_path}`) : null)) : null;
                                    
                                    return (
                                        <div key={product.id} className="flex gap-4 p-3 rounded-xl border border-gray-100 bg-white hover:border-brand-primary/30 transition shadow-sm">
                                            <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-6 h-6 text-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">{product.name}</h4>
                                                <p className="text-xs text-brand-primary font-medium mt-1 mb-2">{product.category?.name || 'Uncategorized'}</p>
                                                <p className="text-xs text-gray-500 bg-gray-50 self-start px-2 py-0.5 rounded border border-gray-100">
                                                    Base: ${parseFloat(product.base_price).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => handleDownload(selectedCatalogue.id)}
                                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover rounded-lg flex items-center gap-2 transition shadow-sm"
                            >
                                <Download className="w-4 h-4" /> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {isHistoryModalOpen && selectedCatalogue && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Version History: {selectedCatalogue.name}</h2>
                            <button onClick={() => setIsHistoryModalOpen(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {versions.length === 0 ? <p>No history available.</p> : (
                                <ul className="space-y-3">
                                    {versions.map(v => (
                                        <li key={v.id} className="flex justify-between items-center p-3 border rounded">
                                            <div>
                                                <span className="font-semibold">Version {v.version_number}</span>
                                                <p className="text-xs text-gray-500">{new Date(v.created_at).toLocaleString()}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDownloadVersion(selectedCatalogue.id, v.id)}
                                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium flex items-center gap-1"
                                            >
                                                <Download className="w-4 h-4" /> PDF
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && selectedCatalogue && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Edit Catalogue: {selectedCatalogue.name}</h2>
                            <button onClick={() => setIsEditModalOpen(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex flex-1 overflow-hidden">
                            <div className="w-1/2 p-6 border-r overflow-y-auto">
                                <h3 className="font-semibold mb-4">Current Products ({editProducts.length})</h3>
                                <div className="space-y-2">
                                    {editProducts.map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-2 border rounded">
                                            <span className="text-sm truncate">{p.name}</span>
                                            <button onClick={() => handleRemoveProduct(p.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="w-1/2 p-6 overflow-y-auto">
                                <h3 className="font-semibold mb-4">Add Products</h3>
                                <input 
                                    type="text" 
                                    placeholder="Search products..." 
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                    className="w-full p-2 border rounded mb-4"
                                />
                                {isSearching ? <p className="text-sm text-gray-500">Searching...</p> : (
                                    <div className="space-y-2">
                                        {searchResults.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-2 border rounded">
                                                <span className="text-sm truncate">{p.name}</span>
                                                <button onClick={() => handleAddProduct(p)} className="text-brand-primary hover:bg-brand-light p-1 rounded"><Plus className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={saveEdit} className="px-4 py-2 text-white bg-brand-primary hover:bg-brand-hover rounded-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
