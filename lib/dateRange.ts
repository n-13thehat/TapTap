export type Interval = "day" | "week" | "month";

export function parseRange(params: URLSearchParams) {
  const now = new Date();
  const to = params.get("to") ? new Date(params.get("to")!) : now;
  const from = params.get("from") ? new Date(params.get("from")!) : new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const interval = (params.get("interval") as Interval) || "day";
  return { from, to, interval };
}

export function bucketDates(from: Date, to: Date, interval: Interval): Date[] {
  const out: Date[] = [];
  const d = new Date(from.getTime());
  while (d <= to) {
    out.push(new Date(d.getTime()));
    if (interval === "day") d.setDate(d.getDate() + 1);
    else if (interval === "week") d.setDate(d.getDate() + 7);
    else if (interval === "month") d.setMonth(d.getMonth() + 1);
  }
  return out;
}

export function dateKey(d: Date, interval: Interval): string {
  if (interval === "day") return d.toISOString().slice(0, 10);
  if (interval === "week") return isoWeekStart(d).toISOString().slice(0, 10);
  const ym = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  return ym.toISOString().slice(0, 7);
}

function isoWeekStart(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7;
  if (day !== 1) x.setUTCDate(x.getUTCDate() - (day - 1));
  return x;
}

