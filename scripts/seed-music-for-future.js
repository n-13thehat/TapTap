import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function seedMusicForTheFuture() {
  console.log("🎵 Seeding TapTap Matrix with Music for the Future...");

  try {
    // Create futuristic artists
    const futureUser = await prisma.user.upsert({
      where: { email: "future@taptap.ai" },
      update: {},
      create: {
        email: "future@taptap.ai",
        username: "futurebeats",
        authUserId: randomUUID(),
        bio: "Creating the soundtrack for tomorrow 🚀",
        role: "CREATOR",
        avatarUrl: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=400&fit=crop&crop=face"
      },
    });

    const synthUser = await prisma.user.upsert({
      where: { email: "synth@taptap.ai" },
      update: {},
      create: {
        email: "synth@taptap.ai",
        username: "synthwave2050",
        authUserId: randomUUID(),
        bio: "Neon dreams and digital soundscapes ⚡",
        role: "CREATOR",
        avatarUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=face"
      },
    });

    const aiUser = await prisma.user.upsert({
      where: { email: "ai@taptap.ai" },
      update: {},
      create: {
        email: "ai@taptap.ai",
        username: "aicomposer",
        authUserId: randomUUID(),
        bio: "AI-generated music from the year 3000 🤖",
        role: "CREATOR",
        avatarUrl: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=400&h=400&fit=crop&crop=face"
      },
    });

    // Create artist profiles
    const futureArtist = await prisma.artist.upsert({
      where: { userId: futureUser.id },
      update: {},
      create: {
        userId: futureUser.id,
        stageName: "Future Beats",
        about: "Pioneering the sound of tomorrow with cutting-edge electronic compositions",
      },
    });

    const synthArtist = await prisma.artist.upsert({
      where: { userId: synthUser.id },
      update: {},
      create: {
        userId: synthUser.id,
        stageName: "SynthWave 2050",
        about: "Retro-futuristic synthwave that bridges past and future",
      },
    });

    const aiArtist = await prisma.artist.upsert({
      where: { userId: aiUser.id },
      update: {},
      create: {
        userId: aiUser.id,
        stageName: "AI Composer",
        about: "Artificial intelligence creating authentic emotional experiences through music",
      },
    });

    // Create futuristic albums
    const futureAlbum = await prisma.album.create({
      data: {
        artistId: futureArtist.id,
        title: "Digital Horizons",
        coverUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&h=600&fit=crop",
      },
    });

    const synthAlbum = await prisma.album.create({
      data: {
        artistId: synthArtist.id,
        title: "Neon Nights",
        coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop",
      },
    });

    const aiAlbum = await prisma.album.create({
      data: {
        artistId: aiArtist.id,
        title: "Neural Networks",
        coverUrl: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=600&h=600&fit=crop",
      },
    });

    // Create futuristic tracks
    const futureTracks = [
      {
        artistId: futureArtist.id,
        albumId: futureAlbum.id,
        title: "Quantum Leap",
        durationMs: 245000,
        storageKey: "future-quantum-leap.mp3",
        mimeType: "audio/mpeg",
        visibility: "PUBLIC",
      },
      {
        artistId: futureArtist.id,
        albumId: futureAlbum.id,
        title: "Holographic Dreams",
        durationMs: 198000,
        storageKey: "future-holographic-dreams.mp3",
        mimeType: "audio/mpeg",
        visibility: "PUBLIC",
      },
      {
        artistId: futureArtist.id,
        albumId: futureAlbum.id,
        title: "Cybernetic Soul",
        durationMs: 267000,
        storageKey: "future-cybernetic-soul.mp3",
        mimeType: "audio/mpeg",
        visibility: "PUBLIC",
      },
      {
        artistId: synthArtist.id,
        albumId: synthAlbum.id,
        title: "Neon Highway",
        durationMs: 312000,
        storageKey: "synth-neon-highway.mp3",
        mimeType: "audio/mpeg",
        visibility: "PUBLIC",
      },
      {
        artistId: synthArtist.id,
        albumId: synthAlbum.id,
        title: "Electric Sunset",
        durationMs: 289000,
        storageKey: "synth-electric-sunset.mp3",
        mimeType: "audio/mpeg",
        visibility: "PUBLIC",
      },
      {
        artistId: aiArtist.id,
        albumId: aiAlbum.id,
        title: "Deep Learning",
        durationMs: 234000,
        storageKey: "ai-deep-learning.mp3",
        mimeType: "audio/mpeg",
        visibility: "PUBLIC",
      },
      {
        artistId: aiArtist.id,
        albumId: aiAlbum.id,
        title: "Machine Dreams",
        durationMs: 276000,
        storageKey: "ai-machine-dreams.mp3",
        mimeType: "audio/mpeg",
        visibility: "PUBLIC",
      },
    ];

    for (const trackData of futureTracks) {
      await prisma.track.create({ data: trackData });
    }

    // Create futuristic playlists
    const futurePlaylist = await prisma.playlist.create({
      data: {
        userId: futureUser.id,
        title: "Music for the Future",
        visibility: "PUBLIC",
      },
    });

    const chillPlaylist = await prisma.playlist.create({
      data: {
        userId: synthUser.id,
        title: "Future Chill",
        visibility: "PUBLIC",
      },
    });

    // Add tracks to playlists
    const allTracks = await prisma.track.findMany({
      where: {
        storageKey: {
          in: futureTracks.map(t => t.storageKey)
        }
      }
    });

    // Add all tracks to "Music for the Future" playlist
    for (let i = 0; i < allTracks.length; i++) {
      await prisma.playlistTrack.create({
        data: {
          playlistId: futurePlaylist.id,
          trackId: allTracks[i].id,
          orderIndex: i + 1,
        },
      });
    }

    // Add some tracks to "Future Chill" playlist
    const chillTracks = allTracks.filter(t => 
      t.storageKey.includes('electric-sunset') || 
      t.storageKey.includes('holographic-dreams') ||
      t.storageKey.includes('machine-dreams')
    );

    for (let i = 0; i < chillTracks.length; i++) {
      await prisma.playlistTrack.create({
        data: {
          playlistId: chillPlaylist.id,
          trackId: chillTracks[i].id,
          orderIndex: i + 1,
        },
      });
    }

    // Create some futuristic posts
    await prisma.post.create({
      data: {
        userId: futureUser.id,
        text: "Just dropped 'Quantum Leap' - a journey through digital dimensions! 🚀✨ #MusicForTheFuture",
        type: "TEXT",
        visibility: "PUBLIC",
      },
    });

    await prisma.post.create({
      data: {
        userId: synthUser.id,
        text: "New synthwave album 'Neon Nights' is live! Perfect for your late-night coding sessions 🌃💻",
        type: "TEXT",
        visibility: "PUBLIC",
      },
    });

    await prisma.post.create({
      data: {
        userId: aiUser.id,
        text: "My AI composed 'Deep Learning' using neural networks trained on 10,000 hours of electronic music 🤖🎵",
        type: "TEXT",
        visibility: "PUBLIC",
      },
    });

    console.log("🎉 Music for the Future seeded successfully!");
    console.log("📊 Summary:");
    console.log("   - 3 futuristic artists created");
    console.log("   - 3 albums with stunning covers");
    console.log("   - 7 cutting-edge tracks");
    console.log("   - 2 curated playlists");
    console.log("   - 3 social posts");
    console.log("");
    console.log("🎵 Ready to test the complete system!");

  } catch (error) {
    console.error("❌ Error seeding Music for the Future:", error);
    throw error;
  }
}

seedMusicForTheFuture()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
