"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  CollaborationUser, 
  PresenceState, 
  CursorState, 
  SelectionState 
} from '@/lib/collaboration/RealTimeEngine';
import {
  MousePointer2,
  Edit,
  Move,
  Square,
  Circle,
  Scissors,
  Copy,
  Volume2,
  Mic,
  Play,
  Pause,
  Eye,
  Hand,
  Zap,
  Target,
  Crosshair,
  Navigation,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CornerDownRight,
  CornerUpLeft,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';

interface RealTimeCursorsProps {
  users: CollaborationUser[];
  presenceStates: Map<string, PresenceState>;
  currentUserId: string;
  containerRef: React.RefObject<HTMLElement>;
  onCursorMove?: (position: { x: number; y: number; trackId: string; elementType: string }) => void;
  onSelectionChange?: (selection: SelectionState) => void;
  className?: string;
}

interface CursorPosition {
  x: number;
  y: number;
  visible: boolean;
  timestamp: number;
}

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  timestamp: number;
}

interface ToolIndicator {
  icon: React.ComponentType<any>;
  color: string;
  label: string;
  size: number;
}

const TOOL_INDICATORS: { [key: string]: ToolIndicator } = {
  select: { icon: MousePointer2, color: '#ffffff', label: 'Select', size: 16 },
  edit: { icon: Edit, color: '#4ade80', label: 'Edit', size: 16 },
  move: { icon: Move, color: '#3b82f6', label: 'Move', size: 16 },
  cut: { icon: Scissors, color: '#ef4444', label: 'Cut', size: 16 },
  copy: { icon: Copy, color: '#f59e0b', label: 'Copy', size: 16 },
  volume: { icon: Volume2, color: '#8b5cf6', label: 'Volume', size: 16 },
  record: { icon: Circle, color: '#dc2626', label: 'Record', size: 16 },
  play: { icon: Play, color: '#10b981', label: 'Play', size: 16 },
  pause: { icon: Pause, color: '#f59e0b', label: 'Pause', size: 16 },
  zoom: { icon: Eye, color: '#06b6d4', label: 'Zoom', size: 16 },
  hand: { icon: Hand, color: '#84cc16', label: 'Hand', size: 16 },
  crosshair: { icon: Crosshair, color: '#f97316', label: 'Crosshair', size: 16 },
  target: { icon: Target, color: '#ec4899', label: 'Target', size: 16 },
};

export default function RealTimeCursors({
  users,
  presenceStates,
  currentUserId,
  containerRef,
  onCursorMove,
  onSelectionChange,
  className = ''
}: RealTimeCursorsProps) {
  const [cursorPositions, setCursorPositions] = useState<Map<string, CursorPosition>>(new Map());
  const [selectionBoxes, setSelectionBoxes] = useState<Map<string, SelectionBox>>(new Map());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [currentSelection, setCurrentSelection] = useState<SelectionBox | null>(null);
  
  const animationFrameRef = useRef<number>();
  const lastUpdateTime = useRef<number>(0);
  const cursorTrails = useRef<Map<string, { x: number; y: number; timestamp: number }[]>>(new Map());

  // Update cursor positions from presence states
  useEffect(() => {
    const updateCursors = () => {
      const newPositions = new Map<string, CursorPosition>();
      const newSelections = new Map<string, SelectionBox>();

      presenceStates.forEach((presence, userId) => {
        if (userId === currentUserId) return; // Don't show own cursor

        const user = users.find(u => u.id === userId);
        if (!user || !presence.cursor.visible) return;

        // Convert cursor position to screen coordinates
        const position = convertToScreenCoordinates(presence.cursor, presence.viewport);
        if (position) {
          newPositions.set(userId, {
            ...position,
            visible: true,
            timestamp: presence.lastUpdate,
          });

          // Update cursor trail
          const trail = cursorTrails.current.get(userId) || [];
          trail.push({ x: position.x, y: position.y, timestamp: Date.now() });
          
          // Keep only last 10 trail points and remove old ones
          const filteredTrail = trail
            .filter(point => Date.now() - point.timestamp < 2000)
            .slice(-10);
          cursorTrails.current.set(userId, filteredTrail);
        }

        // Convert selection to screen coordinates
        if (presence.selection.elementIds.length > 0) {
          const selectionBox = convertSelectionToScreenCoordinates(presence.selection, presence.viewport);
          if (selectionBox) {
            newSelections.set(userId, {
              ...selectionBox,
              visible: true,
              timestamp: presence.lastUpdate,
            });
          }
        }
      });

      setCursorPositions(newPositions);
      setSelectionBoxes(newSelections);
    };

    updateCursors();
    
    // Update every 16ms (60fps)
    const interval = setInterval(updateCursors, 16);
    return () => clearInterval(interval);
  }, [presenceStates, users, currentUserId]);

  // Handle mouse movement
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to track coordinates
    const trackPosition = convertToTrackCoordinates(x, y);
    
    if (onCursorMove && trackPosition) {
      onCursorMove({
        x: trackPosition.x,
        y: trackPosition.y,
        trackId: trackPosition.trackId,
        elementType: trackPosition.elementType,
      });
    }

    // Update selection if selecting
    if (isSelecting && selectionStart) {
      const width = x - selectionStart.x;
      const height = y - selectionStart.y;
      
      setCurrentSelection({
        x: width >= 0 ? selectionStart.x : x,
        y: height >= 0 ? selectionStart.y : y,
        width: Math.abs(width),
        height: Math.abs(height),
        visible: true,
        timestamp: Date.now(),
      });
    }
  }, [containerRef, onCursorMove, isSelecting, selectionStart]);

  // Handle mouse down for selection
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!containerRef.current || event.button !== 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setIsSelecting(true);
    setSelectionStart({ x, y });
    setCurrentSelection(null);
  }, [containerRef]);

  // Handle mouse up for selection
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!isSelecting || !selectionStart || !currentSelection) {
      setIsSelecting(false);
      setSelectionStart(null);
      setCurrentSelection(null);
      return;
    }

    // Convert selection to track coordinates
    const trackSelection = convertSelectionToTrackCoordinates(currentSelection);
    
    if (onSelectionChange && trackSelection) {
      onSelectionChange(trackSelection);
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setCurrentSelection(null);
  }, [isSelecting, selectionStart, currentSelection, onSelectionChange]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]);

  // Convert cursor position to screen coordinates
  const convertToScreenCoordinates = useCallback((cursor: CursorState, viewport: any): { x: number; y: number } | null => {
    if (!containerRef.current) return null;

    // This is a simplified conversion - in a real implementation,
    // you'd need to account for the actual track layout, zoom level, scroll position, etc.
    const rect = containerRef.current.getBoundingClientRect();
    
    // Mock conversion based on cursor position and viewport
    const x = (cursor.position / 1000) * rect.width; // Assuming position is in milliseconds
    const y = 50; // Mock track height
    
    return { x, y };
  }, [containerRef]);

  // Convert selection to screen coordinates
  const convertSelectionToScreenCoordinates = useCallback((selection: SelectionState, viewport: any): SelectionBox | null => {
    if (!containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    
    // Mock conversion
    const x = (selection.startPosition / 1000) * rect.width;
    const y = 30;
    const width = ((selection.endPosition - selection.startPosition) / 1000) * rect.width;
    const height = 40;
    
    return { x, y, width, height, visible: true, timestamp: Date.now() };
  }, [containerRef]);

  // Convert screen coordinates to track coordinates
  const convertToTrackCoordinates = useCallback((x: number, y: number) => {
    if (!containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    
    // Mock conversion
    const position = (x / rect.width) * 1000; // Convert to milliseconds
    const trackId = `track_${Math.floor(y / 60)}`; // Assuming 60px track height
    
    return {
      x: position,
      y,
      trackId,
      elementType: 'audio' as const,
    };
  }, [containerRef]);

  // Convert selection to track coordinates
  const convertSelectionToTrackCoordinates = useCallback((selection: SelectionBox): SelectionState | null => {
    if (!containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    
    // Mock conversion
    const startPosition = (selection.x / rect.width) * 1000;
    const endPosition = ((selection.x + selection.width) / rect.width) * 1000;
    const trackId = `track_${Math.floor(selection.y / 60)}`;
    
    return {
      trackId,
      startPosition,
      endPosition,
      elementType: 'audio',
      elementIds: [],
      selectionType: 'range',
      color: '#3b82f6',
    };
  }, [containerRef]);

  // Get tool indicator for user
  const getToolIndicator = useCallback((userId: string): ToolIndicator => {
    const presence = presenceStates.get(userId);
    const tool = presence?.activity.currentTool || 'select';
    return TOOL_INDICATORS[tool] || TOOL_INDICATORS.select;
  }, [presenceStates]);

  // Get user color
  const getUserColor = useCallback((userId: string): string => {
    const presence = presenceStates.get(userId);
    return presence?.cursor.color || '#3b82f6';
  }, [presenceStates]);

  // Render cursor trail
  const renderCursorTrail = useCallback((userId: string, currentPos: CursorPosition) => {
    const trail = cursorTrails.current.get(userId) || [];
    if (trail.length < 2) return null;

    const color = getUserColor(userId);
    
    return (
      <svg
        key={`trail-${userId}`}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <path
          d={`M ${trail.map(point => `${point.x},${point.y}`).join(' L ')}`}
          stroke={color}
          strokeWidth="2"
          fill="none"
          opacity="0.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }, [getUserColor]);

  // Render user cursor
  const renderUserCursor = useCallback((userId: string, position: CursorPosition) => {
    const user = users.find(u => u.id === userId);
    const presence = presenceStates.get(userId);
    if (!user || !presence || !position.visible) return null;

    const color = getUserColor(userId);
    const toolIndicator = getToolIndicator(userId);
    const ToolIcon = toolIndicator.icon;
    
    // Check if cursor is recently active
    const isActive = Date.now() - position.timestamp < 5000;
    const isVeryActive = Date.now() - position.timestamp < 1000;
    
    return (
      <div
        key={`cursor-${userId}`}
        className={`absolute pointer-events-none transition-opacity duration-300 ${
          isActive ? 'opacity-100' : 'opacity-50'
        }`}
        style={{
          left: position.x,
          top: position.y,
          zIndex: 20,
          transform: 'translate(-2px, -2px)',
        }}
      >
        {/* Cursor trail */}
        {renderCursorTrail(userId, position)}
        
        {/* Main cursor */}
        <div className="relative">
          {/* Cursor pointer */}
          <div
            className={`w-4 h-4 transform rotate-12 transition-all duration-200 ${
              isVeryActive ? 'scale-110' : 'scale-100'
            }`}
            style={{ color }}
          >
            <MousePointer2 size={16} fill="currentColor" />
          </div>
          
          {/* Tool indicator */}
          <div
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center transition-all duration-200 ${
              isVeryActive ? 'scale-110' : 'scale-100'
            }`}
            style={{ backgroundColor: toolIndicator.color }}
          >
            <ToolIcon size={8} className="text-white" />
          </div>
          
          {/* User label */}
          <div
            className={`absolute top-5 left-2 px-2 py-1 rounded text-xs font-medium text-white shadow-lg transition-all duration-200 ${
              isVeryActive ? 'scale-105' : 'scale-100'
            }`}
            style={{ backgroundColor: color }}
          >
            {user.username}
            {presence.activity.isRecording && (
              <div className="inline-flex items-center ml-1">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              </div>
            )}
          </div>
          
          {/* Activity indicator */}
          {presence.activity.mode !== 'editing' && (
            <div
              className="absolute -bottom-1 -left-1 px-1 py-0.5 rounded text-xs text-white"
              style={{ backgroundColor: color, opacity: 0.8 }}
            >
              {presence.activity.mode}
            </div>
          )}
          
          {/* Pulse animation for very active cursors */}
          {isVeryActive && (
            <div
              className="absolute inset-0 w-4 h-4 rounded-full animate-ping"
              style={{ backgroundColor: color, opacity: 0.3 }}
            />
          )}
        </div>
      </div>
    );
  }, [users, presenceStates, getUserColor, getToolIndicator, renderCursorTrail]);

  // Render user selection
  const renderUserSelection = useCallback((userId: string, selection: SelectionBox) => {
    const user = users.find(u => u.id === userId);
    if (!user || !selection.visible) return null;

    const color = getUserColor(userId);
    const isActive = Date.now() - selection.timestamp < 5000;
    
    return (
      <div
        key={`selection-${userId}`}
        className={`absolute pointer-events-none border-2 border-dashed transition-opacity duration-300 ${
          isActive ? 'opacity-60' : 'opacity-30'
        }`}
        style={{
          left: selection.x,
          top: selection.y,
          width: selection.width,
          height: selection.height,
          borderColor: color,
          backgroundColor: `${color}20`,
          zIndex: 15,
        }}
      >
        {/* Selection label */}
        <div
          className="absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white shadow-lg"
          style={{ backgroundColor: color }}
        >
          {user.username} selection
        </div>
        
        {/* Selection handles */}
        <div
          className="absolute -top-1 -left-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div
          className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div
          className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    );
  }, [users, getUserColor]);

  // Render current user's selection
  const renderCurrentSelection = useCallback(() => {
    if (!currentSelection || !currentSelection.visible) return null;
    
    return (
      <div
        className="absolute pointer-events-none border-2 border-blue-400 bg-blue-400/20"
        style={{
          left: currentSelection.x,
          top: currentSelection.y,
          width: currentSelection.width,
          height: currentSelection.height,
          zIndex: 25,
        }}
      >
        {/* Selection info */}
        <div className="absolute -top-6 left-0 px-2 py-1 bg-blue-600 rounded text-xs font-medium text-white shadow-lg">
          {Math.round(currentSelection.width)} × {Math.round(currentSelection.height)}
        </div>
      </div>
    );
  }, [currentSelection]);

  // Render viewport indicators
  const renderViewportIndicators = useCallback(() => {
    const indicators: React.ReactNode[] = [];
    
    presenceStates.forEach((presence, userId) => {
      if (userId === currentUserId) return;
      
      const user = users.find(u => u.id === userId);
      if (!user || !presence.viewport) return;
      
      const color = getUserColor(userId);
      
      // Render viewport bounds (simplified)
      if (presence.viewport.followMode !== 'none') {
        indicators.push(
          <div
            key={`viewport-${userId}`}
            className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
            style={{
              backgroundColor: color,
              opacity: 0.5,
              zIndex: 5,
            }}
          >
            <div className="absolute -top-4 left-2 text-xs text-white font-medium">
              {user.username} viewport
            </div>
          </div>
        );
      }
    });
    
    return indicators;
  }, [presenceStates, currentUserId, users, getUserColor]);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Viewport indicators */}
      {renderViewportIndicators()}
      
      {/* User selections */}
      {Array.from(selectionBoxes.entries()).map(([userId, selection]) =>
        renderUserSelection(userId, selection)
      )}
      
      {/* Current user selection */}
      {renderCurrentSelection()}
      
      {/* User cursors */}
      {Array.from(cursorPositions.entries()).map(([userId, position]) =>
        renderUserCursor(userId, position)
      )}
      
      {/* Collaboration stats overlay */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-2 text-white text-xs pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>{cursorPositions.size} active</span>
          </div>
          
          {selectionBoxes.size > 0 && (
            <div className="flex items-center gap-1">
              <Square size={8} />
              <span>{selectionBoxes.size} selected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
