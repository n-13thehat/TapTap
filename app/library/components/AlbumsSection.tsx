import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Album as AlbumIcon, Disc3, Play, Heart, MoreHorizontal } from 'lucide-react';
import { Album } from '../types';
import { Header } from './Header';
import { EmptyState } from './EmptyState';

interface AlbumCardProps {
  a: Album;
  onPlay: (album: Album) => void;
}

function AlbumCard({ a, onPlay }: AlbumCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="group cursor-pointer space-y-4 rounded-xl p-4 hover:bg-white/5 transition-all duration-300"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl shadow-lg">
        <motion.img
          src={a.cover}
          alt={`${a.title} cover`}
          className="h-full w-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />

        {/* Overlay with Play Button */}
        <motion.div
          className="absolute inset-0 bg-black/40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            onClick={() => onPlay(a)}
            className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-xl hover:bg-white/90 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0 }}
            animate={{ scale: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Play className="w-6 h-6 ml-1" />
          </motion.button>
        </motion.div>

        {/* Quality Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs bg-black/60 text-white rounded-full backdrop-blur-sm">
            HiFi
          </span>
        </div>

        {/* Action Buttons */}
        <motion.div
          className="absolute top-3 right-3 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className="w-4 h-4" />
          </motion.button>
          <motion.button
            className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>

      {/* Album Info */}
      <div className="space-y-2">
        <div className="truncate text-base font-medium text-white group-hover:text-teal-300 transition-colors">
          {a.title}
        </div>
        <div className="truncate text-sm text-white/70">
          {a.artist}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>{a.tracks} tracks</span>
          <span>•</span>
          <span>{new Date(a.releaseDate).getFullYear()}</span>
        </div>
      </div>
    </motion.div>
  );
}

interface AlbumsSectionProps {
  albums: Album[];
  onPlay: (album: Album) => void;
}

export function AlbumsSection({ albums, onPlay }: AlbumsSectionProps) {
  if (!albums.length) {
    return (
      <EmptyState
        title="No albums yet"
        description="Curate albums by saving individual tracks or importing full releases."
        action={{ label: "Import Purchase", href: "/library/import-purchases" }}
      />
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">Albums</h2>
          <p className="text-white/60 text-sm">{albums.length} albums in your collection</p>
        </div>
      </div>

      {/* Albums Grid */}
      <motion.div
        className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {albums.map((a, index) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <AlbumCard a={a} onPlay={onPlay} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
