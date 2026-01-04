"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Bookmark,
  Coins,
  Flame,
  Hash,
  Heart,
  MessageCircle,
  Music2,
  PlayCircle,
  Repeat2,
  Send,
  Sparkles,
  TrendingUp,
  Trophy,
  Wand2,
  Zap,
  Search,
  MoreHorizontal,
  Share,
  Eye,
  CheckCircle as Verified,
  Home as HomeIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  Users,
  Activity,
  Gamepad2,
  Settings,
  Plus,
  X,
  Image as ImageIcon,
  Gift,
  Rocket,
  Zap as Lightning,
  Upload,
} from "lucide-react";
import MatrixIframe from "@/components/MatrixIframe";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge as Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type ClientSocialProps = {
  meId: string | null;
  initialFeed: SocialPost[];
  suggestions: SocialUser[];
  conversations: SocialConversation[];
  actions: {
    createPost?: (payload: { text: string }) => Promise<any>;
    toggleLike?: (payload: { postId: string }) => Promise<any>;
    follow?: (payload: { userId: string }) => Promise<any>;
    sendMessage?: (payload: { conversationId: string; text: string }) => Promise<any>;
    updateBio?: (payload: { bio: string }) => Promise<any>;
  };
};

type SocialUser = {
  id: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  headerUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  verified: boolean;
  createdAt: string;
  stats: {
    followers: number;
    following: number;
    posts: number;
    likes: number;
  };
  isMe: boolean;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMuted: boolean;
  isBlocked: boolean;
};

type SocialPost = {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  author: SocialUser;
  text: string;
  media: {
    id: string;
    url: string;
    type: "image" | "video" | "audio" | "gif" | "other";
    blurhash: string | null;
    width: number | null;
    height: number | null;
  }[];
  replyToId: string | null;
  repostOfId: string | null;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  bookmarkCount: number;
  viewerHasLiked: boolean;
  viewerHasBookmarked: boolean;
};

function formatTimeAgo(value: string | number | Date) {
  const date = new Date(value);
  const diff = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

type SocialConversation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: SocialUser[];
  lastMessage: { id: string; text: string; createdAt: string; senderId: string } | null;
};

type Attachment =
  | { kind: "track"; title: string; artist: string; art: string; duration: string }
  | { kind: "poster"; title: string; edition: string; scarcity: string; art: string }
  | { kind: "game"; title: string; score: string; clip: string };

type VortexBoost = {
  label: string;
  reason: string;
};

type ViewPost = {
  id: string;
  createdAt: string;
  author: SocialUser;
  text: string;
  attachments: Attachment[];
  vortex?: VortexBoost;
  tipCount: number;
  tipWindow: boolean;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  bookmarkCount: number;
  viewerHasLiked: boolean;
  viewerHasBookmarked: boolean;
};

const tierColors: Record<number, string> = {
  0: "bg-zinc-800 text-zinc-200 border-zinc-700",
  1: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
  2: "bg-cyan-500/20 text-cyan-200 border-cyan-400/40",
  3: "bg-indigo-500/20 text-indigo-200 border-indigo-400/40",
  4: "bg-amber-500/20 text-amber-200 border-amber-400/40",
};

function TierBadge({ tier }: { tier: number }) {
  return (
    <Pill className={`border px-2 py-0 text-[11px] font-semibold ${tierColors[tier] ?? tierColors[0]}`}>
      Tier {tier}
    </Pill>
  );
}

function AgentDMs() {
  const threads = [
    {
      agent: "Serenity · Social",
      color: "text-cyan-300",
      body: "Your post is picking up traction (50+ likes). Do you want to pin it or quote it?",
      actions: ["View post", "Quote with boost"],
    },
    {
      agent: "Vault · Wallet",
      color: "text-emerald-300",
      body: "25 TAP credited from @fan. Balance: 130 TAP. Push a thank-you?",
      actions: ["Open wallet", "Send thank-you"],
    },
    {
      agent: "Flux · Tokenomics",
      color: "text-amber-300",
      body: "0% tax window live for 20 minutes. Tips surge now will trend in Vortex.",
      actions: ["Tip creator", "See window"],
    },
    {
      agent: "Pulse · STEMStation",
      color: "text-fuchsia-300",
      body: "New high score in Neo Drift. Share to Social or challenge followers?",
      actions: ["Share highlight", "Challenge followers"],
    },
  ];

  return (
    <Card className="bg-black/60 border-white/10 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-cyan-300" />
          Agent Inbox
        </CardTitle>
        <Pill variant="outline" className="border-cyan-500/40 text-cyan-200 bg-cyan-500/10">
          DM-first notifications
        </Pill>
      </CardHeader>
      <CardContent className="space-y-3">
        {threads.map((t, idx) => (
          <div key={idx} className="rounded-xl border border-white/5 bg-white/5/5 p-3">
            <div className="flex items-center justify-between">
              <div className={`text-sm font-semibold ${t.color}`}>{t.agent}</div>
              <span className="text-[11px] text-white/50">just now</span>
            </div>
            <p className="text-white/80 text-sm mt-1">{t.body}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.actions.map((a) => (
                <Button key={a} size="sm" variant="secondary" className="bg-white/10 border-white/10 text-white/90">
                  {a}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TrendingPanel() {
  const trends = [
    { label: "#matrixwave", metric: "↑ 214% volume", accent: "text-emerald-300" },
    { label: "#tapdrop", metric: "Rare 0% tax", accent: "text-amber-300" },
    { label: "#stemstation", metric: "Game highlights surging", accent: "text-cyan-300" },
    { label: "#poster-vault", metric: "Poster mints trending", accent: "text-indigo-300" },
  ];

  const creators = [
    { name: "@trinity", metric: "+320 followers", tier: 4 },
    { name: "@neo", metric: "Tipped 1.2k TAP", tier: 3 },
    { name: "@seraph", metric: "Vortex boost", tier: 2 },
  ];

  return (
    <Card className="bg-black/60 border-white/10 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-300" />
          Trending
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {trends.map((t) => (
            <div key={t.label} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 bg-white/5">
              <div className="flex items-center gap-2 text-white">
                <Hash className="h-4 w-4 text-emerald-300" />
                <span className="font-medium">{t.label}</span>
              </div>
              <span className={`text-xs ${t.accent}`}>{t.metric}</span>
            </div>
          ))}
        </div>

        <Separator className="bg-white/10" />

        <div className="space-y-2">
          <div className="text-xs uppercase text-white/40">Trending creators</div>
          {creators.map((c) => (
            <div key={c.name} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 bg-white/5">
              <div className="flex items-center gap-2 text-white">
                <Avatar className="h-8 w-8 border border-white/10">
                  <AvatarFallback>{c.name.replace("@", "").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-white/50">{c.metric}</div>
                </div>
              </div>
              <TierBadge tier={c.tier} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Composer({
  me,
  onPost,
}: {
  me: SocialUser | null;
  onPost: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [attaching, setAttaching] = useState<"track" | "poster" | "airdrop" | "poll" | "gif" | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const canPost = text.trim().length > 0 && text.length <= 480;
  const charactersLeft = 480 - text.length;
  const isNearLimit = charactersLeft < 50;
  const isOverLimit = charactersLeft < 0;

  const handlePost = async () => {
    if (!canPost || isPosting) return;

    setIsPosting(true);
    try {
      await onPost(text);
      setText("");
      setAttaching(null);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="p-4 border-b border-white/10">
      <div className="flex gap-3">
        {/* Avatar */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <Avatar className="w-12 h-12 border-2 border-cyan-400/30 ring-2 ring-cyan-400/10">
            {me?.avatarUrl ? <AvatarImage src={me.avatarUrl} /> : null}
            <AvatarFallback className="bg-gradient-to-br from-cyan-400/20 to-purple-500/20 text-cyan-100 font-semibold">
              {(me?.displayName || me?.handle || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Composer */}
        <div className="flex-1 space-y-3">
          {/* Text Area */}
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening in the digital realm?"
              className={`min-h-[120px] text-xl bg-transparent border-none resize-none placeholder:text-white/40 text-white focus:ring-0 focus:outline-none p-0
                ${isOverLimit ? 'text-red-400' : ''}
              `}
              maxLength={500}
            />

            {/* Character Counter */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              {text.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`text-xs font-mono px-2 py-1 rounded-full
                    ${isOverLimit
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : isNearLimit
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-white/10 text-white/60 border border-white/20'
                    }`}
                >
                  {charactersLeft}
                </motion.div>
              )}
            </div>
          </div>

          {/* Attachment Preview */}
          <AnimatePresence>
            {attaching && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {attaching === "track" && (
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Music2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">Attach Music Track</div>
                        <div className="text-sm text-white/60">Share your latest creation with the world</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttaching(null)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {attaching === "poster" && (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">Attach Digital Poster</div>
                        <div className="text-sm text-white/60">Showcase your NFT collection</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttaching(null)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {attaching === "airdrop" && (
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Gift className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">Create TAP Airdrop</div>
                        <div className="text-sm text-white/60">Reward your community with tokens</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttaching(null)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            {/* Media Options */}
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setAttaching(attaching === "track" ? null : "track")}
                className={`p-2 rounded-full transition-all duration-200 ${
                  attaching === "track"
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'hover:bg-emerald-500/10 text-white/60 hover:text-emerald-400'
                }`}
                title="Attach music track"
              >
                <Music2 className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setAttaching(attaching === "poster" ? null : "poster")}
                className={`p-2 rounded-full transition-all duration-200 ${
                  attaching === "poster"
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'hover:bg-amber-500/10 text-white/60 hover:text-amber-400'
                }`}
                title="Attach digital poster"
              >
                <Sparkles className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setAttaching(attaching === "airdrop" ? null : "airdrop")}
                className={`p-2 rounded-full transition-all duration-200 ${
                  attaching === "airdrop"
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'hover:bg-cyan-500/10 text-white/60 hover:text-cyan-400'
                }`}
                title="Create TAP airdrop"
              >
                <Gift className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-purple-500/10 text-white/60 hover:text-purple-400 transition-all duration-200"
                title="Add poll"
              >
                <Activity className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-pink-500/10 text-white/60 hover:text-pink-400 transition-all duration-200"
                title="Add GIF"
              >
                <ImageIcon className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Post Button */}
            <motion.button
              whileHover={{ scale: canPost ? 1.05 : 1 }}
              whileTap={{ scale: canPost ? 0.95 : 1 }}
              onClick={handlePost}
              disabled={!canPost || isPosting || isOverLimit}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2
                ${canPost && !isOverLimit
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
            >
              {isPosting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Post
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post,
  meId,
  onLike,
}: {
  post: ViewPost;
  meId: string | null;
  onLike: (postId: string) => Promise<void>;
}) {
  const [showTipModal, setShowTipModal] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(post.id);
    } finally {
      setIsLiking(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border-b border-white/10 hover:bg-white/[0.02] transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <Avatar className="w-12 h-12 border-2 border-cyan-400/30 ring-2 ring-cyan-400/10">
            {post.author.avatarUrl ? <AvatarImage src={post.author.avatarUrl} /> : null}
            <AvatarFallback className="bg-gradient-to-br from-cyan-400/20 to-purple-500/20 text-cyan-100 font-semibold">
              {(post.author.displayName || post.author.handle || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white hover:underline cursor-pointer">
              {post.author.displayName || post.author.handle}
            </span>
            {post.author.verified && (
              <Verified className="w-5 h-5 text-cyan-400" />
            )}
            <span className="text-white/60 text-sm">@{post.author.handle}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/60 text-sm hover:underline cursor-pointer">
              {formatTimeAgo(post.createdAt)} ago
            </span>

            {/* More Actions */}
            <div className="ml-auto">
              <AnimatePresence>
                {showActions && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Post Text */}
          <div className="text-white text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">
            {post.text}
          </div>

          {/* Attachments */}
          {post.attachments.length > 0 && (
            <div className="mb-3 space-y-3">
              {post.attachments.map((att, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-xl border border-white/10 overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02]"
                >
                  {att.kind === "track" && (
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Music2 className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-lg">{att.title}</div>
                        <div className="text-white/60">{att.artist}</div>
                        <div className="text-white/40 text-sm">{att.duration}</div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-black transition-all duration-200"
                      >
                        <PlayCircle className="w-6 h-6" />
                      </motion.button>
                    </div>
                  )}

                  {att.kind === "poster" && (
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-lg">{att.title}</div>
                        <div className="text-white/60">{att.edition}</div>
                        <div className="text-amber-400 text-sm font-medium">{att.scarcity}</div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium border border-amber-500/30">
                        NFT
                      </div>
                    </div>
                  )}

                  {att.kind === "game" && (
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-lg">{att.title}</div>
                        <div className="text-white/60">High Score</div>
                        <div className="text-purple-400 text-xl font-bold">{att.score}</div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium border border-purple-500/30">
                        GAME
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Vortex Boost */}
          {post.vortex && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 p-3 rounded-xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10"
            >
              <div className="flex items-center gap-2">
                <Lightning className="w-5 h-5 text-cyan-400" />
                <div className="flex-1">
                  <div className="text-cyan-300 font-semibold text-sm">{post.vortex.label}</div>
                  <div className="text-cyan-400/70 text-xs">{post.vortex.reason}</div>
                </div>
                <Rocket className="w-4 h-4 text-cyan-400" />
              </div>
            </motion.div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between max-w-md mt-3">
            {/* Reply */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-cyan-500/10 text-white/60 hover:text-cyan-400 transition-all duration-200 group"
            >
              <MessageCircle className="w-5 h-5 group-hover:fill-cyan-400/20" />
              <span className="text-sm font-medium">{formatNumber(post.replyCount)}</span>
            </motion.button>

            {/* Repost */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-emerald-500/10 text-white/60 hover:text-emerald-400 transition-all duration-200 group"
            >
              <Repeat2 className="w-5 h-5 group-hover:fill-emerald-400/20" />
              <span className="text-sm font-medium">{formatNumber(post.repostCount)}</span>
            </motion.button>

            {/* Like */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 p-2 rounded-full transition-all duration-200 group ${
                post.viewerHasLiked
                  ? 'text-red-500 hover:bg-red-500/10'
                  : 'text-white/60 hover:text-red-500 hover:bg-red-500/10'
              }`}
            >
              <Heart className={`w-5 h-5 transition-all duration-200 ${
                post.viewerHasLiked ? 'fill-current' : 'group-hover:fill-red-500/20'
              }`} />
              <span className="text-sm font-medium">{formatNumber(post.likeCount)}</span>
            </motion.button>

            {/* Views */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-purple-500/10 text-white/60 hover:text-purple-400 transition-all duration-200 group"
            >
              <Eye className="w-5 h-5 group-hover:fill-purple-400/20" />
              <span className="text-sm font-medium">{formatNumber(Math.floor(Math.random() * 10000) + 1000)}</span>
            </motion.button>

            {/* Share & More */}
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
              >
                <Bookmark className={`w-5 h-5 ${post.viewerHasBookmarked ? 'fill-current text-cyan-400' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
              >
                <Share className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* TAP Tip Window */}
          {post.tipWindow && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-300 font-semibold text-sm">
                    {post.tipCount} TAP tips received
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTipModal(true)}
                  className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all duration-200"
                >
                  Tip Creator
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Tip Modal */}
      <AnimatePresence>
        {showTipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTipModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-96 bg-black/90 border border-white/20 rounded-2xl p-6 backdrop-blur-xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Coins className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Send TAP Tip</h3>
                <p className="text-white/60">
                  Support @{post.author.handle} for this amazing content!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[5, 10, 25, 50, 100, 250].map((amount) => (
                  <motion.button
                    key={amount}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold transition-all duration-200"
                  >
                    {amount} TAP
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={() => setShowTipModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold"
                  onClick={() => setShowTipModal(false)}
                >
                  Send Tip
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Suggestions({ suggestions }: { suggestions: SocialUser[] }) {
  return (
    <Card className="bg-black/60 border-white/10 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-300" />
          Suggested creators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.slice(0, 5).map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 px-3 py-2 bg-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-9 w-9 border border-white/10">
                {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.handle ?? ""} /> : null}
                <AvatarFallback>{(u.handle ?? "u").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{u.displayName ?? u.handle ?? "Creator"}</div>
                {u.handle ? <div className="text-xs text-white/50 truncate">@{u.handle}</div> : null}
              </div>
            </div>
            <Button size="sm" variant="secondary" className="bg-emerald-500/20 border-emerald-400/30 text-emerald-100">
              Follow
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Enhanced Twitter/X-style Navigation Sidebar
function EnhancedSidebar({ meUser, activeView, setActiveView, collapsed, onToggle }: {
  meUser: SocialUser | null;
  activeView: string;
  setActiveView: (view: string) => void;
  collapsed: boolean;
  onToggle: (next: boolean) => void;
}) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: HomeIcon, emoji: '🏠', count: null },
    { id: 'feed', label: 'Feed', icon: Hash, emoji: '📰', count: null },
    { id: 'explore', label: 'Explore', icon: Search, emoji: '🔍', count: null },
    { id: 'notifications', label: 'Notifications', icon: Bell, emoji: '✨', count: 12 },
    { id: 'messages', label: 'Messages', icon: MessageCircle, emoji: '💬', count: 3 },
    { id: 'saved', label: 'Saved', icon: Bookmark, emoji: '💾', count: null },
    { id: 'crews', label: 'Crews', icon: Users, emoji: '🧩', count: null },
    { id: 'upload', label: 'Upload', icon: Upload, emoji: '⏫', count: null },
    { id: 'profile', label: 'Profile', icon: Settings, emoji: '👤', count: null },
  ];

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`${collapsed ? 'w-20' : 'w-64'} h-screen sticky top-0 p-3 border-r border-cyan-500/20 bg-black/80 backdrop-blur-xl flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onToggle(!collapsed)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span className="text-xs font-semibold">Sidebar</span>}
        </motion.button>

        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 ring-2 ring-cyan-400/30 flex items-center justify-center">
              <span className="text-lg">🎵</span>
            </div>
            <div className="flex flex-col">
              <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                TapTap
              </div>
              <div className="text-xs text-cyan-300/60 font-mono">SOCIAL</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-4'} px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                ${isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-cyan-100 border border-cyan-400/30'
                  : 'hover:bg-white/5 text-white/70 hover:text-white/90'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/5 rounded-xl"
                />
              )}

              <div className="flex items-center gap-3 relative z-10">
                <span className="text-xl">{item.emoji}</span>
                {!collapsed && (
                  <Icon className={`w-6 h-6 ${isActive ? 'text-cyan-300' : 'text-white/60 group-hover:text-cyan-400'}`} />
                )}
              </div>

              {!collapsed && (
                <span className={`font-medium text-lg relative z-10 ${isActive ? 'text-cyan-100' : 'group-hover:text-white'}`}>
                  {item.label}
                </span>
              )}

              {!collapsed && item.count && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto bg-cyan-500 text-black text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center relative z-10"
                >
                  {item.count}
                </motion.div>
              )}

              {isActive && !collapsed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Post Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveView('composer')}
        className={`w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 rounded-full text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 ${collapsed ? 'justify-center px-0' : 'px-4'}`}
      >
        <div className="flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          {!collapsed && <span>Post</span>}
        </div>
      </motion.button>

      {/* User Profile */}
      {meUser && !collapsed && (
        <motion.div
          className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-cyan-400/30">
              {meUser.avatarUrl ? <AvatarImage src={meUser.avatarUrl} /> : null}
              <AvatarFallback className="bg-gradient-to-br from-cyan-400/20 to-purple-500/20 text-cyan-100">
                {(meUser.displayName || meUser.handle || 'U').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white truncate">{meUser.displayName || meUser.handle}</span>
                {meUser.verified && <Verified className="w-4 h-4 text-cyan-400" />}
              </div>
              <div className="text-sm text-white/60 truncate">@{meUser.handle || 'user'}</div>
            </div>
            <MoreHorizontal className="w-5 h-5 text-white/60" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function ClientSocial({
  meId,
  initialFeed,
  suggestions,
  conversations,
  actions,
}: ClientSocialProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [posts, setPosts] = useState<ViewPost[]>(() => {
    const fallbackUser: SocialUser = {
      id: "demo",
      handle: "trinity",
      displayName: "Trinity",
      avatarUrl: null,
      headerUrl: null,
      bio: "Top creator in the digital realm 🎵✨",
      location: "The Matrix",
      website: "https://taptap.matrix",
      verified: true,
      createdAt: new Date().toISOString(),
      stats: { followers: 12000, following: 230, posts: 340, likes: 1200 },
      isMe: false,
      isFollowing: false,
      isFollowedBy: true,
      isMuted: false,
      isBlocked: false,
    };

    const toView = (p: SocialPost): ViewPost => ({
      id: p.id,
      createdAt: p.createdAt,
      author: p.author ?? fallbackUser,
      text: p.text ?? "",
      attachments: [],
      vortex: Math.random() > 0.7 ? { label: "Vortex boost", reason: "Engagement climbing in flux phase" } : undefined,
      tipCount: Math.floor(Math.random() * 40),
      tipWindow: Math.random() > 0.6,
      likeCount: p.likeCount,
      replyCount: p.replyCount,
      repostCount: p.repostCount,
      bookmarkCount: p.bookmarkCount,
      viewerHasLiked: p.viewerHasLiked,
      viewerHasBookmarked: p.viewerHasBookmarked,
    });

    const base = (initialFeed ?? []).map(toView);

    if (base.length === 0) {
      return [
        {
          id: "seed-1",
          createdAt: new Date().toISOString(),
          author: fallbackUser,
          text: "Just dropped my latest track 'Digital Dreams' 🎵✨ The future of music is here and it's absolutely mind-blowing! Who else is ready to dive into the sonic matrix? 🚀\n\n#DigitalMusic #FutureSound #TapTapRevolution",
          attachments: [
            { kind: "track", title: "Digital Dreams", artist: "Trinity", art: "", duration: "3:42" },
            { kind: "poster", title: "Neon Bloom", edition: "12/100", scarcity: "Ultra Rare", art: "" },
          ],
          vortex: { label: "Viral Boost", reason: "Tier 4 creator + massive engagement surge" },
          tipCount: 47,
          tipWindow: true,
          likeCount: 1243,
          replyCount: 89,
          repostCount: 156,
          bookmarkCount: 234,
          viewerHasLiked: false,
          viewerHasBookmarked: false,
        },
        {
          id: "seed-2",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          author: {
            ...fallbackUser,
            id: "neo",
            handle: "neo",
            displayName: "Neo",
            bio: "The One • Music Producer • Digital Architect",
            stats: { followers: 8900, following: 120, posts: 220, likes: 980 },
          },
          text: "New high score in STEMStation! 🎮 Just hit 142,880 points in Neo Drift. The rhythm was perfect, the flow was unmatched. Challenge accepted, @trinity! 💪\n\nWho thinks they can beat this? Drop your scores below! 👇",
          attachments: [{ kind: "game", title: "Neo Drift", score: "142,880", clip: "" }],
          tipCount: 23,
          tipWindow: false,
          likeCount: 567,
          replyCount: 43,
          repostCount: 78,
          bookmarkCount: 91,
          viewerHasLiked: true,
          viewerHasBookmarked: false,
        },
        {
          id: "seed-3",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          author: {
            ...fallbackUser,
            id: "morpheus",
            handle: "morpheus",
            displayName: "Morpheus",
            bio: "Guide • Mentor • Keeper of the Sound",
            verified: true,
            stats: { followers: 25000, following: 89, posts: 156, likes: 2100 },
          },
          text: "The matrix of music is evolving. What you hear today will shape tomorrow's reality. 🎵🔮\n\nRemember: There is no spoon, but there is always rhythm. \n\n#Philosophy #MusicWisdom #DigitalEnlightenment",
          attachments: [],
          vortex: { label: "Wisdom Boost", reason: "Philosophical content trending" },
          tipCount: 67,
          tipWindow: true,
          likeCount: 892,
          replyCount: 124,
          repostCount: 203,
          bookmarkCount: 445,
          viewerHasLiked: false,
          viewerHasBookmarked: true,
        },
      ];
    }
    return base;
  });

  const meUser = useMemo(() => suggestions.find((u) => u.id === meId) ?? null, [meId, suggestions]);

  const filteredPosts = useMemo(() => {
    if (activeTab === "following") {
      return posts.filter((p) => p.author.isFollowedBy || p.author.isFollowing);
    }
    return posts;
  }, [activeTab, posts]);

  useEffect(() => {
    // Auto-collapse sidebar when rendering iframe-based views
    const isIframeView = Boolean(viewEmbeds[activeView]);
    setSidebarCollapsed(isIframeView);
  }, [activeView]);

  const handlePost = async (text: string) => {
    const newPost: ViewPost = {
      id: `local-${Date.now()}`,
      createdAt: new Date().toISOString(),
      author: meUser ?? {
        id: meId ?? "me",
        handle: "you",
        displayName: "You",
        avatarUrl: null,
        headerUrl: null,
        bio: "New to the digital realm",
        location: null,
        website: null,
        verified: false,
        createdAt: new Date().toISOString(),
        stats: { followers: 0, following: 0, posts: 1, likes: 0 },
        isMe: true,
        isFollowing: false,
        isFollowedBy: false,
        isMuted: false,
        isBlocked: false,
      },
      text,
      attachments: [],
      vortex: undefined,
      tipCount: 0,
      tipWindow: false,
      likeCount: 0,
      replyCount: 0,
      repostCount: 0,
      bookmarkCount: 0,
      viewerHasLiked: false,
      viewerHasBookmarked: false,
    };

    setPosts((prev) => [newPost, ...prev]);
    if (actions.createPost) {
      await actions.createPost({ text });
    }
  };

  const handleLike = async (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              likeCount: p.viewerHasLiked ? p.likeCount - 1 : p.likeCount + 1,
              viewerHasLiked: !p.viewerHasLiked,
            }
          : p
      )
    );
    if (actions.toggleLike) {
      await actions.toggleLike({ postId: id });
    }
  };

  const viewEmbeds: Record<string, string> = {
    dashboard: "/dashboard?embed=1",
    explore: "/explore?embed=1",
    notifications: "/notifications?embed=1",
    messages: "/messages?embed=1",
    saved: "/saved?embed=1",
    crews: "/crews?embed=1",
    upload: "/upload?embed=1",
    profile: "/settings?embed=1#profile",
  };

  const viewLabels: Record<string, string> = {
    dashboard: "Home",
    feed: "Feed",
    explore: "Explore",
    notifications: "Notifications",
    messages: "Messages",
    saved: "Saved",
    crews: "Crews",
    upload: "Upload",
    profile: "Profile",
    composer: "Compose",
  };

  const renderFeed = () => (
    <>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 backdrop-blur-xl bg-black/80 border-b border-cyan-500/20 p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Feed</h1>
            <p className="text-sm text-white/60">Twitter/X-style scroll with your follows and algorithmic picks</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex mt-4 border-b border-white/10">
          {([
            { key: "for-you", label: "For you", icon: Sparkles },
            { key: "following", label: "Following", icon: Users },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-300 relative
                  ${activeTab === tab.key
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <div className="pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/10 p-4"
        >
          <Composer me={meUser} onPost={handlePost} />
        </motion.div>

        <AnimatePresence>
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-white/10"
            >
              <PostCard post={post} meId={meId} onLike={handleLike} />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 text-center"
          >
            <div className="text-white/60 mb-4">
              <Globe className="w-12 h-12 mx-auto mb-4 text-white/40" />
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to TapTap Social</h3>
              <p className="text-sm">Your feed is empty. Follow some creators or post something to get started!</p>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );

  const renderComposerOnly = () => (
    <div className="p-6 space-y-4">
      <div className="text-lg font-semibold text-white">Compose a post</div>
      <div className="text-sm text-white/60">Share something new with your followers.</div>
      <Composer me={meUser} onPost={handlePost} />
    </div>
  );

  const [iframeStatus, setIframeStatus] = useState<Record<string, "idle" | "loaded" | "error">>({});

  const viewFallbacks: Record<string, JSX.Element> = {
    dashboard: (
      <div className="p-6 space-y-2 text-white">
        <div className="font-semibold">Dashboard</div>
        <p className="text-sm text-white/60">Overview of your TapTap activity.</p>
      </div>
    ),
    notifications: (
      <div className="p-6 space-y-3">
        <div className="text-white font-semibold">Notifications fallback</div>
        <p className="text-sm text-white/60">Instagram-style likes, follows, mentions, and remixes.</p>
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-300" />
              Live activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {["Trinity liked your post", "Neo mentioned you in #matrixwave", "Seraph started following you"].map((row) => (
              <div key={row} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <Avatar className="h-8 w-8 border border-white/10">
                  <AvatarFallback>TT</AvatarFallback>
                </Avatar>
                <div className="text-sm text-white/80">{row}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    ),
    messages: (
      <div className="p-6 space-y-3 text-white">
        <div className="font-semibold">Messages fallback</div>
        <p className="text-sm text-white/60">Loads the main Messages experience in an iframe.</p>
      </div>
    ),
    saved: (
      <div className="p-6 space-y-2 text-white">
        <div className="font-semibold">Saved fallback</div>
        <p className="text-sm text-white/60">Your saved posts, reels, and crew threads.</p>
      </div>
    ),
    crews: (
      <div className="p-6 space-y-2 text-white">
        <div className="font-semibold">Crews fallback</div>
        <p className="text-sm text-white/60">Hashtag-based communities, Reddit-style.</p>
      </div>
    ),
    upload: (
      <div className="p-6 space-y-2 text-white">
        <div className="font-semibold">Upload fallback</div>
        <p className="text-sm text-white/60">Social upload hub: wall + reels + resumable uploads.</p>
      </div>
    ),
  };

  const renderIframeView = (view: string, src: string) => {
    const status = iframeStatus[view] ?? "idle";
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-white">{viewLabels[view] ?? 'View'}</div>
            <div className="text-xs text-white/60">Embedded view from the TapTap app</div>
          </div>
          <a
            href={src.replace("?embed=1", "")}
            className="text-xs text-teal-300 hover:text-teal-200 underline"
          >
            Open full page
          </a>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden h-[calc(100vh-220px)] relative">
          <MatrixIframe
            src={src}
            className="w-full h-full"
            showMatrixOverlay={false}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            onLoad={() => setIframeStatus((prev) => ({ ...prev, [view]: "loaded" }))}
            onError={() => setIframeStatus((prev) => ({ ...prev, [view]: "error" }))}
          />
          {status === "error" && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-white font-semibold">Could not load {viewLabels[view] ?? view}</div>
                <div className="text-xs text-white/60">Showing a built-in preview instead.</div>
              </div>
            </div>
          )}
        </div>
        {status === "error" && viewFallbacks[view]}
      </div>
    );
  };

  const renderActiveView = () => {
    if (activeView === "feed") return renderFeed();
    if (activeView === "composer") return renderComposerOnly();
    const src = viewEmbeds[activeView];
    if (src) return renderIframeView(activeView, src);
    return renderFeed();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white flex">
      {/* Enhanced Sidebar */}
      <EnhancedSidebar
        meUser={meUser}
        activeView={activeView}
        setActiveView={setActiveView}
        collapsed={sidebarCollapsed}
        onToggle={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 max-w-2xl border-r border-cyan-500/20">
        {renderActiveView()}
      </div>

      {/* Right Sidebar */}
      <div className="w-80 p-4 space-y-4 overflow-y-auto">
        <TrendingPanel />
        <Suggestions suggestions={suggestions} />
        <AgentDMs />
      </div>
    </div>
  );
}
