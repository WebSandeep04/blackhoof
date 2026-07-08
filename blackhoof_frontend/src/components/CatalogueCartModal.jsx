import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCartAsync, clearCartAsync } from '../store/slices/catalogueCartSlice';
import { X, FileText, Trash2, Download } from 'lucide-react';
import api from '../api/axios';

export default function CatalogueCartModal({ isOpen, onClose }) {
    const dispatch = useDispatch();
    const cartItems = useSelector(state => state.catalogueCart.cartItems);
    const [catalogueName, setCatalogueName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!catalogueName.trim() || cartItems.length === 0) return;

        setIsGenerating(true);
        try {
            // 1. Save catalogue and attach products in backend (checkout)
            const response = await api.post('/cart/checkout', { 
                name: catalogueName
            });
            
            const catalogueId = response.data.catalogue_id;

            // 2. Trigger download in real-time
            // We open it in a new tab so the browser handles the streaming PDF download
            window.open(`http://localhost:8000/api/saved-catalogues/${catalogueId}/download`, '_blank');
            
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
                        Catalogue Generator
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
                                    const mainImage = item.images?.find(img => img.is_main) || item.images?.[0];
                                    return (
                                        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                                {mainImage ? (
                                                    <img src={mainImage.url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Img</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                                                <p className="text-xs text-gray-500">{item.variants?.length || 0} Options</p>
                                            </div>
                                            <button 
                                                onClick={() => dispatch(removeFromCartAsync(item.id))}
                                                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            <form onSubmit={handleGenerate} className="mt-8 pt-6 border-t border-gray-100">
                                <div className="mb-4">
                                    <label htmlFor="catalogueName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Catalogue Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="catalogueName"
                                        required
                                        value={catalogueName}
                                        onChange={(e) => setCatalogueName(e.target.value)}
                                        placeholder="e.g. Summer Collection 2026"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">This name will appear on the cover of the generated PDF.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isGenerating || cartItems.length === 0 || !catalogueName.trim()}
                                    className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl shadow-sm hover:bg-brand-hover focus:ring-4 focus:ring-brand-light transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Generating PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Generate & Download PDF
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
