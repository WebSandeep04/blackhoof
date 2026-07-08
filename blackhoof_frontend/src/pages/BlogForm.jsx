import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createBlog, updateBlog } from '../store/slices/blogsSlice';
import { fetchBlogCategories } from '../store/slices/blogCategoriesSlice';
import { ChevronLeft, Image as ImageIcon, X } from 'lucide-react';
import api from '../api/axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Swal from 'sweetalert2';

export default function BlogForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [status, setStatus] = useState(1);
    const [featuredImage, setFeaturedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(id ? true : false);

    const { categories } = useSelector(state => state.blogCategories);

    useEffect(() => {
        dispatch(fetchBlogCategories({ page: 1, search: '' })); // Fetch categories for the dropdown
        
        if (id) {
            fetchBlog(id);
        }
    }, [id, dispatch]);

    const fetchBlog = async (blogId) => {
        try {
            const response = await api.get(`/blogs/${blogId}`);
            const blog = response.data;
            setTitle(blog.title);
            setContent(blog.content || '');
            setCategoryId(blog.blog_category_id);
            setStatus(blog.status);
            if (blog.featured_image) {
                setImagePreview(`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${blog.featured_image}`);
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching blog:", error);
            setIsLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFeaturedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setFeaturedImage(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!categoryId) {
            Swal.fire({
                title: 'Error!',
                text: 'Please select a blog category.',
                icon: 'error',
                confirmButtonColor: '#2bb69a'
            });
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('blog_category_id', categoryId);
        formData.append('status', status ? 1 : 0);
        
        if (featuredImage) {
            formData.append('featured_image', featuredImage);
        }

        try {
            if (id) {
                await dispatch(updateBlog({ id, formData })).unwrap();
            } else {
                await dispatch(createBlog(formData)).unwrap();
            }
            
            Swal.fire({
                title: 'Success!',
                text: `Blog post ${id ? 'updated' : 'created'} successfully.`,
                icon: 'success',
                confirmButtonColor: '#2bb69a',
                timer: 1500
            });
            navigate('/admin/blogs');
        } catch (error) {
            console.error("Error saving blog:", error);
            Swal.fire({
                title: 'Error!',
                text: typeof error === 'string' ? error : 'There was an error saving the blog.',
                icon: 'error',
                confirmButtonColor: '#2bb69a'
            });
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/admin/blogs" className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit Blog Post' : 'Create New Blog Post'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Post Title *</label>
                            <input 
                                type="text" required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a catchy title..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-lg font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                            <div className="bg-white rounded-lg border overflow-hidden">
                                <ReactQuill 
                                    theme="snow" 
                                    value={content} 
                                    onChange={setContent} 
                                    modules={modules}
                                    className="h-96"
                                    placeholder="Write your blog post here..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <div className="flex gap-4">
                                <label className="flex-1 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="status" 
                                        className="peer sr-only"
                                        checked={status === 1}
                                        onChange={() => setStatus(1)}
                                    />
                                    <div className="px-4 py-3 rounded-lg border-2 border-gray-100 peer-checked:border-brand-primary peer-checked:bg-brand-light/20 text-center font-medium text-gray-600 peer-checked:text-brand-primary transition-all">
                                        Published
                                    </div>
                                </label>
                                <label className="flex-1 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="status" 
                                        className="peer sr-only"
                                        checked={status === 0}
                                        onChange={() => setStatus(0)}
                                    />
                                    <div className="px-4 py-3 rounded-lg border-2 border-gray-100 peer-checked:border-amber-500 peer-checked:bg-amber-50 text-center font-medium text-gray-600 peer-checked:text-amber-700 transition-all">
                                        Draft
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <select 
                                required
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all"
                            >
                                <option value="">Select a category...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl relative hover:bg-gray-50 transition-colors">
                                {imagePreview ? (
                                    <div className="relative w-full h-48">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                        <button 
                                            type="button" 
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-sm"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-1 text-center">
                                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <label className="relative cursor-pointer rounded-md font-medium text-brand-primary hover:text-brand-hover focus-within:outline-none">
                                                <span>Upload a file</span>
                                                <input type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-hover transition shadow-sm disabled:opacity-75 disabled:cursor-wait flex items-center justify-center gap-2"
                            >
                                {isSubmitting && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                {isSubmitting ? 'Saving...' : 'Save Blog Post'}
                            </button>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}
