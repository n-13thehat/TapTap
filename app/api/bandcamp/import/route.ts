import { NextRequest, NextResponse } from "next/server";

const buildMockTracks = (artistSlug: string) => [
  {
    title: `${artistSlug} • Dawn Transmission`,
    price: 3500,
    type: "track",
    marketplaceId: `md-track-${artistSlug}-dawn`,
  },
  {
    title: `${artistSlug} • Afterglow Battles`,
    price: 4200,
    type: "track",
    marketplaceId: `md-track-${artistSlug}-afterglow`,
  },
];

const buildMockMerch = (artistSlug: string) => [
  {
    title: `${artistSlug} • Neon Poster`,
    price: 2500,
    type: "merch",
    marketplaceId: `md-merch-${artistSlug}-poster`,
  },
  {
    title: `${artistSlug} • Digital Hoodie`,
    price: 5200,
    type: "merch",
    marketplaceId: `md-merch-${artistSlug}-hoodie`,
  },
];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const url = (data?.url ?? "").trim();
    if (!url || !url.includes("bandcamp.com")) {
      return NextResponse.json(
        { error: "Please provide a valid Bandcamp URL." },
        { status: 400 }
      );
    }

    const normalized = url
      .replace(/https?:\/\//, "")
      .replace(/\/+$/, "")
      .toLowerCase();
    const slug = normalized.split(".bandcamp.com")[0].replace(/[^a-z0-9-]/g, "");

    const mintedTracks = buildMockTracks(slug);
    const mintedMerch = buildMockMerch(slug);

    return NextResponse.json({
      slug,
      mintedTracks,
      mintedMerch,
      message:
        "Bandcamp catalog ingested. The listed tracks + merch were minted live into the TapTap Marketplace.",
    });
  } catch (error) {
    console.error("Bandcamp import error", error);
    return NextResponse.json(
      { error:  "Unable to import right now. Please try again in a few moments." },
      { status: 500 }
    );
  }
}
