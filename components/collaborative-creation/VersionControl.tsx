"use client";

import { useState } from 'react';
import { GitBranch, Clock, User, Download, Upload, Merge } from 'lucide-react';

interface VersionControlProps {
  projectId?: string;
  onVersionSelect?: (version: any) => void;
}

export default function VersionControl({ projectId, onVersionSelect }: VersionControlProps) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const versions = [
    {
      id: 'v1.3',
      message: 'Added vocal harmonies and refined mix',
      author: 'VocalVibes',
      timestamp: '2 hours ago',
      changes: ['Added vocal track', 'Adjusted EQ on drums', 'Increased reverb on synth'],
      isCurrent: true
    },
    {
      id: 'v1.2',
      message: 'Enhanced drum patterns and bass line',
      author: 'BeatMaker',
      timestamp: '1 day ago',
      changes: ['New drum pattern', 'Bass line variation', 'Tempo adjustment'],
      isCurrent: false
    },
    {
      id: 'v1.1',
      message: 'Initial synth layers and structure',
      author: 'SynthWave',
      timestamp: '3 days ago',
      changes: ['Added synth pad', 'Created song structure', 'Set tempo to 128 BPM'],
      isCurrent: false
    },
    {
      id: 'v1.0',
      message: 'Project initialization',
      author: 'BeatMaker',
      timestamp: '1 week ago',
      changes: ['Created project', 'Added basic drum loop'],
      isCurrent: false
    }
  ];

  const handleVersionSelect = (version: any) => {
    setSelectedVersion(version.id);
    if (onVersionSelect) {
      onVersionSelect(version);
    }
  };

  const handleRevert = (versionId: string) => {
    console.log(`Reverting to version ${versionId}`);
  };

  const handleCreateBranch = () => {
    console.log('Creating new branch');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <GitBranch size={20} className="text-purple-400" />
          Version Control
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCreateBranch}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white text-sm transition-colors"
          >
            New Branch
          </button>
          <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white text-sm transition-colors">
            <Upload size={16} className="inline mr-2" />
            Push
          </button>
        </div>
      </div>

      {/* Current Version Info */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">Current Version: v1.3</h4>
            <p className="text-white/80 text-sm">Added vocal harmonies and refined mix</p>
            <div className="flex items-center gap-4 text-xs text-white/60 mt-2">
              <span>by VocalVibes</span>
              <span>2 hours ago</span>
              <span>3 changes</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm transition-colors">
              <Download size={14} className="inline mr-1" />
              Export
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm transition-colors">
              <Merge size={14} className="inline mr-1" />
              Merge
            </button>
          </div>
        </div>
      </div>

      {/* Version History */}
      <div className="bg-white/5 rounded-lg p-6">
        <h4 className="text-white font-medium mb-4">Version History</h4>
        
        <div className="space-y-4">
          {versions.map((version, index) => (
            <div
              key={version.id}
              onClick={() => handleVersionSelect(version)}
              className={`bg-white/5 rounded-lg p-4 cursor-pointer transition-all hover:bg-white/10 ${
                selectedVersion === version.id ? 'ring-2 ring-purple-500' : ''
              } ${version.isCurrent ? 'border border-green-500/30' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-bold">
                    {version.id.replace('v', '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-white font-medium">{version.id}</h5>
                      {version.isCurrent && (
                        <span className="bg-green-600/20 text-green-400 px-2 py-0.5 rounded text-xs">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-white/80 text-sm mb-2">{version.message}</p>
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {version.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {version.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!version.isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevert(version.id);
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-white text-xs transition-colors"
                    >
                      Revert
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Download version ${version.id}`);
                    }}
                    className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white text-xs transition-colors"
                  >
                    <Download size={12} />
                  </button>
                </div>
              </div>

              {/* Changes List */}
              {selectedVersion === version.id && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h6 className="text-white/80 font-medium mb-2">Changes in this version:</h6>
                  <ul className="space-y-1">
                    {version.changes.map((change, changeIndex) => (
                      <li key={changeIndex} className="text-white/70 text-sm flex items-center gap-2">
                        <div className="w-1 h-1 bg-purple-400 rounded-full" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Branch Information */}
      <div className="bg-white/5 rounded-lg p-6">
        <h4 className="text-white font-medium mb-4">Branch Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h5 className="text-white font-medium mb-2">Main Branch</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/80">Latest Version:</span>
                <span className="text-purple-400">v1.3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Contributors:</span>
                <span className="text-white/60">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Total Commits:</span>
                <span className="text-white/60">4</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h5 className="text-white font-medium mb-2">Collaboration Stats</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/80">Active Branches:</span>
                <span className="text-green-400">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Pending Merges:</span>
                <span className="text-yellow-400">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Last Activity:</span>
                <span className="text-white/60">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
