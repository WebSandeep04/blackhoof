import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchRoles = createAsyncThunk('roles/fetchAll', async ({ page = 1, search = '' } = {}, { rejectWithValue }) => {
    try {
        const response = await api.get(`/roles?page=${page}&search=${search}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to fetch roles');
    }
});

export const fetchPermissions = createAsyncThunk('roles/fetchPermissions', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/permissions');
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to fetch permissions');
    }
});

export const createRole = createAsyncThunk('roles/create', async (roleData, { rejectWithValue }) => {
    try {
        const response = await api.post('/roles', roleData);
        return response.data; 
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to create role');
    }
});

export const updateRole = createAsyncThunk('roles/update', async ({ id, roleData }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/roles/${id}`, roleData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to update role');
    }
});

export const deleteRole = createAsyncThunk('roles/delete', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/roles/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data || 'Failed to delete role');
    }
});

const initialState = {
    roles: [],
    availablePermissions: [],
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0
    },
    loading: false,
    error: null,
};

const rolesSlice = createSlice({
    name: 'roles',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch roles
            .addCase(fetchRoles.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.loading = false;
                state.roles = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchRoles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch permissions
            .addCase(fetchPermissions.fulfilled, (state, action) => {
                state.availablePermissions = action.payload;
            })
            // Create role
            .addCase(createRole.fulfilled, (state, action) => {
                state.roles.push(action.payload);
            })
            // Update role
            .addCase(updateRole.fulfilled, (state, action) => {
                const index = state.roles.findIndex(r => r.id === action.payload.id);
                if (index !== -1) {
                    state.roles[index] = action.payload;
                }
            })
            // Delete role
            .addCase(deleteRole.fulfilled, (state, action) => {
                state.roles = state.roles.filter(r => r.id !== action.payload);
            });
    }
});

export default rolesSlice.reducer;
