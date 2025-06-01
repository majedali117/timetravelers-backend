import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { 
  BarChart2, 
  LineChart, 
  PieChart, 
  Download,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('engagement');
  const [timeRange, setTimeRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    fetchData();
  }, [activeTab, timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      switch (activeTab) {
        case 'engagement':
          response = await analyticsAPI.getUserEngagement(timeRange.startDate, timeRange.endDate);
          break;
        case 'missions':
          response = await analyticsAPI.getMissionMetrics(timeRange.startDate, timeRange.endDate);
          break;
        case 'protocols':
          response = await analyticsAPI.getProtocolMetrics(timeRange.startDate, timeRange.endDate);
          break;
        case 'growth':
          response = await analyticsAPI.getUserGrowth(timeRange.startDate, timeRange.endDate);
          break;
        default:
          throw new Error('Invalid analytics tab');
      }
      
      setData(response.data);
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      
      const response = await analyticsAPI.exportData(
        activeTab,
        exportFormat,
        timeRange.startDate,
        timeRange.endDate
      );
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_${timeRange.startDate}_to_${timeRange.endDate}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('Error exporting data:', err);
      setError(err.message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8b5cf6', '#14b8a6', '#f97316', '#ef4444', '#06b6d4', '#84cc16'];

  const renderEngagementCharts = () => {
    if (!data) return null;
    
    return (
      <div className="space-y-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Daily Active Users</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={data.dailyActiveUsers}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Active Users" 
                  stroke="#8b5cf6" 
                  activeDot={{ r: 8 }} 
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Session Duration</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={data.sessionDuration}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                  />
                  <Legend />
                  <Bar dataKey="count" name="Sessions" fill="#8b5cf6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Feature Usage</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={data.featureUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="feature"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.featureUsage.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMissionCharts = () => {
    if (!data) return null;
    
    return (
      <div className="space-y-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Mission Completion Rate</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={data.completionRate}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  name="Completion Rate (%)" 
                  stroke="#8b5cf6" 
                  activeDot={{ r: 8 }} 
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Missions by Difficulty</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={data.byDifficulty}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="difficulty" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                  />
                  <Legend />
                  <Bar dataKey="assignedCount" name="Assigned" fill="#8b5cf6" />
                  <Bar dataKey="completedCount" name="Completed" fill="#14b8a6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Missions by Type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={data.byType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="type"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.byType.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProtocolCharts = () => {
    if (!data) return null;
    
    return (
      <div className="space-y-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Protocol Progress</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={data.progressOverTime}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgProgress" 
                  name="Average Progress (%)" 
                  stroke="#8b5cf6" 
                  activeDot={{ r: 8 }} 
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Protocols by Level</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={data.byLevel}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="level" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                  />
                  <Legend />
                  <Bar dataKey="assignedCount" name="Assigned" fill="#8b5cf6" />
                  <Bar dataKey="completedCount" name="Completed" fill="#14b8a6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Completion Rate by Level</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={data.completionRateByLevel}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="level" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                  />
                  <Legend />
                  <Bar dataKey="rate" name="Completion Rate (%)" fill="#8b5cf6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGrowthCharts = () => {
    if (!data) return null;
    
    return (
      <div className="space-y-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">User Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={data.userGrowth}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalUsers" 
                  name="Total Users" 
                  stroke="#8b5cf6" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="newUsers" 
                  name="New Users" 
                  stroke="#14b8a6" 
                  activeDot={{ r: 8 }} 
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Retention Rate</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={data.retentionRate}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    name="Retention Rate (%)" 
                    stroke="#8b5cf6" 
                    activeDot={{ r: 8 }} 
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">User Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={data.userDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="category"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.userDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-400 mt-1">Platform performance metrics and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md flex items-center"
            onClick={fetchData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <div className="flex items-center space-x-2">
            <select
              className="bg-gray-700 text-white px-3 py-2 rounded-md"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xlsx">Excel</option>
            </select>
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md flex items-center"
              onClick={handleExport}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div className="flex space-x-1 mb-4 md:mb-0">
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === 'engagement'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setActiveTab('engagement')}
            >
              User Engagement
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === 'missions'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setActiveTab('missions')}
            >
              Missions
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === 'protocols'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setActiveTab('protocols')}
            >
              Protocols
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === 'growth'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setActiveTab('growth')}
            >
              User Growth
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              className="bg-gray-700 text-white px-3 py-1 rounded-md"
              value={timeRange.startDate}
              onChange={(e) => setTimeRange({ ...timeRange, startDate: e.target.value })}
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              className="bg-gray-700 text-white px-3 py-1 rounded-md"
              value={timeRange.endDate}
              onChange={(e) => setTimeRange({ ...timeRange, endDate: e.target.value })}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'engagement' && renderEngagementCharts()}
            {activeTab === 'missions' && renderMissionCharts()}
            {activeTab === 'protocols' && renderProtocolCharts()}
            {activeTab === 'growth' && renderGrowthCharts()}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
