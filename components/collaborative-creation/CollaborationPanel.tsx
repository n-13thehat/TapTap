"use client";

import { useState } from 'react';
import { Users, MessageCircle, Video, Mic, Settings, UserPlus, Crown } from 'lucide-react';

interface CollaborationPanelProps {
  projectId?: string;
  collaborators?: any[];
  onInviteUser?: (email: string) => void;
}

export default function CollaborationPanel({ projectId, collaborators = [], onInviteUser }: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState('collaborators');
  const [inviteEmail, setInviteEmail] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  const mockCollaborators = collaborators.length > 0 ? collaborators : [
    {
      id: '1',
      username: 'BeatMaker',
      avatar: '🎵',
      role: 'Owner',
      status: 'online',
      permissions: ['edit', 'invite', 'admin'],
      joinedAt: '1 week ago',
      contributions: 12
    },
    {
      id: '2',
      username: 'SynthWave',
      avatar: '🎹',
      role: 'Producer',
      status: 'online',
      permissions: ['edit'],
      joinedAt: '5 days ago',
      contributions: 8
    },
    {
      id: '3',
      username: 'VocalVibes',
      avatar: '🎤',
      role: 'Vocalist',
      status: 'away',
      permissions: ['edit'],
      joinedAt: '3 days ago',
      contributions: 5
    },
    {
      id: '4',
      username: 'MixMaster',
      avatar: '🎛️',
      role: 'Engineer',
      status: 'offline',
      permissions: ['edit'],
      joinedAt: '1 day ago',
      contributions: 2
    }
  ];

  const chatMessages = [
    {
      id: '1',
      user: 'SynthWave',
      message: 'Just added the new synth pad, what do you think?',
      timestamp: '2 minutes ago'
    },
    {
      id: '2',
      user: 'VocalVibes',
      message: 'Sounds amazing! Should I record the vocals now?',
      timestamp: '5 minutes ago'
    },
    {
      id: '3',
      user: 'BeatMaker',
      message: 'Let\'s adjust the tempo first, then vocals',
      timestamp: '8 minutes ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const handleInvite = () => {
    if (inviteEmail && onInviteUser) {
      onInviteUser(inviteEmail);
      setInviteEmail('');
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      console.log('Sending message:', chatMessage);
      setChatMessage('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users size={20} className="text-blue-400" />
          Collaboration Panel
        </h3>
        <div className="flex gap-2">
          <button className="bg-green-600 hover:bg-green-700 p-2 rounded-lg text-white transition-colors">
            <Video size={16} />
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg text-white transition-colors">
            <Mic size={16} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {[
          { id: 'collaborators', name: 'Collaborators', icon: <Users size={16} /> },
          { id: 'chat', name: 'Chat', icon: <MessageCircle size={16} /> },
          { id: 'permissions', name: 'Permissions', icon: <Settings size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Collaborators Tab */}
      {activeTab === 'collaborators' && (
        <div className="space-y-4">
          {/* Invite Section */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Invite Collaborator</h4>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/40"
              />
              <button
                onClick={handleInvite}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white transition-colors flex items-center gap-2"
              >
                <UserPlus size={16} />
                Invite
              </button>
            </div>
          </div>

          {/* Collaborators List */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4">Active Collaborators ({mockCollaborators.length})</h4>
            
            <div className="space-y-3">
              {mockCollaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center text-lg">
                        {collaborator.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(collaborator.status)} rounded-full border-2 border-gray-900`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{collaborator.username}</span>
                        {collaborator.role === 'Owner' && (
                          <Crown size={14} className="text-yellow-400" />
                        )}
                      </div>
                      <div className="text-white/60 text-sm">{collaborator.role}</div>
                      <div className="text-white/40 text-xs">
                        {collaborator.contributions} contributions • Joined {collaborator.joinedAt}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      collaborator.status === 'online' ? 'bg-green-600/20 text-green-400' :
                      collaborator.status === 'away' ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {collaborator.status}
                    </span>
                    <button className="bg-white/10 hover:bg-white/20 p-2 rounded transition-colors">
                      <Settings size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Project Chat</h4>
          
          {/* Chat Messages */}
          <div className="h-64 overflow-y-auto mb-4 space-y-3">
            {chatMessages.map((message) => (
              <div key={message.id} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium text-sm">{message.user}</span>
                  <span className="text-white/40 text-xs">{message.timestamp}</span>
                </div>
                <p className="text-white/80 text-sm">{message.message}</p>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/40"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Permission Settings</h4>
          
          <div className="space-y-4">
            {mockCollaborators.map((collaborator) => (
              <div key={collaborator.id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                      {collaborator.avatar}
                    </div>
                    <span className="text-white font-medium">{collaborator.username}</span>
                  </div>
                  <span className="text-white/60 text-sm">{collaborator.role}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['edit', 'invite', 'admin', 'export'].map((permission) => (
                    <label key={permission} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={collaborator.permissions.includes(permission)}
                        onChange={() => console.log(`Toggle ${permission} for ${collaborator.username}`)}
                        className="rounded"
                      />
                      <span className="text-white/80 text-sm capitalize">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
