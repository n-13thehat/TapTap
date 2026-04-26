"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Database, Music, Waves, Download, Loader2, CheckCircle2, AlertCircle, Coins, RefreshCw, X, Check, Ticket, Copy, Trash2 } from "lucide-react";

type RunResult = { ok?: boolean; error?: string; [k: string]: any } | null;

type Payout = {
  id: string;
  source: string;
  sourceId: string;
  stageName: string;
  pendingTap: number;
  status: string;
  claimedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  claimedByUser: { id: string; username: string | null; email: string | null } | null;
};

type Invite = {
  id: string;
  code: string;
  claimedByUserId: string | null;
  claimedAt: string | null;
  createdAt: string;
  claimedBy: { id: string; username: string | null; email: string | null } | null;
};

async function postJson(url: string, body?: unknown): Promise<RunResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return (await res.json()) as RunResult;
  } catch (e: any) {
    return { error: e?.message || "Network error" };
  }
}

async function getJson<T = any>(url: string): Promise<T | { error: string }> {
  try {
    const res = await fetch(url);
    return (await res.json()) as T;
  } catch (e: any) {
    return { error: e?.message || "Network error" };
  }
}

const ACTIONS = [
  {
    key: "backfill",
    title: "Backfill Default Album",
    description: "Add the starter album to every existing user's library.",
    icon: Music,
    url: "/api/admin/backfill-default-album",
    color: "purple",
  },
  {
    key: "audioMeta",
    title: "Generate Audio Metadata",
    description: "Probe default-album tracks for duration and create placeholder waveforms.",
    icon: Database,
    url: "/api/admin/generate-audio-meta",
    color: "blue",
  },
  {
    key: "waveforms",
    title: "Queue Waveforms (External)",
    description: "POST tracks needing real waveforms to AUDIO_WAVEFORM_WEBHOOK_URL (or list-only if unset).",
    icon: Waves,
    url: "/api/admin/queue-waveforms?limit=50",
    color: "cyan",
  },
] as const;

const EXPORTS = [
  { label: "Waveforms queued (default album)", href: "/api/admin/export/waveforms-queued?limit=1000" },
  { label: "Audio metadata queued (all tracks)", href: "/api/admin/export/audio-meta-queued?limit=1000" },
  { label: "Audio meta errors (all tracks)", href: "/api/admin/export/generate-audio-meta-all-errors" },
  { label: "Audio meta errors (default album only)", href: "/api/admin/export/generate-audio-meta-errors" },
] as const;

export default function AdminToolsPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, RunResult>>({});
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutsError, setPayoutsError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesError, setInvitesError] = useState<string | null>(null);
  const [inviteCount, setInviteCount] = useState(5);
  const [creatingInvites, setCreatingInvites] = useState(false);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  const run = (key: string, url: string) => async () => {
    setRunning(key);
    const r = await postJson(url);
    setResults((prev) => ({ ...prev, [key]: r }));
    setRunning(null);
  };

  const loadPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    setPayoutsError(null);
    const r = (await getJson<{ ok?: boolean; payouts?: Payout[]; error?: string }>(
      "/api/admin/marketplace/payouts?status=PENDING_APPROVAL&limit=100",
    )) as { ok?: boolean; payouts?: Payout[]; error?: string };
    if (r.error) setPayoutsError(r.error);
    else setPayouts(r.payouts || []);
    setPayoutsLoading(false);
  }, []);

  const loadInvites = useCallback(async () => {
    setInvitesLoading(true);
    setInvitesError(null);
    const r = (await getJson<{ ok?: boolean; invites?: Invite[]; error?: string }>(
      "/api/admin/invites?status=all&limit=200",
    )) as { ok?: boolean; invites?: Invite[]; error?: string };
    if (r.error) setInvitesError(r.error);
    else setInvites(r.invites || []);
    setInvitesLoading(false);
  }, []);

  const createInvites = async () => {
    setCreatingInvites(true);
    const r = await postJson("/api/admin/invites", { count: inviteCount });
    setCreatingInvites(false);
    if (r && "error" in r && r.error) {
      window.alert(`Failed: ${r.error}`);
      return;
    }
    await loadInvites();
  };

  const revokeInvite = (id: string) => async () => {
    if (!window.confirm("Revoke this invite code?")) return;
    setRevokingInviteId(id);
    try {
      const res = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(`Failed: ${data?.error || res.statusText}`);
        return;
      }
      await loadInvites();
    } finally {
      setRevokingInviteId(null);
    }
  };

  useEffect(() => {
    loadPayouts();
    loadInvites();
  }, [loadPayouts, loadInvites]);

  const decide = (id: string, action: "approve" | "reject") => async () => {
    const note = action === "reject" ? window.prompt("Reason for rejection (optional):") || undefined : undefined;
    setActingId(id);
    const r = await postJson(`/api/admin/marketplace/payouts/${id}`, { action, note });
    setActingId(null);
    if (r && "error" in r && r.error) {
      window.alert(`Failed: ${r.error}`);
      return;
    }
    await loadPayouts();
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <div className="text-sm uppercase tracking-[0.2em] text-teal-200">TapTap Matrix</div>
          <h1 className="text-4xl font-bold text-white">System Tools</h1>
          <p className="text-white/60">Database operations, audio pipeline, and CSV exports.</p>
        </header>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Audio Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ACTIONS.map((a) => {
              const Icon = a.icon;
              const isRunning = running === a.key;
              const result = results[a.key];
              const ok = result && !("error" in result) && result.ok !== false;
              return (
                <div key={a.key} className={`rounded-xl border border-${a.color}-400/30 bg-${a.color}-400/5 p-4`}>
                  <div className={`mb-3 inline-flex rounded-lg bg-${a.color}-400/20 p-2 text-${a.color}-300`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">{a.title}</h3>
                  <p className="text-sm text-white/70 mb-3">{a.description}</p>
                  <button
                    onClick={run(a.key, a.url)}
                    disabled={isRunning}
                    className={`flex items-center gap-2 rounded-lg border border-${a.color}-400/40 bg-${a.color}-400/10 px-3 py-2 text-sm font-medium text-white hover:bg-${a.color}-400/20 disabled:opacity-50`}
                  >
                    {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {isRunning ? "Running..." : "Run"}
                  </button>
                  {result && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
                      <div className={`flex items-center gap-1 mb-1 ${ok ? "text-green-300" : "text-red-300"}`}>
                        {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {ok ? "Success" : "Error"}
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap text-white/70">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-300" />
              <h2 className="text-2xl font-bold text-white">Pending Royalty Payouts</h2>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-200">{payouts.length}</span>
            </div>
            <button
              onClick={loadPayouts}
              disabled={payoutsLoading}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
            >
              {payoutsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Refresh
            </button>
          </div>
          {payoutsError && (
            <div className="mb-3 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{payoutsError}</div>
          )}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-white/60">
                <tr>
                  <th className="px-3 py-2">Artist</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Claimant</th>
                  <th className="px-3 py-2 text-right">Pending TAP</th>
                  <th className="px-3 py-2">Submitted</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length === 0 && !payoutsLoading && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-white/50">No pending payouts.</td>
                  </tr>
                )}
                {payouts.map((p) => {
                  const acting = actingId === p.id;
                  return (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="px-3 py-2">
                        <div className="text-white">{p.stageName}</div>
                        <div className="text-xs text-white/40 font-mono">{p.sourceId}</div>
                      </td>
                      <td className="px-3 py-2 text-white/70">{p.source}</td>
                      <td className="px-3 py-2">
                        {p.claimedByUser ? (
                          <>
                            <div className="text-white">{p.claimedByUser.username || "—"}</div>
                            <div className="text-xs text-white/40">{p.claimedByUser.email}</div>
                          </>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-amber-200">{p.pendingTap.toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs text-white/60">{new Date(p.updatedAt).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={decide(p.id, "approve")}
                            disabled={acting}
                            className="flex items-center gap-1 rounded-lg border border-green-400/40 bg-green-400/10 px-2 py-1 text-xs font-medium text-green-200 hover:bg-green-400/20 disabled:opacity-50"
                          >
                            {acting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Approve
                          </button>
                          <button
                            onClick={decide(p.id, "reject")}
                            disabled={acting}
                            className="flex items-center gap-1 rounded-lg border border-red-400/40 bg-red-400/10 px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-400/20 disabled:opacity-50"
                          >
                            <X className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-teal-300" />
              <h2 className="text-2xl font-bold text-white">Beta Invites</h2>
              <span className="rounded-full bg-teal-400/20 px-2 py-0.5 text-xs text-teal-200">{invites.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={inviteCount}
                onChange={(e) => setInviteCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
              />
              <button
                onClick={createInvites}
                disabled={creatingInvites}
                className="flex items-center gap-2 rounded-lg border border-teal-400/40 bg-teal-400/10 px-3 py-1.5 text-sm text-teal-200 hover:bg-teal-400/20 disabled:opacity-50"
              >
                {creatingInvites ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ticket className="h-3 w-3" />}
                Generate
              </button>
              <button
                onClick={loadInvites}
                disabled={invitesLoading}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
              >
                {invitesLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Refresh
              </button>
            </div>
          </div>
          {invitesError && (
            <div className="mb-3 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{invitesError}</div>
          )}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-white/60">
                <tr>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Claimed by</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.length === 0 && !invitesLoading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-white/50">No invites yet. Generate some above.</td>
                  </tr>
                )}
                {invites.map((inv) => {
                  const claimed = !!inv.claimedByUserId;
                  const revoking = revokingInviteId === inv.id;
                  return (
                    <tr key={inv.id} className="border-t border-white/5">
                      <td className="px-3 py-2 font-mono text-teal-200">{inv.code}</td>
                      <td className="px-3 py-2">
                        {claimed ? (
                          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-200">Claimed</span>
                        ) : (
                          <span className="rounded-full bg-teal-400/20 px-2 py-0.5 text-xs text-teal-200">Available</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {inv.claimedBy ? (
                          <>
                            <div className="text-white">{inv.claimedBy.username || "—"}</div>
                            <div className="text-xs text-white/40">{inv.claimedBy.email}</div>
                          </>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-white/60">{new Date(inv.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigator.clipboard?.writeText(inv.code)}
                            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </button>
                          {!claimed && (
                            <button
                              onClick={revokeInvite(inv.id)}
                              disabled={revoking}
                              className="flex items-center gap-1 rounded-lg border border-red-400/40 bg-red-400/10 px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-400/20 disabled:opacity-50"
                            >
                              {revoking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">CSV Exports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXPORTS.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:border-teal-400/40 hover:bg-teal-400/5 transition-colors"
              >
                <div className="rounded-lg bg-teal-400/20 p-2 text-teal-300">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{e.label}</div>
                  <div className="text-xs text-white/50 font-mono">{e.href}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
