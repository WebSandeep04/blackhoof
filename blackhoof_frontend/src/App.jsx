import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from './store/slices/authSlice';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import Users from './pages/Users';
import Roles from './pages/Roles';

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
          </Route>

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
  );
}

export default App;
