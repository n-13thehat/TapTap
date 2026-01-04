"use client";

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Music, 
  FileAudio, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Play,
  Pause
} from 'lucide-react';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  preview?: string;
}

interface DragDropUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export default function DragDropUpload({
  onUpload,
  maxFiles = 10,
  maxSize = 100,
  acceptedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg'],
  className = ''
}: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not supported`;
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }
    return null;
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadFile[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (!error && files.length + validFiles.length < maxFiles) {
        const uploadFile: UploadFile = {
          file,
          id: `${Date.now()}-${Math.random()}`,
          progress: 0,
          status: 'pending'
        };

        // Create audio preview URL
        uploadFile.preview = URL.createObjectURL(file);
        validFiles.push(uploadFile);
      }
    });

    setFiles(prev => [...prev, ...validFiles]);
  }, [files.length, maxFiles, maxSize, acceptedTypes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const togglePlayback = useCallback((uploadFile: UploadFile) => {
    if (!audioRef.current || !uploadFile.preview) return;

    if (playingId === uploadFile.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = uploadFile.preview;
      audioRef.current.play();
      setPlayingId(uploadFile.id);
    }
  }, [playingId]);

  const startUpload = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const filesToUpload = files.filter(f => f.status === 'pending').map(f => f.file);

    try {
      await onUpload(filesToUpload);
      
      // Mark all files as complete
      setFiles(prev => prev.map(f => ({ ...f, status: 'complete' as const, progress: 100 })));
    } catch (error) {
      // Mark files as error
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'error' as const, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      })));
    } finally {
      setIsUploading(false);
    }
  }, [files, onUpload]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag & Drop Zone */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging 
            ? 'border-teal-400 bg-teal-400/10 ring-1 ring-teal-400/30' 
            : 'border-white/20 bg-white/5 hover:bg-white/10'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center">
            <Upload className="h-8 w-8 text-teal-300" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Drop your music files here
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Or click to browse • Max {maxSize}MB per file • {acceptedTypes.length} formats supported
            </p>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 px-4 py-2 rounded-lg transition-colors"
            >
              <FileAudio className="h-4 w-4" />
              Choose Files
            </button>
          </div>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">
                Files ({files.length}/{maxFiles})
              </h4>
              {files.some(f => f.status === 'pending') && (
                <button
                  onClick={startUpload}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload All'}
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((uploadFile) => (
                <FileItem
                  key={uploadFile.id}
                  uploadFile={uploadFile}
                  isPlaying={playingId === uploadFile.id}
                  onRemove={() => removeFile(uploadFile.id)}
                  onTogglePlay={() => togglePlayback(uploadFile)}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden audio element for preview */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        onError={() => setPlayingId(null)}
      />
    </div>
  );
}

function FileItem({ 
  uploadFile, 
  isPlaying, 
  onRemove, 
  onTogglePlay, 
  formatFileSize 
}: {
  uploadFile: UploadFile;
  isPlaying: boolean;
  onRemove: () => void;
  onTogglePlay: () => void;
  formatFileSize: (bytes: number) => string;
}) {
  const getStatusIcon = () => {
    switch (uploadFile.status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-teal-400 animate-spin" />;
      default:
        return <Music className="h-4 w-4 text-white/60" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
    >
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white truncate">
            {uploadFile.file.name}
          </p>
          <div className="flex items-center gap-2">
            {uploadFile.preview && (
              <button
                onClick={onTogglePlay}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-3 w-3 text-white/70" />
                ) : (
                  <Play className="h-3 w-3 text-white/70" />
                )}
              </button>
            )}
            <button
              onClick={onRemove}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="h-3 w-3 text-white/70" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-white/50">
            {formatFileSize(uploadFile.file.size)}
          </p>
          {uploadFile.status === 'error' && uploadFile.error && (
            <p className="text-xs text-red-400">{uploadFile.error}</p>
          )}
        </div>
        
        {uploadFile.status === 'uploading' && (
          <div className="mt-2">
            <div className="w-full bg-white/10 rounded-full h-1">
              <div 
                className="bg-teal-400 h-1 rounded-full transition-all duration-300"
                style={{ width: `${uploadFile.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
