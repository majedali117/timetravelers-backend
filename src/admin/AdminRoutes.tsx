import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import DashboardManagementPage from './pages/DashboardManagementPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MissionsPage from './pages/MissionsPage';
import ProtocolsPage from './pages/ProtocolsPage';
import MentorsPage from './pages/MentorsPage';

const AdminRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="mentors" element={<MentorsPage />} />
          <Route path="missions" element={<MissionsPage />} />
          <Route path="protocols" element={<ProtocolsPage />} />
          <Route path="dashboards" element={<DashboardManagementPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default AdminRoutes;
