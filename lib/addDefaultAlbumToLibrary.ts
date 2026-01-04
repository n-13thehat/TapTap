import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_ALBUM_ARTIST,
  DEFAULT_ALBUM_BUCKET,
  DEFAULT_ALBUM_NAME,
  DEFAULT_ALBUM_STORAGE_DASHBOARD_URL,
} from "@/lib/defaultAlbumConfig";

export async function addDefaultAlbumToLibrary(userId: string) {
  try {
    console.debug?.("Default album bucket dashboard:", DEFAULT_ALBUM_STORAGE_DASHBOARD_URL);
    const bucket = DEFAULT_ALBUM_BUCKET;
    const { data, error } = await supabase.storage.from(bucket).list();
    if (error) throw error;
    const mp3s = (data ?? []).filter((f) => f.name.endsWith(".mp3"));
    if (!mp3s.length) {
      console.log("No tracks found in bucket:", bucket);
      return;
    }

    // Ensure system user/artist/album to attach tracks
    const systemEmail = "vx9-system@taptap.local";
    const systemUsername = "vx9-system";
    const albumTitle = DEFAULT_ALBUM_NAME;
    const coverUrl = "/branding/cropped_tap_logo.png";

    let systemUser = await prisma.user.findUnique({ where: { email: systemEmail } });
    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: systemEmail,
          username: systemUsername,
          authUserId: crypto.randomUUID(),
          verified: "VERIFIED" as any,
        },
      });
    }

    let systemArtist = await prisma.artist.findUnique({ where: { userId: systemUser.id } });
    if (!systemArtist) {
      systemArtist = await prisma.artist.create({ data: { userId: systemUser.id, stageName: DEFAULT_ALBUM_ARTIST } });
    }

    let album = await prisma.album.findFirst({ where: { title: albumTitle, artistId: systemArtist.id } });
    if (!album) {
      album = await prisma.album.create({ data: { artistId: systemArtist.id, title: albumTitle, coverUrl } });
    }

    // Ensure recipient library
    let library = await prisma.library.findUnique({ where: { userId } });
    if (!library) library = await prisma.library.create({ data: { userId } });

    for (const file of mp3s) {
      const storageKey = `${bucket}/${file.name}`;
      const title = file.name.replace(/\.mp3$/, "");
      const existing = await prisma.track.findFirst({ where: { storageKey } });
      const track =
        existing ??
        (await prisma.track.create({
          data: {
            title,
            artistId: systemArtist.id,
            albumId: album.id,
            storageKey,
            mimeType: "audio/mpeg",
            visibility: "PUBLIC" as any,
          },
        }));
      await prisma.libraryItem.upsert({
        where: { libraryId_trackId: { libraryId: library.id, trackId: track.id } },
        update: {},
        create: { libraryId: library.id, trackId: track.id },
      });
    }

    console.log(`Default album added to library for user ${userId}`);
  } catch (err) {
    console.error("addDefaultAlbumToLibrary:", err);
  }
}
