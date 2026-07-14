import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchCartAsync = createAsyncThunk(
    'catalogueCart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/cart');
            return {
                items: (response.data.cart || []).map(item => ({
                    ...item.product,
                    cart_variant_id: item.product_variant_id || null,
                    sort_order: item.sort_order,
                    cart_item_id: item.id
                }))
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch cart');
        }
    }
);

export const addToCartAsync = createAsyncThunk(
    'catalogueCart/addToCart',
    async ({ product, variantId }, { rejectWithValue }) => {
        try {
            await api.post('/cart/add', { product_id: product.id, product_variant_id: variantId });
            return { product, variantId };
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to add to cart');
        }
    }
);

export const removeFromCartAsync = createAsyncThunk(
    'catalogueCart/removeFromCart',
    async ({ productId, variantId }, { rejectWithValue }) => {
        try {
            await api.post('/cart/remove', { product_id: productId, product_variant_id: variantId });
            return { productId, variantId };
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
    editingCatalogueId: null,
    cartName: null,
    cartCustomerId: null,
    loading: false,
    error: null,
};

const catalogueCartSlice = createSlice({
    name: 'catalogueCart',
    initialState,
    reducers: {
        setEditingCatalogue: (state, action) => {
            state.editingCatalogueId = action.payload.id;
            state.cartName = action.payload.name;
            state.cartCustomerId = action.payload.customerId;
        }
    },
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
            })
            .addCase(fetchCartAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Add to Cart
            .addCase(addToCartAsync.fulfilled, (state, action) => {
                const { product, variantId } = action.payload;
                const exists = state.cartItems.find(item => item.id === product.id && item.cart_variant_id === variantId);
                if (!exists) {
                    state.cartItems.push({ ...product, cart_variant_id: variantId });
                }
            })
            // Remove from Cart
            .addCase(removeFromCartAsync.fulfilled, (state, action) => {
                const { productId, variantId } = action.payload;
                state.cartItems = state.cartItems.filter(item => !(item.id === productId && item.cart_variant_id === variantId));
            })
            // Clear Cart
            .addCase(clearCartAsync.fulfilled, (state) => {
                state.cartItems = [];
                state.editingCatalogueId = null;
                state.cartName = null;
                state.cartCustomerId = null;
            });
    }
});

export const { setEditingCatalogue } = catalogueCartSlice.actions;
export default catalogueCartSlice.reducer;
