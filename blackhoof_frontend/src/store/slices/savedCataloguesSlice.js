import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchSavedCatalogues = createAsyncThunk(
    'savedCatalogues/fetchAll',
    async ({ page = 1, search = '', country_id = '' } = {}, { rejectWithValue }) => {
        try {
            // Need to pass page to api
            const response = await api.get(`/saved-catalogues?page=${page}&search=${search}&country_id=${country_id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch saved catalogues');
        }
    }
);

export const deleteSavedCatalogue = createAsyncThunk(
    'savedCatalogues/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/saved-catalogues/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to delete saved catalogue');
        }
    }
);

export const updateSavedCatalogue = createAsyncThunk(
    'savedCatalogues/update',
    async ({ id, product_ids }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/saved-catalogues/${id}`, { product_ids });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to update saved catalogue');
        }
    }
);

export const fetchCatalogueVersions = createAsyncThunk(
    'savedCatalogues/fetchVersions',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/saved-catalogues/${id}/versions`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch catalogue versions');
        }
    }
);

const initialState = {
    catalogues: [],
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10
    },
    loading: false,
    error: null,
};

const savedCataloguesSlice = createSlice({
    name: 'savedCatalogues',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchSavedCatalogues.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSavedCatalogues.fulfilled, (state, action) => {
                state.loading = false;
                state.catalogues = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    total: action.payload.total,
                    per_page: action.payload.per_page,
                };
            })
            .addCase(fetchSavedCatalogues.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete
            .addCase(deleteSavedCatalogue.fulfilled, (state, action) => {
                state.catalogues = state.catalogues.filter(c => c.id !== action.payload);
            })
            // Update
            .addCase(updateSavedCatalogue.fulfilled, (state, action) => {
                const index = state.catalogues.findIndex(c => c.id === action.payload.catalogue.id);
                if (index !== -1) {
                    state.catalogues[index] = action.payload.catalogue;
                }
            });
    }
});

export default savedCataloguesSlice.reducer;
