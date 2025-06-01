import React, { useState, useEffect } from 'react';
import { dashboardAPI, widgetAPI } from '../services/api';
import { LayoutGrid, LayoutList, Plus, Settings, Trash2, Save } from 'lucide-react';

interface Widget {
  id: string;
  title: string;
  type: string;
  size: {
    width: number;
    height: number;
  };
  position: {
    x: number;
    y: number;
  };
  dataSource: {
    type: string;
    endpoint?: string;
    collection?: string;
    refreshInterval?: number;
  };
  config: any;
}

interface Dashboard {
  _id: string;
  title: string;
  description?: string;
  layout: 'grid' | 'list' | 'custom';
  widgets: Widget[];
  isDefault: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const DashboardManagementPage: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('last30days');
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchDashboards();
  }, []);

  useEffect(() => {
    if (selectedDashboard) {
      fetchWidgetData();
    }
  }, [selectedDashboard, timeRange]);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardAPI.getAllDashboards();
      setDashboards(response.dashboards);
      
      // Select default dashboard or first one
      const defaultDashboard = response.dashboards.find((d: Dashboard) => d.isDefault) || response.dashboards[0];
      setSelectedDashboard(defaultDashboard);
    } catch (err: any) {
      console.error('Error fetching dashboards:', err);
      setError(err.message || 'Failed to fetch dashboards');
    } finally {
      setLoading(false);
    }
  };

  const fetchWidgetData = async () => {
    if (!selectedDashboard) return;

    try {
      const newWidgetData: Record<string, any> = {};
      
      for (const widget of selectedDashboard.widgets) {
        if (widget.type) {
          const response = await widgetAPI.getWidgetData(widget.type, timeRange);
          newWidgetData[widget.id] = response.data;
        }
      }
      
      setWidgetData(newWidgetData);
    } catch (err: any) {
      console.error('Error fetching widget data:', err);
      setError(err.message || 'Failed to fetch widget data');
    }
  };

  const handleCreateDashboard = async () => {
    const title = prompt('Enter dashboard title:');
    if (!title) return;
    
    try {
      const newDashboard = {
        title,
        description: '',
        layout: 'grid',
        widgets: [],
        isDefault: dashboards.length === 0
      };
      
      const response = await dashboardAPI.createDashboard(newDashboard);
      fetchDashboards();
    } catch (err: any) {
      console.error('Error creating dashboard:', err);
      setError(err.message || 'Failed to create dashboard');
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this dashboard?')) return;
    
    try {
      await dashboardAPI.deleteDashboard(id);
      fetchDashboards();
    } catch (err: any) {
      console.error('Error deleting dashboard:', err);
      setError(err.message || 'Failed to delete dashboard');
    }
  };

  const handleSetDefaultDashboard = async (id: string) => {
    try {
      const dashboard = dashboards.find(d => d._id === id);
      if (dashboard) {
        await dashboardAPI.updateDashboard(id, { ...dashboard, isDefault: true });
        fetchDashboards();
      }
    } catch (err: any) {
      console.error('Error setting default dashboard:', err);
      setError(err.message || 'Failed to set default dashboard');
    }
  };

  const handleSaveLayout = async () => {
    if (!selectedDashboard) return;
    
    try {
      await dashboardAPI.updateDashboard(selectedDashboard._id, selectedDashboard);
      setIsEditMode(false);
      fetchDashboards();
    } catch (err: any) {
      console.error('Error saving dashboard layout:', err);
      setError(err.message || 'Failed to save dashboard layout');
    }
  };

  const handleAddWidget = (widgetType: string) => {
    if (!selectedDashboard) return;
    
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      title: `New ${widgetType} Widget`,
      type: widgetType,
      size: {
        width: 1,
        height: 1
      },
      position: {
        x: 0,
        y: 0
      },
      dataSource: {
        type: 'api',
        endpoint: `/api/v1/admin/widget-data?widgetType=${widgetType}`,
        refreshInterval: 300
      },
      config: {}
    };
    
    setSelectedDashboard({
      ...selectedDashboard,
      widgets: [...selectedDashboard.widgets, newWidget]
    });
    
    setIsAddWidgetModalOpen(false);
  };

  const handleRemoveWidget = (widgetId: string) => {
    if (!selectedDashboard) return;
    
    setSelectedDashboard({
      ...selectedDashboard,
      widgets: selectedDashboard.widgets.filter(w => w.id !== widgetId)
    });
  };

  const renderWidgetContent = (widget: Widget) => {
    const data = widgetData[widget.id];
    
    if (!data) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      );
    }
    
    switch (widget.type) {
      case 'userStats':
        return (
          <div className="p-4">
            <div className="mb-4">
              <div className="text-2xl font-bold">{data.totalUsers}</div>
              <div className="text-sm text-gray-400">Total Users</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xl font-bold">{data.newUsers}</div>
                <div className="text-xs text-gray-400">New Users</div>
              </div>
              <div>
                <div className="text-xl font-bold">{data.activeUsers}</div>
                <div className="text-xs text-gray-400">Active Users</div>
              </div>
            </div>
          </div>
        );
      
      case 'missionStats':
        return (
          <div className="p-4">
            <div className="mb-4">
              <div className="text-2xl font-bold">{data.totalMissions}</div>
              <div className="text-sm text-gray-400">Total Missions</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xl font-bold">{data.totalAssigned}</div>
                <div className="text-xs text-gray-400">Assigned</div>
              </div>
              <div>
                <div className="text-xl font-bold">{data.totalCompleted}</div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-sm text-gray-400">Completion Rate</div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${data.completionRate}%` }}
                ></div>
              </div>
              <div className="text-xs text-right mt-1">{data.completionRate.toFixed(1)}%</div>
            </div>
          </div>
        );
      
      case 'protocolStats':
        return (
          <div className="p-4">
            <div className="mb-4">
              <div className="text-2xl font-bold">{data.totalProtocols}</div>
              <div className="text-sm text-gray-400">Total Protocols</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xl font-bold">{data.totalAssigned}</div>
                <div className="text-xs text-gray-400">Assigned</div>
              </div>
              <div>
                <div className="text-xl font-bold">{data.totalCompleted}</div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
            </div>
          </div>
        );
      
      case 'mentorStats':
        return (
          <div className="p-4">
            <div className="mb-4">
              <div className="text-2xl font-bold">{data.totalMentors}</div>
              <div className="text-sm text-gray-400">Total Mentors</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xl font-bold">{data.activeMentors}</div>
                <div className="text-xs text-gray-400">Active</div>
              </div>
              <div>
                <div className="text-xl font-bold">{data.totalAssignments}</div>
                <div className="text-xs text-gray-400">Assignments</div>
              </div>
            </div>
          </div>
        );
      
      case 'recentUsers':
        return (
          <div className="p-4">
            <ul className="space-y-2">
              {data.slice(0, 5).map((user: any) => (
                <li key={user._id} className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mr-2">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      
      case 'systemStatus':
        return (
          <div className="p-4">
            <div className="flex items-center mb-2">
              <div className={`h-3 w-3 rounded-full ${data.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <div className="text-sm">{data.status === 'healthy' ? 'System Healthy' : 'System Issues'}</div>
            </div>
            <div className="text-xs text-gray-400">
              <div>Uptime: {Math.floor(data.uptime / 3600)}h {Math.floor((data.uptime % 3600) / 60)}m</div>
              <div>API Requests: {data.apiRequests.lastHour} (last hour)</div>
              <div>Avg Response: {data.apiRequests.avgResponseTime}ms</div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-4 text-center text-gray-400">
            No data available for this widget type
          </div>
        );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Management</h1>
          <p className="text-gray-400 mt-1">Create and customize admin dashboards</p>
        </div>
        <button 
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center"
          onClick={handleCreateDashboard}
        >
          <Plus className="h-5 w-5 mr-2" />
          New Dashboard
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {dashboards.map((dashboard) => (
            <button
              key={dashboard._id}
              onClick={() => setSelectedDashboard(dashboard)}
              className={`px-4 py-2 rounded-md ${
                selectedDashboard?._id === dashboard._id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {dashboard.title}
              {dashboard.isDefault && (
                <span className="ml-2 text-xs bg-purple-800 px-1 rounded">Default</span>
              )}
            </button>
          ))}
        </div>

        {selectedDashboard && (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedDashboard.title}</h2>
                {selectedDashboard.description && (
                  <p className="text-gray-400 text-sm">{selectedDashboard.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <select
                  className="bg-gray-700 text-white px-3 py-1 rounded-md"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                </select>
                
                <div className="flex border border-gray-700 rounded-md">
                  <button
                    className={`px-2 py-1 ${
                      selectedDashboard.layout === 'grid'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                    onClick={() => {
                      if (isEditMode) {
                        setSelectedDashboard({
                          ...selectedDashboard,
                          layout: 'grid'
                        });
                      }
                    }}
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </button>
                  <button
                    className={`px-2 py-1 ${
                      selectedDashboard.layout === 'list'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                    onClick={() => {
                      if (isEditMode) {
                        setSelectedDashboard({
                          ...selectedDashboard,
                          layout: 'list'
                        });
                      }
                    }}
                  >
                    <LayoutList className="h-5 w-5" />
                  </button>
                </div>
                
                {isEditMode ? (
                  <button
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md flex items-center"
                    onClick={handleSaveLayout}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </button>
                ) : (
                  <button
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md flex items-center"
                    onClick={() => setIsEditMode(true)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                )}
                
                {!selectedDashboard.isDefault && (
                  <button
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md"
                    onClick={() => handleSetDefaultDashboard(selectedDashboard._id)}
                  >
                    Set Default
                  </button>
                )}
                
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"
                  onClick={() => handleDeleteDashboard(selectedDashboard._id)}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className={`grid ${
              selectedDashboard.layout === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            } gap-4`}>
              {selectedDashboard.widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="bg-gray-700 rounded-lg shadow overflow-hidden"
                >
                  <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
                    <h3 className="font-medium">{widget.title}</h3>
                    {isEditMode && (
                      <button
                        onClick={() => handleRemoveWidget(widget.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="h-48">
                    {renderWidgetContent(widget)}
                  </div>
                </div>
              ))}
              
              {isEditMode && (
                <button
                  onClick={() => setIsAddWidgetModalOpen(true)}
                  className="border-2 border-dashed border-gray-600 rounded-lg h-48 flex items-center justify-center hover:border-purple-500 transition-colors"
                >
                  <div className="text-center">
                    <Plus className="h-8 w-8 mx-auto text-gray-400" />
                    <span className="block mt-2 text-gray-400">Add Widget</span>
                  </div>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Widget Modal */}
      {isAddWidgetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Widget</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAddWidget('userStats')}
                className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center"
              >
                <Users className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                <span>User Statistics</span>
              </button>
              
              <button
                onClick={() => handleAddWidget('missionStats')}
                className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center"
              >
                <Target className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                <span>Mission Statistics</span>
              </button>
              
              <button
                onClick={() => handleAddWidget('protocolStats')}
                className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center"
              >
                <BookOpen className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                <span>Protocol Statistics</span>
              </button>
              
              <button
                onClick={() => handleAddWidget('mentorStats')}
                className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center"
              >
                <UserCheck className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                <span>Mentor Statistics</span>
              </button>
              
              <button
                onClick={() => handleAddWidget('recentUsers')}
                className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center"
              >
                <Users className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                <span>Recent Users</span>
              </button>
              
              <button
                onClick={() => handleAddWidget('systemStatus')}
                className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-center"
              >
                <Activity className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                <span>System Status</span>
              </button>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsAddWidgetModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardManagementPage;
