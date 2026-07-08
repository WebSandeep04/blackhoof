import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAttributes, createAttribute, updateAttribute, deleteAttribute } from '../store/slices/attributesSlice';
import { Edit2, Trash2, Plus, Search, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';

export default function Attributes() {
    const dispatch = useDispatch();
    const { attributes, pagination, loading } = useSelector(state => state.attributes);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    
    const [currentAttribute, setCurrentAttribute] = useState({ id: null, name: '', values: [] });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchAttributes({ page, search: searchQuery }));
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

    // Dynamic Form Handlers
    const addValueRow = () => {
        setCurrentAttribute({
            ...currentAttribute,
            values: [...currentAttribute.values, { id: null, value: '' }]
        });
    };

    const removeValueRow = (index) => {
        const newValues = [...currentAttribute.values];
        newValues.splice(index, 1);
        setCurrentAttribute({ ...currentAttribute, values: newValues });
    };

    const handleValueChange = (index, value) => {
        const newValues = [...currentAttribute.values];
        newValues[index].value = value;
        setCurrentAttribute({ ...currentAttribute, values: newValues });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Filter out empty values
        const filteredValues = currentAttribute.values.filter(v => v.value.trim() !== '');

        setIsSubmitting(true);
        try {
            const payload = { 
                name: currentAttribute.name, 
                values: filteredValues
            };

            if (currentAttribute.id) {
                await dispatch(updateAttribute({ id: currentAttribute.id, attributeData: payload })).unwrap();
            } else {
                await dispatch(createAttribute(payload)).unwrap();
            }
            
            setIsSubmitting(false);
            setIsFormOpen(false);
            
            dispatch(fetchAttributes({ page, search: searchQuery }));
            
            Swal.fire({
                title: 'Success!',
                text: 'Attribute saved successfully.',
                icon: 'success',
                confirmButtonColor: '#2bb69a',
                timer: 1500
            });
        } catch (error) {
            setIsSubmitting(false);
            console.error("Error saving attribute:", error);
            
            let errorMessage = 'There was a problem saving the attribute.';
            if (error.errors && error.errors.name) {
                errorMessage = error.errors.name.join(' ');
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
            text: "This will also delete all associated attribute values!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2bb69a',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await dispatch(deleteAttribute(id)).unwrap();
                dispatch(fetchAttributes({ page, search: searchQuery }));

                Swal.fire({
                    title: 'Deleted!',
                    text: 'The attribute has been deleted.',
                    icon: 'success',
                    confirmButtonColor: '#2bb69a',
                    timer: 1500
                });
            } catch (error) {
                console.error("Error deleting attribute:", error);
                Swal.fire({
                    title: 'Error!',
                    text: 'There was a problem deleting the attribute.',
                    icon: 'error',
                    confirmButtonColor: '#2bb69a'
                });
            }
        }
    };

    const openForm = (attribute = { id: null, name: '', values: [] }) => {
        // Deep copy the values to avoid mutating state directly if editing
        const copiedValues = attribute.values ? attribute.values.map(v => ({ ...v })) : [];
        setCurrentAttribute({ 
            ...attribute, 
            values: copiedValues.length > 0 ? copiedValues : [{ id: null, value: '' }] // Start with one empty row if creating
        });
        setIsFormOpen(true);
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
                        placeholder="Search attributes..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                    />
                </div>
                <button 
                    onClick={() => openForm()}
                    className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm"
                    title="Add Attribute"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 shrink-0">{currentAttribute.id ? 'Edit' : 'Create'} Attribute</h2>
                        
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="overflow-y-auto pr-2 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Attribute Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g., Size, Color, Material"
                                        value={currentAttribute.name}
                                        onChange={(e) => setCurrentAttribute({ ...currentAttribute, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                </div>
                                
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">Attribute Values</label>
                                        <button 
                                            type="button" 
                                            onClick={addValueRow}
                                            className="text-sm text-brand-primary hover:text-brand-hover font-medium flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" /> Add Value
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        {currentAttribute.values.length === 0 && (
                                            <p className="text-sm text-gray-500 italic text-center py-2">No values added yet.</p>
                                        )}
                                        {currentAttribute.values.map((val, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    required
                                                    placeholder="e.g., XL, Red, Cotton"
                                                    value={val.value}
                                                    onChange={(e) => handleValueChange(index, e.target.value)}
                                                    className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => removeValueRow(index)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition"
                                                    title="Remove"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100 shrink-0">
                                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="px-5 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition font-medium flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed">
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {isSubmitting ? 'Saving...' : 'Save Attribute'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DataTable 
                columns={[
                    { header: 'ID', key: 'id' },
                    { header: 'Attribute Name', key: 'name', cellClassName: 'font-medium text-black w-1/4' },
                    { 
                        header: 'Values', 
                        key: 'values', 
                        render: (attribute) => (
                            <div className="flex flex-wrap gap-1">
                                {attribute.values && attribute.values.length > 0 ? (
                                    attribute.values.map(v => (
                                        <span key={v.id} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200">
                                            {v.value}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 italic text-xs">No values</span>
                                )}
                            </div>
                        )
                    },
                    {
                        header: 'Actions',
                        key: 'actions',
                        className: 'text-right',
                        cellClassName: 'text-right space-x-3 w-24',
                        render: (attribute) => (
                            <>
                                <button onClick={() => openForm(attribute)} className="text-brand-primary hover:text-brand-hover"><Edit2 className="w-4 h-4 inline" /></button>
                                <button onClick={() => handleDelete(attribute.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4 inline" /></button>
                            </>
                        )
                    }
                ]}
                data={attributes}
                keyExtractor={(attribute) => attribute.id}
                emptyMessage="No attributes found."
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
            />
        </div>
    );
}
