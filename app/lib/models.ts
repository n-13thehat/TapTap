// Server-leaning typed wrappers for common Supabase selects
import { secureSelectMany } from "@/lib/supabase";

export type AlbumCard = { id: string; title: string; artist: string; cover: string };
export type PlaylistCard = { id: string; title: string; cover: string };
export type TrackCard = { id: string; title: string; artist: string; cover: string };

export async function getAlbumCards(limit = 24): Promise<AlbumCard[]> {
  return secureSelectMany<any>("Album", (q: any) => q.select("id,title,artist:artistId(stageName),coverUrl").limit(limit)).then(
    (rows) =>
      rows.map((r: any) => ({
        id: r.id,
        title: r.title ?? "Untitled",
        artist: r.artist?.stageName ?? "Unknown",
        cover: r.coverUrl ?? "/branding/cropped_tap_logo.png",
      }))
  );
}

export async function getUserPlaylists(userId: string, limit = 24): Promise<PlaylistCard[]> {
  return secureSelectMany<any>("Playlist", (q: any) => q.select("id,title,coverUrl,userId").eq("userId", userId).limit(limit)).then(
    (rows) => rows.map((r: any) => ({ id: r.id, title: r.title ?? "Playlist", cover: r.coverUrl ?? "/branding/cropped_tap_logo.png" }))
  );
}

export async function getRecentTrackCards(userId: string, limit = 24): Promise<TrackCard[]> {
  return secureSelectMany<any>(
    "PlayEvent",
    (q: any) =>
      q
        .select("track:trackId(id,title,artist:artistId(stageName),album:albumId(coverUrl))")
        .eq("userId", userId)
        .order("createdAt", { ascending: false })
        .limit(limit)
  ).then((rows) =>
    rows
      .map((r: any) => ({
        id: r.track?.id,
        title: r.track?.title ?? "Track",
        artist: r.track?.artist?.stageName ?? "Unknown",
        cover: r.track?.album?.coverUrl ?? "/branding/cropped_tap_logo.png",
      }))
      .filter((x: any) => x.id)
  );
}
