import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '../store/slices/customersSlice';
import { fetchCountries } from '../store/slices/countriesSlice';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';

export default function Customers() {
    const dispatch = useDispatch();
    const { customers, pagination, loading: customersLoading } = useSelector(state => state.customers);
    const { allCountries, loading: countriesLoading } = useSelector(state => state.countries);
    const { user: authUser } = useSelector(state => state.auth);
    
    const loading = customersLoading || countriesLoading;
    const hasPermission = (permission) => authUser?.permissions?.includes(permission);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [currentCustomer, setCurrentCustomer] = useState({ id: null, name: '', email: '', phone: '', country_id: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchCustomers({ page, search: searchQuery }));
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, page, dispatch]);

    useEffect(() => {
        dispatch(fetchCountries({ all: true }));
    }, [dispatch]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (currentCustomer.id) {
                await dispatch(updateCustomer({ id: currentCustomer.id, customerData: currentCustomer })).unwrap();
            } else {
                await dispatch(createCustomer(currentCustomer)).unwrap();
            }
            setIsSubmitting(false);
            setIsFormOpen(false);
            dispatch(fetchCustomers());
            Swal.fire({
                title: 'Success!',
                text: 'Customer saved successfully.',
                icon: 'success',
                confirmButtonColor: '#2bb69a',
                timer: 1500
            });
        } catch (error) {
            setIsSubmitting(false);
            console.error("Error saving customer:", error);
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Error saving customer. Please check the form data.',
                icon: 'error',
                confirmButtonColor: '#2bb69a'
            });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2bb69a',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await dispatch(deleteCustomer(id)).unwrap();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The customer has been deleted.',
                    icon: 'success',
                    confirmButtonColor: '#2bb69a',
                    timer: 1500
                });
            } catch (error) {
                console.error("Error deleting customer:", error);
                Swal.fire({
                    title: 'Error!',
                    text: error.message || 'There was a problem deleting the customer.',
                    icon: 'error',
                    confirmButtonColor: '#2bb69a'
                });
            }
        }
    };

    const openForm = (customer = { id: null, name: '', email: '', phone: '', country_id: '' }) => {
        setCurrentCustomer({ ...customer, country_id: customer.country_id || '' });
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
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                    />
                </div>
                {hasPermission('create customers') && (
                    <button 
                        onClick={() => openForm()}
                        className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm"
                        title="Add Customer"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">{currentCustomer.id ? 'Edit' : 'Create'} Customer</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input 
                                        type="text" required
                                        value={currentCustomer.name}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input 
                                        type="email"
                                        value={currentCustomer.email}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input 
                                        type="text"
                                        value={currentCustomer.phone}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                    <select
                                        value={currentCustomer.country_id}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, country_id: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                                        required
                                    >
                                        <option value="">Select a country</option>
                                        {allCountries.map(country => (
                                            <option key={country.id} value={country.id}>{country.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="px-5 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition font-medium flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed">
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {isSubmitting ? 'Saving...' : 'Save Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DataTable 
                columns={[
                    { header: 'Name', key: 'name' },
                    { header: 'Email', key: 'email' },
                    { header: 'Phone', key: 'phone' },
                    { 
                        header: 'Country', 
                        key: 'country', 
                        render: (customer) => (
                            <span className="text-black">
                                {customer.country?.name || '-'}
                            </span>
                        )
                    },
                    {
                        header: 'Actions',
                        key: 'actions',
                        className: 'text-right',
                        cellClassName: 'text-right space-x-3',
                        render: (customer) => (
                            <>
                                {hasPermission('edit customers') && (
                                    <button onClick={() => openForm(customer)} className="text-brand-primary hover:text-brand-hover" title="Edit Customer"><Edit2 className="w-4 h-4 inline" /></button>
                                )}
                                {hasPermission('delete customers') && (
                                    <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900" title="Delete Customer"><Trash2 className="w-4 h-4 inline" /></button>
                                )}
                            </>
                        )
                    }
                ]} 
                data={customers} 
                keyExtractor={(customer) => customer.id} 
                emptyMessage="No customers found."
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
            />
        </div>
    );
}
