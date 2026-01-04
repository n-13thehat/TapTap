/* =======================================================================
   app/social/page.tsx  — SERVER COMPONENT
   -----------------------------------------------------------------------
   - Optional auth (no more 404s from redirect/notFound).
   - Pulls real data from Prisma:
       • me profile (+ stats)    — when available
       • home timeline           — public or personalised
       • notifications           — when logged in
       • follow suggestions
       • message conversations   — when logged in
   - Normalises into serialisable shapes for client components:
       • <ClientSocial />  → main X/Twitter-style shell
       • <ChatDock />      → floating DM dock
   ======================================================================= */

import { cache } from "react";

import ClientSocial from "./ClientSocial";
import ChatDock from "./ChatDock";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

import {
  createPostAction,
  toggleLikeAction,
  followAction,
  sendMessageAction,
  updateBioAction,
} from "./actions";

// Server action wrapper functions - marked with "use server"
async function createPostWrapper(payload: { text: string }) {
  "use server";
  const formData = new FormData();
  formData.append('text', payload.text);
  return createPostAction(formData);
}

async function toggleLikeWrapper(payload: { postId: string }) {
  "use server";
  const formData = new FormData();
  formData.append('postId', payload.postId);
  return toggleLikeAction(formData);
}

async function followWrapper(payload: { userId: string }) {
  "use server";
  return followAction(payload.userId);
}

async function sendMessageWrapper(payload: { conversationId: string; text: string }) {
  "use server";
  const formData = new FormData();
  formData.append('conversationId', payload.conversationId);
  formData.append('text', payload.text);
  return sendMessageAction(formData);
}

async function updateBioWrapper(payload: { bio: string }) {
  "use server";
  const formData = new FormData();
  formData.append('bio', payload.bio);
  return updateBioAction(formData);
}

const FALLBACK_POSTS: RawPost[] = [];
const FALLBACK_USERS: RawUser[] = [];
const FALLBACK_NOTIFICATIONS: RawNotification[] = [];

async function withPrismaFallback<T>(cb: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await cb();
  } catch (error) {
    console.error(`[social] Prisma fallback (${label})`, error);
    return fallback;
  }
}

/* -----------------------------------------------------------------------
   Types used on the *client* side.
   ----------------------------------------------------------------------- */

export type SocialUser = {
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

export type SocialPost = {
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

export type SocialNotification = {
  id: string;
  createdAt: string;
  type:
    | "like"
    | "reply"
    | "repost"
    | "follow"
    | "mention"
    | "system"
    | "message";
  fromUser: SocialUser | null;
  post: SocialPost | null;
  messageSnippet: string | null;
  isRead: boolean;
};

export type SocialConversation = {
  id: string;
  createdAt: string;
  updatedAt: string;

  participants: SocialUser[];

  lastMessage: {
    id: string;
    text: string;
    createdAt: string;
    senderId: string;
  } | null;
};

/* -----------------------------------------------------------------------
   Raw DB result types (loose, normalised below).
   ----------------------------------------------------------------------- */

type RawUser = any;
type RawPost = any;
type RawNotification = any;
type RawConversation = any;

/* -----------------------------------------------------------------------
   Helpers
   ----------------------------------------------------------------------- */

function safeString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  return null;
}

function safeBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
}

function isoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(0).toISOString();
}

/* -----------------------------------------------------------------------
   Normalisers
   ----------------------------------------------------------------------- */

function normalizeUser(raw: RawUser, meId: string | null): SocialUser {
  const id = String(raw?.id ?? "");
  const profile = raw?.profile ?? raw;

  const followersCount =
    safeNumber(raw?._count?.followers) ||
    safeNumber(profile?.followersCount) ||
    0;

  const followingCount =
    safeNumber(raw?._count?.following) ||
    safeNumber(profile?.followingCount) ||
    0;

  const postsCount =
    safeNumber(raw?._count?.posts) || safeNumber(profile?.postsCount) || 0;

  const likesCount =
    safeNumber(raw?._count?.likes) || safeNumber(profile?.likesCount) || 0;

  const rel = raw?.viewerRelationship?.[0] ?? raw?.viewerRelationship ?? {};

  return {
    id,
    handle: safeString(profile?.handle ?? raw?.handle),
    displayName: safeString(profile?.displayName ?? raw?.displayName),
    avatarUrl: safeString(profile?.avatarUrl ?? raw?.avatarUrl),
    headerUrl: safeString(profile?.headerUrl ?? raw?.headerUrl),
    bio: safeString(profile?.bio ?? raw?.bio),
    location: safeString(profile?.location ?? raw?.location),
    website: safeString(profile?.website ?? raw?.website),
    verified: safeBool(profile?.verified ?? raw?.verified, false),
    createdAt: isoString(raw?.createdAt ?? profile?.createdAt),

    stats: {
      followers: followersCount,
      following: followingCount,
      posts: postsCount,
      likes: likesCount,
    },

    isMe: meId != null && id === meId,
    isFollowing: safeBool(rel?.isFollowing, false),
    isFollowedBy: safeBool(rel?.isFollowedBy, false),
    isMuted: safeBool(rel?.isMuted, false),
    isBlocked: safeBool(rel?.isBlocked, false),
  };
}

function normalizePost(raw: RawPost, meId: string | null): SocialPost {
  const stats = raw?.stats ?? raw?._count ?? {};
  const viewerStateRaw = Array.isArray(raw?.viewerState)
    ? raw.viewerState[0]
    : raw?.viewerState ?? {};

  const media = Array.isArray(raw?.media) ? raw.media : [];

  return {
    id: String(raw?.id ?? ""),
    createdAt: isoString(raw?.createdAt),
    updatedAt: raw?.updatedAt ? isoString(raw?.updatedAt) : null,

    author: normalizeUser(raw?.author ?? raw?.user, meId),

    text: safeString(raw?.text) ?? "",
    media: media.map((m: any) => ({
      id: String(m?.id ?? ""),
      url: String(m?.url ?? ""),
      type: (m?.type as any) ?? "image",
      blurhash: safeString(m?.blurhash),
      width: m?.width ?? null,
      height: m?.height ?? null,
    })),

    replyToId: raw?.replyToId ? String(raw.replyToId) : null,
    repostOfId: raw?.repostOfId ? String(raw.repostOfId) : null,

    likeCount: safeNumber(stats?.likes, 0),
    replyCount: safeNumber(stats?.replies, 0),
    repostCount: safeNumber(stats?.reposts, 0),
    bookmarkCount: safeNumber(stats?.bookmarks, 0),

    viewerHasLiked: safeBool(viewerStateRaw?.hasLiked, false),
    viewerHasBookmarked: safeBool(viewerStateRaw?.hasBookmarked, false),
  };
}

function normalizeNotification(
  raw: RawNotification,
  meId: string | null,
): SocialNotification {
  const type =
    (raw?.type as SocialNotification["type"]) ??
    (raw?.kind as SocialNotification["type"]) ??
    "system";

  return {
    id: String(raw?.id ?? ""),
    createdAt: isoString(raw?.createdAt),
    type,
    fromUser: raw?.fromUser ? normalizeUser(raw.fromUser, meId) : null,
    post: raw?.post ? normalizePost(raw.post, meId) : null,
    messageSnippet: safeString(raw?.messageSnippet ?? raw?.snippet),
    isRead: !!raw?.readAt || !!raw?.isRead,
  };
}

function normalizeConversation(
  raw: RawConversation,
  meId: string | null,
): SocialConversation {
  const participantsRaw: any[] =
    raw?.participants ??
    raw?.conversationParticipants ??
    raw?.members ??
    [];

  const messages: any[] = Array.isArray(raw?.messages) ? raw.messages : [];
  const lastMessage = messages[0] ?? null;

  return {
    id: String(raw?.id ?? ""),
    createdAt: isoString(raw?.createdAt),
    updatedAt: isoString(raw?.updatedAt ?? raw?.createdAt),

    participants: participantsRaw.map((p) =>
      normalizeUser(p?.user ?? p, meId),
    ),

    lastMessage: lastMessage
      ? {
          id: String(lastMessage.id ?? ""),
          text: safeString(lastMessage.text) ?? "",
          createdAt: isoString(lastMessage.createdAt),
          senderId: String(lastMessage.senderId ?? ""),
        }
      : null,
  };
}

/* -----------------------------------------------------------------------
   Prisma query helpers (memoised with `cache`).
   ----------------------------------------------------------------------- */

const getMeRaw = cache(async (userId: string | null) => {
  if (!userId) return null;

  return withPrismaFallback(
    () =>
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          _count: {
            select: {
              // TODO: Add followers/following/posts/likes relationships to User schema
              // followers: true,
              // following: true,
              // posts: true,
              // likes: true,
            },
          },
          // TODO: Add viewerRelationship to User schema
          // viewerRelationship: {
          //   where: { viewerId: userId },
          //   select: {
          //     isMuted: true,
          //     isBlocked: true,
          //     isFollowing: true,
          //     isFollowedBy: true,
          //   },
          // },
        },
      }) as unknown as RawUser | null,
    null,
    "getMeRaw",
  );
});

const getTimelineRaw = cache(async (userId: string | null) => {
  const where: any = {};

  return withPrismaFallback(
    () =>
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 120,
        include: {
          user: {
            include: {
              profile: true,
              // TODO: Add _count when relationships are available
              // _count: {
              //   select: {
              //     followers: true,
              //     following: true,
              //     posts: true,
              //     likes: true,
              //   },
              // },
              // TODO: Add viewerRelationship to User schema
              // viewerRelationship: userId
              //   ? {
              //       where: { viewerId: userId },
              //       select: {
              //         isMuted: true,
              //         isBlocked: true,
              //         isFollowing: true,
              //         isFollowedBy: true,
              //       },
              //     }
              //   : false,
            },
          },
          // TODO: Add media relationship to Post schema
          // media: true,
          // TODO: Add _count when relationships are available
          // _count: {
          //   select: {
          //     likes: true,
          //     replies: true,
          //     reposts: true,
          //     bookmarks: true,
          //   },
          // },
          // TODO: Add viewerState relationship to Post schema
          // viewerState: userId
          //   ? {
          //       where: { userId },
          //       select: {
          //         hasLiked: true,
          //         hasBookmarked: true,
          //       },
          //     }
          //   : false,
        },
      }) as unknown as RawPost[],
    FALLBACK_POSTS,
    "getTimelineRaw",
  );
});

const getNotificationsRaw = cache(async (userId: string | null) => {
  if (!userId) return FALLBACK_NOTIFICATIONS;

  return withPrismaFallback(
    () =>
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 80,
        include: {
          user: {
            include: {
              profile: true,
              _count: {
                select: {
                  // TODO: Add followers/following/posts/likes relationships to User schema
                  // followers: true,
                  // following: true,
                  // posts: true,
                  // likes: true,
                },
              },
            },
          },
          // TODO: Add post relationship to Notification schema
          // post: {
          //   include: {
          //     author: {
          //       include: {
          //         profile: true,
          //         _count: {
          //           select: {
          //             followers: true,
          //             following: true,
          //             posts: true,
          //             likes: true,
          //           },
          //         },
          //       },
          //     },
          //     media: true,
          //     _count: {
          //       select: {
          //         likes: true,
          //         replies: true,
          //         reposts: true,
          //         bookmarks: true,
          //       },
          //     },
          //   },
          // },
        },
      }) as unknown as RawNotification[],
    FALLBACK_NOTIFICATIONS,
    "getNotificationsRaw",
  );
});

const getSuggestionsRaw = cache(async (userId: string | null) => {
  return withPrismaFallback(
    () =>
      prisma.user.findMany({
        where: userId
          ? {
              id: { not: userId },
              // TODO: Add followers relationship to User schema
              // followers: { none: { followerId: userId } },
            }
          : {},
        orderBy: {
          // TODO: Add followers relationship to User schema
          // followers: {
          //   _count: "desc",
          // },
          createdAt: "desc",
        },
        take: 24,
        include: {
          profile: true,
          // TODO: Add _count when relationships are available
          // _count: {
          //   select: {
          //     followers: true,
          //     following: true,
          //     posts: true,
          //     likes: true,
          //   },
          // },
          // TODO: Add viewerRelationship to User schema
          // viewerRelationship: userId
          //   ? {
          //       where: { viewerId: userId },
          //       select: {
          //         isMuted: true,
          //         isBlocked: true,
          //         isFollowing: true,
          //         isFollowedBy: true,
          //       },
          //     }
          //   : false,
        },
      }) as unknown as RawUser[],
    FALLBACK_USERS,
    "getSuggestionsRaw",
  );
});

const getConversationsRaw = cache(async (userId: string | null) => {
  if (!userId) return [] as RawConversation[];

  // TODO: Add Conversation model to Prisma schema
  return [] as RawConversation[];
});

/* -----------------------------------------------------------------------
   Aggregator: loads everything the social surface needs.
   ----------------------------------------------------------------------- */

async function getSocialBootstrap() {
  // Auth is optional; if it fails or there is no session we still show
  // a public, read-only social experience.
  let session: any = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  const meId: string | null = (session?.user as any)?.id ?? null;

  const [meRaw, timelineRaw, notificationsRaw, suggestionsRaw, convosRaw] =
    await Promise.all([
      getMeRaw(meId),
      getTimelineRaw(meId),
      getNotificationsRaw(meId),
      getSuggestionsRaw(meId),
      getConversationsRaw(meId),
    ]);

  // If Prisma has a user row, use it, otherwise build a lightweight
  // in-memory identity from the session (or leave as guest).
  let me: SocialUser | null = null;

  if (meRaw) {
    me = normalizeUser(meRaw, meId);
  } else if (meId || session?.user) {
    me = {
      id: meId ?? "guest",
      handle: null,
      displayName:
        (session?.user as any)?.name ??
        (session?.user as any)?.email ??
        "Guest",
      avatarUrl: null,
      headerUrl: null,
      bio: null,
      location: null,
      website: null,
      verified: false,
      createdAt: new Date().toISOString(),
      stats: {
        followers: 0,
        following: 0,
        posts: 0,
        likes: 0,
      },
      isMe: !!meId,
      isFollowing: false,
      isFollowedBy: false,
      isMuted: false,
      isBlocked: false,
    };
  }

  const timeline: SocialPost[] = (timelineRaw ?? []).map((p) =>
    normalizePost(p, meId),
  );

  const notifications: SocialNotification[] = (notificationsRaw ?? []).map(
    (n) => normalizeNotification(n, meId),
  );

  const suggestions: SocialUser[] = (suggestionsRaw ?? []).map((u) =>
    normalizeUser(u, meId),
  );

  const conversations: SocialConversation[] = (convosRaw ?? []).map((c) =>
    normalizeConversation(c, meId),
  );

  return {
    meId,
    me,
    timeline,
    notifications,
    suggestions,
    conversations,
  };
}

/* -----------------------------------------------------------------------
   Page (server component)
   ----------------------------------------------------------------------- */

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const {
    meId,
    me,
    timeline,
    notifications,
    suggestions,
    conversations,
  } = await getSocialBootstrap();

  return (
    <>
      <ClientSocial
        meId={me?.id || null}
        initialFeed={timeline}
        suggestions={suggestions}
        conversations={conversations}
        actions={{
          createPost: createPostWrapper,
          toggleLike: toggleLikeWrapper,
          follow: followWrapper,
          sendMessage: sendMessageWrapper,
          updateBio: updateBioWrapper,
        }}
      />

      {/* TODO: Fix ChatDock props compatibility */}
      {/* <ChatDock
        meId={meId}
        conversations={conversations}
        onSend={async (conversationId: string, text: string) =>
          sendMessageAction({ conversationId, text })
        }
      /> */}
    </>
  );
}
