"use client";

import { useState } from 'react';
import { Edit3, Trash2, Clock, Music, Image, Video, Send } from 'lucide-react';

interface DraftsListProps {
  drafts?: any[];
  onEditDraft?: (draft: any) => void;
  onDeleteDraft?: (draftId: string) => void;
  onPublishDraft?: (draftId: string) => void;
}

export default function DraftsList({ 
  drafts = [], 
  onEditDraft, 
  onDeleteDraft, 
  onPublishDraft 
}: DraftsListProps) {
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);

  const mockDrafts = drafts.length > 0 ? drafts : [
    {
      id: '1',
      content: 'Working on a new electronic track with some amazing synth work...',
      media: {
        type: 'audio',
        title: 'Untitled Track 1',
        duration: '2:34',
        thumbnail: null
      },
      tags: ['electronic', 'synth', 'wip'],
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T14:20:00Z',
      wordCount: 65,
      hasMedia: true
    },
    {
      id: '2',
      content: 'Just finished my home studio setup! Here\'s a quick tour of my new gear...',
      media: {
        type: 'image',
        url: '/studio-setup.jpg',
        alt: 'Home studio setup'
      },
      tags: ['studio', 'gear', 'setup'],
      createdAt: '2024-01-14T16:45:00Z',
      updatedAt: '2024-01-14T16:45:00Z',
      wordCount: 42,
      hasMedia: true
    },
    {
      id: '3',
      content: 'Thoughts on the future of AI in music production. What do you all think about...',
      media: null,
      tags: ['ai', 'music', 'production', 'discussion'],
      createdAt: '2024-01-13T09:15:00Z',
      updatedAt: '2024-01-13T11:30:00Z',
      wordCount: 156,
      hasMedia: false
    },
    {
      id: '4',
      content: 'Behind the scenes of my latest collaboration with @VocalVibes...',
      media: {
        type: 'video',
        url: '/collab-bts.mp4',
        thumbnail: '/collab-thumb.jpg',
        duration: '5:23'
      },
      tags: ['collaboration', 'bts', 'vocals'],
      createdAt: '2024-01-12T20:00:00Z',
      updatedAt: '2024-01-13T08:45:00Z',
      wordCount: 89,
      hasMedia: true
    }
  ];

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'audio': return <Music size={16} className="text-green-400" />;
      case 'image': return <Image size={16} className="text-blue-400" />;
      case 'video': return <Video size={16} className="text-purple-400" />;
      default: return null;
    }
  };

  const handleSelectDraft = (draftId: string) => {
    setSelectedDrafts(prev => 
      prev.includes(draftId) 
        ? prev.filter(id => id !== draftId)
        : [...prev, draftId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDrafts.length === mockDrafts.length) {
      setSelectedDrafts([]);
    } else {
      setSelectedDrafts(mockDrafts.map(draft => draft.id));
    }
  };

  const handleBulkDelete = () => {
    selectedDrafts.forEach(draftId => {
      if (onDeleteDraft) {
        onDeleteDraft(draftId);
      }
    });
    setSelectedDrafts([]);
  };

  const handleEdit = (draft: any) => {
    if (onEditDraft) {
      onEditDraft(draft);
    }
  };

  const handleDelete = (draftId: string) => {
    if (onDeleteDraft) {
      onDeleteDraft(draftId);
    }
  };

  const handlePublish = (draftId: string) => {
    if (onPublishDraft) {
      onPublishDraft(draftId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Drafts ({mockDrafts.length})
        </h3>
        
        {selectedDrafts.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">
              {selectedDrafts.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-sm transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {mockDrafts.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedDrafts.length === mockDrafts.length}
              onChange={handleSelectAll}
              className="rounded"
            />
            <span className="text-white/80 text-sm">Select All</span>
          </label>
        </div>
      )}

      {/* Drafts List */}
      <div className="space-y-3">
        {mockDrafts.map((draft) => (
          <div
            key={draft.id}
            className={`bg-white/5 rounded-lg p-4 transition-all hover:bg-white/10 ${
              selectedDrafts.includes(draft.id) ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedDrafts.includes(draft.id)}
                onChange={() => handleSelectDraft(draft.id)}
                className="rounded mt-1"
              />
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-white/90 line-clamp-2 mb-2">
                      {draft.content}
                    </p>
                    
                    {/* Media Preview */}
                    {draft.media && (
                      <div className="bg-white/5 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          {getMediaIcon(draft.media.type)}
                          <span className="text-white/80 text-sm">
                            {draft.media.title || 'Media attachment'}
                          </span>
                          {draft.media.duration && (
                            <span className="text-white/60 text-xs">
                              {draft.media.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {draft.tags && draft.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {draft.tags.slice(0, 3).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {draft.tags.length > 3 && (
                          <span className="text-white/60 text-xs">
                            +{draft.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Draft Info */}
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Updated {getTimeAgo(draft.updatedAt)}
                      </span>
                      <span>{draft.wordCount} words</span>
                      {draft.hasMedia && (
                        <span className="flex items-center gap-1">
                          {getMediaIcon(draft.media?.type || 'audio')}
                          Media
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(draft)}
                      className="bg-blue-600 hover:bg-blue-700 p-2 rounded transition-colors"
                      title="Edit Draft"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handlePublish(draft.id)}
                      className="bg-green-600 hover:bg-green-700 p-2 rounded transition-colors"
                      title="Publish Draft"
                    >
                      <Send size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="bg-red-600 hover:bg-red-700 p-2 rounded transition-colors"
                      title="Delete Draft"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mockDrafts.length === 0 && (
        <div className="text-center py-12">
          <Edit3 size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/60 mb-2">No drafts yet</p>
          <p className="text-white/40 text-sm">
            Start writing a post and save it as a draft
          </p>
        </div>
      )}
    </div>
  );
}
