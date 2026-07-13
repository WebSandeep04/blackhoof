import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchCountries = createAsyncThunk(
    'countries/fetchCountries',
    async ({ page = 1, search = '', all = false } = {}, { rejectWithValue }) => {
        try {
            const url = all 
                ? `/countries?all=true`
                : `/countries?page=${page}&search=${search}`;
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

export const createCountry = createAsyncThunk(
    'countries/createCountry',
    async (countryData, { rejectWithValue }) => {
        try {
            const response = await api.post('/countries', countryData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const updateCountry = createAsyncThunk(
    'countries/updateCountry',
    async ({ id, countryData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/countries/${id}`, countryData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const deleteCountry = createAsyncThunk(
    'countries/deleteCountry',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/countries/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const initialState = {
    countries: [],
    allCountries: [],
    pagination: {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10
    },
    loading: false,
    error: null,
};

const countriesSlice = createSlice({
    name: 'countries',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchCountries.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCountries.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.all) {
                    state.allCountries = action.payload.data;
                } else {
                    state.countries = action.payload.data;
                    state.pagination = action.payload.pagination;
                }
            })
            .addCase(fetchCountries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create
            .addCase(createCountry.fulfilled, (state, action) => {
                state.countries.unshift(action.payload);
            })
            // Update
            .addCase(updateCountry.fulfilled, (state, action) => {
                const index = state.countries.findIndex(c => c.id === action.payload.id);
                if (index !== -1) {
                    state.countries[index] = action.payload;
                }
            })
            // Delete
            .addCase(deleteCountry.fulfilled, (state, action) => {
                state.countries = state.countries.filter(c => c.id !== action.payload);
            });
    }
});

export default countriesSlice.reducer;
