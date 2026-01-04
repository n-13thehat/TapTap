"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LegacyBlocks() {
  const blocks = [
    { title: "Legacy Feed", desc: "Classic social cards and layout." },
    { title: "Legacy Tabs", desc: "Old tabbed UI showcase." },
    { title: "Legacy Dialogs", desc: "Example dialogs and drawers." },
  ];
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-teal-300">Legacy UI Showcase</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {blocks.map((b) => (
          <Card key={b.title} className="bg-black/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">{b.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 text-sm">{b.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

