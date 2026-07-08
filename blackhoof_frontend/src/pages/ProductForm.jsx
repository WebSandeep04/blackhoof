import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchAttributes } from '../store/slices/attributesSlice';
import { createProduct, updateProduct, fetchProduct, clearCurrentProduct } from '../store/slices/productsSlice';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEditMode = !!id;

    const { flatCategories } = useSelector(state => state.categories);
    const { flatAttributes } = useSelector(state => state.attributes);
    const { currentProduct, loading: productLoading } = useSelector(state => state.products);

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [hasVariants, setHasVariants] = useState(false);
    
    // Images
    const [imageFiles, setImageFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]); // For edit mode

    // Simple Product Data
    const [simplePrice, setSimplePrice] = useState('');
    const [simpleSku, setSimpleSku] = useState('');
    const [simpleStock, setSimpleStock] = useState('');

    // Variable Product Data
    const [selectedAttributes, setSelectedAttributes] = useState([]); // Array of attribute IDs
    const [selectedAttributeValues, setSelectedAttributeValues] = useState([]); // Array of attribute value IDs
    const [variants, setVariants] = useState([]); // The generated matrix

    useEffect(() => {
        dispatch(fetchCategories({ all: true }));
        dispatch(fetchAttributes({ all: true }));
        
        if (isEditMode) {
            dispatch(fetchProduct(id));
        } else {
            dispatch(clearCurrentProduct());
        }

        return () => {
            dispatch(clearCurrentProduct());
        };
    }, [dispatch, id, isEditMode]);

    useEffect(() => {
        if (isEditMode && currentProduct) {
            setName(currentProduct.name);
            setSlug(currentProduct.slug);
            setCategoryId(currentProduct.category_id || '');
            setDescription(currentProduct.description || '');
            setIsActive(currentProduct.is_active);
            
            setExistingImages(currentProduct.images || []);

            // Check if it has multiple variants, or variants with attributes
            const hasMultipleVariants = currentProduct.variants?.length > 1;
            const hasAttributeValues = currentProduct.variants?.[0]?.attribute_values?.length > 0;
            
            if (hasMultipleVariants || hasAttributeValues) {
                setHasVariants(true);
                setVariants(currentProduct.variants.map(v => ({
                    id: v.id,
                    sku: v.sku,
                    price: v.price,
                    stock_quantity: v.stock_quantity,
                    attributes: v.attribute_values.map(av => av.id),
                    _attributeNames: v.attribute_values.map(av => av.value).join(', ') // Display helper
                })));
                
                // Extract unique attribute IDs and Value IDs used
                const usedAttributeIds = new Set();
                const usedAttributeValueIds = new Set();
                currentProduct.variants.forEach(v => {
                    v.attribute_values.forEach(av => {
                        usedAttributeIds.add(av.attribute_id);
                        usedAttributeValueIds.add(av.id);
                    });
                });
                setSelectedAttributes(Array.from(usedAttributeIds));
                setSelectedAttributeValues(Array.from(usedAttributeValueIds));
            } else {
                setHasVariants(false);
                if (currentProduct.variants && currentProduct.variants.length > 0) {
                    const defaultVariant = currentProduct.variants[0];
                    setSimplePrice(defaultVariant.price);
                    setSimpleSku(defaultVariant.sku);
                    setSimpleStock(defaultVariant.stock_quantity);
                    // keep track of ID for updating
                    setVariants([{ id: defaultVariant.id }]);
                }
            }
        }
    }, [currentProduct, isEditMode]);

    const generateSlug = (value) => {
        return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    };

    const handleNameChange = (e) => {
        const newName = e.target.value;
        setName(newName);
        if (!isEditMode) {
            setSlug(generateSlug(newName));
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles(prev => [...prev, ...files]);
    };

    const removeNewImage = (index) => {
        const newFiles = [...imageFiles];
        newFiles.splice(index, 1);
        setImageFiles(newFiles);
    };

    const removeExistingImage = (idToRemove) => {
        setExistingImages(prev => prev.filter(img => img.id !== idToRemove));
    };

    const toggleAttribute = (attributeId) => {
        if (selectedAttributes.includes(attributeId)) {
            setSelectedAttributes(prev => prev.filter(id => id !== attributeId));
            // Optional: unselect its values when attribute is removed
            const attrToRemove = flatAttributes.find(a => a.id === attributeId);
            if (attrToRemove) {
                const valueIdsToRemove = attrToRemove.values.map(v => v.id);
                setSelectedAttributeValues(prev => prev.filter(id => !valueIdsToRemove.includes(id)));
            }
        } else {
            setSelectedAttributes(prev => [...prev, attributeId]);
        }
    };

    const toggleAttributeValue = (valueId) => {
        if (selectedAttributeValues.includes(valueId)) {
            setSelectedAttributeValues(prev => prev.filter(id => id !== valueId));
        } else {
            setSelectedAttributeValues(prev => [...prev, valueId]);
        }
    };

    const generateVariantMatrix = () => {
        if (selectedAttributes.length === 0) {
            Swal.fire('Warning', 'Select at least one attribute to generate variants.', 'warning');
            return;
        }

        // Get full attribute objects with only their selected values
        const activeAttributes = flatAttributes
            .filter(a => selectedAttributes.includes(a.id))
            .map(a => ({
                ...a,
                values: a.values.filter(v => selectedAttributeValues.includes(v.id))
            }))
            .filter(a => a.values.length > 0); // Only keep attributes that have at least one value selected
        
        if (activeAttributes.length === 0) {
            Swal.fire('Warning', 'You must select at least one value for your chosen attributes.', 'warning');
            return;
        }

        if (activeAttributes.length !== selectedAttributes.length) {
            Swal.fire('Warning', 'Some selected attributes have no values checked. They will be ignored.', 'warning');
        }

        // Create combinations (Cartesian product)
        const generateCombinations = (arrays) => {
            if (arrays.length === 0) return [[]];
            const [first, ...rest] = arrays;
            const remainingCombinations = generateCombinations(rest);
            const result = [];
            first.forEach(value => {
                remainingCombinations.forEach(combination => {
                    result.push([value, ...combination]);
                });
            });
            return result;
        };

        const arraysOfValues = activeAttributes.map(a => a.values);
        const combinations = generateCombinations(arraysOfValues);

        const newVariants = combinations.map((combination) => {
            const attrIds = combination.map(v => v.id);
            const attrNames = combination.map(v => v.value).join('-');
            
            // Try to preserve existing variant data if it matches attributes
            let existingVariant = null;
            if (isEditMode && currentProduct && currentProduct.variants) {
                 existingVariant = currentProduct.variants.find(v => {
                    const vAttrIds = v.attribute_values?.map(av => av.id).sort().join(',');
                    return vAttrIds === [...attrIds].sort().join(',');
                });
            }

            return {
                id: existingVariant ? existingVariant.id : null,
                sku: existingVariant ? existingVariant.sku : `${slug ? slug.toUpperCase() : 'PROD'}-${attrNames.toUpperCase()}`,
                price: existingVariant ? existingVariant.price : (simplePrice || 0),
                stock_quantity: existingVariant ? existingVariant.stock_quantity : (simpleStock || 0),
                attributes: attrIds,
                _attributeNames: attrNames.replace(/-/g, ', ') // For display
            };
        });

        setVariants(newVariants);
    };

    const updateVariantField = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let finalVariants = [];

        if (hasVariants) {
            if (variants.length === 0) {
                Swal.fire('Error', 'Please generate at least one variant combination.', 'error');
                return;
            }
            finalVariants = variants;
        } else {
            // Simple product -> one default variant
            finalVariants = [{
                id: variants[0]?.id || null, // preserve ID if editing
                sku: simpleSku || generateSlug(name).toUpperCase(),
                price: simplePrice || 0,
                stock_quantity: simpleStock || 0,
                attributes: []
            }];
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('slug', slug);
        formData.append('category_id', categoryId);
        formData.append('description', description);
        formData.append('is_active', isActive ? 1 : 0);
        formData.append('has_variants', hasVariants ? 1 : 0);
        formData.append('variants', JSON.stringify(finalVariants));

        // Append new images
        imageFiles.forEach((file, index) => {
            formData.append(`images[${index}]`, file);
        });

        // Append existing image IDs for edit mode
        if (isEditMode) {
            formData.append('existing_images', JSON.stringify(existingImages.map(img => img.id)));
        }

        setIsSubmitting(true);
        try {
            if (isEditMode) {
                await dispatch(updateProduct({ id, formData })).unwrap();
            } else {
                await dispatch(createProduct(formData)).unwrap();
            }
            
            Swal.fire({
                title: 'Success!',
                text: 'Product saved successfully.',
                icon: 'success',
                confirmButtonColor: '#2bb69a',
                timer: 1500
            }).then(() => {
                navigate('/admin/products');
            });
        } catch (error) {
            setIsSubmitting(false);
            console.error("Error saving product:", error);
            Swal.fire({
                title: 'Error!',
                text: error.message || 'There was a problem saving the product. Please check the inputs.',
                icon: 'error',
                confirmButtonColor: '#2bb69a'
            });
        }
    };

    if (productLoading) {
        return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div></div>;
    }

    return (
        <div className="max-w-5xl mx-auto pb-12 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/admin/products')} className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-brand-primary transition">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Basic Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                            <input type="text" required value={name} onChange={handleNameChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                            <input type="text" required value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-gray-50" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white">
                            <option value="">Select Category</option>
                            {flatCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none resize-none"></textarea>
                    </div>

                    <div className="flex items-center pt-2">
                        <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary" />
                        <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">Product is Active</label>
                    </div>
                </div>

                {/* Images Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Product Images</h2>
                    
                    <div className="flex flex-wrap gap-4 mb-4">
                        {/* Existing Images */}
                        {existingImages.map(img => (
                            <div key={img.id} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                                <img src={img.url} alt="Product" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <Trash2 className="w-6 h-6" />
                                </button>
                                {img.is_main && <span className="absolute bottom-0 inset-x-0 bg-brand-primary text-white text-[10px] text-center py-0.5">Main</span>}
                            </div>
                        ))}

                        {/* New Images */}
                        {imageFiles.map((file, index) => (
                            <div key={index} className="relative w-24 h-24 border border-brand-primary/50 rounded-lg overflow-hidden group">
                                <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeNewImage(index)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <X className="w-6 h-6" />
                                </button>
                                <span className="absolute bottom-0 inset-x-0 bg-brand-primary/80 text-white text-[10px] text-center py-0.5">New</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer relative">
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 font-medium">Click or drag images to upload</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 2MB</p>
                    </div>
                </div>

                {/* Product Type & Pricing Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-lg font-bold text-gray-900">Inventory & Variations</h2>
                        <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                            <button type="button" onClick={() => setHasVariants(false)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${!hasVariants ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}>Simple Product</button>
                            <button type="button" onClick={() => setHasVariants(true)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${hasVariants ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}>Variable Product</button>
                        </div>
                    </div>

                    {!hasVariants ? (
                        // Simple Product Inputs
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($) *</label>
                                <input type="number" step="0.01" required={!hasVariants} value={simplePrice} onChange={e => setSimplePrice(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                <input type="text" value={simpleSku} onChange={e => setSimpleSku(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                                <input type="number" required={!hasVariants} value={simpleStock} onChange={e => setSimpleStock(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" />
                            </div>
                        </div>
                    ) : (
                        // Variable Product Matrix Builder
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">1. Select Attributes to create variations</label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {flatAttributes.map(attr => (
                                        <button 
                                            key={attr.id}
                                            type="button"
                                            onClick={() => toggleAttribute(attr.id)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                                                selectedAttributes.includes(attr.id) 
                                                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-brand-primary/50'
                                            }`}
                                        >
                                            {attr.name}
                                        </button>
                                    ))}
                                </div>

                                {selectedAttributes.length > 0 && (
                                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-900">2. Select Values</h3>
                                        {flatAttributes.filter(a => selectedAttributes.includes(a.id)).map(attr => (
                                            <div key={attr.id} className="mb-3 last:mb-0">
                                                <div className="text-sm font-medium text-gray-700 mb-2">{attr.name}:</div>
                                                <div className="flex flex-wrap gap-3">
                                                    {attr.values.length > 0 ? attr.values.map(val => (
                                                        <label key={val.id} className="flex items-center gap-1.5 cursor-pointer">
                                                            <input 
                                                                type="checkbox"
                                                                checked={selectedAttributeValues.includes(val.id)}
                                                                onChange={() => toggleAttributeValue(val.id)}
                                                                className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
                                                            />
                                                            <span className="text-sm text-gray-600">{val.value}</span>
                                                        </label>
                                                    )) : <span className="text-sm text-gray-400 italic">No values available for this attribute.</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <button type="button" onClick={generateVariantMatrix} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                                    Generate Variant Combinations
                                </button>
                            </div>

                            {variants.length > 0 && (
                                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Variant</th>
                                                <th className="px-4 py-3 font-medium w-32">Price *</th>
                                                <th className="px-4 py-3 font-medium w-48">SKU</th>
                                                <th className="px-4 py-3 font-medium w-32">Stock *</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variants.map((variant, index) => (
                                                <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{variant._attributeNames}</td>
                                                    <td className="px-4 py-2">
                                                        <input type="number" step="0.01" required value={variant.price} onChange={e => updateVariantField(index, 'price', e.target.value)} className="w-full px-2 py-1.5 border rounded outline-none focus:ring-1 focus:ring-brand-primary" />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input type="text" value={variant.sku} onChange={e => updateVariantField(index, 'sku', e.target.value)} className="w-full px-2 py-1.5 border rounded outline-none focus:ring-1 focus:ring-brand-primary" />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input type="number" required value={variant.stock_quantity} onChange={e => updateVariantField(index, 'stock_quantity', e.target.value)} className="w-full px-2 py-1.5 border rounded outline-none focus:ring-1 focus:ring-brand-primary" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-hover transition font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20">
                        {isSubmitting && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        {isSubmitting ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}
