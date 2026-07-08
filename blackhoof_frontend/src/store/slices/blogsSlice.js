import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchBlogs = createAsyncThunk(
    'blogs/fetchAll',
    async ({ page = 1, search = '' } = {}, { rejectWithValue }) => {
        try {
            const response = await api.get(`/blogs?page=${page}&search=${search}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch blogs');
        }
    }
);

export const createBlog = createAsyncThunk(
    'blogs/create',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await api.post('/blogs', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to create blog');
        }
    }
);

export const updateBlog = createAsyncThunk(
    'blogs/update',
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            // In Laravel, PUT with multipart/form-data requires method spoofing
            formData.append('_method', 'PUT');
            const response = await api.post(`/blogs/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to update blog');
        }
    }
);

export const deleteBlog = createAsyncThunk(
    'blogs/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/blogs/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to delete blog');
        }
    }
);

const initialState = {
    blogs: [],
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10
    },
    loading: false,
    error: null,
};

const blogsSlice = createSlice({
    name: 'blogs',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchBlogs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBlogs.fulfilled, (state, action) => {
                state.loading = false;
                state.blogs = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    total: action.payload.total,
                    per_page: action.payload.per_page,
                };
            })
            .addCase(fetchBlogs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create
            .addCase(createBlog.fulfilled, (state, action) => {
                state.blogs.unshift(action.payload);
            })
            // Update
            .addCase(updateBlog.fulfilled, (state, action) => {
                const index = state.blogs.findIndex(b => b.id === action.payload.id);
                if (index !== -1) {
                    state.blogs[index] = action.payload;
                }
            })
            // Delete
            .addCase(deleteBlog.fulfilled, (state, action) => {
                state.blogs = state.blogs.filter(b => b.id !== action.payload);
            });
    }
});

export default blogsSlice.reducer;
