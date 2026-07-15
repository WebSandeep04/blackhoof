import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchLoginLogs } from '../store/slices/loginLogsSlice';
import DataTable from '../components/DataTable';
import { Search, ChevronDown, ChevronRight, Download, Shield } from 'lucide-react';

export default function LoginLogs({ isTab = false }) {
    const dispatch = useDispatch();
    const { user: authUser } = useSelector(state => state.auth);
    const { logs, pagination, loading } = useSelector(state => state.loginLogs);
    
    const hasPermission = (permission) => authUser?.permissions?.includes(permission);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchLoginLogs({ page, search: searchQuery, start_date: startDate, end_date: endDate }));
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [dispatch, searchQuery, startDate, endDate, page]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    if (!hasPermission('view login logs')) {
        return <div className="p-8 text-center text-gray-500">You do not have permission to view this page.</div>;
    }

    return (
        <div className={isTab ? "space-y-6 animate-fade-in" : "max-w-7xl mx-auto space-y-6 animate-fade-in"}>
            {!isTab && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-light/20 rounded-lg">
                            <Shield className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Login Logs</h1>
                            <p className="text-sm text-gray-500">Track user logins and login trails</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex justify-end items-center flex-wrap gap-4 w-full">
                    <div className="flex gap-2 items-center">
                        <label className="text-sm text-gray-600">From:</label>
                        <input 
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm bg-white shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        <label className="text-sm text-gray-600">To:</label>
                        <input 
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm bg-white shadow-sm"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last IP Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Logins</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-8 h-8 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin"></div>
                                            <p className="text-gray-500 text-sm font-medium animate-pulse">Loading data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length > 0 ? (
                                logs.map((group) => {
                                    const user = group.user;
                                    const rowKey = `${group.login_date}_${group.user_id}`;
                                    const isExpanded = expandedRows[rowKey];
                                    
                                    // Parse just the date string (e.g. 2026-07-13)
                                    const dateObj = new Date(group.login_date + 'T00:00:00');
                                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    
                                    const latestLog = group.trail?.[0];

                                    return (
                                        <React.Fragment key={rowKey}>
                                            <tr className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{dateStr}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{user?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-gray-500">{user?.email || ''}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {latestLog?.ip_address || group.last_ip || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {latestLog ? formatDate(latestLog.created_at) : (group.last_login ? formatDate(group.last_login) : 'N/A')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {group.login_count}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => toggleRow(rowKey)}
                                                        className="text-brand-primary hover:text-brand-hover"
                                                    >
                                                        {isExpanded ? 'Hide Trail' : 'Show Trail'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="6" className="bg-gray-50 px-6 py-4 shadow-inner">
                                                        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm ml-4">
                                                            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                Login Trail for {dateStr}
                                                            </div>
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">IP Address</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Login Time</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200">
                                                                    {group.trail?.map(log => (
                                                                        <tr key={log.id} className="hover:bg-gray-50">
                                                                            <td className="px-4 py-2 text-sm text-gray-600">{log.ip_address || 'N/A'}</td>
                                                                            <td className="px-4 py-2 text-sm text-gray-600">{formatDate(log.created_at)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-6 text-center text-sm text-gray-500">
                                        No login logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.total > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(pagination.current_page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(pagination.current_page * 10, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> users
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        Page {pagination.current_page} of {pagination.last_page}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
