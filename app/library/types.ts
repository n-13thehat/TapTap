// Library types
export type ID = string;

export type Track = {
  id: ID;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  cover: string;
  audioUrl: string | null;
  saved: boolean;
  createdAt: string;
};

export type Album = {
  id: ID;
  title: string;
  artist: string;
  cover: string;
  tracks: number;
  releaseDate: string;
};

export type Artist = {
  id: ID;
  name: string;
  avatar: string;
  tracks: number;
  followers: number;
};

export type Playlist = {
  id: ID;
  title: string;
  description?: string;
  cover: string;
  tracks: number;
  updatedAt: string;
};

export type Poster = {
  id: ID;
  title: string;
  edition: string;
  tx: string; // on-chain id
  image: string;
  createdAt: string;
};

export type Trade = {
  id: ID;
  type: "buy" | "sell" | "mint" | "list" | "cancel";
  status: "pending" | "complete" | "failed";
  unit: string; // asset symbol / sku
  qty: number;
  price: number; // in TAP (or SOL mapped)
  ts: string;
};

export type LibraryPayload = {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  posters: Poster[];
  trades: Trade[];
  pass?: { feature: string; expiresAt?: string | null };
  recommendations: Track[];
};

export type SectionKey =
  | "featured"
  | "songs"
  | "game"
  | "playlists"
  | "artists"
  | "albums"
  | "mainframe"
  | "posters"
  | "trades"
  | "surf"
  | "settings";

export type TapGameTrack = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  bpm: number;
  difficulty: string;
  duration: number;
  audioUrl: string | null;
  productId: string | null;
  tapGamePrice: number | null;
  chartSeed?: number | null;
};

export type ActiveNote = {
  id: string;
  lane: number;
  spawnedAt: number;
  targetAt: number;
  status: "flying" | "hit";
};

export const EMPTY_LIBRARY_PAYLOAD: LibraryPayload = {
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  posters: [],
  trades: [],
  pass: undefined,
  recommendations: [],
};

export const DEFAULT_COVER = "/branding/cropped_tap_logo.png";
