"use client";
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export function SummaryLineChart({ series }: { series: { buckets: string[]; grossVolume: string[]; taxCollected: string[]; toTreasury: string[]; burned: string[] } }) {
  const data = series.buckets.map((b, i) => ({
    bucket: b,
    gross: Number(series.grossVolume[i] || 0),
    tax: Number(series.taxCollected[i] || 0),
    treasury: Number(series.toTreasury[i] || 0),
    burn: Number(series.burned[i] || 0),
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="bucket" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="gross" stroke="#4ade80" strokeWidth={2} />
          <Line type="monotone" dataKey="tax" stroke="#60a5fa" strokeWidth={2} />
          <Line type="monotone" dataKey="treasury" stroke="#fbbf24" strokeWidth={2} />
          <Line type="monotone" dataKey="burn" stroke="#f87171" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TypesBarChart({ data }: { data: Array<{ type: string; count: number }> }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#60a5fa" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BurnLineChart({ data }: { data: Array<{ bucket: string; burn: number }> }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="bucket" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="burn" stroke="#f87171" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
