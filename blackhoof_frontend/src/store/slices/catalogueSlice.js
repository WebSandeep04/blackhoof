import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Fetch catalogue items
export const fetchCatalogue = createAsyncThunk(
    'catalogue/fetchCatalogue',
    async (params, { rejectWithValue }) => {
        try {
            const response = await api.get('/catalogue', { params });
            return response.data; // Usually paginate response contains .data for items and .meta for pagination
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch catalogue');
        }
    }
);

const initialState = {
    items: [],
    loading: false,
    error: null,
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0
    }
};

const catalogueSlice = createSlice({
    name: 'catalogue',
    initialState,
    reducers: {
        clearCatalogueError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCatalogue.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCatalogue.fulfilled, (state, action) => {
                state.loading = false;
                // Assuming Laravel paginated response structure
                state.items = action.payload.data || [];
                state.pagination = {
                    current_page: action.payload.current_page || 1,
                    last_page: action.payload.last_page || 1,
                    total: action.payload.total || 0,
                };
            })
            .addCase(fetchCatalogue.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearCatalogueError } = catalogueSlice.actions;
export default catalogueSlice.reducer;
