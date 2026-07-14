import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchCartAsync = createAsyncThunk(
    'catalogueCart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/cart');
            return {
                items: (response.data.cart.products || []).map(p => ({
                    ...p,
                    cart_variant_id: p.pivot?.product_variant_id || null
                })),
                cartName: response.data.cart.name,
                cartShowPrice: response.data.cart.show_price !== undefined ? response.data.cart.show_price : true,
                editingCatalogueId: response.data.cart.editing_catalogue_id,
                cartCustomerId: response.data.cart.customer_id
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
    cartName: null,
    cartShowPrice: true,
    editingCatalogueId: null,
    cartCustomerId: null,
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
                state.cartShowPrice = action.payload.cartShowPrice;
                state.editingCatalogueId = action.payload.editingCatalogueId;
                state.cartCustomerId = action.payload.cartCustomerId;
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
                state.cartName = null;
                state.cartShowPrice = true;
                state.editingCatalogueId = null;
                state.cartCustomerId = null;
            });
    }
});

export default catalogueCartSlice.reducer;
