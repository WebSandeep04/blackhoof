import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCatalogue } from '../store/slices/catalogueSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchAttributes } from '../store/slices/attributesSlice';
import { addToCartAsync, removeFromCartAsync, fetchCartAsync } from '../store/slices/catalogueCartSlice';
import { Filter, Store, ChevronLeft, ChevronRight, ChevronDown, ShoppingCart, Plus, Check, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import CatalogueCartModal from '../components/CatalogueCartModal';

export default function CataloguePreview() {
    const dispatch = useDispatch();
    const { items: products, loading } = useSelector(state => state.catalogue);
    const { flatCategories } = useSelector(state => state.categories);
    const { flatAttributes } = useSelector(state => state.attributes);
    const cartItems = useSelector(state => state.catalogueCart.cartItems);
    
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [loadingProductId, setLoadingProductId] = useState(null);
    const [selectedVariants, setSelectedVariants] = useState({});
    
    // For expanding/collapsing parent categories in UI
    const [expandedCategories, setExpandedCategories] = useState({});

    useEffect(() => {
        dispatch(fetchCategories({ all: true }));
        dispatch(fetchAttributes({ all: true }));
        dispatch(fetchCartAsync());
    }, [dispatch]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchCatalogue({ 
                category_id: selectedCategory, 
                attributes: selectedAttributes,
                search: searchQuery
            }));
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [selectedCategory, selectedAttributes, searchQuery, dispatch]);

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
    };

    const toggleCategoryExpand = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const handleAttributeChange = (valueId) => {
        setSelectedAttributes(prev => {
            if (prev.includes(valueId)) {
                return prev.filter(id => id !== valueId);
            } else {
                return [...prev, valueId];
            }
        });
    };

    const handleVariantChange = (productId, variantId) => {
        setSelectedVariants(prev => ({ ...prev, [productId]: variantId ? parseInt(variantId) : null }));
    };

    const handleAddToCart = async (product) => {
        setLoadingProductId(product.id);
        const variantId = selectedVariants[product.id] || null;
        try {
            await dispatch(addToCartAsync({ product, variantId })).unwrap();
        } finally {
            setLoadingProductId(null);
        }
    };

    const handleRemoveFromCart = async (productId, variantId = null) => {
        setLoadingProductId(productId);
        try {
            await dispatch(removeFromCartAsync({ productId, variantId })).unwrap();
        } finally {
            setLoadingProductId(null);
        }
    };

    // Category Hierarchy Helpers
    const parentCategories = flatCategories.filter(c => !c.parent_id);
    const getChildren = (parentId) => flatCategories.filter(c => c.parent_id === parentId);

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6 bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Link to="/admin/catalogue" className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Store className="w-6 h-6 text-brand-primary" />
                            Storefront Preview
                        </h1>
                        <p className="text-sm text-gray-500">Preview how your catalogue appears to customers.</p>
                    </div>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-72 bg-gray-50 hover:bg-white focus:bg-white transition-colors"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Filters */}
                <aside className="w-64 bg-white border-r border-gray-200 p-6 overflow-y-auto hidden md:block shrink-0 shadow-sm z-0 scrollbar-brand">
                    <div className="flex justify-between items-center mb-6 text-gray-900 font-semibold border-b pb-2">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filters
                        </div>
                        {(selectedCategory || selectedAttributes.length > 0) && (
                            <button
                                onClick={() => { setSelectedCategory(''); setSelectedAttributes([]); }}
                                className="text-xs text-brand-primary hover:text-brand-hover font-medium hover:underline transition"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Hierarchical Category Filter */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Categories</h3>
                        <div className="space-y-1">
                            {parentCategories.map((parent) => {
                                const children = getChildren(parent.id);
                                const hasChildren = children.length > 0;
                                const isExpanded = expandedCategories[parent.id];

                                return (
                                    <div key={parent.id} className="flex flex-col">
                                        <div className="flex items-center group py-1">
                                            {hasChildren ? (
                                                <button 
                                                    onClick={() => toggleCategoryExpand(parent.id)}
                                                    className="p-0.5 mr-1 text-gray-400 hover:text-brand-primary"
                                                >
                                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>
                                            ) : (
                                                <div className="w-5 mr-1" /> // Spacer for alignment
                                            )}
                                            <label className="flex items-center cursor-pointer flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategory === parent.id}
                                                    onChange={() => handleCategoryChange(parent.id)}
                                                    className="w-4 h-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary cursor-pointer"
                                                />
                                                <span className="ml-2 text-sm text-gray-700 font-medium group-hover:text-brand-primary transition-colors line-clamp-1">
                                                    {parent.name}
                                                </span>
                                            </label>
                                        </div>
                                        
                                        {/* Render Children if expanded */}
                                        {hasChildren && isExpanded && (
                                            <div className="ml-6 space-y-1 mt-1 border-l border-gray-200 pl-2">
                                                {children.map(child => (
                                                    <label key={child.id} className="flex items-center cursor-pointer group py-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCategory === child.id}
                                                            onChange={() => handleCategoryChange(child.id)}
                                                            className="w-3.5 h-3.5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary cursor-pointer"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-600 group-hover:text-brand-primary transition-colors line-clamp-1">
                                                            {child.name}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {flatCategories.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No categories available.</p>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Attributes Filter */}
                    {flatAttributes.map((attribute) => (
                        <div key={attribute.id} className="mb-8">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">{attribute.name}</h3>
                            <div className="space-y-3">
                                {attribute.values && attribute.values.length > 0 ? (
                                    attribute.values.map(val => (
                                        <label key={val.id} className="flex items-center cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedAttributes.includes(val.id)}
                                                onChange={() => handleAttributeChange(val.id)}
                                                className="w-4 h-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary cursor-pointer"
                                            />
                                            <span className="ml-3 text-sm text-gray-600 capitalize group-hover:text-brand-primary transition-colors">
                                                {val.value}
                                            </span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No values.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </aside>

                {/* Product Grid Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50 scrollbar-brand">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium animate-pulse">Loading catalogue...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
                                <Store className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-500 mb-6">There are no products matching your current filters.</p>
                                {(selectedCategory || selectedAttributes.length > 0) && (
                                    <button 
                                        onClick={() => { setSelectedCategory(''); setSelectedAttributes([]); }}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => {
                                const allImages = [...(product.images || []), ...(product.variants?.flatMap(v => v.images || []) || [])];
                                const mainImage = allImages.find(img => img.is_main) || allImages[0];
                                const defaultPrice = product.variants?.[0]?.price || 'N/A';
                                const imageUrl = mainImage ? (mainImage.url || (mainImage.image_path ? (mainImage.image_path.startsWith('http') ? mainImage.image_path : `http://localhost:8000/storage/${mainImage.image_path}`) : null)) : null;

                                return (
                                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
                                        <div className="relative aspect-square overflow-hidden bg-gray-100 shrink-0">
                                            {imageUrl ? (
                                                <img 
                                                    src={imageUrl} 
                                                    alt={product.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    No Image
                                                </div>
                                            )}
                                            {product.category && (
                                                <div className="absolute top-3 left-3">
                                                    <span className="px-2.5 py-1 bg-white/95 backdrop-blur text-[10px] font-bold text-brand-primary uppercase tracking-wider rounded shadow-sm">
                                                        {product.category.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-brand-primary transition-colors line-clamp-1">
                                                {product.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-3 capitalize">
                                                {product.product_for}
                                            </p>
                                            
                                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                                                <p className="text-brand-primary font-black text-lg">
                                                    ${defaultPrice}
                                                </p>
                                                {product.variants?.length > 1 && (
                                                    <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                        {product.variants.length} Options
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Variant Selector */}
                                            {product.variants?.length > 0 && (
                                                <div className="mt-3 mb-2">
                                                    <select 
                                                        className="w-full p-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-brand-primary bg-white truncate"
                                                        value={selectedVariants[product.id] || ''}
                                                        onChange={(e) => handleVariantChange(product.id, e.target.value)}
                                                    >
                                                        <option value="">All Variants</option>
                                                        {product.variants.map(v => (
                                                            <option key={v.id} value={v.id}>{v.sku} - ${v.price}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            
                                            {/* Add to Cart Button */}
                                            <div className="mt-auto">
                                                {cartItems.some(item => item.id === product.id && item.cart_variant_id == (selectedVariants[product.id] || null)) ? (
                                                    <button 
                                                        onClick={() => handleRemoveFromCart(product.id, selectedVariants[product.id] || null)}
                                                        disabled={loadingProductId === product.id}
                                                        className="w-full py-2 px-2 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition disabled:opacity-75 disabled:cursor-wait"
                                                    >
                                                        {loadingProductId === product.id ? (
                                                            <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
                                                        ) : (
                                                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                                                        )}
                                                        <span className="truncate">{loadingProductId === product.id ? 'Removing...' : 'Added'}</span>
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleAddToCart(product)}
                                                        disabled={loadingProductId === product.id}
                                                        className="w-full py-2 px-2 flex items-center justify-center gap-1.5 bg-brand-light text-brand-primary text-sm font-medium rounded-lg hover:bg-brand-primary hover:text-white transition disabled:opacity-75 disabled:cursor-wait group-[.hover]:hover:bg-brand-primary"
                                                    >
                                                        {loadingProductId === product.id ? (
                                                            <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
                                                        ) : (
                                                            <Plus className="w-4 h-4 shrink-0" />
                                                        )}
                                                        <span className="truncate">{loadingProductId === product.id ? 'Adding...' : 'Add to List'}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
            
            {/* Floating Cart Button */}
            {cartItems.length > 0 && (
                <button
                    onClick={() => setIsCartModalOpen(true)}
                    className="fixed bottom-8 right-8 z-40 p-4 bg-brand-primary text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-brand-hover transition-all duration-300 flex items-center justify-center group"
                >
                    <div className="relative">
                        <ShoppingCart className="w-6 h-6" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                            {cartItems.length}
                        </span>
                    </div>
                    <span className="ml-0 max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-3 whitespace-nowrap transition-all duration-300 font-bold">
                        View Catalogue Cart
                    </span>
                </button>
            )}

            {/* Cart Modal */}
            <CatalogueCartModal 
                isOpen={isCartModalOpen} 
                onClose={() => setIsCartModalOpen(false)} 
            />
        </div>
    );
}
