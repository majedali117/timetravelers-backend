import React, { useState, useEffect } from 'react';
import { systemAPI } from '../services/api';
import { 
  Users, 
  Target, 
  BookOpen, 
  UserCheck,
  Activity
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: number;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, loading }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-700 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-2xl font-bold text-white mt-2">{value}</p>
          )}
          {change !== undefined && (
            <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-purple-500/20 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
};

interface ActivityItem {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  eventType: string;
  timestamp: string;
  metadata?: any;
}

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchSystemOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await systemAPI.getSystemOverview();
        setOverview(response.overview.counts);
        setRecentActivity(response.overview.recentActivity || []);
      } catch (err: any) {
        console.error('Error fetching system overview:', err);
        setError(err.message || 'Failed to fetch system overview');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemOverview();
  }, []);

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome to the TimeTravelers admin panel</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Users" 
          value={loading ? '-' : overview?.users || 0} 
          icon={<Users className="h-6 w-6 text-purple-400" />} 
          loading={loading}
        />
        <StatCard 
          title="Total Missions" 
          value={loading ? '-' : overview?.missions || 0} 
          icon={<Target className="h-6 w-6 text-purple-400" />} 
          loading={loading}
        />
        <StatCard 
          title="Total Protocols" 
          value={loading ? '-' : overview?.protocols || 0} 
          icon={<BookOpen className="h-6 w-6 text-purple-400" />} 
          loading={loading}
        />
        <StatCard 
          title="Active Mentors" 
          value={loading ? '-' : overview?.mentors || 0} 
          icon={<UserCheck className="h-6 w-6 text-purple-400" />} 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <Activity className="h-5 w-5 text-purple-400" />
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 border-b border-gray-700 pb-4">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    {activity.user.firstName.charAt(0)}{activity.user.lastName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {activity.user.firstName} {activity.user.lastName}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatEventType(activity.eventType)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No recent activity</p>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <a 
              href="/admin/users" 
              className="bg-gray-700 hover:bg-gray-600 transition-colors p-4 rounded-lg flex flex-col items-center justify-center text-center"
            >
              <Users className="h-8 w-8 text-purple-400 mb-2" />
              <span className="font-medium">Manage Users</span>
            </a>
            <a 
              href="/admin/missions" 
              className="bg-gray-700 hover:bg-gray-600 transition-colors p-4 rounded-lg flex flex-col items-center justify-center text-center"
            >
              <Target className="h-8 w-8 text-purple-400 mb-2" />
              <span className="font-medium">Manage Missions</span>
            </a>
            <a 
              href="/admin/protocols" 
              className="bg-gray-700 hover:bg-gray-600 transition-colors p-4 rounded-lg flex flex-col items-center justify-center text-center"
            >
              <BookOpen className="h-8 w-8 text-purple-400 mb-2" />
              <span className="font-medium">Manage Protocols</span>
            </a>
            <a 
              href="/admin/mentors" 
              className="bg-gray-700 hover:bg-gray-600 transition-colors p-4 rounded-lg flex flex-col items-center justify-center text-center"
            >
              <UserCheck className="h-8 w-8 text-purple-400 mb-2" />
              <span className="font-medium">Manage Mentors</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
