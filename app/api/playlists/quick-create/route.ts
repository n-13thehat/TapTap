import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trackId, name } = body;

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

    // For now, simulate playlist creation without authentication
    // TODO: Add proper user authentication and create actual playlist
    
    const playlistName = name || `Quick Playlist ${new Date().toLocaleDateString()}`;
    
    // Simulate playlist creation
    const mockPlaylist = {
      id: `playlist_${Date.now()}`,
      name: playlistName,
      tracks: [track],
      createdAt: new Date().toISOString()
    };

    console.log(`Quick playlist created: ${playlistName} with track: ${track.title}`);

    return NextResponse.json({ 
      success: true,
      message: "Quick playlist created successfully",
      playlist: mockPlaylist
    });

  } catch (error) {
    console.error('Quick playlist creation error:', error);
    return NextResponse.json(
      { error: "Failed to create quick playlist" }, 
      { status: 500 }
    );
  }
}
