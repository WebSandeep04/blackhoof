import re

file_path = r'd:\DontDelete\laravel\blackhoof\blackhoof_frontend\src\pages\AdminCatalogue.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { fetchSavedCatalogues, deleteSavedCatalogue } from '../store/slices/savedCataloguesSlice';",
    "import { fetchSavedCatalogues, deleteSavedCatalogue, fetchCatalogueVersions, updateSavedCatalogue } from '../store/slices/savedCataloguesSlice';\nimport api from '../api/axios';"
)

content = content.replace(
    "import { FileText, Download, Trash2, Eye, X, Package, Search, LayoutGrid, Plus, Edit2 } from 'lucide-react';",
    "import { FileText, Download, Trash2, Eye, X, Package, Search, LayoutGrid, Plus, Edit2, History } from 'lucide-react';"
)

# 2. Add state variables inside AdminCatalogue
state_vars = '''
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
'''
content = content.replace(
    "const [selectedCatalogue, setSelectedCatalogue] = useState(null);\n    const [isModalOpen, setIsModalOpen] = useState(false);",
    state_vars
)

# 3. Add handler functions
handlers = '''
    const handleDownloadVersion = (catalogueId, versionId) => {
        window.open(http://localhost:8000/api/saved-catalogues//download?version_id=, '_blank');
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

    const openEditModal = (catalogue) => {
        setSelectedCatalogue(catalogue);
        setEditProducts(catalogue.products || []);
        setIsEditModalOpen(true);
    };

    const handleRemoveProduct = (productId) => {
        setEditProducts(prev => prev.filter(p => p.id !== productId));
    };

    const handleAddProduct = (product) => {
        if (!editProducts.find(p => p.id === product.id)) {
            setEditProducts(prev => [...prev, product]);
        }
    };

    const saveEdit = async () => {
        try {
            await dispatch(updateSavedCatalogue({
                id: selectedCatalogue.id,
                product_ids: editProducts.map(p => p.id)
            })).unwrap();
            
            Swal.fire('Success', 'Catalogue updated successfully', 'success');
            setIsEditModalOpen(false);
            dispatch(fetchSavedCatalogues({ page, search: searchQuery }));
        } catch (error) {
            Swal.fire('Error', 'Failed to update catalogue', 'error');
        }
    };

    useEffect(() => {
        if (productSearch.length > 2) {
            setIsSearching(true);
            const delay = setTimeout(async () => {
                try {
                    const res = await api.get(/products?search=);
                    setSearchResults(res.data.data || res.data);
                } catch (err) {}
                setIsSearching(false);
            }, 500);
            return () => clearTimeout(delay);
        } else {
            setSearchResults([]);
        }
    }, [productSearch]);
'''

content = content.replace(
    "const openProductsModal = (catalogue) => {",
    handlers + "\n    const openProductsModal = (catalogue) => {"
)

# 4. Add buttons to actions
actions_replacement = '''
                                <button 
                                    onClick={() => openEditModal(catalogue)}
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
'''
content = content.replace(
    "<Eye className=\"w-4 h-4\" /> View\n                                </button>",
    "<Eye className=\"w-4 h-4\" /> View\n                                </button>\n" + actions_replacement
)

# 5. Add modals
modals = '''
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
'''
content = content.replace(
    "</div>\n                </div>\n            )}\n        </div>",
    "</div>\n                </div>\n            )}\n" + modals + "\n        </div>"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated AdminCatalogue.jsx successfully.")
