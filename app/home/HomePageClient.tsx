"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MAIN_NAV, filterNav } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";
import HomeAuthPanel from "./HomeAuthPanel";

const FEATURED_KEYS = [
  "/trap",
  "/art",
  "/stemstation",
  "/battles",
  "/marketplace",
  "/live",
  "/library",
  "/social",
];



export default function HomePageClient() {
  const { user, isAuthenticated, isCreator, isAdmin } = useAuth();

  const featured = filterNav(MAIN_NAV, { isAuthenticated, isCreator, isAdmin })
    .filter((item) => FEATURED_KEYS.includes(item.href))
    .sort((a, b) => FEATURED_KEYS.indexOf(a.href) - FEATURED_KEYS.indexOf(b.href));

  const greetingName =
    (user as any)?.name || (user as any)?.username || (user as any)?.email?.split("@")[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-teal-400/60 bg-black/80 shadow-[0_0_28px_rgba(45,212,191,0.7)]">
          <Image
            src="/branding/tap-logo.png"
            alt="TapTap"
            width={40}
            height={40}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-200/90">
            TapTap Access
          </div>
          <div className="text-sm text-white/80">
            {isAuthenticated && greetingName
              ? `Welcome back, ${greetingName}.`
              : "Sign in, sign up, or jack in as guest."}
          </div>
        </div>
      </header>

      {!isAuthenticated && <HomeAuthPanel />}

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/80">
          {isAuthenticated ? "Jump back in" : "Explore the matrix"}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex h-full flex-col gap-2 rounded-2xl border border-teal-500/25 bg-black/60 p-4 transition hover:border-teal-300/60 hover:bg-black/80 hover:shadow-[0_0_24px_rgba(45,212,191,0.25)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-teal-500/15 p-2 ring-1 ring-teal-400/30">
                      <Icon className="h-4 w-4 text-teal-300" />
                    </div>
                    <div className="font-semibold text-white truncate">{item.label}</div>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-teal-500/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-teal-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-white/60">{item.description}</p>
                  )}
                  <div className="mt-auto flex items-center gap-1 text-[11px] text-teal-300/70 group-hover:text-teal-200">
                    Open <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

