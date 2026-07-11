import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchAttributes } from '../store/slices/attributesSlice';
import { createProduct, updateProduct, fetchProduct, clearCurrentProduct } from '../store/slices/productsSlice';
import { ArrowLeft, Upload, X, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEditMode = !!id;

    const { flatCategories } = useSelector(state => state.categories);
    const { flatAttributes } = useSelector(state => state.attributes);
    const { currentProduct, loading: productLoading } = useSelector(state => state.products);
    const { user } = useSelector(state => state.auth);

    const hasPermission = (permission) => {
        return user?.permissions?.includes(permission);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isTrending, setIsTrending] = useState(false);
    const [isTopSeller, setIsTopSeller] = useState(false);
    const [includeInCatalogue, setIncludeInCatalogue] = useState(true);
    const [productFor, setProductFor] = useState('blackhoof');
    const [hasVariants, setHasVariants] = useState(true); // Default to true as requested
    // Images have been moved to variant level

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

    // Derived filtered attributes based on selected category
    const [filteredAttributes, setFilteredAttributes] = useState([]);

    useEffect(() => {
        if (!categoryId) {
            setFilteredAttributes([]);
            return;
        }

        // Find the selected category in the flatCategories tree
        // Since it's a tree in the state but maybe flat here?
        // Wait, flatCategories is an array of all categories. We can just find it.
        const category = flatCategories.find(c => c.id == categoryId);
        if (category && category.attributes) {
            const mappedAttrIds = category.attributes.map(a => a.id);
            setFilteredAttributes(flatAttributes.filter(a => mappedAttrIds.includes(a.id)));
        } else {
            setFilteredAttributes([]);
        }
    }, [categoryId, flatCategories, flatAttributes]);

    // When category changes, reset variant builder if it's not the initial load
    useEffect(() => {
        // If edit mode and product hasn't loaded yet, don't clear
        if (isEditMode && (!currentProduct || currentProduct.category_id == categoryId)) {
            return;
        }
        
        // Reset variant builder
        setSelectedAttributes([]);
        setSelectedAttributeValues([]);
        setVariants([]);
    }, [categoryId]);

    useEffect(() => {
        if (isEditMode && currentProduct) {
            setName(currentProduct.name || '');
            setCategoryId(currentProduct.category_id || '');
            setShortDescription(currentProduct.short_description || '');
            setDescription(currentProduct.description || '');
            setIsActive(currentProduct.is_active ?? true);
            setIsTrending(currentProduct.is_trending ?? false);
            setIsTopSeller(currentProduct.is_top_seller ?? false);
            setIncludeInCatalogue(currentProduct.include_in_catalogue ?? true);
            setProductFor(currentProduct.product_for || 'blackhoof');
            

            // Check if it has multiple variants, or variants with attributes
            const hasMultipleVariants = currentProduct.variants?.length > 1;
            const hasAttributeValues = currentProduct.variants?.[0]?.attribute_values?.length > 0;
            
            if (hasMultipleVariants || hasAttributeValues) {
                setHasVariants(true);
                setVariants((currentProduct.variants || []).map(v => ({
                    id: v.id,
                    sku: v.sku,
                    price: v.price,
                    stock_quantity: v.stock_quantity,
                    attributes: (v.attribute_values || []).map(av => av.id),
                    _attributeNames: (v.attribute_values || []).map(av => av.value).join(', '), // Display helper
                    existingImages: v.images || [],
                    newImages: []
                })));
                
                // Extract unique attribute IDs and Value IDs used
                const usedAttributeIds = new Set();
                const usedAttributeValueIds = new Set();
                (currentProduct.variants || []).forEach(v => {
                    (v.attribute_values || []).forEach(av => {
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
                    setVariants([{ 
                        id: defaultVariant.id, 
                        existingImages: defaultVariant.images || [],
                        newImages: [] 
                    }]);
                }
            }
        }
    }, [currentProduct, isEditMode]);


    const handleVariantImageChange = (index, e) => {
        const files = Array.from(e.target.files);
        const newVariants = [...variants];
        newVariants[index].newImages = [...(newVariants[index].newImages || []), ...files];
        setVariants(newVariants);
    };

    const removeVariantNewImage = (variantIndex, imageIndex) => {
        const newVariants = [...variants];
        newVariants[variantIndex].newImages.splice(imageIndex, 1);
        setVariants(newVariants);
    };

    const removeVariantExistingImage = (variantIndex, idToRemove) => {
        const newVariants = [...variants];
        newVariants[variantIndex].existingImages = newVariants[variantIndex].existingImages.filter(img => img.id !== idToRemove);
        setVariants(newVariants);
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
                values: (a.values || []).filter(v => selectedAttributeValues.includes(v.id))
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
                sku: existingVariant ? existingVariant.sku : `${name ? name.substring(0, 4).toUpperCase() : 'PROD'}-${attrNames.toUpperCase()}`,
                price: existingVariant ? existingVariant.price : (simplePrice || 0),
                stock_quantity: existingVariant ? existingVariant.stock_quantity : (simpleStock || 0),
                attributes: attrIds,
                _attributeNames: attrNames.replace(/-/g, ', '), // For display
                existingImages: existingVariant ? (existingVariant.images || []) : [],
                newImages: []
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
        
        if (!name.trim()) {
            return Swal.fire('Error', 'Product name is required', 'error');
        }

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
                sku: simpleSku || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').toUpperCase(),
                price: simplePrice || 0,
                stock_quantity: simpleStock || 0,
                attributes: []
            }];
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('category_id', categoryId);
        formData.append('short_description', shortDescription);
        formData.append('description', description);
        formData.append('is_active', isActive ? 1 : 0);
        formData.append('is_trending', isTrending ? 1 : 0);
        formData.append('is_top_seller', isTopSeller ? 1 : 0);
        formData.append('include_in_catalogue', includeInCatalogue ? 1 : 0);
        formData.append('product_for', productFor);
        formData.append('has_variants', hasVariants ? 1 : 0);
        // Clean up variants payload so we don't send File objects in JSON
        const variantsPayload = finalVariants.map(v => ({
            id: v.id,
            sku: v.sku,
            price: v.price,
            stock_quantity: v.stock_quantity,
            attributes: v.attributes
        }));
        formData.append('variants', JSON.stringify(variantsPayload));

        // Append new variant images
        finalVariants.forEach((variant, index) => {
            if (variant.newImages && variant.newImages.length > 0) {
                variant.newImages.forEach(file => {
                    formData.append(`variant_images_${index}[]`, file);
                });
            }
        });

        // Append existing image IDs across all variants for edit mode
        if (isEditMode) {
            const allExistingIds = [];
            finalVariants.forEach(variant => {
                if (variant.existingImages) {
                    variant.existingImages.forEach(img => {
                        allExistingIds.push(img.id);
                    });
                }
            });
            formData.append('existing_images', JSON.stringify(allExistingIds));
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

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            ['clean']
        ],
    };

    return (
        <div className="max-w-7xl mx-auto pb-12 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/admin/products')} className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-brand-primary transition">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
                {/* Main Content Column */}
                <div className="flex-1 space-y-6">
                    {/* Basic Info Card */}
                    {hasPermission('create/edit product basic info') && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Basic Information</h2>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" />
                                </div>
                            </div>

                            <div className="pb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                                <div className="bg-white rounded-lg border overflow-hidden">
                                    <ReactQuill 
                                        theme="snow" 
                                        value={shortDescription} 
                                        onChange={setShortDescription} 
                                        modules={modules}
                                        className="h-40 mb-10"
                                        placeholder="Brief description..."
                                    />
                                </div>
                            </div>
                            <div className="pb-4 mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Long Description</label>
                                <div className="bg-white rounded-lg border overflow-hidden">
                                    <ReactQuill 
                                        theme="snow" 
                                        value={description} 
                                        onChange={setDescription} 
                                        modules={modules}
                                        className="h-64 mb-12"
                                        placeholder="Detailed product description..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}


                {/* Product Type & Pricing Card */}
                {hasPermission('create/edit product inventory') && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h2 className="text-lg font-bold text-gray-900">Inventory & Variations</h2>
                        </div>

                        {/* Variable Product Matrix Builder */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">1. Select Attributes to create variations</label>
                                {filteredAttributes.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {filteredAttributes.map(attr => (
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
                                ) : (
                                    <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        No attributes are mapped to this category. Please map attributes in the Category settings first.
                                    </div>
                                )}

                                {selectedAttributes.length > 0 && (
                                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-900">2. Select Values</h3>
                                        {filteredAttributes.filter(a => selectedAttributes.includes(a.id)).map(attr => (
                                            <div key={attr.id} className="mb-3 last:mb-0">
                                                <div className="text-sm font-medium text-gray-700 mb-2">{attr.name}:</div>
                                                <div className="flex flex-wrap gap-3">
                                                    {(attr.values || []).length > 0 ? (attr.values || []).map(val => (
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
                                                <th className="px-4 py-3 font-medium w-64">Images</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variants.map((variant, index) => (
                                                <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50 align-top">
                                                    <td className="px-4 py-3 font-medium text-gray-900 pt-4">{variant._attributeNames || 'Default'}</td>
                                                    <td className="px-4 py-2 pt-3">
                                                        <input type="number" step="0.01" required value={variant.price} onChange={e => updateVariantField(index, 'price', e.target.value)} className="w-full px-2 py-1.5 border rounded outline-none focus:ring-1 focus:ring-brand-primary" />
                                                    </td>
                                                    <td className="px-4 py-2 pt-3">
                                                        <input type="text" value={variant.sku} onChange={e => updateVariantField(index, 'sku', e.target.value)} className="w-full px-2 py-1.5 border rounded outline-none focus:ring-1 focus:ring-brand-primary" />
                                                    </td>
                                                    <td className="px-4 py-2 pt-3">
                                                        <input type="number" required value={variant.stock_quantity} onChange={e => updateVariantField(index, 'stock_quantity', e.target.value)} className="w-full px-2 py-1.5 border rounded outline-none focus:ring-1 focus:ring-brand-primary" />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="relative overflow-hidden w-full h-8 flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-200 cursor-pointer">
                                                                <input type="file" multiple accept="image/*" onChange={(e) => handleVariantImageChange(index, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                                <Upload className="w-3 h-3 mr-1" /> Add Images
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 mt-1 max-w-full">
                                                                {(variant.existingImages || []).map(img => (
                                                                    <div key={img.id} className="relative w-8 h-8 rounded border overflow-hidden group">
                                                                        <img src={img.url} alt="Variant" className="w-full h-full object-cover" />
                                                                        <button type="button" onClick={() => removeVariantExistingImage(index, img.id)} className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {(variant.newImages || []).map((file, imgIdx) => (
                                                                    <div key={imgIdx} className="relative w-8 h-8 rounded border border-brand-primary/50 overflow-hidden group">
                                                                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                                                        <button type="button" onClick={() => removeVariantNewImage(index, imgIdx)} className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

                {/* Sidebar Column */}
                <div className="w-full lg:w-1/3 space-y-6">
                    {/* Product For Card */}
                    {hasPermission('create/edit product for') && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Product For</h2>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${productFor === 'blackhoof' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary font-medium' : 'border-gray-200 hover:border-brand-primary/50 text-gray-600'}`}>
                                    <input type="radio" name="product_for" value="blackhoof" checked={productFor === 'blackhoof'} onChange={e => setProductFor(e.target.value)} className="hidden" />
                                    Blackhoof
                                </label>
                                <label className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${productFor === 'satkirti' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary font-medium' : 'border-gray-200 hover:border-brand-primary/50 text-gray-600'}`}>
                                    <input type="radio" name="product_for" value="satkirti" checked={productFor === 'satkirti'} onChange={e => setProductFor(e.target.value)} className="hidden" />
                                    Satkirti
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Settings Card */}
                    {hasPermission('create/edit product settings') && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Settings</h2>
                            
                            <div className="flex items-center justify-between pt-2">
                                <span className={`text-sm font-medium ${isActive ? 'text-brand-primary' : 'text-gray-500'}`}>
                                    {isActive ? 'Published' : 'Draft'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                </label>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <span className={`text-sm font-medium ${isTrending ? 'text-brand-primary' : 'text-gray-500'}`}>
                                    {isTrending ? 'Trending' : 'Not Trending'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isTrending} onChange={e => setIsTrending(e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                </label>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <span className={`text-sm font-medium ${isTopSeller ? 'text-brand-primary' : 'text-gray-500'}`}>
                                    {isTopSeller ? 'Top Seller' : 'Not Top Seller'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isTopSeller} onChange={e => setIsTopSeller(e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <span className={`text-sm font-medium ${includeInCatalogue ? 'text-brand-primary' : 'text-gray-500'}`}>
                                    {includeInCatalogue ? 'In Catalogue' : 'Hidden'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={includeInCatalogue} onChange={e => setIncludeInCatalogue(e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Category Card */}
                    {hasPermission('create/edit product category') && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Category</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
                                <div className="w-full max-h-72 overflow-y-auto rounded-lg bg-white">
                                    {(() => {
                                        // Build tree and render hierarchical options
                                        const buildTree = (cats, parentId = null) => {
                                            return cats
                                                .filter(c => c.parent_id === parentId)
                                                .map(c => ({ ...c, children: buildTree(cats, c.id) }));
                                        };
                                        
                                        const renderTreeOptions = (cats, level = 0) => {
                                            return cats.map(cat => (
                                                <div key={cat.id} className="flex flex-col">
                                                    <label className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded transition hover:bg-gray-50 ${categoryId == cat.id ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'text-gray-700'}`} style={{ marginLeft: `${level * 1.5}rem` }}>
                                                        <input 
                                                            type="radio" 
                                                            name="category_id"
                                                            value={cat.id}
                                                            checked={categoryId == cat.id}
                                                            onChange={e => setCategoryId(e.target.value)}
                                                            className="w-4 h-4 text-brand-primary focus:ring-brand-primary border-gray-300 shrink-0"
                                                        />
                                                        <span className="text-sm">{cat.name}</span>
                                                    </label>
                                                    {cat.children && cat.children.length > 0 && (
                                                        <div className="flex flex-col relative before:absolute before:left-[0.6rem] before:top-0 before:bottom-0 before:w-px before:bg-gray-200">
                                                            {renderTreeOptions(cat.children, level + 1)}
                                                        </div>
                                                    )}
                                                </div>
                                            ));
                                        };

                                        const filteredCategories = flatCategories.filter(c => c.category_for === productFor);
                                        return renderTreeOptions(buildTree(filteredCategories));
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-hover transition font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20">
                            {isSubmitting && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                            {isSubmitting ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
