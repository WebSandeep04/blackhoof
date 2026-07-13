import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchTestimonials = createAsyncThunk('testimonials/fetchAll', async (params = { page: 1, search: '', start_date: '', end_date: '' }, { rejectWithValue }) => {
    try {
        const response = await api.get('/testimonials', {
            params: {
                page: params.page,
                search: params.search,
                start_date: params.start_date,
                end_date: params.end_date
            }
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch testimonials');
    }
});

export const createTestimonial = createAsyncThunk('testimonials/create', async (testimonialData, { rejectWithValue }) => {
    try {
        const response = await api.post('/testimonials', testimonialData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create testimonial');
    }
});

export const updateTestimonial = createAsyncThunk('testimonials/update', async ({ id, testimonialData }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/testimonials/${id}`, testimonialData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update testimonial');
    }
});

export const deleteTestimonial = createAsyncThunk('testimonials/delete', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/testimonials/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete testimonial');
    }
});

const testimonialsSlice = createSlice({
    name: 'testimonials',
    initialState: {
        testimonials: [],
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
            // Fetch
            .addCase(fetchTestimonials.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchTestimonials.fulfilled, (state, action) => {
                state.loading = false;
                state.testimonials = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    total: action.payload.total,
                    per_page: action.payload.per_page
                };
                state.error = null;
            })
            .addCase(fetchTestimonials.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create
            .addCase(createTestimonial.fulfilled, (state, action) => {
                state.testimonials.unshift(action.payload);
            })
            // Update
            .addCase(updateTestimonial.fulfilled, (state, action) => {
                const index = state.testimonials.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.testimonials[index] = action.payload;
                }
            })
            // Delete
            .addCase(deleteTestimonial.fulfilled, (state, action) => {
                state.testimonials = state.testimonials.filter(t => t.id !== action.payload);
            });
    }
});

export default testimonialsSlice.reducer;
