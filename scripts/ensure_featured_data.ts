import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

async function ensureUser(email: string, username: string) {
  let u = await prisma.user.findUnique({ where: { email } });
  if (!u) {
    u = await prisma.user.create({ data: { email, username, authUserId: crypto.randomUUID(), verified: 'VERIFIED' as any } });
  }
  return u;
}

async function ensureArtist(userId: string, stageName: string) {
  let a = await prisma.artist.findFirst({ where: { userId } });
  if (!a) a = await prisma.artist.create({ data: { userId, stageName } });
  return a;
}

async function main() {
  // Baseline users
  const aUser = await ensureUser('vx9-system@taptap.local', 'vx9-system');
  const bUser = await ensureUser('hope@taptap.local', 'hope');
  await ensureArtist(aUser.id, 'VX9');
  await ensureArtist(bUser.id, 'Hope');

  // Social posts
  const postCount = await prisma.post.count({ where: { deletedAt: null } });
  if (postCount === 0) {
    await prisma.post.createMany({ data: [
      { userId: aUser.id, text: 'Welcome to ZION' },
      { userId: bUser.id, text: 'Shipping day' },
    ]});
    console.log('Seeded posts');
  }

  // Tracks: prefer existing tracks (from starter album). If none, create a minimal one off.
  const trackCount = await prisma.track.count();
  if (trackCount === 0) {
    const artist = await ensureArtist(aUser.id, 'VX9');
    await prisma.track.create({ data: { artistId: artist.id, title: 'Ignite', visibility: 'PUBLIC' as any } });
    console.log('Seeded a track');
  }

  // Product
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.create({ data: { ownerId: aUser.id, title: 'ZION Tee', priceCents: 3500, currency: 'USD' as any, inventory: 100 } });
    console.log('Seeded a product');
  }

  // Battle
  const battleCount = await prisma.battle.count();
  if (battleCount === 0) {
    await prisma.battle.create({ data: { aUserId: aUser.id, bUserId: bUser.id } });
    console.log('Seeded a battle');
  }

  // Live stream (active)
  const liveCount = await prisma.liveStream.count({ where: { endedAt: null } });
  if (liveCount === 0) {
    await prisma.liveStream.create({ data: { creatorId: aUser.id, title: 'Live Now', startedAt: new Date(), visibility: 'PUBLIC' as any } });
    console.log('Seeded a live stream');
  }

  // Surf session
  const surfCount = await prisma.surfSession.count();
  if (surfCount === 0) {
    await prisma.surfSession.create({ data: { userId: aUser.id, youtubeVideoId: 'dQw4w9WgXcQ' } });
    console.log('Seeded a surf session');
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

