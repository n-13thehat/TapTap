import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import os from "os";

export type SurfPlaylistItem = {
  id: string;
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnail?: string;
  publishedAt?: string;
  addedAt: string;
};

export type SurfPlaylist = {
  id: string;
  title: string;
  createdAt: string;
  items: SurfPlaylistItem[];
};

export type PosterizeItem = {
  id: string;
  title: string;
  durationSec: number;
  mintCount: number;
  priceCents: number;
  createdAt: string;
  inventory: number;
};

export type UploadSessionRecord = {
  id: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  uploadedBytes: number;
  status: "pending" | "completed";
  createdAt: string;
  finalizedAt?: string;
};

export type CreatorRequestRecord = {
  id: string;
  stageName: string;
  genre?: string;
  socialLinks?: string;
  createdAt: string;
  status: "pending" | "reviewed";
};

export type BattleFeedItem = {
  id: string;
  title: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnail?: string;
  url?: string;
};

type MemoryStore = {
  surf: {
    playlists: SurfPlaylist[];
  };
  posterize: {
    items: PosterizeItem[];
  };
  uploads: {
    sessions: Record<string, UploadSessionRecord>;
  };
  creator: {
    requests: CreatorRequestRecord[];
  };
  battles: {
    items: BattleFeedItem[];
    lastUpdated: number;
  };
};

const globalKey = "__taptap_memory_store";
const dataFile =
  process.env.TAPTAP_STORE_FILE ||
  path.join(os.tmpdir(), "taptap-mock-store.json");

function seedStore(): MemoryStore {
  const now = new Date().toISOString();
  const defaultPlaylist: SurfPlaylist = {
    id: "surf-default",
    title: "Matrix Picks",
    createdAt: now,
    items: [
      {
        id: "yt-neo",
        videoId: "dQw4w9WgXcQ",
        title: "Neo - Matrix Rain (Live)",
        channelTitle: "VX9 System",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        publishedAt: "2023-09-01T00:00:00Z",
        addedAt: now,
      },
      {
        id: "yt-trinity",
        videoId: "9bZkp7q19f0",
        title: "Trinity - Flight",
        channelTitle: "TapTap Collective",
        thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg",
        publishedAt: "2024-02-12T00:00:00Z",
        addedAt: now,
      },
    ],
  };

  const posterizeItem: PosterizeItem = {
    id: "posterize-seed",
    title: "Matrix Battle Royale",
    durationSec: 30,
    mintCount: 25,
    priceCents: 2500,
    createdAt: now,
    inventory: 25,
  };

  // No seed battles - will fetch real data from YouTube battle leagues

  return {
    surf: { playlists: [defaultPlaylist] },
    posterize: { items: [posterizeItem] },
    uploads: { sessions: {} },
    creator: { requests: [] },
    battles: { items: [], lastUpdated: Date.now() },
  };
}

function loadPersisted(): MemoryStore | null {
  try {
    const raw = fs.readFileSync(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as MemoryStore;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeStore(store: MemoryStore) {
  try {
    await fs.promises.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.promises.writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("[memoryStore] Failed to persist store", err);
  }
}

function getGlobalStore(): MemoryStore {
  const g = globalThis as any;
  if (!g[globalKey]) {
    const persisted = loadPersisted();
    g[globalKey] = persisted ?? seedStore();
    void writeStore(g[globalKey]);
  }
  return g[globalKey] as MemoryStore;
}

export function getSurfStore() {
  return getGlobalStore().surf;
}

export function getPosterizeStore() {
  return getGlobalStore().posterize;
}

export function getUploadStore() {
  return getGlobalStore().uploads;
}

export function getCreatorStore() {
  return getGlobalStore().creator;
}

export function getBattlesStore() {
  return getGlobalStore().battles;
}

export function generateId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

export async function persistStore(storeOverride?: MemoryStore) {
  const store = storeOverride ?? getGlobalStore();
  await writeStore(store);
}
