"use client";
import React from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 text-sm font-semibold text-teal-300">{title}</div>
      {children}
    </div>
  );
}

async function fetchJSON(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error || res.statusText);
  return j;
}

export default function WalletPanel() {
  const [wallets, setWallets] = React.useState<Array<{ id: string; address: string; type: 'custodial' | 'external' }>>([]);
  const [selectedAddress, setSelectedAddress] = React.useState<string>("");
  const [balances, setBalances] = React.useState<Record<string, { sol: number; tap: number }> | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [venmoUrl, setVenmoUrl] = React.useState<string | null>(null);
  const [priceUSD, setPriceUSD] = React.useState<number>(0);
  const [toast, setToast] = React.useState<string>("");
  const [auto, setAuto] = React.useState<boolean>(false);
  const [tapUSD, setTapUSD] = React.useState<number>(0);
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const list = await fetchJSON('/api/wallet/solana/list');
      const arr: Array<{ id: string; address: string; type: 'custodial' | 'external' }> = list.wallets || [];
      setWallets(arr);
      if (!selectedAddress && arr.length) setSelectedAddress(arr[0].address);
      const out: Record<string, { sol: number; tap: number }> = {} as any;
      for (const w of arr) {
        const b = await fetchJSON(`/api/wallet/solana/balance?address=${encodeURIComponent(w.address)}`);
        out[w.address] = { sol: Number(b.sol || 0), tap: Number(b.tap || 0) };
      }
      setBalances(out);
      setLastUpdated(Date.now());
    } catch (e) {
      console.error(e);
    }
  }, [selectedAddress]);

  React.useEffect(() => { refresh(); }, [refresh]);
  React.useEffect(() => {
    (async () => {
      try { const p = await fetchJSON('/api/market/solprice'); setPriceUSD(Number(p.usd || 0)); } catch {}
      try { const t = await fetchJSON('/api/market/tapprice'); setTapUSD(Number(t.usd || 0)); } catch {}
    })();
  }, []);
  React.useEffect(() => {
    let t: any;
    if (auto) {
      t = setInterval(() => { refresh().catch(() => {}); }, 10000);
    }
    return () => { if (t) clearInterval(t); };
  }, [auto, refresh]);

  async function ensureCustodial() {
    try {
      setBusy('ensure');
      await fetchJSON('/api/wallet/solana/ensure', { method: 'POST' });
      await refresh();
      setToast('Custodial wallet ensured and seeded'); setTimeout(() => setToast(''), 1500);
    } catch (e) { alert((e as any)?.message || String(e)); } finally { setBusy(null); }
  }

  async function connectPhantom() {
    try {
      // @ts-ignore
      const provider = (window as any).solana;
      if (!provider?.isPhantom) throw new Error('Phantom not found. Install Phantom extension.');
      const resp = await provider.connect();
      const pk = resp?.publicKey?.toString?.() || resp?.publicKey;
      if (!pk) throw new Error('Failed to read Phantom pubkey');
      await fetchJSON('/api/wallet/solana/connect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: pk }) });
      await refresh();
      setToast('Phantom connected'); setTimeout(() => setToast(''), 1500);
    } catch (e) { alert((e as any)?.message || String(e)); }
  }

  async function connectSolflare() {
    try {
      // @ts-ignore
      const provider = (window as any).solflare;
      if (!provider) throw new Error('Solflare not found. Install Solflare extension.');
      const resp = await provider.connect();
      const pk = resp?.publicKey?.toString?.() || provider?.publicKey?.toString?.();
      if (!pk) throw new Error('Failed to read Solflare pubkey');
      await fetchJSON('/api/wallet/solana/connect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: pk }) });
      await refresh();
      setToast('Solflare connected'); setTimeout(() => setToast(''), 1500);
    } catch (e) { alert((e as any)?.message || String(e)); }
  }

  async function cashOut() {
    try {
      const amtStr = prompt('Enter amount to cash out (USD cents):', '500');
      if (!amtStr) return;
      const totalCents = Math.max(0, Math.floor(Number(amtStr)));
      const res = await fetchJSON('/api/payments/venmo/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ totalCents, items: { reason: 'Cashout SOL->USD via Venmo' } }) });
      const url = res.approvalUrl || null;
      setVenmoUrl(url);
      if (url) window.open(url, '_blank');
      else alert('Approval URL not available. Configure PAYPAL envs or use fallback.');
    } catch (e) { alert((e as any)?.message || String(e)); }
  }

  async function swapSim() {
    try {
      if (wallets.length === 0) return alert('No wallet available');
      const preferred = wallets[0];
      const amtStr = prompt('Enter TAP amount to swap (simulated):', '25');
      if (!amtStr) return;
      const tapAmt = Math.max(0, Number(amtStr));
      const q = await fetchJSON(`/api/swap/quote?tap=${tapAmt}`);
      const ok = confirm(`Swap ${tapAmt} TAP -> ~${q.solOut.toFixed(6)} SOL (≈ $${q.usd.toFixed(2)}) on ${preferred.type} wallet?`);
      if (!ok) return;
      const ex = await fetchJSON('/api/swap/execute', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: preferred.address, tap: tapAmt }) });
      setToast(`Simulated swap: ${tapAmt} TAP -> ~${(ex.entry?.solOut || q.solOut).toFixed(6)} SOL`);
      setTimeout(() => setToast(''), 1500);
      await refresh();
    } catch (e) { alert((e as any)?.message || String(e)); }
  }

  return (
    <div className="space-y-4">
      <Section title="Wallets">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button onClick={ensureCustodial} disabled={busy==='ensure'} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50">Ensure Custodial + 100 TAP</button>
          <button onClick={connectPhantom} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Connect Phantom</button>
          <button onClick={connectSolflare} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Connect Solflare</button>
          <button onClick={cashOut} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Cash Out via Venmo</button>
          <button onClick={swapSim} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Swap TAP→SOL (Sim)</button>
          <button onClick={() => { setBusy('refresh'); refresh().finally(() => setBusy(null)); }} disabled={busy==='refresh'} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50">Refresh</button>
          <label className="flex items-center gap-2 text-xs text-white/70 ml-2">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-refresh
          </label>
          {wallets.length > 0 && (
            <label className="ml-auto flex items-center gap-2 text-xs text-white/70">
              <span>Swap wallet</span>
              <select value={selectedAddress} onChange={(e)=>setSelectedAddress(e.target.value)} className="rounded-md border border-white/10 bg-black/40 px-2 py-1">
                {wallets.map((w)=> (
                  <option key={w.address} value={w.address}>{w.address.slice(0,4)}...{w.address.slice(-4)} ({w.type})</option>
                ))}
              </select>
            </label>
          )}
          {lastUpdated && <span className="ml-3 text-xs text-white/50">Last updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
        </div>
        {wallets.length === 0 ? (
          <div className="text-sm text-white/70">No wallets yet. Ensure a custodial wallet or connect Phantom/Solflare.</div>
        ) : (
          <div className="space-y-2 text-sm">
            {wallets.map((w) => {
              const a = w.address;
              const sol = balances?.[a]?.sol ?? 0;
              const tap = balances?.[a]?.tap ?? 0;
              const usd = priceUSD ? (sol * priceUSD) : 0;
              const tapUsd = tapUSD ? (tap * tapUSD) : 0;
              return (
                <div key={a} className="rounded-md border border-white/10 bg-black/40 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-white/80 break-all">{a}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`rounded-md px-2 py-0.5 ${w.type==='custodial' ? 'bg-teal-600 text-black' : 'bg-white/10 text-white/80'}`}>{w.type}</span>
                      <button className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 hover:bg-white/10" onClick={async ()=>{ try{ await navigator.clipboard.writeText(a); setToast('Address copied'); setTimeout(()=>setToast(''),1200);}catch{}}}>Copy</button>
                    </div>
                  </div>
                  <div className="text-white/60 text-xs mt-1">
                    SOL: {sol.toFixed(6)}{priceUSD ? ` (≈ $${usd.toFixed(2)})` : ''} • TAP: {tap}{tapUSD ? ` (≈ $${tapUsd.toFixed(2)})` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {(venmoUrl || toast) && (
          <div className="mt-2 text-xs text-white/80">{toast || 'Venmo approval opened in a new tab.'}</div>
        )}
      </Section>

      <Section title="Recent Simulated Swaps">
        <SwapsList />
      </Section>
    </div>
  );
}

function SwapsList() {
  const [items, setItems] = React.useState<Array<{ ts: string; address: string; tap: number; solOut: number; usd: number }>>([]);
  React.useEffect(() => { (async () => { try { const j = await fetch('/api/swap/history').then(r=>r.json()); setItems(Array.isArray(j.history)? j.history : []); } catch {} })(); }, []);
  if (!items.length) return <div className="text-sm text-white/60">No simulated swaps yet.</div>;
  return (
    <div className="space-y-2 text-xs text-white/80">
      {items.map((it, idx) => (
        <div key={idx} className="rounded-md border border-white/10 bg-black/40 p-2">
          <div className="flex items-center justify-between">
            <div>{new Date(it.ts).toLocaleString()}</div>
            <div className="text-white/60">TAP {it.tap}  ? ~{it.solOut.toFixed(6)} SOL (≈ ${it.usd.toFixed(2)})</div>
          </div>
          <div className="text-white/50 break-all">{it.address}</div>
        </div>
      ))}
    </div>
  );
}



