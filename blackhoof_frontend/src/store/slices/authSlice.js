import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Thunks
export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/user');
        return response.data;
    } catch (error) {
        localStorage.removeItem('token');
        return rejectWithValue(error.response?.data || 'Failed to authenticate');
    }
});

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const response = await api.post('/login', credentials);
        const { access_token, user } = response.data;
        localStorage.setItem('token', access_token);
        return { token: access_token, user };
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Login failed');
    }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
    try {
        await api.post('/logout');
        localStorage.removeItem('token');
        return null;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Logout failed');
    }
});

const initialState = {
    user: null,
    token: localStorage.getItem('token') || null,
    loading: true,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // checkAuth
            .addCase(checkAuth.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(checkAuth.rejected, (state, action) => {
                state.loading = false;
                state.user = null;
                state.token = null;
                state.error = action.payload;
            })
            // loginUser
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // logoutUser
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.token = null;
            });
    }
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
