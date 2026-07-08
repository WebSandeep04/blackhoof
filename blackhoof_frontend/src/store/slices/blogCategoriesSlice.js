import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchBlogCategories = createAsyncThunk(
    'blogCategories/fetchAll',
    async ({ page = 1, search = '' } = {}, { rejectWithValue }) => {
        try {
            const response = await api.get(`/blog-categories?page=${page}&search=${search}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch blog categories');
        }
    }
);

export const createBlogCategory = createAsyncThunk(
    'blogCategories/create',
    async (categoryData, { rejectWithValue }) => {
        try {
            const response = await api.post('/blog-categories', categoryData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to create blog category');
        }
    }
);

export const updateBlogCategory = createAsyncThunk(
    'blogCategories/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/blog-categories/${id}`, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to update blog category');
        }
    }
);

export const deleteBlogCategory = createAsyncThunk(
    'blogCategories/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/blog-categories/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to delete blog category');
        }
    }
);

const initialState = {
    categories: [],
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10
    },
    loading: false,
    error: null,
};

const blogCategoriesSlice = createSlice({
    name: 'blogCategories',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchBlogCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBlogCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    total: action.payload.total,
                    per_page: action.payload.per_page,
                };
            })
            .addCase(fetchBlogCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create
            .addCase(createBlogCategory.fulfilled, (state, action) => {
                state.categories.unshift(action.payload);
            })
            // Update
            .addCase(updateBlogCategory.fulfilled, (state, action) => {
                const index = state.categories.findIndex(c => c.id === action.payload.id);
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
            })
            // Delete
            .addCase(deleteBlogCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter(c => c.id !== action.payload);
            });
    }
});

export default blogCategoriesSlice.reducer;
