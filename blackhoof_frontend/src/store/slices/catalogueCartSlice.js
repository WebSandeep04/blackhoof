import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Removed async thunks

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
        setCartItems: (state, action) => {
            state.cartItems = action.payload;
        },
        addToCart: (state, action) => {
            const { product, variantId } = action.payload;
            const exists = state.cartItems.find(item => item.id === product.id && item.cart_variant_id == variantId);
            if (!exists) {
                state.cartItems.push({ 
                    ...product, 
                    cart_variant_id: variantId || null,
                    sort_order: state.cartItems.length > 0 ? Math.max(...state.cartItems.map(i => i.sort_order || 0)) + 1 : 1
                });
            }
        },
        removeFromCart: (state, action) => {
            const { productId, variantId } = action.payload;
            state.cartItems = state.cartItems.filter(item => !(item.id === productId && item.cart_variant_id == variantId));
        },
        clearCart: (state) => {
            state.cartItems = [];
            state.editingCatalogueId = null;
            state.cartName = null;
            state.cartCustomerId = null;
            state.cartShowPrice = true;
            localStorage.removeItem('cartEditingState');
        },
        reorderCart: (state, action) => {
            state.cartItems = action.payload;
        },
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
    }
});

export const { setCartItems, addToCart, removeFromCart, clearCart, reorderCart, setEditingCatalogue, setCartShowPrice } = catalogueCartSlice.actions;
export default catalogueCartSlice.reducer;
