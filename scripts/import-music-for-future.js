import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Path to your Music For The Future collection
const MUSIC_DIR = path.join(process.cwd(), 'app', 'stemstation', 'Music For The Future -vx9');

async function importMusicForTheFuture() {
  console.log("🎵 Importing Music For The Future -vx9 collection...");
  console.log(`📁 Source: ${MUSIC_DIR}`);

  try {
    // Check if directory exists
    if (!fs.existsSync(MUSIC_DIR)) {
      throw new Error(`Music directory not found: ${MUSIC_DIR}`);
    }

    // Create VX artist (the creator) - Featured Artist
    const vxUser = await prisma.user.upsert({
      where: { email: "vx@taptap.ai" },
      update: {},
      create: {
        email: "vx@taptap.ai",
        username: "vx",
        authUserId: randomUUID(),
        bio: "Visionary creator of Music For The Future 🌌 | Featured Artist on TapTap Matrix",
        role: "ADMIN",
        avatarUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=face"
      },
    });

    console.log("✅ Created VX user:", vxUser.username);

    // Create VX artist profile - Featured Artist
    const vxArtist = await prisma.artist.upsert({
      where: { userId: vxUser.id },
      update: {},
      create: {
        userId: vxUser.id,
        stageName: "VX",
        about: "Visionary artist creating the soundtrack for tomorrow. Featured creator on TapTap Matrix with the groundbreaking 'Music For The Future -vx9' collection."
      },
    });

    console.log("✅ Created VX artist profile");

    // Create the album
    const album = await prisma.album.create({
      data: {
        artistId: vxArtist.id,
        title: "Music For The Future -vx9",
        coverUrl: null, // We'll update this if cover.jpg exists
      },
    });

    console.log("✅ Created album:", album.title);

    // Check for cover image
    const coverPath = path.join(MUSIC_DIR, 'cover (1).jpg');
    if (fs.existsSync(coverPath)) {
      // Copy cover to public directory for serving
      const publicCoverPath = path.join(process.cwd(), 'public', 'covers', `${album.id}.jpg`);
      const publicCoverDir = path.dirname(publicCoverPath);
      
      if (!fs.existsSync(publicCoverDir)) {
        fs.mkdirSync(publicCoverDir, { recursive: true });
      }
      
      fs.copyFileSync(coverPath, publicCoverPath);
      
      // Update album with cover URL
      await prisma.album.update({
        where: { id: album.id },
        data: { coverUrl: `/covers/${album.id}.jpg` }
      });
      
      console.log("✅ Added album cover");
    }

    // Get all MP3 files
    const files = fs.readdirSync(MUSIC_DIR);
    const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));

    console.log(`🎵 Found ${mp3Files.length} music files:`, mp3Files);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Import each track
    for (let i = 0; i < mp3Files.length; i++) {
      const fileName = mp3Files[i];
      const filePath = path.join(MUSIC_DIR, fileName);
      
      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeBytes = stats.size;
      
      // Generate storage key
      const storageKey = `vx-${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadPath = path.join(uploadsDir, storageKey);
      
      // Copy file to uploads directory
      fs.copyFileSync(filePath, uploadPath);
      
      // Clean up track title (remove file extension and clean formatting)
      const trackTitle = fileName
        .replace('.mp3', '')
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Estimate duration (rough estimate: 1MB ≈ 1 minute for MP3)
      const estimatedDurationMs = Math.floor((fileSizeBytes / (1024 * 1024)) * 60 * 1000);

      // Create track in database
      const track = await prisma.track.create({
        data: {
          artistId: vxArtist.id,
          albumId: album.id,
          title: trackTitle,
          durationMs: estimatedDurationMs,
          storageKey: storageKey,
          mimeType: "audio/mpeg",
          visibility: "PUBLIC",
        },
      });

      console.log(`✅ Imported: "${trackTitle}" (${Math.round(fileSizeBytes / (1024 * 1024))}MB)`);
    }

    // Create "Music For The Future" playlist
    const playlist = await prisma.playlist.create({
      data: {
        userId: vxUser.id,
        title: "Music For The Future -vx9",
        visibility: "PUBLIC",
      },
    });

    // Add all tracks to the playlist
    const tracks = await prisma.track.findMany({
      where: { albumId: album.id },
      orderBy: { title: 'asc' }
    });

    for (let i = 0; i < tracks.length; i++) {
      await prisma.playlistTrack.create({
        data: {
          playlistId: playlist.id,
          trackId: tracks[i].id,
          orderIndex: i + 1,
        },
      });
    }

    console.log("✅ Created playlist with all tracks");

    // Create a welcome post
    await prisma.post.create({
      data: {
        userId: vxUser.id,
        text: "🎵 Music For The Future -vx9 is now live on TapTap Matrix! Experience the sound of tomorrow. 🚀✨",
        type: "TEXT",
        visibility: "PUBLIC",
      },
    });

    console.log("✅ Created welcome post");

    // Mark tracks as featured/free (using posts for now)
    console.log("💰 Marking content as featured and free...");

    await prisma.post.create({
      data: {
        userId: vxUser.id,
        text: "🎉 Music For The Future -vx9 is now the featured collection on TapTap Matrix! All tracks are FREE for everyone to enjoy. Experience the sound of tomorrow! 🚀✨ #MusicForTheFuture #Featured #Free",
        type: "TEXT",
        visibility: "PUBLIC",
      },
    });

    console.log("✅ Marked content as featured and free");

    console.log("\n🎉 Music For The Future -vx9 imported successfully!");
    console.log("📊 Summary:");
    console.log(`   - Artist: VX`);
    console.log(`   - Album: Music For The Future -vx9`);
    console.log(`   - Tracks: ${tracks.length}`);
    console.log(`   - Playlist: Music For The Future -vx9`);
    console.log(`   - Files copied to: ${uploadsDir}`);
    console.log("");
    console.log("🎵 Ready to stream your music!");

    return {
      artist: vxArtist,
      album: album,
      tracks: tracks,
      playlist: playlist
    };

  } catch (error) {
    console.error("❌ Error importing Music For The Future:", error);
    throw error;
  }
}

// Run the import
importMusicForTheFuture()
  .then((result) => {
    console.log("🚀 Import completed successfully!");
    console.log("🎵 Your music is ready to play in TapTap Matrix!");
  })
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
