import {
  DeezerAlbum,
  DeezerArtist,
  DeezerGenre,
  DeezerTrack,
  getAlbum,
  getArtistAlbums,
  getArtistTopTracks,
  getGenreTopArtists,
  getGenres,
  getTrack,
} from "@/lib/deezer/client";

export const DEEZER_TRACK_TAP_PRICE = 100;
export const DEEZER_ALBUM_TAP_PRICE = 1000;

export type DeezerListing = {
  id: string; // deezer:track:{id} or deezer:album:{id}
  type: "track" | "album";
  title: string;
  artistId: string;
  artistName: string;
  priceTap: number;
  coverUrl?: string;
  deezerUrl?: string;
  previewUrl?: string;
  genreId?: string;
  royaltyKey: string; // deezer:{artistId}
};

function coverUrlFromAlbum(album?: DeezerAlbum) {
  return album?.cover_medium || album?.cover || album?.cover_small;
}

function coverUrlFromTrack(track: DeezerTrack) {
  return coverUrlFromAlbum(track.album);
}

export function mapTrackToListing(track: DeezerTrack, genreId?: string): DeezerListing {
  const artistId = String(track?.artist?.id ?? track?.album?.artist?.id ?? "unknown");
  return {
    id: `deezer:track:${track.id}`,
    type: "track",
    title: track.title,
    artistId,
    artistName: track.artist?.name || track.album?.artist?.name || "Unknown Artist",
    priceTap: DEEZER_TRACK_TAP_PRICE,
    coverUrl: coverUrlFromTrack(track),
    deezerUrl: track.link,
    previewUrl: track.preview,
    genreId,
    royaltyKey: `deezer:${artistId}`,
  };
}

export function mapAlbumToListing(album: DeezerAlbum, genreId?: string): DeezerListing {
  const artistId = String(album?.artist?.id ?? "unknown");
  return {
    id: `deezer:album:${album.id}`,
    type: "album",
    title: album.title,
    artistId,
    artistName: album.artist?.name || "Unknown Artist",
    priceTap: DEEZER_ALBUM_TAP_PRICE,
    coverUrl: coverUrlFromAlbum(album),
    deezerUrl: album.link,
    genreId,
    royaltyKey: `deezer:${artistId}`,
  };
}

export async function getGenreTabs(limit = 8): Promise<DeezerGenre[]> {
  const genres = await getGenres();
  return genres.filter((g) => g.id !== 0).slice(0, limit); // remove "All" pseudo-genre (id=0)
}

export async function getGenreTopSummary(genreId: string) {
  const artists = await getGenreTopArtists(genreId, 10);
  const rows = await Promise.all(
    artists.map(async (artist: DeezerArtist) => {
      const [topTracks, topAlbums] = await Promise.all([
        getArtistTopTracks(artist.id, 1),
        getArtistAlbums(artist.id, 1),
      ]);
      return {
        artist,
        topTrack: topTracks?.[0] ?? null,
        topAlbum: topAlbums?.[0] ?? null,
      };
    })
  );
  return rows;
}

export async function getListingsForGenre(genreId: string): Promise<DeezerListing[]> {
  const summary = await getGenreTopSummary(genreId);
  const listings: DeezerListing[] = [];
  summary.forEach((row) => {
    if (row.topTrack) listings.push(mapTrackToListing(row.topTrack, genreId));
    if (row.topAlbum) listings.push(mapAlbumToListing(row.topAlbum, genreId));
  });
  const seen = new Set<string>();
  return listings.filter((l) => {
    if (seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  });
}

export async function getListingById(listingId: string): Promise<DeezerListing | null> {
  if (!listingId.startsWith("deezer:")) return null;
  const [, type, id] = listingId.split(":");
  if (!type || !id) return null;
  if (type === "track") {
    const track = await getTrack(id).catch(() => null);
    return track ? mapTrackToListing(track) : null;
  }
  if (type === "album") {
    const album = await getAlbum(id).catch(() => null);
    return album ? mapAlbumToListing(album) : null;
  }
  return null;
}
