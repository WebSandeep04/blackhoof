import React from 'react';

export default function DataTable({ columns, data, keyExtractor, emptyMessage = "No records found.", pagination, onPageChange, loading }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((col, index) => (
                            <th 
                                key={index} 
                                className={`px-3 py-2 text-sm font-medium text-black ${col.className || 'text-left'}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-12 text-center">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="w-8 h-8 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin"></div>
                                    <p className="text-gray-500 text-sm font-medium animate-pulse">Loading data...</p>
                                </div>
                            </td>
                        </tr>
                    ) : data.length > 0 ? (
                        data.map((row) => (
                            <tr key={keyExtractor(row)}>
                                {columns.map((col, colIndex) => (
                                    <td 
                                        key={colIndex} 
                                        className={`px-3 py-1.5 whitespace-nowrap text-sm text-black ${col.cellClassName || ''}`}
                                    >
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-gray-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            {pagination && pagination.total > 0 && (
                <div className="px-3 py-1.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => onPageChange(pagination.current_page - 1)}
                            disabled={pagination.current_page === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => onPageChange(pagination.current_page + 1)}
                            disabled={pagination.current_page === pagination.last_page}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs text-gray-700">
                                Showing <span className="font-medium">{(pagination.current_page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(pagination.current_page * 10, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => onPageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="relative inline-flex items-center px-2 py-1 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="relative inline-flex items-center px-3 py-1 border border-gray-300 bg-white text-xs font-medium text-gray-700">
                                    Page {pagination.current_page} of {pagination.last_page}
                                </span>
                                <button
                                    onClick={() => onPageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="relative inline-flex items-center px-2 py-1 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
