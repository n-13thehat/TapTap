"use client";

import React, { useState, Suspense } from "react";
import { Eye, Palette, Sparkles, Zap, Globe, Play, Pause } from "lucide-react";
import { dynamicVisual } from "@/lib/utils/dynamic-imports";

// Dynamic imports for visual components
const MatrixRain = dynamicVisual(() => import("./MatrixRain"));
const GalaxyScene = dynamicVisual(() => import("./GalaxyScene"));
const AbstractOrb = dynamicVisual(() => import("./AbstractOrb"));
const SpinningLogo = dynamicVisual(() => import("./SpinningLogo"));
const MatrixLoaderLite = dynamicVisual(() => import("./MatrixLoaderLite"));

interface VisualDemo {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
  icon: React.ComponentType<any>;
  props?: any;
}

const visualDemos: VisualDemo[] = [
  {
    id: 'matrix-rain',
    name: 'Matrix Rain',
    description: 'Classic digital rain effect with customizable colors and speed',
    component: MatrixRain,
    icon: Zap,
    props: { density: 0.8, speed: 1.2 }
  },
  {
    id: 'galaxy-scene',
    name: 'Galaxy Scene',
    description: 'Interactive 3D galaxy with particle effects and cosmic ambiance',
    component: GalaxyScene,
    icon: Globe,
    props: { particleCount: 1000 }
  },
  {
    id: 'abstract-orb',
    name: 'Abstract Orb',
    description: 'Floating geometric orb with dynamic lighting and rotation',
    component: AbstractOrb,
    icon: Sparkles,
    props: { size: 200, animated: true }
  },
  {
    id: 'spinning-logo',
    name: 'Spinning Logo',
    description: 'Animated TapTap logo with smooth rotation and glow effects',
    component: SpinningLogo,
    icon: Play,
    props: { speed: 1 }
  },
  {
    id: 'matrix-loader',
    name: 'Matrix Loader',
    description: 'Lightweight loading animation with matrix-style aesthetics',
    component: MatrixLoaderLite,
    icon: Eye,
    props: {}
  }
];

export default function VisualsPage() {
  const [activeDemo, setActiveDemo] = useState<string>(visualDemos[0].id);
  const [isPlaying, setIsPlaying] = useState(true);

  const currentDemo = visualDemos.find(demo => demo.id === activeDemo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400">
              <Palette className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Visual Components</h1>
              <p className="text-white/60">Interactive showcase of TapTap Matrix visual effects</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">Components</h2>
              {visualDemos.map((demo) => {
                const Icon = demo.icon;
                return (
                  <button
                    key={demo.id}
                    onClick={() => setActiveDemo(demo.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      activeDemo === demo.id
                        ? 'border-teal-400/50 bg-teal-400/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{demo.name}</div>
                        <div className="text-xs text-white/50">{demo.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm">
              {/* Controls */}
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div>
                  <h3 className="font-semibold text-white">{currentDemo?.name}</h3>
                  <p className="text-sm text-white/60">{currentDemo?.description}</p>
                </div>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 rounded-lg bg-teal-500 px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-teal-400"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              </div>

              {/* Visual Demo Area */}
              <div className="relative aspect-video overflow-hidden rounded-b-xl bg-black">
                {currentDemo && isPlaying && (
                  <Suspense fallback={
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-white/60">Loading visual...</p>
                      </div>
                    </div>
                  }>
                    <currentDemo.component {...(currentDemo.props || {})} />
                  </Suspense>
                )}
                {!isPlaying && (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Play className="h-12 w-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">Click Play to start the visual</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
