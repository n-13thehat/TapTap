export interface Agent {
  id: string;
  name: string;
  role: string;
  tone: string;
  vibe: string;
  signature: string;
  summary: string;
  version: string;
  meta: {
    theme: {
      color: string;
      emoji: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  agentId?: string;
  agentName?: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  agentId?: string;
  priority: 'low' | 'medium' | 'high';
  actions: any[];
  metadata: any;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  coverUrl?: string;
  audioUrl: string;
}

