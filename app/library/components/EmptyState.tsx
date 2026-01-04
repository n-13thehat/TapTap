import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action: {
    label: string;
    href: string;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-white/60">{description}</div>
      <Link
        href={action.href}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-teal-400/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-teal-200 hover:bg-teal-400/10"
      >
        {action.label}
        <ChevronRight className="h-3 w-3" />
      </Link>
    </section>
  );
}
