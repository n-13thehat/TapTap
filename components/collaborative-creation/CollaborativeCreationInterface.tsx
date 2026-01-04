"use client";

import { useState } from 'react';
import { useCollaborativeCreation, useRealTimeCollaboration, useProjectAnalytics } from '@/hooks/useCollaborativeCreation';
import ProjectDashboard from './ProjectDashboard';
import TrackEditor from './TrackEditor';
import VersionControl from './VersionControl';
import CollaborationPanel from './CollaborationPanel';
import { 
  Users, 
  Music, 
  GitBranch, 
  BarChart3, 
  Settings, 
  Plus,
  Play,
  MessageSquare,
  Clock,
  Zap,
  Eye,
  Share2
} from 'lucide-react';

export default function CollaborativeCreationInterface() {
  const [selectedView, setSelectedView] = useState<'dashboard' | 'editor' | 'versions' | 'analytics' | 'settings'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  const { 
    isInitialized, 
    projects, 
    activeSession,
    createProject,
    joinProject,
    createTrack 
  } = useCollaborativeCreation();

  const { 
    activeSessions, 
    getCollaboratorCount,
    getActiveCollaborators 
  } = useRealTimeCollaboration(selectedProject || undefined);

  const { analytics, loadAnalytics } = useProjectAnalytics(selectedProject || undefined);

  const currentProject = selectedProject ? projects.find(p => p.id === selectedProject) : null;
  const currentTrack = selectedTrack && currentProject ? 
    currentProject.tracks.find(t => t.id === selectedTrack) : null;

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'dashboard': return <Music size={16} />;
      case 'editor': return <Play size={16} />;
      case 'versions': return <GitBranch size={16} />;
      case 'analytics': return <BarChart3 size={16} />;
      case 'settings': return <Settings size={16} />;
      default: return <Music size={16} />;
    }
  };

  const handleCreateProject = async () => {
    try {
      const projectId = await createProject({
        name: 'New Collaborative Project',
        description: 'A new music collaboration project',
        visibility: 'collaborators',
        collaboration_mode: 'invite_only',
      });
      
      if (projectId) {
        setSelectedProject(projectId);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleCreateTrack = async () => {
    if (!selectedProject) return;

    try {
      const trackId = await createTrack(selectedProject, {
        name: 'New Track',
        description: 'A new collaborative track',
        type: 'hybrid',
      });
      
      if (trackId) {
        setSelectedTrack(trackId);
        setSelectedView('editor');
      }
    } catch (error) {
      console.error('Failed to create track:', error);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users size={48} className="mx-auto mb-4 text-purple-400 animate-pulse" />
          <p className="text-white/60">Loading Collaborative Creation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={32} className="text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Collaborative Creation</h1>
            <p className="text-white/60">
              Real-time music collaboration with version control
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {currentProject && (
            <div className="flex items-center gap-2 bg-green-600/20 border border-green-600/30 px-4 py-2 rounded-lg">
              <Eye size={16} className="text-green-400" />
              <div className="text-sm">
                <div className="text-white font-medium">{getCollaboratorCount()}</div>
                <div className="text-white/60">Active</div>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleCreateProject}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
      </div>

      {/* Project Selection */}
      {!selectedProject && (
        <div className="bg-white/5 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Your Projects</h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <Music size={48} className="mx-auto mb-4 text-white/40" />
              <p className="text-white/60 mb-4">No collaborative projects yet</p>
              <button 
                onClick={handleCreateProject}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-colors"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div 
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className="bg-white/5 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">{project.name}</h3>
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-purple-400" />
                      <span className="text-sm text-purple-400">{project.collaborators.length}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-white/60 mb-3 line-clamp-2">{project.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>{project.tracks.length} tracks</span>
                    <span>{project.current_version}</span>
                    <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {project.collaborators.slice(0, 3).map((collaborator, index) => (
                      <div 
                        key={index}
                        className="w-6 h-6 bg-purple-600/30 rounded-full flex items-center justify-center text-xs text-purple-300"
                      >
                        {collaborator.username.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {project.collaborators.length > 3 && (
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs text-white/60">
                        +{project.collaborators.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Project Interface */}
      {selectedProject && currentProject && (
        <div className="space-y-6">
          {/* Project Header */}
          <div className="bg-white/5 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="text-white/60 hover:text-white"
                >
                  ← Back to Projects
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-white">{currentProject.name}</h2>
                  <p className="text-white/60">{currentProject.description}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleCreateTrack}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add Track
                </button>
                
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors">
                  <Share2 size={16} />
                  Invite
                </button>
              </div>
            </div>
            
            {/* Project Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 text-center">
                <Music size={20} className="mx-auto mb-1 text-purple-400" />
                <div className="text-lg font-bold text-purple-400">{currentProject.tracks.length}</div>
                <div className="text-xs text-white/60">Tracks</div>
              </div>
              
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center">
                <Users size={20} className="mx-auto mb-1 text-green-400" />
                <div className="text-lg font-bold text-green-400">{getCollaboratorCount()}</div>
                <div className="text-xs text-white/60">Active</div>
              </div>
              
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-center">
                <GitBranch size={20} className="mx-auto mb-1 text-blue-400" />
                <div className="text-lg font-bold text-blue-400">{currentProject.version_history.length}</div>
                <div className="text-xs text-white/60">Versions</div>
              </div>
              
              <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 text-center">
                <MessageSquare size={20} className="mx-auto mb-1 text-orange-400" />
                <div className="text-lg font-bold text-orange-400">{currentProject.stats.total_comments}</div>
                <div className="text-xs text-white/60">Comments</div>
              </div>
              
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                <Clock size={20} className="mx-auto mb-1 text-yellow-400" />
                <div className="text-lg font-bold text-yellow-400">{Math.round(currentProject.stats.completion_percentage)}%</div>
                <div className="text-xs text-white/60">Complete</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'dashboard', name: 'Dashboard', count: currentProject.tracks.length },
              { id: 'editor', name: 'Track Editor', count: currentTrack ? 1 : 0 },
              { id: 'versions', name: 'Version Control', count: currentProject.version_history.length },
              { id: 'analytics', name: 'Analytics', count: analytics ? 1 : 0 },
              { id: 'settings', name: 'Settings', count: 0 },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedView === view.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {getViewIcon(view.id)}
                <span>{view.name}</span>
                {view.count > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {view.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            {selectedView === 'dashboard' && (
              <ProjectDashboard 
                projects={projects}
                onProjectSelect={(project) => {
                  setSelectedProject(project.id);
                  setSelectedTrack(project.tracks?.[0]?.id || null);
                }}
                onCreateProject={handleCreateProject}
              />
            )}

            {selectedView === 'editor' && currentTrack && (
              <TrackEditor track={currentTrack} />
            )}

            {selectedView === 'versions' && currentProject && (
              <VersionControl projectId={currentProject.id} />
            )}

            {selectedView === 'analytics' && (
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Project Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-white">Collaboration Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/80">Total Sessions:</span>
                        <span className="text-white">{currentProject.stats.total_sessions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Active Collaborators:</span>
                        <span className="text-white">{currentProject.stats.active_collaborators}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Total Comments:</span>
                        <span className="text-white">{currentProject.stats.total_comments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Suggestions:</span>
                        <span className="text-white">{currentProject.stats.total_suggestions}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-white">Progress Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/80">Completion:</span>
                        <span className="text-white">{Math.round(currentProject.stats.completion_percentage)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Quality Score:</span>
                        <span className="text-white">{Math.round(currentProject.stats.quality_score)}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Approval Rate:</span>
                        <span className="text-white">{Math.round(currentProject.stats.approval_rate * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Days Remaining:</span>
                        <span className="text-white">{currentProject.stats.time_to_completion}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button 
                    onClick={() => loadAnalytics('week')}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Generate Detailed Analytics
                  </button>
                </div>
              </div>
            )}

            {selectedView === 'settings' && (
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Project Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-white mb-3">Collaboration Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Collaboration Mode</span>
                        <select className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white">
                          <option value="open">Open</option>
                          <option value="invite_only">Invite Only</option>
                          <option value="approval_required">Approval Required</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Max Collaborators</span>
                        <input 
                          type="number" 
                          defaultValue={currentProject.max_collaborators}
                          className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white w-20"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Auto-save Changes</span>
                        <button className="w-12 h-6 bg-green-600 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white mb-3">Workflow Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Require Approval for Changes</span>
                        <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Auto-advance Workflow</span>
                        <button className="w-12 h-6 bg-white/20 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Real-time Notifications</span>
                        <button className="w-12 h-6 bg-green-600 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Collaboration Panel */}
        {currentProject && (
          <CollaborationPanel 
            projectId={currentProject.id}
            collaborators={currentProject.collaborators}
          />
        )}
        </div>
      )}

      {/* Real-time Status Indicator */}
      {activeSession && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3 flex items-center gap-2">
            <Zap size={16} className="text-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Live Collaboration</span>
          </div>
        </div>
      )}
    </div>
  );
}
