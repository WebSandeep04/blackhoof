import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { Edit2, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';

export default function Inqueries() {
    const { user: authUser } = useSelector(state => state.auth);
    const hasPermission = (permission) => authUser?.permissions?.includes(permission);
    
    const [inqueries, setInqueries] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    
    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentInquery, setCurrentInquery] = useState({ id: null, name: '', email: '', phone: '', message: '', inquery_for: 'blackhoof', status: 1 });

    const fetchInqueries = async (currentPage = 1, search = '') => {
        setLoading(true);
        try {
            const response = await api.get('/inqueries', {
                params: { page: currentPage, search }
            });
            setInqueries(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total
            });
        } catch (error) {
            console.error("Error fetching inqueries", error);
            Swal.fire('Error', 'Could not fetch inqueries', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchInqueries(page, searchQuery);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, page]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const toggleStatus = async (inquery) => {
        if (!hasPermission('edit inqueries')) return;
        
        try {
            await api.put(`/inqueries/${inquery.id}`, { status: !inquery.status });
            fetchInqueries(page, searchQuery);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Status updated successfully',
                showConfirmButton: false,
                timer: 1500
            });
        } catch (error) {
            Swal.fire('Error', 'Failed to update status', 'error');
        }
    };

    const openForm = (inquery) => {
        setCurrentInquery({ ...inquery });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/inqueries/${currentInquery.id}`, currentInquery);
            setIsSubmitting(false);
            setIsFormOpen(false);
            fetchInqueries(page, searchQuery);
            Swal.fire({
                title: 'Success!',
                text: 'Inquery updated successfully.',
                icon: 'success',
                confirmButtonColor: '#2bb69a',
                timer: 1500
            });
        } catch (error) {
            setIsSubmitting(false);
            console.error("Error updating inquery:", error);
            Swal.fire({
                title: 'Error!',
                text: 'Error updating inquery.',
                icon: 'error',
                confirmButtonColor: '#2bb69a'
            });
        }
    };



    const handleDelete = async (id) => {
        if (!hasPermission('delete inqueries')) return;

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/inqueries/${id}`);
                fetchInqueries(page, searchQuery);
                Swal.fire('Deleted!', 'Inquery has been deleted.', 'success');
            } catch (error) {
                Swal.fire('Error', 'There was a problem deleting the inquery.', 'error');
            }
        }
    };

    const columns = [
        {
            header: 'Name',
            key: 'name',
            render: (inquery) => (
                <div>
                    <p className="font-medium text-gray-900">{inquery.name}</p>
                    <p className="text-xs text-gray-500">{inquery.email}</p>
                </div>
            )
        },
        { header: 'Phone', key: 'phone' },
        { 
            header: 'For', 
            key: 'inquery_for',
            render: (inquery) => (
                <span className="capitalize">{inquery.inquery_for}</span>
            )
        },
        {
            header: 'Status',
            key: 'status',
            render: (inquery) => (
                <button 
                    onClick={() => toggleStatus(inquery)}
                    disabled={!hasPermission('edit inqueries')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        inquery.status 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${!hasPermission('edit inqueries') && 'opacity-50 cursor-not-allowed'}`}
                >
                    {inquery.status ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {inquery.status ? 'Active' : 'Inactive'}
                </button>
            )
        },
        {
            header: 'Actions',
            key: 'actions',
            render: (inquery) => (
                <div className="flex items-center gap-2">
                    {hasPermission('edit inqueries') && (
                        <button 
                            onClick={() => openForm(inquery)}
                            className="p-1.5 text-brand-primary hover:bg-brand-light rounded transition-colors"
                            title="Edit Inquery"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {hasPermission('delete inqueries') && (
                        <button 
                            onClick={() => handleDelete(inquery.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Inquery"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    if (!hasPermission('view inqueries')) {
        return <div className="p-8 text-center text-gray-500">You do not have permission to view this page.</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex justify-end items-center gap-4 w-full">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search inqueries..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-0">
                    <DataTable 
                        columns={columns}
                        data={inqueries}
                        loading={loading}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        keyExtractor={(inquery) => inquery.id}
                    />
                </div>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Inquery</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input 
                                        type="text" required
                                        value={currentInquery.name}
                                        onChange={(e) => setCurrentInquery({ ...currentInquery, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input 
                                        type="email" required
                                        value={currentInquery.email}
                                        onChange={(e) => setCurrentInquery({ ...currentInquery, email: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input 
                                        type="text" required
                                        value={currentInquery.phone}
                                        onChange={(e) => setCurrentInquery({ ...currentInquery, phone: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Inquery For</label>
                                    <select
                                        value={currentInquery.inquery_for}
                                        onChange={(e) => setCurrentInquery({ ...currentInquery, inquery_for: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                                        required
                                    >
                                        <option value="blackhoof">Blackhoof</option>
                                        <option value="satkirti">Satkirti</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea 
                                    rows="4"
                                    value={currentInquery.message || ''}
                                    onChange={(e) => setCurrentInquery({ ...currentInquery, message: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="status"
                                            checked={currentInquery.status == 1}
                                            onChange={() => setCurrentInquery({ ...currentInquery, status: 1 })}
                                            className="w-4 h-4 text-brand-primary focus:ring-brand-primary"
                                        />
                                        <span>Active</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="status"
                                            checked={currentInquery.status == 0}
                                            onChange={() => setCurrentInquery({ ...currentInquery, status: 0 })}
                                            className="w-4 h-4 text-brand-primary focus:ring-brand-primary"
                                        />
                                        <span>Inactive</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                                <button 
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
