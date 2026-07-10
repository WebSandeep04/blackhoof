import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';

export default function DynamicFilter({ config = [], onFilterChange, onClear, initialFilters = {}, children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState(initialFilters);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const handleClear = () => {
        setFilters({});
        if (onClear) {
            onClear();
        }
    };

    const activeFilterCount = Object.keys(filters).filter(k => filters[k] !== '' && filters[k] !== null && filters[k] !== undefined).length;

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                            isOpen || activeFilterCount > 0 
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>
                    {activeFilterCount > 0 && (
                        <button 
                            onClick={handleClear}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition"
                        >
                            <X className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>
                {children && (
                    <div className="flex items-center">
                        {children}
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {config.map((field) => (
                        <div key={field.key} className="flex flex-col">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                {field.label}
                            </label>
                            
                            {field.type === 'select' && (
                                <select 
                                    value={filters[field.key] || ''} 
                                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                                >
                                    <option value="">All</option>
                                    {field.options.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            )}

                            {field.type === 'boolean' && (
                                <select 
                                    value={filters[field.key] !== undefined ? String(filters[field.key]) : ''} 
                                    onChange={(e) => handleFilterChange(field.key, e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                                >
                                    <option value="">All</option>
                                    <option value="true">{field.trueLabel || 'Yes'}</option>
                                    <option value="false">{field.falseLabel || 'No'}</option>
                                </select>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
