import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchAttributes = createAsyncThunk('attributes/fetchAll', async ({ page = 1, search = '', all = false } = {}, { rejectWithValue }) => {
    try {
        const queryParams = new URLSearchParams();
        if (all) {
            queryParams.append('all', 'true');
        } else {
            queryParams.append('page', page);
            if (search) queryParams.append('search', search);
        }
        
        const response = await api.get(`/attributes?${queryParams.toString()}`);
        return { data: response.data, all };
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to fetch attributes');
    }
});

export const createAttribute = createAsyncThunk('attributes/create', async (attributeData, { rejectWithValue }) => {
    try {
        const response = await api.post('/attributes', attributeData);
        return response.data; 
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to create attribute');
    }
});

export const updateAttribute = createAsyncThunk('attributes/update', async ({ id, attributeData }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/attributes/${id}`, attributeData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to update attribute');
    }
});

export const deleteAttribute = createAsyncThunk('attributes/delete', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/attributes/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to delete attribute');
    }
});

const initialState = {
    attributes: [],
    flatAttributes: [],
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0
    },
    loading: false,
    error: null,
};

const attributesSlice = createSlice({
    name: 'attributes',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch attributes
            .addCase(fetchAttributes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAttributes.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.all) {
                    state.flatAttributes = action.payload.data;
                } else {
                    state.attributes = action.payload.data.data;
                    state.pagination = {
                        current_page: action.payload.data.current_page,
                        last_page: action.payload.data.last_page,
                        total: action.payload.data.total,
                    };
                }
            })
            .addCase(fetchAttributes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create attribute
            .addCase(createAttribute.fulfilled, (state, action) => {
                state.attributes.unshift(action.payload);
            })
            // Update attribute
            .addCase(updateAttribute.fulfilled, (state, action) => {
                const index = state.attributes.findIndex(a => a.id === action.payload.id);
                if (index !== -1) {
                    state.attributes[index] = action.payload;
                }
            })
            // Delete attribute
            .addCase(deleteAttribute.fulfilled, (state, action) => {
                state.attributes = state.attributes.filter(a => a.id !== action.payload);
            });
    }
});

export default attributesSlice.reducer;
