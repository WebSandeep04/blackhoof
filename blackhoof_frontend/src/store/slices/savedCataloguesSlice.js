import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchSavedCatalogues = createAsyncThunk(
    'savedCatalogues/fetchAll',
    async ({ page = 1, search = '', country_id = '' } = {}, { rejectWithValue }) => {
        try {
            const response = await api.get(`/catalogues?page=${page}&search=${search}&customer_id=${country_id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch catalogues');
        }
    }
);

export const deleteSavedCatalogue = createAsyncThunk(
    'savedCatalogues/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/catalogues/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to delete catalogue');
        }
    }
);

export const saveNewVersionAsync = createAsyncThunk(
    'savedCatalogues/saveNewVersion',
    async ({ id, products }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/catalogues/${id}/versions`, { products });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to save new version');
        }
    }
);

export const fetchCatalogueVersion = createAsyncThunk(
    'savedCatalogues/fetchVersion',
    async ({ catalogueId, versionId }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/catalogues/${catalogueId}/versions/${versionId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch version');
        }
    }
);

export const fetchCatalogueVersions = createAsyncThunk(
    'savedCatalogues/fetchVersions',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/catalogues/${id}/versions`);
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
            });
    }
});

export default savedCataloguesSlice.reducer;
