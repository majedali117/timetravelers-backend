import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const AdminLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar collapsed={sidebarCollapsed} toggleCollapse={toggleSidebar} />
      
      <div 
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <header className="bg-gray-900 shadow-md h-16 flex items-center px-6">
          <h1 className="text-xl font-semibold text-purple-400">Admin Dashboard</h1>
        </header>
        
        <main className="p-6">
          <Outlet />
        </main>
        
        <footer className="p-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} TimeTravelers Admin Panel
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
