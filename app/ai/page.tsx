"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Wand2, Music, Image, FileText, Sparkles, Settings, Zap } from "lucide-react";
import AssistiveOrb from "@/components/AssistiveOrb";
import { PageContainer, PageHeader, LoadingState } from "@/components/ui/StandardizedComponents";
import { useMatrixIframes } from "@/hooks/useMatrixIframes";

const AI_TOOLS = [
  {
    id: 'music',
    name: 'Music Generation',
    description: 'Generate beats, melodies, and full tracks',
    icon: Music,
    features: ['Beat generation', 'Melody creation', 'Full track composition']
  },
  {
    id: 'lyrics',
    name: 'Lyric Writing', 
    description: 'AI-powered lyric generation and enhancement',
    icon: FileText,
    features: ['Rhyme schemes', 'Theme-based lyrics', 'Verse/chorus structure']
  },
  {
    id: 'artwork',
    name: 'Album Artwork',
    description: 'Generate stunning visual art for your music',
    icon: Image,
    features: ['Album covers', 'Poster designs', 'Social media graphics']
  },
  {
    id: 'mastering',
    name: 'AI Mastering',
    description: 'Professional audio mastering powered by AI',
    icon: Wand2,
    features: ['EQ optimization', 'Dynamic range', 'Loudness standards']
  }
];

export default function AIPage({ searchParams }: any) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");

  useMatrixIframes();

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedTool) return;
    
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setResult(`AI-generated ${selectedTool} content for: "${prompt}"`);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <PageContainer showMatrix={true}>
      <PageHeader
        title="AI Studio"
        subtitle="Create music, lyrics, and artwork with artificial intelligence"
        icon={Bot}
        showBackButton={true}
        actions={
          <button className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-300" />
            AI Tools
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AI_TOOLS.map((tool) => (
              <motion.button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`p-6 rounded-xl border text-left transition-all ${
                  selectedTool === tool.id
                    ? 'border-teal-400/50 bg-teal-400/10 ring-1 ring-teal-400/30'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="h-10 w-10 rounded-lg bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center mb-4">
                  <tool.icon className="h-5 w-5 text-teal-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">{tool.name}</h3>
                <p className="text-sm text-white/60 mb-3">{tool.description}</p>
                <div className="flex flex-wrap gap-1">
                  {tool.features.slice(0, 2).map((feature) => (
                    <span key={feature} className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">
                      {feature}
                    </span>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {selectedTool && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Describe what you want to create:
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 p-4 bg-black/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                  placeholder={`Describe your ${selectedTool} idea in detail...`}
                />
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500/90 text-black font-semibold rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-black/30 border-t-black rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </motion.section>
        )}

        {isGenerating && <LoadingState message="AI is creating your content..." showMatrix={false} />}

        {result && !isGenerating && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-teal-400/30 bg-teal-400/5 p-6"
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-teal-300" />
              Generated Result
            </h3>
            <div className="p-4 bg-black/50 border border-white/10 rounded-lg">
              <p className="text-white">{result}</p>
            </div>
          </motion.section>
        )}

        <AssistiveOrb />
      </div>
    </PageContainer>
  );
}
