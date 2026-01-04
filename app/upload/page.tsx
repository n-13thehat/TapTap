"use client";
export const dynamic = "force-dynamic";

import { useSession, signIn } from "next-auth/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Music,
  User,
  Globe,
  CheckCircle,
  AlertCircle,
  Settings,
  Trash2,
  RefreshCw,
  Sparkles,
  Play,
  MessageCircle,
  Bookmark,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  LoadingState,
} from "@/components/ui/StandardizedComponents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMatrixIframes } from "@/hooks/useMatrixIframes";
import DragDropUpload from "@/components/upload/DragDropUpload";
import { RouteFeatureGate } from "@/components/RouteFeatureGate";

type UploadSessionClient = {
  id: string;
  trackId: string;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  sizeBytes: number;
  fileName: string;
  mimeType?: string | null;
  status: string;
};

type ResumeMeta = {
  sessionId: string;
  fileName: string;
  sizeBytes: number;
};

type WallPost = {
  id: string;
  author: string;
  handle: string;
  time: string;
  text: string;
  tag?: string;
  highlight?: string;
};

const ACTIVE_SESSION_KEY = "taptap.upload.activeSession";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  const idx = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)) - 1
  );
  const value = bytes / Math.pow(1024, idx + 1);
  return `${value.toFixed(1)} ${units[idx]}`;
}

function UploadDashboardContent() {
  const sessionState = useSession();
  const session = sessionState.data;
  const [loading, setLoading] = useState(false);
  const [stageName, setStageName] = useState("");
  const [genre, setGenre] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "finalizing" | "complete"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [activeSession, setActiveSession] =
    useState<UploadSessionClient | null>(null);
  const [resumeMeta, setResumeMeta] = useState<ResumeMeta | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);

  const defaultDisplayName =
    (session?.user as any)?.name ??
    (session?.user as any)?.username ??
    "You";
  const defaultHandle =
    (session?.user as any)?.username ??
    (session?.user as any)?.name ??
    "you";

  const [profileName, setProfileName] = useState(defaultDisplayName);
  const [profileBio, setProfileBio] = useState(
    "Layer a quick intro so your wall feels alive when fans land here."
  );
  const [profileLink, setProfileLink] = useState("taptap.me/you");
  const [profileSaved, setProfileSaved] = useState(false);
  const [wallText, setWallText] = useState("");
  const [wallPosts, setWallPosts] = useState<WallPost[]>([
    {
      id: "wall-hero",
      author: defaultDisplayName,
      handle: defaultHandle,
      time: "Pinned",
      text: "Drop a welcome post: what you make, when you go live, and where to follow.",
      tag: "#welcome",
    },
    {
      id: "wall-friend",
      author: "Trinity",
      handle: "trinity",
      time: "2h ago",
      text: "Shared your last reel into #matrixwave — momentum is building.",
      tag: "#matrixwave",
      highlight: "Crews boost",
    },
  ]);

  const shortClips = [
    { id: "clip-1", title: "Night Drive", plays: "14.2k plays", length: "0:21" },
    { id: "clip-2", title: "Signal Boost", plays: "8.9k plays", length: "0:15" },
    { id: "clip-3", title: "Afterglow", plays: "6.1k plays", length: "0:12" },
  ];

  useMatrixIframes();

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1800);
  };

  const handleWallPost = () => {
    const body = wallText.trim();
    if (!body) return;
    setWallPosts((prev) => [
      {
        id: `wall-${Date.now()}`,
        author: profileName || defaultDisplayName,
        handle: defaultHandle,
        time: "Just now",
        text: body,
        tag: "#update",
      },
      ...prev,
    ]);
    setWallText("");
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ResumeMeta;
        setResumeMeta(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const rememberSession = useCallback((meta: ResumeMeta | null) => {
    try {
      if (meta) {
        window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(meta));
      } else {
        window.localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch {
      // ignore storage errors
    }
    setResumeMeta(meta);
  }, []);

  const fetchSession = useCallback(async (sessionId: string) => {
    const res = await fetch(`/api/uploads/session/${sessionId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Failed to load upload session");
    }
    const data = (await res.json()) as UploadSessionClient;
    return data;
  }, []);

  const updateProgress = useCallback(
    (sessionData: UploadSessionClient, uploaded: number) => {
      const percent =
        sessionData.totalChunks === 0
          ? 0
          : Math.min(
              100,
              Math.round(
                (sessionData.uploadedChunks.length / sessionData.totalChunks) * 100
              )
            );
      setUploadProgress(percent);
      setUploadedBytes(uploaded);
    },
    []
  );

  const uploadChunks = useCallback(
    async (file: File, sessionData: UploadSessionClient) => {
      setUploadState("uploading");
      updateProgress(
        sessionData,
        Math.min(
          file.size,
          sessionData.uploadedChunks.length * sessionData.chunkSize
        )
      );

      for (let index = 0; index < sessionData.totalChunks; index++) {
        if (sessionData.uploadedChunks.includes(index)) continue;
        const start = index * sessionData.chunkSize;
        const end = Math.min(start + sessionData.chunkSize, file.size);
        const chunk = file.slice(start, end);

        const res = await fetch(
          `/api/uploads/session/${sessionData.id}/chunk?index=${index}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/octet-stream" },
            body: chunk,
          }
        );
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || "Failed to upload chunk");
        }
        const payload = await res.json();
        sessionData.uploadedChunks = payload.uploadedChunks ?? [];
        updateProgress(sessionData, payload.uploadedBytes ?? start);
      }

      setUploadState("finalizing");
      const finalize = await fetch(
        `/api/uploads/session/${sessionData.id}/finalize`,
        {
          method: "POST",
        }
      );
      if (!finalize.ok) {
        const payload = await finalize.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to finalize upload");
      }

      setUploadState("complete");
      setUploadProgress(100);
      setUploadedBytes(file.size);
      setActiveSession(null);
      rememberSession(null);
      setSubmitted(true);
    },
    [rememberSession, updateProgress]
  );

  const startNewSession = useCallback(
    async (file: File) => {
      const res = await fetch("/api/uploads/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to initialize session");
      }
      const sessionData = payload as UploadSessionClient;
      setActiveSession(sessionData);
      rememberSession({
        sessionId: sessionData.id,
        fileName: file.name,
        sizeBytes: file.size,
      });
      await uploadChunks(file, sessionData);
    },
    [rememberSession, uploadChunks]
  );

  const resumeUpload = useCallback(
    async (file: File, meta: ResumeMeta) => {
      const sessionData = await fetchSession(meta.sessionId);
      setActiveSession(sessionData);
      await uploadChunks(file, sessionData);
    },
    [fetchSession, uploadChunks]
  );

  const handleFileInput = useCallback(
    async (input: HTMLInputElement) => {
      const file = input.files?.[0];
      if (!file) return;

      setPendingFileName(file.name);
      setError(null);

      try {
        setLoading(true);
        if (
          resumeMeta &&
          resumeMeta.fileName === file.name &&
          resumeMeta.sizeBytes === file.size
        ) {
          await resumeUpload(file, resumeMeta);
        } else {
          await startNewSession(file);
        }
      } catch (err: any) {
        setError(err?.message || "Upload failed");
        setUploadState("idle");
        setUploadProgress(0);
        setUploadedBytes(0);
      } finally {
        setLoading(false);
        setPendingFileName(null);
        input.value = "";
      }
    },
    [resumeMeta, resumeUpload, startNewSession]
  );

  const handleMultipleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setError(null);
    setLoading(true);

    try {
      // For now, handle the first file with existing logic
      const file = files[0];
      setPendingFileName(file.name);

      if (
        resumeMeta &&
        resumeMeta.fileName === file.name &&
        resumeMeta.sizeBytes === file.size
      ) {
        await resumeUpload(file, resumeMeta);
      } else {
        await startNewSession(file);
      }

      // TODO: Handle multiple files in parallel
      if (files.length > 1) {
        console.log(`Additional ${files.length - 1} files will be queued for future upload`);
      }
    } catch (err: any) {
      setError(err?.message || "Upload failed");
      setUploadState("idle");
      setUploadProgress(0);
      setUploadedBytes(0);
    } finally {
      setLoading(false);
      setPendingFileName(null);
    }
  }, [resumeMeta, resumeUpload, startNewSession]);

  const handleRequestAccess = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/creator/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageName, genre, socialLinks }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Request failed");
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const isCreator =
    session?.user &&
    ["CREATOR", "ADMIN"].includes((session.user as any).role ?? "");

  if (sessionState.status === "loading") {
    return (
      <PageContainer showMatrix>
        <LoadingState message="Loading dashboard..." />
      </PageContainer>
    );
  }

  if (!session || !session.user) {
    return (
      <PageContainer showMatrix>
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md space-y-6"
          >
            <div className="h-16 w-16 rounded-full bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center mx-auto">
              <User className="h-8 w-8 text-teal-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-teal-300 mb-4">
                Creator Access
              </h1>
              <p className="text-white/70 mb-6">
                Sign in with your TapTap account to continue uploading music.
              </p>
            </div>
            <button
              onClick={() => signIn()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500/90 text-black font-semibold rounded-lg hover:bg-teal-400 transition-colors"
            >
              <User className="h-4 w-4" />
              Sign In
            </button>
          </motion.div>
        </div>
      </PageContainer>
    );
  }

  if (!isCreator) {
    return (
      <PageContainer showMatrix>
        <PageHeader
          title="Request Creator Access"
          subtitle="Tell us a bit about you so we can unlock uploads"
          icon={Music}
        />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <motion.form
            onSubmit={handleRequestAccess}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 bg-white/5 rounded-xl border border-white/10 p-6"
          >
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Stage Name
              </label>
              <input
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Primary Genre
              </label>
              <input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Social Links
              </label>
              <textarea
                value={socialLinks}
                onChange={(e) => setSocialLinks(e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
                rows={3}
              />
            </div>
            {error && (
              <AlertBanner variant="error" message={error} icon={AlertCircle} />
            )}
            {submitted && (
              <AlertBanner
                variant="success"
                message="Request received! We'll email you once it's approved."
                icon={CheckCircle}
              />
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500/90 text-black font-semibold rounded-lg hover:bg-teal-400 disabled:opacity-50 transition-colors"
            >
              {loading && (
                <RefreshCw className="h-4 w-4 animate-spin text-black/60" />
              )}
              Submit Request
            </button>
          </motion.form>
        </div>
      </PageContainer>
    );
  }

  const uploadInfo = activeSession ?? resumeMeta;

  return (
    <PageContainer showMatrix>
      <PageHeader
        title="Social Upload Hub"
        subtitle="A Facebook-style wall meets a TikTok profile—edit your look, post updates, and upload drops."
        icon={Upload}
        actions={
          <button className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        }
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <AlertBanner variant="error" message={error} icon={AlertCircle} />
        )}
        {submitted && (
          <AlertBanner
            variant="success"
            message="Upload successful! Your track is being processed."
            icon={CheckCircle}
          />
        )}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:p-6"
        >
          <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-teal-500/10 via-purple-500/10 to-black p-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,#22d3ee33,transparent_35%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,#a855f733,transparent_35%)]" />
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 border-2 border-white/20">
                      {session?.user?.image ? (
                        <AvatarImage src={session.user.image} alt={profileName} />
                      ) : null}
                      <AvatarFallback className="bg-black/50 text-white font-semibold">
                        {profileName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-lg font-semibold text-white">{profileName}</div>
                      <div className="text-sm text-white/70">@{defaultHandle}</div>
                    </div>
                    <Badge variant="secondary" className="ml-auto bg-white/10 text-white border-white/10">
                      Wall ready
                    </Badge>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{profileBio}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-white/60">
                    <Badge variant="outline" className="border-emerald-400/40 text-emerald-100 bg-emerald-500/10">
                      {profileLink}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-white/70 bg-white/5">
                      Crews discoverable
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <span><span className="text-white font-semibold">2.4k</span> followers</span>
                    <span><span className="text-white font-semibold">148</span> saves</span>
                    <span><span className="text-white font-semibold">36</span> reels</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Profile editor</h3>
                  {profileSaved && (
                    <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100">
                      Saved
                    </Badge>
                  )}
                </div>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
                  placeholder="Display name"
                />
                <Textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="min-h-[80px] bg-black/50 border border-white/10 text-white placeholder:text-white/40"
                  placeholder="Short bio"
                />
                <input
                  value={profileLink}
                  onChange={(e) => setProfileLink(e.target.value)}
                  className="w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
                  placeholder="Profile link"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Update avatar and banner from Settings</span>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                  >
                    Save profile
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Wall post</div>
                    <div className="text-xs text-white/60">Publish to your feed and crews</div>
                  </div>
                  <Badge variant="outline" className="border-white/20 text-white/70">
                    Realtime preview
                  </Badge>
                </div>
                <Textarea
                  value={wallText}
                  onChange={(e) => setWallText(e.target.value)}
                  className="mt-3 min-h-[120px] bg-black/40 border-white/10 text-white placeholder:text-white/40"
                  placeholder="Share an update, drop a link, or shout out your latest reel..."
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2 text-xs text-white/60">
                    <span className="rounded-full bg-white/10 px-3 py-1">Clip</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">Hashtags</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">Cross-post</span>
                  </div>
                  <Button
                    size="sm"
                    disabled={!wallText.trim()}
                    onClick={handleWallPost}
                    className="bg-gradient-to-r from-teal-500 to-purple-500 text-black font-semibold disabled:opacity-50"
                  >
                    Post update
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {shortClips.map((clip) => (
                  <div key={clip.id} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm text-white">
                      <div className="font-semibold">{clip.title}</div>
                      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30">
                        Reel
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>{clip.plays}</span>
                      <span className="inline-flex items-center gap-1 text-white/70">
                        <Play className="h-3 w-3" />
                        {clip.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500" style={{ width: "70%" }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {wallPosts.map((post) => (
                  <div key={post.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarFallback className="bg-gradient-to-br from-teal-500/20 to-purple-500/20 text-white">
                            {post.author.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-white font-semibold">{post.author}</div>
                          <div className="text-xs text-white/60">@{post.handle} · {post.time}</div>
                        </div>
                      </div>
                      {post.highlight && (
                        <Badge variant="outline" className="border-emerald-400/40 text-emerald-100 bg-emerald-500/10">
                          {post.highlight}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-white/80 leading-relaxed">{post.text}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-white/60">
                      {post.tag && (
                        <Badge variant="secondary" className="bg-white/10 text-white border-white/10">
                          {post.tag}
                        </Badge>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        Reply
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bookmark className="h-3 w-3" />
                        Save
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Boost
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 p-6 rounded-xl border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center">
              <Upload className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Upload new drop</h2>
              <p className="text-sm text-white/60">
                Resumable, chunked uploads keep your progress safe across refreshes. Wall + reels pull from the same source.
              </p>
            </div>
          </div>

          {resumeMeta && uploadState !== "uploading" && (
            <ResumeBanner meta={resumeMeta} onDiscard={() => rememberSession(null)} />
          )}

          <DragDropUpload
            onUpload={handleMultipleFiles}
            maxFiles={5}
            maxSize={100}
            acceptedTypes={['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/webm']}
          />

          {(uploadState === "uploading" || uploadProgress > 0) && (
            <UploadProgress
              state={uploadState}
              progress={uploadProgress}
              uploadedBytes={uploadedBytes}
              totalBytes={uploadInfo?.sizeBytes ?? 0}
              currentFile={pendingFileName ?? uploadInfo?.fileName ?? ""}
            />
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <StatCard
            title="Tracks Uploaded"
            value="12"
            description="Last 30 days"
            icon={Music}
            accent="from-teal-500/30 to-teal-600/10"
          />
          <StatCard
            title="Monthly Listeners"
            value="18,204"
            description="+12% vs last month"
            icon={Globe}
            accent="from-blue-500/30 to-blue-600/10"
          />
          <StatCard
            title="Pending Releases"
            value="3"
            description="Awaiting review"
            icon={Upload}
            accent="from-purple-500/30 to-purple-600/10"
          />
        </motion.section>
      </div>
    </PageContainer>
  );
}

function AlertBanner({
  variant,
  message,
  icon: Icon,
}: {
  variant: "error" | "success";
  message: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const colors =
    variant === "error"
      ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200";
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${colors}`}
    >
      <Icon className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div
        className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${accent}`}
      >
        <Icon className="h-5 w-5 text-white/80" />
      </div>
      <div className="text-sm text-white/60">{title}</div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="text-xs text-white/40 mt-1">{description}</div>
    </div>
  );
}

function UploadProgress({
  state,
  progress,
  uploadedBytes,
  totalBytes,
  currentFile,
}: {
  state: "idle" | "uploading" | "finalizing" | "complete";
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  currentFile: string;
}) {
  if (state === "idle") {
    return (
      <div className="rounded-lg border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-white/60">
        Select a file to begin uploading. You can refresh anytime—progress is remembered.
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span className="capitalize">{state}</span>
        <span>
          {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-white/50 truncate">
        {currentFile || "Preparing…"}
      </div>
    </div>
  );
}

function ResumeBanner({
  meta,
  onDiscard,
}: {
  meta: ResumeMeta;
  onDiscard: () => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
      <div className="flex items-center justify-between">
        <span>
          Resume upload for <span className="font-semibold">{meta.fileName}</span>
        </span>
        <button
          onClick={onDiscard}
          className="inline-flex items-center gap-1 text-xs text-yellow-200 hover:text-white transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Discard
        </button>
      </div>
      <div className="text-xs text-yellow-200/80">
        Select the same file to continue uploading ({formatBytes(meta.sizeBytes)} total).
      </div>
    </div>
  );
}

export default function UploadDashboard() {
  return (
    <RouteFeatureGate
      flag="uploads"
      title="Uploads are currently gated"
      description="Enable the uploads flag in the feature service to re-open this flow."
    >
      <UploadDashboardContent />
    </RouteFeatureGate>
  );
}
