import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from './store/slices/authSlice';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Categories from './pages/Categories';
import Attributes from './pages/Attributes';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import AdminCatalogue from './pages/AdminCatalogue';
import BlogCategories from './pages/BlogCategories';
import Blogs from './pages/Blogs';
import BlogForm from './pages/BlogForm';

import CataloguePreview from './pages/CataloguePreview';

function App() {
  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Router>
      <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<Users />} />
            <Route path="roles" element={<Roles />} />
            <Route path="categories" element={<Categories />} />
            <Route path="attributes" element={<Attributes />} />
            <Route path="products" element={<Products />} />
            <Route path="products/create" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="catalogue" element={<AdminCatalogue />} />
            <Route path="catalogue/preview" element={<CataloguePreview />} />
            <Route path="blog-categories" element={<BlogCategories />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="blogs/create" element={<BlogForm />} />
            <Route path="blogs/edit/:id" element={<BlogForm />} />
          </Route>

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
  );
}

export default App;
