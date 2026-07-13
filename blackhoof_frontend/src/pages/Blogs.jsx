import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBlogs, deleteBlog } from '../store/slices/blogsSlice';
import { Edit2, Trash2, Plus, Search, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';

export default function Blogs() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { blogs, pagination, loading: blogsLoading } = useSelector(state => state.blogs);
    const { user: authUser } = useSelector(state => state.auth);
    const loading = blogsLoading;
    
    const hasPermission = (permission) => authUser?.permissions?.includes(permission);

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchBlogs({ page, search: searchQuery }));
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
                await dispatch(deleteBlog(id)).unwrap();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The blog post has been deleted.',
                    icon: 'success',
                    confirmButtonColor: '#2bb69a',
                    timer: 1500
                });
            } catch (error) {
                console.error("Error deleting blog:", error);
                Swal.fire({
                    title: 'Error!',
                    text: 'There was a problem deleting the blog post.',
                    icon: 'error',
                    confirmButtonColor: '#2bb69a'
                });
            }
        }
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
                        placeholder="Search blogs..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                    />
                </div>
                {hasPermission('create blogs') && (
                    <Link 
                        to="/admin/blogs/create"
                        className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm"
                        title="New Blog"
                    >
                        <Plus className="w-5 h-5" />
                    </Link>
                )}
            </div>

            <DataTable 
                columns={[
                    { 
                        header: 'Image', 
                        key: 'image',
                        render: (blog) => {
                            const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '');
                            return blog.featured_image ? 
                            <img src={`${baseUrl}/${blog.featured_image}`} alt={blog.title} className="w-12 h-12 object-cover rounded shadow-sm" /> :
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 shadow-sm"><ImageIcon className="w-5 h-5" /></div>
                        }
                    },
                    { 
                        header: 'Title', 
                        key: 'title',
                        render: (blog) => (
                            <div>
                                <div className="font-medium text-gray-900">{blog.title}</div>
                                <div className="text-xs text-gray-500 mt-1">{blog.slug}</div>
                            </div>
                        )
                    },
                    { 
                        header: 'Category', 
                        key: 'category',
                        render: (blog) => <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-sm">{blog.category?.name || 'Uncategorized'}</span>
                    },
                    { 
                        header: 'Status', 
                        key: 'status',
                        render: (blog) => (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${blog.status ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {blog.status ? 'Published' : 'Draft'}
                            </span>
                        )
                    },
                    {
                        header: 'Actions',
                        key: 'actions',
                        className: 'text-right',
                        cellClassName: 'text-right space-x-3',
                        render: (blog) => (
                            <>
                                {hasPermission('edit blogs') && (
                                    <button onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)} className="text-brand-primary hover:text-brand-hover" title="Edit Blog"><Edit2 className="w-4 h-4 inline" /></button>
                                )}
                                {hasPermission('delete blogs') && (
                                    <button onClick={() => handleDelete(blog.id)} className="text-red-600 hover:text-red-900" title="Delete Blog"><Trash2 className="w-4 h-4 inline" /></button>
                                )}
                            </>
                        )
                    }
                ]} 
                data={blogs} 
                keyExtractor={(blog) => blog.id} 
                emptyMessage="No blog posts found."
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
            />
        </div>
    );
}
