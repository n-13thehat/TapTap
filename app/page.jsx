import { loadFeaturedCounts } from "@/app/home/featuredCounts";
import LandingShell from "@/app/landing/LandingShell";

export const revalidate = 60;

export default async function HomePage() {
  const counts = await loadFeaturedCounts();
  return <LandingShell counts={counts} />;
}
