import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API Base URL - update this to your backend URL
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      await AsyncStorage.removeItem('auth_token');
      // You can emit an event here to trigger navigation to login
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Agents
  async getAgents() {
    const response = await api.get('/api/agents');
    return response.data.data || [];
  },

  async getAgent(id: string) {
    const response = await api.get(`/api/agents/${id}`);
    return response.data.data;
  },

  // Chat
  async sendChatMessage(agentId: string, message: string, history: any[]) {
    const response = await api.post('/api/agents/chat', {
      agentId,
      message,
      conversationHistory: history,
    });
    return response.data.data;
  },

  // Notifications
  async getNotifications() {
    const response = await api.get('/api/notifications');
    return response.data;
  },

  async markNotificationRead(id: string) {
    const response = await api.patch(`/api/notifications/${id}/read`);
    return response.data;
  },

  // Auth
  async login(email: string, password: string) {
    const response = await api.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    await AsyncStorage.setItem('auth_token', token);
    return { token, user };
  },

  async logout() {
    await AsyncStorage.removeItem('auth_token');
  },

  async getCurrentUser() {
    const response = await api.get('/api/auth/me');
    return response.data.user;
  },

  // Music
  async getTracks(params?: any) {
    const response = await api.get('/api/tracks', { params });
    return response.data;
  },

  async getTrack(id: string) {
    const response = await api.get(`/api/tracks/${id}`);
    return response.data;
  },

  async playTrack(id: string) {
    const response = await api.post(`/api/tracks/${id}/play`);
    return response.data;
  },
};

export default api;

