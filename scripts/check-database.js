import { prisma } from '../lib/prisma.js';

async function checkDatabase() {
  console.log("🔍 Checking database contents...");
  
  try {
    // Check tracks
    const tracks = await prisma.track.findMany({
      include: {
        artist: {
          include: {
            user: true
          }
        },
        album: true
      }
    });
    
    console.log(`📊 Found ${tracks.length} tracks in database:`);
    tracks.forEach(track => {
      console.log(`   🎵 "${track.title}" by ${track.artist.stageName} (${track.storageKey})`);
    });
    
    // Check users
    const users = await prisma.user.findMany();
    console.log(`👥 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   👤 ${user.username} (${user.email})`);
    });
    
    // Check artists
    const artists = await prisma.artist.findMany();
    console.log(`🎤 Found ${artists.length} artists:`);
    artists.forEach(artist => {
      console.log(`   🎤 ${artist.stageName}`);
    });
    
    // Check albums
    const albums = await prisma.album.findMany();
    console.log(`📀 Found ${albums.length} albums:`);
    albums.forEach(album => {
      console.log(`   📀 ${album.title}`);
    });
    
    // Check playlists
    const playlists = await prisma.playlist.findMany({
      include: {
        tracks: true
      }
    });
    console.log(`📋 Found ${playlists.length} playlists:`);
    playlists.forEach(playlist => {
      console.log(`   📋 ${playlist.title} (${playlist.tracks.length} tracks)`);
    });
    
  } catch (error) {
    console.error("❌ Database check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
