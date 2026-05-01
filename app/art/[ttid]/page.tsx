import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ ttid: string }> };

async function loadArt(ttid: string) {
  const chip = await prisma.encodedChip.findUnique({
    where: { ttid },
    select: { status: true, visualArt: true },
  });
  if (!chip || !chip.visualArt) return null;
  return { piece: chip.visualArt, chipStatus: chip.status };
}

export default async function VisualArtUnlockPage({ params }: PageProps) {
  const { ttid } = await params;
  const data = await loadArt(ttid);
  if (!data) return notFound();
  const { piece } = data;

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <div className="text-xs uppercase tracking-[0.3em] text-emerald-300">Visual Art · Unlocked</div>
          <h1 className="mt-2 text-4xl font-bold">{piece.title}</h1>
          {piece.description ? (
            <p className="mt-2 text-white/70">{piece.description}</p>
          ) : null}
          <div className="mt-2 text-[11px] font-mono text-white/40">{ttid}</div>
        </header>

        {piece.imageUrl ? (
          <img
            src={piece.imageUrl}
            alt={piece.title}
            className="w-full rounded-xl border border-white/10"
          />
        ) : null}

        {piece.videoUrl ? (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <video src={piece.videoUrl} controls className="w-full" />
          </div>
        ) : null}

        {piece.process ? (
          <Section title="Process">{piece.process}</Section>
        ) : null}
        {piece.story ? (
          <Section title="Story">{piece.story}</Section>
        ) : null}
        {piece.meaning ? (
          <Section title="Meaning">{piece.meaning}</Section>
        ) : null}

        <footer className="pt-6 border-t border-white/10 text-xs text-white/40">
          Tap timestamp recorded · This NFC interaction has been logged for the artist.
        </footer>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-sm uppercase tracking-[0.2em] text-emerald-200 mb-2">{title}</h2>
      <div className="whitespace-pre-wrap text-white/85 leading-relaxed">{children}</div>
    </section>
  );
}
