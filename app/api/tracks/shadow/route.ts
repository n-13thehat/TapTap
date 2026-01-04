import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // For now, allow anonymous shadow track creation
    // TODO: Add proper authentication when auth is configured
    const userId = "anonymous";

    const body = await req.json();
    const { youtubeId, title, channelTitle, thumbnail, duration } = body;

    if (!youtubeId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if shadow track already exists
    const existingTrack = await prisma.track.findFirst({
      where: {
        storageKey: `youtube:${youtubeId}` // Use storageKey to store YouTube ID
      }
    });

    if (existingTrack) {
      return NextResponse.json({ 
        track: existingTrack,
        message: "Shadow track already exists"
      });
    }

    // Create or find artist for the channel
    let artist = await prisma.artist.findFirst({
      where: {
        stageName: {
          equals: channelTitle,
          mode: "insensitive"
        }
      }
    });

    if (!artist) {
      // TODO: Create a proper user for shadow artists
      // For now, skip creating shadow artists
      return NextResponse.json({
        error: "Cannot create shadow artist without user"
      }, { status: 400 });
    }

    // Create shadow track
    const shadowTrack = await prisma.track.create({
      data: {
        title: title,
        artistId: artist.id,
        storageKey: `youtube:${youtubeId}`, // Store YouTube ID in storageKey
        mimeType: "video/youtube",
        durationMs: duration ? parseInt(duration) * 1000 : null,
        meta: {
          youtube_id: youtubeId,
          thumbnail: thumbnail,
          channel: channelTitle,
          isShadow: true
        }
      },
      include: {
        artist: true
      }
    });

    return NextResponse.json({ 
      track: shadowTrack,
      message: "Shadow track created successfully"
    });

  } catch (error) {
    console.error('Shadow track creation error:', error);
    return NextResponse.json(
      { error: "Failed to create shadow track" }, 
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const youtubeId = searchParams.get("youtubeId");

    if (!youtubeId) {
      return NextResponse.json({ error: "Missing youtubeId" }, { status: 400 });
    }

    const shadowTrack = await prisma.track.findFirst({
      where: {
        storageKey: `youtube:${youtubeId}`
      },
      include: {
        artist: true
      }
    });

    if (!shadowTrack) {
      return NextResponse.json({ error: "Shadow track not found" }, { status: 404 });
    }

    return NextResponse.json({ track: shadowTrack });

  } catch (error) {
    console.error('Shadow track fetch error:', error);
    return NextResponse.json(
      { error: "Failed to fetch shadow track" }, 
      { status: 500 }
    );
  }
}
