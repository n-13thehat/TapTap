"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

export default function StarterAlbumTeaser() {
  const title = "Music For The Future - Vx9";
  const [cover, setCover] = useState<string>("/branding/cropped_tap_logo.png");
  const [owned, setOwned] = useState<boolean>(false);
  const { data: session } = useSession();
  const userId = (session as any)?.user?.id as string | undefined;

  useEffect(() => {
    let canceled = false;
    async function fetchCover() {
      try {
        const { data } = await supabase
          .from("Album")
          .select("coverUrl")
          .eq("title", title)
          .limit(1);
        const url = (data && Array.isArray(data) && (data[0] as any)?.coverUrl) || null;
        if (!canceled && url) setCover(url);
      } catch {}
    }
    fetchCover();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    async function checkOwned() {
      try {
        if (!userId) return;
        const cacheKey = `starter.album.owned:${userId}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached === 'true') { setOwned(true); return; }
        // Get album id
        const { data: alb } = await supabase
          .from("Album")
          .select("id")
          .eq("title", title)
          .limit(1);
        const albumId = (alb && Array.isArray(alb) && (alb[0] as any)?.id) || null;
        if (!albumId) return;
        // Get user library id
        const { data: lib } = await supabase
          .from("Library")
          .select("id")
          .eq("userId", userId)
          .limit(1);
        const libraryId = (lib && Array.isArray(lib) && (lib[0] as any)?.id) || null;
        if (!libraryId) return;
        // Get some library items and check album match
        const { data: items } = await supabase
          .from("LibraryItem")
          .select("track:trackId(albumId)")
          .eq("libraryId", libraryId)
          .limit(200);
        const has = (items || []).some((r: any) => r?.track?.albumId === albumId);
        if (!canceled) {
          setOwned(has);
          if (has) sessionStorage.setItem(cacheKey, 'true');
        }
      } catch {}
    }
    checkOwned();
    return () => { canceled = true; };
  }, [userId]);
  return (
    <div className="mx-auto my-6 max-w-[1600px] px-4">
      <Link href="/library" className="block rounded-2xl border border-teal-500/30 bg-teal-500/10 p-3 hover:bg-teal-500/15">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-md ring-1 ring-teal-400/30">
            <Image src={cover} alt="Starter album cover" fill className="object-cover" />
          </div>
          <span title="Featured starter album" className="rounded-md bg-teal-400 px-2 py-0.5 text-[10px] font-bold text-black">Pinned</span>
          {owned && (
            <span title="This album is in your library" className="rounded-md bg-emerald-400/90 px-2 py-0.5 text-[10px] font-bold text-black ring-1 ring-emerald-300/70">
              You own this
            </span>
          )}
          <div className="truncate text-sm font-semibold text-teal-300">{title}</div>
          <span className="ml-auto text-xs text-white/60">Open Library ?</span>
        </div>
      </Link>
    </div>
  );
}
