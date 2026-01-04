import SurfPageClient from "./SurfPageClient";
import { dbListSurfPlaylists } from "@/lib/server/persistence";

export default async function SurfPage() {
  let initialPlaylists: { id: string; title: string }[] | undefined;
  try {
    const items = await dbListSurfPlaylists();
    initialPlaylists = items.map((p) => ({ id: p.id, title: p.title }));
  } catch {
    initialPlaylists = undefined;
  }

  return <SurfPageClient initialPlaylists={initialPlaylists} />;
}
