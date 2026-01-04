"use client";

import { useState } from 'react';
import { Users, Music, Clock, Play, Settings, Plus, Share2 } from 'lucide-react';

interface ProjectDashboardProps {
  projects?: any[];
  onProjectSelect?: (project: any) => void;
  onCreateProject?: () => void;
}

export default function ProjectDashboard({ projects = [], onProjectSelect, onCreateProject }: ProjectDashboardProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState('grid');

  const mockProjects = projects.length > 0 ? projects : [
    {
      id: '1',
      title: 'Cosmic Collaboration',
      description: 'Electronic fusion project',
      status: 'active',
      collaborators: [
        { username: 'BeatMaker', avatar: '🎵', role: 'Producer' },
        { username: 'SynthWave', avatar: '🎹', role: 'Composer' },
        { username: 'VocalVibes', avatar: '🎤', role: 'Vocalist' }
      ],
      tracks: 5,
      lastActivity: '2 hours ago',
      progress: 65,
      genre: 'Electronic',
      tempo: 128,
      key: 'C minor'
    },
    {
      id: '2',
      title: 'Hip Hop Collective',
      description: 'Street beats and flows',
      status: 'active',
      collaborators: [
        { username: 'RapMaster', avatar: '🎤', role: 'Rapper' },
        { username: 'BeatBox', avatar: '🥁', role: 'Beatmaker' }
      ],
      tracks: 3,
      lastActivity: '1 day ago',
      progress: 40,
      genre: 'Hip Hop',
      tempo: 95,
      key: 'F# minor'
    },
    {
      id: '3',
      title: 'Ambient Soundscape',
      description: 'Atmospheric journey',
      status: 'completed',
      collaborators: [
        { username: 'AmbientArt', avatar: '🌊', role: 'Sound Designer' },
        { username: 'FieldRecord', avatar: '🎙️', role: 'Field Recorder' }
      ],
      tracks: 8,
      lastActivity: '1 week ago',
      progress: 100,
      genre: 'Ambient',
      tempo: 72,
      key: 'A major'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'completed': return 'text-blue-400';
      case 'paused': return 'text-yellow-400';
      default: return 'text-white/60';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project.id);
    if (onProjectSelect) {
      onProjectSelect(project);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users size={20} className="text-blue-400" />
          Collaborative Projects ({mockProjects.length})
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60'
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={onCreateProject}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleProjectSelect(project)}
              className={`bg-white/5 rounded-lg p-6 cursor-pointer transition-all hover:bg-white/10 ${
                selectedProject === project.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-white font-medium mb-1">{project.title}</h4>
                  <p className="text-white/60 text-sm">{project.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(project.status)} bg-white/10`}>
                  {project.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {project.collaborators.slice(0, 3).map((collab: any, index: number) => (
                  <div key={index} className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center text-sm">
                    {collab.avatar}
                  </div>
                ))}
                {project.collaborators.length > 3 && (
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs text-white/60">
                    +{project.collaborators.length - 3}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Progress</span>
                  <span className="text-white/60">{project.progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getStatusBg(project.status)}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-white/60">
                  <span>{project.tracks} tracks</span>
                  <span>{project.lastActivity}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-white/80">{project.genre}</span>
                  <span className="text-white/80">{project.tempo} BPM</span>
                  <span className="text-white/80">{project.key}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-white text-sm transition-colors flex items-center justify-center gap-1">
                  <Play size={14} />
                  Play
                </button>
                <button className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded text-white transition-colors">
                  <Share2 size={14} />
                </button>
                <button className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded text-white transition-colors">
                  <Settings size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {mockProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleProjectSelect(project)}
              className={`bg-white/5 rounded-lg p-4 cursor-pointer transition-all hover:bg-white/10 ${
                selectedProject === project.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Music size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{project.title}</h4>
                    <p className="text-white/60 text-sm">{project.description}</p>
                    <div className="flex items-center gap-4 text-xs text-white/60 mt-1">
                      <span>{project.tracks} tracks</span>
                      <span>{project.genre}</span>
                      <span>{project.tempo} BPM</span>
                      <span>{project.lastActivity}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {project.collaborators.slice(0, 4).map((collab: any, index: number) => (
                      <div key={index} className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center text-xs">
                        {collab.avatar}
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <div className="text-white font-medium">{project.progress}%</div>
                    <div className="text-white/60 text-xs">Complete</div>
                  </div>

                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(project.status)} bg-white/10`}>
                    {project.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mockProjects.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/60 mb-4">No collaborative projects yet</p>
          <button
            onClick={onCreateProject}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white transition-colors"
          >
            Create Your First Project
          </button>
        </div>
      )}
    </div>
  );
}
