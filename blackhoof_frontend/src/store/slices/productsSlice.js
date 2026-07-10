import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchProducts = createAsyncThunk('products/fetchAll', async ({ page = 1, search = '', filters = {} } = {}, { rejectWithValue }) => {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        if (search) queryParams.append('search', search);
        
        // Append all active filters
        Object.keys(filters).forEach(key => {
            if (filters[key] !== '' && filters[key] !== null) {
                queryParams.append(key, filters[key]);
            }
        });

        const response = await api.get(`/products?${queryParams.toString()}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to fetch products');
    }
});

export const fetchProduct = createAsyncThunk('products/fetchOne', async (id, { rejectWithValue }) => {
    try {
        const response = await api.get(`/products/${id}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to fetch product');
    }
});

export const createProduct = createAsyncThunk('products/create', async (formData, { rejectWithValue }) => {
    try {
        const response = await api.post('/products', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data; 
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to create product');
    }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, formData }, { rejectWithValue }) => {
    try {
        // Laravel needs POST with _method=PUT to handle multipart form data correctly
        formData.append('_method', 'PUT');
        const response = await api.post(`/products/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to update product');
    }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/products/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to delete product');
    }
});

const initialState = {
    products: [],
    currentProduct: null,
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0
    },
    loading: false,
    error: null,
};

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearCurrentProduct: (state) => {
            state.currentProduct = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch products
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch one product
            .addCase(fetchProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.currentProduct = action.payload;
            })
            .addCase(fetchProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create product
            .addCase(createProduct.fulfilled, (state, action) => {
                state.products.unshift(action.payload);
            })
            // Update product
            .addCase(updateProduct.fulfilled, (state, action) => {
                const index = state.products.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.products[index] = action.payload;
                }
            })
            // Delete product
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.products = state.products.filter(p => p.id !== action.payload);
            });
    }
});

export const { clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
