import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchCategories = createAsyncThunk('categories/fetchAll', async ({ page = 1, search = '', all = false } = {}, { rejectWithValue }) => {
    try {
        const queryParams = new URLSearchParams();
        if (all) {
            queryParams.append('all', 'true');
        } else {
            queryParams.append('page', page);
            if (search) queryParams.append('search', search);
        }
        
        const response = await api.get(`/categories?${queryParams.toString()}`);
        return { data: response.data, all };
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to fetch categories');
    }
});

export const createCategory = createAsyncThunk('categories/create', async (categoryData, { rejectWithValue }) => {
    try {
        const response = await api.post('/categories', categoryData);
        return response.data; 
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to create category');
    }
});

export const updateCategory = createAsyncThunk('categories/update', async ({ id, categoryData }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/categories/${id}`, categoryData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to update category');
    }
});

export const deleteCategory = createAsyncThunk('categories/delete', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/categories/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to delete category');
    }
});

const initialState = {
    categories: [],
    flatCategories: [], // For dropdowns
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0
    },
    loading: false,
    error: null,
};

const categoriesSlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch categories
            .addCase(fetchCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.all) {
                    state.flatCategories = action.payload.data;
                } else {
                    state.categories = action.payload.data.data;
                    state.pagination = {
                        current_page: action.payload.data.current_page,
                        last_page: action.payload.data.last_page,
                        total: action.payload.data.total,
                    };
                }
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create category
            .addCase(createCategory.fulfilled, (state, action) => {
                // To keep it simple, we don't automatically insert since it might break pagination ordering,
                // but we can just push it and rely on a refetch to organize things properly.
                state.categories.unshift(action.payload);
            })
            // Update category
            .addCase(updateCategory.fulfilled, (state, action) => {
                const index = state.categories.findIndex(c => c.id === action.payload.id);
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
            })
            // Delete category
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter(c => c.id !== action.payload);
            });
    }
});

export default categoriesSlice.reducer;
