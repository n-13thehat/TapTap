import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("🌌 Seeding TapTap Matrix: ZION (Extended Social Edition)...");

  // --- CORE CHARACTERS ---
  const vx = await prisma.user.upsert({
    where: { email: "vx@taptap.ai" },
    update: {},
    create: {
      email: "vx@taptap.ai",
      username: "vx",
      authUserId: randomUUID(),
      avatarUrl: "https://taptap-storage.vercel.app/avatars/vx.png",
      bio: "Creator of the TapTap Matrix 🌌",
    },
  });

  const muse = await prisma.user.upsert({
    where: { email: "muse@taptap.ai" },
    update: {},
    create: {
      email: "muse@taptap.ai",
      name: "Muse",
      avatarUrl: "https://taptap-storage.vercel.app/avatars/muse.png",
      bio: "AI interviewer and artist onboarding assistant 🎙️",
      wallet: { create: { balance: 420 } },
    },
  });

  const hope = await prisma.user.upsert({
    where: { email: "hope@taptap.ai" },
    update: {},
    create: {
      email: "hope@taptap.ai",
      name: "Hope",
      avatarUrl: "https://taptap-storage.vercel.app/avatars/branding/hope.png",
      bio: "Your personal AI listener and music recommender 🎧",
      wallet: { create: { balance: 777 } },
    },
  });

  const treasure = await prisma.user.upsert({
    where: { email: "treasure@taptap.ai" },
    update: {},
    create: {
      email: "treasure@taptap.ai",
      name: "Treasure",
      avatarUrl: "https://taptap-storage.vercel.app/avatars/branding/treasure.png",
      bio: "TapCoin guardian 💰💎",
      wallet: { create: { balance: 1337 } },
    },
  });

  // --- ARTISTS & LISTENERS ---
  const genres = ["R&B", "Hip-Hop", "Pop", "Electronic", "Afrobeat", "Lo-Fi"];
  const demoArtists = [];
  const demoListeners = [];

  for (let i = 1; i <= 10; i++) {
    const artist = await prisma.user.create({
      data: {
        email: `artist${i}@taptap.ai`,
        name: `Artist ${i}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=artist${i}`,
        bio: `${randomItem(genres)} artist bringing waves 🌊`,
        wallet: { create: { balance: randomInt(100, 2000) } },
      },
    });
    demoArtists.push(artist);
  }

  for (let i = 1; i <= 10; i++) {
    const listener = await prisma.user.create({
      data: {
        email: `listener${i}@taptap.ai`,
        name: `Listener ${i}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=listener${i}`,
        bio: "Just vibing on TapTap 🎧",
        wallet: { create: { balance: randomInt(50, 500) } },
      },
    });
    demoListeners.push(listener);
  }

  // --- MUSIC ---
  const demoSongs = [
    "Galactic Flow",
    "Digital Love",
    "Neon Nights",
    "Dreamstate",
    "Echoes of Time",
    "Velvet Pulse",
    "Crimson Sky",
    "Eternal Drift",
    "Soul Circuit",
    "Sonic Bloom",
  ];

  for (const artist of demoArtists) {
    const songCount = randomInt(1, 3);
    for (let i = 0; i < songCount; i++) {
      const title = randomItem(demoSongs);
      await prisma.music.create({
        data: {
          title,
          artistId: artist.id,
          genre: randomItem(genres),
          bpm: randomInt(80, 160),
          duration: randomInt(150, 300),
          fileUrl: `https://taptap-storage.vercel.app/tracks/${title
            .toLowerCase()
            .replace(/\s+/g, "-")}.mp3`,
          coverUrl: `https://picsum.photos/seed/${title}/500/500`,
          plays: randomInt(100, 10000),
          likes: randomInt(10, 500),
        },
      });
    }
  }

  // --- POSTS ---
  const postPhrases = [
    "Just dropped a new beat!",
    "Feeling inspired tonight 🌙",
    "TapTap vibes only 💫",
    "Another one 🎶",
    "Streaming live soon 🔴",
    "Studio locked in 🎧",
  ];

  for (const artist of demoArtists) {
    const postCount = randomInt(1, 3);
    for (let i = 0; i < postCount; i++) {
      await prisma.post.create({
        data: {
          content: `${randomItem(postPhrases)} #${randomItem(genres)}`,
          imageUrl: `https://picsum.photos/seed/${artist.id + i}/600/400`,
          authorId: artist.id,
          likes: randomInt(1, 100),
        },
      });
    }
  }

  // --- TRANSACTIONS ---
  const allUsers = [vx, muse, hope, treasure, ...demoArtists, ...demoListeners];
  for (const user of allUsers) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (wallet) {
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          userId: user.id,
          type: randomItem(["airdrop", "stream_reward", "purchase"]),
          amount: randomInt(5, 200),
          description: "Matrix microtransaction 💸",
        },
      });
    }
  }

  console.log("✅ TapTap Matrix ZION seeded with artists, listeners, music & posts!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

