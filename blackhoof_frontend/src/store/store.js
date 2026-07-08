import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import rolesReducer from './slices/rolesSlice';
import categoriesReducer from './slices/categoriesSlice';
import attributesReducer from './slices/attributesSlice';
import productsReducer from './slices/productsSlice';
import catalogueReducer from './slices/catalogueSlice';
import catalogueCartReducer from './slices/catalogueCartSlice';
import savedCataloguesReducer from './slices/savedCataloguesSlice';
import blogCategoriesReducer from './slices/blogCategoriesSlice';
import blogsReducer from './slices/blogsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        users: usersReducer,
        roles: rolesReducer,
        categories: categoriesReducer,
        attributes: attributesReducer,
        products: productsReducer,
        catalogue: catalogueReducer,
        catalogueCart: catalogueCartReducer,
        savedCatalogues: savedCataloguesReducer,
        blogCategories: blogCategoriesReducer,
        blogs: blogsReducer,
    },
});
