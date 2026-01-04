import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storageKey: string }> }
) {
  try {
    const { storageKey } = await params;
    
    if (!storageKey) {
      return new NextResponse('Storage key required', { status: 400 });
    }

    // Decode the storage key
    const decodedStorageKey = decodeURIComponent(storageKey);

    // Find the track in database
    const track = await prisma.track.findFirst({
      where: {
        storageKey: decodedStorageKey
      }
    });

    if (!track) {
      return new NextResponse('Track not found', { status: 404 });
    }

    // For now, we'll serve from a local uploads directory
    // In production, this would stream from your cloud storage (S3, etc.)
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, decodedStorageKey);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // If file doesn't exist locally, return a placeholder or error
      console.warn(`Audio file not found: ${filePath}`);
      
      // For demo purposes, return a test audio URL or generate a tone
      return NextResponse.redirect('/audio/demo-track.mp3');
    }

    // Get file stats for content length
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Handle range requests for audio streaming
    const range = request.headers.get('range');
    
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      // Create read stream for the requested range
      const stream = fs.createReadStream(filePath, { start, end });

      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': track.mimeType || 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } else {
      // Serve entire file
      const stream = fs.createReadStream(filePath);

      return new NextResponse(stream as any, {
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': track.mimeType || 'audio/mpeg',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }
  } catch (error) {
    console.error('Error streaming audio:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Handle HEAD requests for audio metadata
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ storageKey: string }> }
) {
  try {
    const { storageKey } = await params;
    
    if (!storageKey) {
      return new NextResponse(null, { status: 400 });
    }

    const decodedStorageKey = decodeURIComponent(storageKey);

    // Find the track in database
    const track = await prisma.track.findFirst({
      where: {
        storageKey: decodedStorageKey
      }
    });

    if (!track) {
      return new NextResponse(null, { status: 404 });
    }

    // Check if file exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, decodedStorageKey);

    if (!fs.existsSync(filePath)) {
      return new NextResponse(null, { status: 404 });
    }

    const stats = fs.statSync(filePath);

    return new NextResponse(null, {
      headers: {
        'Content-Length': stats.size.toString(),
        'Content-Type': track.mimeType || 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error getting audio metadata:', error);
    return new NextResponse(null, { status: 500 });
  }
}
