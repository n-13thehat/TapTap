"use client";

import { useState } from 'react';
import { Zap, Users, Clock, Trophy, Music, Settings } from 'lucide-react';

interface BattleCreationWizardProps {
  onComplete?: (battle: any) => void;
  onClose?: () => void;
}

export default function BattleCreationWizard({ onComplete, onClose }: BattleCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [battleData, setBattleData] = useState({
    title: '',
    description: '',
    type: 'freestyle',
    duration: 7,
    maxParticipants: 8,
    genre: 'any',
    rules: [],
    prize: 0,
    isPublic: true
  });

  const battleTypes = [
    { id: 'freestyle', name: 'Freestyle Battle', description: 'Open creativity battle' },
    { id: 'remix', name: 'Remix Challenge', description: 'Remix provided stems' },
    { id: 'genre', name: 'Genre Battle', description: 'Specific genre focus' },
    { id: 'collab', name: 'Collaboration', description: 'Team-based creation' }
  ];

  const handleCreate = () => {
    const newBattle = {
      id: Date.now().toString(),
      ...battleData,
      createdAt: new Date().toISOString(),
      status: 'upcoming',
      participants: [],
      submissions: []
    };

    if (onComplete) {
      onComplete(newBattle);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap size={20} className="text-yellow-400" />
          Create New Battle
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-white/60">Step {step} of 3</div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Battle Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Battle Title</label>
              <input
                type="text"
                value={battleData.title}
                onChange={(e) => setBattleData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Epic Beat Battle 2024"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/40"
              />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-2">Description</label>
              <textarea
                value={battleData.description}
                onChange={(e) => setBattleData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your battle..."
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/40 h-24"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Battle Type</label>
                <select
                  value={battleData.type}
                  onChange={(e) => setBattleData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                >
                  {battleTypes.map((type) => (
                    <option key={type.id} value={type.id} className="bg-gray-800">
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Genre</label>
                <select
                  value={battleData.genre}
                  onChange={(e) => setBattleData(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                >
                  <option value="any">Any Genre</option>
                  <option value="electronic">Electronic</option>
                  <option value="hip-hop">Hip Hop</option>
                  <option value="rock">Rock</option>
                  <option value="pop">Pop</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Battle Settings</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={battleData.duration}
                  onChange={(e) => setBattleData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">Max Participants</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={battleData.maxParticipants}
                  onChange={(e) => setBattleData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-2">Prize Pool (TAP)</label>
              <input
                type="number"
                min="0"
                value={battleData.prize}
                onChange={(e) => setBattleData(prev => ({ ...prev, prize: parseInt(e.target.value) }))}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={battleData.isPublic}
                onChange={(e) => setBattleData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="rounded"
              />
              <span className="text-white/80">Make battle public</span>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Review & Create</h4>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h5 className="text-white font-medium mb-2">{battleData.title}</h5>
              <p className="text-white/80 text-sm mb-3">{battleData.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Type:</span>
                  <span className="text-white ml-2 capitalize">{battleData.type}</span>
                </div>
                <div>
                  <span className="text-white/60">Duration:</span>
                  <span className="text-white ml-2">{battleData.duration} days</span>
                </div>
                <div>
                  <span className="text-white/60">Participants:</span>
                  <span className="text-white ml-2">Max {battleData.maxParticipants}</span>
                </div>
                <div>
                  <span className="text-white/60">Prize:</span>
                  <span className="text-white ml-2">{battleData.prize} TAP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-6 py-2 rounded-lg text-white/60 hover:text-white transition-colors disabled:opacity-50"
        >
          Previous
        </button>
        
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded-lg text-white transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white transition-colors"
          >
            Create Battle
          </button>
        )}
      </div>
    </div>
  );
}
