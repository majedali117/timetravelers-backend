import axios from 'axios';

// Create an axios instance for admin API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Redirect to login page
      window.location.href = '/admin/login';
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('admin_token');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getAllDashboards: async () => {
    const response = await api.get('/admin/dashboards');
    return response.data;
  },
  getDashboard: async (id: string) => {
    const response = await api.get(`/admin/dashboards/${id}`);
    return response.data;
  },
  createDashboard: async (dashboardData: any) => {
    const response = await api.post('/admin/dashboards', dashboardData);
    return response.data;
  },
  updateDashboard: async (id: string, dashboardData: any) => {
    const response = await api.put(`/admin/dashboards/${id}`, dashboardData);
    return response.data;
  },
  deleteDashboard: async (id: string) => {
    const response = await api.delete(`/admin/dashboards/${id}`);
    return response.data;
  },
};

// Widget API
export const widgetAPI = {
  getWidgetData: async (widgetType: string, timeRange: string = 'last30days') => {
    const response = await api.get('/admin/widget-data', {
      params: { widgetType, timeRange }
    });
    return response.data;
  },
};

// System API
export const systemAPI = {
  getSystemOverview: async () => {
    const response = await api.get('/admin/system-overview');
    return response.data;
  },
};

// User API
export const userAPI = {
  getAllUsers: async (page: number = 1, limit: number = 10) => {
    const response = await api.get('/users', {
      params: { page, limit }
    });
    return response.data;
  },
  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Mission API
export const missionAPI = {
  getAllMissions: async (page: number = 1, limit: number = 10) => {
    const response = await api.get('/missions', {
      params: { page, limit }
    });
    return response.data;
  },
  getMission: async (id: string) => {
    const response = await api.get(`/missions/${id}`);
    return response.data;
  },
  createMission: async (missionData: any) => {
    const response = await api.post('/missions', missionData);
    return response.data;
  },
  updateMission: async (id: string, missionData: any) => {
    const response = await api.put(`/missions/${id}`, missionData);
    return response.data;
  },
  deleteMission: async (id: string) => {
    const response = await api.delete(`/missions/${id}`);
    return response.data;
  },
};

// Protocol API
export const protocolAPI = {
  getAllProtocols: async (page: number = 1, limit: number = 10) => {
    const response = await api.get('/protocols', {
      params: { page, limit }
    });
    return response.data;
  },
  getProtocol: async (id: string) => {
    const response = await api.get(`/protocols/${id}`);
    return response.data;
  },
  createProtocol: async (protocolData: any) => {
    const response = await api.post('/protocols', protocolData);
    return response.data;
  },
  updateProtocol: async (id: string, protocolData: any) => {
    const response = await api.put(`/protocols/${id}`, protocolData);
    return response.data;
  },
  deleteProtocol: async (id: string) => {
    const response = await api.delete(`/protocols/${id}`);
    return response.data;
  },
};

// Mentor API
export const mentorAPI = {
  getAllMentors: async (page: number = 1, limit: number = 10) => {
    const response = await api.get('/mentors', {
      params: { page, limit }
    });
    return response.data;
  },
  getMentor: async (id: string) => {
    const response = await api.get(`/mentors/${id}`);
    return response.data;
  },
  createMentor: async (mentorData: any) => {
    const response = await api.post('/mentors', mentorData);
    return response.data;
  },
  updateMentor: async (id: string, mentorData: any) => {
    const response = await api.put(`/mentors/${id}`, mentorData);
    return response.data;
  },
  deleteMentor: async (id: string) => {
    const response = await api.delete(`/mentors/${id}`);
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getUserEngagement: async (startDate: string, endDate: string) => {
    const response = await api.get('/analytics/engagement', {
      params: { startDate, endDate }
    });
    return response.data;
  },
  getMissionMetrics: async (startDate: string, endDate: string) => {
    const response = await api.get('/analytics/missions', {
      params: { startDate, endDate }
    });
    return response.data;
  },
  getProtocolMetrics: async (startDate: string, endDate: string) => {
    const response = await api.get('/analytics/protocols', {
      params: { startDate, endDate }
    });
    return response.data;
  },
  getUserGrowth: async (startDate: string, endDate: string) => {
    const response = await api.get('/analytics/growth', {
      params: { startDate, endDate }
    });
    return response.data;
  },
  exportData: async (dataType: string, format: string, startDate: string, endDate: string) => {
    const response = await api.get('/analytics/export', {
      params: { dataType, format, startDate, endDate },
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
