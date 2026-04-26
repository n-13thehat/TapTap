import { useState, useEffect } from 'react';
import { ChatMessage } from '../types';
import { apiClient } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useChat(agentId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agentId) {
      loadMessages(agentId);
    }
  }, [agentId]);

  async function loadMessages(id: string) {
    try {
      const stored = await AsyncStorage.getItem(`chat_${id}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  async function saveMessages(id: string, msgs: ChatMessage[]) {
    try {
      await AsyncStorage.setItem(`chat_${id}`, JSON.stringify(msgs));
    } catch (err) {
      console.error('Failed to save messages:', err);
    }
  }

  async function sendMessage(content: string) {
    if (!agentId) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    await saveMessages(agentId, newMessages);

    setLoading(true);

    try {
      const response = await apiClient.sendChatMessage(agentId, content, messages);
      
      const agentMessage: ChatMessage = {
        id: `msg_${Date.now()}_agent`,
        role: 'agent',
        content: response.message,
        agentId: response.agentId,
        agentName: response.agentName,
        timestamp: Date.now(),
      };

      const updatedMessages = [...newMessages, agentMessage];
      setMessages(updatedMessages);
      await saveMessages(agentId, updatedMessages);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Optionally add error message to chat
    } finally {
      setLoading(false);
    }
  }

  async function clearMessages() {
    if (!agentId) return;
    setMessages([]);
    await AsyncStorage.removeItem(`chat_${agentId}`);
  }

  return { messages, sendMessage, clearMessages, loading };
}

