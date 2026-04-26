"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Users, Music, ShoppingBag, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast-provider';
import { pageTransition, listContainer, listItem } from '@/lib/animations';

export default function UXLabPage() {
  const { toast } = useToast();
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') =>
    toast({ message, type });

  return (
    <div className="min-h-screen bg-matrix-darker p-8">
      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        className="max-w-7xl mx-auto space-y-12"
      >
        {/* Page Header */}
        <div className="relative pb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-matrix-primary/10 to-transparent -z-10 rounded-lg" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="text-4xl">🧪</div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-white mb-2">UX Lab</h1>
                <p className="text-matrix-primary/70">
                  Explore and test the TapTap Matrix design system components
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => showToast('Design system is ready!', 'success')}
                className="bg-matrix-primary hover:bg-matrix-secondary text-black"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Test Toast
              </Button>
            </div>
          </div>
        </div>

        {/* Section: Integrated Components */}
        <motion.section variants={listContainer} initial="hidden" animate="show" className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">✨ Integrated Components</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <motion.div variants={listItem}>
              <Card variant="glass" hover="lift" interactive>
                <CardHeader 
                  title="Command Palette" 
                  subtitle="Quick navigation" 
                  icon={<Zap className="w-5 h-5 text-yellow-400" />} 
                />
                <CardContent>
                  <p className="text-sm mb-3">Press <kbd className="px-2 py-1 bg-white/10 rounded">Cmd+K</kbd> to open</p>
                  <Button
                    onClick={() => {
                      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                      document.dispatchEvent(event);
                    }}
                    variant="outline"
                    className="w-full border-matrix-primary/30 text-matrix-primary"
                  >
                    Try It Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItem}>
              <Card variant="glass" hover="lift" interactive>
                <CardHeader 
                  title="Onboarding Flow" 
                  subtitle="First-time user experience" 
                  icon={<Users className="w-5 h-5 text-blue-400" />} 
                />
                <CardContent>
                  <p className="text-sm mb-3">Six-step agent-led wizard for new users</p>
                  <Button
                    onClick={() => { window.location.href = '/onboarding'; }}
                    variant="outline"
                    className="w-full border-matrix-primary/30 text-matrix-primary"
                  >
                    Open Wizard
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItem}>
              <Card variant="glass" hover="lift" interactive>
                <CardHeader 
                  title="Toast Notifications" 
                  subtitle="User feedback system" 
                  icon={<Sparkles className="w-5 h-5 text-purple-400" />} 
                />
                <CardContent>
                  <p className="text-sm mb-3">Global notification system</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => showToast('Success!', 'success')}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Success
                    </Button>
                    <Button
                      onClick={() => showToast('Error!', 'error')}
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                    >
                      Error
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>

        {/* Section: Design System Colors */}
        <motion.section variants={listContainer} initial="hidden" animate="show" className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">🎨 Design System</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div variants={listItem}>
              <Card variant="glass">
                <CardHeader title="Color Palette" subtitle="Matrix theme colors" />
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-[#14b8a6] border-2 border-white/20" />
                      <div>
                        <div className="text-white font-medium">Matrix Primary</div>
                        <div className="text-matrix-primary/60 text-sm">#14b8a6</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-[#00F0FF] border-2 border-white/20" />
                      <div>
                        <div className="text-white font-medium">Matrix Secondary</div>
                        <div className="text-matrix-primary/60 text-sm">#00F0FF</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-[#00ff41] border-2 border-white/20" />
                      <div>
                        <div className="text-white font-medium">Matrix Green</div>
                        <div className="text-matrix-primary/60 text-sm">#00ff41</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItem}>
              <Card variant="glass">
                <CardHeader title="Agent Themes" subtitle="AI agent color schemes" />
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-[#3b82f6] border-2 border-white/20" />
                      <div>
                        <div className="text-white font-medium">Hope (Blue)</div>
                        <div className="text-matrix-primary/60 text-sm">#3b82f6</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-[#8b5cf6] border-2 border-white/20" />
                      <div>
                        <div className="text-white font-medium">Muse (Purple)</div>
                        <div className="text-matrix-primary/60 text-sm">#8b5cf6</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-[#22c55e] border-2 border-white/20" />
                      <div>
                        <div className="text-white font-medium">Treasure (Green)</div>
                        <div className="text-matrix-primary/60 text-sm">#22c55e</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>

        {/* Section: Card Variants */}
        <motion.section variants={listContainer} initial="hidden" animate="show" className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">🎴 Card Variants</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <motion.div variants={listItem}>
              <Card variant="default" hover="lift">
                <CardHeader title="Default Card" subtitle="Standard glass effect" />
                <CardContent>
                  <p className="text-sm">Border with glass background and subtle backdrop blur.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItem}>
              <Card variant="glass" hover="glow">
                <CardHeader title="Glass Card" subtitle="Enhanced glass effect" />
                <CardContent>
                  <p className="text-sm">Teal border with shadow and glow on hover.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItem}>
              <Card variant="solid" hover="scale">
                <CardHeader title="Solid Card" subtitle="Opaque background" />
                <CardContent>
                  <p className="text-sm">Solid black background with strong border.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItem}>
              <Card variant="hope" hover="lift">
                <CardHeader title="Hope Theme" subtitle="AI agent themed" />
                <CardContent>
                  <p className="text-sm">Blue-themed card for Hope agent.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItem}>
              <Card variant="muse" hover="lift">
                <CardHeader title="Muse Theme" subtitle="AI agent themed" />
                <CardContent>
                  <p className="text-sm">Purple-themed card for Muse agent.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItem}>
              <Card variant="treasure" hover="lift">
                <CardHeader title="Treasure Theme" subtitle="AI agent themed" />
                <CardContent>
                  <p className="text-sm">Green-themed card for Treasure agent.</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>

        {/* Section: Button Variants */}
        <motion.section variants={listContainer} initial="hidden" animate="show" className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">🔘 Button Variants</h2>
          <Card variant="glass">
            <CardHeader title="Button Styles" subtitle="All available button variants" />
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-matrix-primary/70">Default</p>
                  <Button className="w-full">Default Button</Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-matrix-primary/70">Destructive</p>
                  <Button variant="destructive" className="w-full">Destructive</Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-matrix-primary/70">Outline</p>
                  <Button variant="outline" className="w-full">Outline</Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-matrix-primary/70">Secondary</p>
                  <Button variant="secondary" className="w-full">Secondary</Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-matrix-primary/70">Ghost</p>
                  <Button variant="ghost" className="w-full">Ghost</Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-matrix-primary/70">Link</p>
                  <Button variant="link" className="w-full">Link</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Section: Navigation */}
        <motion.section variants={listContainer} initial="hidden" animate="show" className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">🧭 Navigation</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <motion.div variants={listItem}>
              <Card variant="glass">
                <CardHeader title="Quick Links" subtitle="Navigate to key pages" />
                <CardContent>
                  <div className="grid gap-2">
                    <Button variant="outline" className="w-full justify-start border-matrix-primary/30 text-matrix-primary">
                      <Music className="w-4 h-4 mr-2" />
                      Library
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-matrix-primary/30 text-matrix-primary">
                      <Users className="w-4 h-4 mr-2" />
                      Social
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-matrix-primary/30 text-matrix-primary">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Marketplace
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-matrix-primary/30 text-matrix-primary">
                      <Gamepad2 className="w-4 h-4 mr-2" />
                      StemStation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItem}>
              <Card variant="glass">
                <CardHeader title="Documentation" subtitle="Learn more about the system" />
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm">
                      The TapTap Matrix design system provides a consistent, accessible, and beautiful user experience across the entire application.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => showToast('Documentation coming soon!', 'info')}
                        variant="outline"
                        className="flex-1 border-matrix-primary/30 text-matrix-primary"
                      >
                        View Docs
                      </Button>
                      <Button
                        onClick={() => showToast('GitHub repo coming soon!', 'info')}
                        variant="outline"
                        className="flex-1 border-matrix-primary/30 text-matrix-primary"
                      >
                        GitHub
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

