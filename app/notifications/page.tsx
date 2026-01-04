"use client";

import { type ComponentType, useMemo, useState } from "react";
import {
  AtSign,
  Bell,
  CheckCircle2,
  Heart,
  MessageCircle,
  Play,
  UserPlus,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Notification = {
  id: string;
  user: string;
  handle: string;
  action: "like" | "comment" | "follow" | "mention" | "remix";
  time: string;
  preview?: string;
  mediaLabel?: string;
  isNew?: boolean;
};

const NOTIFICATIONS: Notification[] = [
  { id: "n1", user: "Trinity", handle: "trinity", action: "like", time: "2m", preview: "Digital Dreams · 1.2k likes", isNew: true },
  { id: "n2", user: "Neo", handle: "neo", action: "comment", time: "10m", preview: "“That drop is unreal”", mediaLabel: "clip · 0:21" },
  { id: "n3", user: "Morpheus", handle: "morpheus", action: "mention", time: "25m", preview: "Tagged you in #matrixwave" },
  { id: "n4", user: "Seraph", handle: "seraph", action: "follow", time: "1h", preview: "Wants to see more of your reels", isNew: true },
  { id: "n5", user: "Switch", handle: "switch", action: "remix", time: "3h", preview: "Remixed your wall post into a new short", mediaLabel: "remix · 15s" },
  { id: "n6", user: "Mouse", handle: "mouse", action: "like", time: "5h", preview: "Saved to a playlist" },
];

const FOLLOW_REQUESTS = [
  { id: "f1", user: "Apoc", handle: "apoc", time: "Just now" },
  { id: "f2", user: "Dozer", handle: "dozer", time: "5m" },
  { id: "f3", user: "Link", handle: "link", time: "18m" },
];

const STORIES = [
  { user: "Zion Crew", handle: "zion", status: "Followed you" },
  { user: "Flux", handle: "flux", status: "Mentioned you" },
  { user: "Vault", handle: "vault", status: "Sent a tip" },
  { user: "Pulse", handle: "pulse", status: "Shared your clip" },
];

const ACTION_META: Record<
  Notification["action"],
  { label: string; color: string; icon: ComponentType<{ className?: string }> }
> = {
  like: { label: "liked your post", color: "text-rose-300", icon: Heart },
  comment: { label: "commented on your clip", color: "text-cyan-300", icon: MessageCircle },
  follow: { label: "started following you", color: "text-emerald-300", icon: UserPlus },
  mention: { label: "mentioned you", color: "text-indigo-300", icon: AtSign },
  remix: { label: "remixed your upload", color: "text-amber-300", icon: Play },
};

function NotificationRow({ item }: { item: Notification }) {
  const meta = ACTION_META[item.action];
  const Icon = meta.icon;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="relative">
        <Avatar className="h-10 w-10 border border-white/10">
          <AvatarImage src={item.handle ? `/api/avatar/${item.handle}` : undefined} alt={item.user} />
          <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-white">
            {item.user.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -right-1 -bottom-1 rounded-full bg-black border border-white/10 p-1">
          <Icon className={`h-3 w-3 ${meta.color}`} />
        </span>
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 text-sm text-white">
          <span className="font-semibold hover:underline cursor-pointer">{item.user}</span>
          <span className="text-white/60">@{item.handle}</span>
          <span className="text-white/40">·</span>
          <span className="text-white/60">{item.time}</span>
          {item.isNew && (
            <Badge className="bg-emerald-500/10 text-emerald-200 border-emerald-500/30" variant="outline">
              New
            </Badge>
          )}
        </div>
        <div className="text-sm text-white/70">
          <span className={`${meta.color} font-semibold`}>{meta.label}</span>
          {item.preview ? ` — ${item.preview}` : null}
        </div>
        {item.mediaLabel && (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Play className="h-3 w-3" />
            {item.mediaLabel}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {item.action === "follow" ? (
          <Button size="sm" variant="secondary" className="bg-emerald-500/20 border-emerald-400/40 text-emerald-50">
            Follow back
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="text-white/70 hover:bg-white/10">
            View
          </Button>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "mentions">("all");

  const feed = useMemo(() => {
    if (filter === "mentions") {
      return NOTIFICATIONS.filter((n) => n.action === "mention");
    }
    return NOTIFICATIONS;
  }, [filter]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
              <Bell className="h-4 w-4 text-emerald-300" />
              Live activity
            </div>
            <h1 className="text-2xl font-bold text-white">Notifications · Instagram style</h1>
            <p className="text-sm text-white/60">
              Likes, follows, mentions, and remixes from your crews and followers.
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100">
            Real-time
          </Badge>
        </header>

        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All activity" },
            { key: "mentions", label: "Mentions" },
          ].map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              variant={filter === tab.key ? "secondary" : "ghost"}
              className={`border ${filter === tab.key ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 text-white/70"}`}
              onClick={() => setFilter(tab.key as "all" | "mentions")}
            >
              {tab.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
            Follow requests
          </Button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {STORIES.map((story) => (
            <div
              key={story.handle}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 min-w-[120px]"
            >
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-emerald-400 via-cyan-400 to-purple-500">
                <Avatar className="h-14 w-14 border-2 border-black">
                  <AvatarFallback className="bg-black text-white font-semibold">
                    {story.user.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-sm font-semibold text-white truncate">{story.user}</div>
              <div className="text-xs text-white/60">{story.status}</div>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Heart className="h-4 w-4 text-rose-300" />
              Recent activity
            </div>
            <span className="text-xs text-white/50">Updated moments ago</span>
          </div>
          <Separator className="bg-white/10" />
          <div className="divide-y divide-white/5">
            {feed.map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold">
              <UserPlus className="h-4 w-4 text-emerald-300" />
              Follow requests
            </div>
            <Badge variant="outline" className="border-white/20 text-white/70">
              {FOLLOW_REQUESTS.length} pending
            </Badge>
          </div>
          {FOLLOW_REQUESTS.map((req) => (
            <div key={req.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-white/10">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-white">
                    {req.user.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-white font-semibold">{req.user}</div>
                  <div className="text-xs text-white/60">@{req.handle} · {req.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" className="bg-emerald-500/20 border-emerald-400/40 text-emerald-50">
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </section>

        <div className="flex items-center gap-2 text-xs text-white/50">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          Notifications are synced to your DM dock and mobile push.
        </div>
      </div>
    </main>
  );
}
