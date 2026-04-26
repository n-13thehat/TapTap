import { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  handle?: string;
  bio?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return mock data for development
    return {
      user: { id: '1', email: 'demo@taptap.com', name: 'Demo User', handle: 'demo' },
      isAuthenticated: true,
      isLoading: false,
      login: async () => {},
      logout: async () => {},
      register: async () => {},
    };
  }
  return context;
}

export { AuthContext };

