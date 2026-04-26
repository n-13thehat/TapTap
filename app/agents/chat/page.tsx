'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  tone: string;
  vibe: string;
  signature: string;
  summary: string;
  meta: {
    theme: {
      color: string;
      emoji: string;
    };
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  agentId?: string;
  agentName?: string;
  timestamp: number;
}

export default function AgentChatPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadAgents() {
    try {
      const response = await fetch('/api/agents');
      const result = await response.json();
      if (result.success && result.data) {
        setAgents(result.data);
        if (result.data.length > 0) {
          setSelectedAgent(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !selectedAgent || loading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call agent chat API
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          message: userMessage.content,
          conversationHistory: messages,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const agentMessage: ChatMessage = {
          id: `msg_${Date.now()}_agent`,
          role: 'agent',
          content: result.data.message,
          agentId: result.data.agentId,
          agentName: result.data.agentName,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, agentMessage]);
      } else {
        // Fallback response
        const agentMessage: ChatMessage = {
          id: `msg_${Date.now()}_agent`,
          role: 'agent',
          content: `${selectedAgent.signature} I'm ${selectedAgent.name}, your ${selectedAgent.role}. How can I help you today?`,
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loadingAgents) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/60">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-400" />
            Agent Chat
          </h1>
          <p className="text-white/60">Chat with TapTap's AI agents</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
          {/* Agent List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 overflow-y-auto"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-400" />
              Agents ({agents.length})
            </h2>
            <div className="space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setMessages([]);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedAgent?.id === agent.id
                      ? 'bg-purple-500/20 border-2 border-purple-400/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{agent.meta?.theme?.emoji || '✨'}</span>
                    <span className="font-semibold text-white">{agent.name}</span>
                  </div>
                  <p className="text-xs text-white/60 truncate">{agent.role}</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Chat Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col"
          >
            {selectedAgent ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: selectedAgent.meta?.theme?.color + '20' || '#8B5CF620' }}
                    >
                      {selectedAgent.meta?.theme?.emoji || '✨'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedAgent.name}</h3>
                      <p className="text-sm text-white/60">{selectedAgent.role}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-white/70 italic">"{selectedAgent.signature}"</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <div
                          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
                          style={{ backgroundColor: selectedAgent.meta?.theme?.color + '20' || '#8B5CF620' }}
                        >
                          {selectedAgent.meta?.theme?.emoji || '✨'}
                        </div>
                        <h4 className="text-xl font-semibold text-white mb-2">
                          Chat with {selectedAgent.name}
                        </h4>
                        <p className="text-white/60 max-w-md mx-auto">
                          {selectedAgent.summary}
                        </p>
                        <p className="text-white/40 text-sm mt-4">
                          Start a conversation by typing a message below
                        </p>
                      </motion.div>
                    )}

                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-4 ${
                            message.role === 'user'
                              ? 'bg-purple-500/20 border border-purple-400/30'
                              : 'bg-white/10 border border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {message.role === 'agent' ? (
                              <>
                                <span className="text-lg">{selectedAgent.meta?.theme?.emoji || '✨'}</span>
                                <span className="text-sm font-semibold text-white">{message.agentName}</span>
                              </>
                            ) : (
                              <>
                                <User className="h-4 w-4 text-purple-400" />
                                <span className="text-sm font-semibold text-white">You</span>
                              </>
                            )}
                          </div>
                          <p className="text-white/90">{message.content}</p>
                          <p className="text-xs text-white/40 mt-2">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                            <span className="text-white/60 text-sm">{selectedAgent.name} is typing...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Message ${selectedAgent.name}...`}
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 resize-none"
                      rows={1}
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || loading}
                      className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Bot className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">Select an agent to start chatting</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

