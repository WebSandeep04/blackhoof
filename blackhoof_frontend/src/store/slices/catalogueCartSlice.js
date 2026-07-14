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

const loadEditingState = () => {
    try {
        const stored = localStorage.getItem('cartEditingState');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};
const storedEditingState = loadEditingState();

const initialState = {
    cartItems: [],
    editingCatalogueId: storedEditingState?.editingCatalogueId || null,
    cartName: storedEditingState?.cartName || null,
    cartCustomerId: storedEditingState?.cartCustomerId || null,
    cartShowPrice: storedEditingState?.cartShowPrice ?? true,
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
            state.cartShowPrice = action.payload.showPrice ?? true;
            localStorage.setItem('cartEditingState', JSON.stringify({
                editingCatalogueId: action.payload.id,
                cartName: action.payload.name,
                cartCustomerId: action.payload.customerId,
                cartShowPrice: action.payload.showPrice ?? true
            }));
        },
        setCartShowPrice: (state, action) => {
            state.cartShowPrice = action.payload;
            const stored = localStorage.getItem('cartEditingState');
            if (stored) {
                const parsed = JSON.parse(stored);
                parsed.cartShowPrice = action.payload;
                localStorage.setItem('cartEditingState', JSON.stringify(parsed));
            } else {
                localStorage.setItem('cartEditingState', JSON.stringify({ cartShowPrice: action.payload }));
            }
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
                state.cartShowPrice = true;
                localStorage.removeItem('cartEditingState');
            });
    }
});

export const { setEditingCatalogue, setCartShowPrice } = catalogueCartSlice.actions;
export default catalogueCartSlice.reducer;
