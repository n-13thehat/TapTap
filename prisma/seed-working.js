import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌌 Seeding TapTap Matrix database...");

  try {
    // Create test users
    const testUser = await prisma.user.upsert({
      where: { email: "test@taptap.ai" },
      update: {},
      create: {
        email: "test@taptap.ai",
        username: "testuser",
        authUserId: randomUUID(),
        bio: "Test user for TapTap Matrix",
        role: "CREATOR",
      },
    });

    console.log("✅ Created test user:", testUser.username);

    const vxUser = await prisma.user.upsert({
      where: { email: "vx@taptap.ai" },
      update: {},
      create: {
        email: "vx@taptap.ai",
        username: "vx",
        authUserId: randomUUID(),
        bio: "Creator of the TapTap Matrix 🌌",
        role: "ADMIN",
      },
    });

    console.log("✅ Created VX user:", vxUser.username);

    // Create artist profiles
    const testArtist = await prisma.artist.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        stageName: "Test Artist",
        about: "A test artist for the TapTap Matrix platform",
      },
    });

    console.log("✅ Created artist:", testArtist.stageName);

    // Create an album
    const album = await prisma.album.create({
      data: {
        artistId: testArtist.id,
        title: "Test Album",
        coverUrl: "https://example.com/cover.jpg",
      },
    });

    console.log("✅ Created album:", album.title);

    // Create tracks
    const track1 = await prisma.track.create({
      data: {
        artistId: testArtist.id,
        albumId: album.id,
        title: "Test Track 1",
        durationMs: 180000,
        storageKey: "test-track-1",
        mimeType: "audio/mpeg",
        visibility: "PUBLIC",
      },
    });

    const track2 = await prisma.track.create({
      data: {
        artistId: testArtist.id,
        albumId: album.id,
        title: "Test Track 2",
        durationMs: 240000,
        storageKey: "test-track-2",
        mimeType: "audio/mpeg",
        visibility: "PUBLIC",
      },
    });

    console.log("✅ Created tracks:", track1.title, "and", track2.title);

    // Create a playlist
    const playlist = await prisma.playlist.create({
      data: {
        userId: testUser.id,
        title: "My Test Playlist",
        visibility: "PUBLIC",
      },
    });

    console.log("✅ Created playlist:", playlist.title);

    // Add tracks to playlist
    await prisma.playlistTrack.createMany({
      data: [
        {
          playlistId: playlist.id,
          trackId: track1.id,
          orderIndex: 1,
        },
        {
          playlistId: playlist.id,
          trackId: track2.id,
          orderIndex: 2,
        },
      ],
    });

    console.log("✅ Added tracks to playlist");

    // Create some sample posts
    await prisma.post.create({
      data: {
        userId: testUser.id,
        text: "Just dropped my first album on TapTap Matrix! 🎵",
        type: "TEXT",
        visibility: "PUBLIC",
      },
    });

    await prisma.post.create({
      data: {
        userId: vxUser.id,
        text: "Welcome to the TapTap Matrix! The future of music is here 🌌",
        type: "TEXT",
        visibility: "PUBLIC",
      },
    });

    console.log("✅ Created sample posts");

    console.log("🎉 Database seeded successfully!");
    console.log("📊 Summary:");
    console.log("   - 2 users created");
    console.log("   - 1 artist profile");
    console.log("   - 1 album with 2 tracks");
    console.log("   - 1 playlist");
    console.log("   - 2 sample posts");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
