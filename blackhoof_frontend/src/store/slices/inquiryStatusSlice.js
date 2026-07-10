import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchInquiryStatuses = createAsyncThunk('inquiryStatuses/fetchAll', async ({ page = 1, search = '', all = false } = {}, { rejectWithValue }) => {
    try {
        const response = await api.get(`/inquiry_statuses?page=${page}&search=${search}${all ? '&all=true' : ''}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to fetch inquiry statuses');
    }
});

export const createInquiryStatus = createAsyncThunk('inquiryStatuses/create', async (statusData, { rejectWithValue }) => {
    try {
        const response = await api.post('/inquiry_statuses', statusData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to create inquiry status');
    }
});

export const updateInquiryStatus = createAsyncThunk('inquiryStatuses/update', async ({ id, statusData }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/inquiry_statuses/${id}`, statusData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to update inquiry status');
    }
});

export const deleteInquiryStatus = createAsyncThunk('inquiryStatuses/delete', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/inquiry_statuses/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to delete inquiry status');
    }
});

const initialState = {
    inquiryStatuses: [],
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0
    },
    loading: false,
    error: null,
};

const inquiryStatusSlice = createSlice({
    name: 'inquiryStatuses',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch statuses
            .addCase(fetchInquiryStatuses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInquiryStatuses.fulfilled, (state, action) => {
                state.loading = false;
                if (Array.isArray(action.payload)) {
                    state.inquiryStatuses = action.payload; // When all=true
                } else {
                    state.inquiryStatuses = action.payload.data;
                    state.pagination = {
                        current_page: action.payload.current_page,
                        last_page: action.payload.last_page,
                        total: action.payload.total,
                    };
                }
            })
            .addCase(fetchInquiryStatuses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create status
            .addCase(createInquiryStatus.fulfilled, (state, action) => {
                state.inquiryStatuses.unshift(action.payload);
            })
            // Update status
            .addCase(updateInquiryStatus.fulfilled, (state, action) => {
                const index = state.inquiryStatuses.findIndex(s => s.id === action.payload.id);
                if (index !== -1) {
                    state.inquiryStatuses[index] = action.payload;
                }
            })
            // Delete status
            .addCase(deleteInquiryStatus.fulfilled, (state, action) => {
                state.inquiryStatuses = state.inquiryStatuses.filter(s => s.id !== action.payload);
            });
    }
});

export default inquiryStatusSlice.reducer;
