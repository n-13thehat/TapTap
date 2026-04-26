import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { withServiceRole } from "@/lib/supabase";
import { MusicService } from "@/lib/services/musicService";
import logger from "@/lib/logger";

type TrackBody = {
  title?: string;
  albumId?: string | null;
  mimeType?: string | null;
  bucket?: string | null;
};

function pickBucket(input?: string | null) {
  return input?.trim() || process.env.AUDIO_BUCKET || "audio";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const albumId = searchParams.get('albumId');
    const query = searchParams.get('q');
    const trackId = searchParams.get('id');

    let tracks;

    if (trackId) {
      const track = await MusicService.getTrackById(trackId);
      return NextResponse.json({ track });
    } else if (query) {
      tracks = await MusicService.searchTracks(query);
    } else if (artistId) {
      tracks = await MusicService.getTracksByArtist(artistId);
    } else if (albumId) {
      tracks = await MusicService.getTracksByAlbum(albumId);
    } else {
      tracks = await MusicService.getAllTracks();
    }

    return NextResponse.json({ tracks });
  } catch (error) {
    logger.error('Failed to fetch tracks', { metadata: { error: String(error) } });
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = (session as any)?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if ((user as any).role !== "CREATOR" && (user as any).role !== "ADMIN") return NextResponse.json({ error: "Creator access required" }, { status: 403 });

    const body = (await req.json()) as TrackBody;
    const title = String(body.title || "").trim();
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

    // Resolve artist record
    const artist = await prisma.artist.findFirst({ where: { userId: user.id }, select: { id: true } });
    if (!artist) return NextResponse.json({ error: "No artist profile for user" }, { status: 400 });

    const bucket = pickBucket(body.bucket);

    // Create a Track row first to get ID
    const track = await prisma.track.create({
      data: {
        artistId: artist.id,
        albumId: body.albumId || null,
        title,
        mimeType: body.mimeType || null,
        visibility: "UNLISTED" as any,
      },
      select: { id: true },
    });

    const relativePath = `${user.id}/${track.id}`;
    const storageKey = `${bucket}/${relativePath}`;

    // Generate a signed upload URL
    const signed = await withServiceRole(async (c) => {
      const r = await (c.storage as any).from(bucket).createSignedUploadUrl(relativePath);
      if (r.error) throw new Error(r.error.message);
      return r as { data: { token: string; path: string } };
    });

    // Persist storageKey on the Track
    await prisma.track.update({ where: { id: track.id }, data: { storageKey } });

    return NextResponse.json({ ok: true, trackId: track.id, bucket, path: relativePath, storageKey, upload: signed.data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
