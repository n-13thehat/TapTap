import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trackId, playlistId } = body;

    if (!trackId) {
      return NextResponse.json({ error: "Missing trackId" }, { status: 400 });
    }

    // Check if track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: { artist: true }
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // For now, simulate adding to playlist without authentication
    // TODO: Add proper user authentication and playlist management
    
    if (playlistId) {
      // Add to specific playlist
      console.log(`Track ${track.title} added to playlist ${playlistId}`);
    } else {
      // Add to default/liked songs playlist
      console.log(`Track ${track.title} added to liked songs`);
    }

    return NextResponse.json({ 
      success: true,
      message: "Track added to playlist successfully",
      track: {
        id: track.id,
        title: track.title,
        artist: track.artist?.stageName
      },
      playlistId: playlistId || "liked_songs"
    });

  } catch (error) {
    console.error('Add track to playlist error:', error);
    return NextResponse.json(
      { error: "Failed to add track to playlist" }, 
      { status: 500 }
    );
  }
}
