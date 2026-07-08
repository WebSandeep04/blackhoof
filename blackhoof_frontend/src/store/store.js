import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import rolesReducer from './slices/rolesSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        users: usersReducer,
        roles: rolesReducer,
    },
});
