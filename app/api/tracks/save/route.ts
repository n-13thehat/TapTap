import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trackId } = body;

    if (!trackId) {
      return NextResponse.json({ error: "Missing trackId" }, { status: 400 });
    }

    // For now, we'll simulate saving without authentication
    // TODO: Add proper user authentication and save to user's saved tracks
    
    // Check if track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: { artist: true }
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Simulate saving (in a real implementation, this would save to user's library)
    console.log(`Track saved: ${track.title} by ${track.artist?.stageName}`);

    return NextResponse.json({ 
      success: true,
      message: "Track saved successfully",
      track: {
        id: track.id,
        title: track.title,
        artist: track.artist?.stageName
      }
    });

  } catch (error) {
    console.error('Save track error:', error);
    return NextResponse.json(
      { error: "Failed to save track" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get("trackId");

    if (!trackId) {
      return NextResponse.json({ error: "Missing trackId" }, { status: 400 });
    }

    // Simulate unsaving
    console.log(`Track unsaved: ${trackId}`);

    return NextResponse.json({ 
      success: true,
      message: "Track unsaved successfully"
    });

  } catch (error) {
    console.error('Unsave track error:', error);
    return NextResponse.json(
      { error: "Failed to unsave track" }, 
      { status: 500 }
    );
  }
}
