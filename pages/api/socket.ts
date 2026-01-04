// Next.js Node handler for Socket.IO (lazy-initialized)
import type { NextApiRequest, NextApiResponse } from 'next'

type ResAny = NextApiResponse & { socket: any }

// Dynamic imports for Socket.IO
let SocketIOServer: any = null;
let instrumentFunction: any = null;

async function loadSocketIO() {
  if (!SocketIOServer) {
    try {
      const { Server } = await import('socket.io');
      SocketIOServer = Server;
    } catch (error) {
      console.warn('Socket.IO not available:', error);
      return null;
    }
  }
  return SocketIOServer;
}

async function loadInstrument() {
  if (!instrumentFunction) {
    try {
      const { instrument } = await import('@socket.io/admin-ui');
      instrumentFunction = instrument;
    } catch (error) {
      // Admin UI is optional
      instrumentFunction = () => {};
    }
  }
  return instrumentFunction;
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: ResAny) {
  // If Socket.IO already set up, just end
  // Attach only once to the underlying HTTP server
  if (!res.socket.server) {
    res.status(200).json({ ok: true, enabled: false, error: 'No server socket' })
    return
  }

  // @ts-ignore
  if (!res.socket.server.io) {
    try {
      // Load Socket.IO dynamically
      const Server = await loadSocketIO();
      if (!Server) {
        res.status(200).json({ ok: true, enabled: false, error: 'Socket.IO not available' })
        return
      }

      const instrument = await loadInstrument();

      const io = new Server(res.socket.server, {
        path: '/api/socket',
        cors: {
          origin: process.env.NODE_ENV === 'development' ? '*' : false,
          credentials: true
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true
      })

      io.on('connection', (socket: any) => {
        console.log('Socket.IO client connected:', socket.id);

        socket.on('identify', (payload: any) => {
          const user = payload?.user || ''
          console.log('User identified:', user);

          if (String(user).toLowerCase() === 'vx') {
            const demo = [
              { title: 'Welcome to TapTap ZION', body: 'VX, your matrix is live.' },
              { title: 'New Follower', body: 'Muse Bot started following you.' },
              { title: 'Battle Invite', body: 'Hope Bot challenged you to a duel.' },
            ]
            for (const n of demo) {
              socket.emit('notification', n)
            }
          }
        })

        socket.on('disconnect', (reason: string) => {
          console.log('Socket.IO client disconnected:', socket.id, reason);
        })

        socket.on('error', (error: any) => {
          console.error('Socket.IO error:', error);
        })
      })

      // Optional dev instrument (only in development)
      if (process.env.NODE_ENV === 'development') {
        try {
          instrument(io, { auth: false, mode: 'development' })
        } catch (error) {
          console.warn('Socket.IO admin UI not available:', error);
        }
      }

      // @ts-ignore
      res.socket.server.io = io
      console.log('Socket.IO server initialized');
    } catch (e: any) {
      console.error('Socket.IO initialization error:', e);
      res.status(200).json({ ok: true, enabled: false, error: 'Socket.IO initialization failed' })
      return
    }
  }

  res.status(200).json({ ok: true, enabled: true })
}
