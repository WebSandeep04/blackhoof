import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchUsers = createAsyncThunk('users/fetchAll', async ({ page = 1, search = '' } = {}, { rejectWithValue }) => {
    try {
        const response = await api.get(`/users?page=${page}&search=${search}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to fetch users');
    }
});

export const createUser = createAsyncThunk('users/create', async (userData, { rejectWithValue }) => {
    try {
        const response = await api.post('/users', userData);
        return response.data; // Assuming API returns the created user
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to create user');
    }
});

export const updateUser = createAsyncThunk('users/update', async ({ id, userData }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/users/${id}`, userData);
        return response.data; // Assuming API returns the updated user
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to update user');
    }
});

export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/users/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to delete user');
    }
});

const initialState = {
    users: [],
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0
    },
    loading: false,
    error: null,
};

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch users
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create user
            .addCase(createUser.fulfilled, (state, action) => {
                // If API doesn't return the full user, we might need to rely on refetching. 
                // But typically it returns the created resource.
                state.users.push(action.payload);
            })
            // Update user
            .addCase(updateUser.fulfilled, (state, action) => {
                const index = state.users.findIndex(u => u.id === action.payload.id);
                if (index !== -1) {
                    state.users[index] = action.payload;
                }
            })
            // Delete user
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter(u => u.id !== action.payload);
            });
    }
});

export default usersSlice.reducer;
