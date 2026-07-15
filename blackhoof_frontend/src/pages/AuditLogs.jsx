import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { History, Search, ChevronDown, ChevronRight, Download } from 'lucide-react';
import SectionAuditModal from '../components/SectionAuditModal'; // Reuse your clean modal inside the trail if needed, or inline the trail.

export default function AuditLogs({ isTab = false }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedRows, setExpandedRows] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const fetchGroups = async (currentPage) => {
        try {
            setLoading(true);
            const response = await api.get(`/audit-logs/grouped?page=${currentPage}`);
            if (response.data.status === 'success') {
                setGroups(response.data.data.data);
                setTotalPages(response.data.data.last_page);
            }
        } catch (error) {
            console.error('Failed to fetch grouped audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups(page);
    }, [page]);

    const toggleRow = async (productId) => {
        const isCurrentlyExpanded = !!expandedRows[productId];
        
        if (!isCurrentlyExpanded) {
            // Fetch trail if expanding
            try {
                const response = await api.get(`/audit-logs/grouped/${productId}/trail`);
                if (response.data.status === 'success') {
                    setExpandedRows(prev => ({
                        ...prev,
                        [productId]: {
                            expanded: true,
                            trail: response.data.data
                        }
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch trail:", error);
            }
        } else {
            // Collapse
            setExpandedRows(prev => {
                const newState = { ...prev };
                delete newState[productId];
                return newState;
            });
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const stripHtml = (html) => {
        if (typeof html !== 'string') return html;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const formatValue = (val, key = '') => {
        if (val === null || val === undefined || val === '') return <span className="text-gray-400 italic">Empty</span>;
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        
        // Render image if the key suggests it's an image path
        if (typeof val === 'string' && (key === 'image_path' || val.match(/\.(jpeg|jpg|gif|png|webp)$/i))) {
            const imageUrl = val.startsWith('http') ? val : `http://localhost:8000/storage/${val}`;
            return (
                <div className="flex flex-col gap-1">
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                        <img src={imageUrl} alt="Log image" className="h-16 w-16 object-cover rounded border border-gray-200 hover:opacity-80 transition-opacity" />
                    </a>
                    <span className="text-[10px] text-gray-500 truncate max-w-[150px]" title={val}>{val.split('/').pop()}</span>
                </div>
            );
        }

        if (typeof val === 'object') return JSON.stringify(val);
        if (typeof val === 'string') {
            return stripHtml(val);
        }
        return val;
    };

    const renderChanges = (properties) => {
        if (!properties || (!properties.attributes && !properties.old)) return <div className="text-gray-400 italic text-sm">No changes recorded</div>;
        
        const { old, attributes } = properties;
        const keys = attributes ? Object.keys(attributes) : (old ? Object.keys(old) : []);
        
        return (
            <div className="space-y-2 mt-2">
                {keys.filter(key => key !== 'product_id').map(key => {
                    if (old && attributes && old[key] === attributes[key]) return null;
                    return (
                        <div key={key} className="text-sm bg-white border border-gray-100 rounded-md p-2 flex flex-col sm:flex-row sm:items-center gap-2 shadow-sm">
                            <div className="font-medium text-gray-700 min-w-[120px]">{key.replace(/_/g, ' ').toUpperCase()}:</div>
                            <div className="flex items-center gap-2 flex-1 break-words overflow-hidden">
                                {old && old[key] !== undefined && (
                                    <>
                                        <div className="bg-red-50 text-red-700 px-2 py-1 rounded line-through flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide max-w-[200px]">
                                            {formatValue(old[key], key)}
                                        </div>
                                        {attributes && attributes[key] !== undefined && <span className="text-gray-400 shrink-0">→</span>}
                                    </>
                                )}
                                {attributes && attributes[key] !== undefined && (
                                    <div className="bg-green-50 text-green-700 px-2 py-1 rounded flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide max-w-[200px]">
                                        {formatValue(attributes[key], key)}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={isTab ? "space-y-6 animate-fade-in" : "max-w-7xl mx-auto space-y-6 animate-fade-in"}>
            {!isTab && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-light/20 rounded-lg">
                            <History className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                            <p className="text-sm text-gray-500">Track all changes made to products and other resources</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Changes</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-8 h-8 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin"></div>
                                            <p className="text-gray-500 font-medium">Loading logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : groups.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        No audit logs found.
                                    </td>
                                </tr>
                            ) : (
                                groups.map((group) => {
                                    const isExpanded = !!expandedRows[group.product_id];
                                    return (
                                        <React.Fragment key={group.product_id}>
                                            <tr className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-brand-light/20 flex items-center justify-center text-brand-primary font-bold">
                                                            {group.product_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{group.product_name}</div>
                                                            <div className="text-xs text-gray-500">ID: {group.product_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatDate(group.last_activity)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {group.log_count}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => toggleRow(group.product_id)}
                                                        className="inline-flex items-center gap-1 text-brand-primary hover:text-brand-hover px-3 py-1.5 rounded-lg hover:bg-brand-light/10 transition-colors"
                                                    >
                                                        {isExpanded ? (
                                                            <><ChevronDown className="w-4 h-4" /> Hide Trail</>
                                                        ) : (
                                                            <><ChevronRight className="w-4 h-4" /> Show Trail</>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && expandedRows[group.product_id].trail && (
                                                <tr>
                                                    <td colSpan="4" className="bg-gray-50 px-6 py-6 shadow-inner">
                                                        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm ml-4">
                                                            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                                                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                                    Change History for {group.product_name}
                                                                </span>
                                                            </div>
                                                            <div className="p-6">
                                                                <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                                                                    {expandedRows[group.product_id].trail.map((log, index) => {
                                                                        const eventColor = log.event === 'created' ? 'bg-green-100 text-green-800' : log.event === 'updated' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                                                                        const modelType = log.subject_type ? log.subject_type.split('\\').pop() : 'Unknown';
                                                                        
                                                                        return (
                                                                            <div key={log.id} className="relative pl-8">
                                                                                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-brand-primary"></div>
                                                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                                                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${eventColor}`}>
                                                                                                {log.event}
                                                                                            </span>
                                                                                            <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                                                                                {modelType}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="text-right">
                                                                                            <div className="text-sm font-bold text-gray-900">{log.causer?.name || 'System'}</div>
                                                                                            <div className="text-xs text-gray-500">{formatDate(log.created_at)}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    {renderChanges(log.properties)}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                page === 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page <span className="font-semibold text-gray-900">{page}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                page === totalPages ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
