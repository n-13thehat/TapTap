import { withCache } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

const FEATURED_ENDPOINT = "/api/home/featured"

function getAbsoluteUrl(path: string) {
  const baseUrl =
    (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
      /\/+$/,
      ""
    );
  return new URL(path, baseUrl).toString();
}

export async function loadFeaturedCounts(): Promise<Record<string, number>> {
  return withCache(
    'featured-counts',
    async () => {
      const direct = await getCountsDirect().catch(() => null);
      if (direct) return direct;

      try {
        const url = getAbsoluteUrl(FEATURED_ENDPOINT);
        const res = await fetch(url, {
          next: { revalidate: 60 },
          cache: 'force-cache'
        });

        if (!res.ok) return {};

        const payload = await res.json().catch(() => null);
        const counts = payload?.counts;
        if (counts && typeof counts === "object") {
          return counts as Record<string, number>;
        }
      } catch (err) {
        console.error("[home] failed to load featured counts", err);
      }
      return {};
    },
    30000 // 30 second cache
  );
}

async function getCountsDirect(): Promise<Record<string, number>> {
  try {
    const battleCount = await getBattleCount();
    const [posts, tracks, products, live, battles] = await Promise.all([
      prisma.post.count(),
      prisma.track.count(),
      prisma.product.count(),
      prisma.liveStream.count(),
      Promise.resolve(battleCount),
    ]);

    return {
      social: posts,
      library: tracks,
      marketplace: products,
      battles,
      live,
      surf: 0,
    };
  } catch {
    return {};
  }
}

async function getBattleCount() {
  const battleDelegate = (prisma as any).battleContent;
  if (!battleDelegate?.count) return 0;

  try {
    const existsResult = await prisma.$queryRaw<
      { exists: boolean }[]
    >`SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'BattleContent'
      ) as exists`;
    const exists = Boolean(existsResult?.[0]?.exists);
    if (!exists) return 0;
  } catch {
    return 0;
  }

  return battleDelegate.count().catch(() => 0);
}
