import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  BookOpen, 
  UserCheck, 
  BarChart2, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleCollapse }) => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div 
      className={`bg-gray-900 text-white h-screen transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } fixed left-0 top-0 z-40`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && (
          <Link to="/admin" className="text-xl font-bold text-purple-400">
            TimeTravelers
          </Link>
        )}
        <button 
          onClick={toggleCollapse}
          className="p-1 rounded-full hover:bg-gray-800"
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      <div className="py-4">
        <nav>
          <ul>
            <li>
              <Link
                to="/admin"
                className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
              >
                <LayoutDashboard className="h-5 w-5 text-purple-400" />
                {!collapsed && <span className="ml-3">Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link
                to="/admin/users"
                className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
              >
                <Users className="h-5 w-5 text-purple-400" />
                {!collapsed && <span className="ml-3">Users</span>}
              </Link>
            </li>
            <li>
              <Link
                to="/admin/missions"
                className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
              >
                <Target className="h-5 w-5 text-purple-400" />
                {!collapsed && <span className="ml-3">Missions</span>}
              </Link>
            </li>
            <li>
              <Link
                to="/admin/protocols"
                className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
              >
                <BookOpen className="h-5 w-5 text-purple-400" />
                {!collapsed && <span className="ml-3">Protocols</span>}
              </Link>
            </li>
            <li>
              <Link
                to="/admin/mentors"
                className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
              >
                <UserCheck className="h-5 w-5 text-purple-400" />
                {!collapsed && <span className="ml-3">Mentors</span>}
              </Link>
            </li>
            <li>
              <Link
                to="/admin/analytics"
                className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
              >
                <BarChart2 className="h-5 w-5 text-purple-400" />
                {!collapsed && <span className="ml-3">Analytics</span>}
              </Link>
            </li>
            <li>
              <Link
                to="/admin/settings"
                className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
              >
                <Settings className="h-5 w-5 text-purple-400" />
                {!collapsed && <span className="ml-3">Settings</span>}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="absolute bottom-0 w-full border-t border-gray-800">
        {!collapsed && (
          <div className="px-4 py-2">
            <div className="text-sm text-gray-400">Logged in as</div>
            <div className="font-medium truncate">{user?.email}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 hover:bg-gray-800 transition-colors text-left"
        >
          <LogOut className="h-5 w-5 text-purple-400" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
