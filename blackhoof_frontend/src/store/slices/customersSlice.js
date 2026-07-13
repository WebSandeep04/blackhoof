import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchCustomers = createAsyncThunk(
    'customers/fetchCustomers',
    async ({ page = 1, search = '', all = false } = {}, { rejectWithValue }) => {
        try {
            const url = all 
                ? `/customers?all=true`
                : `/customers?page=${page}&search=${search}`;
            const response = await api.get(url);
            return {
                data: all ? response.data : response.data.data,
                pagination: all ? null : {
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    total: response.data.total,
                    per_page: response.data.per_page
                },
                all
            };
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const createCustomer = createAsyncThunk(
    'customers/createCustomer',
    async (customerData, { rejectWithValue }) => {
        try {
            const response = await api.post('/customers', customerData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const updateCustomer = createAsyncThunk(
    'customers/updateCustomer',
    async ({ id, customerData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/customers/${id}`, customerData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const deleteCustomer = createAsyncThunk(
    'customers/deleteCustomer',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/customers/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const initialState = {
    customers: [],
    allCustomers: [],
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10
    },
    loading: false,
    error: null,
};

const customersSlice = createSlice({
    name: 'customers',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchCustomers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCustomers.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.all) {
                    state.allCustomers = action.payload.data;
                } else {
                    state.customers = action.payload.data;
                    state.pagination = action.payload.pagination;
                }
            })
            .addCase(fetchCustomers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create
            .addCase(createCustomer.fulfilled, (state, action) => {
                state.customers.unshift(action.payload);
            })
            // Update
            .addCase(updateCustomer.fulfilled, (state, action) => {
                const index = state.customers.findIndex(c => c.id === action.payload.id);
                if (index !== -1) {
                    state.customers[index] = action.payload;
                }
            })
            // Delete
            .addCase(deleteCustomer.fulfilled, (state, action) => {
                state.customers = state.customers.filter(c => c.id !== action.payload);
            });
    }
});

export default customersSlice.reducer;
