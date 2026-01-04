"use client";
import React, { useRef } from "react";
import { Composer, Feed, type PostLite } from "./ClientIslands";

export default function SocialFeedPanel({ initialPosts, userId, initialCursor, initialFollowingOnly = false, userDisplayName, userUsername, userImageUrl }: { initialPosts: PostLite[]; userId: string | null; initialCursor: string | null; initialFollowingOnly?: boolean; userDisplayName?: string | null; userUsername?: string | null; userImageUrl?: string | null }) {
  const addNewPostRef = useRef<((p: PostLite) => void) | null>(null);
  return (
    <>
      <Composer userId={userId} userDisplayName={userDisplayName ?? undefined} userUsername={userUsername ?? undefined} userImageUrl={userImageUrl ?? undefined} onPosted={(p) => addNewPostRef.current?.(p)} />
      <Feed
        initialPosts={initialPosts}
        userId={userId}
        initialCursor={initialCursor}
        initialFollowingOnly={initialFollowingOnly}
        exposeAddNewPost={(fn) => { addNewPostRef.current = fn }}
      />
    </>
  );
}

