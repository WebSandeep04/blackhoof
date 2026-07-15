import React from 'react';
import { X, Clock, User, ArrowRight, History } from 'lucide-react';

export default function SectionAuditModal({ isOpen, onClose, title, logs, fields }) {
    if (!isOpen) return null;

    const relevantLogs = logs.filter(log => {
        if (!log.properties || !log.properties.attributes) return false;
        const changedFields = Object.keys(log.properties.attributes);
        return changedFields.some(field => fields.includes(field));
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatValue = (val) => {
        if (val === null || val === undefined || val === '') return <span className="text-gray-400 italic">Empty</span>;
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        if (typeof val === 'object') return JSON.stringify(val);
        
        if (typeof val === 'string') {
            // Strip HTML tags completely
            let stripped = val.replace(/<[^>]*>?/gm, '').trim();
            if (!stripped) return <span className="text-gray-400 italic">Empty</span>;
            if (stripped.length > 100) return stripped.substring(0, 100) + '...';
            return stripped;
        }
        return String(val);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <History className="w-5 h-5 text-brand-primary" />
                            {title} History
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">Chronological record of changes</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-brand">
                    {relevantLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                            <Clock className="w-10 h-10 text-gray-300 mb-3" />
                            <h3 className="text-base font-bold text-gray-900">No Changes Found</h3>
                            <p className="text-sm text-gray-500 mt-1">There is no recorded history for this section yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {relevantLogs.map((log) => {
                                const changedAttributes = Object.entries(log.properties.attributes)
                                    .filter(([key]) => fields.includes(key));
                                
                                if (changedAttributes.length === 0) return null;

                                return (
                                    <div key={log.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        {/* Card Header */}
                                        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {log.causer?.name || 'System'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        {formatDate(log.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${log.event === 'created' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {log.event}
                                            </span>
                                        </div>
                                        
                                        {/* Card Body */}
                                        <div className="p-5 space-y-5">
                                            {changedAttributes.map(([field, newValue]) => {
                                                const oldValue = log.properties.old ? log.properties.old[field] : null;
                                                
                                                if (JSON.stringify(oldValue) === JSON.stringify(newValue) && log.event !== 'created') return null;

                                                return (
                                                    <div key={field} className="flex flex-col gap-2">
                                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                            {field.replace(/_/g, ' ')}
                                                        </div>
                                                        
                                                        {log.event === 'created' ? (
                                                            <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 break-words">
                                                                {formatValue(newValue)}
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div className="relative">
                                                                    <div className="text-[10px] font-bold text-red-500 absolute -top-2 left-3 bg-white px-1.5 shadow-sm rounded border border-red-100">OLD</div>
                                                                    <div className="text-sm text-gray-600 bg-red-50/30 p-3 pt-4 rounded-lg border border-red-100 min-h-[3.5rem] break-words">
                                                                        {formatValue(oldValue)}
                                                                    </div>
                                                                </div>
                                                                <div className="relative">
                                                                    <div className="text-[10px] font-bold text-green-600 absolute -top-2 left-3 bg-white px-1.5 shadow-sm rounded border border-green-100 flex items-center gap-1">
                                                                        NEW <ArrowRight className="w-3 h-3 inline" />
                                                                    </div>
                                                                    <div className="text-sm text-gray-900 bg-green-50/30 p-3 pt-4 rounded-lg border border-green-200 min-h-[3.5rem] break-words">
                                                                        {formatValue(newValue)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
