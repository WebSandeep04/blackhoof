import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTestimonials, deleteTestimonial } from '../store/slices/testimonialsSlice';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import DataTable from '../components/DataTable';

export default function Testimonials() {
    const dispatch = useDispatch();
    const { testimonials, pagination, loading } = useSelector((state) => state.testimonials);
    const { user } = useSelector((state) => state.auth);

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const hasPermission = (permission) => {
        return user?.permissions?.includes(permission);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchTestimonials({ page, search: searchQuery, start_date: startDate, end_date: endDate }));
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, startDate, endDate, page, dispatch]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2bb69a',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                dispatch(deleteTestimonial(id))
                    .unwrap()
                    .then(() => {
                        Swal.fire('Deleted!', 'Testimonial has been deleted.', 'success');
                        dispatch(fetchTestimonials({ page, search: searchQuery }));
                    })
                    .catch((error) => {
                        Swal.fire('Error!', error.message || 'Failed to delete testimonial.', 'error');
                    });
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center flex-wrap gap-4">
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
                        placeholder="Search testimonials..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                    />
                </div>
                {hasPermission('create testimonials') && (
                    <Link to="/admin/testimonials/create" className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm shrink-0" title="Add Testimonial">
                        <Plus className="w-5 h-5" />
                    </Link>
                )}
            </div>

            <DataTable 
                columns={[
                    { header: 'Given By', key: 'given_by' },
                    { 
                        header: 'Rating', 
                        key: 'rating', 
                        render: (testimonial) => (
                            <div className="flex items-center text-brand-primary">
                                {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}
                            </div>
                        )
                    },
                    {
                        header: 'Status',
                        key: 'is_active',
                        render: (testimonial) => (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${testimonial.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {testimonial.is_active ? 'Active' : 'Inactive'}
                            </span>
                        )
                    },
                    {
                        header: 'Actions',
                        key: 'actions',
                        className: 'text-right',
                        cellClassName: 'text-right space-x-3',
                        render: (testimonial) => (
                            <>
                                {hasPermission('edit testimonials') && (
                                    <Link to={`/admin/testimonials/edit/${testimonial.id}`} className="text-brand-primary hover:text-brand-hover" title="Edit">
                                        <Edit2 className="w-4 h-4 inline" />
                                    </Link>
                                )}
                                {hasPermission('delete testimonials') && (
                                    <button onClick={() => handleDelete(testimonial.id)} className="text-red-600 hover:text-red-900" title="Delete">
                                        <Trash2 className="w-4 h-4 inline" />
                                    </button>
                                )}
                            </>
                        )
                    }
                ]} 
                data={testimonials} 
                keyExtractor={(testimonial) => testimonial.id} 
                emptyMessage="No testimonials found."
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
            />
        </div>
    );
}
