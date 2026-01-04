import { PrismaClient, Role } from '@prisma/client'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Helper to detect columns in live DB (to handle legacy schemas)
  const hasColumn = async (table: string, column: string) => {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 1 FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema') AND table_name = $1 AND column_name = $2 LIMIT 1`,
      table,
      column
    )
    return rows.length > 0
  }

  const userHasEmail = await hasColumn('User', 'email')
  const userHasEmailLegacy = await hasColumn('User', 'email_legacy')
  const userHasUsername = await hasColumn('User', 'username')
  const userHasAuthUserId = await hasColumn('User', 'authUserId')
  const userHasHashedPassword = await hasColumn('User', 'hashedPassword')
  const userHasBirthday = await hasColumn('User', 'birthday')

  // Primary creator (acts like "Tom" on MySpace)
  const vxPassword = await bcrypt.hash('N13thehat', 10)

  // Create/find users (ensure Vx9 is the first/anchor account)
  const users = [
    { username: 'vx9', email: 'vx9@taptap.local', name: 'Jah Asiel', role: Role.CREATOR, hashedPassword: vxPassword, birthday: new Date('1998-01-21') },
    { username: 'vx', email: 'vx@taptap.local', name: 'VX', role: Role.CREATOR },
    { username: 'muse_bot', email: 'muse@taptap.local', name: 'Muse Bot', role: Role.CREATOR },
    { username: 'hope_bot', email: 'hope@taptap.local', name: 'Hope Bot', role: Role.LISTENER },
  ]

  const createdUsers = [] as Array<{ id: string; username: string }>
  for (const u of users) {
    // Try to find existing by email/email_legacy
    let selectCol = userHasEmail ? 'email' : (userHasEmailLegacy ? 'email_legacy' : null)
    let idRow: any[] = []
    if (selectCol) {
      idRow = await prisma.$queryRawUnsafe<any[]>(`SELECT "id" FROM "User" WHERE "${selectCol}" = $1 LIMIT 1`, u.email)
    }
    let userId = idRow.length ? idRow[0].id as string : randomUUID()
    if (!idRow.length) {
      const cols: string[] = ['id']
      const vals: any[] = [userId]
      if (userHasEmail) { cols.push('email'); vals.push(u.email) }
      if (userHasEmailLegacy) { cols.push('email_legacy'); vals.push(u.email) }
      if (userHasHashedPassword && u.hashedPassword) { cols.push('hashedPassword'); vals.push(u.hashedPassword) }
      if (userHasBirthday && u.birthday) { cols.push('birthday'); vals.push(u.birthday) }
      cols.push('createdAt') ; vals.push(new Date())
      await prisma.$executeRawUnsafe(
        `INSERT INTO "User" (${cols.map(c=>`"${c}"`).join(',')}) VALUES (${cols.map((_,i)=>`$${i+1}`).join(',')})`,
        ...vals
      )
      // optional profile table
      try {
        await prisma.$executeRawUnsafe(`INSERT INTO "Profile" ("id","userId","displayName","createdAt") VALUES ($1,$2,$3,now())`, randomUUID(), userId, u.name)
      } catch {}
    }
    // Update username/authUserId if present
    if (userHasUsername) await prisma.$executeRawUnsafe(`UPDATE "User" SET "username"=$1 WHERE "id"=$2`, u.username, userId)
    if (userHasAuthUserId) await prisma.$executeRawUnsafe(`UPDATE "User" SET "authUserId"=$1 WHERE "id"=$2`, randomUUID(), userId)
    createdUsers.push({ id: userId, username: u.username })
  }

  // Create 2 artists (link to first two users)
  const [uPrimary, uAlt] = createdUsers
  const artists: Array<{ id: string }> = []
  const artistTableExists = (await prisma.$queryRawUnsafe<any[]>(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Artist'`
  )).length > 0
  if (artistTableExists) {
    try {
      const a1 = await prisma.artist.upsert({
        where: { userId: uPrimary.id },
        update: { stageName: 'Vx9' },
        create: { id: randomUUID(), userId: uPrimary.id, stageName: 'Vx9' },
      })
      const a2 = await prisma.artist.upsert({
        where: { userId: uAlt.id },
        update: { stageName: 'VX' },
        create: { id: randomUUID(), userId: uAlt.id, stageName: 'VX' },
      })
      artists.push({ id: a1.id }, { id: a2.id })
    } catch {}
  }

  // Create 3 demo tracks (2 for first artist, 1 for second)
  const trackTableExists = (await prisma.$queryRawUnsafe<any[]>(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Track'`
  )).length > 0
  if (trackTableExists && artists.length >= 2) {
    try {
      await prisma.track.createMany({
        data: [
          { id: randomUUID(), artistId: artists[0].id, title: 'Neon Dreams' },
          { id: randomUUID(), artistId: artists[0].id, title: 'Bytewave' },
          { id: randomUUID(), artistId: artists[1].id, title: 'Muse Rising' },
        ] as any,
        skipDuplicates: true,
      })
    } catch {}
  }

  // Create 5 social posts from vx
  const posts: { id: string }[] = []
  for (let i=0;i<5;i++) {
    const pid = randomUUID()
    posts.push({ id: pid })
    // Insert into Post using legacy columns if needed
    try {
      await prisma.$executeRawUnsafe(`INSERT INTO "Post" ("id","authorId","content","createdAt") VALUES ($1,$2,$3,now()) ON CONFLICT DO NOTHING`, pid, uPrimary.id, `Hello Matrix ${i+1}`)
    } catch {
      try {
        await prisma.$executeRawUnsafe(`INSERT INTO "Post" ("id","userId","text","createdAt") VALUES ($1,$2,$3,now()) ON CONFLICT DO NOTHING`, pid, uPrimary.id, `Hello Matrix ${i+1}`)
      } catch {}
    }
  }

  // Make Vx9 "Tom": everyone follows and is followed by Vx9
  const followPairs: Array<{ followerId: string; followeeId: string }> = []
  const anchorId = uPrimary.id
  const others = createdUsers.filter((u) => u.id !== anchorId).map((u) => u.id)
  for (const other of others) {
    followPairs.push({ followerId: anchorId, followeeId: other })
    followPairs.push({ followerId: other, followeeId: anchorId })
  }
  for (const f of followPairs) {
    try {
      await prisma.$executeRawUnsafe(
        'INSERT INTO "Follow" ("id","followerId","followeeId","createdAt") VALUES ($1,$2,$3,now()) ON CONFLICT DO NOTHING',
        randomUUID(), f.followerId, f.followeeId
      )
    } catch {
      try {
        await prisma.$executeRawUnsafe(
          'INSERT INTO "Follow" ("id","followerId","followingId","createdAt") VALUES ($1,$2,$3,now()) ON CONFLICT DO NOTHING',
          randomUUID(), f.followerId, f.followeeId
        )
      } catch {}
    }
  }

  // 10 likes on the newest post by rotating users
  // Simulate 10 likes by incrementing Post.likes on rotating posts
  for (let i = 0; i < 10; i++) {
    const pid = posts[i % posts.length]?.id
    if (pid) {
      await prisma.$executeRawUnsafe(`UPDATE "Post" SET "likes" = COALESCE("likes",0) + 1 WHERE "id"=$1`, pid)
    }
  }

  console.log('Seed complete: users, artists, tracks, posts, follows, likes.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
