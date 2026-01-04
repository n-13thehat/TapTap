"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Music,
  Image,
  DollarSign,
  Tag,
  Calendar,
  Globe,
  Lock,
  Users,
  X,
  Check,
  AlertCircle,
  Play,
  Pause,
  Volume2
} from 'lucide-react';

interface TrackUpload {
  id: string;
  file: File;
  title: string;
  artist: string;
  album?: string;
  genre: string;
  description: string;
  artwork?: File;
  price: number;
  isExclusive: boolean;
  releaseDate: string;
  tags: string[];
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
}

interface TrackUploadManagerProps {
  className?: string;
}

export default function TrackUploadManager({ className = '' }: TrackUploadManagerProps) {
  const [uploads, setUploads] = useState<TrackUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    audioFiles.forEach(file => {
      const newUpload: TrackUpload = {
        id: `upload-${Date.now()}-${Math.random()}`,
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'VX',
        genre: 'Electronic',
        description: '',
        price: 15.00,
        isExclusive: false,
        releaseDate: new Date().toISOString().split('T')[0],
        tags: [],
        status: 'uploading',
        progress: 0
      };

      setUploads(prev => [...prev, newUpload]);
      simulateUpload(newUpload.id);
    });
  }, []);

  const simulateUpload = (uploadId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, progress: Math.min(progress, 100) }
          : upload
      ));

      if (progress >= 100) {
        clearInterval(interval);
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'processing', progress: 100 }
            : upload
        ));

        // Simulate processing
        setTimeout(() => {
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, status: 'complete' }
              : upload
          ));
        }, 2000);
      }
    }, 200);
  };

  const removeUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  const updateUpload = (uploadId: string, updates: Partial<TrackUpload>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === uploadId 
        ? { ...upload, ...updates }
        : upload
    ));
  };

  const genres = [
    'Electronic', 'Ambient', 'Techno', 'House', 'Trance', 'Dubstep',
    'Hip Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 'Experimental'
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Upload & Manage Tracks</h2>
          <p className="text-white/70">Upload your music to the TapTap Matrix marketplace</p>
        </div>
        
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload Track
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <motion.div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive 
            ? 'border-teal-400 bg-teal-500/10' 
            : 'border-white/20 hover:border-white/40'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-white/60" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              Drop your audio files here
            </h3>
            <p className="text-white/60 text-sm">
              Supports MP3, WAV, FLAC, and other audio formats
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-sm text-white/60">
            <div className="flex items-center gap-1">
              <Music className="h-4 w-4" />
              <span>High Quality Audio</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>Set Your Price</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              <span>Global Distribution</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white">Upload Queue</h3>
            
            {uploads.map((upload) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Track Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        
                        <div>
                          <input
                            type="text"
                            value={upload.title}
                            onChange={(e) => updateUpload(upload.id, { title: e.target.value })}
                            className="bg-transparent text-white font-medium text-lg border-none outline-none"
                            placeholder="Track Title"
                          />
                          <div className="text-white/60 text-sm">{upload.file.name}</div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="p-2 text-white/60 hover:text-white/80 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Upload Progress */}
                    {upload.status !== 'complete' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/60">
                            {upload.status === 'uploading' ? 'Uploading...' : 
                             upload.status === 'processing' ? 'Processing...' : 
                             'Upload Error'}
                          </span>
                          <span className="text-white/60">{Math.round(upload.progress)}%</span>
                        </div>
                        
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              upload.status === 'error' ? 'bg-red-500' : 'bg-teal-500'
                            }`}
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Track Details Form */}
                    {upload.status === 'complete' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/60 text-sm mb-2">Genre</label>
                          <select
                            value={upload.genre}
                            onChange={(e) => updateUpload(upload.id, { genre: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                          >
                            {genres.map(genre => (
                              <option key={genre} value={genre}>{genre}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-white/60 text-sm mb-2">Price (TapCoins)</label>
                          <input
                            type="number"
                            value={upload.price}
                            onChange={(e) => updateUpload(upload.id, { price: parseFloat(e.target.value) })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-white/60 text-sm mb-2">Description</label>
                          <textarea
                            value={upload.description}
                            onChange={(e) => updateUpload(upload.id, { description: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white h-20 resize-none"
                            placeholder="Describe your track..."
                          />
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-white/70">
                            <input
                              type="checkbox"
                              checked={upload.isExclusive}
                              onChange={(e) => updateUpload(upload.id, { isExclusive: e.target.checked })}
                              className="rounded"
                            />
                            <Lock className="h-4 w-4" />
                            Exclusive Release
                          </label>
                        </div>
                        
                        <div className="flex gap-2">
                          <button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-lg transition-colors">
                            Publish to Marketplace
                          </button>
                          <button className="bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors">
                            Save Draft
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    {upload.status === 'complete' && (
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Check className="h-5 w-5 text-green-400" />
                      </div>
                    )}
                    {upload.status === 'error' && (
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
