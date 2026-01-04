"use client";

import { useState, useEffect } from 'react';
import { useDraftEditor, useSocial } from '@/hooks/useSocial';
import { SocialPost } from '@/lib/social/types';
import { 
  X, 
  Send, 
  Save, 
  Image, 
  Music, 
  Smile, 
  Hash,
  AtSign,
  Globe,
  Users,
  Lock,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PostComposerProps {
  onClose: () => void;
  onPublished: () => void;
  initialDraft?: any;
  replyTo?: SocialPost;
}

export default function PostComposer({ onClose, onPublished, initialDraft, replyTo }: PostComposerProps) {
  const { publishPost } = useSocial();
  const {
    draft,
    updateDraft,
    manualSave,
    resetDraft,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
  } = useDraftEditor(initialDraft);

  const [isPublishing, setIsPublishing] = useState(false);
  const [visibility, setVisibility] = useState<SocialPost['visibility']>('public');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const characterLimit = 2000;
  const characterCount = draft.content?.length || 0;
  const isOverLimit = characterCount > characterLimit;
  const canPublish = characterCount > 0 && !isOverLimit && !isPublishing;

  // Auto-save status
  const getSaveStatus = () => {
    if (isSaving) return { icon: Clock, text: 'Saving...', color: 'text-yellow-400' };
    if (lastSaved) return { icon: CheckCircle, text: 'Saved', color: 'text-green-400' };
    if (hasUnsavedChanges) return { icon: AlertCircle, text: 'Unsaved', color: 'text-orange-400' };
    return { icon: CheckCircle, text: 'Ready', color: 'text-white/60' };
  };

  const saveStatus = getSaveStatus();

  const handleContentChange = (content: string) => {
    updateDraft({
      ...draft,
      content,
      type: 'text',
      visibility,
      parent_id: replyTo?.id,
    });
  };

  const handlePublish = async () => {
    if (!canPublish) return;

    setIsPublishing(true);
    try {
      const postData = {
        content: draft.content,
        type: 'text' as const,
        visibility,
        parent_id: replyTo?.id,
        attachments: draft.attachments || [],
      };

      await publishPost(postData, draft.id);
      resetDraft();
      onPublished();
    } catch (error) {
      console.error('Failed to publish post:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSave = async () => {
    try {
      await manualSave();
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const getVisibilityIcon = (vis: SocialPost['visibility']) => {
    switch (vis) {
      case 'public': return <Globe size={16} />;
      case 'followers': return <Users size={16} />;
      case 'friends': return <Users size={16} />;
      case 'private': return <Lock size={16} />;
      default: return <Globe size={16} />;
    }
  };

  const getVisibilityColor = (vis: SocialPost['visibility']) => {
    switch (vis) {
      case 'public': return 'text-green-400';
      case 'followers': return 'text-blue-400';
      case 'friends': return 'text-purple-400';
      case 'private': return 'text-orange-400';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black/90 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Send size={24} className="text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                {replyTo ? 'Reply to Post' : 'Create Post'}
              </h2>
            </div>
            
            {/* Save Status */}
            <div className="flex items-center gap-1 text-sm">
              <saveStatus.icon size={14} className={saveStatus.color} />
              <span className={saveStatus.color}>{saveStatus.text}</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Reply Context */}
        {replyTo && (
          <div className="p-4 bg-white/5 border-b border-white/10">
            <div className="text-sm text-white/60 mb-2">Replying to:</div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="font-medium text-white text-sm">{replyTo.author.display_name}</div>
              <div className="text-white/80 text-sm line-clamp-2">{replyTo.content}</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Text Area */}
          <div className="relative">
            <textarea
              value={draft.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={replyTo ? "Write your reply..." : "What's on your mind?"}
              className="w-full bg-transparent border-none outline-none text-white placeholder-white/40 resize-none text-lg"
              rows={8}
              maxLength={characterLimit}
            />
            
            {/* Character Count */}
            <div className="absolute bottom-2 right-2 text-sm">
              <span className={`${isOverLimit ? 'text-red-400' : 'text-white/60'}`}>
                {characterCount}/{characterLimit}
              </span>
            </div>
          </div>

          {/* Attachments Preview */}
          {draft.attachments && draft.attachments.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">Attachments</div>
              <div className="grid grid-cols-2 gap-2">
                {draft.attachments.map((attachment, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3 flex items-center gap-2">
                    <Music size={16} className="text-blue-400" />
                    <span className="text-white/80 text-sm truncate">{attachment.title || 'Attachment'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Image size={20} className="text-white/60" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Music size={20} className="text-white/60" />
              </button>
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Smile size={20} className="text-white/60" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Hash size={20} className="text-white/60" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <AtSign size={20} className="text-white/60" />
              </button>
            </div>

            {/* Visibility Selector */}
            <div className="relative">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as SocialPost['visibility'])}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm appearance-none pr-8"
              >
                <option value="public">Public</option>
                <option value="followers">Followers</option>
                <option value="friends">Friends</option>
                <option value="private">Private</option>
              </select>
              <div className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${getVisibilityColor(visibility)}`}>
                {getVisibilityIcon(visibility)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Save size={16} />
              Save Draft
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/80 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handlePublish}
              disabled={!canPublish}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isPublishing ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  {replyTo ? 'Reply' : 'Post'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-6 bg-black/90 border border-white/20 rounded-lg p-4 z-10">
            <div className="grid grid-cols-8 gap-2">
              {['😀', '😂', '😍', '🤔', '👍', '❤️', '🔥', '🎵', '🎶', '🎸', '🎤', '🎧', '🎹', '🥳', '😎', '🤘'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleContentChange((draft.content || '') + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-2xl hover:bg-white/10 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
