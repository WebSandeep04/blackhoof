import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { History, Search, X } from 'lucide-react';

export default function AuditLogs({ isTab = false }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = async (currentPage) => {
        try {
            setLoading(true);
            const response = await api.get(`/audit-logs?page=${currentPage}`);
            if (response.data.status === 'success') {
                setLogs(response.data.data.data);
                setTotalPages(response.data.data.last_page);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    const stripHtml = (html) => {
        if (typeof html !== 'string') return html;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const renderModalChanges = (properties) => {
        if (!properties || !properties.attributes) return <div className="text-gray-400 italic p-4">No changes recorded</div>;

        const { old, attributes } = properties;
        
        return (
            <div className="space-y-6">
                {Object.keys(attributes).map(key => {
                    if (old && old[key] === attributes[key]) return null;

                    return (
                        <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-700 capitalize">{key.replace(/_/g, ' ')}</h3>
                            </div>
                            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                                <div className="flex-1 p-4 bg-red-50/30 overflow-x-auto">
                                    <div className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-2">Previous Value</div>
                                    {old && old[key] !== undefined ? (
                                        <div 
                                            className="text-sm text-gray-700 prose prose-sm max-w-none" 
                                            dangerouslySetInnerHTML={{ __html: String(old[key]) }} 
                                        />
                                    ) : (
                                        <span className="text-gray-400 italic text-sm">None</span>
                                    )}
                                </div>
                                <div className="flex-1 p-4 bg-green-50/30 overflow-x-auto">
                                    <div className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-2">Current Value</div>
                                    <div 
                                        className="text-sm text-gray-700 prose prose-sm max-w-none" 
                                        dangerouslySetInnerHTML={{ __html: String(attributes[key]) }} 
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const columns = [
        {
            key: 'created_at',
            label: 'Date & Time',
            render: (row) => {
                const value = row.created_at;
                const date = new Date(value);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return (
                    <div className="whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                            {dateStr}
                        </div>
                        <div className="text-sm text-gray-500">
                            {timeStr}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'causer',
            label: 'User',
            render: (row) => {
                const causer = row.causer;
                return (
                    <div>
                        {causer ? (
                            <>
                                <div className="font-medium text-gray-900">{causer.name}</div>
                                <div className="text-sm text-gray-500">{causer.email}</div>
                            </>
                        ) : (
                            <span className="text-gray-400 italic">System / Unknown</span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'subject_type',
            label: 'Resource',
            render: (row) => {
                const type = row.subject_type;
                const log = row;
                const modelName = type ? type.split('\\').pop() : 'Unknown';
                return (
                    <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {modelName}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">ID: {log.subject_id}</div>
                    </div>
                );
            }
        },
        {
            key: 'event',
            label: 'Action',
            render: (row) => {
                const event = row.event;
                const colors = {
                    created: 'bg-emerald-100 text-emerald-800',
                    updated: 'bg-amber-100 text-amber-800',
                    deleted: 'bg-rose-100 text-rose-800',
                };
                const color = colors[event] || 'bg-gray-100 text-gray-800';
                
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${color}`}>
                        {event}
                    </span>
                );
            }
        },
        {
            key: 'properties',
            label: 'Changes Details',
            render: (row) => (
                <button
                    onClick={() => setSelectedLog(row)}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-brand-primary bg-brand-light/10 border border-brand-primary/20 rounded-lg hover:bg-brand-primary hover:text-white transition-colors"
                >
                    View Changes
                </button>
            )
        }
    ];

    return (
        <div className={isTab ? "space-y-6" : "max-w-7xl mx-auto space-y-6"}>
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
                <DataTable
                    columns={columns}
                    data={logs}
                    loading={loading}
                    keyExtractor={(row) => row.id}
                    pagination={{
                        page,
                        totalPages,
                        setPage
                    }}
                />
            </div>

            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Change Details</h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    {selectedLog.subject_type ? selectedLog.subject_type.split('\\').pop() : 'Resource'} #{selectedLog.subject_id} updated on {new Date(selectedLog.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {renderModalChanges(selectedLog.properties)}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
