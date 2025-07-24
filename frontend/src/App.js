import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Nav } from 'react-bootstrap';

// Layout Components
import MainLayout from './components/common/MainLayout';
import MinimalLayout from './components/common/MinimalLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Authentication Components
import Login from './components/authentication/Login';
import Register from './components/authentication/Register';
import ForgotPassword from './components/authentication/ForgotPassword';
import ResetPassword from './components/authentication/ResetPassword';

// Dashboard Components
import Dashboard from './pages/Dashboard';

// Common Components
import Unauthorized from './components/common/Unauthorized';
import GroupsPage from './pages/GroupsPage';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (window.innerWidth < 1024) {
      alert('This site is best viewed on a desktop. For the best experience, please switch to a larger screen.');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Routes with the main layout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Add other main layout routes here */}
          </Route>

          {/* Routes with the minimal layout for immersive experience */}
          <Route element={<MinimalLayout />}>
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:id" element={<GroupsPage />} />
          </Route>
        </Route>

        {/* Redirects and Catch-all */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </React.Fragment>
  );
}

export default App;
