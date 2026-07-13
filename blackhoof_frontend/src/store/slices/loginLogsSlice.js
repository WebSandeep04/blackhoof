import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchLoginLogs = createAsyncThunk('loginLogs/fetchAll', async (params = { page: 1, search: '', start_date: '', end_date: '' }, { rejectWithValue }) => {
    try {
        const response = await api.get('/login-logs', { params });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch login logs');
    }
});

const loginLogsSlice = createSlice({
    name: 'loginLogs',
    initialState: {
        logs: [],
        pagination: {
            current_page: 1,
            last_page: 1,
            total: 0,
            per_page: 10
        },
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchLoginLogs.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchLoginLogs.fulfilled, (state, action) => {
                state.loading = false;
                state.logs = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    total: action.payload.total,
                    per_page: action.payload.per_page
                };
                state.error = null;
            })
            .addCase(fetchLoginLogs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default loginLogsSlice.reducer;
