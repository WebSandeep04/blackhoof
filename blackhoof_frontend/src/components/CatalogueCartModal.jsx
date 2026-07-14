import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCartAsync, clearCartAsync } from '../store/slices/catalogueCartSlice';
import { fetchCustomers } from '../store/slices/customersSlice';
import { X, FileText, Trash2, Download } from 'lucide-react';
import api from '../api/axios';

export default function CatalogueCartModal({ isOpen, onClose }) {
    const dispatch = useDispatch();
    const cartItems = useSelector(state => state.catalogueCart.cartItems);
    const { cartName, editingCatalogueId, cartCustomerId } = useSelector(state => state.catalogueCart);
    const { allCustomers } = useSelector(state => state.customers);
    const [catalogueName, setCatalogueName] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [saveAsNew, setSaveAsNew] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            dispatch(fetchCustomers({ all: true }));
        }
        if (isOpen && cartName) {
            setCatalogueName(cartName);
            if (cartCustomerId) setCustomerId(cartCustomerId);
            setSaveAsNew(false);
        } else if (isOpen && !cartName) {
            setCatalogueName('');
            setCustomerId('');
            setSaveAsNew(false);
        }
    }, [isOpen, cartName, cartCustomerId, dispatch]);

    if (!isOpen) return null;

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!catalogueName.trim() || cartItems.length === 0) return;
        if ((!editingCatalogueId || saveAsNew) && !customerId) return;

        setIsGenerating(true);
        try {
            let catalogueId;

            if (editingCatalogueId && !saveAsNew) {
                // Save draft as new version
                const response = await api.post(`/catalogues/${editingCatalogueId}/save-draft-as-version`);
                catalogueId = response.data.catalogue_id;
            } else {
                // Generate completely new catalogue
                const response = await api.post('/catalogues/generate', { 
                    name: catalogueName,
                    customer_id: customerId
                });
                catalogueId = response.data.catalogue_id;
            }

            // 2. Trigger download in real-time
            // We open it in a new tab so the browser handles the streaming PDF download
            window.open(`http://localhost:8000/api/catalogues/${catalogueId}/download`, '_blank');
            
            setIsGenerating(false);
            dispatch(clearCartAsync());
            onClose();
        } catch (error) {
            console.error("Failed to generate PDF", error);
            alert("Failed to generate PDF");
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-primary" />
                        {editingCatalogueId ? 'Edit Catalogue' : 'Catalogue Generator'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No products selected for the catalogue yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Selected Products ({cartItems.length})</h3>
                                <button onClick={() => dispatch(clearCartAsync())} className="text-xs text-red-500 hover:underline">Clear All</button>
                            </div>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-brand">
                                {cartItems.map((item) => {
                                    const allImages = [...(item.images || []), ...(item.variants?.flatMap(v => v.images || []) || [])];
                                    const mainImage = allImages.find(img => img.is_main) || allImages[0];
                                    const imageUrl = mainImage ? (mainImage.url || (mainImage.image_path ? (mainImage.image_path.startsWith('http') ? mainImage.image_path : `http://localhost:8000/storage/${mainImage.image_path}`) : null)) : null;
                                    
                                    return (
                                        <div key={`${item.id}-${item.cart_variant_id || 'all'}`} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-brand-primary/30 transition shadow-sm group">
                                            <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 relative">
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Img</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                                                {item.cart_variant_id ? (
                                                    <p className="text-xs text-brand-primary font-medium mt-1">
                                                        Variant: {item.variants?.find(v => v.id === item.cart_variant_id)?.sku || 'Unknown'}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-gray-500 mt-1">{item.variants?.length || 0} Options (Base Product)</p>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => dispatch(removeFromCartAsync({ productId: item.id, variantId: item.cart_variant_id }))}
                                                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition self-center"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            <form onSubmit={handleGenerate} className="mt-8 pt-6 border-t border-gray-100">
                                {editingCatalogueId && (
                                    <div className="mb-4 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="saveAsNew"
                                            checked={saveAsNew}
                                            onChange={(e) => {
                                                setSaveAsNew(e.target.checked);
                                                if (e.target.checked) setCatalogueName('');
                                                else setCatalogueName(cartName || '');
                                            }}
                                            className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                        />
                                        <label htmlFor="saveAsNew" className="text-sm font-medium text-gray-700">
                                            Save as new catalogue
                                        </label>
                                    </div>
                                )}

                                {(!editingCatalogueId || saveAsNew) && (
                                    <div className="mb-4">
                                        <label htmlFor="catalogueName" className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Customer <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="catalogueName"
                                            required
                                            value={customerId}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                setCustomerId(selectedId);
                                                const customer = allCustomers?.find(c => c.id == selectedId);
                                                if (customer) setCatalogueName(customer.name);
                                                else setCatalogueName('');
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition bg-white"
                                        >
                                            <option value="">Select a customer</option>
                                            {allCustomers?.map(customer => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-2">The selected customer's name will appear on the cover of the generated PDF.</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isGenerating || cartItems.length === 0 || !catalogueName.trim()}
                                    className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl shadow-sm hover:bg-brand-hover focus:ring-4 focus:ring-brand-light transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            {(editingCatalogueId && !saveAsNew) ? 'Saving...' : 'Generating PDF...'}
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            {(editingCatalogueId && !saveAsNew) ? 'Save & Download PDF' : 'Generate & Download PDF'}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
