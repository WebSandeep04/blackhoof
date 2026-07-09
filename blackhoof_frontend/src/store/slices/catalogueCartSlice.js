import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchCartAsync = createAsyncThunk(
    'catalogueCart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/cart');
            return {
                items: response.data.cart.products || [],
                cartName: response.data.cart.name,
                editingCatalogueId: response.data.cart.editing_catalogue_id
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch cart');
        }
    }
);

export const addToCartAsync = createAsyncThunk(
    'catalogueCart/addToCart',
    async (product, { rejectWithValue }) => {
        try {
            await api.post('/cart/add', { product_id: product.id });
            return product;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to add to cart');
        }
    }
);

export const removeFromCartAsync = createAsyncThunk(
    'catalogueCart/removeFromCart',
    async (productId, { rejectWithValue }) => {
        try {
            await api.post('/cart/remove', { product_id: productId });
            return productId;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to remove from cart');
        }
    }
);

export const clearCartAsync = createAsyncThunk(
    'catalogueCart/clearCart',
    async (_, { rejectWithValue }) => {
        try {
            await api.post('/cart/clear');
            return true;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to clear cart');
        }
    }
);

const initialState = {
    cartItems: [],
    cartName: null,
    editingCatalogueId: null,
    loading: false,
    error: null,
};

const catalogueCartSlice = createSlice({
    name: 'catalogueCart',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Cart
            .addCase(fetchCartAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCartAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.cartItems = action.payload.items;
                state.cartName = action.payload.cartName;
                state.editingCatalogueId = action.payload.editingCatalogueId;
            })
            .addCase(fetchCartAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Add to Cart
            .addCase(addToCartAsync.fulfilled, (state, action) => {
                const product = action.payload;
                const exists = state.cartItems.find(item => item.id === product.id);
                if (!exists) {
                    state.cartItems.push(product);
                }
            })
            // Remove from Cart
            .addCase(removeFromCartAsync.fulfilled, (state, action) => {
                state.cartItems = state.cartItems.filter(item => item.id !== action.payload);
            })
            // Clear Cart
            .addCase(clearCartAsync.fulfilled, (state) => {
                state.cartItems = [];
                state.cartName = null;
                state.editingCatalogueId = null;
            });
    }
});

export default catalogueCartSlice.reducer;
